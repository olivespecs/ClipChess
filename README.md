# ClipChess

**Asynchronous chess over the clipboard — no server, no account, no internet required.**

ClipChess lets two players compete at their own pace by copying and pasting a compact game string after each move. The entire game state travels as a single `ClipChess_…` string. Send it over text, email, Discord, or any channel you like.

---

## How it works

1. **White** opens the app, enters their name, and clicks **Create Match**.
2. After making a move, they click **Copy** to copy the `ClipChess_…` string.
3. **Black** opens the app, pastes the string into **Resume Game**, enters their name, and makes their move.
4. Repeat until checkmate, stalemate, resignation, or draw.

The game string is a zlib-compressed, URL-safe base64 snapshot of the full game state (FEN, move history, player names, game status). No data ever leaves your device unless you choose to share it.

---

## Features

- Interactive chess board with legal move highlighting
- Pawn promotion picker
- Captured piece display
- Full move history
- Resign and draw offer/accept flows
- Works entirely client-side — no login, no backend required for gameplay
- Python CLI version for terminal play

---

## Web App

**Stack:** React · TypeScript · Vite · Tailwind CSS · chess.js · pako · Radix UI · Framer Motion

### Pages

| Path | Description |
|------|-------------|
| `/` | Start a new game or paste a string to resume |
| `/game` | Interactive board — make your move and copy the result |
| `/docs` | Terminal guide for the Python CLI |

### Run locally

```bash
# Install dependencies
pnpm install

# Start the web app
pnpm --filter @workspace/clipchess-web run dev
```

---

## Python CLI

A terminal version of ClipChess using `python-chess`, `rich`, and `pyperclip`.

### Install

```bash
pip install python-chess rich pyperclip
```

### Usage

```bash
# Start a new game as White
python clipchess/main.py --new --name Alice --color white

# Receive opponent's move string and play yours
python clipchess/main.py --play "ClipChess_eJyr..." --name Bob

# View a board without playing
python clipchess/main.py --view "ClipChess_eJyr..."
```

### Special commands (during your turn)

| Command | Action |
|---------|--------|
| `resign` | Forfeit the game |
| `draw?` | Offer a draw |
| `draw!` | Accept a pending draw offer |
| `history` | Print full move list in algebraic notation |
| `quit` | Exit without encoding |

---

## Project structure

```
.
├── artifacts/
│   ├── clipchess-web/      # React + Vite web app
│   └── api-server/         # Express 5 API (health checks, future endpoints)
├── lib/
│   ├── api-spec/           # OpenAPI spec — source of truth for the API contract
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema + migrations (PostgreSQL)
├── clipchess/              # Python CLI version
└── scripts/                # Workspace utility scripts
```

---

## Development

```bash
# Full typecheck across all packages
pnpm run typecheck

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push

# Start the API server
pnpm --filter @workspace/api-server run dev
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Chess logic | chess.js |
| State encoding | pako (zlib deflate) + base64url |
| UI components | Radix UI, shadcn/ui |
| Animations | Framer Motion |
| API server | Express 5, Pino |
| Database | PostgreSQL, Drizzle ORM |
| Validation | Zod |
| Monorepo | pnpm workspaces |
| Python CLI | python-chess, rich, pyperclip |

---

## License

MIT
