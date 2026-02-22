"""
Mastodon Platform Module

Posts to any Mastodon-compatible instance via the v1 API.
Supports posting, replying, and deleting.
"""

import requests
from typing import Optional


class MastodonClient:
    def __init__(self, instance: str, access_token: str, username: str = None):
        self.instance = instance.rstrip("/")
        self.access_token = access_token
        self.username = username
        self.headers = {"Authorization": f"Bearer {access_token}"}

    def health_check(self) -> bool:
        """Verify API connectivity and token validity."""
        try:
            r = requests.get(
                f"{self.instance}/api/v1/accounts/verify_credentials",
                headers=self.headers,
                timeout=10,
            )
            return r.status_code == 200
        except requests.RequestException:
            return False

    def post(
        self,
        content: str,
        visibility: str = "public",
        reply_to_id: Optional[str] = None,
        sensitive: bool = False,
        spoiler_text: Optional[str] = None,
    ) -> dict:
        """
        Publish a status.

        Returns:
            {"id": str, "url": str, "created_at": str}

        Raises:
            requests.HTTPError on API failure
        """
        data = {
            "status": content,
            "visibility": visibility,
        }
        if reply_to_id:
            data["in_reply_to_id"] = reply_to_id
        if sensitive:
            data["sensitive"] = True
        if spoiler_text:
            data["spoiler_text"] = spoiler_text

        r = requests.post(
            f"{self.instance}/api/v1/statuses",
            headers=self.headers,
            data=data,
            timeout=15,
        )
        r.raise_for_status()
        result = r.json()

        return {
            "id": result["id"],
            "url": result.get("url", f"{self.instance}/@{self.username}/{result['id']}"),
            "created_at": result.get("created_at"),
        }

    def delete(self, post_id: str) -> bool:
        """Delete a post. Returns True if successful."""
        try:
            r = requests.delete(
                f"{self.instance}/api/v1/statuses/{post_id}",
                headers=self.headers,
                timeout=10,
            )
            return r.status_code in (200, 204)
        except requests.RequestException:
            return False

    def get_platform_name(self) -> str:
        """Return human-readable platform identifier."""
        domain = self.instance.replace("https://", "").replace("http://", "")
        return f"mastodon ({domain})"
