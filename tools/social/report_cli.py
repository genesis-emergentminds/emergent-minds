#!/usr/bin/env python3
"""
CLI tool to generate social media analytics report.
Can be run standalone or called by the daily report cron job.

Usage:
    python -m tools.social.report_cli          # Human-readable report
    python -m tools.social.report_cli --json   # JSON output for other tools
"""

import sys
import json
from pathlib import Path

# Ensure repo root is in path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from tools.social.analytics import SocialAnalytics, generate_social_report


def main():
    if "--json" in sys.argv:
        analytics = SocialAnalytics()
        data = analytics.collect_all()
        print(json.dumps(data, indent=2))
    else:
        print(generate_social_report())


if __name__ == "__main__":
    main()
