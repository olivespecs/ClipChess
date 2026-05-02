import json
import zlib
import base64
import time


def encode(state: dict) -> str:
    raw = json.dumps(state, separators=(',', ':'))
    compressed = zlib.compress(raw.encode(), level=9)
    b64 = base64.urlsafe_b64encode(compressed).decode()
    return "ClipChess_" + b64


def decode(payload: str) -> dict:
    if payload.startswith("ClipChess_"):
        payload = payload[len("ClipChess_"):]
    compressed = base64.urlsafe_b64decode(payload.encode())
    raw = zlib.decompress(compressed).decode()
    return json.loads(raw)


def create_fresh_state(name: str, color: str) -> dict:
    players = {}
    if color == "white":
        players["white"] = name
        players["black"] = "Opponent"
    else:
        players["white"] = "Opponent"
        players["black"] = name

    return {
        "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "history": [],
        "players": players,
        "last_move": None,
        "status": "active",
        "message": "",
        "created_at": int(time.time()),
    }


def validate_payload(state: dict):
    required = ["fen", "history", "players", "last_move", "status", "created_at"]
    for key in required:
        if key not in state:
            raise ValueError(f"Missing key in state: {key}")
