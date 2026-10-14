import time, requests

SUPABASE_URL = "https://wknwaumfwjlvrotobngf.supabase.co/rest/v1/telemetry"
SUPABASE_KEY = "PASTE_YOUR_ACTUAL_SUPABASE_KEY_HERE"

def push_telemetry(vin, dtc, rpm, temp):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    payload = {
        "vin": vin,
        "dtc_active": dtc,
        "engine_rpm": int(rpm),
        "coolant_temp": float(temp),
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    try:
        print("[DEBUG] Sending payload to Supabase...")
        res = requests.post(SUPABASE_URL, json=payload, headers=headers, timeout=5)
        print(f"[DEBUG] Response Status: {res.status_code}")
        print(f"[DEBUG] Response Body: {res.text}")
        if res.status_code in [200, 201, 204]:
            print(f"[SUCCESS] Packet sent! RPM: {rpm} | Temp: {temp}°C")
        else:
            print(f"[ERROR] Server code: {res.status_code}")
    except Exception as e:
        print(f"[NETWORK ERROR] {e}")

if __name__ == "__main__":
    print("--- Core Telemetry Engine ---")
    push_telemetry("1FA6P8CF0H5512345", "P0300", 2400, 95.0)
