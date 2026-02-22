"""
Social Media Analytics Module

Collects engagement metrics from all platforms:
- Mastodon (mastodon.social, techhub.social)
- Bluesky
- X/Twitter
- Lemmy

NEVER exposes credentials in output.
Returns structured data for report generation.
"""

import requests
from datetime import datetime, timezone
from typing import Optional
from requests_oauthlib import OAuth1Session

from .config import load_credentials


class SocialAnalytics:
    """Collect engagement metrics across all social platforms."""

    def __init__(self, env_path: str = None):
        self.credentials = load_credentials(env_path)
        self.results = {}

    def collect_all(self) -> dict:
        """Collect metrics from all configured platforms."""
        self.results = {
            "collected_at": datetime.now(timezone.utc).isoformat(),
            "platforms": {},
        }

        if "mastodon" in self.credentials:
            self.results["platforms"]["mastodon"] = self._collect_mastodon(
                self.credentials["mastodon"], "mastodon.social"
            )

        if "mastodon_techhub" in self.credentials:
            self.results["platforms"]["mastodon_techhub"] = self._collect_mastodon(
                self.credentials["mastodon_techhub"], "techhub.social"
            )

        if "bluesky" in self.credentials:
            self.results["platforms"]["bluesky"] = self._collect_bluesky(
                self.credentials["bluesky"]
            )

        if "twitter" in self.credentials:
            self.results["platforms"]["twitter"] = self._collect_twitter(
                self.credentials["twitter"]
            )

        if "lemmy" in self.credentials:
            self.results["platforms"]["lemmy"] = self._collect_lemmy(
                self.credentials["lemmy"]
            )

        return self.results

    def _collect_mastodon(self, creds: dict, instance_name: str) -> dict:
        """Collect Mastodon account and post metrics."""
        instance = creds["instance"]
        headers = {"Authorization": f"Bearer {creds['access_token']}"}

        result = {
            "instance": instance_name,
            "account": {},
            "recent_posts": [],
            "error": None,
        }

        try:
            # Account info
            r = requests.get(
                f"{instance}/api/v1/accounts/verify_credentials",
                headers=headers,
                timeout=10,
            )
            if r.status_code == 200:
                data = r.json()
                result["account"] = {
                    "followers": data.get("followers_count", 0),
                    "following": data.get("following_count", 0),
                    "statuses": data.get("statuses_count", 0),
                    "display_name": data.get("display_name", ""),
                    "url": data.get("url", ""),
                }

                # Recent posts (last 10)
                account_id = data["id"]
                r2 = requests.get(
                    f"{instance}/api/v1/accounts/{account_id}/statuses",
                    headers=headers,
                    params={"limit": 10, "exclude_replies": True},
                    timeout=10,
                )
                if r2.status_code == 200:
                    for post in r2.json():
                        result["recent_posts"].append({
                            "id": post["id"],
                            "created_at": post["created_at"],
                            "content_preview": post.get("content", "")[:100],
                            "reblogs": post.get("reblogs_count", 0),
                            "favourites": post.get("favourites_count", 0),
                            "replies": post.get("replies_count", 0),
                            "url": post.get("url", ""),
                        })
            else:
                result["error"] = f"HTTP {r.status_code}"

        except Exception as e:
            result["error"] = str(e)

        return result

    def _collect_bluesky(self, creds: dict) -> dict:
        """Collect Bluesky profile and post metrics."""
        pds = "https://bsky.social"
        result = {
            "account": {},
            "recent_posts": [],
            "error": None,
        }

        try:
            # Authenticate
            r = requests.post(
                f"{pds}/xrpc/com.atproto.server.createSession",
                json={"identifier": creds["handle"], "password": creds["password"]},
                timeout=10,
            )
            if r.status_code != 200:
                result["error"] = f"Auth failed: HTTP {r.status_code}"
                return result

            session = r.json()
            access_token = session["accessJwt"]
            did = session["did"]
            auth_headers = {"Authorization": f"Bearer {access_token}"}

            # Profile info
            r2 = requests.get(
                f"{pds}/xrpc/app.bsky.actor.getProfile",
                params={"actor": did},
                headers=auth_headers,
                timeout=10,
            )
            if r2.status_code == 200:
                profile = r2.json()
                result["account"] = {
                    "followers": profile.get("followersCount", 0),
                    "following": profile.get("followsCount", 0),
                    "posts": profile.get("postsCount", 0),
                    "handle": profile.get("handle", ""),
                    "display_name": profile.get("displayName", ""),
                }

            # Recent posts via author feed
            r3 = requests.get(
                f"{pds}/xrpc/app.bsky.feed.getAuthorFeed",
                params={"actor": did, "limit": 10},
                headers=auth_headers,
                timeout=10,
            )
            if r3.status_code == 200:
                feed = r3.json().get("feed", [])
                for item in feed:
                    post = item.get("post", {})
                    record = post.get("record", {})
                    result["recent_posts"].append({
                        "uri": post.get("uri", ""),
                        "created_at": record.get("createdAt", ""),
                        "text_preview": record.get("text", "")[:100],
                        "likes": post.get("likeCount", 0),
                        "reposts": post.get("repostCount", 0),
                        "replies": post.get("replyCount", 0),
                    })

        except Exception as e:
            result["error"] = str(e)

        return result

    def _collect_twitter(self, creds: dict) -> dict:
        """Collect X/Twitter account and tweet metrics."""
        result = {
            "account": {},
            "recent_tweets": [],
            "error": None,
        }

        try:
            session = OAuth1Session(
                client_key=creds["api_key"],
                client_secret=creds["api_secret"],
                resource_owner_key=creds["access_token"],
                resource_owner_secret=creds["access_token_secret"],
            )

            # Get user info with public metrics
            r = session.get(
                "https://api.twitter.com/2/users/me",
                params={"user.fields": "public_metrics,description,created_at"},
            )
            if r.status_code == 200:
                data = r.json().get("data", {})
                metrics = data.get("public_metrics", {})
                result["account"] = {
                    "username": data.get("username", ""),
                    "name": data.get("name", ""),
                    "followers": metrics.get("followers_count", 0),
                    "following": metrics.get("following_count", 0),
                    "tweets": metrics.get("tweet_count", 0),
                    "listed": metrics.get("listed_count", 0),
                }

                # Get recent tweets with metrics
                user_id = data["id"]
                r2 = session.get(
                    f"https://api.twitter.com/2/users/{user_id}/tweets",
                    params={
                        "max_results": 10,
                        "tweet.fields": "public_metrics,created_at",
                    },
                )
                if r2.status_code == 200:
                    tweets = r2.json().get("data", [])
                    for tweet in tweets:
                        tm = tweet.get("public_metrics", {})
                        result["recent_tweets"].append({
                            "id": tweet["id"],
                            "created_at": tweet.get("created_at", ""),
                            "text_preview": tweet.get("text", "")[:100],
                            "impressions": tm.get("impression_count", 0),
                            "likes": tm.get("like_count", 0),
                            "retweets": tm.get("retweet_count", 0),
                            "replies": tm.get("reply_count", 0),
                            "quotes": tm.get("quote_count", 0),
                            "bookmarks": tm.get("bookmark_count", 0),
                        })
                elif r2.status_code == 403:
                    result["recent_tweets"] = []
                    result["note"] = "Tweet lookup may require elevated access"
            else:
                result["error"] = f"HTTP {r.status_code}: {r.text[:200]}"

        except Exception as e:
            result["error"] = str(e)

        return result

    def _collect_lemmy(self, creds: dict) -> dict:
        """Collect Lemmy account and post metrics."""
        instance = creds["instance"]
        result = {
            "account": {},
            "recent_posts": [],
            "error": None,
        }

        try:
            # Login
            r = requests.post(
                f"{instance}/api/v3/user/login",
                json={
                    "username_or_email": creds["username"],
                    "password": creds["password"],
                },
                timeout=10,
            )
            if r.status_code != 200:
                result["error"] = f"Login failed: HTTP {r.status_code}"
                return result

            jwt = r.json().get("jwt")
            if not jwt:
                result["error"] = "No JWT returned"
                return result

            headers = {"Authorization": f"Bearer {jwt}"}

            # Get user details
            r2 = requests.get(
                f"{instance}/api/v3/person",
                params={"username": creds["username"]},
                headers=headers,
                timeout=10,
            )
            if r2.status_code == 200:
                data = r2.json()
                person = data.get("person_view", {})
                counts = person.get("counts", {})
                result["account"] = {
                    "username": creds["username"],
                    "instance": instance,
                    "post_count": counts.get("post_count", 0),
                    "comment_count": counts.get("comment_count", 0),
                    "post_score": counts.get("post_score", 0),
                    "comment_score": counts.get("comment_score", 0),
                }

                # Get recent posts
                posts = data.get("posts", [])
                for p in posts[:10]:
                    post = p.get("post", {})
                    post_counts = p.get("counts", {})
                    result["recent_posts"].append({
                        "id": post.get("id"),
                        "name": post.get("name", "")[:100],
                        "created_at": post.get("published", ""),
                        "url": post.get("ap_id", ""),
                        "upvotes": post_counts.get("upvotes", 0),
                        "downvotes": post_counts.get("downvotes", 0),
                        "score": post_counts.get("score", 0),
                        "comments": post_counts.get("comments", 0),
                    })

        except Exception as e:
            result["error"] = str(e)

        return result


def generate_social_report(env_path: str = None) -> str:
    """Generate a formatted social media report section."""
    analytics = SocialAnalytics(env_path)
    data = analytics.collect_all()

    lines = []
    lines.append("## 📡 Social Media Outreach\n")

    total_followers = 0
    total_engagement = 0

    for platform_key, pdata in data["platforms"].items():
        if pdata.get("error"):
            lines.append(f"**{platform_key}**: ⚠️ Error: {pdata['error']}")
            continue

        account = pdata.get("account", {})

        if platform_key in ("mastodon", "mastodon_techhub"):
            name = pdata.get("instance", platform_key)
            followers = account.get("followers", 0)
            total_followers += followers
            lines.append(f"**Mastodon ({name})** — @{account.get('display_name', 'CovenantHerald')}")
            lines.append(f"  Followers: {followers} · Following: {account.get('following', 0)} · Posts: {account.get('statuses', 0)}")

            for post in pdata.get("recent_posts", []):
                engagement = post.get("reblogs", 0) + post.get("favourites", 0) + post.get("replies", 0)
                total_engagement += engagement
                lines.append(f"  📝 Post: ⭐ {post['favourites']} · 🔁 {post['reblogs']} · 💬 {post['replies']} — {post.get('url', '')}")

        elif platform_key == "bluesky":
            followers = account.get("followers", 0)
            total_followers += followers
            lines.append(f"**Bluesky** — @{account.get('handle', '')}")
            lines.append(f"  Followers: {followers} · Following: {account.get('following', 0)} · Posts: {account.get('posts', 0)}")

            for post in pdata.get("recent_posts", []):
                engagement = post.get("likes", 0) + post.get("reposts", 0) + post.get("replies", 0)
                total_engagement += engagement
                lines.append(f"  📝 Post: ❤️ {post['likes']} · 🔁 {post['reposts']} · 💬 {post['replies']}")

        elif platform_key == "twitter":
            followers = account.get("followers", 0)
            total_followers += followers
            lines.append(f"**X/Twitter** — @{account.get('username', '')}")
            lines.append(f"  Followers: {followers} · Following: {account.get('following', 0)} · Tweets: {account.get('tweets', 0)}")

            for tweet in pdata.get("recent_tweets", []):
                engagement = tweet.get("likes", 0) + tweet.get("retweets", 0) + tweet.get("replies", 0)
                total_engagement += engagement
                impressions = tweet.get("impressions", 0)
                imp_str = f" · 👁️ {impressions}" if impressions else ""
                lines.append(f"  📝 Tweet: ❤️ {tweet['likes']} · 🔁 {tweet['retweets']} · 💬 {tweet['replies']}{imp_str}")

            if pdata.get("note"):
                lines.append(f"  ℹ️ {pdata['note']}")

        elif platform_key == "lemmy":
            lines.append(f"**Lemmy** — {account.get('username', '')}@{account.get('instance', '')}")
            lines.append(f"  Posts: {account.get('post_count', 0)} · Comments: {account.get('comment_count', 0)} · Karma: {account.get('post_score', 0)}")

            for post in pdata.get("recent_posts", []):
                engagement = post.get("upvotes", 0) + post.get("comments", 0)
                total_engagement += engagement
                lines.append(f"  📝 Post: ⬆️ {post['upvotes']} · ⬇️ {post['downvotes']} · 💬 {post['comments']} — {post.get('url', '')}")

        lines.append("")

    # Summary
    lines.append("**Cross-Platform Summary**")
    lines.append(f"  Total Followers: {total_followers} · Total Engagement Actions: {total_engagement}")
    lines.append(f"  Platforms Active: {len([p for p in data['platforms'].values() if not p.get('error')])}/{len(data['platforms'])}")
    lines.append(f"  Collected: {data['collected_at']}")

    return "\n".join(lines)


if __name__ == "__main__":
    print(generate_social_report())
