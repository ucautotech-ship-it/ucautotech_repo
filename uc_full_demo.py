import os
import sqlite3
import datetime
import http.server
import socketserver

DB_NAME = "uc_workshop_local.db"
PORT = 8080

def auto_generate_invoice():
    print("==================================================")
    print(" 📄 GENERATING OFFICIAL UCAUTOTECH INVOICE")
    print("==================================================")
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT client_name, service_desc, amount_paid, payment_method, timestamp FROM revenue_logs ORDER BY id DESC LIMIT 1")
    record = cursor.fetchone()
    conn.close()

    if not record:
        print("⚠️ No revenue record found to invoice.")
        return

    client, service, amount, method, timestamp = record
    inv_number = f"INV-{datetime.datetime.now().strftime('%Y%m%d%H%M')}"
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>UCAUTOTECH Invoice - {inv_number}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 30px; color: #333; background: #fafafa; }}
        .container {{ background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ border-bottom: 3px solid #d32f2f; padding-bottom: 15px; margin-bottom: 20px; }}
        .title {{ font-size: 24px; font-weight: bold; color: #d32f2f; }}
        .subtitle {{ font-size: 13px; color: #666; }}
        .details {{ margin-bottom: 20px; line-height: 1.6; font-size: 14px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
        th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 14px; }}
        th {{ background-color: #f4f4f4; }}
        .total {{ font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; color: #2e7d32; }}
        .footer {{ margin-top: 30px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">UCAUTOTECH AUTOMOTIVE CARE</div>
            <div class="subtitle">Enterprise Workshop Management System | Lagos, Nigeria</div>
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
                    <th>Service Description</th>
                    <th>Status</th>
                    <th>Amount (₦)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{service}</td>
                    <td>Completed & Verified</td>
                    <td>₦{amount:,.2f}</td>
                </tr>
            </tbody>
        </table>

        <div class="total">
            Total Paid: ₦{amount:,.2f}
        </div>

        <div class="footer">
            Thank you for your patronage! Powered by UCAUTOTECH Mobile WMS.
        </div>
    </div>
</body>
</html>
"""

    os.makedirs("invoices", exist_ok=True)
    file_path = f"invoices/{inv_number}.html"
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"✅ Invoice successfully compiled at: {file_path}")

def build_dashboard_html():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("SELECT SUM(amount_paid), COUNT(*) FROM revenue_logs")
    rev_row = cursor.fetchone()
    total_rev = rev_row[0] or 0.0
    total_jobs = rev_row[1] or 0
    
    # Safely calculate low stock items in Python without schema dependency
    low_stock_count = 0
    try:
        cursor.execute("SELECT quantity FROM parts_inventory")
        parts = cursor.fetchall()
        low_stock_count = sum(1 for p in parts if p[0] <= 5)
    except Exception:
        pass
    
    cursor.execute("SELECT timestamp, client_name, service_desc, amount_paid FROM revenue_logs ORDER BY id DESC LIMIT 5")
    recent_jobs = cursor.fetchall()
    
    conn.close()
    
    rows_html = ""
    for job in recent_jobs:
        rows_html += f"<tr><td>{job[0]}</td><td>{job[1]}</td><td>{job[2]}</td><td>₦{job[3]:,.2f}</td></tr>"

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>UCAUTOTECH Command Center</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #121212; color: #e0e0e0; margin: 0; padding: 20px; }}
        .header {{ text-align: center; padding-bottom: 20px; border-bottom: 2px solid #333; }}
        .header h1 {{ color: #00e676; margin: 0; font-size: 22px; }}
        .cards {{ display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; }}
        .card {{ background: #1e1e1e; flex: 1; min-width: 130px; padding: 15px; border-radius: 8px; border-left: 4px solid #00e676; }}
        .card.alert {{ border-left-color: #ff5252; }}
        .card h3 {{ margin: 0; font-size: 11px; color: #888; text-transform: uppercase; }}
        .card .val {{ font-size: 18px; font-weight: bold; margin-top: 5px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 15px; background: #1e1e1e; border-radius: 8px; overflow: hidden; }}
        th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #2c2c2c; font-size: 12px; }}
        th {{ background: #2a2a2a; color: #888; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>⚡ UCAUTOTECH COMMAND CENTER</h1>
        <p style="color:#888; font-size:11px;">Live Termux WMS Node | Mobile Dashboard</p>
    </div>

    <div class="cards">
        <div class="card">
            <h3>Total Revenue</h3>
            <div class="val">₦{total_rev:,.2f}</div>
        </div>
        <div class="card">
            <h3>Logged Jobs</h3>
            <div class="val">{total_jobs}</div>
        </div>
        <div class="card {'alert' if low_stock_count > 0 else ''}">
            <h3>Low Stock Alerts</h3>
            <div class="val">{low_stock_count} Items</div>
        </div>
    </div>

    <h3>Recent Workshop Transactions</h3>
    <table>
        <thead>
            <tr><th>Date</th><th>Client</th><th>Service</th><th>Amount</th></tr>
        </thead>
        <tbody>
            {rows_html if rows_html else '<tr><td colspan="4">No records found</td></tr>'}
        </tbody>
    </table>
</body>
</html>
"""

class DashboardHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(build_dashboard_html().encode("utf-8"))
    def log_message(self, format, *args):
        pass

def run_server():
    print("\n==================================================")
    print(" 🌐 LAUNCHING WEB COMMAND CENTER DASHBOARD")
    print("==================================================")
    print(f"🚀 Server active at: http://localhost:{PORT}")
    print("💡 Open this URL in your mobile browser or press CTRL+C to exit.\n")
    
    with socketserver.TCPServer(("", PORT), DashboardHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Web Command Center server stopped.")

if __name__ == "__main__":
    auto_generate_invoice()
    run_server()
