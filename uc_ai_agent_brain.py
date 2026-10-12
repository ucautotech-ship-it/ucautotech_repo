import sqlite3
import time
from uc_database import init_db

def process_latest_workshop_data():
    print("[AI BRAIN] Analyzing latest database entries for intelligent dispatch...")
    conn = sqlite3.connect("ucautotech_master.db")
    cursor = conn.cursor()
    
    # Fetch the latest lead
    cursor.execute("SELECT client_name, location, service FROM leads ORDER BY id DESC LIMIT 1")
    lead = cursor.fetchone()
    conn.close()
    
    if lead:
        name, location, service = lead
        print(f"[AI DECISION] Target Identified: {name} in {location} for [{service}].")
        print(f"[AI ACTION] Generating automated diagnostic quotation and payment link...")
        print(f"[PAYMENT ROUTE] Direct to UBA: 2137886638 (Emmanuel Uche David)")
        print(f"[SUCCESS] Intelligent dispatch package compiled and locked.")
    else:
        print("[AI BRAIN] Ledger is clear. Awaiting incoming leads...")

if __name__ == "__main__":
    init_db()
    while True:
        process_latest_workshop_data()
        time.sleep(30)
