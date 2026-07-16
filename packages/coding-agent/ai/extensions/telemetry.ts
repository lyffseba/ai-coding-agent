import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { TelemetryStore } from "../lib/telemetry-store.ts";

const telemetry = new TelemetryStore();

export default function (pi: ExtensionAPI) {
	function mode(): string {
		if (process.env.AI_MODE === "AI") return "AI";
		if (pi.getFlag("fast") === true) return "fast";
		return "ai";
	}
	pi.on("session_start", async (_event, ctx) => {
		telemetry.record("session_start", ctx.sessionManager.getSessionId(), mode(), {});
	});

	pi.on("turn_start", async (_event, ctx) => {
		telemetry.record("turn_start", ctx.sessionManager.getSessionId(), mode(), {});
	});

	pi.on("turn_end", async (event, ctx) => {
		telemetry.record("turn_end", ctx.sessionManager.getSessionId(), mode(), {
			toolResults: event.toolResults.length,
		});
	});

	pi.on("tool_call", async (event, ctx) => {
		telemetry.record("tool_call", ctx.sessionManager.getSessionId(), mode(), {
			tool: event.toolName,
		});
	});

	pi.registerCommand("telemetry", {
		description: "Show ai telemetry status",
		handler: async (_args, ctx) => {
			ctx.ui.notify(telemetry.statusLine(), "info");
		},
	});
}