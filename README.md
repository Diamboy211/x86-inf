# x86-inf vm

test architecture. i plan to implement a subset of the original 8086 instructions

philosophy: procedural generation is the only option. therefore: numerical immediates (and as a result, addresses) are strictly disallowed

this architecture uses infinite-width bytes. all integer registers are 1 byte long.

the cs, ds and ss segments do not overlap

registers avaliable for general-purpose use:
* wax
* wbx
* wcx
* wdx
* wsi
* wdi
* wbp
* wsp
* w8 ~ w15

non-general purpose registers:
* wip

unreadable and unwriteable registers:
* cs
* ds
* es
* fs
* gs
* ss

flags:
* ZF (zero flag)
* SF (sign flag)
* DF (direction flag)

instructions currently avaliable:

---
* mov reg,reg / reg,mem / mem,reg
---
* add reg,reg / reg,mem / mem,reg
* sub reg,reg / reg,mem / mem,reg
* inc reg / mem
* dec reg / mem
---
---
---
* label: (yes defining a label is an instruction. see philosophy)
* jmp label
---
---
---
* hlt
---

instructions planned:

---
* xlat
---
* idiv reg,reg / reg,mem / mem,reg
* imul reg,reg / reg,mem / mem,reg
* neg reg / mem
---
* cmp reg,reg / reg,mem / mem,reg
* test reg,reg / reg,mem / mem,reg
---
* and reg,reg / reg,mem / mem,reg
* or reg,reg / reg,mem / mem,reg
* xor reg,reg / reg,mem / mem,reg
* not reg / mem
* sal reg,reg / reg,mem / mem,reg
* sar reg,reg / reg,mem / mem,reg
---
* call label
* ret
* jl / jnge label
* jle / jng label
* jg / jnle label
* jge / jnl label
* je / jz label
* jne / jnz label
---
* cld
* std
* (rep) movsb
* (rep) lodsb (rep for the lols)
* (rep) stosb
* (repe/repz/repne/repnz) cmpsb
* (repe/repz/repne/repnz) scasb
---
* push reg
* pop reg
---
* int3 (breakpoint trap (default), or output wax, or output st(0) if i'm crazy enough to implement an infinite-precision fpu)
---

addressing modes avaliable:
|mode|meaning|
|---|---|
|[wbx]|[ds:wbx]|
|[wsi]|[ds:wsi]|
|[wdi]|[ds:wdi]|
|[wbp]|[ss:wbp]|
|[wsp]|[ss:wsp]|

code is compiled to [cs:0x0]. execution also starts at [cs:0x0]

the memory in the data segment, the memory in the stack segment and every general-purpose integer registers are initialized to 0 on start

illegal instructions trigger a breakpoint trap

if execution goes outside the code segment, a breakpoint trap is triggered

if a memory read/write goes outside its intended bounds, a breakpoint trap is triggered

if a string instruction prefixed with rep is run with wcx < 0, a breakpoint trap is triggered (customizable behavior planned. in the future, rep with DF=1 wcx<0 might be the only situation that always traps)

int3's function can be customized based on requirements. see instructions planned > int3

hlt will stop the execution of the virtual machine