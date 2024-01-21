/*
 * mode 0: no args
 * format: (op)
 * mode 1: 1 arg, label
 * format: (op) (null-terminated string)
 * mode 2: 1 arg, reg/mem
 * format: (op) (reg_to_number(reg/mem))
 * mode 3: 2 arg, reg,reg / reg,mem / mem,reg
 * format: (op) (reg_to_number(1st operand)) (reg_to_number(2nd operand))
 * mode 4: 1 arg, mode 5 instruction (rep)
 * format: (op) (op for mode 5 instruction)
 * mode 5: no args, non-comparing string instruction
 * format: (op)
 * mode 6: 1 arg, mode 7 instruction (repz/e/nz/ne)
 * format: (op) (op for mode 7 instruction)
 * mode 7: no args, comparing string instruction
 * format: (op)
 */

export const instruction_table = {
  mov: { op: 0x01, mode: 3, },
  add: { op: 0x02, mode: 3, },
  sub: { op: 0x03, mode: 3, },
  inc: { op: 0x04, mode: 2, },
  dec: { op: 0x05, mode: 2, },
  jmp: { op: 0x06, mode: 1, },
  hlt: { op: 0x07, mode: 0, },
  idiv: { op: 0x08, mode: 3, },
  imul: { op: 0x09, mode: 3, },
  mul: { op: 0x09, mode: 3, },
  cmp: { op: 0x0A, mode: 3, },
  test: { op: 0x0B, mode: 3, },
  jl: { op: 0x0C, mode: 1, },
  jnge: { op: 0x0C, mode: 1, },
  jle: { op: 0x0D, mode: 1, },
  jng: { op: 0x0D, mode: 1, },
  jg: { op: 0x0E, mode: 1, },
  jnle: { op: 0x0E, mode: 1, },
  jge: { op: 0x0F, mode: 1, },
  jnl: { op: 0x0F, mode: 1, },
  je: { op: 0x10, mode: 1, },
  jz: { op: 0x10, mode: 1, },
  jne: { op: 0x11, mode: 1, },
  jnz: { op: 0x11, mode: 1, },
  neg: { op: 0x12, mode: 2, },
  and: { op: 0x13, mode: 3, },
  or: { op: 0x14, mode: 3, },
  xor: { op: 0x15, mode: 3, },
  not: { op: 0x16, mode: 2, },
  push: { op: 0x17, mode: 2, },
  pop: { op: 0x18, mode: 2, },
  call: { op: 0x19, mode: 1, },
  ret: { op: 0x1A, mode: 0, },
  shl: { op: 0x1B, mode: 3, },
  sal: { op: 0x1B, mode: 3, },
  shr: { op: 0x1C, mode: 3, },
  sar: { op: 0x1C, mode: 3, },
  rep: { op: 0x1D, mode: 4, },
  repe: { op: 0x1E, mode: 6, },
  repz: { op: 0x1E, mode: 6, },
  repne: { op: 0x1F, mode: 6, },
  repnz: { op: 0x1F, mode: 6, },
  cld: { op: 0x20, mode: 0, },
  std: { op: 0x21, mode: 0, },
  movsb: { op: 0x22, mode: 5, },
  lodsb: { op: 0x23, mode: 5, },
  stosb: { op: 0x24, mode: 5, },
  xlat: { op: 0x25, mode: 0, },
  cmpsb: { op: 0x26, mode: 7, },
  scasb: { op: 0x27, mode: 7, },
  int3: { op: 0x28, mode: 0, },
  $label: { op: 0x7F, mode: 1, }, // reserved
};

export const reg_to_number = {
  wax: 1,
  wbx: 2,
  wcx: 3,
  wdx: 4,
  wsi: 5,
  wdi: 6,
  wbp: 7,
  wsp: 8,
  w8: 9,
  w9: 10,
  w10: 11,
  w11: 12,
  w12: 13,
  w13: 14,
  w14: 15,
  w15: 16,
  mwbx: 17,
  mwsi: 18,
  mwdi: 19,
  mwbp: 20,
  mwsp: 21,
};

let _opcode_table = {};
for (let k of Object.keys(instruction_table)) _opcode_table[instruction_table[k].op] = { inst: k, mode: instruction_table[k].mode, };

export const opcode_table = _opcode_table;

export const number_to_reg = ["bitch", "wax", "wbx", "wcx", "wdx", "wsi", "wdi", "wbp", "wsp", "w8", "w9", "w10", "w11", "w12", "w13", "w14", "w15", "[wbx]", "[wsi]", "[wdi]", "[wbp]", "[wsp]"];

export const mem_to_reg = {
  17: 2,
  18: 5,
  19: 6,
  20: 7,
  21: 8,
};

export const flags = {
  Z: 1n,
  S: 2n,
  D: 4n,
};