import sqlite3

DB_NAME = "uc_workshop_local.db"

def get_ai_template_menu():
    while True:
        print("\n==================================================")
        print(" 🤖 UCAUTOTECH ADVANCED AI INTELLIGENCE & TEMPLATES")
        print("==================================================")
        print("1. 🔍 AI Diagnostic Code Breakdown & Repair Protocol")
        print("2. 💬 AI WhatsApp Client Service Advisor Template")
        print("3. 📦 AI Inventory Stock & Reorder Predictor")
        print("4. 🔙 Return to Master Console")
        
        choice = input("\nSelect AI Module (1-4): ").strip()
        
        if choice == "1":
            dtc = input("Enter Fault Code (e.g., P0300, P1892): ").strip().upper()
            print(f"\n--- 🧠 AI Expert Diagnostic Breakdown [{dtc}] ---")
            if dtc == "P0300":
                print("• Probable Root Cause: Random engine misfire across multiple cylinders.")
                print("• Inter-Module Action: Trigger check on spare parts inventory for spark plugs and ignition coils.")
                print("• Recommended Client Advice: Advise client on immediate fuel quality inspection and coil replacement.")
            elif dtc == "P1892":
                print("• Probable Root Cause: 4WD Mode Select Switch circuit failure.")
                print("• Inter-Module Action: Reference wiring diagram module for ground continuity tests.")
                print("• Recommended Client Advice: Inform client that 4WD engagement is disabled until harness inspection.")
            else:
                print("• Probable Root Cause: Sensor reference voltage discrepancy or ground fault.")
                print("• Inter-Module Action: Log incident into Cloud Audit Logs and schedule follow-up.")
            input("\nPress Enter to continue...")
            
        elif choice == "2":
            client = input("Enter Client Name: ").strip()
            service = input("Enter Performed Service: ").strip()
            print(f"\n--- 💬 AI WhatsApp Client Communication Template ---")
            print(f"Dear {client},")
            print(f"Thank you for trusting UCAUTOTECH Lagos with your vehicle. Your service ({service}) has been successfully completed, tested, and verified.")
            print("Your digital service record has been updated in our system. Drive safely, and do reach out if you have any questions!")
            print("— UCAUTOTECH Automotive Care Team")
            input("\nPress Enter to continue...")
            
        elif choice == "3":
            conn = sqlite3.connect(DB_NAME)
            cursor = conn.cursor()
            try:
                cursor.execute("SELECT part_code, part_name, quantity FROM parts_inventory WHERE quantity <= 5")
                low_items = cursor.fetchall()
                print("\n--- 📦 AI Inventory Intelligence & Stock Predictor ---")
                if not low_items:
                    print("✅ All inventory levels are optimal. No immediate restocking required.")
                else:
                    print("⚠️ AI Alert: The following parts are running low and require restocking:")
                    for item in low_items:
                        print(f"   -> [{item[0]}] {item[1]} (Remaining Qty: {item[2]})")
                    print("• Action: Prepare purchase orders for local Lagos parts distributors.")
            except Exception:
                print("⚠️ Inventory table not initialized yet.")
            conn.close()
            input("\nPress Enter to continue...")
            
        elif choice == "4":
            break

if __name__ == "__main__":
    get_ai_template_menu()
