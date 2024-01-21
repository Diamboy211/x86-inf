# x86-inf vm

test architecture. i plan to implement a subset of the original 8086 instructions

philosophy:
-
* procedural generation is the only option. therefore: numerical immediates (and as a result, addresses) are strictly disallowed
* future proofing. this architecture shall not have any limitations. this is why it has infinite memory, infinite width registers, and labels are defined as the way they are

# technical details:

assembler:
-

syntax: intel syntax without pointer sizes. no sections

comments start with a semicolon

execution environment:
-

this architecture uses infinite-width bytes. all integer registers are 1 byte long.

the cs, ds and ss segments do not overlap

registers avaliable for general-purpose use:
-
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
-
* wip

unreadable and unwriteable registers:
-
* cs
* ds
* es
* fs
* gs
* ss

flags:
-
* ZF (zero flag)
* SF (sign flag)
* DF (direction flag)

instructions currently avaliable:
-

---
* mov reg,reg / reg,mem / mem,reg
* xlat
---
* add reg,reg / reg,mem / mem,reg
* sub reg,reg / reg,mem / mem,reg
* inc reg / mem
* dec reg / mem
* idiv reg,reg / reg,mem / mem,reg
* mul/imul reg,reg / reg,mem / mem,reg (it can be proven that mul and imul are the same with infinite-width registers)
* neg reg / mem
---
* cmp reg,reg / reg,mem / mem,reg
* test reg,reg / reg,mem / mem,reg
---
* and reg,reg / reg,mem / mem,reg
* or reg,reg / reg,mem / mem,reg
* xor reg,reg / reg,mem / mem,reg
* not reg / mem
* shl/sal reg,reg / reg,mem / mem,reg (due to the lack of an MSB, logical and arithmetic shifts are the exact same)
* shr/sar reg,reg / reg,mem / mem,reg
---
* label: (yes defining a label is an instruction. the label is embedded in the code as a null-terminated string, prefixed by the define label opcode. for the reason, see philosophy)
* jmp label (due to the behavior of labels, jmp searches the entire code for the correct label to jump to. the same is true for other control flow instructions)
* jl / jnge label
* jle / jng label
* jg / jnle label
* jge / jnl label
* je / jz label
* jne / jnz label
* call label
* ret
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
* hlt
* int3 (breakpoint trap)
---

addressing modes avaliable:
-
|mode|meaning|
|---|---|
|[wbx]|[ds:wbx]|
|[wsi]|[ds:wsi]|
|[wdi]|[ds:wdi]|
|[wbp]|[ss:wbp]|
|[wsp]|[ss:wsp]|

nitty gritty details:
-
code is compiled to [cs:0x0]. execution also starts at [cs:0x0]

hlt will stop the execution of the virtual machine

the memory in the data segment, the memory in the stack segment and every general-purpose integer registers are initialized to 0 on start

illegal instructions trigger a breakpoint trap

if execution goes outside the code segment, a breakpoint trap is triggered

if a memory read/write goes outside its intended bounds, a breakpoint trap is triggered

if a string instruction prefixed with rep is run with wcx < 0, a breakpoint trap is triggered

example programs:
-
increment wax forever:
```asm
loop:
inc wax
jmp loop
```
set wax to 42:
```asm
inc wax
inc wax
inc wax
add wax, wax
push wax
inc wax
mul wax, [wsp]
inc wsp
hlt
```
factorial:
```asm
inc wax
inc wax
shl wax, wax ; wax = 8
call factorial ; wax = 8! = 40320 = 0x9D80
hlt

factorial:
dec wax
jle factorial_of_zero_or_one

push wax
inc [wsp]
call factorial
mul [wsp], wax
pop wax
ret

factorial_of_zero_or_one:
xor wax, wax
inc wax
ret
```