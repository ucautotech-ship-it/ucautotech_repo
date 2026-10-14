import os
import sqlite3
import datetime

DB_NAME = "uc_workshop_local.db"

def generate_invoice():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT id, client_name, service_desc, amount_paid, payment_method, timestamp FROM revenue_logs ORDER BY id DESC LIMIT 10")
    logs = cursor.fetchall()
    conn.close()

    if not logs:
        print("⚠️ No revenue logs found to generate invoice.")
        return

    print("\n--- Recent Revenue Transactions ---")
    for log in logs:
        print(f"ID: {log[0]} | Client: {log[1]} | Service: {log[2]} | Amount: ₦{log[3]:,.2f}")

    job_id = input("\nEnter Revenue Log ID for Invoice (or press Enter for most recent): ").strip()
    
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    if job_id:
        cursor.execute("SELECT client_name, service_desc, amount_paid, payment_method, timestamp FROM revenue_logs WHERE id = ?", (job_id,))
    else:
        cursor.execute("SELECT client_name, service_desc, amount_paid, payment_method, timestamp FROM revenue_logs ORDER BY id DESC LIMIT 1")
    
    record = cursor.fetchone()
    conn.close()

    if not record:
        print("❌ Record not found.")
        return

    client, service, amount, method, timestamp = record
    inv_number = f"INV-{datetime.datetime.now().strftime('%Y%m%d%H%M')}"
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>UCAUTOTECH Official Invoice - {inv_number}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 30px; color: #333; }}
        .header {{ border-bottom: 3px solid #d32f2f; padding-bottom: 15px; margin-bottom: 20px; }}
        .title {{ font-size: 26px; font-weight: bold; color: #d32f2f; }}
        .subtitle {{ font-size: 14px; color: #666; }}
        .details {{ margin-bottom: 25px; line-height: 1.6; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
        th {{ background-color: #f4f4f4; }}
        .total {{ font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }}
        .footer {{ margin-top: 40px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }}
    </style>
</head>
<body>
    <div class="header">
        <div class="title">UCAUTOTECH AUTOMOTIVE CARE</div>
        <div class="subtitle">Enterprise Workshop Management System | Field Diagnostics & Repairs</div>
    </div>
    
    <div class="details">
        <strong>Invoice Number:</strong> {inv_number}<br>
        <strong>Date/Time:</strong> {timestamp}<br>
        <strong>Client Name:</strong> {client}<br>
        <strong>Payment Method:</strong> {method}
    </div>

    <table>
        <thead>
            <tr>
                <th>Item / Service Description</th>
                <th>Status</th>
                <th>Amount (₦)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{service}</td>
                <td>Completed</td>
                <td>₦{amount:,.2f}</td>
            </tr>
        </tbody>
    </table>

    <div class="total">
        Total Paid: ₦{amount:,.2f}
    </div>

    <div class="footer">
        Thank you for trusting UCAUTOTECH! For inquiries, contact UC Automobile Care Support.
    </div>
</body>
</html>
"""

    os.makedirs("invoices", exist_ok=True)
    file_path = f"invoices/{inv_number}.html"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"\n✅ Official HTML Invoice generated successfully at: {file_path}")
    print("💡 Open this file in your mobile browser or print it as PDF!")

if __name__ == "__main__":
    generate_invoice()
    input("\nPress Enter to return...")
