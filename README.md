# x86-inf vm

test architecture. i plan to implement a subset of the original 8086 instructions

philosophy:
-
* numerical immediates (and as a result, addresses) are strictly disallowed
* future proofing. this architecture shall not have any limitations. this is why it has infinite memory, infinite width bytes, and labels are defined as the way they are
* von neumann is kinda cringe ngl. code and memory is separated

# technical details:

assembler:
-

syntax: intel syntax without pointer sizes. no sections

comments start with a semicolon and end before a newline

register encoding:
|register|value|
|---|---|
|wax|0x01|
|wbx|0x02|
|wcx|0x03|
|wdx|0x04|
|wsi|0x05|
|wdi|0x06|
|wbp|0x07|
|wsp|0x08|
|w8|0x09|
|w9|0x0A|
|w10|0x0B|
|w11|0x0C|
|w12|0x0D|
|w13|0x0E|
|w14|0x0F|
|w15|0x10|
|[wbx]|0x11|
|[wsi]|0x12|
|[wdi]|0x13|
|[wbp]|0x14|
|[wsp]|0x15|

instruction encoding:
|type|encoded as|
|---|---|
|instruction|(opcode)|
|instruction label|(opcode) (null-terminated label's name)|
|instruction reg/mem|(opcode) (encoded reg/mem)|
|instruction reg/mem, reg/mem|(opcode) (encoded reg/mem1) (encoded reg/mem2)|
|rep/repe/repz/repne/repnz instruction|(opcode of rep/repe/repz/repne/repnz) (opcode)|
|label:|(label definition opcode) (null-terminated label's name)|

execution environment:
-

this architecture uses infinite-width bytes that contain an infinite amount of bits. all integer registers are 1 byte long. arithmetic operations treat every value as encoded in two's complement with bits extending infinitely far to the left

the cs, ds and ss segments do not overlap

registers available for general-purpose use:
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

unreadable and unwritable registers:
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

instructions currently available:
-

---
* (opcode: 0x01) mov reg/mem, reg/mem (dst := src)
* (0x25) xlat (equivalent to mov wax, [wbx+wax])
---
* (0x02) add reg/mem, reg/mem (dst := dst + src, set flags)
* (0x03) sub reg/mem, reg/mem (dst := dst - src, set flags)
* (0x04) inc reg / mem (dst := dst + 1, set flags)
* (0x05) dec reg / mem (dst := dst - 1, set flags)
* (0x08) idiv reg/mem, reg/mem (dst := dst / src)
* (0x09) mul/imul reg/mem, reg/mem (dst := dst * src) (it can be proven that mul and imul are the same with infinite-width registers)
* (0x12) neg reg / mem (dst := -dst, set flags)
---
* (0x0A) cmp reg/mem, reg/mem (dst - src, set flags)
* (0x0B) test reg/mem, reg/mem (dst & src, set flags)
---
* (0x13) and reg/mem, reg/mem (dst := dst & src, set flags)
* (0x14) or reg/mem, reg/mem (dst := dst | src, set flags)
* (0x15) xor reg/mem, reg/mem (dst := dst ^ src, set flags)
* (0x16) not reg / mem (dst := ~dst, set flags)
* (0x1B) shl/sal reg/mem, reg/mem (dst := dst << src) (due to the lack of an MSB, logical and arithmetic shifts are the exact same)
* (0x1C) shr/sar reg/mem, reg/mem (dst := dst >> src)
---
* (0x7F) label: (yes defining a label is an instruction. the label is embedded in the code as a null-terminated string, prefixed by the define label opcode. for the reason, see philosophy)
* (0x06) jmp label (due to the behavior of labels, jmp searches the entire code for the correct label to jump to. the same is true for other control flow instructions)
* (0x0C) jl / jnge label
* (0x0D) jle / jng label
* (0x0E) jg / jnle label
* (0x0F) jge / jnl label
* (0x10) je / jz label
* (0x11) jne / jnz label
* (0x19) call label (push wip jmp label)
* (0x1A) ret (pop wip)
---
* (0x1D) rep
* (0x1E) repe/repz
* (0x1F) repne/repnz
* (0x20) cld (DF := 0. if DF = 0, value+- is equivalent to value++)
* (0x21) std (DF := 1. if DF = 1, value+- is equivalent to value--)
* (0x22) (rep) movsb (mov [wdi+-], [wsi+-])
* (0x23) (rep) lodsb (mov wax, [wsi+-]) (rep for the lols)
* (0x24) (rep) stosb (mov [wdi+-], wax)
* (0x26) (repe/repz/repne/repnz) cmpsb (cmp [wdi+-], [wsi+-])
* (0x27) (repe/repz/repne/repnz) scasb (cmp wax, [wdi+-])
---
* (0x17) push reg (mov [--wsp], src)
* (0x18) pop reg (mov dst, [wsp++])
---
* (0x07) hlt
* (0x28) int3 (breakpoint trap)
---

addressing modes available:
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

the legal memory accesses are [ds:[0; +∞)] and [ss:(-∞; -1]]

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
