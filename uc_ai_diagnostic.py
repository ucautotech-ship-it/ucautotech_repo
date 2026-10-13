import sqlite3
import datetime

DB_NAME = "uc_workshop_local.db"

def run_diagnostic():
    print("==================================================")
    print(" 🛠️ UCAUTOTECH VEHICLE DIAGNOSTIC ENGINE")
    print("==================================================")
    client = input("Enter Client Name: ").strip()
    vehicle = input("Enter Vehicle Make/Model/Year (e.g., Ford Explorer 2012): ").strip()
    dtc = input("Enter DTC Fault Code (e.g., P0300 or leave blank): ").strip().upper()
    symptoms = input("Enter Observed Symptoms / Description: ").strip()
    
    # Basic rule-based AI diagnostic recommendation
    recommendation = "General inspection of wiring harnesses, sensors, and ground connections required."
    if "P0300" in dtc:
        recommendation = "Random/Multiple Cylinder Misfire Detected. Inspect ignition coils, spark plugs, fuel injectors, and compression."
    elif "P1892" in dtc:
        recommendation = "4WD Mode Select Switch Circuit Failure. Check 4WD control module wiring, fuse, and switch continuity."
    elif "BRAKE" in symptoms.lower():
        recommendation = "Brake system anomaly. Inspect brake pads, rotor thickness, hydraulic fluid level, and ABS module."

    print(f"\n--- Diagnostic Analysis Report ---")
    print(f"Vehicle: {vehicle}")
    print(f"Client: {client}")
    print(f"Fault Code: {dtc if dtc else 'None Specified'}")
    print(f"AI Recommendation: {recommendation}")

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            client_name TEXT,
            vehicle TEXT,
            dtc_code TEXT,
            recommendation TEXT
        )
    ''')
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("INSERT INTO audit_logs (timestamp, client_name, vehicle, dtc_code, recommendation) VALUES (?, ?, ?, ?, ?)",
                   (timestamp, client, vehicle, dtc, recommendation))
    conn.commit()
    conn.close()
    print("\n✅ Diagnostic report saved to cloud audit logs.")

if __name__ == "__main__":
    run_diagnostic()
    input("\nPress Enter to return...")
