const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const winston = require('winston');

// Winston Logger Setup
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

console.log = (msg) => logger.info(typeof msg === 'object' ? JSON.stringify(msg) : msg);
console.error = (msg) => logger.error(typeof msg === 'object' ? JSON.stringify(msg) : msg);

async function startWMS() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`[CONNECTION CLOSED] Reconnecting: ${shouldReconnect}`);
            if (shouldReconnect) {
                startWMS();
            }
        } else if (connection === 'open') {
            console.log("[UCAUTOTECH WMS v3.11] Connected successfully and active online!");
        }
    });

    // Call Interception Listener
    sock.ev.on('call', async (calls) => {
        for (const call of calls) {
            if (call.status === 'offer') {
                console.log(`[CALL DETECTED] Incoming call from ${call.from}`);
                try {
                    await sock.rejectCall(call.id, call.from);
                } catch (err) {
                    console.log("[CALL ERROR] Could not reject call:", err.message);
                }
                await sock.sendMessage(call.from, {
                    text: "Automated Notice 🟢: UCAUTOTECH VIP Workshop is currently active via text/AI advisory. Please drop your vehicle details, diagnostic codes, or location for instant processing!"
                });
            }
        }
    });

    // Incoming Messages & AI Advisory Listener
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const m of messages) {
            if (m.key.fromMe || m.key.remoteJid === 'status@broadcast') continue;

            const senderJid = m.key.remoteJid;
            const messageContent = m.message?.conversation || m.message?.extendedTextMessage?.text;

            if (!messageContent) continue;

            console.log(`[INCOMING MSG] From ${senderJid}: ${messageContent}`);

            let replyText = "UCAUTOTECH VIP Advisory 🟢: Thanks for reaching out! For vehicle inspections (like a 2025 Hyundai Sorento), our base diagnostic fee is ₦70,000. Please reply with the vehicle's location so we can calculate mobility surcharges and provide your UBA payment routing.";

            if (messageContent.toLowerCase().includes('sorento') || messageContent.toLowerCase().includes('hyundai')) {
                replyText = "UCAUTOTECH VIP Advisory 🟢:\n\nFor a **2025 Hyundai Sorento** Pre-Purchase Inspection, our comprehensive diagnostic check covers complete electronic module scanning, live data telemetry, and system health verification.\n\n*   **Base Inspection Fee:** ₦70,000\n*   **Next Step:** Please drop the exact location/address of the vehicle (Lagos / Interstate) to apply distance-based mobility fees and generate your UBA payment routing for Green Light (🟢) clearance.";
            }

            await sock.sendMessage(senderJid, { text: replyText });
        }
    });
}

startWMS();
