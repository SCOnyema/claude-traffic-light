#!/usr/bin/env node
// claude-light hook for Claude Code.
// Reads the hook event JSON from stdin, maps it to a traffic-light state, and
// writes %USERPROFILE%\.claude-light\state.json atomically (temp file + rename).
// Must never crash or block Claude Code: everything is wrapped in try/catch
// and the process always exits 0.

import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const EVENT_TO_STATE = {
  UserPromptSubmit: "thinking",
  PreToolUse: "thinking",
  PostToolUse: "thinking",
  Stop: "active",
  SessionEnd: "off",
};

try {
  // PowerShell 5.1 prepends a UTF-8 BOM when piping; strip it before parsing.
  let raw = readFileSync(0, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
  const input = JSON.parse(raw);
  const state = EVENT_TO_STATE[input.hook_event_name];
  if (state) {
    const dir = join(homedir(), ".claude-light");
    mkdirSync(dir, { recursive: true });
    const target = join(dir, "state.json");
    const tmp = join(dir, `state.json.tmp-${process.pid}`);
    writeFileSync(tmp, JSON.stringify({ state, ts: Date.now() }));
    renameSync(tmp, target);
  }
} catch {
  // Never let a hook failure surface to Claude Code.
}
process.exit(0);
