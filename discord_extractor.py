"""
Discord Bot Zip Extractor
─────────────────────────
Sends /gen <app_id> to the Contrary Turtle Tool bot and downloads + extracts the zip file.

Usage:
  python discord_extractor.py
  Then enter app IDs when prompted.

Requirements:
  pip install requests python-dotenv
"""

import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import time
import re
import json
import requests
import zipfile
import io

# ─── Configuration ────────────────────────────────────────────────────────────
DISCORD_TOKEN      = os.getenv("DISCORD_TOKEN", "YOUR_DISCORD_TOKEN_HERE")
CHANNEL_ID         = "1491535143956123781"
BOT_APPLICATION_ID = "1472613875815026708"
GUILD_ID           = "1491535143339557086"
OUTPUT_FOLDER      = r"C:\Users\sayed\Downloads\luas"

# Discovered command details (from guild application-command-index)
GEN_COMMAND_ID      = "1472651570956210237"
GEN_COMMAND_VERSION = "1472665975265689761"

# ─── Discord API ──────────────────────────────────────────────────────────────
BASE_URL = "https://discord.com/api/v9"
HEADERS = {
    "Authorization": DISCORD_TOKEN,
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}


def send_gen_command(app_id):
    """Sends /gen appid:<app_id> to the Contrary Turtle Tool bot."""
    payload = {
        "type": 2,
        "application_id": BOT_APPLICATION_ID,
        "guild_id": GUILD_ID,
        "channel_id": CHANNEL_ID,
        "session_id": "extractor_session",
        "data": {
            "version": GEN_COMMAND_VERSION,
            "id": GEN_COMMAND_ID,
            "name": "gen",
            "type": 1,
            "options": [
                {
                    "type": 3,
                    "name": "appid",
                    "value": str(app_id)
                }
            ],
        },
        "nonce": str(int(time.time() * 1000000))
    }

    res = requests.post(f"{BASE_URL}/interactions", headers=HEADERS, json=payload)
    if res.status_code in (200, 204):
        print(f"  [+] Sent /gen {app_id}")
        return True
    else:
        print(f"  [!] Failed to send /gen. Status: {res.status_code} - {res.text[:300]}")
        return False


def get_baseline_message_ids():
    """Get current message IDs BEFORE sending a command."""
    url = f"{BASE_URL}/channels/{CHANNEL_ID}/messages?limit=10"
    seen = set()
    try:
        r = requests.get(url, headers=HEADERS)
        if r.status_code == 200:
            for m in r.json():
                seen.add(m["id"])
    except Exception:
        pass
    return seen


def wait_for_zip_url(app_id, baseline_ids, timeout=45, poll_interval=2):
    """
    Polls channel for the bot's response. The bot embeds zip download links
    inside button components, not as file attachments.
    Returns (zip_url, game_name) or (None, None).
    """
    print(f"  [*] Waiting for bot response...")

    url = f"{BASE_URL}/channels/{CHANNEL_ID}/messages?limit=10"
    start = time.time()

    while time.time() - start < timeout:
        time.sleep(poll_interval)
        try:
            r = requests.get(url, headers=HEADERS)
            if r.status_code != 200:
                continue
            for msg in r.json():
                if msg["id"] in baseline_ids:
                    continue

                # Is this from the bot?
                author = msg.get("author", {})
                interaction = msg.get("interaction", {})
                is_bot_gen = (
                    author.get("id") == BOT_APPLICATION_ID or
                    interaction.get("name") == "gen"
                )
                if not is_bot_gen:
                    baseline_ids.add(msg["id"])
                    continue

                baseline_ids.add(msg["id"])

                # Get game name from embed title
                game_name = "Unknown"
                embeds = msg.get("embeds", [])
                for emb in embeds:
                    title = emb.get("title", "")
                    if title and "not found" not in title.lower():
                        game_name = title
                    elif "not found" in title.lower():
                        print(f"  [!] Bot says: File not found for app {app_id}")
                        return None, None

                # Extract URL from button components
                components = msg.get("components", [])
                for row in components:
                    for comp in row.get("components", []):
                        comp_url = comp.get("url", "")
                        if "http" in comp_url:
                            print(f"  [+] Found link for: {game_name}")
                            return comp_url, game_name

                # Also check attachments just in case
                for att in msg.get("attachments", []):
                    if att.get("filename", "").endswith(".zip"):
                        return att["url"], game_name

                print(f"  [~] Bot responded but no zip link found")

        except Exception as e:
            print(f"  [!] Poll error: {e}")

    print(f"  [!] Timed out after {timeout}s")
    return None, None


def download_and_extract(zip_url, app_id, game_name, output_folder):
    """Downloads zip and extracts .lua files."""
    os.makedirs(output_folder, exist_ok=True)

    print(f"  [*] Downloading zip...")
    try:
        r = requests.get(zip_url)
        r.raise_for_status()

        # Save raw zip
        zip_path = os.path.join(output_folder, f"{app_id}.zip")
        with open(zip_path, "wb") as f:
            f.write(r.content)

        # Extract
        with zipfile.ZipFile(io.BytesIO(r.content)) as z:
            files = z.namelist()
            print(f"  [*] Zip contains {len(files)} files. Extracting .lua only...")

            for name in files:
                if not name.endswith(".lua"):
                    continue
                    
                data = z.read(name)
                # Save with app_id prefix for clarity
                save_name = f"{app_id}.lua"
                save_path = os.path.join(output_folder, save_name)
                with open(save_path, "wb") as f:
                    f.write(data)
                print(f"  [+] Saved LUA: {save_path}")

        print(f"  [OK] {game_name} (ID: {app_id}) complete!")
        return True

    except zipfile.BadZipFile:
        print(f"  [!] Not a valid zip file, treating as a raw .lua file.")
        save_path = os.path.join(output_folder, f"{app_id}.lua")
        with open(save_path, "wb") as f:
            f.write(r.content)
        print(f"  [+] Saved LUA: {save_path}")
        print(f"  [OK] {game_name} (ID: {app_id}) complete!")
        return True
    except Exception as e:
        print(f"  [!] Error: {e}")
        return False


def process(app_id):
    """Full pipeline for one app ID."""
    print(f"\n{'='*50}")
    print(f"  App ID: {app_id}")
    print(f"{'='*50}")

    # Snapshot BEFORE sending so we don't miss fast bot replies
    baseline = get_baseline_message_ids()

    if not send_gen_command(app_id):
        return False

    zip_url, game_name = wait_for_zip_url(app_id, baseline)
    if not zip_url:
        return False

    return download_and_extract(zip_url, app_id, game_name, OUTPUT_FOLDER)


def main():
    print("""
+======================================================+
|  Contrary Turtle Tool - Auto Zip Extractor v2.0      |
|  Sends /gen <appid> and downloads the lua zip        |
+======================================================+
    """)
    print(f"  Output: {OUTPUT_FOLDER}")
    print(f"  Bot: Contrary Turtle Tool ({BOT_APPLICATION_ID})")
    print(f"  Command: /gen (ID: {GEN_COMMAND_ID})")
    print(f"  Press Ctrl+C to exit.\n")

    while True:
        try:
            user_input = input("Enter App ID(s) [e.g. '730,440', '100-200', or 'auto 100' for infinite]: ").strip()
            if not user_input:
                continue

            app_ids = []
            
            # --- Auto Continuous Mode ---
            if user_input.lower().startswith("auto"):
                parts = user_input.split()
                if len(parts) >= 2 and parts[1].isdigit():
                    start_id = int(parts[1])
                    print(f"\n[*] Starting CONTINUOUS extraction from App ID {start_id}...")
                    print(f"[*] Most Steam base games increment by 10 (10, 20, 30...).")
                    print(f"[*] (Press Ctrl+C to stop the infinite loop)\n")
                    
                    app_id = start_id
                    while True:
                        process(str(app_id))
                        app_id += 1  # Incrementing by 1 covers EVERY single ID
                        
                        delay = 4
                        print(f"  [*] Rate limit pause ({delay}s)...")
                        time.sleep(delay)
                else:
                    print("  [!] Invalid auto syntax. Usage: auto <start_id> (e.g., auto 100)")
                continue

            # Parse standard input
            for part in user_input.split(","):
                part = part.strip()
                if "-" in part and part.replace("-", "").isdigit():
                    a, b = part.split("-", 1)
                    app_ids.extend(str(i) for i in range(int(a), int(b) + 1))
                elif part.isdigit():
                    app_ids.append(part)
                else:
                    print(f"  [!] Skipping invalid: {part}")

            if not app_ids:
                continue

            success = 0
            fail = 0
            for i, app_id in enumerate(app_ids):
                result = process(app_id)
                if result:
                    success += 1
                else:
                    fail += 1

                # Rate limit between commands
                if i < len(app_ids) - 1:
                    delay = 4
                    print(f"  [*] Rate limit pause ({delay}s)...")
                    time.sleep(delay)

            print(f"\n  Done! {success} succeeded, {fail} failed out of {len(app_ids)} total.\n")

        except KeyboardInterrupt:
            print("\n\nExiting...")
            break


if __name__ == "__main__":
    main()
