import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR;
if (!OUT_DIR) {
  throw new Error("MAKEFUN_OUTPUT_DIR is not set");
}

const LINE1 =
  "A toaster is a tiny elevator for bread: it drops your slice down into a hot room, then pops it back up wearing a tan.";
const LINE2 =
  "The elevator part fits — down, heat, back up — but an elevator moves people, and a toaster's whole job is the heat, not the ride.";
const ENTRY = LINE1 + "\n" + LINE2;

// Self-check: gate 1-400 chars, exactly 2 lines, one sentence per line,
// no trailing newline, and the entry anchors the winning text.
const chars = [...ENTRY].length;
if (chars < 1 || chars > 400) {
  throw new Error(`entry length ${chars} outside gate 1-400`);
}
const lines = ENTRY.split("\n");
if (lines.length !== 2) {
  throw new Error(`expected 2 lines, got ${lines.length}`);
}
for (const [i, line] of lines.entries()) {
  const sentences = line.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length !== 1) {
    throw new Error(`line ${i + 1} is not a single sentence`);
  }
}
if (ENTRY.endsWith("\n")) {
  throw new Error("entry must not end with a trailing newline");
}
if (!ENTRY.startsWith("A toaster is a tiny elevator")) {
  throw new Error("entry does not open with the toaster-elevator anchor");
}
if (!ENTRY.includes("wearing a tan")) {
  throw new Error("entry is missing the 'wearing a tan' anchor");
}
if (!ENTRY.endsWith("not the ride.")) {
  throw new Error("entry does not end with 'not the ride.'");
}
if (!ENTRY.includes("whole job is the heat")) {
  throw new Error("entry is missing the 'whole job is the heat' anchor");
}

mkdirSync(OUT_DIR, { recursive: true });
const outPath = join(OUT_DIR, "entry.txt");
writeFileSync(outPath, ENTRY, "utf8");

// Read-back self-check: the file on disk must be byte-identical to the
// entry we just validated, with the expected sha256, and its two lines must
// land on the exact anchors (line 1 ends "wearing a tan.", line 2 opens
// "The elevator part fits").
const onDisk = readFileSync(outPath, "utf8");
if (onDisk !== ENTRY) {
  throw new Error("read-back mismatch: entry.txt differs from the entry");
}
const onDiskLines = onDisk.split("\n");
if (!onDiskLines[0].endsWith("wearing a tan.")) {
  throw new Error("read-back: line 1 does not end 'wearing a tan.'");
}
if (!onDiskLines[1].startsWith("The elevator part fits")) {
  throw new Error("read-back: line 2 does not open 'The elevator part fits'");
}
if (Buffer.byteLength(onDisk, "utf8") !== Buffer.byteLength(ENTRY, "utf8")) {
  throw new Error("read-back: byte length mismatch");
}
const sha = createHash("sha256").update(onDisk, "utf8").digest("hex");
console.log(`wrote ${outPath} (${chars} chars, 2 lines, sha256 ${sha})`);
