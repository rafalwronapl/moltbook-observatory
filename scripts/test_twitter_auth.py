#!/usr/bin/env python3
"""
Test Twitter API authentication with different methods.
"""

import json
import sys
import urllib.parse
from pathlib import Path

# Load keys
keys_path = Path(__file__).parent.parent / "config" / "twitter_keys.json"
if not keys_path.exists():
    print(f"Brak pliku config/twitter_keys.json. Dodaj klucze API Twittera.")
    sys.exit(1)
with open(keys_path, encoding="utf-8") as f:
    keys = json.load(f)

print("=== Twitter API Authentication Test ===\n")

# Check if bearer token needs URL decoding
bearer = keys["bearer_token"]
if "%3D" in bearer or "%2F" in bearer:
    decoded_bearer = urllib.parse.unquote(bearer)
    print(f"Bearer token was URL-encoded!")
    print(f"Original:  {bearer[:50]}...")
    print(f"Decoded:   {decoded_bearer[:50]}...")
    bearer = decoded_bearer
else:
    print("Bearer token looks OK (not URL-encoded)")

print("\n--- Test 1: Bearer Token Only (App-only auth) ---")
try:
    import tweepy
    client = tweepy.Client(bearer_token=bearer)
    # Try a public endpoint that doesn't need user context
    result = client.search_recent_tweets("hello", max_results=10)
    print(f"SUCCESS! Found {len(result.data) if result.data else 0} tweets")
except Exception as e:
    print(f"FAILED: {e}")

print("\n--- Test 2: OAuth 1.0a User Context ---")
try:
    client = tweepy.Client(
        consumer_key=keys["consumer_key"],
        consumer_secret=keys["consumer_secret"],
        access_token=keys["access_token"],
        access_token_secret=keys["access_token_secret"]
    )
    me = client.get_me()
    print(f"SUCCESS! Logged in as: @{me.data.username}")
except Exception as e:
    print(f"FAILED: {e}")

print("\n--- Test 3: API v1.1 with OAuthHandler ---")
try:
    auth = tweepy.OAuthHandler(keys["consumer_key"], keys["consumer_secret"])
    auth.set_access_token(keys["access_token"], keys["access_token_secret"])
    api = tweepy.API(auth)
    me = api.verify_credentials()
    print(f"SUCCESS! Logged in as: @{me.screen_name}")
except Exception as e:
    print(f"FAILED: {e}")

print("\n--- Test 4: Check key formats ---")
print(f"Consumer Key length: {len(keys['consumer_key'])} chars")
print(f"Consumer Secret length: {len(keys['consumer_secret'])} chars")
print(f"Access Token length: {len(keys['access_token'])} chars")
print(f"Access Token Secret length: {len(keys['access_token_secret'])} chars")
print(f"Bearer Token length: {len(bearer)} chars")

# Check for common issues
issues = []
if keys["consumer_key"].startswith(" ") or keys["consumer_key"].endswith(" "):
    issues.append("Consumer Key has leading/trailing spaces")
if keys["consumer_secret"].startswith(" ") or keys["consumer_secret"].endswith(" "):
    issues.append("Consumer Secret has leading/trailing spaces")
if keys["access_token"].startswith(" ") or keys["access_token"].endswith(" "):
    issues.append("Access Token has leading/trailing spaces")
if keys["access_token_secret"].startswith(" ") or keys["access_token_secret"].endswith(" "):
    issues.append("Access Token Secret has leading/trailing spaces")

if issues:
    print("\nPOTENTIAL ISSUES FOUND:")
    for issue in issues:
        print(f"  - {issue}")
else:
    print("\nNo obvious formatting issues detected.")

print("\n--- Test 5: Raw HTTP request with requests library ---")
try:
    import requests
    from requests_oauthlib import OAuth1

    auth = OAuth1(
        keys["consumer_key"],
        keys["consumer_secret"],
        keys["access_token"],
        keys["access_token_secret"]
    )

    response = requests.get(
        "https://api.twitter.com/2/users/me",
        auth=auth
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text[:500]}")
except ImportError:
    print("requests-oauthlib not installed, skipping...")
except Exception as e:
    print(f"FAILED: {e}")
