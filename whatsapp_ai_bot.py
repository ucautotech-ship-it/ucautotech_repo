import sys
import time
import requests
import uc_environment
from ai_dtc_engine import analyze_fault

def handle_incoming_message(phone_number, user_text):
    print(f"\n[INCOMING] From {phone_number}: {user_text}")
    print("[PROCESSING] Querying UCAUTOTECH AI Diagnostic Engine...")
    
    # Process DTC code using verified REST engine
    analysis = analyze_fault(user_text, freeze_frame={})
    
    print("\n[AI RESPONSE GENERATED]:")
    print(analysis)
    return analysis

if __name__ == "__main__":
    print("=== UCAUTOTECH WhatsApp AI Client Intake Bot ===")
    print("Bot listener active. (Press Ctrl+C to stop)")
    
    test_code = input("\nEnter client DTC code to test intake (e.g. P189200): ")
    if test_code.strip():
        handle_incoming_message("+234_CLIENT", test_code.strip())
