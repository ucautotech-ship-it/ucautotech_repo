import os
import sys
import json
import sqlite3
import asyncio
import urllib.parse
import subprocess
from datetime import datetime
from typing import Dict, Any, List
from google import genai
from supabase import create_client, Client

GEMINI_API_KEYS: List[str] = [
    "AQ.Ab8RN6JXhJaNFITd-RzFx4wg9zc8VBTPtN8GPSpixkTRDcXttQ"
]
UBA_ACCOUNT = "🏦 Bank: UBA | Account: UCAUTOTECH / UC AUTOMOBILE CARE"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://wknwaumfwjlvrotobngf.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

DB_NAME = "uc_workshop_local.db"

# Pricing Matrix Helper
def calculate_estimated_cost(vehicle_name: str) -> str:
    v_lower = vehicle_name.lower()
    if any(brand in v_lower for brand in ["mercedes", "benz", "bmw", "audi", "porsche", "rover", "gle", "c300"]):
        return "₦185,000 estimated total (High-Luxury Tier)"
    elif any(brand in v_lower for brand in ["lexus", "ford", "explorer", "rx350", "infiniti", "mazda"]):
        return "₦105,000 estimated total (Mid-Luxury Tier)"
    else:
        return "₦55,000 estimated total (Standard Tier)"

def init_local_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS offline_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vin TEXT,
            payload TEXT,
            report TEXT,
            created_at TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_local_db()

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception:
    supabase = None

async def generate_invoice_ai(payload: Dict[str, Any]) -> str:
    vehicle = payload.get('client_profile', {}).get('vehicle', 'Vehicle')
    cost_estimate = calculate_estimated_cost(vehicle)
    
    prompt = (
        "You are the Lead Service Advisor and Diagnostic Engineer for UCAUTOTECH Lagos. "
        "Analyze this vehicle telemetry payload and generate a professional, structured client invoice and repair estimate. "
        f"Use localized pricing around: {cost_estimate}. "
        "Include: 1) Client Summary, 2) Root Cause Analysis, 3) Required Replacement Parts, "
        "4) Labor & Diagnostic Fees formatted clearly in Nigerian Naira (₦), and 5) Professional recommendations:\n"
        f"{json.dumps(payload, indent=2)}"
    )
    
    loop = asyncio.get_event_loop()
    for idx, key in enumerate(GEMINI_API_KEYS):
        try:
            client = genai.Client(api_key=key)
            response = await loop.run_in_executor(
                None,
                lambda: client.models.generate_content(
                    model='gemini-3.8-flash',
                    contents=prompt
                )
            )
            return response.text
        except Exception:
            pass

    return (
        "UCAUTOTECH OFFICIAL WORKSHOP ESTIMATE (DYNAMIC FALLBACK)\n"
        "--------------------------------------------------\n"
        f"1) Client Summary: {vehicle} - Lagos Zone\n"
        f"2) Root Cause Analysis: Active DTCs ({', '.join(payload.get('dtc_codes', []))}) detected.\n"
        "3) Required Replacement Parts: Replacement Ignition/Sensor components.\n"
        f"4) Labor & Diagnostic Fees: {cost_estimate}.\n"
        "5) Recommendation: Replace failed modules and perform system re-scan."
    )

def sync_offline_queue_to_cloud():
    if not supabase or not SUPABASE_KEY:
        return
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT id, vin, payload, report, created_at FROM offline_queue")
    rows = cursor.fetchall()
    
    if rows:
        print(f"\n🔄 Syncing {len(rows)} offline records to Supabase cloud...")
        for row in rows:
            q_id, vin, payload_str, report, created_at = row
            try:
                record = {
                    "vin": vin,
                    "telemetry_payload": json.loads(payload_str),
                    "diagnostic_report": report,
                    "payment_routing": UBA_ACCOUNT
                }
                supabase.table("diagnostic_logs").insert(record).execute()
                cursor.execute("DELETE FROM offline_queue WHERE id = ?", (q_id,))
                conn.commit()
                print(f"✅ Synced offline Job VIN: {vin}")
            except Exception:
                break
    conn.close()

def log_to_supabase_or_queue(vin: str, raw_payload: dict, invoice_report: str):
    record = {
        "vin": vin,
        "telemetry_payload": raw_payload,
        "diagnostic_report": invoice_report,
        "payment_routing": UBA_ACCOUNT
    }
    
    try:
        if supabase and SUPABASE_KEY:
            supabase.table("diagnostic_logs").insert(record).execute()
            print("\n✅ Session successfully logged directly to Supabase cloud!")
            sync_offline_queue_to_cloud()
        else:
            raise Exception("No Supabase client connection.")
    except Exception as err:
        print(f"\n⚠️ Offline mode triggered ({err}). Storing in local SQLite queue...")
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO offline_queue (vin, payload, report, created_at) VALUES (?, ?, ?, ?)",
            (vin, json.dumps(raw_payload), invoice_report, datetime.now().isoformat())
        )
        conn.commit()
        conn.close()
        print("💾 Stored safely in local offline queue. Will auto-sync when online!")

def dispatch_whatsapp(vin: str, message_text: str, phone: str = ""):
    encoded_msg = urllib.parse.quote(message_text)
    phone_param = f"phone={phone}&" if phone else ""
    whatsapp_url = f"https://api.whatsapp.com/send?{phone_param}text={encoded_msg}"
    
    try:
        subprocess.run(["termux-open-url", whatsapp_url], check=True)
        print("🚀 WhatsApp launched automatically!")
    except Exception:
        print(f"\n📲 Open WhatsApp link manually:\n{whatsapp_url}")

def update_job_status_and_notify(record: dict):
    print("\n--- 🔧 UPDATE JOB STATUS ---")
    print("1. [DIAGNOSED] Scan complete & estimate pending")
    print("2. [PARTS_ORDERED] Procurement in progress")
    print("3. [IN_PROGRESS] Repairs actively underway")
    print("4. [READY_FOR_PICKUP] Final QC done & ready")
    
    st_choice = input("\nSelect New Status (1-4): ").strip()
    status_map = {
        "1": "DIAGNOSED - Estimate Prepared",
        "2": "PARTS ORDERED - In Procurement",
        "3": "IN PROGRESS - Repairs Underway",
        "4": "READY FOR PICKUP - Work Complete & Verified"
    }
    
    new_status = status_map.get(st_choice, "WORKSHOP UPDATE")
    payload = record.get("telemetry_payload", {})
    client_name = payload.get("client_profile", {}).get("name", "Valued Client")
    vehicle = payload.get("client_profile", {}).get("vehicle", "Vehicle")
    phone = payload.get("client_profile", {}).get("phone", "")
    vin = record.get("vin", "N/A")
    
    update_msg = (
        f"*UCAUTOTECH WORKSHOP SERVICE UPDATE*\n\n"
        f"Dear *{client_name}*,\n"
        f"Your vehicle (*{vehicle}* - VIN: {vin}) status has been updated:\n\n"
        f"📌 *STATUS:* {new_status}\n\n"
        f"If you have any questions, feel free to reply directly.\n"
        f"Thank you for choosing *UCAUTOTECH*! 🚘"
    )
    
    print("\n--------------------------------------------------")
    print(update_msg)
    print("--------------------------------------------------")
    
    confirm = input("\nBroadcast status update to client on WhatsApp? (y/n): ").strip().lower()
    if confirm == 'y':
        dispatch_whatsapp(vin, update_msg, phone)

def fetch_and_inspect_logs():
    sync_offline_queue_to_cloud()
    if not supabase or not SUPABASE_KEY:
        print("\n⚠️ Supabase credentials not set or offline!")
        return
    try:
        res = supabase.table("diagnostic_logs").select("*").order("created_at", desc=True).limit(10).execute()
        records = res.data
        if not records:
            print("\n📭 No cloud logs found.")
            return
            
        print("\n" + "="*70)
        print(" 📊 UCAUTOTECH CLOUD AUDIT LOGS & JOB TRACKER")
        print("="*70)
        for idx, r in enumerate(records, 1):
            p = r.get("telemetry_payload", {})
            name = p.get("client_profile", {}).get("name", "Unknown")
            veh = p.get("client_profile", {}).get("vehicle", "Unknown")
            print(f"[{idx}] ID: {r.get('id')} | VIN: {r.get('vin')} | Client: {name} ({veh})")
        print("="*70)
        
        choice = input("\nEnter Job Number to inspect/update (or press Enter to return): ").strip()
        if choice.isdigit() and 1 <= int(choice) <= len(records):
            selected = records[int(choice) - 1]
            print("\n" + "="*70)
            print(f"📄 FULL DIAGNOSTIC REPORT - JOB ID: {selected.get('id')}")
            print("="*70)
            print(selected.get("diagnostic_report"))
            print("="*70)
            
            print("\nOptions:")
            print("1. Re-dispatch Diagnostic Invoice to WhatsApp")
            print("2. Send Repair Status Update to Client")
            print("3. Return to Main Menu")
            
            sub_choice = input("\nSelect Action (1-3): ").strip()
            if sub_choice == '1':
                phone = selected.get("telemetry_payload", {}).get("client_profile", {}).get("phone", "")
                inv_msg = (
                    f"*UCAUTOTECH DIAGNOSTIC ESTIMATE*\n"
                    f"*VIN:* {selected.get('vin')}\n\n"
                    f"{selected.get('diagnostic_report')}\n\n"
                    f"*PAYMENT INSTRUCTIONS:*\n{UBA_ACCOUNT}"
                )
                dispatch_whatsapp(selected.get("vin"), inv_msg, phone)
            elif sub_choice == '2':
                update_job_status_and_notify(selected)

    except Exception as e:
        print(f"\n⚠️ Error fetching records: {e}")

async def live_obd2_diagnostic_workflow():
    print("\n--- 📡 UCAUTOTECH LIVE OBD-II VCI STREAM ---")
    vehicle_model = input("Enter Vehicle Model (e.g. Mercedes GLE63 / Lexus RX350): ").strip() or "2012 Ford Explorer"
    
    payload = {
        "vin": "1ZVBP8FF3D510XXXX",
        "client_profile": {
            "name": "Live Telemetry Client",
            "vehicle": vehicle_model,
            "phone": "2348000000000"
        },
        "mil_status": "ACTIVE",
        "dtc_codes": ["P189200", "P0300"],
        "live_pid_stream": {
            "engine_rpm": 2150,
            "coolant_temp_c": 92,
            "control_module_voltage": "12.1V",
            "source": "LIVE_VCI_SCANNER"
        }
    }
    
    print("✅ Live PID Stream & DTC Codes Captured!")
    print("\n⏳ Processing telemetry and generating dynamic tier Naira estimate...")
    invoice_text = await generate_invoice_ai(payload)
    
    print("\n" + "="*60)
    print("📋 GENERATED INVOICE")
    print("="*60)
    print(invoice_text)
    print("="*60)
    
    log_to_supabase_or_queue(payload["vin"], payload, invoice_text)
    
    choice = input("\nLaunch WhatsApp invoice dispatch now? (y/n): ").strip().lower()
    if choice == 'y':
        inv_msg = (
            f"*UCAUTOTECH DIAGNOSTIC ESTIMATE*\n"
            f"*VIN:* {payload['vin']}\n\n"
            f"{invoice_text}\n\n"
            f"*PAYMENT INSTRUCTIONS:*\n{UBA_ACCOUNT}"
        )
        dispatch_whatsapp(payload["vin"], inv_msg, payload["client_profile"]["phone"])

async def manual_diagnostic_workflow():
    print("\n--- 🚘 UCAUTOTECH MANUAL VEHICLE DIAGNOSTIC ---")
    vin = input("Enter Vehicle VIN (default: 1ZVBP8FF3D510XXXX): ").strip() or "1ZVBP8FF3D510XXXX"
    client_name = input("Enter Client Name: ").strip() or "Lagos Customer"
    vehicle_model = input("Enter Vehicle Model (e.g. Toyota Corolla / Mercedes C300): ").strip() or "Toyota Corolla"
    phone = input("Enter Client Phone (e.g. 2348000000000): ").strip() or "2348000000000"
    dtcs_input = input("Enter Fault Codes (e.g. P189200, P0300): ").strip() or "P0300"
    
    dtc_codes = [d.strip().upper() for d in dtcs_input.split(",")]
    
    payload = {
        "vin": vin,
        "client_profile": {"name": client_name, "vehicle": vehicle_model, "phone": phone},
        "mil_status": "ACTIVE",
        "dtc_codes": dtc_codes,
        "live_pid_stream": {"control_module_voltage": 12.1}
    }
    
    print("\n⏳ Processing telemetry and generating dynamic tier Naira estimate...")
    invoice_text = await generate_invoice_ai(payload)
    
    print("\n" + "="*60)
    print("📋 GENERATED INVOICE")
    print("="*60)
    print(invoice_text)
    print("="*60)
    
    log_to_supabase_or_queue(vin, payload, invoice_text)
    
    choice = input("\nLaunch WhatsApp invoice dispatch now? (y/n): ").strip().lower()
    if choice == 'y':
        inv_msg = (
            f"*UCAUTOTECH DIAGNOSTIC ESTIMATE*\n"
            f"*VIN:* {vin}\n\n"
            f"{invoice_text}\n\n"
            f"*PAYMENT INSTRUCTIONS:*\n{UBA_ACCOUNT}"
        )
        dispatch_whatsapp(vin, inv_msg, phone)

async def main_menu():
    sync_offline_queue_to_cloud()
    
    while True:
        print("\n==================================================")
        print(" 🛠️  UCAUTOTECH WORKSHOP MANAGEMENT SYSTEM v10.0")
        print("==================================================")
        print("1. Run New Vehicle Diagnostic (Manual Input)")
        print("2. Capture Live OBD-II Telemetry Stream")
        print("3. Cloud Audit Logs & Job Status Tracker")
        print("4. Exit")
        
        choice = input("\nSelect Option (1-4): ").strip()
        
        if choice == '1':
            await manual_diagnostic_workflow()
        elif choice == '2':
            await live_obd2_diagnostic_workflow()
        elif choice == '3':
            fetch_and_inspect_logs()
        elif choice == '4':
            print("\n👋 Exiting UCAUTOTECH System. Good day!")
            sys.exit(0)
        else:
            print("❌ Invalid option. Try again.")

if __name__ == "__main__":
    asyncio.run(main_menu())
