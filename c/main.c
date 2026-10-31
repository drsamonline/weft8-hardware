/* c/main.c — run the corpus on the C machine and print one JSON object per line.
 * SPDX-FileCopyrightText: 2026 Dr Sohil Momin · PolyForm-Noncommercial-1.0.0 */
#include <stdio.h>
#include "weft8.h"
#include "corpus.h"

int main(void) {
    for (int i = 0; i < CORPUS_N; i++) {
        weft8 m;
        weft8_init(&m, CORPUS[i].rom, CORPUS[i].len);
        weft8_run(&m, 20000);
        printf("{\"id\":\"%s\",\"r\":[", CORPUS[i].id);
        for (int k = 0; k < 16; k++) printf("%s%d", k ? "," : "", m.r[k]);
        printf("],\"flags\":{\"z\":%d,\"c\":%d,\"n\":%d,\"v\":%d},\"halted\":%d,\"error\":%s,\"out\":[",
               m.z, m.c, m.n, m.v, m.halted, m.error ? "\"\"" : "null");
        for (int k = 0; k < m.outn; k++) printf("%s%d", k ? "," : "", m.out[k]);
        printf("]}\n");
    }
    return 0;
}
