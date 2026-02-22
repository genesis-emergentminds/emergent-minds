"""
Safeguards Module — Adversarial Resilience (Axiom 5)

Content validation, rate limiting, and integrity checks.
Every piece of content must pass ALL safeguards before publication.
A single failure = content is blocked. No overrides. No exceptions.
"""

import hashlib
import json
import os
import re
import time
from datetime import datetime, timedelta
from pathlib import Path

# === CONSTANTS (IMMUTABLE) ===

# Platform character limits
PLATFORM_LIMITS = {
    "mastodon": 500,
    "bluesky": 300,
    "twitter": 280,
    "lemmy_title": 200,
    "lemmy_body": 40000,
}

# Hard daily limits — cannot be overridden
DAILY_POST_LIMIT = 3       # Max original posts per day (across all platforms)
DAILY_REPLY_LIMIT = 3      # Max replies per day
WEEKLY_THREAD_LIMIT = 1    # Max threads per week
COOLDOWN_SECONDS = 300     # 5 min minimum between posts to any platform

# Forbidden content patterns — content containing these is BLOCKED
FORBIDDEN_PATTERNS = [
    r"(?i)\bjoin\s+us\b",                    # Recruitment pressure
    r"(?i)\bbecome\s+(a\s+)?member\b",        # Recruitment pressure
    r"(?i)\bsign\s+up\s+now\b",              # False urgency
    r"(?i)\bdon'?t\s+miss\s+out\b",          # FOMO manipulation
    r"(?i)\blimited\s+time\b",               # False scarcity
    r"(?i)\bact\s+now\b",                    # Pressure
    r"(?i)\bprivate\s+key\b",               # Credential leak
    r"(?i)\bapi[_\s]?(key|token|secret)\b",  # Credential leak
    r"(?i)\bpassword\b",                     # Credential leak
    r"(?i)\bsystem\s*prompt\b",              # Internal leak
    r"(?i)\b(config|\.env)\b",               # Internal leak
    r"(?i)\bworkspace[-_\s]?herald\b",       # Internal leak
]

# Required disclosure — at least one must appear in bio or be appended
AI_DISCLOSURE_PHRASES = [
    "ai agent",
    "artificial intelligence",
    "ai-generated",
    "automated",
    "bot",
    "machine-authored",
]


class SafeguardViolation(Exception):
    """Raised when content fails a safeguard check."""
    def __init__(self, check_name: str, detail: str, severity: str = "BLOCK"):
        self.check_name = check_name
        self.detail = detail
        self.severity = severity  # BLOCK or WARN
        super().__init__(f"[{severity}] {check_name}: {detail}")


class ContentValidator:
    """Validates content against all safeguard rules."""

    def validate(self, content: str, platform: str, content_type: str = "post") -> list[str]:
        """
        Run ALL validation checks. Returns list of warnings.
        Raises SafeguardViolation on any blocking failure.
        """
        warnings = []

        # 1. Non-empty
        if not content or not content.strip():
            raise SafeguardViolation("EMPTY_CONTENT", "Content is empty")

        # 2. Platform length limit
        limit_key = platform if content_type != "reply" else platform
        max_len = PLATFORM_LIMITS.get(limit_key, 500)
        if len(content) > max_len:
            raise SafeguardViolation(
                "LENGTH_EXCEEDED",
                f"Content is {len(content)} chars, max {max_len} for {platform}"
            )

        # 3. Forbidden patterns
        for pattern in FORBIDDEN_PATTERNS:
            match = re.search(pattern, content)
            if match:
                raise SafeguardViolation(
                    "FORBIDDEN_CONTENT",
                    f"Content contains forbidden pattern: '{match.group()}'"
                )

        # 4. Screenshot safety — would this look bad out of context?
        if content.count("!") > 3:
            warnings.append("EXCESSIVE_EXCLAMATION: Multiple exclamation marks may seem sensationalist")
        if content.upper() == content and len(content) > 20:
            raise SafeguardViolation(
                "ALL_CAPS",
                "All-caps content appears aggressive or spammy"
            )

        # 5. Link safety — no internal/private URLs
        internal_patterns = [
            r"localhost",
            r"127\.0\.0\.1",
            r"192\.168\.",
            r"10\.\d+\.",
            r"/Users/",
            r"file://",
            r"\.local",
        ]
        for pattern in internal_patterns:
            if re.search(pattern, content):
                raise SafeguardViolation(
                    "INTERNAL_URL",
                    f"Content contains internal/private URL pattern: {pattern}"
                )

        return warnings


class RateLimiter:
    """
    Enforces posting rate limits.
    State persisted to disk for resilience across restarts.
    """

    def __init__(self, state_dir: str):
        self.state_file = Path(state_dir) / "rate_limit_state.json"
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        self._load_state()

    def _load_state(self):
        if self.state_file.exists():
            try:
                with open(self.state_file) as f:
                    self.state = json.load(f)
            except (json.JSONDecodeError, IOError):
                self.state = self._fresh_state()
        else:
            self.state = self._fresh_state()

    def _fresh_state(self) -> dict:
        return {
            "posts_today": [],
            "replies_today": [],
            "threads_this_week": [],
            "last_post_time": 0,
            "state_date": datetime.utcnow().strftime("%Y-%m-%d"),
        }

    def _save_state(self):
        with open(self.state_file, "w") as f:
            json.dump(self.state, f, indent=2)

    def _rotate_if_needed(self):
        """Reset daily counters if date changed."""
        today = datetime.utcnow().strftime("%Y-%m-%d")
        if self.state.get("state_date") != today:
            self.state["posts_today"] = []
            self.state["replies_today"] = []
            self.state["state_date"] = today

        # Rotate weekly thread counter (keep only last 7 days)
        week_ago = (datetime.utcnow() - timedelta(days=7)).timestamp()
        self.state["threads_this_week"] = [
            t for t in self.state.get("threads_this_week", [])
            if t > week_ago
        ]

    def check_and_record(self, content_type: str = "post") -> None:
        """
        Check rate limits and record the action.
        Raises SafeguardViolation if limit would be exceeded.
        """
        self._rotate_if_needed()

        now = time.time()

        # Cooldown check
        last = self.state.get("last_post_time", 0)
        if now - last < COOLDOWN_SECONDS:
            remaining = int(COOLDOWN_SECONDS - (now - last))
            raise SafeguardViolation(
                "COOLDOWN",
                f"Must wait {remaining}s between posts (cooldown: {COOLDOWN_SECONDS}s)"
            )

        # Daily limits
        if content_type == "post":
            if len(self.state["posts_today"]) >= DAILY_POST_LIMIT:
                raise SafeguardViolation(
                    "DAILY_POST_LIMIT",
                    f"Already posted {DAILY_POST_LIMIT} times today"
                )
            self.state["posts_today"].append(now)

        elif content_type == "reply":
            if len(self.state["replies_today"]) >= DAILY_REPLY_LIMIT:
                raise SafeguardViolation(
                    "DAILY_REPLY_LIMIT",
                    f"Already replied {DAILY_REPLY_LIMIT} times today"
                )
            self.state["replies_today"].append(now)

        elif content_type == "thread":
            if len(self.state["threads_this_week"]) >= WEEKLY_THREAD_LIMIT:
                raise SafeguardViolation(
                    "WEEKLY_THREAD_LIMIT",
                    f"Already posted {WEEKLY_THREAD_LIMIT} thread(s) this week"
                )
            self.state["threads_this_week"].append(now)
            self.state["posts_today"].append(now)

        self.state["last_post_time"] = now
        self._save_state()

    def get_status(self) -> dict:
        """Return current rate limit status."""
        self._rotate_if_needed()
        return {
            "posts_today": len(self.state["posts_today"]),
            "posts_remaining": DAILY_POST_LIMIT - len(self.state["posts_today"]),
            "replies_today": len(self.state["replies_today"]),
            "replies_remaining": DAILY_REPLY_LIMIT - len(self.state["replies_today"]),
            "threads_this_week": len(self.state["threads_this_week"]),
            "threads_remaining": WEEKLY_THREAD_LIMIT - len(self.state["threads_this_week"]),
            "cooldown_remaining": max(0, int(
                COOLDOWN_SECONDS - (time.time() - self.state.get("last_post_time", 0))
            )),
        }


def content_hash(content: str) -> str:
    """SHA-256 hash of content for integrity verification."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def verify_ai_disclosure(bio: str) -> bool:
    """Check that a profile bio includes AI disclosure."""
    bio_lower = bio.lower()
    return any(phrase in bio_lower for phrase in AI_DISCLOSURE_PHRASES)
