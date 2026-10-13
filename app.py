from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/webhook', methods=['POST'])
def webhook():
    data = request.json or {}
    client_name = data.get("client_name", "Client")
    message = data.get("message", "")
    is_vip = data.get("is_vip", False)
    
    response_text = f"Good day {client_name}! UCAUTOTECH has logged your request: '{message}'."
    if is_vip:
        response_text += "\n\n✅ *VIP Access Active:* Diagnostic analysis in progress."
        
    return jsonify({"status": "success", "response": response_text})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
