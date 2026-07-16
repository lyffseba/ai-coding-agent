# Architecture

**ai** is a unified pi fork. Everything lives in this repo except bet.

```mermaid
flowchart TB
    subgraph ai_repo [lyffseba/ai — this repo]
        cli[ai / AI binaries]
        pi_core[pi agent harness]
        ext[packages/coding-agent/ai/extensions]
        mem[memory layer]
        tel[telemetry layer]
        play_ext[play extension]
    end

    subgraph data [~/.ai]
        agent[agent/]
        memory[memory/]
        telemetry[telemetry/]
    end

    subgraph bet_repo [lyffseba/bet — separate, untouched]
        bet_cli[bet CLI]
    end

    cli --> pi_core
    pi_core --> ext
    ext --> mem --> memory
    ext --> tel --> telemetry
    ext --> play_ext
    play_ext -.spawn.-> bet_cli
    pi_core --> agent
```

## Bundled extensions

| File | Role |
|------|------|
| `mode.ts` | `ai` / `AI` / `--fast` system prompts |
| `memory.ts` | Cross-session memory + `/memory` |
| `telemetry.ts` | Local events + `/telemetry` |
| `play.ts` | `/play`, `/leaderboard` → spawns bet if installed |

## What is NOT in this repo

| Project | Relationship |
|---------|--------------|
| bet | Spawned by `/play`. Never merged. |
| pi-upstream | Reference only |
| tyypin (Rust) | Superseded experiment |