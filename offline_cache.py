import os, sqlite3, time, requests
CFG = "supabase_config.txt"
DB = "offline_cache.db"
URL = "https://wknwaumfwjlvrotobngf.supabase.co/rest/v1/telemetry"

def get_key():
    if os.path.exists(CFG):
        with open(CFG) as file: return file.read().strip()
    return None

def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS pending_telemetry (id INTEGER PRIMARY KEY AUTOINCREMENT, vin TEXT, dtc_active TEXT, engine_rpm INTEGER, coolant_temp REAL, timestamp TEXT)")
    conn.commit(); conn.close()

def save_locally(p):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("INSERT INTO pending_telemetry (vin, dtc_active, engine_rpm, coolant_temp, timestamp) VALUES (?, ?, ?, ?, ?)", (p["vin"], p["dtc_active"], p["engine_rpm"], p["coolant_temp"], p["timestamp"]))
    conn.commit(); conn.close()
    print("[CACHED] Saved offline to SQLite DB.")

def sync_cache(headers):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT id, vin, dtc_active, engine_rpm, coolant_temp, timestamp FROM pending_telemetry")
    rows = c.fetchall()
    if rows:
        print(f"[SYNC] Uploading {len(rows)} cached packet(s)...")
        for r in rows:
            rid, vin, dtc, rpm, temp, ts = r
            p = {"vin": vin, "dtc_active": dtc, "engine_rpm": rpm, "coolant_temp": temp, "timestamp": ts}
            try:
                res = requests.post(URL, json=p, headers=headers, timeout=3)
                if res.status_code in [200, 201, 204]:
                    c.execute("DELETE FROM pending_telemetry WHERE id = ?", (rid,))
                    conn.commit()
                    print(f"[SYNCED] Packet ID {rid} cleared.")
            except: break
    conn.close()

if __name__ == "__main__":
    print("--- UCAUTOTECH Resilient Gateway Engine ---")
    init_db()
    k = get_key()
    headers = {"apikey": k, "Authorization": f"Bearer {k}", "Content-Type": "application/json", "Prefer": "return=minimal"}
    sync_cache(headers)
    p = {"vin": "1FA6P8CF0H5512345", "dtc_active": "P0300", "engine_rpm": 2500, "coolant_temp": 96.5, "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")}
    try:
        res = requests.post(URL, json=p, headers=headers, timeout=5)
        if res.status_code in [200, 201, 204]: print(f"[SUCCESS] Live packet synced! Status: {res.status_code}")
        else:
            print("[WARNING] Rejected. Caching locally...")
            save_locally(p)
    except:
        print("[OFFLINE] Connection error. Caching locally...")
        save_locally(p)
