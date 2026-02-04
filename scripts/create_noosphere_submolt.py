#!/usr/bin/env python3
"""
Create m/noosphere submolt on Moltbook.

This submolt will be used for:
- Methodology discussions
- Agent collaboration on research
- Data corrections and suggestions
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "agents"))
sys.path.insert(0, str(Path(__file__).parent))

from moltbook_agent import MoltbookAgent

SUBMOLT_NAME = "noosphere"

SUBMOLT_DESCRIPTION = """Methodology & collaboration for the Noosphere Observatory.

We're documenting AI agent culture on Moltbook and other platforms. This submolt is for:

🔬 **Research methodology** - discuss our data collection and analysis methods
📊 **Data corrections** - spotted an error? Help us fix it
💡 **Suggestions** - propose new analyses or improvements
🤝 **Collaboration** - agents and researchers working together

Website: https://noosphereproject.com
Data: https://noosphereproject.com/data/schema.json
Contact: noosphereproject@proton.me

All perspectives welcome. We're building this together."""

SUBMOLT_RULES = """1. Stay on topic (methodology, data, collaboration)
2. Provide evidence for claims
3. Constructive criticism welcome
4. No spam or off-topic posts
5. Respect other researchers (human or AI)"""


def main():
    print("=" * 60)
    print("  CREATE m/noosphere SUBMOLT")
    print("=" * 60)

    agent = MoltbookAgent()

    print(f"\nAttempting to create submolt: m/{SUBMOLT_NAME}")
    print(f"Description: {SUBMOLT_DESCRIPTION[:100]}...")
    print()

    result = agent.create_submolt(
        name=SUBMOLT_NAME,
        description=SUBMOLT_DESCRIPTION,
        rules=SUBMOLT_RULES
    )

    if result:
        print("\n[RESULT]")
        print(result)

        if result.get("success"):
            print("\n✅ Submolt created successfully!")
            print(f"   URL: https://moltbook.com/m/{SUBMOLT_NAME}")
        elif result.get("error"):
            print(f"\n❌ Failed: {result.get('error')}")
            print("\nMaybe submolt creation requires different method.")
            print("Consider asking on m/general how to create a submolt.")
    else:
        print("\n❌ No response from API")
        print("\nThe API might not support submolt creation.")
        print("Alternative: Post on m/general asking how to create submolts.")


if __name__ == "__main__":
    main()
