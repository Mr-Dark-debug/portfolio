import { hash } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";

async function hiddenPrompt(label) {
  return new Promise((resolve, reject) => {
    process.stdout.write(label);
    const input = process.stdin;
    let value = "";
    const cleanup = () => { input.off("data", onData); input.setRawMode(false); input.pause(); };
    const onData = (chunk) => {
      const text = chunk.toString();
      if (text === "\u0003" || text === "\u0004") { cleanup(); reject(new Error("Cancelled")); return; }
      if (text === "\r" || text === "\n") { cleanup(); process.stdout.write("\n"); resolve(value); return; }
      if (text === "\u007f" || text === "\b") { value = value.slice(0, -1); return; }
      value += text;
    };
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

async function credentials() {
  if (!process.stdin.isTTY) {
    process.stdout.write("Studio password (12+ characters): ");
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
    const lines = Buffer.concat(chunks).toString().split(/\r?\n/).filter(Boolean);
    process.stdout.write("Confirm password: \n");
    return [lines[0] || "", lines[1] || ""];
  }
  return [await hiddenPrompt("Studio password (12+ characters): "), await hiddenPrompt("Confirm password: ")];
}

const [password, confirmation] = await credentials();
if (password !== confirmation) throw new Error("Passwords do not match");
if (password.length < 12) throw new Error("Use at least 12 characters");
const encoded = await hash(password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32, salt: randomBytes(16) });
process.stdout.write(`\nADMIN_PASSWORD_HASH=${encoded}\n`);
