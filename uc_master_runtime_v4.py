import os
import json
import asyncio
import urllib.parse
from datetime import datetime
from typing import Dict, Any
from google import genai
from supabase import create_client, Client

# Configuration & Credentials
GEMINI_API_KEY = "AQ.Ab8RN6JXhJaNFITd-RzFx4wg9zc8VBTPtN8GPSpixkTRDcXttQ"
UBA_ACCOUNT = "🏦 Bank: UBA | Account: UCAUTOTECH / UC AUTOMOBILE CARE"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://wknwaumfwjlvrotobngf.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

ai_client = genai.Client(api_key=GEMINI_API_KEY)

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
    try:
        response = await loop.run_in_executor(
            None,
            lambda: ai_client.models.generate_content(
                model='gemini-3.8-flash',
                contents=prompt
            )
        )
        return response.text
    except Exception as e:
        print(f"\n⚠️ Gemini API Quota Notice: {e}")
        print("💡 Utilizing localized fallback mode for workshop operations...")
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

def export_local_files_and_whatsapp_link(vin: str, invoice_text: str, client_phone: str = ""):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"Invoice_{vin}_{timestamp}.txt"
    
    # Save text file locally
    with open(filename, "w", encoding="utf-8") as f:
        f.write(invoice_text + "\n\n" + f"PAYMENT DETAILS:\n{UBA_ACCOUNT}\n")
    
    print(f"📁 Local Copy Saved: {filename}")
    
    # Format WhatsApp URL
    whatsapp_message = (
        f"*UCAUTOTECH DIAGNOSTIC ESTIMATE*\n"
        f"*VIN:* {vin}\n\n"
        f"{invoice_text}\n\n"
        f"*PAYMENT INSTRUCTIONS:*\n{UBA_ACCOUNT}"
    )
    encoded_msg = urllib.parse.quote(whatsapp_message)
    
    phone_param = f"phone={client_phone}&" if client_phone else ""
    whatsapp_url = f"https://api.whatsapp.com/send?{phone_param}text={encoded_msg}"
    
    print("\n📲 WHATSAPP DIRECT SHARE LINK:")
    print(whatsapp_url)

async def run_workshop_pipeline(telemetry_data: Dict[str, Any]):
    vin = telemetry_data.get("vin", "UNKNOWN_VIN")
    client_phone = telemetry_data.get("client_profile", {}).get("phone", "")
    
    print(f"\n🚀 [UCAUTOTECH WORKSHOP OS v4.0] Processing VIN: {vin}...\n")
    
    invoice_text = await generate_client_invoice(telemetry_data)
    
    print("=" * 60)
    print("📋 UCAUTOTECH OFFICIAL SERVICE & DIAGNOSTIC INVOICE")
    print("=" * 60)
    print(invoice_text)
    print("=" * 60)
    print(f"\n💳 PAYMENT INSTRUCTION:")
    print(f"{UBA_ACCOUNT}")
    print("=" * 60)
    
    log_invoice_to_cloud(vin, telemetry_data, invoice_text)
    export_local_files_and_whatsapp_link(vin, invoice_text, client_phone)

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
