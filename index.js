const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
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
                if (shouldReconnect) initializeUCAUTOTECH_WMS();
            } else if (connection === 'open') {
                console.log("[UCAUTOTECH WMS v3.11] Enterprise Autonomous System online with Branded Invoice Generator!");
            }
        });

        // Call Interception Handler
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
                        text: "🏛️ *UCAUTOTECH VIP WORKSHOP* 🟢\n\nCalls are automatically deflected to our 24/7 digital advisory. Please send your vehicle model, year, and exact location to generate an official branded itemized inspection invoice."
                    });
                }
            }
        });

        // Message Listener with Branded Invoice Generation
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
                const lowerContent = messageContent.toLowerCase();

                console.log(`[INCOMING EVENT v3.11] Target: ${senderJid} | Content: "${messageContent}" | Audio: ${isAudio}`);

                let replyText = `🏛️ *UCAUTOTECH VIP WORKSHOP* 🟢
══════════════════════
*OFFICIAL DIGITAL ADVISORY*
══════════════════════
Welcome! To generate your instant branded itemized invoice, please reply with:
1️⃣ **Vehicle Model & Year** (e.g. 2012 Ford Explorer or 2024 Sorento)
2️⃣ **Exact Location / Address** (Lagos / Interstate)`;

                if (isAudio) {
                    replyText = `🏛️ *UCAUTOTECH VIP WORKSHOP* 🟢
══════════════════════
Audio note received! Our automated v3.11 enterprise engine processes text best. Please text your vehicle's **model, year, and location** to generate your official branded invoice.`;
                } else {
                    const yearMatch = messageContent.match(/\b(20[0-2][0-9]|19[8-9][0-9])\b/);
                    
                    if (yearMatch) {
                        const vehicleYear = parseInt(yearMatch[1], 10);
                        const isInterstate = lowerContent.includes('interstate') || 
                                             lowerContent.includes('abuja') || 
                                             lowerContent.includes('ibadan') || 
                                             lowerContent.includes('port harcourt') || 
                                             lowerContent.includes('kano') ||
                                             lowerContent.includes('outside lagos');

                        let minLabor = 100000;
                        let maxLabor = 100000;
                        let bracketLabel = "₦100,000 (2015 & Older)";

                        if (vehicleYear >= 2016) {
                            minLabor = 200000;
                            maxLabor = 300000;
                            bracketLabel = "₦200,000 - ₦300,000 (2016 & Newer)";
                        }

                        // Apply 50% Interstate surcharge if applicable
                        if (isInterstate) {
                            minLabor *= 1.5;
                            maxLabor *= 1.5;
                        }

                        // Separate Mobility Fee calculation baseline
                        let mobilityFee = isInterstate ? 50000 : 20000; 

                        let totalMin = minLabor + mobilityFee;
                        let totalMax = maxLabor + mobilityFee;

                        let laborDisplay = minLabor === maxLabor ? 
                            `₦${minLabor.toLocaleString()}` : 
                            `₦${minLabor.toLocaleString()} – ₦${maxLabor.toLocaleString()}`;

                        let totalDisplay = totalMin === totalMax ? 
                            `₦${totalMin.toLocaleString()}` : 
                            `₦${totalMin.toLocaleString()} – ₦${totalMax.toLocaleString()}`;

                        let coverageText = isInterstate ? "Interstate Dispatch (+50% Labor Markup)" : "Lagos Metropolitan Coverage";
                        let invoiceNo = "UC-" + Math.floor(100000 + Math.random() * 900000);

                        replyText = `⚙️ **UCAUTOTECH AUTOMOTIVE CARE** 🟢
═══════════════════════════════
       📋 **ELECTRONIC SERVICE INVOICE** 📋
═══════════════════════════════
🔹 **Invoice ID:** #${invoiceNo}
🔹 **Vehicle Year:** ${vehicleYear} (${bracketLabel})
🔹 **Service Type:** Pre-Purchase Diagnostic & Inspection
🔹 **Coverage Zone:** ${coverageText}

───────────────────────────────
💼 **ITEMIZED COST BREAKDOWN:**
───────────────────────────────
1️⃣ **Labor / Diagnostic Fee:** ${laborDisplay}
2️⃣ **Mobility / Transport Fee:** ₦${mobilityFee.toLocaleString()} *(Client-provided logistics)*

═══════════════════════════════
💰 **TOTAL PAYABLE AMOUNT:** ${totalDisplay}
═══════════════════════════════

🏦 *Next Step for Green Light (🟢) Clearance:*
Please reply with your confirmation so we can issue your UBA payment routing and dispatch your dedicated senior technician team!`;
                    }
                }

                await sock.sendMessage(senderJid, { text: replyText });
            }
        });

    } catch (error) {
        console.error("[CRITICAL BOOT ERROR] Failed to initialize WMS runtime:", error);
    }
}

initializeUCAUTOTECH_WMS();
