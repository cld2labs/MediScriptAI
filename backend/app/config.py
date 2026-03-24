"""Runtime configuration from process environment (no .env files in the service)."""

import os


def openai_api_key() -> str | None:
    return os.environ.get("OPENAI_API_KEY")


def openai_whisper_model() -> str:
    return os.environ.get("OPENAI_WHISPER_MODEL", "whisper-1")


def openai_chat_model() -> str:
    return os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o")


def listen_port() -> int:
    return int(os.environ.get("PORT", "8000"))
