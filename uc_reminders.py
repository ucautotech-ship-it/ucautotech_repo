import sqlite3
import datetime

DB_NAME = "uc_workshop_local.db"

def reminder_manager():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS client_reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_name TEXT,
            vehicle TEXT,
            service_due TEXT,
            due_date TEXT
        )
    ''')
    conn.commit()

    while True:
        print("\n==================================================")
        print(" 📅 CLIENT RETENTION & SERVICE REMINDERS")
        print("==================================================")
        print("1. View Active Reminders")
        print("2. Schedule New Reminder")
        print("3. Return to Main Menu")
        
        choice = input("\nSelect Option (1-3): ").strip()
        
        if choice == "1":
            cursor.execute("SELECT id, client_name, vehicle, service_due, due_date FROM client_reminders")
            rows = cursor.fetchall()
            print("\n--- Scheduled Service Reminders ---")
            if not rows:
                print("No reminders active.")
            for r in rows:
                print(f"ID: {r[0]} | Client: {r[1]} | Vehicle: {r[2]} | Service: {r[3]} | Due: {r[4]}")
        elif choice == "2":
            client = input("Client Name: ").strip()
            vehicle = input("Vehicle Make/Model: ").strip()
            service = input("Service Due (e.g., Oil Change & Tune-up): ").strip()
            due = input("Due Date (YYYY-MM-DD): ").strip()
            cursor.execute("INSERT INTO client_reminders (client_name, vehicle, service_due, due_date) VALUES (?, ?, ?, ?)",
                           (client, vehicle, service, due))
            conn.commit()
            print("✅ Service reminder scheduled.")
        elif choice == "3":
            break
    conn.close()

if __name__ == "__main__":
    reminder_manager()
