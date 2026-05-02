# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

---

## ClipChess

Terminal multiplayer chess via clipboard. No server, no account, no internet required — players share game state as a compact base64 string after each move.

### Location
`clipchess/` — standalone Python project

### Stack
- **Python 3.11** (via uv / `.pythonlibs`)
- **python-chess** — chess logic and legal move validation
- **rich** — terminal board rendering with Unicode pieces
- **pyperclip** — cross-platform clipboard read/write
- **base64 + zlib** — compress + encode game state (~230 chars per turn)

### Files
- `main.py` — entry point, argument parsing, game loop
- `board.py` — rich terminal board renderer (colored squares, last-move highlight, check indicator)
- `state.py` — encode/decode game state to/from compressed base64
- `rules.py` — thin python-chess wrapper (legal moves, apply move, game-over detection)
- `clipboard.py` — read/write clipboard with headless fallback
- `ui.py` — prompts, move input, resign/draw flows, copy confirmation

### Usage
```bash
# Start a new game as White
python clipchess/main.py --new --name Alice --color white

# Receive opponent's move and play yours
python clipchess/main.py --play "ClipChess_eJyr..." --name Bob

# View a board without playing
python clipchess/main.py --view "ClipChess_eJyr..."
```

### Special move commands
- `resign` — forfeit the game
- `draw?` — offer a draw
- `draw!` — accept a pending draw offer
- `history` — print full move list in algebraic notation
- `quit` — exit without encoding

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
