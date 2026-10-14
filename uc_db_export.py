import sqlite3
import csv
import os

DB_NAME = "uc_workshop_local.db"

def export_records():
    print("==================================================")
    print(" 📤 EXPORT WORKSHOP RECORDS TO CSV")
    print("==================================================")
    os.makedirs("exports", exist_ok=True)
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM revenue_logs")
    rows = cursor.fetchall()
    if rows:
        path = "exports/revenue_export.csv"
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([i[0] for i in cursor.description])
            writer.writerows(rows)
        print(f"✅ Revenue records exported to {path}")
    else:
        print("⚠️ No revenue records to export.")
    conn.close()

if __name__ == "__main__":
    export_records()
    input("\nPress Enter to return...")
