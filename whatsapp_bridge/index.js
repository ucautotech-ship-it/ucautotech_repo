const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const axios = require('axios');

const TARGET_PHONE = "2348126185785";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
        console.log(`[BRIDGE] Connecting to WhatsApp servers...`);
        
        // Wait 6 seconds for socket open/handshake, then request code
        setTimeout(async () => {
            try {
                console.log(`[BRIDGE] Requesting pairing code for ${TARGET_PHONE}...`);
                const code = await sock.requestPairingCode(TARGET_PHONE);
                console.log(`\n========================================`);
                console.log(` YOUR WHATSAPP PAIRING CODE: ${code}`);
                console.log(`========================================\n`);
            } catch (err) {
                console.error('[BRIDGE ERROR] Failed to request pairing code:', err.message);
            }
        }, 6000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[BRIDGE] Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('\n[UCAUTOTECH GATEWAY] WhatsApp Bridge Connected Successfully!\n');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;

            const sender = msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

            if (!text) continue;

            console.log(`[INCOMING MESSAGE] From: ${sender} | Text: ${text}`);

            try {
                const response = await axios.post('http://127.0.0.1:5000/webhook', {
                    sender: sender,
                    message: text
                });

                if (response.data && response.data.response) {
                    await sock.sendMessage(sender, { text: response.data.response });
                    console.log(`[OUTGOING REPLY] Sent AI report back to ${sender}`);
                }
            } catch (err) {
                console.error('[BRIDGE ERROR] Failed to consult AI DTC Engine:', err.message);
            }
        }
    });
}

startBot();
