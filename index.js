const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { exec } = require('child_process');
const { GoogleGenAI } = require('@google/genai');

const ADMIN_JID = '2348126185785@s.whatsapp.net';
const clientSessions = {};
const chatMemories = {};
const pendingPayments = {};
const messageCooldowns = {};

const WORKSHOP_LAT = 6.5244;
const WORKSHOP_LNG = 3.3792;
const WORKSHOP_NAME = "UCAUTOTECH / UC Automobile Care";
const WORKSHOP_ADDRESS = "Lagos, Nigeria";

const API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE"; 
const ai = new GoogleGenAI({ apiKey: API_KEY });

function calculateDistanceKm(lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - WORKSHOP_LAT) * (Math.PI / 180);
    const dLon = (lon2 - WORKSHOP_LNG) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(WORKSHOP_LAT * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function calculateMobilityFee(distanceKm, isInterstate) {
    if (isInterstate) {
        return Math.round(distanceKm * 800 + 30000);
    }
    return Math.round(distanceKm * 600 + 5000);
}

async function askGemini(remoteJid, clientTitle, prompt) {
    try {
        if (!chatMemories[remoteJid]) chatMemories[remoteJid] = [];
        chatMemories[remoteJid].push({ role: 'user', parts: [{ text: prompt }] });
        if (chatMemories[remoteJid].length > 10) chatMemories[remoteJid] = chatMemories[remoteJid].slice(-10);

        const systemInstruction = `You are the chief AI service advisor and universal expert for UCAUTOTECH (UC Automobile Care) in Lagos, Nigeria, managed by CEO Uchenna Elem. Answer all questions accurately, intelligently, and directly.
        Rules:
        1. Address male clients as "${clientTitle}".
        2. If the client speaks Yoruba, Igbo, Hausa, or Pidgin, reply in clean, concise English.
        3. If the client speaks foreign languages (French, Spanish, etc.), reply in that same language.
        4. Answer any general knowledge, technical, financial, or automotive question freely.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: chatMemories[remoteJid],
            config: { systemInstruction: systemInstruction }
        });

        const reply = response.text || `Good day ${clientTitle}. How can UCAUTOTECH assist you today?`;
        chatMemories[remoteJid].push({ role: 'model', parts: [{ text: reply }] });
        return reply;
    } catch (err) {
        return `Good day ${clientTitle}. I am your UCAUTOTECH AI assistant. Regarding your query, I am fully at your service. Ask me anything or reply #menu for workshop options!`;
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'open') {
            console.log('====================================');
            console.log('[UCAUTOTECH GATEWAY] v3.11 Separated Mobility & Labor Live!');
            console.log('====================================');
            startSMSNotificationListener(sock);
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;
            
            const remoteJid = msg.key.remoteJid;
            const pushName = msg.pushName || 'Valued Client';
            const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
            const lowerBody = body.toLowerCase();

            if (!body) continue;

            const now = Date.now();
            if (messageCooldowns[remoteJid] && (now - messageCooldowns[remoteJid] < 3000)) continue;
            messageCooldowns[remoteJid] = now;

            const hour = new Date().getHours();
            const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
            const clientTitle = `Mr. ${pushName}`;

            if (lowerBody === '#location' || lowerBody === '#map' || lowerBody.includes('where is your workshop')) {
                await sock.sendMessage(remoteJid, {
                    location: {
                        degreesLatitude: WORKSHOP_LAT,
                        degreesLongitude: WORKSHOP_LNG,
                        name: WORKSHOP_NAME,
                        address: WORKSHOP_ADDRESS
                    }
                });
                await sock.sendMessage(remoteJid, { text: `📍 *UCAUTOTECH WORKSHOP HUB*\n\nGood ${timeOfDay} ${clientTitle},\nAbove is our interactive map pin.\n🗺️ *Google Maps:* https://www.google.com/maps/search/?api=1&query=${WORKSHOP_LAT},${WORKSHOP_LNG}` });
                return;
            }

            if (lowerBody === '#menu' || lowerBody === 'price' || lowerBody === 'services') {
                delete clientSessions[remoteJid];
                const menuText = `Good ${timeOfDay} ${clientTitle},\n\n` +
                    `==============================\n` +
                    `       *UCAUTOTECH / UC AUTOMOBILE CARE*       \n` +
                    `          *VIP WORKSHOP SERVICES v3.11*         \n` +
                    `==============================\n\n` +
                    `1️⃣ Full System Diagnosis (₦30k - ₦50k)\n` +
                    `2️⃣ ECM / PCM Programming & Flashing (₦70k - ₦350k)\n` +
                    `3️⃣ Smart Keys & Immobilizer Coding (₦70k - ₦250k)\n` +
                    `4️⃣ Advanced Module Calibration (₦70k - ₦200k)\n` +
                    `5️⃣ Servicing & Routine Maintenance (₦20k - ₦50k)\n` +
                    `6️⃣ Engine Replacement (₦100k - ₦450k)\n` +
                    `7️⃣ Pre-Purchase Vehicle Inspection (₦150k - ₦200k+)\n` +
                    `8️⃣ DTC Lookup & Maintenance Subscription (₦5,000/mo)\n\n` +
                    `💡 _Reply 1-8 for invoices or ask any question!_`;
                await sock.sendMessage(remoteJid, { text: menuText });
                return;
            }

            if (['1','2','3','4','5','6','7','8'].includes(lowerBody)) {
                clientSessions[remoteJid] = { option: lowerBody };
                const opts = {
                    '1': 'Full System Diagnosis', '2': 'ECM / PCM Programming & Flashing',
                    '3': 'Smart Keys & Immobilizer Coding', '4': 'Advanced Module Calibration',
                    '5': 'Servicing & Routine Maintenance', '6': 'Engine Replacement',
                    '7': 'Pre-Purchase Vehicle Inspection', '8': 'DTC Lookup & Maintenance Subscription'
                };
                await sock.sendMessage(remoteJid, { text: `Good ${timeOfDay} ${clientTitle}.\n\n📌 *Option ${lowerBody} Selected: ${opts[lowerBody]}*\n\nPlease reply with your *Vehicle Make, Model, Year, and Location* (e.g., Lexus RX350 2018 Lekki Lagos) to generate your official invoice.` });
                return;
            }

            if (lowerBody.includes('human') || lowerBody.includes('#human') || lowerBody.includes('ceo')) {
                await sock.sendMessage(remoteJid, { text: `🔔 *Calling UCAUTOTECH Leadership...*\n\n${clientTitle}, CEO Uchenna Elem has been notified directly.` });
                await sock.sendMessage(ADMIN_JID, { text: `🚨 *ESCALATION NOTICE*\nClient ${clientTitle} requested assistance!` });
                return;
            }

            const activeSession = clientSessions[remoteJid];
            if (activeSession && (lowerBody.includes('20') || lowerBody.includes('19') || lowerBody.includes('lagos') || lowerBody.includes('ikeja') || lowerBody.includes('lekki') || lowerBody.includes('ajah') || lowerBody.includes('abuja') || lowerBody.includes('ph') || lowerBody.includes('ibadan'))) {
                const selectedOpt = activeSession.option;
                let serviceName = "Full System Diagnosis";
                let basePrice = 50000;
                if (selectedOpt === '2') { serviceName = "ECM / PCM Programming"; basePrice = 150000; }
                else if (selectedOpt === '3') { serviceName = "Smart Keys Coding"; basePrice = 150000; }
                else if (selectedOpt === '4') { serviceName = "Module Calibration"; basePrice = 70000; }
                else if (selectedOpt === '5') { serviceName = "Maintenance"; basePrice = 35000; }
                else if (selectedOpt === '6') { serviceName = "Engine Replacement"; basePrice = 250000; }
                else if (selectedOpt === '7') { serviceName = "Pre-Purchase Inspection"; basePrice = 200000; }
                else if (selectedOpt === '8') { serviceName = "DTC Subscription"; basePrice = 5000; }

                const isInterstate = lowerBody.includes('abuja') || lowerBody.includes('ph') || lowerBody.includes('ibadan') || lowerBody.includes('enugu');
                let targetLat = WORKSHOP_LAT;
                let targetLng = WORKSHOP_LNG;

                if (lowerBody.includes('lekki')) { targetLat = 6.4698; targetLng = 3.5852; }
                else if (lowerBody.includes('ikeja')) { targetLat = 6.6018; targetLng = 3.3515; }
                else if (lowerBody.includes('ajah')) { targetLat = 6.4684; targetLng = 3.5649; }
                else if (isInterstate) { targetLat = 7.3775; targetLng = 3.9470; }

                const distanceKm = parseFloat(calculateDistanceKm(targetLat, targetLng).toFixed(1));
                const laborMultiplier = isInterstate ? 1.80 : 1.40;
                const laborNote = isInterstate ? "Interstate Field Labor (+80%)" : "On-Site Field Labor (+40%)";
                
                const adjustedLabor = Math.round(basePrice * (selectedOpt === '8' ? 1 : laborMultiplier));
                const mobilityFee = selectedOpt === '8' ? 0 : calculateMobilityFee(distanceKm, isInterstate);
                const finalEstimate = adjustedLabor + mobilityFee;
                const invoiceNo = "UC-" + Math.floor(100000 + Math.random() * 900000);

                pendingPayments[finalEstimate] = remoteJid;

                const invoiceMsg = `==============================\n` +
                   `       *UCAUTOTECH / UC AUTOMOBILE CARE*       \n` +
                   `          *OFFICIAL WORKSHOP INVOICE*         \n` +
                   `==============================\n\n` +
                   `📄 *Invoice No:* ${invoiceNo}\n` +
                   `📅 *Date:* ${new Date().toLocaleDateString()}\n` +
                   `👤 *Client:* ${clientTitle}\n\n` +
                   `------------------------------\n` +
                   `🚗 *SPECIFICATION:* ${body}\n` +
                   `📍 *FIELD TRAVEL DISTANCE:* ~${distanceKm} km\n` +
                   `🔧 *SERVICE:* ${serviceName}\n` +
                   `• Base Fee: ₦${basePrice.toLocaleString()}\n` +
                   `• ${laborNote}: ₦${adjustedLabor.toLocaleString()}\n` +
                   `• Mobility / Transport Fee: ₦${mobilityFee.toLocaleString()}\n` +
                   `------------------------------\n` +
                   `💰 *TOTAL ESTIMATE DUE: ₦${finalEstimate.toLocaleString()}\n` +
                   `------------------------------\n\n` +
                   `💳 *BANK PAYMENT ROUTING:*\n` +
                   `• Bank: *UBA Bank*\n` +
                   `• Account Name: *UCAUTOTECH / UC AUTOMOBILE CARE*\n\n` +
                   `🟢 *Verification:* Transfer exact amount above for instant Green Light (🟢) clearance!`;

                await sock.sendMessage(remoteJid, { text: invoiceMsg });
                delete clientSessions[remoteJid];
                return;
            }

            const aiReply = await askGemini(remoteJid, clientTitle, body);
            await sock.sendMessage(remoteJid, { text: aiReply });
        }
    });
}

function startSMSNotificationListener(sock) {
    setInterval(() => {
        exec('termux-sms-list -l 5', (err, stdout) => {
            if (err || !stdout) return;
            try {
                const messages = JSON.parse(stdout);
                for (const sms of messages) {
                    const text = (sms.body || '').toLowerCase();
                    if (text.includes('uba') || text.includes('credit') || text.includes('cr:')) {
                        const amountMatch = text.match(/(?:ngn|n|cr)?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
                        if (amountMatch) {
                            const rawAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
                            const targetJid = pendingPayments[rawAmount];
                            if (targetJid) {
                                issueGreenLight(sock, targetJid, sms.body);
                                delete pendingPayments[rawAmount];
                            }
                        }
                    }
                }
            } catch (e) {}
        });
    }, 5000);
}

async function issueGreenLight(sock, clientJid) {
    const ticket = `🟢 *UCAUTOTECH OFFICIAL PAYMENT CLEARANCE*\n\nStatus: *VERIFIED & APPROVED (GREEN LIGHT 🟢)*\nEngine: *UBA Automated Real-Time Gateway (v3.11)*\n\nYour booking is active! A senior technician has been assigned.`;
    await sock.sendMessage(clientJid, { text: ticket });
    await sock.sendMessage(ADMIN_JID, { text: `✅ *AUTOMATED GREEN LIGHT ISSUED!*\nClient: ${clientJid}` });
}

startBot();

// Listen for incoming WhatsApp calls in real-time
sock.ev.on('call', async (calls) => {
    for (const call of calls) {
        if (call.status === 'offer') {
            console.log(`[CALL DETECTED] Incoming call from ${call.from} (ID: ${call.id})`);
            try {
                await sock.rejectCall(call.id, call.from);
            } catch (err) {
                console.log("[CALL ERROR] Could not auto-reject call:", err.message);
            }
            await sock.sendMessage(call.from, {
                text: "Automated Notice 🟢: UCAUTOTECH VIP Workshop is currently active via text/AI advisory. Please drop your vehicle details, diagnostic codes, or location for instant processing!"
            });
        }
    }
});

// --- UCAUTOTECH WMS v3.11 Persistent Winston Logger ---
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `[${info.timestamp}] [${info.level.toUpperCase()}] ${info.message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'wms-production.log', maxsize: 5242880, maxFiles: 5 })
    ]
});

// Hook console logs into Winston for unified tracking
console.log = (msg, ...args) => logger.info(typeof msg === 'object' ? JSON.stringify(msg) : msg);
console.error = (msg, ...args) => logger.error(typeof msg === 'object' ? JSON.stringify(msg) : msg);

console.log("[WMS LOGGER ACTIVE] Persistent file logging initialized successfully.");

// --- UCAUTOTECH Incoming Message & AI Advisory Listener ---
sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const m of messages) {
        // Ignore messages sent by the bot itself or status broadcasts
        if (m.key.fromMe || m.key.remoteJid === 'status@broadcast') continue;

        const senderJid = m.key.remoteJid;
        const messageContent = m.message?.conversation || m.message?.extendedTextMessage?.text;

        if (!messageContent) continue;

        console.log(`[INCOMING MSG] From ${senderJid}: ${messageContent}`);

        // Quick automated response logic or Gemini integration for vehicle checks
        let replyText = "UCAUTOTECH VIP Advisory 🟢: Thanks for reaching out! For vehicle inspections (like a 2025 Hyundai Sorento), our base diagnostic fee is ₦70,000. Please reply with the vehicle's location so we can calculate mobility surcharges and provide your UBA payment routing.";

        if (messageContent.toLowerCase().includes('sorento') || messageContent.toLowerCase().includes('hyundai')) {
            replyText = "UCAUTOTECH VIP Advisory 🟢:\n\nFor a **2025 Hyundai Sorento** Pre-Purchase Inspection, our comprehensive diagnostic check covers complete electronic module scanning, live data telemetry, and system health verification.\n\n*   **Base Inspection Fee:** ₦70,000\n*   **Next Step:** Please drop the exact location/address of the vehicle (Lagos / Interstate) to apply distance-based mobility fees and generate your UBA payment routing for Green Light (🟢) clearance.";
        }

        await sock.sendMessage(senderJid, { text: replyText });
    }
});
