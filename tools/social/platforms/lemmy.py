"""
Lemmy Platform Module — STUB

Account application pending admin approval at lemmy.ml.
Once approved, this module will support posting and commenting.

Status: BLOCKED — awaiting admin approval.
"""

from typing import Optional


class LemmyClient:
    def __init__(self, instance: str = None, username: str = None, password: str = None):
        self.instance = instance
        self.username = username
        self.password = password
        self.auth_token = None
        self.configured = all([instance, username, password])

    def _authenticate(self) -> None:
        """Login and get JWT token."""
        if not self.configured:
            return
        import requests
        r = requests.post(
            f"{self.instance}/api/v3/user/login",
            json={
                "username_or_email": self.username,
                "password": self.password,
            },
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        self.auth_token = data.get("jwt")
        if not self.auth_token:
            raise RuntimeError("Lemmy login succeeded but no JWT returned — account may not be approved yet")

    def health_check(self) -> bool:
        if not self.configured:
            return False
        try:
            self._authenticate()
            return self.auth_token is not None
        except Exception:
            return False

    def post(
        self,
        title: str,
        content: str,
        community: str,
        url: Optional[str] = None,
    ) -> dict:
        """
        Create a post in a Lemmy community.

        Args:
            title: Post title
            content: Post body (markdown)
            community: Community name (e.g. "technology")
            url: Optional link URL
        """
        if not self.configured:
            raise RuntimeError("Lemmy not configured")

        if not self.auth_token:
            self._authenticate()

        import requests

        # First, resolve community ID
        r = requests.get(
            f"{self.instance}/api/v3/community",
            params={"name": community},
            timeout=10,
        )
        r.raise_for_status()
        community_id = r.json()["community_view"]["community"]["id"]

        # Create post
        post_data = {
            "name": title,
            "body": content,
            "community_id": community_id,
        }
        if url:
            post_data["url"] = url

        r = requests.post(
            f"{self.instance}/api/v3/post",
            json=post_data,
            headers={"Authorization": f"Bearer {self.auth_token}"},
            timeout=15,
        )
        r.raise_for_status()
        result = r.json()
        post = result["post_view"]["post"]

        return {
            "id": str(post["id"]),
            "url": post.get("ap_id", f"{self.instance}/post/{post['id']}"),
        }

    def delete(self, post_id: str) -> bool:
        if not self.configured or not self.auth_token:
            return False
        try:
            import requests
            r = requests.post(
                f"{self.instance}/api/v3/post/delete",
                json={"post_id": int(post_id), "deleted": True},
                headers={"Authorization": f"Bearer {self.auth_token}"},
                timeout=10,
            )
            return r.status_code == 200
        except Exception:
            return False

    def get_platform_name(self) -> str:
        return "lemmy"
