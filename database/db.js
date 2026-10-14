const fs = require('fs');
const path = require('path');

const CUSTOMERS_FILE = path.join(__dirname, '../customers.json');
const JOBS_FILE = path.join(__dirname, '../jobs.json');
const LEDGER_FILE = path.join(__dirname, '../wms_ledger.json');

function loadStore(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {}
    return [];
}

function saveStore(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

console.log("[WMS Database] Enterprise JSON storage engine initialized successfully.");

module.exports = {
    saveCustomer: (jid, name, vehicleSpec) => {
        let customers = loadStore(CUSTOMERS_FILE);
        let customer = customers.find(c => c.jid === jid);
        
        if (!customer) {
            customer = { jid, name: name || "Valued Client", vehicles: [], created_at: new Date().toISOString(), last_seen: new Date().toISOString() };
            customers.push(customer);
        } else {
            if (name) customer.name = name;
            customer.last_seen = new Date().toISOString();
        }

        if (vehicleSpec && !customer.vehicles.includes(vehicleSpec)) {
            customer.vehicles.push(vehicleSpec);
        }
        saveStore(CUSTOMERS_FILE, customers);
    },

    createJob: (invoiceNo, jid, spec, totalEstimate, breakdown, status = 'Quotation Sent') => {
        let jobs = loadStore(JOBS_FILE);
        jobs.push({
            invoice_no: invoiceNo,
            client_jid: jid,
            specification: spec,
            total_estimate: totalEstimate,
            breakdown,
            status,
            created_at: new Date().toISOString()
        });
        saveStore(JOBS_FILE, jobs);
    },

    logLedger: (type, reference, amount, details) => {
        let ledger = loadStore(LEDGER_FILE);
        ledger.push({
            timestamp: new Date().toISOString(),
            type,
            reference: reference || 'N/A',
            amount: amount || 0,
            details: details || {}
        });
        saveStore(LEDGER_FILE, ledger);
    },

    getDbStats: () => {
        const customers = loadStore(CUSTOMERS_FILE);
        const jobs = loadStore(JOBS_FILE);
        const ledger = loadStore(LEDGER_FILE);
        return {
            customersCount: customers.length,
            jobsCount: jobs.length,
            ledgerCount: ledger.length
        };
    }
};
