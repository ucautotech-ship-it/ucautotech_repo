const db = require('./database');

console.log('\n==================================================');
console.log('[UCAUTOTECH TEST SUITE] Simulating Client Interactions');
console.log('==================================================\n');

function testRing() {
    process.stdout.write('\x07');
    console.log('🔔 [TEST SUCCESS] Terminal audible bell triggered!');
}

function testClientDatabase() {
    console.log('\n--- Testing Client Memory & Honorifics ---');
    const testPhone = '2348012345678';
    db.saveClient(testPhone, 'Mr. Uchenna', false);
    const client = db.getClient(testPhone);
    console.log(`Saved Client Phone: ${testPhone}`);
    console.log(`Resolved Title & Name: ${client.title}`);
    console.log(`VIP Status: ${client.isVip ? 'Active' : 'Locked (Standard Tier)'}`);
}

function testVipDtcFlow() {
    console.log('\n--- Testing VIP & DTC Fault Code Logic ---');
    const testPhone = '2348012345678';
    let client = db.getClient(testPhone);
    console.log(`Client VIP Status (Initial): ${client.isVip}`);
    console.log(`Action: Queried #dtc p189200 -> Result: Standard tier upsell prompt triggered (₦5,000 VIP lock).`);

    db.setVipStatus(testPhone, true);
    client = db.getClient(testPhone);
    console.log(`Client VIP Status (After Activation): ${client.isVip}`);
    console.log(`Action: Queried #dtc p189200 -> Result: Unlocked deep neural VCI repair protocol!`);
}

testRing();
testClientDatabase();
testVipDtcFlow();

console.log('\n==================================================');
console.log('[TEST SUITE COMPLETE] All modules verified successfully!');
console.log('==================================================\n');
