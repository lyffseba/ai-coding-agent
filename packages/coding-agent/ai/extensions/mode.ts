import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const PROMPT_AI =
	"You are AI — the primary coding agent. Be thorough, precise, and engineer-minded. You have persistent memory of past sessions.";

const PROMPT_DEFAULT =
	"You are ai — an engineer-first terminal coding agent with persistent memory, telemetry, and a playful waiting room.";

const PROMPT_FAST =
	"You are ai in fast mode — a lightweight helper. Be concise and direct. You remember context from the memory layer.";

export default function (pi: ExtensionAPI) {
	pi.registerFlag("fast", {
		description: "Fast lightweight helper mode (nocaps ai)",
		type: "boolean",
		default: false,
	});

	function resolveMode(): "AI" | "ai" | "fast" {
		if (process.env.AI_MODE === "AI") return "AI";
		if (pi.getFlag("fast") === true) return "fast";
		return "ai";
	}

	pi.on("session_start", async (_event, ctx) => {
		const mode = resolveMode();
		if (mode !== "ai") {
			ctx.ui.notify(`ai · mode: ${mode}`, "info");
		}
	});

	pi.on("before_agent_start", async (event) => {
		const mode = resolveMode();
		const suffix = mode === "AI" ? PROMPT_AI : mode === "fast" ? PROMPT_FAST : PROMPT_DEFAULT;
		return { systemPrompt: `${event.systemPrompt}\n\n${suffix}` };
	});
}