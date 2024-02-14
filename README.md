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
* mov reg/mem, reg/mem (dst := src)
* xlat (equivalent to mov wax, [wbx+wax])
---
* add reg/mem, reg/mem (dst := dst + src, set flags)
* sub reg/mem, reg/mem (dst := dst - src, set flags)
* inc reg / mem (dst := dst + 1, set flags)
* dec reg / mem (dst := dst - 1, set flags)
* idiv reg/mem, reg/mem (dst := dst / src)
* mul/imul reg/mem, reg/mem (dst := dst * src) (it can be proven that mul and imul are the same with infinite-width registers)
* neg reg / mem (dst := -dst, set flags)
---
* cmp reg/mem, reg/mem (dst - src, set flags)
* test reg/mem, reg/mem (dst & src, set flags)
---
* and reg/mem, reg/mem (dst := dst & src, set flags)
* or reg/mem, reg/mem (dst := dst | src, set flags)
* xor reg/mem, reg/mem (dst := dst ^ src, set flags)
* not reg / mem (dst := ~dst, set flags)
* shl/sal reg/mem, reg/mem (dst := dst << src) (due to the lack of an MSB, logical and arithmetic shifts are the exact same)
* shr/sar reg/mem, reg/mem (dst := dst >> src)
---
* label: (yes defining a label is an instruction. the label is embedded in the code as a null-terminated string, prefixed by the define label opcode. for the reason, see philosophy)
* jmp label (due to the behavior of labels, jmp searches the entire code for the correct label to jump to. the same is true for other control flow instructions)
* jl / jnge label
* jle / jng label
* jg / jnle label
* jge / jnl label
* je / jz label
* jne / jnz label
* call label (push wip jmp label)
* ret (pop wip)
---
* cld (DF := 0. if DF = 0, value+- is equivalent to value++)
* std (DF := 1. if DF = 1, value+- is equivalent to value--)
* (rep) movsb (mov [wdi+-], [wsi+-])
* (rep) lodsb (mov wax, [wsi+-]) (rep for the lols)
* (rep) stosb (mov [wdi+-], wax)
* (repe/repz/repne/repnz) cmpsb (cmp [wdi+-], [wsi+-])
* (repe/repz/repne/repnz) scasb (cmp wax, [wsi+-])
---
* push reg (mov [--wsp], src)
* pop reg (mov dst, [wsp++])
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

in practice, this means wbx, wsi and wdi can only be used to access the data segment, while wbp and wsp can only be used to access the stack

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
inc wax ; wax = 3
add wax, wax ; wax = 6
push wax ; wax = 6, stack = [6]
inc wax ; wax = 7, stack = [6]
mul wax, [wsp] ; wax = 42, stack = [6]
inc wsp ; wax = 42, stack is empty
hlt
```
factorial:
```asm
inc wax
inc wax ; wax = 2
shl wax, wax ; wax = wax << wax = 2 << 2 = 8
call factorial ; wax = 8! = 40320 = 0x9D80
hlt

; after the call, wax = wax!
; the original value of wax before calling this subroutine will be called n
factorial:
dec wax ; wax = n - 1
jle factorial_of_zero_or_one ; jump if n - 1 <= 0, which is equivalent to jumping if n <= 1

push wax ; wax = n - 1, stack = [..., n - 1]
inc [wsp] ; wax = n - 1, stack = [..., n]
call factorial ; wax = (n - 1)!, stack = [..., n]
mul [wsp], wax ; wax = (n - 1)!, stack = [..., n * (n - 1)! = n!]
pop wax ; wax = n!, stack = [...]
ret

factorial_of_zero_or_one:
xor wax, wax
inc wax ; wax = 1
ret
```
fill memory with the fibonacci sequence:
```asm
; wbx = 0
inc wsi ; wsi = 1
inc [wsi] ; mem = [0, 1, ...]
inc wdi
inc wdi ; wdi = 2
; it works trust me
loop:
movsb
add [wsi], [wbx] ; with wbx as the "base", these instructions effectively do [wbx+2] = [wbx+1] + [wbx]
inc wbx
jmp loop
```