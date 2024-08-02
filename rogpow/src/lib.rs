mod utils;

use argon2rs::{Argon2, Variant};
use wasm_bindgen::prelude::*;

const TARGET: u32 = 10000000;

#[wasm_bindgen]
pub fn check(bin: &[u8], nonce: u32) -> bool {
    let nonce: [u32; 1] = [nonce];
    let nonce8 = unsafe { std::slice::from_raw_parts(nonce.as_ptr() as *const u8, 4) };
    let mut out = [0; 32];
    let out32 = unsafe { std::slice::from_raw_parts(out.as_ptr() as *const u32, 8) };

    let a2 = Argon2::default(Variant::Argon2d);
    a2.hash(&mut out, bin, bin, nonce8, &[]);
    return out32[0] < TARGET;
}

#[wasm_bindgen]
pub fn pow(bin: &[u8]) -> u32 {
    let mut nonce: [u32; 1] = [0];
    let nonce8 = unsafe { std::slice::from_raw_parts(nonce.as_ptr() as *const u8, 4) };
    let mut out = [0; 32];
    let out32 = unsafe { std::slice::from_raw_parts(out.as_ptr() as *const u32, 8) };

    let a2 = Argon2::default(Variant::Argon2d);

    loop {
        a2.hash(&mut out, bin, bin, nonce8, &[]);
        if out32[0] < TARGET {
            return nonce[0];
        }
        nonce[0] += 1;
    }
}
