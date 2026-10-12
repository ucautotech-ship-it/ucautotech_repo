# UCAUTOTECH Master Ecosystem Configuration
# Shared across Termux, Pydroid 3, Supabase, and Web frontends.

SUPABASE_URL = "https://wknwaumfwjlvrotobngf.supabase.co"
CONFIG_FILE = "supabase_config.txt"

def load_shared_key():
    try:
        with open(CONFIG_FILE, "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        return None

print("[UCAUTOTECH ECOSYSTEM] Environment configuration loaded successfully.")
