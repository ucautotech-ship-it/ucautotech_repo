const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');

const MASTER_PHONE = "2348126185785";
const UBA_ACCOUNT = "🏦 Bank: UBA | Account: UCAUTOTECH / UC AUTOMOBILE CARE";

async function startFastBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_fast');
    const sock = makeWASocket({ auth: state, printQRInTerminal: true, browser: ["UCAUTOTECH", "Chrome", "10.0"] });
    
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('\n🚀 [UCAUTOTECH LIGHTNING ENGINE] Connected and running at maximum speed!\n');
        } else if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startFastBot();
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message) continue;
            const senderJid = msg.key.remoteJid;
            const isFromMaster = msg.key.fromMe || senderJid.includes(MASTER_PHONE);

            // Master Approval Handler
            if (isFromMaster) {
                const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
                if (text.toUpperCase().startsWith("APPROVE")) {
                    const target = text.split(" ")[1]?.replace(/[^0-9]/g, '');
                    if (target) {
                        await sock.sendMessage(`${target}@s.whatsapp.net`, { 
                            text: "🟢 *UCAUTOTECH GREEN LIGHT GRANTED!* Payment verified by Master CEO. Service unlocked!" 
                        });
                        console.log(`[INSTANT APPROVAL] Sent to ${target}`);
                    }
                }
                continue;
            }

            if (!senderJid.endsWith('@s.whatsapp.net')) continue;
            
            // Instant Response Menu
            const incoming = (msg.message.conversation || msg.message.extendedTextMessage?.text || "").trim();
            if (!incoming) continue;

            console.log(`[MSG] Received: ${incoming}`);

            const replyText = 
                `🚗 *UCAUTOTECH AUTOMATED SERVICE MENU* 🚗\n\n` +
                `Welcome! Here are our official rates:\n` +
                `1️⃣ Diagnostic Scan: ₦30,000+\n` +
                `2️⃣ House Diagnosis: ₦50,000+ (+₦10k Mobility in Lagos)\n` +
                `3️⃣ Engine Rebuild Labor: ₦170,000+\n` +
                `4️⃣ Key & ECM Programming: ₦50,000+\n` +
                `5️⃣ Air Suspension Service: ₦200,000+\n` +
                `6️⃣ Oil Change: ₦15,000\n` +
                `7️⃣ General Electrical: ₦150,000+\n` +
                `8️⃣ Spare Parts Procurement (Ladipo, Alibaba, Amazon)\n\n` +
                `👑 VIP Subscription: ₦5,000/month\n\n` +
                `💳 *Payment:* Make all transfers strictly to our UBA Account:\n${UBA_ACCOUNT}\n\n` +
                `📌 Reply with a number (1-8) or drop your vehicle issue for instant AI assistance!`;

            await sock.sendMessage(senderJid, { text: replyText });
        }
    });
}

startFastBot();
