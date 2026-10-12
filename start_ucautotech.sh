#!/bin/bash

# 1. Prevent Android system idle sleep
termux-wake-lock

# 2. Configure High-Speed Performance Flags
export PYTHONUNBUFFERED=1
export OBD_BAUD_RATE=500000
export WORKSHOP_NAME="UCAUTOTECH"
export CONTACT_PHONE="+2348126185785"

SESSION="ucautotech"

# 3. GitHub Auto-Sync
echo "[UCAUTOTECH Engine] Pulling latest updates from GitHub..."
git pull origin main

tmux has-session -t $SESSION 2>/dev/null

if [ $? != 0 ]; then
    echo "[UCAUTOTECH Engine] Initializing 500k Baud AI-Powered Diagnostic Stack..."

    # Window 0: High-Speed VCI Bridge (500k Baud CAN Bus Listener)
    tmux new-session -d -s $SESSION -n 'vci-500k-bridge'
    tmux send-keys -t $SESSION:0 'python3 -m uvicorn vci_bridge:app --host 0.0.0.0 --port 8000' C-m

    # Window 1: Asynchronous Real-Time Telemetry & WebSocket Engine
    tmux new-window -t $SESSION -n 'async-telemetry'
    tmux send-keys -t $SESSION:1 'python3 telemetry_engine.py' C-m

    # Window 2: AI Diagnostic Trouble Code (DTC) Breakdown & Freeze-Frame Engine
    tmux new-window -t $SESSION -n 'ai-dtc-analyzer'
    tmux send-keys -t $SESSION:2 'python3 ai_dtc_engine.py' C-m

    # Window 3: Cloud Synchronization Gateway
    tmux new-window -t $SESSION -n 'cloud-sync'
    tmux send-keys -t $SESSION:3 'python3 cloud_gateway.py' C-m

    # Window 4: Autonomous WhatsApp AI Service & Booking Intake
    tmux new-window -t $SESSION -n 'whatsapp-ai-bot'
    tmux send-keys -t $SESSION:4 'python3 whatsapp_ai_bot.py' C-m

    # Window 5: Local Micro Dashboard (FastAPI / WebSockets)
    tmux new-window -t $SESSION -n 'local-ws-dash'
    tmux send-keys -t $SESSION:5 'python3 dashboard.py' C-m

    # Window 6: Resource & Thermal Monitor
    tmux new-window -t $SESSION -n 'sys-monitor'
    tmux send-keys -t $SESSION:6 'htop' C-m

    # Window 7: Interactive Execution Shell
    tmux new-window -t $SESSION -n 'terminal-shell'
    tmux send-keys -t $SESSION:7 'clear' C-m

    echo "[UCAUTOTECH Engine] All 8 AI sessions running smoothly!"
else
    echo "[UCAUTOTECH Engine] Session $SESSION is already active."
fi

tmux attach-session -t $SESSION
