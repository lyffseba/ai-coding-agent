import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { aiHome, detectRegion } from "./memory-store.ts";

export type TelemetryEventType =
	| "session_start"
	| "turn_start"
	| "turn_end"
	| "tool_call"
	| "game_played";

export interface TelemetryEvent {
	id: string;
	timestamp: string;
	type: TelemetryEventType;
	sessionId?: string;
	mode?: string;
	region: string;
	payload: Record<string, unknown>;
}

export class TelemetryStore {
	private readonly baseDir: string;

	constructor() {
		this.baseDir = join(aiHome(), "telemetry");
		mkdirSync(this.baseDir, { recursive: true });
	}

	record(
		type: TelemetryEventType,
		sessionId: string | undefined,
		mode: string | undefined,
		payload: Record<string, unknown>,
	): TelemetryEvent {
		const event: TelemetryEvent = {
			id: randomUUID(),
			timestamp: new Date().toISOString(),
			type,
			sessionId,
			mode,
			region: detectRegion(),
			payload,
		};
		appendFileSync(join(this.baseDir, "events.jsonl"), `${JSON.stringify(event)}\n`);
		return event;
	}

	statusLine(): string {
		const path = join(this.baseDir, "config.json");
		let share = false;
		if (existsSync(path)) {
			try {
				const cfg = JSON.parse(readFileSync(path, "utf-8")) as { shareForTraining?: boolean };
				share = cfg.shareForTraining === true;
			} catch {
				// ignore
			}
		}
		return `📊 telemetry: on | training export: ${share ? "on" : "off (local only)"}`;
	}
}