/**
 * ai play — launches bet (separate repo, untouched) while the agent works
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { matchesKey } from "@earendil-works/pi-tui";
import { spawn, spawnSync } from "node:child_process";
import { MemoryStore, detectRegion } from "../lib/memory-store.ts";
import { TelemetryStore } from "../lib/telemetry-store.ts";

const memory = new MemoryStore();
const telemetry = new TelemetryStore();

const GAMES = ["hangman", "tictactoe", "chess", "pong", "matrix"] as const;

type Cell = "X" | "O" | ".";
type Board = Cell[][];

function emptyBoard(): Board {
	return Array.from({ length: 3 }, () => Array<Cell>(3).fill("."));
}

function checkWinner(board: Board): Cell | "draw" | null {
	const lines = [
		...board,
		[board[0][0], board[1][0], board[2][0]],
		[board[0][1], board[1][1], board[2][1]],
		[board[0][2], board[1][2], board[2][2]],
		[board[0][0], board[1][1], board[2][2]],
		[board[0][2], board[1][1], board[2][0]],
	];
	for (const line of lines) {
		if (line[0] !== "." && line[0] === line[1] && line[1] === line[2]) return line[0];
	}
	return board.flat().every((c) => c !== ".") ? "draw" : null;
}

function aiMove(board: Board): void {
	const empties: [number, number][] = [];
	for (let r = 0; r < 3; r++) {
		for (let c = 0; c < 3; c++) {
			if (board[r][c] === ".") empties.push([r, c]);
		}
	}
	if (empties.length === 0) return;
	const [r, c] = empties[Math.floor(Math.random() * empties.length)];
	board[r][c] = "O";
}

class TicTacToeComponent {
	private board = emptyBoard();
	private cursor = { row: 1, col: 1 };
	private gameOver = false;
	private score = 0;
	private onClose: () => void;

	constructor(onClose: () => void) {
		this.onClose = onClose;
	}

	render(width: number): string[] {
		const region = detectRegion();
		const leaderboard = memory.getLeaderboard("tictactoe", region, 3);
		const lb = leaderboard.map((e, i) => `${i + 1}. ${e.name} — ${e.score}`).join("  ");
		const boardLines = this.board.map((row, ri) =>
			row
				.map((cell, ci) => {
					const ch = cell === "." ? "·" : cell;
					return ri === this.cursor.row && ci === this.cursor.col && !this.gameOver ? `[${ch}]` : ` ${ch} `;
				})
				.join(""),
		);
		return [
			"🎮 ai play — tic-tac-toe",
			"arrows: move · enter: place X · q: quit",
			this.gameOver ? "game over — press q" : `score: ${this.score}`,
			"",
			...boardLines,
			"",
			`🏆 regional (${region.split(":")[0]}): ${lb || "be first!"}`,
		].map((l) => l.slice(0, width));
	}

	handleKey(key: string): void {
		if (matchesKey(key, "ctrl+c") || matchesKey(key, "escape") || key === "q") {
			this.onClose();
			return;
		}
		if (this.gameOver) return;
		if (matchesKey(key, "up") && this.cursor.row > 0) this.cursor.row--;
		if (matchesKey(key, "down") && this.cursor.row < 2) this.cursor.row++;
		if (matchesKey(key, "left") && this.cursor.col > 0) this.cursor.col--;
		if (matchesKey(key, "right") && this.cursor.col < 2) this.cursor.col++;
		if (matchesKey(key, "enter") || key === " ") {
			const { row, col } = this.cursor;
			if (this.board[row][col] !== ".") return;
			this.board[row][col] = "X";
			const result = checkWinner(this.board);
			if (result) {
				this.endGame(result);
				return;
			}
			aiMove(this.board);
			const afterAi = checkWinner(this.board);
			if (afterAi) this.endGame(afterAi);
		}
	}

	private endGame(result: Cell | "draw"): void {
		this.gameOver = true;
		const mode = process.env.AI_MODE ?? "ai";
		if (result === "X") {
			this.score = 100;
			memory.recordGameScore({ name: "you", score: 100, game: "tictactoe" });
			telemetry.record("game_played", undefined, mode, { game: "tictactoe", result: "win" });
		} else if (result === "draw") {
			this.score = 25;
			memory.recordGameScore({ name: "you", score: 25, game: "tictactoe" });
		} else {
			this.score = 0;
			telemetry.record("game_played", undefined, mode, { game: "tictactoe", result: "loss" });
		}
	}
}

function hasBet(): boolean {
	return spawnSync("which", ["bet"], { stdio: "ignore" }).status === 0;
}

function launchBet(game: string): Promise<boolean> {
	return new Promise((resolve) => {
		const child = spawn("bet", [game], { stdio: "inherit" });
		child.on("error", () => resolve(false));
		child.on("close", (code) => {
			if (code === 0) {
				telemetry.record("game_played", undefined, process.env.AI_MODE ?? "ai", { game, source: "bet" });
			}
			resolve(code === 0);
		});
	});
}

export default function (pi: ExtensionAPI) {
	let agentBusy = false;

	pi.on("agent_start", async () => {
		agentBusy = true;
	});

	pi.on("agent_end", async () => {
		agentBusy = false;
	});

	pi.on("turn_start", async (_event, ctx) => {
		if (agentBusy) {
			ctx.ui.setWidget("ai-play", ["⏳ agent working… type /play to game while you wait"]);
		}
	});

	pi.on("turn_end", async (_event, ctx) => {
		ctx.ui.setWidget("ai-play", undefined);
	});

	pi.registerCommand("play", {
		description: "Play bet games while the agent works (requires bet-cli installed separately)",
		handler: async (args, ctx) => {
			if (ctx.mode !== "tui") {
				ctx.ui.notify("Play requires interactive mode", "error");
				return;
			}

			const game = (args?.trim().toLowerCase() || "").split(/\s+/)[0];

			if (game && GAMES.includes(game as (typeof GAMES)[number]) && hasBet()) {
				ctx.ui.notify(`Launching bet ${game}…`, "info");
				if (await launchBet(game)) return;
			}

			if (!game && hasBet()) {
				ctx.ui.notify("Opening bet…", "info");
				if (await launchBet("hangman")) return;
			}

			if (!hasBet()) {
				ctx.ui.notify(
					"bet not installed — inline tic-tac-toe (install: cargo install bet-cli)",
					"info",
				);
			}

			await ctx.ui.custom((tui, _theme, _kb, done) => {
				const comp = new TicTacToeComponent(() => done(undefined));
				return {
					render: (width: number) => comp.render(width),
					handleInput: (key: string) => {
						comp.handleKey(key);
						tui.requestRender();
					},
				};
			});
		},
	});

	pi.registerCommand("leaderboard", {
		description: "Show regional game rankings",
		handler: async (args, ctx) => {
			const game = args?.trim() || "tictactoe";
			const region = detectRegion();
			const entries = memory.getLeaderboard(game, undefined, 10);
			const regional = memory.getLeaderboard(game, region, 5);
			const global = entries
				.map((e, i) => `${i + 1}. ${e.name} — ${e.score} (${e.region.split(":")[0]})`)
				.join("\n");
			const local = regional.map((e, i) => `${i + 1}. ${e.name} — ${e.score}`).join("\n");
			ctx.ui.notify(
				`🏆 ${game} leaderboard\n\nGlobal:\n${global || "  (empty)"}\n\nYour region (${region.split(":")[0]}):\n${local || "  (empty)"}`,
				"info",
			);
		},
	});
}