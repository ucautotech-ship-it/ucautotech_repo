const fs = require('fs');

let code = fs.readFileSync('index.js', 'utf8');

// Ensure knowledgeEngine is imported at top
if (!code.includes('knowledgeEngine')) {
    code = "const knowledgeEngine = require('./knowledge_engine');\n" + code;
}

const menuBlockRegex = /\/\/ SERVICES & PRICING MENU HANDLER[\s\S]*?return;\s*\}/;

const newMenuBlock = `// SERVICES & PRICING MENU HANDLER
            if (lowerRouted.startsWith('#menu') || lowerRouted.startsWith('#services') || lowerRouted.includes('price') || lowerRouted.includes('service') || lowerRouted.includes('cost')) {
                const hour = new Date().getHours();
                const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
                const clientName = (typeof clientTitle !== 'undefined' && clientTitle) ? clientTitle : 'Mr. James / Mrs. Mary';
                
                const menuText = knowledgeEngine.getServiceMenu(clientName, timeOfDay);
                await sock.sendMessage(remoteJid, { text: menuText });
                return;
            }`;

if (menuBlockRegex.test(code)) {
    code = code.replace(menuBlockRegex, newMenuBlock);
} else {
    code = code.replace("if (lowerRouted.startsWith('#dtc')) {", newMenuBlock + "\n\n            if (lowerRouted.startsWith('#dtc')) {");
}

fs.writeFileSync('index.js', code, 'utf8');
console.log('✅ SUCCESS: index.js updated to serve exact knowledge menu!');
