import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { MemoryStore } from "../lib/memory-store.ts";

const store = new MemoryStore();

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		const profile = store.getProfile();
		store.updateProfile({ totalSessions: profile.totalSessions + 1 });
		store.append({
			type: "session_start",
			sessionId: ctx.sessionManager.getSessionId(),
			data: { cwd: process.cwd(), mode: process.env.AI_MODE ?? "ai" },
		});
	});

	pi.on("turn_end", async (event, ctx) => {
		const profile = store.getProfile();
		store.updateProfile({ totalTurns: profile.totalTurns + 1 });
		store.append({
			type: "turn_end",
			sessionId: ctx.sessionManager.getSessionId(),
			data: { turnIndex: event.turnIndex, toolResults: event.toolResults.length },
		});
	});

	pi.on("before_agent_start", async (event) => {
		const context = store.getRecentContext(15);
		if (!context) return;
		return { systemPrompt: `${event.systemPrompt}\n\n${context}` };
	});

	pi.registerCommand("memory", {
		description: "Show ai memory stats and recent entries",
		handler: async (args, ctx) => {
			const profile = store.getProfile();
			const limit = Number.parseInt(args ?? "5", 10) || 5;
			const recent = store.query({ limit });
			const lines = [
				"🧠 ai memory",
				`Region: ${profile.region}`,
				`Sessions: ${profile.totalSessions} | Turns: ${profile.totalTurns}`,
				`Games: ${profile.favoriteGames.join(", ") || "none yet"}`,
				"",
				`Recent (${recent.length}):`,
				...recent.map((e) => `  [${e.type}] ${JSON.stringify(e.data).slice(0, 80)}`),
			];
			ctx.ui.notify(lines.join("\n"), "info");
		},
	});
}