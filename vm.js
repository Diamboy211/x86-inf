import { instruction_table, mem_to_reg } from "./constant.js";

export class MemorySegment
{
  constructor()
  {
    this.mem = null;
  }
  read(address)
  {
    if (address < 0n) throw new Error("read");
    if (address < this.mem.length) return this.mem[address];
    return 0n;
  }
  write(address, value)
  {
    if (address < 0n) throw new Error("write");
    if (address < this.mem.length) this.mem[address] = value;
    while (this.mem.length < address) this.mem.push(0n);
    this.mem.push(value);
  }
  init()
  {
    this.mem = [];
  }
}

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
  }
  step()
  {
    if (!this.code || !this.running) return;
    if (this.ip >= this.code.length) throw new Error("code");
    let instruction = this.code[this.ip++];
    let i = str => instruction_table[str].op;
    switch (instruction)
    {
    case i("mov"):
    {
      let dst = this.code[this.ip++];
      let src = this.code[this.ip++];
      let r = this.mread(src);
      this.mwrite(dst, r);
      break;
    }
    case i("add"):
    {
      let dst = this.code[this.ip++];
      let src = this.code[this.ip++];
      let r1 = this.mread(dst);
      let r2 = this.mread(src);
      this.mwrite(dst, r1 + r2);
      break;
    }
    case i("sub"):
    {
      let dst = this.code[this.ip++];
      let src = this.code[this.ip++];
      let r1 = this.mread(dst);
      let r2 = this.mread(src);
      this.mwrite(dst, r1 - r2);
      break;
    }
    case i("inc"):
    {
      let reg = this.code[this.ip++];
      let r = this.mread(reg);
      this.mwrite(reg, r + 1n);
      break;
    }
    case i("dec"):
    {
      let reg = this.code[this.ip++];
      let r = this.mread(reg);
      this.mwrite(reg, r - 1n);
      break;
    }
    case i("jmp"):
    {
      let start = this.ip;
      let l = this.mfindlabel(start);
      this.ip = l;
      this.mskipstr();
      break;
    }
    case i("hlt"):
    {
      this.running = false;
      break;
    }
    }
  }
  // microcode
  mread(reg)
  {
    if (reg >= 1 && reg <= 16) return this.registers[reg - 1];
    if (reg >= 17 && reg <= 19) return this.data.read(this.registers[mem_to_reg[reg] - 1]);
    if (reg >= 20 && reg <= 21) return this.stack.read(this.registers[mem_to_reg[reg] - 1]);
  }
  mwrite(reg, v)
  {
    if (reg >= 1 && reg <= 16) this.registers[reg - 1] = v;
    if (reg >= 17 && reg <= 19) this.data.write(this.registers[mem_to_reg[reg] - 1], v);
    if (reg >= 20 && reg <= 21) this.stack.write(this.registers[mem_to_reg[reg] - 1], v);
  }
  mskipstr()
  {
    while (this.code[this.ip++] != 0);
  }
  mfindlabel(start)
  {
    let i = 0;
    while (i < this.code.length)
    {
      while (this.code[i] != instruction_table["$label"].op) i++;

      let a = start;
      let b = i+1;
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
}