import { instruction_table, number_to_reg, mem_to_reg, flags, opcode_table } from "./constant.js";

export class MemorySegment
{
  constructor()
  {
    this.mem = null;
  }
  read(address)
  {
    if (address < 0n) throw "invalid memory read";
    if (address < this.mem.length) return this.mem[address];
    return 0n;
  }
  write(address, value)
  {
    if (address < 0n) throw "invalid memory write";
    if (address < this.mem.length)
      this.mem[address] = value;
    else
    {
      while (this.mem.length < address) this.mem.push(0n);
      this.mem.push(value);
    }
  }
  init()
  {
    this.mem = [];
  }
}

const mode5 = {};
mode5[instruction_table.movsb.op] = "movsb";
mode5[instruction_table.lodsb.op] = "lodsb";
mode5[instruction_table.stosb.op] = "stosb";

const mode7 = {};
mode7[instruction_table.cmpsb.op] = "cmpsb";
mode7[instruction_table.scasb.op] = "scasb";

export class VM
{
  constructor()
  {
    this.registers = new Array(16);
    this.code = null;
    this.ip = 0n;
    this.data = new MemorySegment();
    this.stack = new MemorySegment();
    this.flags = 0n;
    this.running = false;
    this.t = 0n;
  }
  set_code(code)
  {
    this.code = code;
  }
  reset()
  {
    for (let i = 0; i < this.registers.length; i++) this.registers[i] = 0n;
    this.ip = 0n;
    this.data.init();
    this.stack.init();
    this.flags = 0n;
    this.running = true;
    this.t = 0n;
  }
  skip()
  {
    if (!this.code || !this.running) return;
    if (this.ip >= this.code.length) throw "instruction pointer outside of code";
    let mode = opcode_table[this.code[this.ip]].mode;
    switch (mode)
    {
    case 0:
    case 5:
    case 7:
      this.ip++;
      break;
    case 2:
    case 4:
    case 6:
      this.ip += 2n;
      break;
    case 3:
      this.ip += 3n;
      break;
    case 1:
      this.ip++;
      this.mskipstr();
      break;
    default:
      this.ip++; // step once and hope for the best?
      break;
    }
  }
  step()
  {
    if (!this.code || !this.running) return;
    if (this.ip >= this.code.length) throw "instruction pointer outside of code";
    let instruction = this.code[this.ip];
    let i = str => instruction_table[str].op;
    switch (instruction)
    {
    case i("mov"):
    {
      let dst = this.code[this.ip + 1n];
      let src = this.code[this.ip + 2n];
      this.mov(dst, src);
      this.ip += 3n;
      break;
    }
    case i("add"):
    {
      let dst = this.code[this.ip + 1n];
      let src = this.code[this.ip + 2n];
      this.add(dst, src);
      this.ip += 3n;
      break;
    }
    case i("sub"):
    {
      let dst = this.code[this.ip + 1n];
      let src = this.code[this.ip + 2n];
      this.sub(dst, src);
      this.ip += 3n;
      break;
    }
    case i("mul"):
    {
      let dst = this.code[this.ip + 1n];
      let src = this.code[this.ip + 2n];
      this.mul(dst, src);
      this.ip += 3n;
      break;
    }
    case i("idiv"):
    {
      let dst = this.code[this.ip + 1n];
      let src = this.code[this.ip + 2n];
      this.idiv(dst, src);
      this.ip += 3n;
      break;
    }
    case i("inc"):
    {
      let reg = this.code[this.ip + 1n];
      this.inc(reg);
      this.ip += 2n;
      break;
    }
    case i("dec"):
    {
      let reg = this.code[this.ip + 1n];
      this.dec(reg);
      this.ip += 2n;
      break;
    }
    case i("neg"):
    {
      let reg = this.code[this.ip + 1n];
      this.neg(reg);
      this.ip += 2n;
      break;
    }
    case i("and"):
    {
      let dst = this.code[this.ip + 1n];
      let src = this.code[this.ip + 2n];
      this.and(dst, src);
      this.ip += 3n;
      break;
    }
    case i("or"):
    {
      let dst = this.code[this.ip + 1n];
      let src = this.code[this.ip + 2n];
      this.or(dst, src);
      this.ip += 3n;
      break;
    }
    case i("xor"):
    {
      let dst = this.code[this.ip + 1n];
      let src = this.code[this.ip + 2n];
      this.xor(dst, src);
      this.ip += 3n;
      break;
    }
    case i("not"):
    {
      let reg = this.code[this.ip + 1n];
      this.not(reg);
      this.ip += 2n;
      break;
    }
    case i("shr"):
    {
      let dst = this.code[this.ip + 1n];
      let src = this.code[this.ip + 2n];
      this.shr(dst, src);
      this.ip += 3n;
      break;
    }
    case i("shl"):
    {
      let dst = this.code[this.ip + 1n];
      let src = this.code[this.ip + 2n];
      this.shl(dst, src);
      this.ip += 3n;
      break;
    }
    case i("cmp"):
    {
      let dst = this.code[this.ip + 1n];
      let src = this.code[this.ip + 2n];
      let r1 = this.mread(dst);
      let r2 = this.mread(src);
      let r = r1 - r2;
      this.set_flags(r);
      this.ip += 3n;
      break;
    }
    case i("test"):
    {
      let dst = this.code[this.ip + 1n];
      let src = this.code[this.ip + 2n];
      let r1 = this.mread(dst);
      let r2 = this.mread(src);
      let r = r1 & r2;
      this.set_flags(r);
      this.ip += 3n;
      break;
    }
    case i("push"):
    {
      let reg = this.code[this.ip + 1n];
      this.push(this.mread(reg));
      this.ip += 2n;
      break;
    }
    case i("pop"):
    {
      let reg = this.code[this.ip + 1n];
      let v = this.pop();
      this.mwrite(reg, v);
      this.ip += 2n;
      break;
    }
    case i("call"):
    {
      this.ip++;
      let e = this.mstrend();
      this.push(e);
      this.jmpif();
      break;
    }
    case i("ret"):
    {
      this.ip = this.pop();
      break;
    }
    case i("jmp"):
    {
      this.ip++;
      this.jmpif();
      break;
    }
    case i("jl"):
    {
      this.ip++;
      this.jmpif(this.SF);
      break;
    }
    case i("jle"):
    {
      this.ip++;
      this.jmpif(this.SF || this.ZF);
      break;
    }
    case i("jg"):
    {
      this.ip++;
      this.jmpif(!(this.SF || this.ZF));
      break;
    }
    case i("jge"):
    {
      this.ip++;
      this.jmpif(!this.SF);
      break;
    }
    case i("jz"):
    {
      this.ip++;
      this.jmpif(this.ZF);
      break;
    }
    case i("jnz"):
    {
      this.ip++;
      this.jmpif(!this.ZF);
      break;
    }
    case i("cld"):
    {
      this.flags &= ~flags.D;
      this.ip++;
      break;
    }
    case i("std"):
    {
      this.flags |= flags.D;
      this.ip++;
      break;
    }
    case i("movsb"):
    case i("lodsb"):
    case i("stosb"):
    {
      this[mode5[instruction]]();
      this.ip++;
      break;
    }
    case i("cmpsb"):
    case i("scasb"):
    {
      this[mode7[instruction]]();
      this.ip++;
      break;
    }
    case i("rep"):
    {
      if (this.registers[2] < 0n) throw "rep with cx < 0";
      let s = this.code[this.ip + 1n];
      while (this.registers[2])
      {
        this[mode5[s]]();
        this.registers[2]--;
      }
      this.ip += 2n;
      break;
    }
    case i("repz"):
    {
      if (this.registers[2] < 0n) throw "repz with cx < 0";
      let s = this.code[this.ip + 1n];
      while (this.registers[2])
      {
        this[mode7[s]]();
        this.registers[2]--;
        if (!this.ZF) break;
      }
      this.ip += 2n;
      break;
    }
    case i("repnz"):
    {
      if (this.registers[2] < 0n) throw "repnz with cx < 0";
      let s = this.code[this.ip + 1n];
      while (this.registers[2])
      {
        this[mode7[s]]();
        this.registers[2]--;
        if (this.ZF) break;
      }
      this.ip += 2n;
      break;
    }
    case i("xlat"):
    {
      this.xlat();
      this.ip++;
      break;
    }
    case i("hlt"):
    {
      this.running = false;
      break;
    }
    case i("$label"):
    {
      this.ip++;
      this.mskipstr();
      break;
    }
    case i("int3"):
      throw "int3";
    default:
      throw "illegal instruction";
    }
    this.t++;
  }
  // microcode
  mread(reg)
  {
    if (reg >= 1 && reg <= 16) return this.registers[reg - 1];
    if (reg >= 17 && reg <= 19) return this.data.read(this.registers[mem_to_reg[reg] - 1]);
    if (reg >= 20 && reg <= 21) return this.stack.read(-1n - this.registers[mem_to_reg[reg] - 1]);
    throw "invalid register read";
  }
  mwrite(reg, v)
  {
    if (reg >= 1 && reg <= 16) this.registers[reg - 1] = v;
    else if (reg >= 17 && reg <= 19) this.data.write(this.registers[mem_to_reg[reg] - 1], v);
    else if (reg >= 20 && reg <= 21) this.stack.write(-1n - this.registers[mem_to_reg[reg] - 1], v);
    else throw "invalid register write";
  }
  mskipstr()
  {
    while (this.code[this.ip++] != 0);
  }
  mstrend()
  {
    let i = this.ip;
    while (this.code[i++] != 0);
    return i;
  }
  mfindlabel(start)
  {
    let i = 0n;
    while (i < BigInt(this.code.length))
    {
      while (this.code[i] != instruction_table["$label"].op) i++;

      let a = start;
      let b = i+1n;
      while (this.code[a] == this.code[b] && this.code[a] != 0 && this.code[b] != 0)
      {
        a++;
        b++;
      }
      if (this.code[a] == this.code[b]) return i;

      // skip label
      while (this.code[i++] != 0);
    }
    throw new Error("label");
  }
  set_flags(n)
  {
    if (n < 0n) this.flags = this.flags | flags.S;
    else this.flags = this.flags & ~flags.S;
    if (n) this.flags = this.flags & ~flags.Z;
    else this.flags = this.flags | flags.Z;
  }
  get ZF() { return !!(this.flags & flags.Z); }
  get SF() { return !!(this.flags & flags.S); }
  get DF() { return !!(this.flags & flags.D); }
  
  // less-micro code
  mov(a, b)
  {
    let r = this.mread(b);
    this.mwrite(a, r);
  }
  add(a, b)
  {
    let r1 = this.mread(a);
    let r2 = this.mread(b);
    let r = r1 + r2;
    this.set_flags(r);
    this.mwrite(a, r);
  }
  sub(a, b)
  {
    let r1 = this.mread(a);
    let r2 = this.mread(b);
    let r = r1 - r2;
    this.set_flags(r);
    this.mwrite(a, r);
  }
  mul(a, b)
  {
    let r1 = this.mread(a);
    let r2 = this.mread(b);
    let r = r1 * r2;
    this.mwrite(a, r);
  }
  idiv(a, b)
  {
    let r1 = this.mread(a);
    let r2 = this.mread(b);
    let r = r1 / r2;
    this.mwrite(a, r);
  }
  inc(a)
  {
    let r = this.mread(a) + 1n;
    this.set_flags(r);
    this.mwrite(a, r);
  }
  dec(a)
  {
    let r = this.mread(a) - 1n;
    this.set_flags(r);
    this.mwrite(a, r);
  }
  neg(a)
  {
    let r = -this.mread(a);
    this.set_flags(r);
    this.mwrite(a, r);
  }
  and(a, b)
  {
    let r1 = this.mread(a);
    let r2 = this.mread(b);
    let r = r1 & r2;
    this.set_flags(r);
    this.mwrite(a, r);
  }
  or(a, b)
  {
    let r1 = this.mread(a);
    let r2 = this.mread(b);
    let r = r1 | r2;
    this.set_flags(r);
    this.mwrite(a, r);
  }
  xor(a, b)
  {
    let r1 = this.mread(a);
    let r2 = this.mread(b);
    let r = r1 ^ r2;
    this.set_flags(r);
    this.mwrite(a, r);
  }
  not(a)
  {
    let r = ~this.mread(a);
    this.set_flags(r);
    this.mwrite(a, r);
  }
  shl(a, b)
  {
    let r1 = this.mread(a);
    let r2 = this.mread(b);
    let r = r1 << r2;
    this.set_flags(r);
    this.mwrite(a, r);
  }
  shr(a, b)
  {
    let r1 = this.mread(a);
    let r2 = this.mread(b);
    let r = r1 >> r2;
    this.set_flags(r);
    this.mwrite(a, r);
  }
  jmpif(cond=true)
  {
    if (cond) this.ip = this.mfindlabel(this.ip);
    this.mskipstr();
  }
  push(r)
  {
    let sp = this.mread(8);
    sp--;
    this.mwrite(8, sp);
    this.mwrite(21, r);
  }
  pop()
  {
    let sp = this.mread(8);
    let r = this.mread(21);
    sp++;
    this.mwrite(8, sp);
    return r;
  }
  movsb()
  {
    this.mwrite(19, this.mread(18));
    let d = this.DF ? -1n : 1n;
    this.registers[4] += d;
    this.registers[5] += d;
  }
  lodsb()
  {
    this.mwrite(1, this.mread(18));
    let d = this.DF ? -1n : 1n;
    this.registers[4] += d;
  }
  stosb()
  {
    this.mwrite(19, this.mread(1));
    let d = this.DF ? -1n : 1n;
    this.registers[5] += d;
  }
  cmpsb()
  {
    let r1 = this.mread(18);
    let r2 = this.mread(19);
    let d = this.DF ? -1n : 1n;
    this.registers[4] += d;
    this.registers[5] += d;
    let r = r1 - r2;
    this.set_flags(r);
  }
  scasb()
  {
    let r1 = this.mread(1);
    let r2 = this.mread(19);
    let d = this.DF ? -1n : 1n;
    this.registers[5] += d;
    let r = r1 - r2;
    this.set_flags(r);
  }
  xlat()
  {
    let ax = this.mread(1);
    let bx = this.mread(2);
    let r = this.data.read(ax + bx);
    this.mwrite(1, r);
  }
}

export function disassemble(code, ip, lines)
{
  if (!code) return [];
  let dis = [];
  while (lines-- && ip < code.length)
  {
    let op = code[ip];
    if (op == instruction_table["$label"].op)
    {
      ip++;
      let name = "";
      while (code[ip]) name = `${name}${String.fromCharCode(code[ip++])}`;
      dis.push(`${name}:`);
      op = code[++ip];
    }
    let s = opcode_table[op].inst;
    switch (opcode_table[op].mode)
    {
    case 0:
    case 5:
    case 7:
      ip++;
      dis.push(s);
      break;
    case 1:
    {
      ip++;
      let name = "";
      while (code[ip]) name = `${name}${String.fromCharCode(code[ip++])}`;
      dis.push(`${s} ${name}`);
      ip++;
      break;
    }
    case 2:
    {
      ip++;
      dis.push(`${s} ${number_to_reg[code[ip++]]}`);
      break;
    }
    case 3:
    {
      ip++;
      dis.push(`${s} ${number_to_reg[code[ip]]}, ${number_to_reg[code[ip+1n]]}`);
      ip += 2n;
      break;
    }
    case 4:
    case 6:
    {
      ip++;
      let ins = code[ip++];
      dis.push(`${s} ${opcode_table[ins].inst}`);
      break;
    }
    }
  }
  return dis;
}