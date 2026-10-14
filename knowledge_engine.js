const knowledgeEngine = {
    adminPhone: "2348126185785@s.whatsapp.net",
    bankDetails: "UBA Bank | Account: UCAUTOTECH | Green Light (🟢) Verification",

    getServiceMenu: (clientName, timeOfDay) => {
        return `Good ${timeOfDay} ${clientName}, welcome to UCAUTOTECH. Please select a service by typing any number (1-8):\n\n` +
               `1️⃣ Full System Diagnosis\n` +
               `   • Pre-2018 Vehicles: ₦30,000\n` +
               `   • 2018+ Vehicles: ₦50,000\n\n` +
               `2️⃣ ECM / PCM Programming & Flashing\n` +
               `   • Pre-2016 Vehicles: ₦70,000\n` +
               `   • 2016+ Vehicles: ₦150,000 - ₦350,000\n\n` +
               `3️⃣ Smart Keys & Immobilizer Coding\n` +
               `   • Pre-2015 Vehicles: ₦70,000\n` +
               `   • 2015+ Vehicles: ₦150,000 - ₦250,000\n\n` +
               `4️⃣ Advanced Module Calibration\n` +
               `   • Gearbox relearn, electric steering, air suspension, ABS, electric water/oil pump, panoramic roof, etc.\n` +
               `   • Pricing: ₦70,000 - ₦200,000\n\n` +
               `5️⃣ Servicing & Routine Maintenance\n` +
               `   • Oil change & general service\n` +
               `   • Pricing: ₦20,000 - ₦50,000\n\n` +
               `6️⃣ Engine Replacement\n` +
               `   • 4-Cylinder: ₦100,000 - ₦200,000\n` +
               `   • 6-Cylinder: ₦150,000 - ₦300,000\n` +
               `   • 8-Cylinder: ₦300,000 - ₦450,000\n\n` +
               `7️⃣ Pre-Purchase Vehicle Inspection / Verification\n` +
               `   • 2015 Downward: ₦150,000\n` +
               `   • 2015 Upward: ₦200,000+\n\n` +
               `8️⃣ Advanced DTC Lookup & Maintenance Subscription\n` +
               `   • Mandatory DTC access: ₦5,000 / month\n\n` +
               `📍 *Additional Policies & Surcharges:*\n` +
               `• Lagos On-Site Work: +20% labor surcharge\n` +
               `• Outside Lagos Work: +70% labor surcharge + upfront mobility & lodging\n` +
               `• General Repairs (Engine rebuilds, suspension): Negotiable directly here.\n` +
               `• Payments go to UBA Bank with Green Light (🟢) verification status.\n\n` +
               `👉 *Type a number (1-8) to select a service or type your query directly in WhatsApp!*`;
    }
};

module.exports = knowledgeEngine;