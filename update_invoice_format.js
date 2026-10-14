const fs = require('fs');

let indexCode = fs.readFileSync('index.js', 'utf8');

// The professional invoice generation template
const invoiceLogic = `
            const isLagos = lowerBody.includes('lekki') || lowerBody.includes('ikeja') || lowerBody.includes('lagos') || lowerBody.includes('vi') || lowerBody.includes('victoria island') || lowerBody.includes('ajah') || lowerBody.includes('ikoyi') || lowerBody.includes('yaba') || lowerBody.includes('surulere');
            const isOutsideLagos = lowerBody.includes('abuja') || lowerBody.includes('port harcourt') || lowerBody.includes('ph') || lowerBody.includes('ibadan') || lowerBody.includes('enugu') || lowerBody.includes('asaba') || lowerBody.includes('ogun');

            let locationNote = "Lagos On-Site (+20% labor surcharge)";
            let surchargeMultiplier = 1.20;
            if (isOutsideLagos) {
                locationNote = "Interstate On-Site (+70% labor surcharge + mobility/lodging)";
                surchargeMultiplier = 1.70;
            }

            const activeSession = clientSessions[remoteJid];
            const selectedOpt = activeSession ? activeSession.option : '1';

            // Determine base pricing based on selected option
            let serviceName = "Full System Diagnosis";
            let basePrice = 50000;
            if (selectedOpt === '2') { serviceName = "ECM / PCM Programming & Flashing"; basePrice = 150000; }
            else if (selectedOpt === '3') { serviceName = "Smart Keys & Immobilizer Coding"; basePrice = 150000; }
            else if (selectedOpt === '4') { serviceName = "Advanced Module Calibration"; basePrice = 70000; }
            else if (selectedOpt === '5') { serviceName = "Servicing & Routine Maintenance"; basePrice = 35000; }
            else if (selectedOpt === '6') { serviceName = "Engine Replacement"; basePrice = 250000; }
            else if (selectedOpt === '7') { serviceName = "Pre-Purchase Vehicle Inspection"; basePrice = 200000; }
            else if (selectedOpt === '8') { serviceName = "DTC Lookup & Maintenance Subscription"; basePrice = 5000; }

            const finalEstimate = Math.round(basePrice * (selectedOpt === '8' ? 1 : surchargeMultiplier));
            const invoiceNo = "UC-" + Math.floor(100000 + Math.random() * 900000);
            const currentDate = new Date().toLocaleDateString();

            // Track pending payment for automated verification
            pendingPayments[finalEstimate] = remoteJid;

            // PRINT PROFESSIONAL INVOICE FORMAT
            const invoiceMsg = \`==============================\\n\` +
               \`       *UCAUTOTECH / UC AUTOMOBILE CARE*       \\n\` +
               \`          *OFFICIAL WORKSHOP INVOICE*         \\n\` +
               \`==============================\\n\\n\` +
               \`📄 *Invoice No:* \${invoiceNo}\\n\` +
               \`📅 *Date:* \${currentDate}\\n\` +
               \`👤 *Client:* \${clientTitle}\\n\` +
               \`📱 *Contact ID:* \${remoteJid.split('@')[0]}\\n\\n\` +
               \`------------------------------\\n\` +
               \`🚗 *VEHICLE SPECIFICATION:*\\n\` +
               \`\${body}\\n\\n\` +
               \`------------------------------\\n\` +
               \`🔧 *ITEMIZED SERVICE CHARGES:*\\n\` +
               \`• Service: \${serviceName}\\n\` +
               \`• Base Fee: ₦\${basePrice.toLocaleString()}\\n\` +
               \`• Logistics: \${locationNote}\\n\` +
               \`------------------------------\\n\` +
               \`💰 *TOTAL ESTIMATE DUE: ₦\${finalEstimate.toLocaleString()}\\n\` +
               \`------------------------------\\n\\n\` +
               \`💳 *BANK PAYMENT ROUTING:*\\n\` +
               \`• Bank: *UBA Bank*\\n\` +
               \`• Account Name: *UCAUTOTECH / UC AUTOMOBILE CARE*\\n\` +
               \`• Account Number: *[UBA Account Number]*\\n\\n\` +
               \`🟢 *Verification:* Transfer the exact total above. Our automated UBA Bank SMS/Truecaller engine will instantly verify your payment and release your Green Light (🟢) Clearance Ticket.\\n\\n\` +
               \`_Type #menu to return to main services._\`;

            await sock.sendMessage(remoteJid, { text: invoiceMsg });

            const adminAlertMsg = \`🧾 *NEW UCAUTOTECH INVOICE GENERATED!*\\n\\n\` +
               \`📄 *Invoice:* \${invoiceNo}\\n\` +
               \`👤 *Client:* \${clientTitle}\\n\` +
               \`🚗 *Vehicle:* \${body}\\n\` +
               \`💰 *Amount:* ₦\${finalEstimate.toLocaleString()}\\n\` +
               \`⚙️ *Service:* \${serviceName}\`;

            await sock.sendMessage(ADMIN_JID, { text: adminAlertMsg });
`;

// Replace the placeholder response block with invoice logic
const targetMarker = 'const isLagos = lowerBody.includes(\'lekki\')';
const splitIndex = indexCode.indexOf(targetMarker);

if (splitIndex !== -1) {
    const cleanIndexCode = indexCode.substring(0, splitIndex) + invoiceLogic + "\n    }\n});\n}";
    fs.writeFileSync('index.js', cleanIndexCode, 'utf8');
    console.log('✅ Invoice formatting successfully injected into index.js!');
} else {
    console.log('⚠️ Marker not found, please check index.js structure.');
}
