// UCAUTOTECH OBD-II Diagnostic Bridge Data Matrix
const DTC_KNOWLEDGE_BASE = {
    "p189200": {
        system: "4WD / Transfer Case Module",
        fault: "4WD Mode Select Switch Circuit Malfunction",
        solution: "Inspect wiring harness between terrain switch and transfer case module. Verify 5V reference signal and check ground continuity."
    },
    "p0300": {
        system: "Engine Ignition / Fuel System",
        fault: "Random/Multiple Cylinder Misfire Detected",
        solution: "Inspect spark plugs, ignition coils, ground straps, and check fuel delivery pressure."
    },
    "p0420": {
        system: "Emissions Control System",
        fault: "Catalyst System Efficiency Below Threshold (Bank 1)",
        solution: "Check upstream/downstream O2 sensor waveforms, exhaust leaks, or catalyst substrate degradation."
    }
};

module.exports = {
    DTC_KNOWLEDGE_BASE
};
