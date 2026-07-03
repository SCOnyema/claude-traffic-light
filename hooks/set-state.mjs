#!/usr/bin/env node
// Manual state setter for testing: node hooks/set-state.mjs <active|thinking|limited|off>
// Used by the pnpm light:* scripts.

import { writeFileSync, renameSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const VALID = ["active", "thinking", "limited", "off"];
const state = process.argv[2];

if (!VALID.includes(state)) {
  console.error(`Usage: node hooks/set-state.mjs <${VALID.join("|")}>`);
  process.exit(1);
}

const dir = join(homedir(), ".claude-light");
mkdirSync(dir, { recursive: true });
const target = join(dir, "state.json");
const tmp = join(dir, `state.json.tmp-${process.pid}`);
writeFileSync(tmp, JSON.stringify({ state, ts: Date.now() }));
renameSync(tmp, target);
console.log(`claude-light state set to "${state}"`);
