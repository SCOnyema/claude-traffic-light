# claude-light

A tiny always-on-top Windows traffic-light widget that shows your Claude Code
activity status in real time.

- 🟢 **green / `active`** — Claude finished responding (Stop hook)
- 🟡 **yellow / `thinking`** — Claude is working (prompt submitted / tool use), pulses gently
- 🔴 **red / `limited`** — usage limited (StopFailure hook with `rate_limit` matcher, or set manually)
- ⚫ **off** — session ended, or no activity for 10+ minutes

## How it works

Claude Code hooks write `%USERPROFILE%\.claude-light\state.json`
(`{ "state": "...", "ts": <unix ms> }`). The widget polls that file every
second and lights the matching lamp. If `active`/`thinking` is older than
10 minutes, the widget renders `off`.

## Run

```powershell
pnpm install
pnpm tauri dev
```

Release build (exe lands in `src-tauri\target\release\`):

```powershell
pnpm tauri build
```

## Register the Claude Code hooks

Merge this into `%USERPROFILE%\.claude\settings.json` (the `hooks` key merges
with whatever you already have):

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"D:/2026Projects/claude-traffic-light/hooks/claude-light-hook.mjs\""
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"D:/2026Projects/claude-traffic-light/hooks/claude-light-hook.mjs\""
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node \"D:/2026Projects/claude-traffic-light/hooks/claude-light-hook.mjs\""
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"D:/2026Projects/claude-traffic-light/hooks/claude-light-hook.mjs\""
          }
        ]
      }
    ],
    "StopFailure": [
      {
        "matcher": "rate_limit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"D:/2026Projects/claude-traffic-light/hooks/claude-light-hook.mjs\""
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"D:/2026Projects/claude-traffic-light/hooks/claude-light-hook.mjs\""
          }
        ]
      }
    ]
  }
}
```

## Test the states manually

```powershell
pnpm light:red
pnpm light:yellow
pnpm light:green
pnpm light:off
```

## Widget behavior

- Frameless, transparent, always-on-top, no taskbar entry.
- Starts at the top-right of the primary monitor (12px margin); drag anywhere to move it.
- System tray icon with **Show/Hide** and **Quit**.

## Running it day-to-day

After `pnpm tauri build`, the installer lands in
`src-tauri\target\release\bundle\` (either the `.msi` or the `-setup.exe`,
depending on your bundle config). Run it once to install the widget like any
normal app.

- **Pin to taskbar:** search for the app in the Start Menu, right-click it,
  and choose **Pin to taskbar**.
- **Auto-start on login:** press `Win+R`, run `shell:startup`, and drop a
  shortcut to the installed exe into the folder that opens.
- **One instance at a time:** don't run `pnpm tauri dev` while the installed
  version is running — you'll get two widgets fighting over the same spot.
  Check the system tray and **Quit** the installed one first.
