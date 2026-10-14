import os

def main_menu():
    while True:
        print("\n==================================================")
        print(" ⚡ UCAUTOTECH WORKSHOP OS v14.0 ULTIMATE MASTER")
        print("==================================================")
        print("1. 🔥 Run ALL Modules in Real-Time Live Monitor")
        print("2. 🤖 Advanced AI Intelligence & Templates Hub")
        print("3. 🛠️ Manual Vehicle Diagnostic Engine")
        print("4. 📦 Spare Parts Inventory Control")
        print("5. 💰 Revenue & Financial Analytics")
        print("6. 🚘 Client Fleet & VIN Management")
        print("7. 📅 Client Reminders & Retention")
        print("8. 📚 Offline DTC Fault Code Matrix")
        print("9. 📋 Cloud Audit Logs")
        print("10. 📤 Export Records to CSV")
        print("11. 🌐 Launch Web Dashboard (Port 8080)")
        print("12. 🚪 Exit Master Console")
        
        choice = input("\nSelect Module (1-12): ").strip()
        
        if choice == "1":
            os.system("python uc_all_live.py")
        elif choice == "2":
            os.system("python uc_ai_engine.py")
        elif choice == "3":
            os.system("python uc_ai_diagnostic.py")
        elif choice == "4":
            os.system("python uc_parts_inventory.py")
        elif choice == "5":
            os.system("python uc_revenue_analytics.py")
        elif choice == "6":
            import sqlite3
            conn = sqlite3.connect("uc_workshop_local.db")
            cursor = conn.cursor()
            cursor.execute("SELECT id, client_name, phone, vin, make_model FROM vehicle_fleet")
            for r in cursor.fetchall():
                print(f"ID: {r[0]} | Client: {r[1]} | Vehicle: {r[4]} | VIN: {r[3]}")
            conn.close()
            input("\nPress Enter to return...")
        elif choice == "7":
            os.system("python uc_reminders.py")
        elif choice == "8":
            os.system("python uc_dtc_library.py")
        elif choice == "9":
            os.system("python uc_audit_logs.py")
        elif choice == "10":
            os.system("python uc_db_export.py")
        elif choice == "11":
            os.system("python uc_full_demo.py")
        elif choice == "12":
            print("\nExiting UCAUTOTECH Master Console. Drive safely!")
            break

if __name__ == "__main__":
    main_menu()
