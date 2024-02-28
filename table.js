import { VM } from "./vm.js";
import { assemble } from "./compiler.js";
import { instruction_table, reg_to_number } from "./constant.js";
import { lower_bound, upper_bound, op, instr, code_add } from "./table_common.js";


let vm = new VM();
let table = {};
for (let i = lower_bound; i <= upper_bound; i++)
{
	table[i] = [];
	for (let j = 0; j < op.length; j++)
	{
		vm.set_code(op[j]);
		vm.reset();
		vm.mwrite(reg_to_number.wax, i);
		try
		{
			vm.step();
			let v = vm.mread(reg_to_number.wax);
			if (v >= lower_bound && v <= upper_bound)
				table[i][j] = v;
			else table[i][j] = null;
		}
		catch (e)
		{
			table[i][j] = null;
		}
	}
}



let matrix = {};
let nmat = {};
for (let i = lower_bound; i <= upper_bound; i++)
{
	matrix[i] = {};
	nmat[i] = {};
	for (let j = lower_bound; j <= upper_bound; j++)
		matrix[i][j] = null, nmat[i][j] = null;
}
for (let i = lower_bound; i <= upper_bound; i++)
	nmat[i][i] = [];
for (let i = lower_bound; i <= upper_bound; i++)
{
	for (let j = 0; j < instr.length; j++)
	{
		let v = table[i][j];
		if (v == null) continue;
		nmat[i][v] = code_add(nmat[i][v], [instr[j]]);
	}
}

let t_mat = {};

let t = document.getElementById("t");
// top row
let header = document.createElement("tr");
let mt = document.createElement("td");
header.appendChild(mt);
for (let i = lower_bound; i <= upper_bound; i++)
{
  let h = document.createElement("th");
  h.scope = "col";
  h.textContent = i;
  header.appendChild(h);
}
t.appendChild(header);
for (let i = lower_bound; i <= upper_bound; i++)
{
  t_mat[i] = {};
  let row = document.createElement("tr");
  let h = document.createElement("th");
  h.scope = "row";
  h.textContent = i;
  row.appendChild(h);
  for (let j = lower_bound; j <= upper_bound; j++)
  {
    let d = document.createElement("td");
    row.appendChild(d);
    t_mat[i][j] = d;
  }
  t.appendChild(row);
}

let update_ptr = 0n;
const max_ptr = (upper_bound - lower_bound + 1n) ** 2n;

let worker = new Worker("./table_worker.js", { type: "module" });
worker.onmessage = e =>
{
  nmat = e.data;
  update_ptr = 0n;
};
worker.postMessage(nmat);

function update()
{
  requestAnimationFrame(update);
  let i = 128;
  while (i && update_ptr < max_ptr)
  {
    let y = update_ptr / (upper_bound - lower_bound + 1n) + lower_bound;
    let x = update_ptr % (upper_bound - lower_bound + 1n) + lower_bound;
    update_ptr++;
    let a = matrix[y][x];
    let b = nmat[y][x];
    if (a == b) continue;
    if (a && a.length == b.length)
    {
      let eq = true;
      for (let i = 0; i < a.length; i++)
        eq = eq && (a[i] == b[i]);
      if (eq) continue;
    }
    i--;
    matrix[y][x] = nmat[y][x];
    let c = b.map(e => `${e} wax${
      instruction_table[e].mode == 3 ? ", wax" : ""
    }`);
    let d = [];
    for (let k = 0; k < c.length; k++)
    {
      let s = document.createElement("span");
      s.textContent = c[k];
      if (k) d.push(document.createElement("br"));
      d.push(s);
    }
    t_mat[y][x].replaceChildren(...d);
  }
}
update();