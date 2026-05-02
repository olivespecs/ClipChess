import chess


def get_legal_moves(fen: str) -> list:
    board = chess.Board(fen)
    return [m.uci() for m in board.legal_moves]


def apply_move(fen: str, uci: str) -> str:
    board = chess.Board(fen)
    board.push_uci(uci)
    return board.fen()


def is_checkmate(fen: str) -> bool:
    return chess.Board(fen).is_checkmate()


def is_stalemate(fen: str) -> bool:
    return chess.Board(fen).is_stalemate()


def is_check(fen: str) -> bool:
    return chess.Board(fen).is_check()


def is_game_over(fen: str) -> bool:
    return chess.Board(fen).is_game_over()


def get_turn(fen: str) -> str:
    board = chess.Board(fen)
    return "white" if board.turn == chess.WHITE else "black"


def get_captured_pieces(history: list) -> dict:
    board = chess.Board()
    captures = {"white": [], "black": []}
    piece_symbols = {
        chess.PAWN: "♟", chess.ROOK: "♜", chess.KNIGHT: "♞",
        chess.BISHOP: "♝", chess.QUEEN: "♛", chess.KING: "♚"
    }
    for uci in history:
        move = chess.Move.from_uci(uci)
        captured = board.piece_at(move.to_square)
        if captured:
            captor_color = "white" if board.turn == chess.WHITE else "black"
            captures[captor_color].append(piece_symbols[captured.piece_type])
        board.push(move)
    return captures


def get_move_san_list(history: list) -> list:
    board = chess.Board()
    san_moves = []
    for uci in history:
        move = chess.Move.from_uci(uci)
        san_moves.append(board.san(move))
        board.push(move)
    return san_moves


def needs_promotion(fen: str, uci: str) -> bool:
    board = chess.Board(fen)
    move = chess.Move.from_uci(uci)
    piece = board.piece_at(move.from_square)
    if piece and piece.piece_type == chess.PAWN:
        rank = chess.square_rank(move.to_square)
        if rank == 7 or rank == 0:
            return True
    return False
