"""
Audit Module — Transparency (Core Value)

Every publication action is logged with full traceability.
Audit logs are append-only. Deletion of audit entries is a constraint violation.
"""

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path


class AuditLogger:
    """
    Append-only audit log for all publishing actions.

    Each entry records:
    - Timestamp (UTC)
    - Action type (post, reply, thread, delete, failure)
    - Platform
    - Content hash (SHA-256)
    - Content preview (first 100 chars)
    - Result (success, failure, blocked)
    - Post URL/ID (if successful)
    - Approval reference (who approved, when)
    - Safeguard warnings (if any)
    """

    def __init__(self, audit_dir: str):
        self.audit_dir = Path(audit_dir)
        self.audit_dir.mkdir(parents=True, exist_ok=True)

    def _log_file(self) -> Path:
        """One file per day for manageable sizes."""
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return self.audit_dir / f"audit-{date_str}.jsonl"

    def log(
        self,
        action: str,
        platform: str,
        content: str,
        result: str,
        post_url: str = None,
        post_id: str = None,
        approval_ref: str = None,
        error: str = None,
        warnings: list[str] = None,
        dry_run: bool = False,
        metadata: dict = None,
    ) -> dict:
        """
        Append an audit entry. Returns the entry for reference.
        """
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "platform": platform,
            "content_hash": hashlib.sha256(content.encode("utf-8")).hexdigest(),
            "content_preview": content[:100] + ("..." if len(content) > 100 else ""),
            "content_length": len(content),
            "result": result,
            "dry_run": dry_run,
        }

        if post_url:
            entry["post_url"] = post_url
        if post_id:
            entry["post_id"] = post_id
        if approval_ref:
            entry["approval_ref"] = approval_ref
        if error:
            entry["error"] = error
        if warnings:
            entry["warnings"] = warnings
        if metadata:
            entry["metadata"] = metadata

        log_file = self._log_file()
        with open(log_file, "a") as f:
            f.write(json.dumps(entry) + "\n")

        return entry

    def get_today(self) -> list[dict]:
        """Read today's audit entries."""
        log_file = self._log_file()
        if not log_file.exists():
            return []
        entries = []
        with open(log_file) as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        entries.append(json.loads(line))
                    except json.JSONDecodeError:
                        continue
        return entries

    def get_recent(self, days: int = 7) -> list[dict]:
        """Read audit entries from the last N days."""
        entries = []
        for i in range(days):
            date = datetime.now(timezone.utc) - __import__("datetime").timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            log_file = self.audit_dir / f"audit-{date_str}.jsonl"
            if log_file.exists():
                with open(log_file) as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            try:
                                entries.append(json.loads(line))
                            except json.JSONDecodeError:
                                continue
        return entries

    def count_posts_today(self, platform: str = None) -> int:
        """Count successful posts today, optionally filtered by platform."""
        entries = self.get_today()
        count = 0
        for e in entries:
            if e.get("result") == "success" and e.get("action") == "post":
                if platform is None or e.get("platform") == platform:
                    count += 1
        return count
