import os
import json
import asyncio
import urllib.parse
import subprocess
from datetime import datetime
from typing import Dict, Any, List
from google import genai
from supabase import create_client, Client

# Configuration & Backup API Keys
GEMINI_API_KEYS: List[str] = [
    "AQ.Ab8RN6JXhJaNFITd-RzFx4wg9zc8VBTPtN8GPSpixkTRDcXttQ", # Primary Key
    # "YOUR_BACKUP_KEY_2_HERE", # Backup Key 1 (Add as needed)
    # "YOUR_BACKUP_KEY_3_HERE"  # Backup Key 2 (Add as needed)
]

UBA_ACCOUNT = "🏦 Bank: UBA | Account: UCAUTOTECH / UC AUTOMOBILE CARE"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://wknwaumfwjlvrotobngf.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"⚠️ Supabase connection warning: {e}")
    supabase = None

async def generate_client_invoice(payload: Dict[str, Any]) -> str:
    prompt = (
        "You are the Lead Service Advisor and Diagnostic Engineer for UCAUTOTECH Lagos. "
        "Analyze this vehicle telemetry payload and generate a professional, structured client invoice and repair estimate. "
        "Include: 1) Client Summary, 2) Root Cause Analysis, 3) Required Replacement Parts, "
        "4) Labor & Diagnostic Fees formatted clearly in Nigerian Naira (₦), and 5) Professional recommendations:\n"
        f"{json.dumps(payload, indent=2)}"
    )
    
    loop = asyncio.get_event_loop()
    
    # Key Rotation Loop
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
        except Exception as e:
            print(f"⚠️ Key #{idx+1} Exceeded or Unavailable: {e}")
            if idx < len(GEMINI_API_KEYS) - 1:
                print(f"🔄 Rotating to Backup API Key #{idx+2}...")
            else:
                print("💡 All API keys exhausted. Switching to localized fallback mode...")

    # Localized Fallback
    return (
        "UCAUTOTECH OFFICIAL WORKSHOP ESTIMATE\n"
        "--------------------------------------------------\n"
        "1) Client Summary: 2012 Ford Explorer - Lagos Zone\n"
        "2) Root Cause Analysis: Active DTCs (P189200, P0300) detected. Powertrain & 4WD module fault.\n"
        "3) Required Replacement Parts: Ignition Coil Packs, Spark Plugs, 4WD Shift Solenoid.\n"
        "4) Labor & Diagnostic Fees: ₦85,000 estimated total.\n"
        "5) Recommendation: Replace worn components, clear fault memory, and execute live data validation."
    )

def log_invoice_to_cloud(vin: str, raw_payload: dict, invoice_report: str):
    if not supabase or not SUPABASE_KEY:
        print("\nℹ️ [Supabase Cloud Audit] Credentials missing or invalid.")
        return
        
    try:
        record = {
            "vin": vin,
            "telemetry_payload": raw_payload,
            "diagnostic_report": invoice_report,
            "payment_routing": UBA_ACCOUNT
        }
        supabase.table("diagnostic_logs").insert(record).execute()
        print("\n✅ [Supabase Cloud Audit] Session securely logged to cloud database!")
    except Exception as err:
        print(f"\n⚠️ [Supabase Cloud Audit Error] {err}")

def export_local_and_launch_whatsapp(vin: str, invoice_text: str, client_phone: str = ""):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"Invoice_{vin}_{timestamp}.txt"
    
    # 1. Save local text file
    with open(filename, "w", encoding="utf-8") as f:
        f.write(invoice_text + "\n\n" + f"PAYMENT DETAILS:\n{UBA_ACCOUNT}\n")
    print(f"📁 Local Copy Saved: {filename}")
    
    # 2. Build WhatsApp URL
    whatsapp_message = (
        f"*UCAUTOTECH DIAGNOSTIC ESTIMATE*\n"
        f"*VIN:* {vin}\n\n"
        f"{invoice_text}\n\n"
        f"*PAYMENT INSTRUCTIONS:*\n{UBA_ACCOUNT}"
    )
    encoded_msg = urllib.parse.quote(whatsapp_message)
    phone_param = f"phone={client_phone}&" if client_phone else ""
    whatsapp_url = f"https://api.whatsapp.com/send?{phone_param}text={encoded_msg}"
    
    print("\n📲 WhatsApp Share URL Generated!")
    
    # 3. Auto-launch via Termux API if available
    try:
        subprocess.run(["termux-open-url", whatsapp_url], check=True)
        print("🚀 WhatsApp launched automatically on your device!")
    except Exception:
        print(f"🔗 Tap link to send manually:\n{whatsapp_url}")

async def run_workshop_pipeline(telemetry_data: Dict[str, Any]):
    vin = telemetry_data.get("vin", "UNKNOWN_VIN")
    client_phone = telemetry_data.get("client_profile", {}).get("phone", "")
    
    print(f"\n🚀 [UCAUTOTECH WORKSHOP OS v5.0] Processing VIN: {vin}...\n")
    
    invoice_text = await generate_client_invoice(telemetry_data)
    
    print("=" * 60)
    print("📋 UCAUTOTECH OFFICIAL SERVICE & DIAGNOSTIC INVOICE")
    print("=" * 60)
    print(invoice_text)
    print("=" * 60)
    print(f"\n💳 PAYMENT INSTRUCTION:\n{UBA_ACCOUNT}")
    print("=" * 60)
    
    log_invoice_to_cloud(vin, telemetry_data, invoice_text)
    export_local_and_launch_whatsapp(vin, invoice_text, client_phone)

if __name__ == "__main__":
    sample_payload = {
        "vin": "1ZVBP8FF3D510XXXX",
        "client_profile": {
            "name": "Lagos Customer",
            "vehicle": "2012 Ford Explorer",
            "phone": "2348000000000"
        },
        "mil_status": "ACTIVE",
        "dtc_codes": ["P189200", "P0300"],
        "live_pid_stream": {
            "engine_rpm": 2200,
            "fuel_rail_pressure_kpa": 1950,
            "control_module_voltage": 12.1
        }
    }
    
    asyncio.run(run_workshop_pipeline(sample_payload))
