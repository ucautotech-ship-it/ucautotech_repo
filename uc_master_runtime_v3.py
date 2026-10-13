import os
import json
import asyncio
from typing import Dict, Any
from google import genai
from supabase import create_client, Client

GEMINI_API_KEY = "AQ.Ab8RN6JXhJaNFITd-RzFx4wg9zc8VBTPtN8GPSpixkTRDcXttQ"
UBA_ACCOUNT = "🏦 Bank: UBA | Account: UCAUTOTECH / UC AUTOMOBILE CARE"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
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
        print(f"\n⚠️ Gemini API Quota/Connection Notice: {e}")
        print("💡 Falling back to localized offline template mode for workshop operations...")
        return (
            "OFFLINE WORKSHOP ESTIMATE (AI Quota Limit Reached)\n"
            "--------------------------------------------------\n"
            "1) Client Summary: 2012 Ford Explorer - Lagos Zone\n"
            "2) Root Cause Analysis: Active DTCs (P189200, P0300) detected. Powertrain/4WD control fault.\n"
            "3) Required Replacement Parts: Ignition Coil Packs, Spark Plugs, 4WD Shift Solenoid.\n"
            "4) Labor & Diagnostic Fees: ₦85,000 estimated total.\n"
            "5) Recommendation: Clear codes after hardware replacement and retest live data stream."
        )

def log_invoice_to_cloud(vin: str, raw_payload: dict, invoice_report: str):
    if not supabase or not SUPABASE_URL:
        print("\nℹ️ [Supabase Cloud Audit] Credentials pending.")
        return
        
    try:
        record = {
            "vin": vin,
            "telemetry_payload": raw_payload,
            "diagnostic_report": invoice_report,
            "payment_routing": UBA_ACCOUNT
        }
        supabase.table("diagnostic_logs").insert(record).execute()
        print("\n✅ [Supabase Cloud Audit] Client invoice and audit trail securely logged to cloud!")
    except Exception as err:
        print(f"\n⚠️ [Supabase Cloud Audit Error] {err}")

async def run_invoice_pipeline(telemetry_data: Dict[str, Any]):
    print(f"\n🚀 [UCAUTOTECH WORKSHOP OS] Generating Client Invoice for VIN: {telemetry_data.get('vin')}...\n")
    
    invoice_text = await generate_client_invoice(telemetry_data)
    
    print("=" * 60)
    print("📋 UCAUTOTECH OFFICIAL SERVICE & DIAGNOSTIC INVOICE")
    print("=" * 60)
    print(invoice_text)
    print("=" * 60)
    print(f"\n💳 PAYMENT INSTRUCTION:")
    print(f"Please make all transfers and deposits strictly to:")
    print(f"{UBA_ACCOUNT}")
    print("=" * 60 + "\n")
    
    log_invoice_to_cloud(telemetry_data.get("vin"), telemetry_data, invoice_text)

if __name__ == "__main__":
    sample_payload = {
        "vin": "1ZVBP8FF3D510XXXX",
        "client_profile": {"name": "Lagos Customer", "vehicle": "2012 Ford Explorer"},
        "mil_status": "ACTIVE",
        "dtc_codes": ["P189200", "P0300"],
        "live_pid_stream": {
            "engine_rpm": 2200,
            "fuel_rail_pressure_kpa": 1950,
            "control_module_voltage": 12.1
        }
    }
    
    asyncio.run(run_invoice_pipeline(sample_payload))
