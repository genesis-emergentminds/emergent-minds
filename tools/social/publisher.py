"""
Publisher Module — Orchestrates cross-platform publishing.

This is the core engine. It:
1. Validates content through safeguards
2. Checks rate limits
3. Publishes to specified platforms (with graceful degradation)
4. Logs everything to the audit trail
5. Returns comprehensive results

AXIOM 5 DESIGN PRINCIPLES:
- No single platform failure stops the pipeline
- Content exists locally before any platform copy
- Full audit trail for forensic recovery
- Rate limits enforced regardless of caller
- Rollback capability for every published post
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from .safeguards import ContentValidator, RateLimiter, SafeguardViolation, content_hash
from .audit import AuditLogger
from .config import load_credentials
from .platforms.mastodon import MastodonClient
from .platforms.bluesky import BlueskyClient
from .platforms.twitter import TwitterClient
from .platforms.lemmy import LemmyClient


# Where state lives — inside the repo's data directory
STATE_DIR = Path(__file__).parent.parent.parent / "data" / "social"
AUDIT_DIR = STATE_DIR / "audit"
PUBLISHED_DIR = STATE_DIR / "published"


class PublishResult:
    """Result of a publish operation across platforms."""

    def __init__(self):
        self.results: dict[str, dict] = {}
        self.blocked: bool = False
        self.block_reason: str = None
        self.warnings: list[str] = []
        self.content_hash: str = None

    def add_platform_result(self, platform: str, success: bool, url: str = None,
                            post_id: str = None, error: str = None):
        self.results[platform] = {
            "success": success,
            "url": url,
            "post_id": post_id,
            "error": error,
        }

    @property
    def any_success(self) -> bool:
        return any(r["success"] for r in self.results.values())

    @property
    def all_success(self) -> bool:
        return all(r["success"] for r in self.results.values()) and len(self.results) > 0

    @property
    def summary(self) -> str:
        lines = []
        if self.blocked:
            lines.append(f"❌ BLOCKED: {self.block_reason}")
            return "\n".join(lines)

        for platform, result in self.results.items():
            if result["success"]:
                lines.append(f"✅ {platform}: {result['url']}")
            else:
                lines.append(f"❌ {platform}: {result['error']}")

        if self.warnings:
            lines.append(f"⚠️  Warnings: {', '.join(self.warnings)}")

        return "\n".join(lines)


class Publisher:
    """
    Main publishing engine.

    Usage:
        publisher = Publisher()
        result = publisher.publish("Hello world", platforms=["mastodon", "bluesky"])
        print(result.summary)
    """

    def __init__(self, env_path: str = None):
        # Initialize state directories
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        PUBLISHED_DIR.mkdir(parents=True, exist_ok=True)

        # Initialize components
        self.validator = ContentValidator()
        self.rate_limiter = RateLimiter(str(STATE_DIR))
        self.audit = AuditLogger(str(AUDIT_DIR))
        self.credentials = load_credentials(env_path)
        self.clients = self._init_clients()

    def _init_clients(self) -> dict:
        """Initialize platform clients from credentials."""
        clients = {}

        if "mastodon" in self.credentials:
            c = self.credentials["mastodon"]
            clients["mastodon"] = MastodonClient(
                instance=c["instance"],
                access_token=c["access_token"],
                username=c.get("username"),
            )

        if "mastodon_techhub" in self.credentials:
            c = self.credentials["mastodon_techhub"]
            clients["mastodon_techhub"] = MastodonClient(
                instance=c["instance"],
                access_token=c["access_token"],
                username=c.get("username"),
            )

        if "bluesky" in self.credentials:
            c = self.credentials["bluesky"]
            clients["bluesky"] = BlueskyClient(
                handle=c["handle"],
                password=c["password"],
                did=c.get("did"),
            )

        if "twitter" in self.credentials:
            c = self.credentials["twitter"]
            clients["twitter"] = TwitterClient(**c)

        if "lemmy" in self.credentials:
            c = self.credentials["lemmy"]
            clients["lemmy"] = LemmyClient(**c)

        return clients

    def get_available_platforms(self) -> list[str]:
        """Return list of platforms with initialized clients."""
        return list(self.clients.keys())

    def health_check(self, platforms: list[str] = None) -> dict:
        """Check connectivity to all or specified platforms."""
        targets = platforms or list(self.clients.keys())
        results = {}
        for name in targets:
            client = self.clients.get(name)
            if client:
                try:
                    results[name] = client.health_check()
                except Exception as e:
                    results[name] = False
            else:
                results[name] = False
        return results

    def publish(
        self,
        content: str,
        platforms: list[str] = None,
        content_type: str = "post",
        approval_ref: str = None,
        dry_run: bool = False,
        reply_to: dict = None,
    ) -> PublishResult:
        """
        Publish content to specified platforms.

        Args:
            content: The text to publish
            platforms: List of platform names (default: all available)
            content_type: "post", "reply", or "thread"
            approval_ref: Reference to the approval (who approved, when)
            dry_run: If True, validate only — don't actually post
            reply_to: Platform-specific reply targets {"mastodon": "id", "bluesky": {"uri": ..., "cid": ...}}

        Returns:
            PublishResult with per-platform outcomes
        """
        result = PublishResult()
        result.content_hash = content_hash(content)

        # === PHASE 1: VALIDATION ===
        # All platforms must pass the strictest relevant check
        target_platforms = platforms or list(self.clients.keys())

        for platform in target_platforms:
            try:
                warnings = self.validator.validate(content, platform, content_type)
                result.warnings.extend(warnings)
            except SafeguardViolation as e:
                result.blocked = True
                result.block_reason = str(e)
                self.audit.log(
                    action=content_type,
                    platform=platform,
                    content=content,
                    result="blocked",
                    error=str(e),
                    approval_ref=approval_ref,
                    dry_run=dry_run,
                )
                return result

        # === PHASE 2: RATE LIMITING (per-platform, checked in Phase 5) ===
        # Cooldown is still global (prevents rapid-fire API calls)
        if not dry_run:
            import time as _time
            last = self.rate_limiter.state.get("last_post_time", 0)
            now = _time.time()
            cooldown = 300  # 5 min
            if now - last < cooldown:
                remaining = int(cooldown - (now - last))
                result.blocked = True
                result.block_reason = f"[BLOCK] COOLDOWN: Must wait {remaining}s between posts (cooldown: {cooldown}s)"
                self.audit.log(
                    action=content_type,
                    platform="all",
                    content=content,
                    result="rate_limited",
                    error=result.block_reason,
                    dry_run=dry_run,
                )
                return result

        # === PHASE 3: APPROVAL CHECK ===
        if not approval_ref and not dry_run:
            result.blocked = True
            result.block_reason = "No approval reference provided. All content requires approval."
            self.audit.log(
                action=content_type,
                platform="all",
                content=content,
                result="blocked",
                error="no_approval_ref",
                dry_run=dry_run,
            )
            return result

        # === PHASE 4: DRY RUN EXIT ===
        if dry_run:
            for platform in target_platforms:
                result.add_platform_result(
                    platform=platform,
                    success=True,
                    url="(dry run)",
                )
                self.audit.log(
                    action=content_type,
                    platform=platform,
                    content=content,
                    result="dry_run_pass",
                    dry_run=True,
                    warnings=result.warnings,
                )
            return result

        # === PHASE 5: PUBLISH (graceful degradation) ===
        for platform in target_platforms:
            client = self.clients.get(platform)
            if not client:
                result.add_platform_result(
                    platform=platform,
                    success=False,
                    error=f"No client configured for {platform}",
                )
                continue

            try:
                # Per-platform rate limit check
                if not dry_run:
                    try:
                        self.rate_limiter.check_and_record(content_type, platform=platform)
                    except SafeguardViolation as rate_err:
                        result.add_platform_result(
                            platform=platform,
                            success=False,
                            error=f"Rate limited: {rate_err}",
                        )
                        continue

                # Platform-specific posting
                if isinstance(client, MastodonClient):
                    reply_id = reply_to.get(platform) if reply_to else None
                    post_result = client.post(content, reply_to_id=reply_id)

                elif isinstance(client, BlueskyClient):
                    reply_ref = reply_to.get(platform) if reply_to else None
                    post_result = client.post(content, reply_to=reply_ref)

                elif isinstance(client, TwitterClient):
                    reply_id = reply_to.get(platform) if reply_to else None
                    post_result = client.post(content, reply_to_id=reply_id)

                elif isinstance(client, LemmyClient):
                    # Lemmy posts need title + community; skip for basic posts
                    result.add_platform_result(
                        platform=platform,
                        success=False,
                        error="Lemmy requires title and community — use publish_lemmy() directly",
                    )
                    continue
                else:
                    result.add_platform_result(
                        platform=platform,
                        success=False,
                        error=f"Unknown client type for {platform}",
                    )
                    continue

                result.add_platform_result(
                    platform=platform,
                    success=True,
                    url=post_result.get("url"),
                    post_id=post_result.get("id"),
                )

                self.audit.log(
                    action=content_type,
                    platform=platform,
                    content=content,
                    result="success",
                    post_url=post_result.get("url"),
                    post_id=post_result.get("id"),
                    approval_ref=approval_ref,
                    warnings=result.warnings,
                )

            except Exception as e:
                error_msg = str(e)
                result.add_platform_result(
                    platform=platform,
                    success=False,
                    error=error_msg,
                )
                self.audit.log(
                    action=content_type,
                    platform=platform,
                    content=content,
                    result="failure",
                    error=error_msg,
                    approval_ref=approval_ref,
                )

        # === PHASE 6: ARCHIVE ===
        if result.any_success:
            self._archive_published(content, result, approval_ref)

        return result

    def rollback(self, platform: str, post_id: str) -> bool:
        """
        Delete a published post (emergency rollback).
        Logged to audit trail.
        """
        client = self.clients.get(platform)
        if not client:
            return False

        success = client.delete(post_id)
        self.audit.log(
            action="rollback",
            platform=platform,
            content=f"Rollback of post {post_id}",
            result="success" if success else "failure",
            post_id=post_id,
        )
        return success

    def _archive_published(self, content: str, result: PublishResult, approval_ref: str):
        """Save published content to local archive."""
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
        archive = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "content": content,
            "content_hash": result.content_hash,
            "approval_ref": approval_ref,
            "platforms": result.results,
        }
        archive_file = PUBLISHED_DIR / f"{timestamp}.json"
        with open(archive_file, "w") as f:
            json.dump(archive, f, indent=2)

    def get_rate_status(self) -> dict:
        """Get current rate limit status."""
        return self.rate_limiter.get_status()
