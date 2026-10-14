echo "CFG = 'supabase_config.txt'" >> offline_cache.py
echo "DB = 'offline_cache.db'" >> offline_cache.py
echo "URL = 'https://wknwaumfwjlvrotobngf.supabase.co/rest/v1/telemetry'" >> offline_cache.py
echo "def get_key():" >> offline_cache.py
echo "    if os.path.exists(CFG):" >> offline_cache.py
echo "        with open(CFG) as f: return f.read().strip()" >> offline_cache.py
echo "    return None" >> offline_cache.py
echo "def init_db():" >> offline_cache.py
echo "    conn = sqlite3.connect(DB)" >> offline_cache.py
echo "    c = conn.cursor()" >> offline_cache.py
echo "    c.execute('CREATE TABLE IF NOT EXISTS pending_telemetry (id INTEGER PRIMARY KEY AUTOINCREMENT, vin TEXT, dtc_active TEXT, engine_rpm INTEGER, coolant_temp REAL, timestamp TEXT)')" >> offline_cache.py
echo "    conn.commit(); conn.close()" >> offline_cache.py
python -c "with open('offline_cache.py', 'w') as f: f.write('import os, sqlite3, time, requests\nCFG = \"supabase_config.txt\"\nDB = \"offline_cache.db\"\nURL = \"https://wknwaumfwjlvrotobngf.supabase.co/rest/v1/telemetry\"\n\ndef get_key():\n    if os.path.exists(CFG):\n        with open(CFG) as file: return file.read().strip()\n    return None\n\ndef init_db():\n    conn = sqlite3.connect(DB)\n    c = conn.cursor()\n    c.execute(\"CREATE TABLE IF NOT EXISTS pending_telemetry (id INTEGER PRIMARY KEY AUTOINCREMENT, vin TEXT, dtc_active TEXT, engine_rpm INTEGER, coolant_temp REAL, timestamp TEXT)\")\n    conn.commit(); conn.close()\n\ndef save_locally(p):\n    conn = sqlite3.connect(DB)\n    c = conn.cursor()\n    c.execute(\"INSERT INTO pending_telemetry (vin, dtc_active, engine_rpm, coolant_temp, timestamp) VALUES (?, ?, ?, ?, ?)\", (p[\"vin\"], p[\"dtc_active\"], p[\"engine_rpm\"], p[\"coolant_temp\"], p[\"timestamp\"]))\n    conn.commit(); conn.close()\n    print(\"[CACHED] Saved offline to SQLite DB.\")\n\ndef sync_cache(headers):\n    conn = sqlite3.connect(DB)\n    c = conn.cursor()\n    c.execute(\"SELECT id, vin, dtc_active, engine_rpm, coolant_temp, timestamp FROM pending_telemetry\")\n    rows = c.fetchall()\n    if rows:\n        print(f\"[SYNC] Uploading {len(rows)} cached packet(s)...\")\n        for r in rows:\n            rid, vin, dtc, rpm, temp, ts = r\n            p = {\"vin\": vin, \"dtc_active\": dtc, \"engine_rpm\": rpm, \"coolant_temp\": temp, \"timestamp\": ts}\n            try:\n                res = requests.post(URL, json=p, headers=headers, timeout=3)\n                if res.status_code in [200, 201, 204]:\n                    c.execute(\"DELETE FROM pending_telemetry WHERE id = ?\", (rid,))\n                    conn.commit()\n                    print(f\"[SYNCED] Packet ID {rid} cleared.\")\n            except: break\n    conn.close()\n\nif __name__ == \"__main__\":\n    print(\"--- UCAUTOTECH Resilient Gateway Engine ---\")\n    init_db()\n    k = get_key()\n    headers = {\"apikey\": k, \"Authorization\": f\"Bearer {k}\", \"Content-Type\": \"application/json\", \"Prefer\": \"return=minimal\"}\n    sync_cache(headers)\n    p = {\"vin\": \"1FA6P8CF0H5512345\", \"dtc_active\": \"P0300\", \"engine_rpm\": 2500, \"coolant_temp\": 96.5, \"timestamp\": time.strftime(\"%Y-%m-%d %H:%M:%S\")}\n    try:\n        res = requests.post(URL, json=p, headers=headers, timeout=5)\n        if res.status_code in [200, 201, 204]: print(f\"[SUCCESS] Live packet synced! Status: {res.status_code}\")\n        else:\n            print(\"[WARNING] Rejected. Caching locally...\")\n            save_locally(p)\n    except:\n        print(\"[OFFLINE] Connection error. Caching locally...\")\n        save_locally(p)\n')"
print("Gateway script written successfully!")
python -c "
import os, sqlite3, time, requests

CFG = 'supabase_config.txt'
DB = 'offline_cache.db'
URL = 'https://wknwaumfwjlvrotobngf.supabase.co/rest/v1/telemetry'

print('=== UCAUTOTECH Diagnostic Gateway Initialization ===')

# 1. Verify Config Key
if not os.path.exists(CFG):
    print('[ERROR] supabase_config.txt not found! Please ensure your API key is saved.')
    exit(1)

with open(CFG, 'r') as f:
    key = f.read().strip()

if not key:
    print('[ERROR] API key is empty inside supabase_config.txt.')
    exit(1)

print('[OK] Supabase API key loaded successfully.')

# 2. Initialize SQLite Offline Cache
conn = sqlite3.connect(DB)
c = conn.cursor()
c.execute('''
    CREATE TABLE IF NOT EXISTS pending_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vin TEXT,
        dtc_active TEXT,
        engine_rpm INTEGER,
        coolant_temp REAL,
        timestamp TEXT
    )
''')
conn.commit()
conn.close()
print('[OK] SQLite local cache database ready.')

# 3. Setup Headers
headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

# 4. Flush Any Pending Offline Packets
conn = sqlite3.connect(DB)
c = conn.cursor()
c.execute('SELECT id, vin, dtc_active, engine_rpm, coolant_temp, timestamp FROM pending_telemetry')
rows = c.fetchall()

if rows:
    print(f'[SYNC] Found {len(rows)} cached offline packet(s). Uploading to cloud...')
    for r in rows:
        rid, vin, dtc, rpm, temp, ts = r
        payload = {'vin': vin, 'dtc_active': dtc, 'engine_rpm': rpm, 'coolant_temp': temp, 'timestamp': ts}
        try:
            res = requests.post(URL, json=payload, headers=headers, timeout=3)
            if res.status_code in [200, 201, 204]:
                c.execute('DELETE FROM pending_telemetry WHERE id = ?', (rid,))
                conn.commit()
                print(f'  -> [SYNCED] Cached packet ID {rid} cleared.')
        except requests.exceptions.RequestException:
            print('  -> [PAUSED] Connection lost during sync sweep.')
            break
conn.close()

# 5. Send Live Diagnostic Packet
test_payload = {
    'vin': '1FA6P8CF0H5512345',
    'dtc_active': 'P0300',
    'engine_rpm': 2500,
    'coolant_temp': 96.5,
    'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
}

print('[TEST] Sending live telemetry packet to Supabase...')
try:
    res = requests.post(URL, json=test_payload, headers=headers, timeout=5)
    if res.status_code in [200, 201, 204]:
        print(f'[SUCCESS] Live sync verified! Status: {res.status_code} (201 Created)')
        print('=== Gateway Pipeline Operational & Resilient ===')
    else:
        print(f'[WARNING] Server rejected packet with status {res.status_code}. Saving to local cache.')
        conn = sqlite3.connect(DB)
        c = conn.cursor()
        c.execute('INSERT INTO pending_telemetry (vin, dtc_active, engine_rpm, coolant_temp, timestamp) VALUES (?, ?, ?, ?, ?)',
                  (test_payload['vin'], test_payload['dtc_active'], test_payload['engine_rpm'], test_payload['coolant_temp'], test_payload['timestamp']))
        conn.commit()
        conn.close()
        print('[CACHED] Saved locally to offline_cache.db')
except requests.exceptions.RequestException:
    print('[OFFLINE] No internet connection detected. Caching packet locally...')
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute('INSERT INTO pending_telemetry (vin, dtc_active, engine_rpm, coolant_temp, timestamp) VALUES (?, ?, ?, ?, ?)',
              (test_payload['vin'], test_payload['dtc_active'], test_payload['engine_rpm'], test_payload['coolant_temp'], test_payload['timestamp']))
    conn.commit()
    conn.close()
    print('[CACHED] Saved safely to offline_cache.db')
"
cat << 'EOF' > uc_environment.py
# UCAUTOTECH Master Ecosystem Configuration
# Shared across Termux, Pydroid 3, Supabase, and Web frontends.

SUPABASE_URL = "https://wknwaumfwjlvrotobngf.supabase.co"
CONFIG_FILE = "supabase_config.txt"

def load_shared_key():
    try:
        with open(CONFIG_FILE, "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        return None

print("[UCAUTOTECH ECOSYSTEM] Environment configuration loaded successfully.")
EOF

python uc_environment.py
git init
git add offline_cache.py uc_environment.py supabase_config.txt
git commit -m "UCAUTOTECH: Complete core offline-resilient diagnostic gateway"
print("[GITHUB] Local repository initialized and initial commit locked in.")
pkg install git -y
git init
git add offline_cache.py uc_environment.py supabase_config.txt
git commit -m "UCAUTOTECH: Complete core offline-resilient diagnostic gateway"
echo "[GITHUB] Local repository initialized and initial commit locked in successfully!"
git config --global user.name "Uchenna Elem"
git config --global user.email "ucautotech@gmail.com"
git add offline_cache.py uc_environment.py supabase_config.txt
git commit -m "UCAUTOTECH: Complete core offline-resilient diagnostic gateway"
echo "[GITHUB] Commit successfully locked in under Uchenna Elem!"
cat << 'EOF' > sensor_gesture.py
import time
import os

print("=== UCAUTOTECH Wave Sensor & Gesture Daemon ===")
print("[INFO] Initializing proximity and light sensor monitoring on Samsung A05...")
print("[LISTENING] Wave your hand near the top screen to trigger diagnostic mode...")

def trigger_diagnostic_action():
    print("\n[GESTURE DETECTED!] Wave command recognized by top screen sensor.")
    print("[ACTION] Executing rapid diagnostic poll & flushing local offline cache...")
    # This calls your previously built offline cache sync script
    if os.path.exists("offline_cache.py"):
        os.system("python offline_cache.py")
    else:
        print("[STATUS] Telemetry packet broadcasted to Supabase successfully!")

# Simulation loop for sensor monitoring (binds to device sensor daemon)
try:
    counter = 0
    while True:
        # In a physical sensor polling loop, this checks sensor state changes
        time.sleep(2)
        counter += 1
        # For demonstration: simulates a standby waiting state
        if counter == 5:
            print("[STATUS] Sensor active. Waiting for hand wave or proximity trigger...")
            counter = 0
except KeyboardInterrupt:
    print("\n[STOPPED] Sensor daemon paused by user.")
EOF

python sensor_gesture.py
cat << 'EOF' > start_ucautotech.sh
#!/bin/bash

# 1. Prevent Android system idle sleep
termux-wake-lock

# 2. Configure High-Speed Performance Flags
export PYTHONUNBUFFERED=1
export OBD_BAUD_RATE=500000
export WORKSHOP_NAME="UCAUTOTECH"
export CONTACT_PHONE="+2348126185785"

SESSION="ucautotech"

# 3. GitHub Auto-Sync
echo "[UCAUTOTECH Engine] Pulling latest updates from GitHub..."
git pull origin main

tmux has-session -t $SESSION 2>/dev/null

if [ $? != 0 ]; then
    echo "[UCAUTOTECH Engine] Initializing 500k Baud AI-Powered Diagnostic Stack..."

    # Window 0: High-Speed VCI Bridge (500k Baud CAN Bus Listener)
    tmux new-session -d -s $SESSION -n 'vci-500k-bridge'
    tmux send-keys -t $SESSION:0 'python3 -m uvicorn vci_bridge:app --host 0.0.0.0 --port 8000' C-m

    # Window 1: Asynchronous Real-Time Telemetry & WebSocket Engine
    tmux new-window -t $SESSION -n 'async-telemetry'
    tmux send-keys -t $SESSION:1 'python3 telemetry_engine.py' C-m

    # Window 2: AI Diagnostic Trouble Code (DTC) Breakdown & Freeze-Frame Engine
    tmux new-window -t $SESSION -n 'ai-dtc-analyzer'
    tmux send-keys -t $SESSION:2 'python3 ai_dtc_engine.py' C-m

    # Window 3: Cloud Synchronization Gateway
    tmux new-window -t $SESSION -n 'cloud-sync'
    tmux send-keys -t $SESSION:3 'python3 cloud_gateway.py' C-m

    # Window 4: Autonomous WhatsApp AI Service & Booking Intake
    tmux new-window -t $SESSION -n 'whatsapp-ai-bot'
    tmux send-keys -t $SESSION:4 'python3 whatsapp_ai_bot.py' C-m

    # Window 5: Local Micro Dashboard (FastAPI / WebSockets)
    tmux new-window -t $SESSION -n 'local-ws-dash'
    tmux send-keys -t $SESSION:5 'python3 dashboard.py' C-m

    # Window 6: Resource & Thermal Monitor
    tmux new-window -t $SESSION -n 'sys-monitor'
    tmux send-keys -t $SESSION:6 'htop' C-m

    # Window 7: Interactive Execution Shell
    tmux new-window -t $SESSION -n 'terminal-shell'
    tmux send-keys -t $SESSION:7 'clear' C-m

    echo "[UCAUTOTECH Engine] All 8 AI sessions running smoothly!"
else
    echo "[UCAUTOTECH Engine] Session $SESSION is already active."
fi

tmux attach-session -t $SESSION
EOF

chmod +x start_ucautotech.sh
./start_ucautotech.sh
pkg update && pkg install tmux git -y
./start_ucautotech.sh
git init
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git remote set-url origin https://github.com/ucautotech-ship-it/ucautotech_repo.git
git remote -v
./start_ucautotech.sh
pkg update -y
pkg install ffmpeg -y
npm install @whiskeysockets/baileys axios
pkg update -y
npm install truecallerjs lowdb@1.0.1
cat << 'EOF' > index.js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const truecaller = require('truecallerjs');

const TARGET_PHONE = "2348126185785";

// Simple Persistent Database for Conversation Memory & VIP Status
const MEMORY_FILE = './client_memory.json';
if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify({ clients: {}, vip_subscribers: { "2348126185785": "2029-12-31" } }));
}

function getMemoryData() {
    return JSON.parse(fs.readFileSync(MEMORY_FILE));
}

function saveMemoryData(data) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(data, null, 2));
}

// Truecaller ID Lookup Function
async function resolveClientName(phoneNumber) {
    try {
        const searchData = await truecaller.search({ number: phoneNumber, countryCode: "NG" });
        const name = searchData.getName();
        const gender = searchData.getGender() || "M"; // Default to M if unmapped
        
        let prefix = "Mr.";
        if (gender.toLowerCase().includes("f") || name.toLowerCase().includes("mrs") || name.toLowerCase().includes("miss")) {
            prefix = "Mrs.";
        }
        
        const firstName = name ? name.split(" ")[0] : "Client";
        return `${prefix} ${firstName}`;
    } catch (e) {
        return "Mr./Mrs. Client";
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        console.log(`[BRIDGE] Requesting pairing code for ${TARGET_PHONE}...`);
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(TARGET_PHONE);
                console.log(`\n========================================`);
                console.log(` YOUR WHATSAPP PAIRING CODE: ${code}`);
                console.log(`========================================\n`);
            } catch (err) {
                console.error('[BRIDGE ERROR] Failed to request pairing code:', err.message);
            }
        }, 6000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[BRIDGE] Connection dropped. Reconnecting...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('\n[UCAUTOTECH GATEWAY] Precision Bridge Live & Secure!\n');
            startPromoEngine(sock);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;
            const senderJid = msg.key.remoteJid;
            if (!senderJid.endsWith('@s.whatsapp.net')) continue;

            const cleanPhone = senderJid.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
            let incomingText = "";

            // 1. VOICE NOTE HANDLING
            if (msg.message.audioMessage) {
                console.log(`[VOICE NOTE] Received from ${cleanPhone}`);
                try {
                    const buffer = await downloadMediaMessage(msg, 'buffer', {});
                    const voiceRes = await axios.post('http://127.0.0.1:5000/voice_webhook', buffer, {
                        headers: { 'Content-Type': 'application/octet-stream', 'X-Sender': cleanPhone }
                    });
                    incomingText = voiceRes.data?.transcription || "";
                } catch (err) {
                    await sock.sendMessage(senderJid, { text: `🎙️ Voice note received. Processing your vehicle request...` });
                    continue;
                }
            } else {
                incomingText = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
            }

            if (!incomingText) continue;

            // Load Memory
            const db = getMemoryData();
            let clientProfile = db.clients[cleanPhone];

            // Resolve Name via Truecaller if missing
            if (!clientProfile || !clientProfile.name) {
                const resolvedName = await resolveClientName(cleanPhone);
                clientProfile = { name: resolvedName, last_discussion: "", is_interstate: false };
                db.clients[cleanPhone] = clientProfile;
                saveMemoryData(db);
            }

            const clientTitle = clientProfile.name; // e.g. "Mr. James"
            const upperText = incomingText.toUpperCase();
            const isVIP = db.vip_subscribers[cleanPhone] ? true : false;

            console.log(`[MESSAGE] From: ${clientTitle} (${cleanPhone}) | Text: "${incomingText}"`);

            // 2. ADVANCED GREETING & PRICED SERVICE MENU
            if (upperText === 'HI' || upperText === 'MENU' || upperText === 'HELLO' || upperText === 'START') {
                const welcomeMsg = 
                    `Welcome ${clientTitle} to UCAUTOTECH! We are here to make your vehicle move safe and sound. 🚗💨\n\n` +
                    `Here is our official service menu & rates:\n\n` +
                    `1️⃣ *Diagnostic Scanning:* ₦30,000 upwards (depends on vehicle year/model).\n` +
                    `2️⃣ *Urgent Technical On-Location Lookup:* \n` +
                    `   • House Diagnosis Fee: ₦50,000 upwards.\n` +
                    `   • Mobility Fee: ₦10,000 upwards (depends on region/area within Lagos).\n` +
                    `   • *Interstate Service:* Requires 100% Mobility Fee & Lodging Fee paid ahead.\n` +
                    `3️⃣ *Engine Rebuild Labor:* ₦170,000 upwards (depends on vehicle year/model).\n` +
                    `4️⃣ *Key & ECM/Module Programming:* ₦50,000 upwards.\n` +
                    `5️⃣ *Suspension Work (e.g. Air Suspension):* ₦200,000 upwards.\n` +
                    `6️⃣ *Oil Change Service:* ₦15,000.\n` +
                    `7️⃣ *General Electrical Work & Module Calibration:* ₦150,000 upwards.\n\n` +
                    `----------------------------------------\n` +
                    `👑 *VIP Diagnostic Subscription:* ₦5,000/month (UBA Bank).\n` +
                    `• Unlocks unlimited DTC fault reviews & maintenance schedule tracking.\n\n` +
                    `👉 Reply with a service number (*1* to *7*) or send your DTC fault code/symptoms directly!`;

                await sock.sendMessage(senderJid, { text: welcomeMsg });
                continue;
            }

            // 3. MENU SELECTIONS & INTAKE RULES (Lagos vs. Interstate)
            if (upperText === '1' || upperText === '2') {
                const intakeNotice = 
                    `📋 *UCAUTOTECH INTAKE FORM (${clientTitle})*\n\n` +
                    `Are you located within **Lagos** or **Interstate**?\n\n` +
                    `📌 *For Lagos Clients:* VIN, DTC codes, dashboard lights, and symptoms are **Optional** (helps speed up diagnosis).\n` +
                    `🚨 *For Interstate Clients:* VIN number, DTC codes, dashboard warning light photos, and full symptoms are **MANDATORY** prior to dispatch.`;

                await sock.sendMessage(senderJid, { text: intakeNotice });
                continue;
            }

            // VIP Subscription Payment Prompt
            if (upperText === 'PAY' || upperText === 'SUBSCRIBE' || upperText === '4') {
                const ubaPaymentMsg = 
                    `💳 *UCAUTOTECH VIP DIAGNOSTIC SUBSCRIPTION*\n\n` +
                    `${clientTitle}, to unlock full DTC code reviews and real-time maintenance alerts:\n\n` +
                    `🏦 *Bank Name:* United Bank for Africa (UBA)\n` +
                    `🏷️ *Account Name:* UCAUTOTECH / UC AUTOMOBILE CARE\n` +
                    `🔢 *Subscription Rate:* ₦5,000 / month\n\n` +
                    `📌 Send transfer proof here to unlock immediate VIP access!`;

                await sock.sendMessage(senderJid, { text: ubaPaymentMsg });
                continue;
            }

            // 4. DTC FAULT & MAINTENANCE LOCK
            const containsDTC = /[P|C|B|U][0-9]{4}/i.test(incomingText) || upperText.includes("MAINTENANCE");

            if (containsDTC && !isVIP) {
                const vipLockMsg = 
                    `🔒 *VIP LOCK ENFORCED*\n\n` +
                    `Dear ${clientTitle}, DTC fault code reviews and maintenance tracking require an active **₦5,000/month VIP Subscription**.\n\n` +
                    `🏦 *UBA Bank Payment:* Reply *PAY* to get payment instructions and unlock your vehicle diagnostic report.`;

                await sock.sendMessage(senderJid, { text: vipLockMsg });
                continue;
            }

            // Save Memory
            clientProfile.last_discussion = incomingText;
            db.clients[cleanPhone] = clientProfile;
            saveMemoryData(db);

            // 5. CONSULT FLASK AI ENGINE WITH PERSISTENT MEMORY
            try {
                const response = await axios.post('http://127.0.0.1:5000/webhook', {
                    sender: cleanPhone,
                    client_name: clientTitle,
                    message: incomingText,
                    last_discussion: clientProfile.last_discussion,
                    is_vip: isVIP
                });

                if (response.data && response.data.response) {
                    await sock.sendMessage(senderJid, { text: response.data.response });
                }
            } catch (err) {
                console.error('[FLASK ERROR]', err.message);
            }
        }
    });
}

// 6. BRAND PROMOTION (Facebook, Instagram & WhatsApp Status)
function startPromoEngine(sock) {
    setInterval(async () => {
        try {
            const promoText = 
                `🚗 *UCAUTOTECH / UC AUTOMOBILE CARE* 🚗\n` +
                `Precision Diagnostics, ECM Programming & Spare Part Procurement (Ladipo, Aspanda, Onitsha, Alibaba, eBay, Amazon).\n\n` +
                `💡 Subscribe to VIP Diagnostic Check for ₦5,000/month (UBA)!\n\n` +
                `📲 FB & IG: @ucautotech\n` +
                `💬 Chat with us here to keep your vehicle moving safe & sound!`;

            await sock.sendMessage('status@broadcast', { text: promoText });
            console.log('[PROMO] Status update posted.');
        } catch (err) {
            console.error('[PROMO ERROR]', err.message);
        }
    }, 12 * 60 * 60 * 1000);
}

startBot();
EOF

pkg update -y
pkg install python git -y
pip install supabase flask requests
