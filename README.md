# ai

**Unified engineer-first agent CLI** — a [pi](https://github.com/earendil-works/pi) fork with memory, play-while-you-wait, and telemetry.

> **Note:** The TypeScript agent monorepo lives at [`lyffseba/ai-coding-agent`](https://github.com/lyffseba/ai-coding-agent). The separate [`lyffseba/ai`](https://github.com/lyffseba/ai) repository is a different (Python) orchestration project.

One project. One name. [bet](https://github.com/lyffseba/bet) stays a separate repo — ai spawns it when you `/play`.

> First do it, then do it right, then do it better.

## Commands

| Binary | Mode |
|--------|------|
| `ai` | Default engineer-first agent |
| `AI` | Primary powerful agent (caps) |
| `ai --fast` | Fast lightweight helper (nocaps) |

## Quick start

```bash
git clone https://github.com/lyffseba/ai-coding-agent.git
cd ai
npm install --ignore-scripts
npm run build
./ai-test.sh
```

Install globally:

```bash
npm install -g @lyffseba/ai-coding-agent
ai
```

## Built-in commands

```
/play [game]      bet games (if installed) or inline tic-tac-toe
/leaderboard      regional rankings
/memory           persistent memory
/telemetry        local telemetry status
```

Install bet separately (untouched repo):

```bash
cargo install --path /path/to/bet
```

## Data layout

| Path | Purpose |
|------|---------|
| `~/.ai/agent/` | Agent config, sessions, auth (pi-compatible layout) |
| `~/.ai/memory/` | Persistent user memory |
| `~/.ai/telemetry/` | Local event log |

Override: `AI_HOME=~/.ai`

## Architecture

```
ai/                          ← this repo (pi fork)
packages/coding-agent/ai/    ← bundled extensions (memory, telemetry, play, mode)
bet/                         ← separate repo, never merged
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/PHILOSOPHY.md](docs/PHILOSOPHY.md).

## Lineage

- [pi](https://github.com/earendil-works/pi) — agent harness (forked)
- [bet](https://github.com/lyffseba/bet) — optional play layer
- [witness](https://github.com/lyffseba/witness) — operating philosophy

## Community

- GitHub: [lyffseba/ai-coding-agent](https://github.com/lyffseba/ai-coding-agent)
- Discord: [BET community](https://discord.gg/MF6fMFURyC)

## License

MIT (inherited from pi)