import { invoke } from "@tauri-apps/api/core";

type LightState = "active" | "thinking" | "limited" | "off";

const VALID_STATES: LightState[] = ["active", "thinking", "limited", "off"];
const POLL_MS = 1000;
const IDLE_MS = 10 * 60 * 1000; // 10 minutes

function render(state: LightState): void {
  document.body.dataset.state = state;
}

async function tick(): Promise<void> {
  try {
    const raw = await invoke<string>("get_state");
    const parsed = JSON.parse(raw) as { state?: string; ts?: number };

    let state: LightState = VALID_STATES.includes(parsed.state as LightState)
      ? (parsed.state as LightState)
      : "off";

    // Idle rule: stale "active"/"thinking" (ts older than 10 min) renders as off.
    const ts = typeof parsed.ts === "number" ? parsed.ts : 0;
    if ((state === "active" || state === "thinking") && Date.now() - ts > IDLE_MS) {
      state = "off";
    }

    render(state);
  } catch {
    render("off");
  }
}

tick();
setInterval(tick, POLL_MS);
