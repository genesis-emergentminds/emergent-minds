"""
Bluesky Platform Module

Posts via the AT Protocol (atproto) to bsky.social.
Handles session management (tokens expire, must re-auth).
"""

import requests
from datetime import datetime, timezone
from typing import Optional


class BlueskyClient:
    def __init__(self, handle: str, password: str, did: str = None):
        self.handle = handle
        self.password = password
        self.did = did
        self.access_token = None
        self.refresh_token = None
        self.pds = "https://bsky.social"

    def _authenticate(self) -> None:
        """Create a session (login)."""
        r = requests.post(
            f"{self.pds}/xrpc/com.atproto.server.createSession",
            json={"identifier": self.handle, "password": self.password},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        self.access_token = data["accessJwt"]
        self.refresh_token = data["refreshJwt"]
        self.did = data["did"]

    def _ensure_auth(self) -> None:
        """Ensure we have a valid session."""
        if not self.access_token:
            self._authenticate()

    def _headers(self) -> dict:
        self._ensure_auth()
        return {"Authorization": f"Bearer {self.access_token}"}

    def health_check(self) -> bool:
        """Verify API connectivity and credentials."""
        try:
            self._authenticate()
            return True
        except (requests.RequestException, KeyError):
            return False

    def post(
        self,
        content: str,
        reply_to: Optional[dict] = None,
    ) -> dict:
        """
        Publish a post.

        Args:
            content: Text content
            reply_to: Optional dict with {"uri": str, "cid": str} for replies

        Returns:
            {"id": str, "url": str, "uri": str, "cid": str}
        """
        self._ensure_auth()

        # Build the record
        now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        record = {
            "$type": "app.bsky.feed.post",
            "text": content,
            "createdAt": now,
        }

        # Parse facets (links, mentions) — basic URL detection
        facets = self._parse_urls(content)
        if facets:
            record["facets"] = facets

        # Reply structure
        if reply_to:
            record["reply"] = {
                "root": {"uri": reply_to["uri"], "cid": reply_to["cid"]},
                "parent": {"uri": reply_to["uri"], "cid": reply_to["cid"]},
            }

        r = requests.post(
            f"{self.pds}/xrpc/com.atproto.repo.createRecord",
            headers=self._headers(),
            json={
                "repo": self.did,
                "collection": "app.bsky.feed.post",
                "record": record,
            },
            timeout=15,
        )

        # Handle expired token — re-auth and retry once
        if r.status_code == 401:
            self._authenticate()
            r = requests.post(
                f"{self.pds}/xrpc/com.atproto.repo.createRecord",
                headers=self._headers(),
                json={
                    "repo": self.did,
                    "collection": "app.bsky.feed.post",
                    "record": record,
                },
                timeout=15,
            )

        r.raise_for_status()
        result = r.json()

        # Build the web URL
        rkey = result["uri"].split("/")[-1]
        url = f"https://bsky.app/profile/{self.handle}/post/{rkey}"

        return {
            "id": rkey,
            "url": url,
            "uri": result["uri"],
            "cid": result["cid"],
        }

    def delete(self, rkey: str) -> bool:
        """Delete a post by rkey. Returns True if successful."""
        try:
            self._ensure_auth()
            r = requests.post(
                f"{self.pds}/xrpc/com.atproto.repo.deleteRecord",
                headers=self._headers(),
                json={
                    "repo": self.did,
                    "collection": "app.bsky.feed.post",
                    "rkey": rkey,
                },
                timeout=10,
            )
            return r.status_code in (200, 204)
        except requests.RequestException:
            return False

    def _parse_urls(self, text: str) -> list:
        """Detect URLs in text and create facets for rich links."""
        import re
        facets = []
        for match in re.finditer(r"https?://[^\s\)]+", text):
            start = len(text[:match.start()].encode("utf-8"))
            end = len(text[:match.end()].encode("utf-8"))
            facets.append({
                "index": {"byteStart": start, "byteEnd": end},
                "features": [{"$type": "app.bsky.richtext.facet#link", "uri": match.group()}],
            })
        return facets

    def get_platform_name(self) -> str:
        return "bluesky"
