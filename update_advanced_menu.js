const fs = require('fs');

// 1. Force Advanced Knowledge Engine File
const knowledgeContent = `
const knowledgeEngine = {
    bankDetails: "UBA Bank",
    
    getGreeting: (truecallerName, timeOfDay) => {
        const name = truecallerName ? truecallerName : "Mr. James / Mrs. Mary";
        return \`Good \${timeOfDay} \${name}, welcome to UCAUTOTECH we give the best this is our service:\`;
    },

    getServiceMenu: (truecallerName, timeOfDay) => {
        const greeting = knowledgeEngine.getGreeting(truecallerName, timeOfDay);
        return \`\${greeting}\\n\\n\` +
               \`Full System Diagnosis: #30,000 (from 2018 model vehicle upward is #50,000)\\n\\n\` +
               \`ecm/pcm programming / flashing: #70,000 (from 2016 model upward #150,000 to #350,000 depending on vehicle year and model)\\n\\n\` +
               \`smart keys / immobilizer coding: #70,000 (from 2015 upward is #150,000 to #250,000 depending on vehicle year and model)\\n\\n\` +
               \`module calibration like gear box relearning, electric steering, air suspension, abs, electric water pump, electric oil pump, power lift doors, panoramic roof calibration: #70,000 to #200,000 depending on vehicle year and model\\n\\n\` +
               \`servicing oil change and general service: #20,000 to #50,000 depending on vehicle year and model\\n\\n\` +
               \`engine replacement: 4-cylinder #100,000 to #200,000 depending on vehicle year and model; 6-cylinder from #150,000 to #300,000 depending on vehicle year and model; 8-cylinder from #300,000 to #450,000 depending on vehicle year and model\\n\\n\` +
               \`📍 Additional Services & Policies:\\n\\n\` +
               \`Pre-purchase vehicle inspection / verification: 2015 downward is #150,000, while 2015 upward is from #200,000 upward.\\n\\n\` +
               \`Mobility & Location Surcharges: Lagos on-site work adds +20% on labor. Outside Lagos is +70% addition on labor, with mobility and lodging paid upfront.\\n\\n\` +
               \`Advanced Maintenance & DTC Lookup: Monthly subscription #5,000 mandatory.\\n\\n\` +
               \`General Electrical & Mechanical Works (engine rebuild, suspension overhauling): Negotiable.\\n\\n\` +
               \`All transactions go directly to UBA Bank with Truecaller confirmation and green light (🟢) verification upon approval.\`;
    }
};

module.exports = knowledgeEngine;
`;

fs.writeFileSync('knowledge_engine.js', knowledgeContent.trim(), 'utf8');
console.log('✅ Updated knowledge_engine.js with Advanced UCAUTOTECH Menu');

// 2. Patch index.js Router
let indexCode = fs.readFileSync('index.js', 'utf8');

if (!indexCode.includes("require('./knowledge_engine')")) {
    indexCode = "const knowledgeEngine = require('./knowledge_engine');\n" + indexCode;
}

const overrideRouter = `
        // ADVANCED UCAUTOTECH MENU ROUTER OVERRIDE
        if (lowerRouted.startsWith('#menu') || lowerRouted.startsWith('#services') || lowerRouted.includes('service') || lowerRouted.includes('price') || lowerRouted.includes('cost') || ['1','2','3','4','5','6','7','8'].includes(lowerRouted.trim())) {
            const hour = new Date().getHours();
            const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
            const clientName = (typeof clientTitle !== 'undefined' && clientTitle) ? clientTitle : 'Mr. James / Mrs. Mary';
            
            const menuText = knowledgeEngine.getServiceMenu(clientName, timeOfDay);
            await sock.sendMessage(remoteJid, { text: menuText });
            return;
        }
`;

if (indexCode.includes('const lowerRouted =')) {
    indexCode = indexCode.replace(/const lowerRouted = [^;]+;/, "$&\n" + overrideRouter);
    fs.writeFileSync('index.js', indexCode, 'utf8');
    console.log('✅ Linked index.js directly to Advanced Knowledge Menu');
} else {
    console.log('⚠️ Warning: Check index.js lowerRouted declaration');
}
