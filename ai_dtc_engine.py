import os
import json
import time
import requests

def analyze_fault(dtc_code: str, freeze_frame: dict) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY environment variable not set."

    # Using the active production model endpoint
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={api_key}"
    
    prompt = f"""
    You are the Lead Diagnostic Engine for UCAUTOTECH (Ago Palace Way, Lagos).
    Analyze this vehicle diagnostic fault code:
    - Fault Code (DTC): {dtc_code}
    - Live Sensor Telemetry: {json.dumps(freeze_frame)}

    Provide a fast, highly accurate 3-part diagnostic report:
    1. Primary Root Cause Analysis.
    2. Specific Pinout/Wiring Diagram Component to Test.
    3. Step-by-Step Repair Action Plan.
    """
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    headers = {"Content-Type": "application/json"}
    
    max_retries = 3
    delay = 2  # seconds

    for attempt in range(1, max_retries + 1):
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            res_json = response.json()
            return res_json['candidates'][0]['content']['parts'][0]['text']
        elif response.status_code in (503, 429):
            print(f"[Notice] Server Busy ({response.status_code}) (Attempt {attempt}/{max_retries}). Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2
        else:
            return f"API Error ({response.status_code}): {response.text}"
            
    return "API Error: Server remained busy after retries. Please try again in a moment."

if __name__ == "__main__":
    print("[UCAUTOTECH AI DTC Analyzer] Engine online (REST mode)...")
    test_dtc = "P189200"
    test_telemetry = {"RPM": 1850, "Speed_KMH": 65, "CoolantTemp_C": 92}
    
    print(f"\n[Processing Code]: {test_dtc}")
    report = analyze_fault(test_dtc, test_telemetry)
    print("\n--- UCAUTOTECH AI DIAGNOSTIC REPORT ---")
    print(report)
