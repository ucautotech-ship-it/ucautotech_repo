const fs = require('fs');

const indexCode = `const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { exec } = require('child_process');
const knowledgeEngine = require('./knowledge_engine');

const ADMIN_JID = '2348126185785@s.whatsapp.net';

// Active Session Storage & Pending Payments Matrix
const clientSessions = {};
const pendingPayments = {};

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
            console.log('[UCAUTOTECH GATEWAY] Advanced AI & VIP WMS v3.8 Live!');
            console.log('====================================');
            
            // Start v3.8 Background Android Native SMS/Bank Alert Monitor
            startSMSNotificationListener(sock);
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

            console.log(\`[INCOMING v3.8 MESSAGE] From: \${pushName} (\${remoteJid}) | Text: \${body}\`);

            const hour = new Date().getHours();
            const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
            const clientTitle = \`Mr. \${pushName}\`;

            // MAIN MENU COMMANDS
            if (lowerBody === '#menu' || lowerBody === 'price' || lowerBody === 'services' || lowerBody === 'hello' || lowerBody === 'hi') {
                delete clientSessions[remoteJid];
                const menuText = knowledgeEngine.getServiceMenu(clientTitle, timeOfDay);
                await sock.sendMessage(remoteJid, { text: menuText });
                return;
            }

            // OPTION SELECTIONS (1-8)
            if (['1','2','3','4','5','6','7','8'].includes(lowerBody)) {
                clientSessions[remoteJid] = { option: lowerBody };

                if (lowerBody === '1') {
                    pendingPayments[30000] = remoteJid;
                    pendingPayments[50000] = remoteJid;
                    await sock.sendMessage(remoteJid, { text: \`Good \${timeOfDay} \${clientTitle}.\\n\\n📌 *Option 1 Selected: Full System Diagnosis*\\n\\n• Pre-2018 Vehicles: ₦30,000\\n• 2018+ Vehicles: ₦50,000\\n\\nTo complete your booking, please reply with your *Vehicle Make, Model, Year, and Location* directly here in WhatsApp (e.g., GLE43 2022 Lekki).\` });
                    return;
                } else if (lowerBody === '2') {
                    pendingPayments[70000] = remoteJid;
                    pendingPayments[150000] = remoteJid;
                    await sock.sendMessage(remoteJid, { text: \`Good \${timeOfDay} \${clientTitle}.\\n\\n📌 *Option 2 Selected: ECM / PCM Programming & Flashing*\\n\\n• Pre-2016: ₦70,000\\n• 2016+: ₦150,000 - ₦350,000\\n\\nPlease reply with your Vehicle Model, Year, VIN, or ECU part number to proceed.\` });
                    return;
                } else if (lowerBody === '3') {
                    pendingPayments[70000] = remoteJid;
                    pendingPayments[150000] = remoteJid;
                    await sock.sendMessage(remoteJid, { text: \`Good \${timeOfDay} \${clientTitle}.\\n\\n📌 *Option 3 Selected: Smart Keys & Immobilizer Coding*\\n\\n• Pre-2015: ₦70,000\\n• 2015+: ₦150,000 - ₦250,000\\n\\nPlease reply with your vehicle model, year, and location.\` });
                    return;
                } else if (lowerBody === '4') {
                    await sock.sendMessage(remoteJid, { text: \`Good \${timeOfDay} \${clientTitle}.\\n\\n📌 *Option 4 Selected: Advanced Module Calibration*\\n\\n• Rate: ₦70,000 - ₦200,000\\n\\nReply with the module requiring calibration (Gearbox relearn, Electric steering, ABS, Air suspension).\` });
                    return;
                } else if (lowerBody === '5') {
                    await sock.sendMessage(remoteJid, { text: \`Good \${timeOfDay} \${clientTitle}.\\n\\n📌 *Option 5 Selected: Servicing & Routine Maintenance*\\n\\n• Rate: ₦20,000 - ₦50,000\\n\\nReply with your vehicle model and current location to schedule servicing.\` });
                    return;
                } else if (lowerBody === '6') {
                    await sock.sendMessage(remoteJid, { text: \`Good \${timeOfDay} \${clientTitle}.\\n\\n📌 *Option 6 Selected: Engine Replacement*\\n\\n• 4-Cylinder: ₦100k - ₦200k\\n• 6-Cylinder: ₦150k - ₦300k\\n• 8-Cylinder: ₦300k - ₦450k\\n\\nPlease send vehicle details. CEO Uchenna Elem is being alerted to assist you directly on WhatsApp.\` });
                    await sock.sendMessage(ADMIN_JID, { text: \`🚨 *UCAUTOTECH v3.8 HIGH-VALUE ALERT: ENGINE REPLACEMENT*\\nClient: \${clientTitle} (\${remoteJid})\` });
                    return;
                } else if (lowerBody === '7') {
                    await sock.sendMessage(remoteJid, { text: \`Good \${timeOfDay} \${clientTitle}.\\n\\n📌 *Option 7 Selected: Pre-Purchase Vehicle Inspection*\\n\\n• Pre-2015: ₦150,000\\n• 2015+: ₦200,000+\\n\\nPlease reply with the physical inspection address.\` });
                    return;
                } else if (lowerBody === '8') {
                    pendingPayments[5000] = remoteJid;
                    await sock.sendMessage(remoteJid, { text: \`Good \${timeOfDay} \${clientTitle}.\\n\\n📌 *Option 8 Selected: DTC Lookup & Maintenance Subscription*\\n\\n• Monthly Fee: ₦5,000\\n\\nPayment Details: UBA Bank | Account: UCAUTOTECH\\nUpload your payment receipt screenshot directly here for Green Light (🟢) verification status.\` });
                    return;
                }
            }

            // HUMAN ASSIST / ESCALATION TRIGGER
            if (lowerBody.includes('human') || lowerBody.includes('agent') || lowerBody.includes('speak') || lowerBody.includes('owner') || lowerBody.includes('ceo') || lowerBody.includes('call')) {
                await sock.sendMessage(remoteJid, { text: \`🔔 *Calling UCAUTOTECH Workshop Leadership...*\\n\\n\${clientTitle}, Founder & CEO Uchenna Elem has been notified directly on WhatsApp and will assist you shortly.\` });
                await sock.sendMessage(ADMIN_JID, { text: \`🚨 *UCAUTOTECH v3.8 ESCALATION NOTICE*\\nClient \${clientTitle} (\${remoteJid}) requested human assistance!\\nMessage: "\${body}"\` });
                return;
            }

            // CEO MANUAL CLEARANCE OVERRIDE COMMAND (#verify)
            if ((remoteJid === ADMIN_JID || remoteJid.includes('2348126185785')) && lowerBody.startsWith('#verify')) {
                const parts = body.split(' ');
                const targetJid = parts[1] || remoteJid;
                await issueGreenLight(sock, targetJid, 'CEO Direct Command Verification');
                return;
            }

            // CONVERSATIONAL VEHICLE / LOCATION DETAILS PROCESSING
            const isLagos = lowerBody.includes('lekki') || lowerBody.includes('ikeja') || lowerBody.includes('lagos') || lowerBody.includes('vi') || lowerBody.includes('victoria island') || lowerBody.includes('ajah') || lowerBody.includes('ikoyi') || lowerBody.includes('yaba') || lowerBody.includes('surulere');
            const isOutsideLagos = lowerBody.includes('abuja') || lowerBody.includes('port harcourt') || lowerBody.includes('ph') || lowerBody.includes('ibadan') || lowerBody.includes('enugu') || lowerBody.includes('asaba') || lowerBody.includes('ogun');

            let locationNote = "Lagos On-Site (+20% labor surcharge applicable)";
            if (isOutsideLagos) {
                locationNote = "Interstate On-Site (+70% labor surcharge + upfront mobility & lodging required)";
            }

            const activeSession = clientSessions[remoteJid];
            const selectedOpt = activeSession ? activeSession.option : 'Service';

            // Send Clean, Structured v3.8 Response to Client
            const responseMsg = \`Good \${timeOfDay} \${clientTitle},\\n\\n\` +
               \`✅ *UCAUTOTECH WORKSHOP BOOKING CONFIRMATION (v3.8 Engine)*\\n\\n\` +
               \`🚗 *Vehicle & Details:* \${body}\\n\` +
               \`📍 *Location Assessment:* \${locationNote}\\n\\n\` +
               \`💳 *Payment Details:*\` +
               \`\\n• Bank: *UBA Bank*\` +
               \`\\n• Account Name: *UCAUTOTECH / UC AUTOMOBILE CARE*\\n\\n\` +
               \`👉 Please complete the transfer to UBA Bank and post your payment receipt directly here in WhatsApp for *Green Light (🟢) Verification Status* and technician assignment!\\n\\n\` +
               \`_Type #menu at any time to view the main service list._\`;

            await sock.sendMessage(remoteJid, { text: responseMsg });

            // Notify CEO Uchenna Elem
            const adminAlertMsg = \`🟢 *NEW UCAUTOTECH WORKSHOP BOOKING (v3.8)!*\\n\\n\` +
               \`👤 *Client:* \${clientTitle}\\n\` +
               \`📱 *WhatsApp ID:* \${remoteJid}\\n\` +
               \`⚙️ *Selected Service:* Option \${selectedOpt}\\n\` +
               \`📝 *Client Details:* "\${body}"\\n\` +
               \`📍 *Location Surcharge:* \${locationNote}\`;

            await sock.sendMessage(ADMIN_JID, { text: adminAlertMsg });
        }
    });
}

// Android SMS & Truecaller Notification Reader
function startSMSNotificationListener(sock) {
    setInterval(() => {
        exec('termux-sms-list -l 5', (err, stdout, stderr) => {
            if (err || !stdout) return;
            try {
                const messages = JSON.parse(stdout);
                for (const sms of messages) {
                    const text = (sms.body || '').toLowerCase();
                    if (text.includes('uba') || text.includes('credit') || text.includes('cr:') || text.includes('truecaller')) {
                        const amountMatch = text.match(/(?:ngn|n|cr)?\s*([0-9,]+(?:\.[0-9]{2})?)/i);
                        if (amountMatch) {
                            const rawAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
                            const targetJid = pendingPayments[rawAmount];
                            if (targetJid) {
                                issueGreenLight(sock, targetJid, \`Automated UBA Credit Alert (\${sms.body})\`);
                                delete pendingPayments[rawAmount];
                            }
                        }
                    }
                }
            } catch (e) {}
        });
    }, 5000);
}

// Issue Green Light Clearance
async function issueGreenLight(sock, clientJid, source) {
    const greenLightTicket = \`🟢 *UCAUTOTECH v3.8 OFFICIAL PAYMENT CLEARANCE*\\n\\n\` +
        \`Status: *VERIFIED & APPROVED (GREEN LIGHT 🟢)*\\n\` +
        \`Verification Engine: *UBA Automated Real-Time Gateway (v3.8)*\\n\` +
        \`Details: *Payment received & confirmed*\\n\\n\` +
        \`Your booking is active! A senior diagnostic technician has been assigned to your vehicle location.\\n\` +
        \`Thank you for choosing UC Automobile Care.\`;

    await sock.sendMessage(clientJid, { text: greenLightTicket });
    await sock.sendMessage(ADMIN_JID, { text: \`✅ *AUTOMATED GREEN LIGHT ISSUED (v3.8)!*\\nClient: \${clientJid}\\nSource: \${source}\` });
}

startBot();
