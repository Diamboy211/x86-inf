import { assemble } from "./compiler.js"
import { instruction_table, reg_to_number } from "./constant.js"

// ordered from least bytes to most bytes
export const instr = [
	// 2-byte instructions
	"inc",
	"dec",
	"neg",
	"not",
	// 3-byte instructions
	"add",
	"xor", // sub wax, wax is uncultured
	"mul",
	"idiv",
	"shl",
	"shr"
];

let _instr = {};
for (let i = 0; i < instr.length; i++) _instr[instr[i]] = i;
export const iinstr = _instr;

export const op = instr.map(e =>
{
	let i = [e, "wax"];
	// see constant.js
	if (instruction_table[e].mode == 3) i.push(",", "wax");
	return assemble([{ line: 1, str: i }]).code;
});

export const lower_bound = -64n, upper_bound = 64n;

export function code_mul(code1, code2)
{
	if (!code1 || !code2) return null;
	return code1.concat(code2);
}

function fast_size(code)
{
	let size = 0;
	for (let s of code)
	{
		// extremely risky!
		// depends on the fact mode 2 instructions take 2 bytes
		// and mode 3 instructions takes 3 bytes.
		// if the code has anything other than mode 2 or 3 instructions
		// this will break
		size += instruction_table[s].mode;
	}
	return size;
}

function order(code)
{
	let cost = 0;
	for (let s of code)
		cost += iinstr[s];
	return cost;
}

export function code_add(code1, code2)
{
	if (!code1) return code2;
	if (!code2) return code1;
	// optimize for speed, then by size, then by order in instr
	if (code1.length < code2.length) return code1;
	if (code2.length < code1.length) return code2;
	let size1 = fast_size(code1);
	let size2 = fast_size(code2);
	if (size1 > size2) return code2;
	if (size1 < size2) return code1;
	let order1 = order(code1);
	let order2 = order(code2);
	if (order1 > order2) return code2;
	return code1;
}

export function code_square(matrix)
{
	let out = {};
	for (let i = lower_bound; i <= upper_bound; i++)
	{
		out[i] = {};
		for (let j = lower_bound; j <= upper_bound; j++)
			out[i][j] = null;
	}
	for (let y = lower_bound; y <= upper_bound; y++)
		for (let x = lower_bound; x <= upper_bound; x++)
			for (let i = lower_bound; i <= upper_bound; i++)
				out[y][x] = code_add(out[y][x], code_mul(matrix[y][i], matrix[i][x]));
	return out;
}