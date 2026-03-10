#!/usr/bin/env python3
import os
import requests

OWNER = "KasturiKugathas"
REPO = "splash-ui"
TOKEN = os.environ["GITHUB_TOKEN"]

# Put exact issue numbers you want to delete here
ISSUE_NUMBERS = list(range(86, 101))  # 86..100 inclusive
# Example custom list: ISSUE_NUMBERS = [86, 87, 90, 95, 100]

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

for number in ISSUE_NUMBERS:
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/issues/{number}"
    resp = requests.delete(url, headers=headers, timeout=30)

    if resp.status_code == 204:
        print(f"Deleted issue #{number}")
    elif resp.status_code == 404:
        print(f"Issue #{number} not found (or no permission)")
    else:
        print(f"Failed #{number}: {resp.status_code} {resp.text}")

print("Done.")
