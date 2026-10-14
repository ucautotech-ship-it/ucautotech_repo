const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const winston = require('winston');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "API_KEY_PLACEHOLDER" });
const ADMIN_JID = process.env.ADMIN_JID || "2348000000000@s.whatsapp.net";

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

// --- STRUCTURED DATA STORES ---
const LEDGER_FILE = 'wms_ledger.json';
const CUSTOMERS_FILE = 'customers.json';
const JOBS_FILE = 'jobs.json';

function loadJSON(filename) {
    try {
        if (fs.existsSync(filename)) {
            return JSON.parse(fs.readFileSync(filename, 'utf8'));
        }
    } catch (e) {}
    return [];
}

function saveJSON(filename, data) {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}

function logTransaction(entry) {
    let ledger = loadJSON(LEDGER_FILE);
    ledger.push({ timestamp: new Date().toISOString(), ...entry });
    saveJSON(LEDGER_FILE, ledger);
}

function updateCustomerProfile(jid, name, vehicleSpec) {
    let customers = loadJSON(CUSTOMERS_FILE);
    let customer = customers.find(c => c.jid === jid);
    if (!customer) {
        customer = { jid, name: name || "Valued Client", vehicles: [], createdAt: new Date().toISOString() };
        customers.push(customer);
    }
    if (vehicleSpec && !customer.vehicles.includes(vehicleSpec)) {
        customer.vehicles.push(vehicleSpec);
    }
    customer.lastSeen = new Date().toISOString();
    saveJSON(CUSTOMERS_FILE, customers);
}

function createJobCard(invoiceNo, jid, spec, totalEstimate, breakdown) {
    let jobs = loadJSON(JOBS_FILE);
    jobs.push({
        invoiceNo,
        clientJid: jid,
        specification: spec,
        totalEstimate,
        breakdown,
        status: 'Quotation Sent',
        createdAt: new Date().toISOString()
    });
    saveJSON(JOBS_FILE, jobs);
}

// --- MASTER SERVICE MENU (UPGRADED v3.45) ---
const MASTER_SERVICE_MENU = 
    "Good day from UCAUTOTECH,\n\n" +
    "==============================\n" +
    "       UCAUTOTECH / UC AUTOMOBILE CARE       \n" +
    "          VIP WORKSHOP SERVICES v3.45         \n" +
    "==============================\n\n" +
    "1. Full System Diagnosis (₦30,000 - ₦50,000)\n" +
    "2. ECM / PCM Programming & Flashing (₦70,000 - ₦350,000)\n" +
    "3. Smart Keys & Immobilizer Coding (₦70,000 - ₦250,000)\n" +
    "4. Advanced Module Calibration (₦70,000 - ₦200,000)\n" +
    "5. Servicing & Routine Maintenance (₦25,000 - ₦120,000)\n" +
    "6. Brake, ABS & ESP Systems (₦40,000 - ₦180,000)\n" +
    "7. Airbag / SRS Module Services (₦50,000 - ₦200,000)\n" +
    "8. ADAS & Driver Assistance Calibration (₦80,000 - ₦350,000)\n\n" +
    "Reply 1-8 for service info, type #location for workshop map pin, or send your vehicle specs (e.g. 2018 Lexus RX350, Lekki) for an instant verified invoice with round-trip mobility!";

const SERVICE_DETAILS = {
    '1': { name: "Full System Diagnosis", price: "₦30,000 - ₦50,000", baseNum: 40000 },
    '2': { name: "ECM / PCM Programming & Flashing", price: "₦70,000 - ₦350,000", baseNum: 150000 },
    '3': { name: "Smart Keys & Immobilizer Coding", price: "₦70,000 - ₦250,000", baseNum: 100000 },
    '4': { name: "Advanced Module Calibration", price: "₦70,000 - ₦200,000", baseNum: 90000 },
    '5': { name: "Servicing & Routine Maintenance", price: "₦25,000 - ₦120,000", baseNum: 45000 },
    '6': { name: "Brake, ABS & ESP Systems", price: "₦40,000 - ₦180,000", baseNum: 80000 },
    '7': { name: "Airbag / SRS Module Services", price: "₦50,000 - ₦200,000", baseNum: 95000 },
    '8': { name: "ADAS & Driver Assistance Calibration", price: "₦80,000 - ₦350,000", baseNum: 120000 }
};

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
                console.log("[UCAUTOTECH WMS v3.45] Master Enterprise Engine Online!");
                startAutonomousStatusEngine(sock);
                startDailyFinancialCron(sock);
            }
        });

        function startAutonomousStatusEngine(activeSock) {
            setInterval(async () => {
                try {
                    const statusCaption = "UCAUTOTECH / UC AUTOMOBILE CARE\nVIP WORKSHOP SERVICES v3.45\n\nFull System Diagnostics, ECM Programming, ABS/SRS, ADAS Calibration & On-Site Team Dispatch.\nMessage us for instant automated invoicing!";
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

        function startDailyFinancialCron(activeSock) {
            setInterval(async () => {
                try {
                    const ledger = loadJSON(LEDGER_FILE);
                    const jobs = loadJSON(JOBS_FILE);
                    const today = new Date().toDateString();
                    const todaysEntries = ledger.filter(item => new Date(item.timestamp).toDateString() === today);
                    
                    if (todaysEntries.length === 0) return;

                    const totalInvoices = todaysEntries.filter(i => i.type === 'INVOICE').length;
                    const summaryText = `UCAUTOTECH ADMIN - DAILY REVENUE & JOB REPORT\nDate: ${today}\n\n• Invoices Generated: ${totalInvoices}\n• Active Jobs: ${jobs.length}\n• Total Logged Events: ${todaysEntries.length}\n\nSystem operating at peak enterprise efficiency.`;
                    
                    await activeSock.sendMessage(ADMIN_JID, { text: summaryText });
                } catch (err) {
                    console.error("[DAILY CRON ERROR]:", err.message);
                }
            }, 24 * 60 * 60 * 1000);
        }

        sock.ev.on('call', async (calls) => {
            for (const call of calls) {
                if (call.status === 'offer') {
                    try { await sock.rejectCall(call.id, call.from); } catch (err) {}
                    await sock.sendMessage(call.from, {
                        text: "UCAUTOTECH / UC AUTOMOBILE CARE\n\nCalls are automatically routed to our digital advisory. Reply 1-8 for services or send your vehicle specifications."
                    });
                }
            }
        });

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;

            for (const m of messages) {
                if (m.key.fromMe || m.key.remoteJid === 'status@broadcast') continue;

                const senderJid = m.key.remoteJid;
                const pushName = m.pushName || "Valued Client";
                const msgObj = m.message;
                if (!msgObj) continue;

                updateCustomerProfile(senderJid, pushName);

                let messageContent = msgObj.conversation || 
                                       msgObj.extendedTextMessage?.text || 
                                       msgObj.imageMessage?.caption || '';

                let imageToSend = null;
                let replyText = "";

                if (msgObj.audioMessage) {
                    try {
                        const buffer = await downloadMediaMessage(m, 'buffer', {});
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
                    } catch (audioErr) {
                        replyText = "UCAUTOTECH / UC AUTOMOBILE CARE - ADVISORY\n\nWe received your voice note. Our master technicians will evaluate your vehicle's symptoms upon inspection.";
                    }

                    await sock.sendMessage(senderJid, { text: replyText });
                    continue;
                }

                const lowerContent = messageContent.toLowerCase();

                if (lowerContent.includes('#location') || lowerContent.includes('location') || lowerContent.includes('address')) {
                    replyText = "UCAUTOTECH / UC AUTOMOBILE CARE - WORKSHOP LOCATION\n\n" +
                                "Address: Lagos Metropolitan Area / On-Site Dispatch Across Nigeria\n" +
                                "Map Pin / Navigation: Contact our desk directly or reply with your area name for mobile equipment & team dispatch calculations.";
                }
                else if (lowerContent.includes('confirm') || lowerContent.includes('pay') || lowerContent.includes('send account')) {
                    const refTag = "#UC-" + Math.floor(100000 + Math.random() * 900000);
                    replyText = "UCAUTOTECH / UC AUTOMOBILE CARE - OFFICIAL WORKSHOP INVOICE\n\n" +
                                "BANK PAYMENT ROUTING:\n" +
                                "• Bank: UBA Bank\n" +
                                "• Account Name: UCAUTOTECH / UC AUTOMOBILE CARE\n" +
                                "• Reference Tag: " + refTag + "\n\n" +
                                "Verification: Transfer exact amount above for instant Green Light clearance.";
                    imageToSend = 'invoice_template.jpg';
                    logTransaction({ type: 'PAYMENT_REQUEST', ref: refTag, client: senderJid });
                }
                else if (/^[1-8]$/.test(messageContent.trim())) {
                    const choice = messageContent.trim();
                    const service = SERVICE_DETAILS[choice];

                    replyText = "UCAUTOTECH / UC AUTOMOBILE CARE\n" +
                                "VIP WORKSHOP SERVICES v3.45\n\n" +
                                "Selected Service: " + service.name + "\n" +
                                "Standard Rate: " + service.price + "\n\n" +
                                "Next Step: Reply with your vehicle Model, Year, and Location (e.g. 2017 Bentley Bentayga, Lekki) to generate your official electronic invoice!";
                }
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
                else {
                    const yearMatch = messageContent.match(/\b(20[0-2][0-9]|19[8-9][0-9])\b/);
                    
                    if (yearMatch) {
                        const vehicleYear = parseInt(yearMatch[1], 10);
                        const isLekki = lowerContent.includes('lekki') || lowerContent.includes('ikoyi') || lowerContent.includes('vi') || lowerContent.includes('victoria island');
                        const isMainland = lowerContent.includes('ikeja') || lowerContent.includes('surulere') || lowerContent.includes('gba') || lowerContent.includes('yaba');

                        let baseFee = vehicleYear >= 2016 ? 50000 : 40000;
                        
                        let oneWayKm = isLekki ? 23.6 : (isMainland ? 10.0 : 15.0);
                        let roundTripKm = oneWayKm * 2;
                        let ratePerKm = 750;
                        let transitDistanceFee = roundTripKm * ratePerKm;
                        
                        let luggageAllowance = 5000; 
                        let teamAllowance = 5000;    
                        
                        let mobilityFee = transitDistanceFee + luggageAllowance + teamAllowance;
                        let totalEstimate = baseFee + mobilityFee;
                        
                        let invoiceNo = "UC-" + Math.floor(100000 + Math.random() * 900000);
                        let currentDate = new Date().toLocaleDateString();

                        updateCustomerProfile(senderJid, pushName, messageContent);

                        replyText = "==============================\n" +
                                    "       UCAUTOTECH / UC AUTOMOBILE CARE       \n" +
                                    "          OFFICIAL WORKSHOP INVOICE         \n" +
                                    "==============================\n\n" +
                                    "Invoice No: #" + invoiceNo + "\n" +
                                    "Date: " + currentDate + "\n" +
                                    "Client: " + pushName + "\n\n" +
                                    "SPECIFICATION: " + messageContent + "\n\n" +
                                    "MOBILITY & DISPATCH BREAKDOWN:\n" +
                                    "• Distance: ~" + roundTripKm + " km Round-Trip (Going & Coming)\n" +
                                    "• Transit Fare Rate: ₦" + ratePerKm + "/km (₦" + transitDistanceFee.toLocaleString() + ")\n" +
                                    "• Diagnostic Tooling / Luggage Handling: ₦" + luggageAllowance.toLocaleString() + "\n" +
                                    "• On-Site Technician / Team Dispatch: ₦" + teamAllowance.toLocaleString() + "\n" +
                                    "• Total Mobility Surcharge: ₦" + mobilityFee.toLocaleString() + "\n\n" +
                                    "SERVICE COST:\n" +
                                    "• Base Inspection & System Diagnosis Fee: ₦" + baseFee.toLocaleString() + "\n\n" +
                                    "TOTAL ESTIMATE DUE: ₦" + totalEstimate.toLocaleString() + "\n\n" +
                                    "BANK PAYMENT ROUTING:\n" +
                                    "• Bank: UBA Bank\n" +
                                    "• Account Name: UCAUTOTECH / UC AUTOMOBILE CARE\n\n" +
                                    "Verification: Transfer exact amount above for instant Green Light clearance!";

                        imageToSend = 'invoice_template.jpg';
                        
                        const breakdown = { roundTripKm, ratePerKm, transitDistanceFee, luggageAllowance, teamAllowance, baseFee, mobilityFee };
                        logTransaction({ type: 'INVOICE', invoiceNo, spec: messageContent, total: totalEstimate, roundTripKm, mobilityFee, client: senderJid });
                        createJobCard(invoiceNo, senderJid, messageContent, totalEstimate, breakdown);
                    } else {
                        replyText = MASTER_SERVICE_MENU;
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
