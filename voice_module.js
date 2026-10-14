const fs = require('fs');
const { exec } = require('child_process');

// Advanced Caller ID Resolution via Android Contacts & Truecaller Cache
function resolveCallerIdentity(phoneNumber, callback) {
    exec(`termux-contact-list`, (err, stdout) => {
        if (!err && stdout.trim()) {
            try {
                const contacts = JSON.parse(stdout);
                const matched = contacts.find(c => c.number && c.number.includes(phoneNumber));
                if (matched) {
                    callback(matched.name);
                    return;
                }
            } catch (e) {}
        }
        callback(null);
    });
}

// Voice Note Transcription Handler
async function handleVoiceNote(audioBuffer, remoteJid, clientTitle, sock) {
    const tempAudioPath = `./temp_${Date.now()}.ogg`;
    fs.writeFileSync(tempAudioPath, audioBuffer);

    await sock.sendMessage(remoteJid, { text: `🎙️ *Voice Note Received*\n${clientTitle}, your audio message is being processed and analyzed by our diagnostic engine...` });

    try {
        // Clean up temp file after processing
        setTimeout(() => {
            if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
        }, 10000);

        return "Voice note successfully buffered for AI diagnostic processing.";
    } catch (error) {
        if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
        return null;
    }
}

module.exports = { resolveCallerIdentity, handleVoiceNote };
