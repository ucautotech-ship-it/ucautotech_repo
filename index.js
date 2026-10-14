const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const winston = require('winston');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "API_KEY_PLACEHOLDER" });

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
                console.log("[UCAUTOTECH WMS v3.15] Autonomous Studio, AI Diagnostics & Status Broadcast Engine online!");
                
                // Launch Autonomous Background Status Broadcaster (Runs every 4 hours)
                startAutonomousStatusEngine(sock);
            }
        });

        // Autonomous Background Status Broadcast Loop
        function startAutonomousStatusEngine(activeSock) {
            setInterval(async () => {
                try {
                    const statusCaption = `🚀 **UCAUTOTECH VIP WORKSHOP STATUS BROADCAST** 🟢\n═══════════════════════════════\n🔧 Expert On-Site Diagnostics, Tiered Pricing & AI Fault Analysis.\n\n🔹 2015 & Older: ₦100,000 base\n🔹 2016 & Newer: ₦200,000 – ₦300,000\n🔹 Interstate: +50% Labor Markup\n\nMessage us now for instant service invoices and secure UBA payment routing!`;
                    
                    if (fs.existsSync('ucautotech_promo.jpg')) {
                        await activeSock.sendMessage('status@broadcast', {
                            image: fs.readFileSync('ucautotech_promo.jpg'),
                            caption: statusCaption
                        });
                        console.log("[AUTONOMOUS STATUS] Successfully broadcasted branded promo graphic to WhatsApp status story.");
                    }
                } catch (err) {
                    console.error("[STATUS BROADCAST ERROR] Could not push to status story:", err.message);
                }
            }, 4 * 60 * 60 * 1000); // 4-hour interval cycle
        }

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
                        text: "🏛️ *UCAUTOTECH VIP WORKSHOP* 🟢\n\nCalls are automatically deflected to our 24/7 digital advisory. Type 'promo' to receive our brand promotional suite and service subscriptions."
                    });
                }
            }
        });

        // Comprehensive Master Message Listener
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

                const lowerContent = messageContent.toLowerCase();
                console.log(`[INCOMING EVENT v3.15] Target: ${senderJid} | Content: "${messageContent}"`);

                let replyText = "";
                let imageToSend = null;

                if (lowerContent === '!promo' || lowerContent === 'promo' || lowerContent === 'subscription' || lowerContent === 'flyer') {
                    if (fs.existsSync('ucautotech_promo.jpg')) {
                        imageToSend = 'ucautotech_promo.jpg';
                    }
                    replyText = `🚀 **UCAUTOTECH VIP WORKSHOP & SUBSCRIPTION SUITE** 🟢
═══════════════════════════════
🔧 *Autonomous On-Site Diagnostics & Repair*

🔹 **Tiered Pricing Structure:**
• 2015 & Older: ₦100,000 base
• 2016 & Newer: ₦200,000 – ₦300,000
• Interstate: +50% Labor Surcharge
• Separate Mobility & Transport Pricing

⭐ **VIP Maintenance Subscriptions Available:**
Sign up for corporate fleet monitoring, priority technician dispatch, and advanced AI diagnostics. Reply with your vehicle **model, year, and location** to generate your official electronic invoice!`;
                } 
                else if (lowerContent.includes('confirm') || lowerContent.includes('pay') || lowerContent.includes('send account')) {
                    replyText = `🏛️ *UCAUTOTECH VIP WORKSHOP* - PAYMENT ROUTING 🟢
═══════════════════════════════
🏦 **Bank Name:** United Bank for Africa (UBA)
📌 **Account Number:** [Insert UBA Account Number Here]
👤 **Account Name:** UC Auto Care / UCAUTOTECH
🔖 **Reference Tag:** #UC-${Math.floor(100000 + Math.random() * 900000)}

⚠️ *Green Light (🟢) Clearance:* Please transfer the exact total sum and reply with your payment receipt/screenshot here to instantly lock in your technician dispatch!`;
                } 
                else if (lowerContent.includes('p0') || lowerContent.includes('p1') || lowerContent.includes('p2') || lowerContent.includes('code') || lowerContent.includes('fault') || lowerContent.includes('symptom') || lowerContent.includes('engine')) {
                    try {
                        console.log("[AI DIAGNOSTIC] Consulting Gemini AI for trouble code/symptom breakdown...");
                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: `You are a master automotive diagnostic expert for UCAUTOTECH. Analyze this client query: "${messageContent}". Provide a concise, professional, 3-point technical breakdown with potential causes and a recommendation for our on-site inspection.`
                        });
                        
                        replyText = `🤖 **UCAUTOTECH AI DIAGNOSTIC ADVISORY** 🟢
═══════════════════════════════
${response.text}

───────────────────────────────
*Next Step:* Type **"promo"** for subscription options or reply with your vehicle's model, year, and location for an itemized invoice!`;
                    } catch (aiErr) {
                        console.error("[AI ERROR] Failed to query Gemini:", aiErr.message);
                        replyText = "🏛️ *UCAUTOTECH VIP ADVISORY* 🟢\n\nWe received your technical inquiry. Our master technicians will evaluate this during your on-site inspection. Please reply with your vehicle model, year, and location.";
                    }
                } 
                else {
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

                        if (isInterstate) {
                            minLabor *= 1.5;
                            maxLabor *= 1.5;
                        }

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
2️⃣ **Mobility / Transport Fee:** ₦${mobilityFee.toLocaleString()} *(Distance-based logistics)*

═══════════════════════════════
💰 **TOTAL PAYABLE AMOUNT:** ${totalDisplay}
═══════════════════════════════

🏦 *Next Step for Green Light (🟢) Clearance:*
Type **"Confirm & Pay"** to receive your official UBA payment routing details!`;
                    } else {
                        replyText = `🏛️ *UCAUTOTECH VIP WORKSHOP* 🟢
═══════════════════════════════
Welcome! We provide advanced on-site diagnostics, AI fault analysis, and branded invoicing.

Type **"promo"** or **"subscription"** to view our professional brand suite and flyer, or reply with your vehicle **Model, Year, and Location**.`;
                    }
                }

                if (imageToSend) {
                    await sock.sendMessage(senderJid, { 
                        image: fs.readFileSync(imageToSend),
                        caption: replyText 
                    });
                } else {
                    await sock.sendMessage(senderJid, { text: replyText });
                }
            }
        });

    } catch (error) {
        console.error("[CRITICAL BOOT ERROR] Failed to initialize WMS runtime:", error);
    }
}

initializeUCAUTOTECH_WMS();
