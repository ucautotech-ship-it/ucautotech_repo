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
                if (shouldReconnect) initializeUCAUTOTECH_WMS();
            } else if (connection === 'open') {
                console.log("[UCAUTOTECH WMS v3.17] Direct service list greeting patch applied successfully.");
                startAutonomousStatusEngine(sock);
            }
        });

        // Autonomous Background Status Broadcast Loop
        function startAutonomousStatusEngine(activeSock) {
            setInterval(async () => {
                try {
                    const statusCaption = "UCAUTOTECH VIP WORKSHOP STATUS\n\nExpert On-Site Diagnostics, Tiered Pricing & AI Fault Analysis.\n\n• 2015 & Older: ₦100,000 base\n• 2016 & Newer: ₦200,000 – ₦300,000\n• Interstate: +50% Labor Markup\n\nMessage us now for instant service invoices and secure UBA payment routing!";
                    
                    if (fs.existsSync('ucautotech_promo.jpg')) {
                        await activeSock.sendMessage('status@broadcast', {
                            image: fs.readFileSync('ucautotech_promo.jpg'),
                            caption: statusCaption
                        });
                    }
                } catch (err) {
                    console.error("[STATUS BROADCAST ERROR]:", err.message);
                }
            }, 4 * 60 * 60 * 1000);
        }

        // Call Interception Handler
        sock.ev.on('call', async (calls) => {
            for (const call of calls) {
                if (call.status === 'offer') {
                    try {
                        await sock.rejectCall(call.id, call.from);
                    } catch (err) {}
                    await sock.sendMessage(call.from, {
                        text: "UCAUTOTECH VIP WORKSHOP\n\nCalls are automatically deflected to our digital advisory. Type promo to receive our brand promotional suite and service subscriptions."
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
                let replyText = "";
                let imageToSend = null;

                if (lowerContent === '!promo' || lowerContent === 'promo' || lowerContent === 'subscription' || lowerContent === 'flyer') {
                    if (fs.existsSync('ucautotech_promo.jpg')) {
                        imageToSend = 'ucautotech_promo.jpg';
                    }
                    replyText = "UCAUTOTECH VIP WORKSHOP & SUBSCRIPTION SUITE\n\n" +
                                "Autonomous On-Site Diagnostics & Repair\n\n" +
                                "Tiered Pricing Structure:\n" +
                                "• 2015 & Older: ₦100,000 base\n" +
                                "• 2016 & Newer: ₦200,000 – ₦300,000\n" +
                                "• Interstate: +50% Labor Surcharge\n" +
                                "• Separate Mobility & Transport Pricing\n\n" +
                                "VIP Maintenance Subscriptions:\n" +
                                "Sign up for corporate fleet monitoring, priority technician dispatch, and advanced AI diagnostics. Reply with your vehicle model, year, and location to generate your official electronic invoice.";
                } 
                else if (lowerContent.includes('confirm') || lowerContent.includes('pay') || lowerContent.includes('send account')) {
                    replyText = "UCAUTOTECH VIP WORKSHOP - PAYMENT ROUTING\n\n" +
                                "Bank Name: United Bank for Africa (UBA)\n" +
                                "Account Number: [Insert UBA Account Number Here]\n" +
                                "Account Name: UC Auto Care / UCAUTOTECH\n" +
                                "Reference Tag: #UC-" + Math.floor(100000 + Math.random() * 900000) + "\n\n" +
                                "Clearance: Please transfer the exact total sum and reply with your payment receipt or screenshot here to instantly lock in your technician dispatch.";
                } 
                else if (lowerContent.includes('p0') || lowerContent.includes('p1') || lowerContent.includes('p2') || lowerContent.includes('code') || lowerContent.includes('fault') || lowerContent.includes('symptom') || lowerContent.includes('engine')) {
                    try {
                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: "You are a master automotive diagnostic expert for UCAUTOTECH. Analyze this client query: \"" + messageContent + "\". Provide a concise, professional, 3-point technical breakdown with potential causes and a recommendation for our on-site inspection."
                        });
                        
                        replyText = "UCAUTOTECH AI DIAGNOSTIC ADVISORY\n\n" +
                                    response.text + "\n\n" +
                                    "Next Step: Type promo for subscription options or reply with your vehicle model, year, and location for an itemized invoice.";
                    } catch (aiErr) {
                        replyText = "UCAUTOTECH VIP ADVISORY\n\nWe received your technical inquiry. Our master technicians will evaluate this during your on-site inspection. Please reply with your vehicle model, year, and location.";
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

                        replyText = "UCAUTOTECH AUTOMOTIVE CARE\n" +
                                    "ELECTRONIC SERVICE INVOICE\n\n" +
                                    "Invoice ID: #" + invoiceNo + "\n" +
                                    "Vehicle Year: " + vehicleYear + " (" + bracketLabel + ")\n" +
                                    "Service Type: Pre-Purchase Diagnostic & Inspection\n" +
                                    "Coverage Zone: " + coverageText + "\n\n" +
                                    "ITEMIZED COST BREAKDOWN:\n" +
                                    "1. Labor / Diagnostic Fee: " + laborDisplay + "\n" +
                                    "2. Mobility / Transport Fee: ₦" + mobilityFee.toLocaleString() + " (Distance-based logistics)\n\n" +
                                    "TOTAL PAYABLE AMOUNT: " + totalDisplay + "\n\n" +
                                    "Next Step for Clearance:\nType Confirm & Pay to receive your official UBA payment routing details.";
                    } else {
                        // Immediate Service List & Pricing Breakdown on general greeting/message
                        replyText = "UCAUTOTECH VIP WORKSHOP - SERVICE LIST\n\n" +
                                    "Welcome! We provide advanced on-site diagnostics, AI fault analysis, and automated electronic invoicing.\n\n" +
                                    "OFFICIAL SERVICE & PRICING TIERS:\n" +
                                    "• 2015 & Older Vehicles: ₦100,000 Base Labor\n" +
                                    "• 2016 & Newer Vehicles: ₦200,000 – ₦300,000 Labor\n" +
                                    "• Interstate Dispatch: +50% Labor Surcharge\n" +
                                    "• Mobility & Logistics: Itemized per location\n\n" +
                                    "HOW TO GET STARTED:\n" +
                                    "1. Reply with your vehicle Model, Year, and Location (e.g. 2018 Toyota, Lagos) for an instant service invoice.\n" +
                                    "2. Type promo or subscription to view our brand media suite.\n" +
                                    "3. Send specific diagnostic fault codes (e.g. P189200) for AI technical analysis.";
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
        console.error("[CRITICAL BOOT ERROR]:", error);
    }
}

initializeUCAUTOTECH_WMS();
