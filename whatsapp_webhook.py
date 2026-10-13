import uc_environment
from flask import Flask, request, jsonify
from ai_dtc_engine import analyze_fault

app = Flask(__name__)

@app.route("/webhook", methods=["POST"])
def whatsapp_webhook():
    data = request.get_json(silent=True) or {}
    incoming_msg = data.get("message", "").strip()
    sender = data.get("sender", "Client")
    
    if not incoming_msg:
        return jsonify({"status": "error", "message": "No input provided"}), 400

    print(f"\n[INCOMING WHATSAPP] From: {sender} | Code/Query: {incoming_msg}")
    
    try:
        report = analyze_fault(incoming_msg, {})
        return jsonify({"status": "success", "sender": sender, "response": report}), 200
    except Exception as e:
        print(f"[ERROR] Engine processing failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    print("[UCAUTOTECH GATEWAY] Starting WhatsApp Webhook Listener on port 5000...")
    app.run(host="0.0.0.0", port=5000, debug=False)
