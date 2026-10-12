# UCAUTOTECH Master Ecosystem Configuration
# Shared across Termux, Pydroid 3, Supabase, and Web frontends.
import os

SUPABASE_URL = "https://wknwaumfwjlvrotobngf.supabase.co"
CONFIG_FILE = "supabase_config.txt"

def load_shared_key():
    try:
        with open(CONFIG_FILE, "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        return None

# Auto-inject key into environment
key = load_shared_key()
if key:
    os.environ["GEMINI_API_KEY"] = key

print("[UCAUTOTECH ECOSYSTEM] Environment configuration loaded successfully.")
