import sqlite3
import datetime

DB_NAME = "uc_workshop_local.db"

def revenue_menu():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS revenue_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            client_name TEXT,
            service_desc TEXT,
            amount_paid REAL,
            payment_method TEXT
        )
    ''')
    conn.commit()

    while True:
        print("\n==================================================")
        print(" 💰 WORKSHOP REVENUE & FINANCIAL ANALYTICS")
        print("==================================================")
        print("1. View Financial Summary & Totals")
        print("2. Log New Revenue Transaction")
        print("3. Return to Main Menu")
        
        choice = input("\nSelect Option (1-3): ").strip()
        
        if choice == "1":
            cursor.execute("SELECT SUM(amount_paid), COUNT(*), AVG(amount_paid) FROM revenue_logs")
            row = cursor.fetchone()
            total_rev = row[0] or 0.0
            total_jobs = row[1] or 0
            avg_job = row[2] or 0.0
            print(f"\n--- Financial Analytics ---")
            print(f"Total Workshop Revenue: ₦{total_rev:,.2f}")
            print(f"Total Completed Jobs: {total_jobs}")
            print(f"Average Revenue per Job: ₦{avg_job:,.2f}")
        elif choice == "2":
            client = input("Client Name: ").strip()
            service = input("Service Performed: ").strip()
            try:
                amount = float(input("Amount Paid (₦): ").strip())
                method = input("Payment Method (Cash/Transfer/POS): ").strip()
                timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                cursor.execute("INSERT INTO revenue_logs (timestamp, client_name, service_desc, amount_paid, payment_method) VALUES (?, ?, ?, ?, ?)",
                               (timestamp, client, service, amount, method))
                conn.commit()
                print("✅ Revenue transaction logged successfully.")
            except ValueError:
                print("❌ Invalid amount format.")
        elif choice == "3":
            break
    conn.close()

if __name__ == "__main__":
    revenue_menu()
