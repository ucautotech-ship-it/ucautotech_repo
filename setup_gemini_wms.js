const fs = require('fs');

const indexCode = `const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { GoogleGenAI } = require('@google/genai');
const knowledgeEngine = require('./knowledge_engine');

const ADMIN_JID = '2348126185785@s.whatsapp.net';

// Initialize Gemini API Client (uses GEMINI_API_KEY environment variable)
const ai = new GoogleGenAI({});

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('====================================');
            console.log('[UCAUTOTECH GATEWAY] Advanced AI & VIP WMS v17.0 Live!');
            console.log('====================================');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;
            
            const remoteJid = msg.key.remoteJid;
            const pushName = msg.pushName || 'Valued Client';
            const body = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
            const lowerBody = body.toLowerCase();

            console.log(\`[INCOMING MESSAGE] From: \${pushName} (\${remoteJid}) | Text: \${body}\`);

            const hour = new Date().getHours();
            const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
            const clientTitle = \`Mr. \${pushName}\`;

            // Explicit Admin Call / Human Escalation Trigger
            if (lowerBody.includes('human') || lowerBody.includes('agent') || lowerBody.includes('speak') || lowerBody.includes('owner') || lowerBody.includes('ceo') || lowerBody.includes('call')) {
                await sock.sendMessage(remoteJid, { text: \`🔔 *Calling UCAUTOTECH Leadership...*\\n\\nMr. \${pushName}, Founder & CEO Uchenna Elem has been alerted on WhatsApp and will assist you directly shortly.\` });
                await sock.sendMessage(ADMIN_JID, { text: \`🚨 *UCAUTOTECH ESCALATION NOTICE*\\nClient: Mr. \${pushName} (\${remoteJid}) requested direct assistance!\\nMessage: "\${body}"\` });
                return;
            }

            // Engine Replacement High-Value Alert Trigger
            if (lowerBody === '6' || lowerBody.includes('engine replacement')) {
                await sock.sendMessage(ADMIN_JID, { text: \`🚨 *UCAUTOTECH HIGH-VALUE ALERT: ENGINE REPLACEMENT*\\nClient: Mr. \${pushName} (\${remoteJid}) in inquiry stage for Engine Replacement.\` });
            }

            // System Prompt instructing Gemini AI how to behave like an expert workshop advisor
            const systemInstruction = \`
You are the AI Workshop Advisor for UCAUTOTECH (UC Automobile Care), founded by CEO Uchenna Elem.
You converse directly with automotive clients on WhatsApp in a clear, professional, warm, and highly structured manner.

RULES FOR RESPONDING:
1. Always address male clients strictly as "Mr. [Name]" (e.g., "Good \${timeOfDay} \${clientTitle}"). Never use "Mrs." or generic "Dear Customer".
2. Never repeat the full menu if the client is already providing vehicle details, location, or asking a specific question.
3. Keep the conversation entirely on WhatsApp. Do not redirect clients to external websites or links.
4. Calculate and apply location rules:
   - Lagos locations (e.g., Lekki, Ikeja, Ajah, VI, Ikoyi, Surulere) -> Add +20% labor surcharge.
   - Interstate / Outside Lagos (e.g., Abuja, Port Harcourt, Ibadan) -> Add +70% labor surcharge + upfront mobility and lodging.
5. Provide UBA Bank details for payment, and instruct clients to post their transaction receipt for Green Light (🟢) verification status.
6. Numbered Service Reference:
   - Option 1: Full System Diagnosis (Pre-2018: ₦30,000 | 2018+: ₦50,000)
   - Option 2: ECM/PCM Programming & Flashing (Pre-2016: ₦70,000 | 2016+: ₦150,000 - ₦350,000)
   - Option 3: Smart Keys & Immobilizer Coding (Pre-2015: ₦70,000 | 2015+: ₦150,000 - ₦250,000)
   - Option 4: Module Calibration (Gearbox, Air Suspension, ABS, Power Doors, etc.) (₦70,000 - ₦200,000)
   - Option 5: Servicing & Oil Change (₦20,000 - ₦50,000)
   - Option 6: Engine Replacement (4-Cyl: ₦100k-₦200k | 6-Cyl: ₦150k-₦300k | 8-Cyl: ₦300k-₦450k)
   - Option 7: Pre-Purchase Inspection (Pre-2015: ₦150,000 | 2015+: ₦200,000+)
   - Option 8: Advanced DTC Lookup & Maintenance Subscription (₦5,000 / month)

Current Client Query: "\${body}"
Client Name: \${clientTitle}
Time of Day: \${timeOfDay}
\`;

            try {
                // Call Gemini 2.5 Flash model for instant AI response
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: systemInstruction
                });

                const replyText = response.text;
                await sock.sendMessage(remoteJid, { text: replyText });
            } catch (err) {
                console.error('Gemini API Error:', err);
                // Fallback structured menu if API key is not active
                const fallbackMenu = knowledgeEngine.getServiceMenu(clientTitle, timeOfDay);
                await sock.sendMessage(remoteJid, { text: fallbackMenu });
            }
        }
    });
}

startBot();`;

fs.writeFileSync('index.js', indexCode.trim(), 'utf8');
console.log('✅ 1. index.js updated with Gemini AI Engine!');
