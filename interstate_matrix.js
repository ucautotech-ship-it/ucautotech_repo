// UCAUTOTECH Interstate Logistics & Travel Fee Matrix
const LOGISTICS_MATRIX = {
    "lagos": { state: "Lagos State", zone: "South-West", distanceKm: 25, mobilityFee: 15000, accommodationFee: 0 },
    "abuja": { state: "Abuja (FCT)", zone: "North-Central", distanceKm: 500, mobilityFee: 85000, accommodationFee: 30000 },
    "port harcourt": { state: "Rivers State", zone: "South-South", distanceKm: 620, mobilityFee: 95000, accommodationFee: 35000 },
    "ibadan": { state: "Oyo State", zone: "South-West", distanceKm: 130, mobilityFee: 35000, accommodationFee: 15000 }
};

function calculateInterstateLogistics(targetState, serviceDeposit = 50000) {
    if (!targetState) {
        return { found: false, message: "Please specify a destination state. Example: #interstate Abuja" };
    }

    const cleanKey = targetState.toLowerCase().trim();
    const data = LOGISTICS_MATRIX[cleanKey];

    if (!data) {
        return { 
            found: false, 
            message: `🚚 Destination *"${targetState}"* requires custom logistics estimation. Please contact our dispatch desk directly.` 
        };
    }

    const grandTotal = data.mobilityFee + data.accommodationFee + serviceDeposit;

    return {
        found: true,
        state: data.state,
        zone: data.zone,
        distanceKm: data.distanceKm,
        mobilityFee: data.mobilityFee,
        accommodationFee: data.accommodationFee,
        serviceDeposit: serviceDeposit,
        grandTotal: grandTotal,
        policyNotice: "⚠️ *Logistics Policy:* 100% upfront payment of mobility and accommodation fees is required prior to deployment of technical crew."
    };
}

module.exports = {
    calculateInterstateLogistics
};
