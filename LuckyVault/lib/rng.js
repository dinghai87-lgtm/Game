'use strict';
// Cryptographic random numbers for every game outcome on the server.
// V8's Math.random (xorshift128+) is fast but predictable: with enough observed results its internal state can be
// recovered and the next spins/cards foreseen. The game engines read Math.random once when they load, so install()
// must run before they are required. Same contract as Math.random: a float in [0, 1) with 53 random bits.
const crypto = require('crypto');
const N = 4096;                       // numbers per refill (one 32 KB crypto read)
const buf = new Uint32Array(N * 2);
let i = N;
function cryptoRandom() {
  if (i >= N) { crypto.randomFillSync(buf); i = 0; }
  const a = buf[2 * i] >>> 5, b = buf[2 * i + 1] >>> 6; i++;   // 27 + 26 bits
  return (a * 67108864 + b) / 9007199254740992;
}
let installed = false;
function install() { if (!installed) { Math.random = cryptoRandom; installed = true; } return cryptoRandom; }
module.exports = { install, cryptoRandom };
