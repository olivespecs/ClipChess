import { deflate, inflate } from "pako";

export type GameStatus =
  | "active"
  | "checkmate"
  | "stalemate"
  | "draw_offered"
  | "draw_accepted"
  | "resigned";

export type PlayerColor = "white" | "black";

export interface GameState {
  fen: string;
  history: string[];
  players: {
    white: string;
    black: string;
  };
  last_move: string | null;
  status: GameStatus;
  message: string;
  created_at: number;
}

const PREFIX = "ClipChess_";

export function encodeState(state: GameState): string {
  const raw = JSON.stringify(state);
  const compressed = deflate(raw, { level: 9 });
  const b64 = btoa(String.fromCharCode(...compressed))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return PREFIX + b64;
}

export function decodeState(payload: string): GameState {
  const stripped = payload.startsWith(PREFIX)
    ? payload.slice(PREFIX.length)
    : payload;
  const b64 = stripped.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const raw = inflate(bytes, { to: "string" });
  return JSON.parse(raw) as GameState;
}

export function createFreshState(
  myName: string,
  myColor: PlayerColor
): GameState {
  const players =
    myColor === "white"
      ? { white: myName, black: "Opponent" }
      : { white: "Opponent", black: myName };

  return {
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    history: [],
    players,
    last_move: null,
    status: "active",
    message: "",
    created_at: Math.floor(Date.now() / 1000),
  };
}

export function isValidPayload(payload: string): boolean {
  try {
    const state = decodeState(payload);
    return (
      typeof state.fen === "string" &&
      Array.isArray(state.history) &&
      typeof state.players === "object"
    );
  } catch {
    return false;
  }
}
