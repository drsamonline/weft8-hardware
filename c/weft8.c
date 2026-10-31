/* weft8.c — the Weft-8 machine, in C. See weft8.h.
 * SPDX-FileCopyrightText: 2026 Dr Sohil Momin · PolyForm-Noncommercial-1.0.0 */
#include <string.h>
#include "weft8.h"

static void set_nz(weft8 *m, uint8_t value) {
    m->z = (value == 0);
    m->n = (value & 0x80) != 0;
}

void weft8_init(weft8 *m, const uint8_t *rom, int len) {
    memset(m, 0, sizeof(*m));
    for (int i = 0; i < len && i < 128; i++) m->mem[i] = rom[i];
}

int weft8_step(weft8 *m) {
    if (m->halted) return 0;
    uint8_t op = m->mem[m->pc];
    uint8_t arg = m->mem[(uint8_t)(m->pc + 1)];
    uint8_t next = (uint8_t)(m->pc + 2);
    uint8_t a = (arg >> 4) & 0x0F, b = arg & 0x0F;
    unsigned res;
    uint8_t va, vb;

    switch (op) {
    case W8_LDI: m->r[0] = arg; set_nz(m, m->r[0]); break;
    case W8_MOV: m->r[a] = m->r[b]; set_nz(m, m->r[a]); break;
    case W8_LOAD:
        m->r[0] = (arg >= 0xC0) ? m->ports[arg] : m->mem[arg];
        set_nz(m, m->r[0]);
        break;
    case W8_STORE:
        if (arg >= 0xC0) { m->out[m->outn++ & 511] = m->r[0]; }
        else if (arg > 0x7F) m->mem[arg] = m->r[0];
        break;
    case W8_ADD:
        va = m->r[a]; vb = m->r[b]; res = (unsigned)va + vb;
        m->r[a] = (uint8_t)res;
        m->c = res > 0xFF;
        m->v = (((va ^ res) & (vb ^ res)) & 0x80) != 0;
        set_nz(m, m->r[a]);
        break;
    case W8_SUB:
        va = m->r[a]; vb = m->r[b]; res = (unsigned)va - vb;
        m->r[a] = (uint8_t)res;
        m->c = va < vb;
        m->v = (((va ^ vb) & (va ^ res)) & 0x80) != 0;
        set_nz(m, m->r[a]);
        break;
    case W8_AND: m->r[a] &= m->r[b]; m->c = 0; m->v = 0; set_nz(m, m->r[a]); break;
    case W8_OR:  m->r[a] |= m->r[b]; m->c = 0; m->v = 0; set_nz(m, m->r[a]); break;
    case W8_XOR: m->r[a] ^= m->r[b]; m->c = 0; m->v = 0; set_nz(m, m->r[a]); break;
    case W8_NOT: m->r[a] = (uint8_t)~m->r[a]; m->c = 0; m->v = 0; set_nz(m, m->r[a]); break;
    case W8_SHL:
        va = m->r[a]; m->c = (va & 0x80) != 0; m->r[a] = (uint8_t)(va << 1);
        m->v = ((va & 0x40) != 0) != ((va & 0x80) != 0);
        set_nz(m, m->r[a]);
        break;
    case W8_SHR:
        va = m->r[a]; m->c = (va & 0x01) != 0; m->r[a] = (uint8_t)(va >> 1);
        m->v = 0;
        set_nz(m, m->r[a]);
        break;
    case W8_CMP:
        va = m->r[a]; vb = m->r[b]; res = (unsigned)va - vb;
        m->c = va < vb;
        m->v = (((va ^ vb) & (va ^ res)) & 0x80) != 0;
        set_nz(m, (uint8_t)res);
        break;
    case W8_JMP: next = arg; break;
    case W8_JZ:  if (m->z) next = arg; break;
    case W8_JNZ: if (!m->z) next = arg; break;
    case W8_JG:  if (!m->z && m->n == m->v) next = arg; break;
    case W8_JL:  if (m->n != m->v) next = arg; break;
    case W8_CALL:
        if (m->sp >= 16) { m->error = "stack overflow"; m->halted = 1; return 0; }
        m->stack[m->sp++] = next; next = arg; break;
    case W8_RET:
        if (m->sp == 0) { m->error = "RET with an empty stack"; m->halted = 1; return 0; }
        next = m->stack[--m->sp]; break;
    case W8_PUSH:
        if (m->sp >= 16) { m->error = "stack overflow"; m->halted = 1; return 0; }
        m->stack[m->sp++] = m->r[a]; break;
    case W8_POP:
        if (m->sp == 0) { m->error = "POP with an empty stack"; m->halted = 1; return 0; }
        m->r[a] = m->stack[--m->sp]; set_nz(m, m->r[a]); break;
    case W8_IN:
        m->r[0] = (arg >= 0xC0) ? m->ports[arg] : m->mem[arg];
        set_nz(m, m->r[0]);
        break;
    case W8_OUT:
        if (arg >= 0xC0) m->out[m->outn++ & 511] = m->r[0];
        else if (arg > 0x7F) m->mem[arg] = m->r[0];
        break;
    case W8_RAND: m->r[a] = 0x2A; set_nz(m, m->r[a]); break;   /* fixed: parity needs determinism */
    case W8_NOP: break;
    case W8_HLT: m->halted = 1; m->pc = next; return 0;
    default:
        m->error = "not an instruction";
        m->halted = 1;
        return 0;
    }
    m->pc = next;
    return 1;
}

int weft8_run(weft8 *m, int max_steps) {
    int steps = 0;
    while (!m->halted && steps < max_steps) { weft8_step(m); steps++; }
    if (!m->halted && !m->error) m->error = "step limit reached";
    return steps;
}
