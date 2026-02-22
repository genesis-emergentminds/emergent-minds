"""
X/Twitter Platform Module — STUB

Requires a Developer App to be set up at developer.x.com.
Once API credentials are available, this module will use the v2 API.

Status: BLOCKED — awaiting developer app approval.
"""

from typing import Optional


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

        # Will use tweepy or requests-oauthlib when configured
        self.api_key = api_key
        self.api_secret = api_secret
        self.access_token = access_token
        self.access_token_secret = access_token_secret
        self.bearer_token = bearer_token

    def health_check(self) -> bool:
        if not self.configured:
            return False
        # TODO: Implement when developer app is set up
        return False

    def post(self, content: str, reply_to_id: Optional[str] = None) -> dict:
        if not self.configured:
            raise RuntimeError(
                "X/Twitter API not configured. Set up a developer app at "
                "developer.x.com and add credentials to .env: "
                "X_HERALD_API_KEY, X_HERALD_API_SECRET, "
                "X_HERALD_ACCESS_TOKEN, X_HERALD_ACCESS_TOKEN_SECRET"
            )
        # TODO: Implement v2 tweet creation
        raise NotImplementedError("X/Twitter posting not yet implemented")

    def delete(self, tweet_id: str) -> bool:
        if not self.configured:
            return False
        # TODO: Implement
        return False

    def get_platform_name(self) -> str:
        return "twitter"
