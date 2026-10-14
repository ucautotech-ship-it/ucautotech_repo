import os
import sys
import json
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

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception:
    supabase = None

async def generate_invoice_ai(payload: Dict[str, Any]) -> str:
    prompt = (
        "You are the Lead Service Advisor and Diagnostic Engineer for UCAUTOTECH Lagos. "
        "Analyze this vehicle telemetry payload and generate a professional, structured client invoice and repair estimate. "
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
        "UCAUTOTECH OFFICIAL WORKSHOP ESTIMATE (OFFLINE FALLBACK)\n"
        "--------------------------------------------------\n"
        f"1) Client Summary: {payload.get('client_profile', {}).get('vehicle', 'Vehicle')} - Lagos Zone\n"
        f"2) Root Cause Analysis: Active DTCs ({', '.join(payload.get('dtc_codes', []))}) detected.\n"
        "3) Required Replacement Parts: Replacement Ignition/Sensor components.\n"
        "4) Labor & Diagnostic Fees: ₦85,000 estimated total.\n"
        "5) Recommendation: Replace failed modules and perform system re-scan."
    )

def log_to_supabase(vin: str, raw_payload: dict, invoice_report: str):
    if not supabase or not SUPABASE_KEY:
        return
    try:
        record = {
            "vin": vin,
            "telemetry_payload": raw_payload,
            "diagnostic_report": invoice_report,
            "payment_routing": UBA_ACCOUNT
        }
        supabase.table("diagnostic_logs").insert(record).execute()
        print("\n✅ Session successfully logged to Supabase cloud database!")
    except Exception as err:
        print(f"\n⚠️ Supabase Logging Error: {err}")

def dispatch_whatsapp(vin: str, invoice_text: str, phone: str = ""):
    whatsapp_message = (
        f"*UCAUTOTECH DIAGNOSTIC ESTIMATE*\n"
        f"*VIN:* {vin}\n\n"
        f"{invoice_text}\n\n"
        f"*PAYMENT INSTRUCTIONS:*\n{UBA_ACCOUNT}"
    )
    encoded_msg = urllib.parse.quote(whatsapp_message)
    phone_param = f"phone={phone}&" if phone else ""
    whatsapp_url = f"https://api.whatsapp.com/send?{phone_param}text={encoded_msg}"
    
    try:
        subprocess.run(["termux-open-url", whatsapp_url], check=True)
        print("🚀 WhatsApp launched automatically!")
    except Exception:
        print(f"\n📲 Open WhatsApp link manually:\n{whatsapp_url}")

def fetch_and_inspect_logs():
    if not supabase or not SUPABASE_KEY:
        print("\n⚠️ Supabase credentials not set!")
        return
    try:
        res = supabase.table("diagnostic_logs").select("*").order("created_at", desc=True).limit(10).execute()
        records = res.data
        if not records:
            print("\n📭 No cloud logs found.")
            return
            
        print("\n" + "="*70)
        print(" 📊 UCAUTOTECH CLOUD AUDIT LOGS")
        print("="*70)
        for idx, r in enumerate(records, 1):
            p = r.get("telemetry_payload", {})
            name = p.get("client_profile", {}).get("name", "Unknown")
            veh = p.get("client_profile", {}).get("vehicle", "Unknown")
            print(f"[{idx}] ID: {r.get('id')} | VIN: {r.get('vin')} | Client: {name} ({veh})")
        print("="*70)
        
        choice = input("\nEnter Job Number to inspect full report (or press Enter to return): ").strip()
        if choice.isdigit() and 1 <= int(choice) <= len(records):
            selected = records[int(choice) - 1]
            print("\n" + "="*70)
            print(f"📄 FULL DIAGNOSTIC REPORT - JOB ID: {selected.get('id')}")
            print("="*70)
            print(selected.get("diagnostic_report"))
            print("="*70)
            
            re_send = input("\nRe-dispatch this report to WhatsApp? (y/n): ").strip().lower()
            if re_send == 'y':
                phone = selected.get("telemetry_payload", {}).get("client_profile", {}).get("phone", "")
                dispatch_whatsapp(selected.get("vin"), selected.get("diagnostic_report"), phone)

    except Exception as e:
        print(f"\n⚠️ Error fetching records: {e}")

async def new_diagnostic_workflow():
    print("\n--- 🚘 UCAUTOTECH NEW VEHICLE DIAGNOSTIC ---")
    vin = input("Enter Vehicle VIN (default: 1ZVBP8FF3D510XXXX): ").strip() or "1ZVBP8FF3D510XXXX"
    client_name = input("Enter Client Name: ").strip() or "Lagos Customer"
    vehicle_model = input("Enter Vehicle Model: ").strip() or "2012 Ford Explorer"
    phone = input("Enter Client Phone (e.g. 2348000000000): ").strip() or "2348000000000"
    dtcs_input = input("Enter Fault Codes (e.g. P189200, P0300): ").strip() or "P189200, P0300"
    
    dtc_codes = [d.strip().upper() for d in dtcs_input.split(",")]
    
    payload = {
        "vin": vin,
        "client_profile": {"name": client_name, "vehicle": vehicle_model, "phone": phone},
        "mil_status": "ACTIVE",
        "dtc_codes": dtc_codes,
        "live_pid_stream": {"control_module_voltage": 12.1}
    }
    
    print("\n⏳ Processing telemetry and generating Naira estimate...")
    invoice_text = await generate_invoice_ai(payload)
    
    print("\n" + "="*60)
    print("📋 GENERATED INVOICE")
    print("="*60)
    print(invoice_text)
    print("="*60)
    
    log_to_supabase(vin, payload, invoice_text)
    
    choice = input("\nLaunch WhatsApp invoice dispatch now? (y/n): ").strip().lower()
    if choice == 'y':
        dispatch_whatsapp(vin, invoice_text, phone)

async def main_menu():
    while True:
        print("\n==================================================")
        print(" 🛠️  UCAUTOTECH WORKSHOP MANAGEMENT SYSTEM v6.0")
        print("==================================================")
        print("1. Run New Vehicle Diagnostic & Invoice")
        print("2. Inspect Cloud Audit Logs & Re-send Invoices")
        print("3. Exit")
        
        choice = input("\nSelect Option (1-3): ").strip()
        
        if choice == '1':
            await new_diagnostic_workflow()
        elif choice == '2':
            fetch_and_inspect_logs()
        elif choice == '3':
            print("\n👋 Exiting UCAUTOTECH System. Good day!")
            sys.exit(0)
        else:
            print("❌ Invalid option. Try again.")

if __name__ == "__main__":
    asyncio.run(main_menu())
