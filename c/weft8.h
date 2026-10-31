/* weft8.h — the Weft-8 machine, in C.
 *
 * The same machine as the Loom's weft8.js: 16 eight-bit registers (R0 is the
 * accumulator), flags Z C N V, 256 bytes of address space, and fixed TWO-BYTE
 * little-endian instructions — opcode, then operand.
 *
 *   ROM   0x00-0x7F   RAM  0x80-0xBF   peripherals 0xC0-0xFF
 *
 * SPDX-FileCopyrightText: 2026 Dr Sohil Momin
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
#ifndef WEFT8_H
#define WEFT8_H

#include <stdint.h>

#define W8_LDI 0x00
#define W8_MOV 0x01
#define W8_LOAD 0x02
#define W8_STORE 0x03
#define W8_ADD 0x04
#define W8_SUB 0x05
#define W8_AND 0x06
#define W8_OR 0x07
#define W8_XOR 0x08
#define W8_NOT 0x09
#define W8_SHL 0x0A
#define W8_SHR 0x0B
#define W8_CMP 0x0C
#define W8_JMP 0x0D
#define W8_JZ 0x0E
#define W8_JNZ 0x0F
#define W8_JG 0x10
#define W8_JL 0x11
#define W8_CALL 0x12
#define W8_RET 0x13
#define W8_PUSH 0x14
#define W8_POP 0x15
#define W8_IN 0x16
#define W8_OUT 0x17
#define W8_RAND 0x18
#define W8_NOP 0x19
#define W8_HLT 0x1A

typedef struct {
    uint8_t mem[256];
    uint8_t r[16];
    uint8_t z, c, n, v;
    uint8_t pc;
    uint8_t stack[16];
    uint8_t sp;
    uint8_t halted;
    const char *error;      /* NULL when the machine stopped cleanly */
    uint8_t out[512];       /* every byte written to a port, in order */
    int outn;
    uint8_t ports[256];     /* what the peripherals read back */
} weft8;

void weft8_init(weft8 *m, const uint8_t *rom, int len);
/* one instruction; returns 1 while the machine should keep going */
int weft8_step(weft8 *m);
int weft8_run(weft8 *m, int max_steps);

#endif
