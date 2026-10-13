def search_dtc():
    print("==================================================")
    print(" 📚 OFFLINE DTC FAULT CODE & WIRING MATRIX")
    print("==================================================")
    codes = {
        "P0300": "Random/Multiple Cylinder Misfire - Check ignition coils, plugs, and fuel pressure.",
        "P0171": "System Too Lean (Bank 1) - Check MAF sensor, vacuum leaks, and fuel pump.",
        "P0420": "Catalyst System Efficiency Below Threshold - Check catalytic converter and oxygen sensors.",
        "P1892": "4WD Switch Circuit Failure - Verify module power, ground, and harness continuity."
    }
    code = input("Enter DTC Code (e.g., P0300 or 'exit'): ").strip().upper()
    if code in codes:
        print(f"\n🔍 DTC: {code}\nDiagnosis: {codes[code]}")
    elif code != "EXIT":
        print(f"\n⚠️ Code '{code}' not recognized in offline matrix. Verify power/ground at module and sensor reference voltage.")

if __name__ == "__main__":
    search_dtc()
    input("\nPress Enter to return...")
