const fs = require('fs');
const path = require('path');
const DB_FILE = path.join(__dirname, 'ucautotech_master_db.json');

function dbOp() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify({ clients: {}, jobs: {"UCA-91823": { vehicle: "2012 Ford Explorer", status: "Under active review" }}, conversations: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function saveDb(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const db = {
    getClient: (phone) => dbOp().clients[phone] || null,
    getAllClients: () => dbOp().clients || {},
    saveClient: (phone, title, isVip = false) => {
        let dbo = dbOp();
        let ex = dbo.clients[phone] || {};
        dbo.clients[phone] = { title, isVip: isVip || ex.isVip || false, lastSeen: new Date().toISOString() };
        saveDb(dbo);
    },
    setVipStatus: (phone, status) => {
        let dbo = dbOp();
        if (!dbo.clients[phone]) dbo.clients[phone] = { title: "Mr. Client", isVip: status };
        dbo.clients[phone].isVip = status;
        saveDb(dbo);
    },
    getLastMessage: (phone) => dbOp().conversations?.[phone] || null,
    saveLastMessage: (phone, message) => {
        let dbo = dbOp();
        if (!dbo.conversations) dbo.conversations = {};
        dbo.conversations[phone] = { message, timestamp: new Date().toISOString() };
        saveDb(dbo);
    },
    getJob: (code) => dbOp().jobs[code] || null
};

module.exports = db;
