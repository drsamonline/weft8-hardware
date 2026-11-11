# Weft-8 on real silicon — user guide

**Version 1.0.0 · PolyForm Noncommercial 1.0.0**

The Loom's 8-bit machine, in C — and a bench that proves it is the same machine.

Open the parity bench: <https://drsamonline.github.io/weft8-hardware/>

## What the corpus proves

Eleven programs, each asserting one behaviour of the machine:

| Program | Claim |
|---|---|
| `add` | 5 + 7 lands in a register with no flags raised |
| `borrow` | 2 − 5 wraps to `0xFD` and sets carry and negative |
| `overflow` | 127 + 1 sets overflow — what makes signed branches correct |
| `countdown` | a counted loop runs exactly five times |
| `signed` | −1 is less than 1, though 255 is greater |
| `stack` | PUSH/POP return values in reverse order |
| `callret` | CALL and RET come back to the right place |
| `ram` | STORE then LOAD round-trips through scratch RAM |
| `shift` | SHL moves the top bit into carry |
| `ports` | two bytes written to a port arrive in order |
| `signed-cmp` | −2 is less than −1, so a signed branch works on negatives |

## Why a C port and a parity harness

A second implementation is a claim that the machine is a specification rather than one file's
behaviour. The harness is what turns that claim into a test: the same programs run on the JavaScript
engine and on the C one, and the registers, flags and memory must agree.

If they diverge, one of the two is wrong — and the point of the bench is that you find out which,
rather than shipping whichever you happened to run.

## What it is for

- Porting the machine to something with a real clock and real pins (an Arduino or ESP32 sketch is in
  the repository).
- Checking a change to either implementation against the other.
- Reading a small computer's semantics without reading a large one's source.

## Licence

PolyForm Noncommercial 1.0.0. See [LICENSE](../LICENSE).
