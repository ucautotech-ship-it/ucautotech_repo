import os
import json
import asyncio
from typing import Dict, Any
from google import genai
from supabase import create_client, Client

# Configuration & API Credentials
GEMINI_API_KEY = "AQ.Ab8RN6JXhJaNFITd-RzFx4wg9zc8VBTPtN8GPSpixkTRDcXttQ"
UBA_ACCOUNT = "🏦 Bank: UBA | Account: UCAUTOTECH / UC AUTOMOBILE CARE"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

ai_client = genai.Client(api_key=GEMINI_API_KEY)

# Initialize Supabase Client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"⚠️ Supabase connection warning: {e}")
    supabase = None

async def run_neural_fault_correlation(payload: Dict[str, Any]) -> str:
    prompt = (
        "You are the Advanced Predictive Diagnostic Core (APDC) AI Engine for UCAUTOTECH Lagos. "
        "Analyze this vehicle telemetry payload immediately and output clean JSON with keys: "
        "'severity_score_1_10', 'root_cause', 'cascading_risks', 'localized_repair_roadmap_naira', and 'required_components':\n"
        f"{json.dumps(payload, indent=2)}"
    )
    
    loop = asyncio.get_event_loop()
    max_retries = 3
    delay = 2

    for attempt in range(max_retries):
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
            print(f"⚠️ High demand spike detected (Attempt {attempt + 1}/{max_retries}). Retrying in {delay}s...")
            await asyncio.sleep(delay)
            delay *= 2
            if attempt == max_retries - 1:
                raise e

def save_to_supabase_audit_trail(vin: str, raw_payload: dict, ai_report: str):
    if not supabase or not SUPABASE_URL:
        print("\nℹ️ [Supabase Cloud Audit] Credentials pending. Skipped database insertion.")
        return
        
    try:
        record = {
            "vin": vin,
            "telemetry_payload": raw_payload,
            "diagnostic_report": ai_report,
            "payment_routing": UBA_ACCOUNT
        }
        data = supabase.table("diagnostic_logs").insert(record).execute()
        print("\n✅ [Supabase Cloud Audit] Diagnostic session logged successfully to cloud database!")
    except Exception as err:
        print(f"\n⚠️ [Supabase Cloud Audit Error] {err}")

async def process_incoming_vehicle_stream(telemetry_data: Dict[str, Any]):
    print(f"\n🚀 [UCAUTOTECH MASTER PIPELINE] Processing vehicle matrix for VIN: {telemetry_data.get('vin')}...\n")
    
    master_report = await run_neural_fault_correlation(telemetry_data)
    
    print("📋 Master Diagnostic Report Generated Successfully:")
    print(master_report)
    
    print(f"\n💳 Financial Routing Instruction:")
    print(f"Route all service and parts payments strictly to: {UBA_ACCOUNT}")
    print(f"🔒 Awaiting Master CEO 'Green Light' authorization for workshop deployment.\n")
    
    save_to_supabase_audit_trail(telemetry_data.get("vin"), telemetry_data, master_report)

if __name__ == "__main__":
    sample_payload = {
        "vin": "WA1VAFGE2GAXXXXXX",
        "client_profile": {"name": "Valued Client", "region": "Lagos Zone"},
        "mil_status": "ACTIVE",
        "dtc_codes": ["P0300", "P0191", "P0562"],
        "live_pid_stream": {
            "engine_rpm": 2450,
            "calculated_load_pct": 78.5,
            "short_term_fuel_trim_bank1": 18.2,
            "long_term_fuel_trim_bank1": 22.4,
            "fuel_rail_pressure_kpa": 2100,
            "control_module_voltage": 11.4,
            "mass_air_flow_g_s": 42.1
        },
        "thermal_signatures": {
            "catalytic_converter_temp_c": 820,
            "exhaust_manifold_cylinder_3_c": 110
        },
        "acoustic_metrics": {"anomaly_score": 0.84}
    }
    
    asyncio.run(process_incoming_vehicle_stream(sample_payload))
