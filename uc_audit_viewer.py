import os
import json
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://wknwaumfwjlvrotobngf.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"⚠️ Supabase connection error: {e}")
    supabase = None

def view_all_workshop_logs():
    if not supabase or not SUPABASE_KEY:
        print("⚠️ Supabase credentials missing! Set your SUPABASE_KEY environment variable.")
        return
        
    try:
        response = supabase.table("diagnostic_logs").select("*").order("created_at", desc=True).limit(10).execute()
        records = response.data
        
        if not records:
            print("\n📭 No diagnostic logs found in the Supabase database yet.")
            return
            
        print("\n" + "="*70)
        print(" 📊 UCAUTOTECH CLOUD AUDIT LOGS (RECENT 10 JOBS)")
        print("="*70)
        
        for idx, rec in enumerate(records, 1):
            log_id = rec.get("id")
            vin = rec.get("vin")
            created_at = rec.get("created_at", "N/A")
            payload = rec.get("telemetry_payload", {})
            client_name = payload.get("client_profile", {}).get("name", "Unknown Client")
            vehicle = payload.get("client_profile", {}).get("vehicle", "Unknown Vehicle")
            
            print(f"[{idx}] Job ID: {log_id} | VIN: {vin}")
            print(    f"    Customer: {client_name} ({vehicle})")
            print(    f"    Timestamp: {created_at}")
            print("-" * 70)
            
    except Exception as err:
        print(f"⚠️ Error fetching cloud logs: {err}")

if __name__ == "__main__":
    view_all_workshop_logs()
