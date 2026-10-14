const MASTER_SERVICE_MENU = 
    "Good day from UCAUTOTECH,\n\n" +
    "==============================\n" +
    "       UCAUTOTECH / UC AUTOMOBILE CARE       \n" +
    "          VIP WORKSHOP SERVICES v4.0         \n" +
    "==============================\n\n" +
    "1. Full System Diagnosis (₦30,000 - ₦50,000)\n" +
    "2. ECM / PCM Programming & Flashing (₦70,000 - ₦350,000)\n" +
    "3. Smart Keys & Immobilizer Coding (₦70,000 - ₦250,000)\n" +
    "4. Advanced Module Calibration (₦70,000 - ₦200,000)\n" +
    "5. Servicing & Routine Maintenance (₦25,000 - ₦120,000)\n" +
    "6. Brake, ABS & ESP Systems (₦40,000 - ₦180,000)\n" +
    "7. Airbag / SRS Module Services (₦50,000 - ₦200,000)\n" +
    "8. ADAS & Driver Assistance Calibration (₦80,000 - ₦350,000)\n\n" +
    "Reply 1-8 for service info, type #location for workshop map pin, or send your vehicle specs (e.g. 2018 Lexus RX350, Lekki) for an instant verified invoice with round-trip mobility!";

const SERVICE_DETAILS = {
    '1': { name: "Full System Diagnosis", price: "₦30,000 - ₦50,000", baseNum: 40000 },
    '2': { name: "ECM / PCM Programming & Flashing", price: "₦70,000 - ₦350,000", baseNum: 150000 },
    '3': { name: "Smart Keys & Immobilizer Coding", price: "₦70,000 - ₦250,000", baseNum: 100000 },
    '4': { name: "Advanced Module Calibration", price: "₦70,000 - ₦200,000", baseNum: 90000 },
    '5': { name: "Servicing & Routine Maintenance", price: "₦25,000 - ₦120,000", baseNum: 45000 },
    '6': { name: "Brake, ABS & ESP Systems", price: "₦40,000 - ₦180,000", baseNum: 80000 },
    '7': { name: "Airbag / SRS Module Services", price: "₦50,000 - ₦200,000", baseNum: 95000 },
    '8': { name: "ADAS & Driver Assistance Calibration", price: "₦80,000 - ₦350,000", baseNum: 120000 }
};

function calculateMobilityAndQuote(messageContent) {
    const lower = messageContent.toLowerCase();
    const yearMatch = messageContent.match(/\b(20[0-2][0-9]|19[8-9][0-9])\b/);

    if (!yearMatch) return null;

    const vehicleYear = parseInt(yearMatch[1], 10);
    const isLekki = lower.includes('lekki') || lower.includes('ikoyi') || lower.includes('vi') || lower.includes('victoria island');
    const isMainland = lower.includes('ikeja') || lower.includes('surulere') || lower.includes('gba') || lower.includes('yaba');

    let baseFee = vehicleYear >= 2016 ? 50000 : 40000;
    
    let oneWayKm = isLekki ? 23.6 : (isMainland ? 10.0 : 15.0);
    let roundTripKm = oneWayKm * 2;
    let ratePerKm = 750;
    let transitDistanceFee = roundTripKm * ratePerKm;
    
    let luggageAllowance = 5000; 
    let teamAllowance = 5000;    
    
    let mobilityFee = transitDistanceFee + luggageAllowance + teamAllowance;
    let totalEstimate = baseFee + mobilityFee;

    return {
        vehicleYear,
        roundTripKm,
        ratePerKm,
        transitDistanceFee,
        luggageAllowance,
        teamAllowance,
        mobilityFee,
        baseFee,
        totalEstimate
    };
}

module.exports = {
    MASTER_SERVICE_MENU,
    SERVICE_DETAILS,
    calculateMobilityAndQuote
};
