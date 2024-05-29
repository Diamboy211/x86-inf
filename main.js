import { assemble } from "./compiler.js";
import { VM, disassemble } from "./vm.js";
import { number_to_reg, flags } from "./constant.js";

let assembled_code = null;
let vm = new VM();
window.vm = vm;

function compile()
{
  let value = document.getElementById("editor").value;
  localStorage.setItem("code", value);
  let code = value.toLowerCase().split('\n');
  
  for (let i = 0; i < code.length; i++)
  {
    // remove comments
    let comment_start = code[i].indexOf(';');
    if (comment_start != -1)
      code[i] = code[i].slice(0, comment_start);
    // trim whitespace
    code[i] = code[i].trim();
  }
  let code2 = [];
  // remove empty code lines
  for (let i = 0; i < code.length; i++)
    if (code[i].length) code2.push({ line: i+1, str: code[i] });
  
  code = code2;
  // simplify whitespace
  for (let i = 0; i < code.length; i++)
  {
    // surround non-letter characters with spaces
    code[i].str = code[i].str.replace(/[^a-z0-9_]/g, ` $& `)
    // simplify consecutive whitespaces to a single space
      .replace(/\s+/g, ' ')
      .trim().split(' ');
  }
  
  let res = assemble(code);
  let log = "";
  if (res.errors) log += res.errors.join('\n');
  if (res.code)
  {
    log += `assembled successfully. binary size: ${res.code.length} byte${res.code.length != 1 ? 's' : ''}\n`;
    assembled_code = res.code;
  }
  document.getElementById("log").textContent = log;
}

function update_vm()
{
  let hex = n => n < 0n ? `-${hex(-n)}` : `${n>15n ? hex(n>>4n) : ''}${['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'][n&15n]}`;
  let s = "";
  // registers
  for (let i = 0; i < 16; i++) s = `${s}${number_to_reg[i+1]}: ${hex(vm.registers[i])}\n`;
  s = `${s}wip: ${hex(vm.ip)}\n`;
  s = `${s}ZF: ${+!!(vm.flags & flags.Z)}\n`;
  s = `${s}SF: ${+!!(vm.flags & flags.S)}\n`;
  s = `${s}DF: ${+!!(vm.flags & flags.D)}\n`;
  s = `${s}timestamp: ${vm.t}\n`;
  document.getElementById("registers").textContent = s;

  // memory
  let page = BigInt(document.getElementById("memory-page").value);
  s = "";
  for (let i = page * 32n; i < (page+1n) * 32n; i++)
    s = `${s}0x${hex(i)}: ${hex(vm.data.read(i))}\n`;
  document.getElementById("memory").textContent = s;

  // stack
  page = BigInt(document.getElementById("stack-page").value);
  s = "";
  for (let i = page * 32n; i < (page+1n) * 32n; i++)
    s = `${s}${hex(-1n-i)}: ${hex(vm.stack.read(i))}\n`;
  document.getElementById("stack").textContent = s;
  
  let dis = disassemble(vm.code, vm.ip, 32);
  if (dis[0]) dis[0] = `>>> ${dis[0]}`;
  s = dis.join('\n');
  document.getElementById("disassembly").textContent = s;
}

function reset()
{
  vm.set_code(assembled_code);
  vm.reset();
  update_vm();
  document.getElementById("vm-log").textContent = "";
}

function step()
{
  try
  {
    vm.step();
    update_vm();
  }
  catch (e)
  {
    document.getElementById("vm-log").textContent = `trapped. reason: ${e}`;
  }
}

function skip()
{
  try
  {
    vm.skip();
    update_vm();
  }
  catch (e)
  {
    document.getElementById("vm-log").textContent = `trapped. reason: ${e}`;
  }
}

function dump()
{
  navigator.clipboard.writeText(vm.dump());
}

function rom()
{
  if (!assembled_code) return;
  let a = document.createElement("a");
  a.href = "data:application/octet-stream;base64,".concat(btoa(Array(...assembled_code).map(e=>String.fromCharCode(e)).join('')));
  a.download = "rom.x86inf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function auto_step()
{
  let start = Date.now();
  let lt = Date.now();
  let actual_steps = 0n;
  let speed = 0;
  document.getElementById("auto-step").addEventListener("input", e =>
  {
    start = Date.now();
    actual_steps = 0n;
    speed = +e.srcElement.value;
  });
  function _auto_step()
  {
    requestAnimationFrame(_auto_step);
    let t = Date.now();
    if (t - lt > 1000)
      start += t - lt;
    if (!vm.running) start = t, actual_steps = 0;
    lt = t;
    let expected_steps = BigInt(Math.floor(speed * (t - start) / 1000));
    let update = actual_steps < expected_steps;
    try
    {
      for (; actual_steps < expected_steps && vm.running; actual_steps++)
        vm.step();
    }
    catch (e)
    {
      speed = 0;
      actual_steps = 0n;
      start = Date.now();
      lt = Date.now();
      document.getElementById("auto-step").value = 0;
      document.getElementById("vm-log").textContent = `trapped. reason: ${e}`;
    }
    if (update) update_vm();
  }
  _auto_step();
}

document.getElementById("editor").addEventListener("keydown", function(e)
{
  if (e.keyCode == 9)
  {
    let start = this.selectionStart;
    let end = this.selectionEnd;
    let v = e.target.value;
    e.target.value = `${v.slice(0, start)}\t${v.slice(end)}`;
    this.selectionStart = this.selectionEnd = start + 1;
    e.preventDefault();
  }
});
document.getElementById("compile").addEventListener("click", e => compile());
document.getElementById("reset").addEventListener("click", e => reset());
document.getElementById("step").addEventListener("click", e => step());
document.getElementById("skip").addEventListener("click", e => skip());
document.getElementById("dump").addEventListener("click", e => dump());
document.getElementById("rom").addEventListener("click", e => rom());
document.getElementById("memory-page").addEventListener("input", e => update_vm());
document.getElementById("stack-page").addEventListener("input", e => update_vm());

document.getElementById("editor").value = localStorage.getItem("code");
reset();
auto_step();