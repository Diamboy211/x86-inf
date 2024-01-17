import { assemble } from "./compiler.js";
import { VM } from "./vm.js";
import { number_to_reg } from "./constant.js";

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
  let s = "";
  // registers
  for (let i = 0; i < number_to_reg.length; i++) s = `${s}${number_to_reg[i]}: ${vm.registers[i]}\n`;
  s = `${s}wip: ${vm.ip}`;
  document.getElementById("registers").textContent = s;

  // memory
  s = "";
  let hex = n => `${n>15n ? hex(n>>4n) : ''}${['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'][n&15n]}`;
  for (let i = 0n; i < 32n; i++)
    s = `${s}0x${hex(i)}: ${hex(vm.data.read(i))}\n`;
  document.getElementById("memory").textContent = s;
}

function reset()
{
  vm.set_code(assembled_code);
  vm.reset();
  update_vm();
}

function step()
{
  vm.step();
  update_vm();
}

document.getElementById("compile").addEventListener("click", e => compile());
document.getElementById("reset").addEventListener("click", e => reset());
document.getElementById("step").addEventListener("click", e => step());

document.getElementById("editor").value = localStorage.getItem("code");