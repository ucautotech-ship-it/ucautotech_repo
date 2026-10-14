import os
import sys
import shutil
import subprocess

def send_notification(title, message):
    """Fires native Android notification using a non-blocking background process."""
    if shutil.which("termux-notification"):
        try:
            subprocess.Popen(
                ["termux-notification", "--title", title, "--content", message, "--priority", "high"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except Exception:
            pass
    elif shutil.which("termux-toast"):
        try:
            subprocess.Popen(
                ["termux-toast", f"{title}: {message}"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except Exception:
            pass
    else:
        print(f"🔔 [NOTIFICATION] {title}: {message}")

def notify_backup_complete(backup_path):
    send_notification("UCAUTOTECH OS Backup", f"Local SQLite database safely backed up to {backup_path}")

def notify_low_inventory(part_name, qty):
    send_notification("⚠️ Low Inventory Alert", f"Stock for '{part_name}' is down to {qty} units. Reorder soon!")

def notify_new_diagnostic(vin, client_name):
    send_notification("⚡ New Job Logged", f"Diagnostic recorded for {client_name} (VIN: {vin})")

if __name__ == "__main__":
    print("==================================================")
    print(" 📱 UCAUTOTECH ANDROID NOTIFIER (FAST MODE)")
    print("==================================================")
    send_notification("UCAUTOTECH OS v14.0", "System notification engine initialized successfully.")
    print("✅ Test notification dispatched instantly!")
