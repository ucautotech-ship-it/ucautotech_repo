const fs = require('fs');

// 1. Write Numbered Knowledge Engine
const keCode = `const knowledgeEngine = {
    adminPhone: "2348126185785@s.whatsapp.net",
    bankDetails: "UBA Bank | Account: UCAUTOTECH | Green Light (🟢) Verification",

    getServiceMenu: (clientName, timeOfDay) => {
        return \`Good \${timeOfDay} \${clientName}, welcome to UCAUTOTECH. Please select a service by typing any number (1-8):\\n\\n\` +
               \`1️⃣ Full System Diagnosis\\n\` +
               \`   • Pre-2018 Vehicles: ₦30,000\\n\` +
               \`   • 2018+ Vehicles: ₦50,000\\n\\n\` +
               \`2️⃣ ECM / PCM Programming & Flashing\\n\` +
               \`   • Pre-2016 Vehicles: ₦70,000\\n\` +
               \`   • 2016+ Vehicles: ₦150,000 - ₦350,000\\n\\n\` +
               \`3️⃣ Smart Keys & Immobilizer Coding\\n\` +
               \`   • Pre-2015 Vehicles: ₦70,000\\n\` +
               \`   • 2015+ Vehicles: ₦150,000 - ₦250,000\\n\\n\` +
               \`4️⃣ Advanced Module Calibration\\n\` +
               \`   • Gearbox relearn, electric steering, air suspension, ABS, electric water/oil pump, panoramic roof, etc.\\n\` +
               \`   • Pricing: ₦70,000 - ₦200,000\\n\\n\` +
               \`5️⃣ Servicing & Routine Maintenance\\n\` +
               \`   • Oil change & general service\\n\` +
               \`   • Pricing: ₦20,000 - ₦50,000\\n\\n\` +
               \`6️⃣ Engine Replacement\\n\` +
               \`   • 4-Cylinder: ₦100,000 - ₦200,000\\n\` +
               \`   • 6-Cylinder: ₦150,000 - ₦300,000\\n\` +
               \`   • 8-Cylinder: ₦300,000 - ₦450,000\\n\\n\` +
               \`7️⃣ Pre-Purchase Vehicle Inspection / Verification\\n\` +
               \`   • 2015 Downward: ₦150,000\\n\` +
               \`   • 2015 Upward: ₦200,000+\\n\\n\` +
               \`8️⃣ Advanced DTC Lookup & Maintenance Subscription\\n\` +
               \`   • Mandatory DTC access: ₦5,000 / month\\n\\n\` +
               \`📍 *Additional Policies & Surcharges:*\\n\` +
               \`• Lagos On-Site Work: +20% labor surcharge\\n\` +
               \`• Outside Lagos Work: +70% labor surcharge + upfront mobility & lodging\\n\` +
               \`• General Repairs (Engine rebuilds, suspension): Negotiable directly here.\\n\` +
               \`• Payments go to UBA Bank with Green Light (🟢) verification status.\\n\\n\` +
               \`👉 *Type a number (1-8) to select a service or type your query directly in WhatsApp!*\`;
    }
};

module.exports = knowledgeEngine;`;

fs.writeFileSync('knowledge_engine.js', keCode.trim(), 'utf8');
console.log('✅ 1. Updated knowledge_engine.js with numbered menu.');

// 2. Write Main Application Router with Option Selectors & Admin Escalation
const idxCode = `const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const knowledgeEngine = require('./knowledge_engine');

const ADMIN_JID = '2348126185785@s.whatsapp.net';

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
            const clientTitle = pushName ? \`Mr./Mrs. \${pushName}\` : 'Mr. James / Mrs. Mary';

            // INTERACTIVE OPTION SELECTION (1-8)
            if (lowerBody === '1') {
                await sock.sendMessage(remoteJid, { text: \`📌 *Option 1 Selected: Full System Diagnosis*\\n\\n• Pre-2018 Vehicle: ₦30,000\\n• 2018+ Vehicle: ₦50,000\\n\\nTo proceed with booking, please reply with your Vehicle Make, Model, Year, and Location directly here in WhatsApp.\` });
                return;
            } else if (lowerBody === '2') {
                await sock.sendMessage(remoteJid, { text: \`📌 *Option 2 Selected: ECM / PCM Programming & Flashing*\\n\\n• Pre-2016: ₦70,000\\n• 2016+: ₦150,000 - ₦350,000\\n\\nPlease reply here with your ECU part number or VIN to proceed.\` });
                return;
            } else if (lowerBody === '3') {
                await sock.sendMessage(remoteJid, { text: \`📌 *Option 3 Selected: Smart Keys & Immobilizer Coding*\\n\\n• Pre-2015: ₦70,000\\n• 2015+: ₦150,000 - ₦250,000\\n\\nPlease reply here with your vehicle model and whether you have an existing key or all keys lost.\` });
                return;
            } else if (lowerBody === '4') {
                await sock.sendMessage(remoteJid, { text: \`📌 *Option 4 Selected: Advanced Module Calibration*\\n\\n• Pricing: ₦70,000 - ₦200,000\\n\\nSpecify which module requires calibration (Gearbox relearn, Air suspension, ABS, Electric steering).\` });
                return;
            } else if (lowerBody === '5') {
                await sock.sendMessage(remoteJid, { text: \`📌 *Option 5 Selected: Servicing & Routine Maintenance*\\n\\n• Pricing: ₦20,000 - ₦50,000\\n\\nReply here with your vehicle oil specifications or engine type to schedule servicing.\` });
                return;
            } else if (lowerBody === '6') {
                await sock.sendMessage(remoteJid, { text: \`📌 *Option 6 Selected: Engine Replacement*\\n\\n• 4-Cylinder: ₦100,000 - ₦200,000\\n• 6-Cylinder: ₦150,000 - ₦300,000\\n• 8-Cylinder: ₦300,000 - ₦450,000\\n\\nNotifying CEO Uchenna Elem to assist you directly...\` });
                
                // CALL ADMIN ATTENTION
                await sock.sendMessage(ADMIN_JID, { text: \`🚨 *UCAUTOTECH ALERT: ENGINE REPLACEMENT REQUEST*\\nClient: \${pushName} (\${remoteJid})\\nSelected Option 6 (Engine Replacement). Please contact client directly.\` });
                return;
            } else if (lowerBody === '7') {
                await sock.sendMessage(remoteJid, { text: \`📌 *Option 7 Selected: Pre-Purchase Vehicle Inspection*\\n\\n• 2015 Downward: ₦150,000\\n• 2015 Upward: ₦200,000+\\n\\nPlease send the physical location address for the inspection.\` });
                return;
            } else if (lowerBody === '8') {
                await sock.sendMessage(remoteJid, { text: \`📌 *Option 8 Selected: DTC Lookup & Maintenance Subscription*\\n\\n• Monthly Fee: ₦5,000\\n\\nPayment Details: UBA Bank\\nSend receipt screenshot directly here for Green Light (🟢) verification.\` });
                return;
            } else if (lowerBody.includes('human') || lowerBody.includes('agent') || lowerBody.includes('speak') || lowerBody.includes('owner') || lowerBody.includes('ceo') || lowerBody.includes('call')) {
                await sock.sendMessage(remoteJid, { text: \`🔔 *Calling UCAUTOTECH Workshop Leadership...*\\n\\nFounder & CEO Uchenna Elem has been alerted on WhatsApp and will join this thread shortly.\` });
                
                // CALL ADMIN ATTENTION
                await sock.sendMessage(ADMIN_JID, { text: \`🚨 *UCAUTOTECH ESCALATION NOTICE*\\nClient \${pushName} (\${remoteJid}) requested human assistance!\\nMessage: "\${body}"\` });
                return;
            }

            // DEFAULT: Render Interactive Numbered Menu
            const menuText = knowledgeEngine.getServiceMenu(clientTitle, timeOfDay);
            await sock.sendMessage(remoteJid, { text: menuText });
        }
    });
}

startBot();`;

fs.writeFileSync('index.js', idxCode.trim(), 'utf8');
console.log('✅ 2. Updated index.js with option responses and admin escalation.');
