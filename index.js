const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
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

// Financial & Activity Ledger
const LEDGER_FILE = 'wms_ledger.json';
function logTransaction(entry) {
    let ledger = [];
    try {
        if (fs.existsSync(LEDGER_FILE)) {
            ledger = JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8'));
        }
    } catch (e) {}
    ledger.push({ timestamp: new Date().toISOString(), ...entry });
    fs.writeFileSync(LEDGER_FILE, JSON.stringify(ledger, null, 2));
}

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
                console.log("[UCAUTOTECH WMS v3.25] Enterprise Modules (Voice, Parts, & Daily Ledger) Online!");
                startAutonomousStatusEngine(sock);
                startDailyFinancialCron(sock);
            }
        });

        // 1. Automated Background Status Broadcast Loop
        function startAutonomousStatusEngine(activeSock) {
            setInterval(async () => {
                try {
                    const statusCaption = "UCAUTOTECH / UC AUTOMOBILE CARE\nVIP WORKSHOP SERVICES v3.10\n\n1. Full System Diagnosis (₦30k - ₦50k)\n2. ECM / PCM Programming & Flashing (₦70k - ₦350k)\n3. Smart Keys & Immobilizer Coding (₦70k - ₦250k)\n4. Advanced Module Calibration (₦70k - ₦200k)\n5. Servicing & Routine Maintenance (₦20k - ₦50k)\n6. Engine Replacement (₦100k - ₦450k)\n7. Pre-Purchase Vehicle Inspection (₦150k - ₦200k+)\n8. DTC Lookup & Maintenance Subscription (₦5,000/mo)\n\nMessage us now for instant electronic invoicing and UBA payment routing!";
                    
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

        // 2. Automated Daily Revenue & Job Summary Report Cron
        function startDailyFinancialCron(activeSock) {
            setInterval(async () => {
                try {
                    if (!fs.existsSync(LEDGER_FILE)) return;
                    const ledger = JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8'));
                    const today = new Date().toDateString();
                    const todaysEntries = ledger.filter(item => new Date(item.timestamp).toDateString() === today);
                    
                    if (todaysEntries.length === 0) return;

                    let totalInvoices = todaysEntries.filter(i => i.type === 'INVOICE').length;
                    let summaryText = `UCAUTOTECH ADMIN - DAILY REVENUE REPORT\nDate: ${today}\n\nTotal Invoices Generated: ${totalInvoices}\nLogged Transactions: ${todaysEntries.length}\n\nSystem operating at peak 24/7 efficiency.`;
                    
                    // Dispatch to admin (You can replace with your specific admin JID if needed, or broadcast locally)
                    console.log("[DAILY REPORT SUMMARY]:\n" + summaryText);
                } catch (err) {
                    console.error("[DAILY CRON ERROR]:", err.message);
                }
            }, 24 * 60 * 60 * 1000);
        }

        // Call Interception Handler
        sock.ev.on('call', async (calls) => {
            for (const call of calls) {
                if (call.status === 'offer') {
                    try {
                        await sock.rejectCall(call.id, call.from);
                    } catch (err) {}
                    await sock.sendMessage(call.from, {
                        text: "UCAUTOTECH / UC AUTOMOBILE CARE\n\nCalls are automatically deflected to our digital advisory. Reply 1-8 for services or send your vehicle requirements."
                    });
                }
            }
        });

        // Master Message Listener
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const m of messages) {
                if (m.key.fromMe || m.key.remoteJid === 'status@broadcast') continue;

                const senderJid = m.key.remoteJid;
                const msgObj = m.message;
                if (!msgObj) continue;

                let messageContent = msgObj.conversation || 
                                       msgObj.extendedTextMessage?.text || 
                                       msgObj.imageMessage?.caption || '';

                let imageToSend = null;
                let replyText = "";

                // 3. Voice Note / Audio Processing Module
                if (msgObj.audioMessage) {
                    try {
                        const buffer = await downloadMediaMessage(m, 'buffer', {});
                        // Temporary save audio for Gemini Multimodal Analysis
                        fs.writeFileSync('temp_audio.ogg', buffer);
                        
                        const audioPart = {
                            inlineData: {
                                data: buffer.toString("base64"),
                                mimeType: msgObj.audioMessage.mimetype || "audio/ogg"
                            }
                        };

                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: [audioPart, "You are a master automotive diagnostic expert for UCAUTOTECH. Analyze this client voice note describing a vehicle issue. Provide a professional technical assessment and recommended service action."]
                        });

                        replyText = "UCAUTOTECH / UC AUTOMOBILE CARE - AUDIO DIAGNOSTIC ADVISORY\n\n" +
                                    response.text + "\n\n" +
                                    "Reply 1-8 for service menus or provide your vehicle specifications for an official invoice.";
                        
                        if (fs.existsSync('temp_audio.ogg')) fs.unlinkSync('temp_audio.ogg');
                    } catch (audioErr) {
                        console.error("[AUDIO PARSE ERROR]:", audioErr);
                        replyText = "UCAUTOTECH / UC AUTOMOBILE CARE - ADVISORY\n\nWe received your voice note. Our master technicians will evaluate your vehicle's audio symptoms upon inspection.";
                    }

                    await sock.sendMessage(senderJid, { text: replyText });
                    continue;
                }

                const lowerContent = messageContent.toLowerCase();

                const masterServiceMenu = 
                    "Good morning Mr. Uche,\n\n" +
                    "==============================\n" +
                    "       UCAUTOTECH / UC AUTOMOBILE CARE       \n" +
                    "          VIP WORKSHOP SERVICES v3.10         \n" +
                    "==============================\n\n" +
                    "1. Full System Diagnosis (₦30k - ₦50k)\n" +
                    "2. ECM / PCM Programming & Flashing (₦70k - ₦350k)\n" +
                    "3. Smart Keys & Immobilizer Coding (₦70k - ₦250k)\n" +
                    "4. Advanced Module Calibration (₦70k - ₦200k)\n" +
                    "5. Servicing & Routine Maintenance (₦20k - ₦50k)\n" +
                    "6. Engine Replacement (₦100k - ₦450k)\n" +
                    "7. Pre-Purchase Vehicle Inspection (₦150k - ₦200k+)\n" +
                    "8. DTC Lookup & Maintenance Subscription (₦5,000/mo)\n\n" +
                    "Reply 1-8 for invoices, type #location for workshop map pin, or ask ANY question!";

                // Handle Location Pin Request
                if (lowerContent.includes('#location') || lowerContent.includes('location') || lowerContent.includes('address')) {
                    replyText = "UCAUTOTECH / UC AUTOMOBILE CARE - WORKSHOP LOCATION\n\n" +
                                "Address: Lagos Metropolitan Area / On-Site Dispatch Across Nigeria\n" +
                                "Map Pin / Navigation: Contact our desk directly or reply with your area name for mobility dispatch calculations.";
                }
                // Handle Payment Routing
                else if (lowerContent.includes('confirm') || lowerContent.includes('pay') || lowerContent.includes('send account')) {
                    let refTag = "#UC-" + Math.floor(100000 + Math.random() * 900000);
                    replyText = "UCAUTOTECH / UC AUTOMOBILE CARE - OFFICIAL WORKSHOP INVOICE\n\n" +
                                "BANK PAYMENT ROUTING:\n" +
                                "• Bank: UBA Bank\n" +
                                "• Account Name: UCAUTOTECH / UC AUTOMOBILE CARE\n" +
                                "• Reference Tag: " + refTag + "\n\n" +
                                "Verification: Transfer exact amount above for instant Green Light clearance.";
                    imageToSend = 'invoice_template.jpg';
                    logTransaction({ type: 'PAYMENT_REQUEST', ref: refTag, client: senderJid });
                }
                // Handle Number Selection (1 to 8)
                else if (/^[1-8]$/.test(messageContent.trim())) {
                    const choice = messageContent.trim();
                    let serviceName = "";
                    let basePrice = "";

                    switch(choice) {
                        case '1': serviceName = "Full System Diagnosis"; basePrice = "₦30,000 - ₦50,000"; break;
                        case '2': serviceName = "ECM / PCM Programming & Flashing"; basePrice = "₦70,000 - ₦350,000"; break;
                        case '3': serviceName = "Smart Keys & Immobilizer Coding"; basePrice = "₦70,000 - ₦250,000"; break;
                        case '4': serviceName = "Advanced Module Calibration"; basePrice = "₦70,000 - ₦200,000"; break;
                        case '5': serviceName = "Servicing & Routine Maintenance"; basePrice = "₦20,000 - ₦50,000"; break;
                        case '6': serviceName = "Engine Replacement"; basePrice = "₦100,000 - ₦450k"; break;
                        case '7': serviceName = "Pre-Purchase Vehicle Inspection"; basePrice = "₦150,000 - ₦200,000+"; break;
                        case '8': serviceName = "DTC Lookup & Maintenance Subscription"; basePrice = "₦5,000/mo"; break;
                    }

                    replyText = "UCAUTOTECH / UC AUTOMOBILE CARE\n" +
                                "VIP WORKSHOP SERVICES v3.10\n\n" +
                                "Selected Service: " + serviceName + "\n" +
                                "Standard Rate: " + basePrice + "\n\n" +
                                "Next Step: Reply with your vehicle Model, Year, and Location (e.g. 2017 Bentley Bentayga, Lekki) to generate your official electronic invoice!";
                }
                // Handle Interactive Parts & Diagnostic Quote Estimator or Fault Codes
                else if (lowerContent.includes('part') || lowerContent.includes('price') || lowerContent.includes('replace') || lowerContent.includes('p0') || lowerContent.includes('p1') || lowerContent.includes('code') || lowerContent.includes('fault')) {
                    try {
                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-flash',
                            contents: "You are a master automotive parts and diagnostic advisor for UCAUTOTECH. Analyze this client request: \"" + messageContent + "\". Provide a professional estimate breakdown including estimated part sourcing and labor context in Naira (₦)."
                        });
                        
                        replyText = "UCAUTOTECH / UC AUTOMOBILE CARE - PARTS & QUOTE ESTIMATOR\n\n" +
                                    response.text + "\n\n" +
                                    "Reply 1-8 for service menus or provide your vehicle specifications for an official invoice.";
                    } catch (aiErr) {
                        replyText = "UCAUTOTECH / UC AUTOMOBILE CARE - ADVISORY\n\nWe received your parts/diagnostic inquiry. Our spare parts desk will verify availability and quote you shortly.";
                    }
                }
                // Handle Vehicle Specifications & Invoicing -> Force 3D Nano-Print Graphic Attachment
                else {
                    const yearMatch = messageContent.match(/\b(20[0-2][0-9]|19[8-9][0-9])\b/);
                    
                    if (yearMatch) {
                        const vehicleYear = parseInt(yearMatch[1], 10);
                        const isLekki = lowerContent.includes('lekki') || lowerContent.includes('ikoyi') || lowerContent.includes('vi') || lowerContent.includes('victoria island');
                        
                        let baseFee = vehicleYear >= 2016 ? 50000 : 40000;
                        let distanceKm = isLekki ? 23.6 : 15.0;
                        let mobilityText = isLekki ? "Lagos Mobility On-Site (+40% labor | ~23.6 km away)" : "Standard Metropolitan Mobility";
                        let invoiceNo = "UC-" + Math.floor(100000 + Math.random() * 900000);
                        let currentDate = new Date().toLocaleDateString();

                        replyText = "==============================\n" +
                                    "       UCAUTOTECH / UC AUTOMOBILE CARE       \n" +
                                    "          OFFICIAL WORKSHOP INVOICE         \n" +
                                    "==============================\n\n" +
                                    "Invoice No: #" + invoiceNo + "\n" +
                                    "Date: " + currentDate + "\n" +
                                    "Client: Valued Client\n\n" +
                                    "SPECIFICATION: " + messageContent + "\n" +
                                    "MOBILITY DISTANCE: ~" + distanceKm + " km\n" +
                                    "SERVICE: Full System Diagnosis & Inspection\n" +
                                    "• Base Fee: ₦" + baseFee.toLocaleString() + "\n" +
                                    "• Mobility Surcharge: " + mobilityText + "\n\n" +
                                    "TOTAL ESTIMATE DUE: ₦70,000\n\n" +
                                    "BANK PAYMENT ROUTING:\n" +
                                    "• Bank: UBA Bank\n" +
                                    "• Account Name: UCAUTOTECH / UC AUTOMOBILE CARE\n\n" +
                                    "Verification: Transfer exact amount above for instant Green Light clearance!";

                        imageToSend = 'invoice_template.jpg';
                        logTransaction({ type: 'INVOICE', invoiceNo, spec: messageContent, client: senderJid });
                    } else {
                        replyText = masterServiceMenu;
                    }
                }

                if (imageToSend && fs.existsSync(imageToSend)) {
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
