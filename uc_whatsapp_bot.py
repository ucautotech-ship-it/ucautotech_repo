import os
import sqlite3
import json
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://wknwaumfwjlvrotobngf.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "sb_secret_lygj4Q5MNEhynEVmAqa3MQ_FaTWGLCU")
DB_NAME = "uc_workshop_local.db"

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception:
    supabase = None

def search_client_inquiry():
    print("==================================================")
    print(" 🤖 UCAUTOTECH SMART CLIENT INQUIRY & SEARCH BOT")
    print("==================================================")
    query = input("Enter Client Name, Vehicle, DTC, or VIN: ").strip()
    if not query:
        print("⚠️ Empty search query. Returning to main menu.")
        return

    print(f"\n🔍 Searching UCAUTOTECH database for keywords in: '{query}'...")
    keywords = [k.lower().strip() for k in query.replace("po", "p0").split() if len(k) > 1]
    
    found_records = []

    # 1. Search Cloud Supabase
    if supabase:
        try:
            res = supabase.table("diagnostic_logs").select("*").execute()
            cloud_records = res.data or []
            for r in cloud_records:
                p = r.get("telemetry_payload", {})
                client_info = p.get("client_profile", {}) if isinstance(p, dict) else {}
                searchable_text = f"{r.get('vin', '')} {client_info.get('name', '')} {client_info.get('vehicle', '')} {r.get('diagnostic_report', '')}".lower()
                
                # Check if any keyword matches
                if any(kw in searchable_text for kw in keywords):
                    found_records.append((r, "CLOUD"))
        except Exception as e:
            print(f"⚠️ Supabase Search Error: {e}")

    # 2. Search Local SQLite Fallback if needed
    if not found_records and os.path.exists(DB_NAME):
        try:
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()
            cursor.execute("SELECT vin, client_name, vehicle_model, diagnostic_report FROM diagnostics")
            rows = cursor.fetchall()
            for row in rows:
                searchable_text = f"{row[0]} {row[1]} {row[2]} {row[3]}".lower()
                if any(kw in searchable_text for kw in keywords):
                    found_records.append(({
                        "vin": row[0],
                        "telemetry_payload": {"client_profile": {"name": row[1], "vehicle": row[2]}},
                        "diagnostic_report": row[3]
                    }, "LOCAL SQLITE"))
            conn.close()
        except Exception as e:
            print(f"⚠️ Local DB Search Error: {e}")

    # Display Results or Offer Instant Creation
    if found_records:
        print(f"\n✅ FOUND {len(found_records)} MATCHING RECORD(S):\n")
        for idx, (rec, source) in enumerate(found_records, 1):
            p = rec.get("telemetry_payload", {})
            client_info = p.get("client_profile", {}) if isinstance(p, dict) else {}
            print("="*60)
            print(f"[{idx}] RECORD FOUND ({source}) - VIN: {rec.get('vin')}")
            print("="*60)
            print(f"• Client Name: {client_info.get('name', 'N/A')}")
            print(f"• Vehicle: {client_info.get('vehicle', 'N/A')}")
            print(f"• Diagnostic Summary:\n{rec.get('diagnostic_report')}")
            print("="*60)
    else:
        print(f"\n❌ No existing records found matching keywords: {keywords}")
        print("\n💡 INSTANT WORKFLOW OPPORTUNITY:")
        create_new = input(f"Would you like to log a NEW diagnostic entry for '{query}' now? (y/n): ").strip().lower()
        if create_new == 'y':
            os.system("python uc_ai_diagnostic.py")

if __name__ == "__main__":
    search_client_inquiry()
