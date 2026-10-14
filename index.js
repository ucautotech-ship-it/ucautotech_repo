const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const winston = require('winston');

// Persistent Enterprise Winston Logger Configuration
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

async function initializeUCAUTOTECH_WMS() {
    try {
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
                    initializeUCAUTOTECH_WMS();
                }
            } else if (connection === 'open') {
                console.log("[UCAUTOTECH WMS v3.11] Enterprise Autonomous System successfully online and bound!");
            }
        });

        // Call Interception & Deflection Handler
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
                        text: "Automated Notice 🟢: UCAUTOTECH VIP Workshop (v3.11) is active via text/AI advisory. Please submit vehicle details, diagnostic codes, or location for instant processing."
                    });
                }
            }
        });

        // Encapsulated Message Upsert Listener with Local Scope Reference
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const m of messages) {
                if (m.key.fromMe || m.key.remoteJid === 'status@broadcast') continue;

                const senderJid = m.key.remoteJid;
                const msgObj = m.message;
                if (!msgObj) continue;

                const messageContent = msgObj.conversation || 
                                       msgObj.extendedTextMessage?.text || 
                                       msgObj.imageMessage?.caption || '';

                const isAudio = !!msgObj.audioMessage;

                console.log(`[INCOMING EVENT v3.11] Target: ${senderJid} | Content: "${messageContent}" | Audio: ${isAudio}`);

                let replyText = "UCAUTOTECH VIP Advisory 🟢:\n\nThanks for reaching out! For vehicle inspections and diagnostics (such as a 2025 Hyundai Sorento), our base inspection fee is **₦70,000**.\n\n*   **Next Step:** Please reply with the vehicle's exact location or address (Lagos / Interstate) so we can apply distance-based mobility surcharges and send your UBA payment routing.";

                if (isAudio) {
                    replyText = "UCAUTOTECH VIP Advisory 🟢:\n\nAudio note received! Our automated v3.11 enterprise engine processes text inquiries best. For vehicle inspections (like your Sorento check), our base fee is **₦70,000** plus mobility surcharges.\n\n*   **Next Step:** Please drop the location/address of the vehicle so we can generate your UBA payment routing for Green Light (🟢) clearance.";
                } else if (messageContent.toLowerCase().includes('sorento') || messageContent.toLowerCase().includes('hyundai') || messageContent.toLowerCase().includes('check') || messageContent.toLowerCase().includes('how much')) {
                    replyText = "UCAUTOTECH VIP Advisory 🟢:\n\nFor a **2025 Hyundai Sorento** Pre-Purchase Inspection, our comprehensive diagnostic check covers complete electronic module scanning, live data telemetry, and system health verification.\n\n*   **Base Inspection Fee:** ₦70,000\n*   **Next Step:** Please drop the exact location/address of the vehicle (Lagos / Interstate) to apply distance-based mobility fees and generate your UBA payment routing for Green Light (🟢) clearance.";
                }

                await sock.sendMessage(senderJid, { text: replyText });
            }
        });

    } catch (error) {
        console.error("[CRITICAL BOOT ERROR] Failed to initialize WMS runtime:", error);
    }
}

initializeUCAUTOTECH_WMS();
