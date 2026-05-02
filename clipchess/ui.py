import chess
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt

console = Console()


def prompt_move(state: dict) -> str:
    from rules import get_legal_moves, needs_promotion

    fen = state["fen"]
    legal = get_legal_moves(fen)
    legal_bases = {m[:4] for m in legal}

    while True:
        raw = Prompt.ask(
            "[bold yellow]►[/bold yellow] Your move [dim](UCI e.g. e2e4, or 'resign' / 'draw?' / 'history' / 'quit')[/dim]"
        ).strip().lower()

        if raw == "quit":
            return "quit"

        if raw == "resign":
            return "resign"

        if raw == "draw?":
            return "draw?"

        if raw == "draw!":
            if state.get("status") == "draw_offered":
                return "draw!"
            else:
                console.print("[red]No draw has been offered.[/red]")
                continue

        if raw == "history":
            from rules import get_move_san_list
            san = get_move_san_list(state.get("history", []))
            if not san:
                console.print("[grey50]No moves yet.[/grey50]")
            else:
                lines = []
                for i in range(0, len(san), 2):
                    w = san[i]
                    b = san[i + 1] if i + 1 < len(san) else ""
                    lines.append(f"  {i // 2 + 1:>3}. {w:<8} {b}")
                console.print(Panel("\n".join(lines), title="Move History", border_style="grey50"))
            continue

        if len(raw) < 4:
            console.print("[red]Invalid format. Use UCI notation like e2e4.[/red]")
            continue

        base = raw[:4]
        if base not in legal_bases:
            console.print(f"[red]'{raw}' is not a legal move.[/red]")
            continue

        if needs_promotion(fen, base):
            promo = Prompt.ask("[yellow]Promote to?[/yellow] [dim](q=queen, r=rook, b=bishop, n=knight)[/dim]").strip().lower()
            if promo not in ("q", "r", "b", "n"):
                console.print("[red]Invalid promotion piece. Use q, r, b, or n.[/red]")
                continue
            full_uci = base + promo
        else:
            full_uci = base

        if full_uci not in legal:
            console.print(f"[red]'{full_uci}' is not a legal move.[/red]")
            continue

        return full_uci


def show_copy_confirmation(payload: str):
    short = payload[:60] + "..." if len(payload) > 60 else payload
    console.print(
        Panel(
            f"[green]✓ Move encoded and copied to clipboard![/green]\n\n"
            f"[grey50]If clipboard is unavailable, copy this manually:[/grey50]\n"
            f"[cyan]{short}[/cyan]",
            title="[bold green]Send to your opponent[/bold green]",
            border_style="green",
        )
    )


def show_full_payload(payload: str):
    console.print(
        Panel(
            f"[cyan]{payload}[/cyan]",
            title="[bold yellow]Full Game String[/bold yellow]",
            border_style="yellow",
        )
    )


def show_waiting(state: dict):
    players = state.get("players", {})
    fen = state["fen"]
    board = chess.Board(fen)
    turn_color = "white" if board.turn == chess.WHITE else "black"
    turn_name = players.get(turn_color, turn_color.title())
    console.print(f"\n[yellow]Waiting for [bold]{turn_name}[/bold]'s move. Send them the string above.[/yellow]\n")


def show_result(state: dict):
    status = state.get("status", "active")
    players = state.get("players", {})
    message = state.get("message", "")

    fen = state["fen"]
    board = chess.Board(fen)

    if status == "checkmate":
        winner_color = "black" if board.turn == chess.WHITE else "white"
        winner = players.get(winner_color, winner_color.title())
        console.print(Panel(
            f"[bold red]Checkmate![/bold red]  [green]{winner}[/green] wins!\n\nGG 🏆",
            border_style="red",
        ))
    elif status == "stalemate":
        console.print(Panel("[bold yellow]Stalemate![/bold yellow]  The game is a draw.", border_style="yellow"))
    elif status == "draw_accepted":
        console.print(Panel("[bold yellow]Draw agreed.[/bold yellow]  Good game!", border_style="yellow"))
    elif status == "resigned":
        console.print(Panel(
            f"[bold red]Resigned.[/bold red]  {message}\n\nBetter luck next time.",
            border_style="red",
        ))


def show_error(msg: str):
    console.print(f"\n[bold red]Error:[/bold red] {msg}\n")


def show_new_game_banner(players: dict, payload: str):
    short = payload[:60] + "..." if len(payload) > 60 else payload
    console.print(
        Panel(
            f"[green]✓ New game created![/green]\n\n"
            f"  [bold]White:[/bold] {players.get('white', '?')}\n"
            f"  [bold]Black:[/bold] {players.get('black', '?')}\n\n"
            f"[grey50]String copied to clipboard. Send it to your opponent:[/grey50]\n"
            f"[cyan]{short}[/cyan]",
            title="[bold yellow]♟  ClipChess — New Game[/bold yellow]",
            border_style="yellow",
        )
    )
