import argparse
import sys
import chess

from state import encode, decode, create_fresh_state, validate_payload
from rules import get_turn, is_game_over, is_checkmate, is_stalemate, apply_move
import board
import ui
import clipboard


def parse_args():
    parser = argparse.ArgumentParser(
        description="ClipChess — Multiplayer chess via clipboard",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Start a new game as White:
    python main.py --new --name Alice --color white

  Receive and play a move:
    python main.py --play "ClipChess_eJyr..." --name Bob

  Show the board from a string without playing:
    python main.py --view "ClipChess_eJyr..."
        """
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--new", action="store_true", help="Start a new game")
    group.add_argument("--play", metavar="STRING", help="Receive opponent move and play yours")
    group.add_argument("--view", metavar="STRING", help="View board state without playing")

    parser.add_argument("--name", required=False, help="Your player name")
    parser.add_argument("--color", choices=["white", "black"], default="white",
                        help="Your color (only for --new, default: white)")
    return parser.parse_args()


def my_turn(state: dict, name: str) -> bool:
    players = state.get("players", {})
    turn = get_turn(state["fen"])
    return players.get(turn, "").lower() == name.lower()


def game_over(state: dict) -> bool:
    status = state.get("status", "active")
    if status in ("checkmate", "stalemate", "draw_accepted", "resigned"):
        return True
    return is_game_over(state["fen"])


def handle_new(args):
    name = args.name or "Player"
    color = args.color or "white"
    state = create_fresh_state(name, color)
    payload = encode(state)

    copied = clipboard.write(payload)
    if not copied:
        ui.show_error("Clipboard unavailable — copy the string below manually.")

    ui.show_new_game_banner(state["players"], payload)

    if not copied:
        ui.show_full_payload(payload)


def handle_play(args):
    raw_payload = args.play
    name = args.name or "Player"

    try:
        state = decode(raw_payload)
        validate_payload(state)
    except Exception as e:
        ui.show_error(f"Could not decode game string: {e}")
        sys.exit(1)

    board.render(state)

    if game_over(state):
        ui.show_result(state)
        return

    if not my_turn(state, name):
        ui.show_waiting(state)
        return

    move = ui.prompt_move(state)

    if move == "quit":
        ui.console.print("[grey50]Quit. Game state unchanged.[/grey50]")
        return

    if move == "resign":
        players = state.get("players", {})
        turn_color = get_turn(state["fen"])
        resigning_name = players.get(turn_color, name)
        state["status"] = "resigned"
        state["message"] = f"{resigning_name} resigned"
        payload = encode(state)
        copied = clipboard.write(payload)
        if not copied:
            ui.show_error("Clipboard unavailable — copy the string manually.")
        ui.show_copy_confirmation(payload)
        if not copied:
            ui.show_full_payload(payload)
        ui.show_result(state)
        return

    if move == "draw?":
        players = state.get("players", {})
        turn_color = get_turn(state["fen"])
        offerer_name = players.get(turn_color, name)
        state["status"] = "draw_offered"
        state["message"] = offerer_name
        payload = encode(state)
        copied = clipboard.write(payload)
        if not copied:
            ui.show_error("Clipboard unavailable — copy the string manually.")
        ui.show_copy_confirmation(payload)
        if not copied:
            ui.show_full_payload(payload)
        return

    if move == "draw!":
        state["status"] = "draw_accepted"
        state["message"] = "Draw agreed"
        payload = encode(state)
        copied = clipboard.write(payload)
        if not copied:
            ui.show_error("Clipboard unavailable — copy the string manually.")
        ui.show_copy_confirmation(payload)
        if not copied:
            ui.show_full_payload(payload)
        ui.show_result(state)
        return

    new_fen = apply_move(state["fen"], move)
    state["history"].append(move)
    state["last_move"] = move
    state["fen"] = new_fen
    state["message"] = ""

    if is_checkmate(new_fen):
        state["status"] = "checkmate"
    elif is_stalemate(new_fen):
        state["status"] = "stalemate"
    else:
        state["status"] = "active"

    board.render(state)

    payload = encode(state)
    copied = clipboard.write(payload)
    if not copied:
        ui.show_error("Clipboard unavailable — copy the string manually.")

    ui.show_copy_confirmation(payload)
    if not copied:
        ui.show_full_payload(payload)

    if game_over(state):
        ui.show_result(state)


def handle_view(args):
    raw_payload = args.view
    try:
        state = decode(raw_payload)
        validate_payload(state)
    except Exception as e:
        ui.show_error(f"Could not decode game string: {e}")
        sys.exit(1)

    board.render(state)

    if game_over(state):
        ui.show_result(state)


def main():
    args = parse_args()

    if args.new:
        handle_new(args)
    elif args.play:
        handle_play(args)
    elif args.view:
        handle_view(args)


if __name__ == "__main__":
    main()
