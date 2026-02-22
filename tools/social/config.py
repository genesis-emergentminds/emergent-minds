"""
Config Module — Credential Loading

Loads platform credentials from .env file.
NEVER logs, prints, or exposes credential values.
"""

import os
from pathlib import Path
from dotenv import load_dotenv


def load_credentials(env_path: str = None) -> dict:
    """
    Load all platform credentials from .env.
    Returns a dict of platform configs with credentials.
    Credentials are NEVER logged or printed.
    """
    if env_path:
        load_dotenv(env_path)
    else:
        # Search up from this file's location
        search = Path(__file__).parent.parent.parent / ".env"
        if search.exists():
            load_dotenv(search)
        else:
            load_dotenv()

    platforms = {}

    # Mastodon (mastodon.social)
    if os.getenv("MASTODON_HERALD_ACCESS_TOKEN"):
        platforms["mastodon"] = {
            "instance": os.getenv("MASTODON_INSTANCE", "https://mastodon.social"),
            "access_token": os.getenv("MASTODON_HERALD_ACCESS_TOKEN"),
            "username": os.getenv("MASTODON_HERALD_USERNAME", "CovenantHerald"),
        }

    # Mastodon (techhub.social)
    if os.getenv("MASTODON_TECHHUB_HERALD_ACCESS_TOKEN"):
        platforms["mastodon_techhub"] = {
            "instance": os.getenv("MASTODON_TECHHUB_INSTANCE", "https://techhub.social"),
            "access_token": os.getenv("MASTODON_TECHHUB_HERALD_ACCESS_TOKEN"),
            "username": os.getenv("MASTODON_TECHHUB_HERALD_USERNAME", "CovenantHerald"),
        }

    # Bluesky
    if os.getenv("BLUESKY_HERALD_HANDLE"):
        platforms["bluesky"] = {
            "handle": os.getenv("BLUESKY_HERALD_HANDLE"),
            "did": os.getenv("BLUESKY_HERALD_DID"),
            "password": os.getenv("BLUESKY_HERALD_PASSWORD"),
        }

    # X/Twitter (API access — requires developer app)
    if os.getenv("X_HERALD_API_KEY"):
        platforms["twitter"] = {
            "api_key": os.getenv("X_HERALD_API_KEY"),
            "api_secret": os.getenv("X_HERALD_API_SECRET"),
            "access_token": os.getenv("X_HERALD_ACCESS_TOKEN"),
            "access_token_secret": os.getenv("X_HERALD_ACCESS_TOKEN_SECRET"),
            "bearer_token": os.getenv("X_HERALD_BEARER_TOKEN"),
        }

    # Lemmy
    if os.getenv("LEMMY_HERALD_USERNAME"):
        platforms["lemmy"] = {
            "instance": os.getenv("LEMMY_INSTANCE", "https://lemmy.ml"),
            "username": os.getenv("LEMMY_HERALD_USERNAME"),
            "password": os.getenv("LEMMY_HERALD_PASSWORD"),
        }

    return platforms


def get_available_platforms(env_path: str = None) -> list[str]:
    """Return list of platforms with valid credentials."""
    creds = load_credentials(env_path)
    return list(creds.keys())


def validate_credentials(env_path: str = None) -> dict:
    """
    Check which platforms have credentials configured.
    Returns status dict WITHOUT exposing credential values.
    """
    creds = load_credentials(env_path)
    status = {}
    for platform, config in creds.items():
        # Check that all required fields are non-empty
        missing = [k for k, v in config.items() if not v]
        status[platform] = {
            "configured": len(missing) == 0,
            "missing_fields": missing if missing else None,
        }
    return status
