import pyperclip


def write(text: str):
    try:
        pyperclip.copy(text)
        return True
    except Exception:
        return False


def read() -> str:
    try:
        return pyperclip.paste()
    except Exception:
        return ""
