import chess
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.columns import Columns
from rich.text import Text
from rich import box
from datetime import datetime

console = Console()

PIECE_SYMBOLS = {
    "R": "♖", "N": "♘", "B": "♗", "Q": "♕", "K": "♔", "P": "♙",
    "r": "♜", "n": "♞", "b": "♝", "q": "♛", "k": "♚", "p": "♟",
}

LIGHT_SQUARE = "#eeeed2"
DARK_SQUARE  = "#769656"
HIGHLIGHT    = "#f6f669"
CHECK_SQ     = "#cc0000"


def _square_bg(file: int, rank: int, highlighted: set, check_sq: int | None) -> str:
    sq = chess.square(file, rank)
    if check_sq is not None and sq == check_sq:
        return CHECK_SQ
    if sq in highlighted:
        return HIGHLIGHT
    if (file + rank) % 2 == 0:
        return DARK_SQUARE
    return LIGHT_SQUARE


def _piece_fg(piece: chess.Piece | None) -> str:
    if piece is None:
        return "white"
    return "bright_white" if piece.color == chess.WHITE else "grey15"


def render(state: dict):
    fen = state["fen"]
    board = chess.Board(fen)
    history = state.get("history", [])
    last_move_uci = state.get("last_move")
    players = state.get("players", {"white": "White", "black": "Black"})
    status = state.get("status", "active")
    message = state.get("message", "")
    created_at = state.get("created_at", 0)

    highlighted = set()
    if last_move_uci:
        try:
            mv = chess.Move.from_uci(last_move_uci)
            highlighted = {mv.from_square, mv.to_square}
        except Exception:
            pass

    check_sq = None
    if board.is_check():
        king_sq = board.king(board.turn)
        check_sq = king_sq

    turn_color = "white" if board.turn == chess.WHITE else "black"
    turn_name = players.get(turn_color, turn_color.title())

    move_num = len(history)

    created_str = datetime.fromtimestamp(created_at).strftime("%Y-%m-%d") if created_at else ""

    grid = Table.grid(padding=0)
    grid.add_column()
    grid.add_column(justify="left")

    board_table = Table(
        show_header=False,
        show_edge=False,
        padding=(0, 0),
        box=None,
    )
    board_table.add_column(width=2, justify="right")
    for _ in range(8):
        board_table.add_column(width=3, justify="center")

    for rank in range(7, -1, -1):
        row_cells = [Text(f" {rank + 1} ", style="bold grey70")]
        for file in range(8):
            sq = chess.square(file, rank)
            piece = board.piece_at(sq)
            bg = _square_bg(file, rank, highlighted, check_sq)
            fg = _piece_fg(piece)
            symbol = PIECE_SYMBOLS.get(piece.symbol(), " ") if piece else " "
            cell = Text(f" {symbol} ", style=f"{fg} on {bg}")
            row_cells.append(cell)
        board_table.add_row(*row_cells)

    file_labels_cells = [Text("   ", style="")]
    for f in "abcdefgh":
        file_labels_cells.append(Text(f" {f} ", style="bold grey70"))
    board_table.add_row(*file_labels_cells)

    from rules import get_captured_pieces, get_move_san_list
    captures = get_captured_pieces(history)
    san_moves = get_move_san_list(history)

    recent = san_moves[-10:]
    history_lines = []
    start_idx = max(0, len(san_moves) - 10)
    for i in range(0, len(recent), 2):
        move_no = (start_idx + i) // 2 + 1
        w = recent[i] if i < len(recent) else ""
        b = recent[i + 1] if i + 1 < len(recent) else ""
        history_lines.append(f"[grey70]{move_no:>3}.[/grey70]  [bright_white]{w:<8}[/bright_white] [grey50]{b}[/grey50]")

    side_lines = []
    side_lines.append(f"[bold yellow]ClipChess[/bold yellow]  [grey50]{created_str}[/grey50]")
    side_lines.append("")
    side_lines.append(f"[bold]♔ White:[/bold] {players.get('white', '?')}")
    side_lines.append(f"[bold]♚ Black:[/bold] {players.get('black', '?')}")
    side_lines.append("")

    if status == "active":
        if board.is_check():
            side_lines.append(f"[bold red]CHECK![/bold red]  [yellow]{turn_name}[/yellow] to move")
        else:
            side_lines.append(f"Move [cyan]{move_num + 1}[/cyan] · [yellow]{turn_name}[/yellow] to play")
    elif status == "checkmate":
        winner_color = "black" if board.turn == chess.WHITE else "white"
        winner = players.get(winner_color, winner_color.title())
        side_lines.append(f"[bold red]CHECKMATE[/bold red] · [green]{winner}[/green] wins!")
    elif status == "stalemate":
        side_lines.append("[bold yellow]STALEMATE[/bold yellow] · Draw")
    elif status == "draw_offered":
        offerer = state.get("message", "Someone")
        side_lines.append(f"[yellow]Draw offered[/yellow] by {offerer}")
        side_lines.append("[dim]Type 'draw!' to accept[/dim]")
    elif status == "draw_accepted":
        side_lines.append("[bold yellow]DRAW[/bold yellow] · Agreed by both players")
    elif status == "resigned":
        side_lines.append(f"[bold red]RESIGNED[/bold red] · {message}")

    side_lines.append("")
    side_lines.append("[bold]Last move:[/bold]")
    if last_move_uci:
        last_player = players.get(
            "black" if turn_color == "white" else "white", "?"
        )
        if san_moves:
            side_lines.append(f"  [cyan]{san_moves[-1]}[/cyan]  [grey50]({last_player})[/grey50]")
        else:
            side_lines.append(f"  [cyan]{last_move_uci}[/cyan]  [grey50]({last_player})[/grey50]")
    else:
        side_lines.append("  [grey50]none yet[/grey50]")

    side_lines.append("")
    white_caps = " ".join(captures["white"]) or "—"
    black_caps = " ".join(captures["black"]) or "—"
    side_lines.append(f"[bold]♟ Taken by White:[/bold] {white_caps}")
    side_lines.append(f"[bold]♙ Taken by Black:[/bold] {black_caps}")

    if history_lines:
        side_lines.append("")
        side_lines.append("[bold]Move history:[/bold]")
        side_lines.extend(history_lines)

    side_text = "\n".join(side_lines)

    console.print()
    console.print(Panel(
        Columns([board_table, Text("   "), Panel(side_text, border_style="grey30", padding=(0, 1))]),
        title="[bold yellow]♟  ClipChess[/bold yellow]",
        border_style="yellow",
        padding=(0, 1),
    ))
    console.print()
