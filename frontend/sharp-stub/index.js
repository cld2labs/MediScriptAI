"use strict";
/**
 * MIT — replacement for the optional `sharp` package.
 * This project serves logos via `<img>` only. If Next.js or tooling resolves
 * `sharp`, they get this stub instead of the native sharp stack.
 */
function sharpStub() {
  throw new Error(
    "Image optimization via sharp is disabled; use <img src=...> or public assets."
  );
}
module.exports = sharpStub;
