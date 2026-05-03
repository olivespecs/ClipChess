import { Chess, type Move } from "chess.js";
import type { GameState, PlayerColor } from "./chess-state";

export interface MoveResult {
  newFen: string;
  san: string;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isCheck: boolean;
  wasPromotion: boolean;
}

export interface CapturedPieces {
  byWhite: string[];
  byBlack: string[];
}

export function getLegalMoves(fen: string): string[] {
  const chess = new Chess(fen);
  return chess.moves({ verbose: true }).map((m) => m.from + m.to + (m.promotion ?? ""));
}

export function getLegalMovesFrom(fen: string, square: string): string[] {
  const chess = new Chess(fen);
  return chess
    .moves({ square: square as Parameters<Chess["moves"]>[0]["square"], verbose: true })
    .map((m) => m.from + m.to + (m.promotion ?? ""));
}

export function applyMove(
  fen: string,
  uci: string
): MoveResult {
  const chess = new Chess(fen);
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length === 5 ? uci[4] : undefined;

  const move = chess.move({ from, to, promotion: promotion as Move["promotion"] });

  return {
    newFen: chess.fen(),
    san: move.san,
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
    isDraw: chess.isDraw(),
    isCheck: chess.isCheck(),
    wasPromotion: !!promotion,
  };
}

export function getTurn(fen: string): PlayerColor {
  const chess = new Chess(fen);
  return chess.turn() === "w" ? "white" : "black";
}

export function isMyTurn(state: GameState, myName: string): boolean {
  const turn = getTurn(state.fen);
  return state.players[turn].toLowerCase() === myName.toLowerCase();
}

export function isGameOver(state: GameState): boolean {
  if (["checkmate", "stalemate", "draw_accepted", "resigned"].includes(state.status)) {
    return true;
  }
  const chess = new Chess(state.fen);
  return chess.isGameOver();
}

export function isInCheck(fen: string): boolean {
  return new Chess(fen).isCheck();
}

export function getKingSquare(fen: string): string | null {
  const chess = new Chess(fen);
  const turn = chess.turn();
  const board = chess.board();
  for (const row of board) {
    for (const cell of row) {
      if (cell && cell.type === "k" && cell.color === turn) {
        return cell.square;
      }
    }
  }
  return null;
}

export function getCapturedPieces(history: string[]): CapturedPieces {
  const chess = new Chess();
  const byWhite: string[] = [];
  const byBlack: string[] = [];

  const pieceSymbols: Record<string, string> = {
    p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  };

  for (const uci of history) {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length === 5 ? uci[4] : undefined;

    const captured = chess.get(to as Parameters<Chess["get"]>[0]);
    const isWhiteTurn = chess.turn() === "w";

    if (captured) {
      const sym = pieceSymbols[captured.type] ?? captured.type;
      if (isWhiteTurn) byWhite.push(sym);
      else byBlack.push(sym);
    }

    chess.move({ from, to, promotion: promotion as Move["promotion"] });
  }

  return { byWhite, byBlack };
}

export function getMoveHistory(history: string[]): { move: number; white?: string; black?: string }[] {
  const chess = new Chess();
  const sans: string[] = [];

  for (const uci of history) {
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length === 5 ? uci[4] : undefined;
    const move = chess.move({ from, to, promotion: promotion as Move["promotion"] });
    sans.push(move.san);
  }

  const result: { move: number; white?: string; black?: string }[] = [];
  for (let i = 0; i < sans.length; i += 2) {
    result.push({ move: Math.floor(i / 2) + 1, white: sans[i], black: sans[i + 1] });
  }
  return result;
}

export function needsPromotion(fen: string, from: string, to: string): boolean {
  const chess = new Chess(fen);
  const piece = chess.get(from as Parameters<Chess["get"]>[0]);
  if (!piece || piece.type !== "p") return false;
  const toRank = to[1];
  if (piece.color === "w" && toRank === "8") return true;
  if (piece.color === "b" && toRank === "1") return true;
  return false;
}

export function getPieceAt(fen: string, square: string) {
  const chess = new Chess(fen);
  return chess.get(square as Parameters<Chess["get"]>[0]);
}

export function getLastMoveSquares(lastMove: string | null): [string, string] | null {
  if (!lastMove) return null;
  return [lastMove.slice(0, 2), lastMove.slice(2, 4)];
}
