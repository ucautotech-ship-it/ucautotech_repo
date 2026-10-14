import sqlite3

DB_NAME = "uc_workshop_local.db"

def manage_inventory():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS parts_inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            part_code TEXT,
            part_name TEXT,
            quantity INTEGER,
            unit_price REAL
        )
    ''')
    conn.commit()

    while True:
        print("\n==================================================")
        print(" 📦 SPARE PARTS INVENTORY & STOCK CONTROL")
        print("==================================================")
        print("1. View All Spare Parts")
        print("2. Add New Part")
        print("3. Update Stock Quantity")
        print("4. Return to Main Menu")
        
        choice = input("\nSelect Option (1-4): ").strip()
        
        if choice == "1":
            cursor.execute("SELECT id, part_code, part_name, quantity, unit_price FROM parts_inventory")
            items = cursor.fetchall()
            print("\n--- Current Inventory ---")
            if not items:
                print("No parts recorded yet.")
            for item in items:
                status = "⚠️ LOW STOCK" if item[3] <= 5 else "In Stock"
                print(f"ID: {item[0]} | Code: {item[1]} | Name: {item[2]} | Qty: {item[3]} | Price: ₦{item[4]:,.2f} [{status}]")
        elif choice == "2":
            code = input("Enter Part Code (e.g., SP-001): ").strip()
            name = input("Enter Part Name: ").strip()
            try:
                qty = int(input("Enter Initial Quantity: ").strip())
                price = float(input("Enter Unit Price (₦): ").strip())
                cursor.execute("INSERT INTO parts_inventory (part_code, part_name, quantity, unit_price) VALUES (?, ?, ?, ?)", (code, name, qty, price))
                conn.commit()
                print("✅ Part added successfully.")
            except ValueError:
                print("❌ Invalid number format.")
        elif choice == "3":
            try:
                pid = int(input("Enter Part ID to update: ").strip())
                new_qty = int(input("Enter New Quantity: ").strip())
                cursor.execute("UPDATE parts_inventory SET quantity = ? WHERE id = ?", (new_qty, pid))
                conn.commit()
                print("✅ Stock updated.")
            except ValueError:
                print("❌ Invalid input.")
        elif choice == "4":
            break
    conn.close()

if __name__ == "__main__":
    manage_inventory()
