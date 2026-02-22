"""
X/Twitter Platform Module

Posts via the Twitter API v2 endpoints using OAuth 1.0a User Context.
Supports posting, replying, and deleting.
"""

from typing import Optional
from requests_oauthlib import OAuth1Session
import requests

class TwitterClient:
    def __init__(
        self,
        api_key: str = None,
        api_secret: str = None,
        access_token: str = None,
        access_token_secret: str = None,
        bearer_token: str = None,
    ):
        self.configured = all([api_key, api_secret, access_token, access_token_secret])
        if not self.configured:
            return

        self.api_key = api_key
        self.api_secret = api_secret
        self.access_token = access_token
        self.access_token_secret = access_token_secret
        self.bearer_token = bearer_token

        self.session = OAuth1Session(
            client_key=self.api_key,
            client_secret=self.api_secret,
            resource_owner_key=self.access_token,
            resource_owner_secret=self.access_token_secret,
        )

    def health_check(self) -> bool:
        if not self.configured:
            return False
        
        # Test auth with GET /2/users/me
        try:
            response = self.session.get("https://api.twitter.com/2/users/me")
            return response.status_code == 200
        except Exception:
            return False

    def post(self, content: str, reply_to_id: Optional[str] = None) -> dict:
        if not self.configured:
            raise RuntimeError("X/Twitter API not configured.")

        url = "https://api.twitter.com/2/tweets"
        payload = {"text": content}

        if reply_to_id:
            payload["reply"] = {"in_reply_to_tweet_id": reply_to_id}

        response = self.session.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"}
        )

        # Handle errors gracefully but raise on auth or validation issues
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            err_details = response.text
            raise RuntimeError(f"Failed to post to X/Twitter: {e} - Details: {err_details}")

        data = response.json()
        return {
            "id": data["data"]["id"],
            "url": f"https://x.com/CovenantHerald/status/{data['data']['id']}",
            "text": data["data"]["text"]
        }

    def delete(self, tweet_id: str) -> bool:
        if not self.configured:
            return False
            
        url = f"https://api.twitter.com/2/tweets/{tweet_id}"
        try:
            response = self.session.delete(url)
            response.raise_for_status()
            data = response.json()
            return data.get("data", {}).get("deleted", False)
        except Exception:
            return False

    def get_platform_name(self) -> str:
        return "twitter"
