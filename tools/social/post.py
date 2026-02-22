#!/usr/bin/env python3
"""
Covenant Herald — Social Media Publishing CLI

Usage:
    # Check platform health
    python -m tools.social.post health

    # Dry run (validate only)
    python -m tools.social.post publish --dry-run "Your content here"

    # Publish to all platforms (requires approval ref)
    python -m tools.social.post publish --approve "nepenthe:2026-02-22" "Content to post"

    # Publish to specific platforms
    python -m tools.social.post publish --platforms mastodon,bluesky --approve "nepenthe:2026-02-22" "Content"

    # Check rate limit status
    python -m tools.social.post status

    # Rollback a post
    python -m tools.social.post rollback mastodon 123456789

    # View audit log
    python -m tools.social.post audit

All content must pass safeguard validation before publishing.
All publications are logged to the audit trail.
All publications require an approval reference.
"""

import argparse
import json
import sys
import os

# Add repo root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from tools.social.publisher import Publisher
from tools.social.config import validate_credentials


def cmd_health(args):
    """Check platform connectivity."""
    publisher = Publisher()
    available = publisher.get_available_platforms()
    print(f"Configured platforms: {', '.join(available) if available else 'none'}")
    print()

    if not available:
        print("No platforms configured. Check .env credentials.")
        return 1

    health = publisher.health_check()
    all_ok = True
    for platform, ok in health.items():
        status = "✅ healthy" if ok else "❌ unreachable"
        print(f"  {platform}: {status}")
        if not ok:
            all_ok = False

    return 0 if all_ok else 1


def cmd_status(args):
    """Show rate limit and credential status."""
    publisher = Publisher()

    print("=== Rate Limits ===")
    rate = publisher.get_rate_status()
    print(f"  Posts today: {rate['posts_today']}/{rate['posts_today'] + rate['posts_remaining']}")
    print(f"  Replies today: {rate['replies_today']}/{rate['replies_today'] + rate['replies_remaining']}")
    print(f"  Threads this week: {rate['threads_this_week']}/{rate['threads_this_week'] + rate['threads_remaining']}")
    if rate['cooldown_remaining'] > 0:
        print(f"  Cooldown: {rate['cooldown_remaining']}s remaining")
    else:
        print(f"  Cooldown: ready")

    print()
    print("=== Credentials ===")
    creds = validate_credentials()
    for platform, info in creds.items():
        if info["configured"]:
            print(f"  {platform}: ✅ configured")
        else:
            print(f"  {platform}: ❌ missing: {', '.join(info['missing_fields'])}")

    return 0


def cmd_publish(args):
    """Publish content to platforms."""
    content = args.content
    dry_run = args.dry_run
    approval_ref = args.approve
    platforms = args.platforms.split(",") if args.platforms else None

    if not dry_run and not approval_ref:
        print("❌ All content requires approval. Use --approve 'name:date' or --dry-run")
        return 1

    publisher = Publisher()

    if platforms:
        # Validate requested platforms exist
        available = publisher.get_available_platforms()
        for p in platforms:
            if p not in available:
                print(f"❌ Platform '{p}' not available. Available: {', '.join(available)}")
                return 1

    print(f"{'🧪 DRY RUN' if dry_run else '📡 PUBLISHING'}")
    print(f"Content ({len(content)} chars): {content[:100]}{'...' if len(content) > 100 else ''}")
    print(f"Platforms: {', '.join(platforms) if platforms else 'all available'}")
    if approval_ref:
        print(f"Approved by: {approval_ref}")
    print()

    result = publisher.publish(
        content=content,
        platforms=platforms,
        approval_ref=approval_ref,
        dry_run=dry_run,
    )

    print(result.summary)
    print()

    if result.content_hash:
        print(f"Content hash: {result.content_hash[:16]}...")

    return 0 if (result.any_success or dry_run) else 1


def cmd_rollback(args):
    """Delete a published post."""
    publisher = Publisher()
    print(f"Rolling back {args.platform} post {args.post_id}...")
    success = publisher.rollback(args.platform, args.post_id)
    if success:
        print("✅ Post deleted")
        return 0
    else:
        print("❌ Rollback failed")
        return 1


def cmd_audit(args):
    """View recent audit entries."""
    from tools.social.audit import AuditLogger
    from tools.social.publisher import AUDIT_DIR

    logger = AuditLogger(str(AUDIT_DIR))
    days = args.days if hasattr(args, "days") else 7
    entries = logger.get_recent(days)

    if not entries:
        print("No audit entries found.")
        return 0

    print(f"=== Audit Log (last {days} days, {len(entries)} entries) ===\n")
    for e in entries:
        ts = e.get("timestamp", "?")[:19]
        action = e.get("action", "?")
        platform = e.get("platform", "?")
        result_str = e.get("result", "?")
        preview = e.get("content_preview", "")[:60]
        dry = " [DRY]" if e.get("dry_run") else ""

        icon = {"success": "✅", "failure": "❌", "blocked": "🚫",
                "rate_limited": "⏱️", "dry_run_pass": "🧪"}.get(result_str, "❓")

        print(f"  {ts} {icon} {action}/{platform}{dry}: {preview}")
        if e.get("post_url"):
            print(f"    → {e['post_url']}")
        if e.get("error"):
            print(f"    ⚠ {e['error']}")

    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Covenant Herald — Social Media Publishing Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Command")

    # health
    subparsers.add_parser("health", help="Check platform connectivity")

    # status
    subparsers.add_parser("status", help="Show rate limits and credential status")

    # publish
    pub_parser = subparsers.add_parser("publish", help="Publish content")
    pub_parser.add_argument("content", help="Content to publish")
    pub_parser.add_argument("--dry-run", action="store_true", help="Validate only, don't post")
    pub_parser.add_argument("--approve", help="Approval reference (e.g. 'nepenthe:2026-02-22')")
    pub_parser.add_argument("--platforms", help="Comma-separated platform list")

    # rollback
    rb_parser = subparsers.add_parser("rollback", help="Delete a published post")
    rb_parser.add_argument("platform", help="Platform name")
    rb_parser.add_argument("post_id", help="Post ID to delete")

    # audit
    audit_parser = subparsers.add_parser("audit", help="View audit log")
    audit_parser.add_argument("--days", type=int, default=7, help="Days to look back")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    commands = {
        "health": cmd_health,
        "status": cmd_status,
        "publish": cmd_publish,
        "rollback": cmd_rollback,
        "audit": cmd_audit,
    }

    return commands[args.command](args)


if __name__ == "__main__":
    sys.exit(main())
