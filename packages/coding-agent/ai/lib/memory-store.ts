import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export interface MemoryEntry {
	id: string;
	timestamp: string;
	type: string;
	sessionId?: string;
	region?: string;
	data: unknown;
}

export interface UserProfile {
	userId: string;
	region: string;
	createdAt: string;
	updatedAt: string;
	totalSessions: number;
	totalTurns: number;
	favoriteGames: string[];
	preferences: Record<string, unknown>;
}

export interface LeaderboardEntry {
	name: string;
	score: number;
	game: string;
	region: string;
	timestamp: string;
}

/** Unified ai data home — ~/.ai */
export function aiHome(): string {
	return process.env.AI_HOME ?? join(homedir(), ".ai");
}

export function detectRegion(): string {
	const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	const locale = Intl.DateTimeFormat().resolvedOptions().locale;
	return `${locale.split("-").pop()?.toUpperCase() ?? "XX"}:${tz}`;
}

function readJsonl<T>(path: string): T[] {
	if (!existsSync(path)) return [];
	const entries: T[] = [];
	for (const line of readFileSync(path, "utf-8").split("\n")) {
		if (!line.trim()) continue;
		try {
			entries.push(JSON.parse(line) as T);
		} catch {
			// skip corrupt lines
		}
	}
	return entries;
}

export class MemoryStore {
	private readonly baseDir: string;

	constructor(baseDir?: string) {
		this.baseDir = baseDir ?? join(aiHome(), "memory");
		mkdirSync(this.baseDir, { recursive: true });
	}

	append(entry: Omit<MemoryEntry, "id" | "timestamp" | "region">): MemoryEntry {
		const full: MemoryEntry = {
			id: randomUUID(),
			timestamp: new Date().toISOString(),
			region: detectRegion(),
			...entry,
		};
		appendFileSync(join(this.baseDir, "journal.jsonl"), `${JSON.stringify(full)}\n`);
		return full;
	}

	query(opts?: { type?: string; limit?: number }): MemoryEntry[] {
		let entries = readJsonl<MemoryEntry>(join(this.baseDir, "journal.jsonl"));
		if (opts?.type) entries = entries.filter((e) => e.type === opts.type);
		entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
		if (opts?.limit) entries = entries.slice(0, opts.limit);
		return entries;
	}

	getRecentContext(limit = 15): string {
		const entries = this.query({ limit });
		if (entries.length === 0) return "";
		const lines = entries.map((e) => {
			const data = typeof e.data === "string" ? e.data : JSON.stringify(e.data);
			return `- [${e.type}] ${data.slice(0, 200)}`;
		});
		return `## What ai remembers from past sessions\n${lines.join("\n")}`;
	}

	getProfile(): UserProfile {
		const path = join(this.baseDir, "profile.json");
		if (existsSync(path)) {
			return JSON.parse(readFileSync(path, "utf-8")) as UserProfile;
		}
		const profile: UserProfile = {
			userId: randomUUID(),
			region: detectRegion(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			totalSessions: 0,
			totalTurns: 0,
			favoriteGames: [],
			preferences: {},
		};
		writeFileSync(path, JSON.stringify(profile, null, 2));
		return profile;
	}

	updateProfile(patch: Partial<UserProfile>): UserProfile {
		const profile = { ...this.getProfile(), ...patch, updatedAt: new Date().toISOString() };
		writeFileSync(join(this.baseDir, "profile.json"), JSON.stringify(profile, null, 2));
		return profile;
	}

	recordGameScore(entry: Omit<LeaderboardEntry, "timestamp" | "region">): LeaderboardEntry {
		const full: LeaderboardEntry = {
			...entry,
			region: detectRegion(),
			timestamp: new Date().toISOString(),
		};
		appendFileSync(join(this.baseDir, "leaderboard.jsonl"), `${JSON.stringify(full)}\n`);
		const profile = this.getProfile();
		const games = new Set(profile.favoriteGames);
		games.add(entry.game);
		this.updateProfile({ favoriteGames: [...games] });
		return full;
	}

	getLeaderboard(game?: string, region?: string, limit = 10): LeaderboardEntry[] {
		let entries = readJsonl<LeaderboardEntry>(join(this.baseDir, "leaderboard.jsonl"));
		if (game) entries = entries.filter((e) => e.game === game);
		if (region) entries = entries.filter((e) => e.region === region);
		entries.sort((a, b) => b.score - a.score);
		return entries.slice(0, limit);
	}
}