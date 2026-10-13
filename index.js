const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
const fs = require('fs');
const truecaller = require('truecallerjs');

const MASTER_PHONE = "2348126185785";
const UBA_ACCOUNT = "🏦 Bank: United Bank for Africa (UBA)\n🏷️ Account Name: UCAUTOTECH / UC AUTOMOBILE CARE";
const WIX_WEBSITE_URL = "https://www.ucautotech.com";

const DB_FILE = './ucautotech_master_db.json';
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ clients: {}, pending_payments: {}, approved_bookings: {}, vip_subscribers: { "2348126185785": "2029-12-31" } }));
}

function getDB() { return JSON.parse(fs.readFileSync(DB_FILE)); }
function saveDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }

async function resolveClientName(phoneNumber) {
    try {
        const searchData = await truecaller.search({ number: phoneNumber, countryCode: "NG" });
        const name = searchData.getName();
        const gender = searchData.getGender() || "M";
        let prefix = (gender.toLowerCase().includes("f") || name.toLowerCase().includes("mrs") || name.toLowerCase().includes("miss")) ? "Mrs." : "Mr.";
        return `${prefix} ${name ? name.split(" ")[0] : "Client"}`;
    } catch (e) {
        return "Mr./Mrs. Client";
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({ auth: state, printQRInTerminal: false, browser: ["Ubuntu", "Chrome", "20.0.04"] });
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        if (update.connection === 'open') {
            console.log('\n[UCAUTOTECH GATEWAY] System Live with SMS Transaction Monitoring & Truecaller Integration!\n');
        }
        if (update.connection === 'close') {
            if (update.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot();
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message) continue;
            const senderJid = msg.key.remoteJid;
            const isFromMaster = msg.key.fromMe || senderJid.includes(MASTER_PHONE);
            const db = getDB();

            // 1. MASTER SMS / BANK ALERT / APPROVAL PARSING
            if (isFromMaster && (msg.message.conversation || msg.message.extendedTextMessage?.text)) {
                const masterText = (msg.message.conversation || msg.message.extendedTextMessage?.text).trim();
                const upperMasterText = masterText.toUpperCase();

                // If Master pastes a bank alert SMS or uses APPROVE command
                if (upperMasterText.startsWith("APPROVE") || upperMasterText.includes("CR") || upperMasterText.includes("UBA") || upperMasterText.includes("ALERT")) {
                    // Extract phone or amount to match pending payments
                    for (const clientPhone in db.pending_payments) {
                        const booking = db.pending_payments[clientPhone];
                        
                        // Auto-match if Master pastes alert or explicitly approves phone
                        if (upperMasterText.includes(clientPhone) || upperMasterText.startsWith("APPROVE")) {
                            db.approved_bookings[clientPhone] = { ...booking, approved_at: new Date().toISOString() };
                            delete db.pending_payments[clientPhone];
                            
                            if (booking.type === 'VIP') {
                                db.vip_subscribers[clientPhone] = "ACTIVE";
                            }
                            saveDB(db);

                            const greenLightMsg = 
                                `🟢 *UCAUTOTECH BOOKING APPROVED & VERIFIED!* 🟢\n\n` +
                                `Bank SMS alert / transfer script verified by Master CEO.\n` +
                                `📌 *Status:* GREEN LIGHT GRANTED\n` +
                                `🛠️ Your service booking / VIP access is now officially active!`;

                            await sock.sendMessage(`${clientPhone}@s.whatsapp.net`, { text: greenLightMsg });
                            console.log(`[SMS VERIFICATION & APPROVAL] Green light issued for ${clientPhone} via bank alert match.`);
                            break;
                        }
                    }
                }
                continue;
            }

            if (msg.key.fromMe || !senderJid.endsWith('@s.whatsapp.net')) continue;
            const cleanPhone = senderJid.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');

            let clientProfile = db.clients[cleanPhone];
            if (!clientProfile || !clientProfile.name) {
                const resolvedName = await resolveClientName(cleanPhone);
                clientProfile = { name: resolvedName, last_discussion: "" };
                db.clients[cleanPhone] = clientProfile;
                saveDB(db);
            }

            const clientTitle = clientProfile.name;
            const isVIP = db.vip_subscribers[cleanPhone] ? true : false;

            // 2. PAYMENT RECEIPT / SCRIPT UPLOAD (STAGE 1)
            if (msg.message.imageMessage || msg.message.documentMessage) {
                db.pending_payments[cleanPhone] = {
                    type: "SERVICE_OR_VIP",
                    timestamp: new Date().toISOString()
                };
                saveDB(db);

                const receiptAck = 
                    `📩 *UCAUTOTECH PAYMENT RECEIPT LOGGED*\n\n` +
                    `Thank you ${clientTitle}. Your transfer script/receipt has been logged.\n\n` +
                    `⏳ *Status:* PENDING BANK SMS ALERT VERIFICATION\n` +
                    `Your official green light will be issued instantly once Master CEO's bank SMS alert is matched.`;

                await sock.sendMessage(senderJid, { text: receiptAck });
                console.log(`[ALERT] Receipt uploaded by ${clientTitle} (${cleanPhone}). Awaiting bank SMS alert parse.`);
                continue;
            }

            let incomingText = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
            if (!incomingText) continue;

            const upperText = incomingText.toUpperCase();

            // 3. MENU & SERVICES
            if (['HI', 'MENU', 'HELLO', 'START'].includes(upperText)) {
                const welcomeMsg = 
                    `Good day ${clientTitle}, welcome to UCAUTOTECH! We are here to make your vehicle move safe and sound. 🚗💨\n\n` +
                    `Here is our official service menu & rates:\n\n` +
                    `1️⃣ *Diagnostic Scanning:* ₦30,000 upwards.\n` +
                    `2️⃣ *Urgent House Diagnosis:* ₦50,000 upwards (+ Mobility ₦10k+).\n` +
                    `3️⃣ *Interstate Service:* Requires 100% Mobility & Lodging upfront.\n` +
                    `4️⃣ *Engine Rebuild Labor:* ₦170,000 upwards.\n` +
                    `5️⃣ *Key & ECM Programming:* ₦50,000 upwards.\n` +
                    `6️⃣ *Suspension Service:* ₦200,000 upwards.\n` +
                    `7️⃣ *Oil Change Service:* ₦15,000.\n` +
                    `8️⃣ *Spare Part Procurement:* Real-Time Price Analysis (Ladipo, Aspanda, Onitsha, Alibaba, eBay, Amazon).\n\n` +
                    `----------------------------------------\n` +
                    `👑 *VIP Subscription:* ₦5,000/month (Unlocks DTC breakdowns).\n\n` +
                    `💳 *PAYMENT DIRECTIVE:* All payments route strictly to our UBA Account:\n${UBA_ACCOUNT}\n\n` +
                    `👉 Reply with a service number (*1* to *8*) or ask your vehicle question directly!`;

                await sock.sendMessage(senderJid, { text: welcomeMsg });
                continue;
            }

            // Save Memory
            clientProfile.last_discussion = incomingText;
            db.clients[cleanPhone] = clientProfile;
            saveDB(db);

            // Forward to Flask Backend
            try {
                const response = await axios.post('http://127.0.0.1:5000/webhook', {
                    sender: cleanPhone, client_name: clientTitle, message: incomingText, last_discussion: clientProfile.last_discussion, is_vip: isVIP
                });
                if (response.data && response.data.response) {
                    await sock.sendMessage(senderJid, { text: response.data.response });
                }
            } catch (err) { console.error('[FLASK ERROR]', err.message); }
        }
    });
}

startBot();
