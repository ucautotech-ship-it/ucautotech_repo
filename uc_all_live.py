import sqlite3
import datetime
import time
import os

DB_NAME = "uc_workshop_local.db"

def init_all_tables():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('CREATE TABLE IF NOT EXISTS parts_inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, part_code TEXT, part_name TEXT, quantity INTEGER, unit_price REAL)')
    cursor.execute('CREATE TABLE IF NOT EXISTS revenue_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, client_name TEXT, service_desc TEXT, amount_paid REAL, payment_method TEXT)')
    cursor.execute('CREATE TABLE IF NOT EXISTS client_reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, client_name TEXT, vehicle TEXT, service_due TEXT, due_date TEXT)')
    cursor.execute('CREATE TABLE IF NOT EXISTS vehicle_fleet (id INTEGER PRIMARY KEY AUTOINCREMENT, client_name TEXT, phone TEXT, vin TEXT, make_model TEXT, last_service_date TEXT)')
    conn.commit()
    conn.close()

def run_all_live():
    init_all_tables()
    print("==================================================")
    print(" ⚡ UCAUTOTECH ALL-IN-ONE REAL-TIME WORKSHOP ENGINE")
    print("==================================================")
    print("Initializing live operational loop across all modules...\n")
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    while True:
        os.system("clear" if os.name == "posix" else "cls")
        print("==================================================")
        print(f" 🟢 UCAUTOTECH LIVE MONITOR — {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("==================================================")
        
        # 1. Fleet Stats
        cursor.execute("SELECT COUNT(*) FROM vehicle_fleet")
        fleet_count = cursor.fetchone()[0]
        
        # 2. Revenue Stats
        cursor.execute("SELECT SUM(amount_paid), COUNT(*) FROM revenue_logs")
        rev_data = cursor.fetchone()
        total_rev = rev_data[0] or 0.0
        total_jobs = rev_data[1] or 0
        
        # 3. Inventory Low Stock Alerts
        cursor.execute("SELECT COUNT(*) FROM parts_inventory WHERE quantity <= 5")
        low_stock_count = cursor.fetchone()[0]
        
        # 4. Reminders Due
        cursor.execute("SELECT COUNT(*) FROM client_reminders")
        reminder_count = cursor.fetchone()[0]
        
        print(f"🚘 Registered Vehicle Fleet: {fleet_count} vehicles")
        print(f"💰 Total Workshop Revenue: {total_rev:,.2f} ({total_jobs} completed jobs)")
        print(f"📦 Inventory Low-Stock Alerts: {low_stock_count} items requiring reorder")
        print(f"📅 Active Client Reminders: {reminder_count} scheduled")
        print("\n--------------------------------------------------")
        print(" [STATUS] Engine running continuously. Press Ctrl+C to exit.")
        print("==================================================")
        
        # Refresh every 5 seconds in real time
        time.sleep(5)

if __name__ == "__main__":
    try:
        run_all_live()
    except KeyboardInterrupt:
        print("\n🛑 Real-time engine stopped safely. Returning to prompt.")
