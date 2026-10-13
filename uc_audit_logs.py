import sqlite3

DB_NAME = "uc_workshop_local.db"

def view_audit_logs():
    print("==================================================")
    print(" 📋 CLOUD AUDIT LOGS & DIAGNOSTIC HISTORY")
    print("==================================================")
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, timestamp, client_name, vehicle, dtc_code, recommendation FROM audit_logs ORDER BY id DESC LIMIT 15")
        logs = cursor.fetchall()
        if not logs:
            print("No audit logs found.")
        for log in logs:
            print(f"[{log[1]}] Client: {log[2]} | {log[3]} | DTC: {log[4]}\n   -> {log[5]}\n" + "-"*40)
    except Exception:
        print("⚠️ Audit logs table not initialized yet.")
    conn.close()

if __name__ == "__main__":
    view_audit_logs()
    input("\nPress Enter to return...")
