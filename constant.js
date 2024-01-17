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
  $label: { op: 0x1F, mode: 1 }, // reserved
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

export const number_to_reg = ["wax", "wbx", "wcx", "wdx", "wsi", "wdi", "wbp", "wsp", "w8", "w9", "w10", "w11", "w12", "w13", "w14", "w15"];

export const mem_to_reg = {
  17: 2,
  18: 5,
  19: 6,
  20: 7,
  21: 8,
};