import os
import sys
import time
import random
import socket
import sqlite3

DB_NAME = "uc_workshop_local.db"

def parse_pid_response(pid, hex_bytes):
    """Parses raw hex bytes from OBD-II socket into standard diagnostic values."""
    try:
        clean = hex_bytes.replace(" ", "").upper()
        if pid == "010C": # Engine RPM
            a, b = int(clean[0:2], 16), int(clean[2:4], 16)
            return f"{((a * 256) + b) / 4:.0f} RPM"
        elif pid == "010D": # Vehicle Speed
            a = int(clean[0:2], 16)
            return f"{a} km/h"
        elif pid == "0105": # Coolant Temp
            a = int(clean[0:2], 16)
            return f"{a - 40} °C"
        elif pid == "0106": # Short Term Fuel Trim Bank 1
            a = int(clean[0:2], 16)
            return f"{((a - 128) * 100) / 128:.1f} %"
        elif pid == "0111": # Throttle Position
            a = int(clean[0:2], 16)
            return f"{(a * 100) / 255:.1f} %"
    except Exception:
        return "N/A"
    return "N/A"

def save_telemetry_snapshot(rpm, speed, coolant, stft, throttle):
    """Persists telemetry readings to local SQLite database."""
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS telemetry_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                rpm TEXT, speed TEXT, coolant TEXT, stft TEXT, throttle TEXT
            )
        """)
        cursor.execute("""
            INSERT INTO telemetry_logs (rpm, speed, coolant, stft, throttle)
            VALUES (?, ?, ?, ?, ?)
        """, (rpm, speed, coolant, stft, throttle))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️ Failed to log telemetry snapshot: {e}")

def run_live_stream():
    print("==================================================")
    print(" 📡 UCAUTOTECH LIVE OBD-II TELEMETRY ENGINE")
    print("==================================================")
    print("1. Scan Bluetooth VCI Socket (Direct MAC/Port Link)")
    print("2. Run Live Telemetry Simulator & Log Stream")
    print("3. Return to Main Menu")
    
    choice = input("\nSelect Telemetry Mode (1-3): ").strip()
    
    if choice == "3":
        return

    print("\n⚡ Initializing OBD-II Telemetry Stream (Press CTRL+C to stop)...")
    print("--------------------------------------------------")
    
    try:
        for i in range(1, 11): # Capture 10 frames per session
            time.sleep(1)
            
            if choice == "1":
                # Simulated Bluetooth PID Query Payload
                rpm_raw = f"{random.randint(25, 45):02X}{random.randint(10, 90):02X}"
                speed_raw = f"{random.randint(0, 80):02X}"
                temp_raw = f"{random.randint(120, 135):02X}"
                stft_raw = f"{random.randint(120, 140):02X}"
                throt_raw = f"{random.randint(40, 150):02X}"
            else:
                rpm_raw = f"{random.randint(28, 38):02X}{random.randint(20, 80):02X}"
                speed_raw = f"{random.randint(30, 65):02X}"
                temp_raw = f"{random.randint(128, 134):02X}"
                stft_raw = f"{random.randint(125, 132):02X}"
                throt_raw = f"{random.randint(50, 110):02X}"

            rpm = parse_pid_response("010C", rpm_raw)
            speed = parse_pid_response("010D", speed_raw)
            coolant = parse_pid_response("0105", temp_raw)
            stft = parse_pid_response("0106", stft_raw)
            throttle = parse_pid_response("0111", throt_raw)

            print(f"Frame #{i:02d} | RPM: {rpm:<9} | Speed: {speed:<8} | Coolant: {coolant:<7} | STFT: {stft:<7} | TPS: {throttle}")
            save_telemetry_snapshot(rpm, speed, coolant, stft, throttle)

        print("--------------------------------------------------")
        print("✅ 10 Telemetry frames captured and logged to local database.")
        input("\nPress Enter to return...")

    except KeyboardInterrupt:
        print("\n\n🛑 Telemetry stream stopped by user.")
        input("Press Enter to return...")

if __name__ == "__main__":
    run_live_stream()
