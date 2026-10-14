const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "API_KEY_PLACEHOLDER" });

async function analyzeVoiceNote(audioBuffer, mimeType) {
    try {
        const audioPart = {
            inlineData: {
                data: audioBuffer.toString("base64"),
                mimeType: mimeType || "audio/ogg"
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [audioPart, "You are a master automotive diagnostic expert for UCAUTOTECH. Analyze this client voice note describing a vehicle issue. Provide a professional technical assessment and recommended service action."]
        });

        return response.text;
    } catch (err) {
        console.error("[AI SERVICE - VOICE NOTE ERROR]:", err.message);
        return null;
    }
}

async function analyzePartsOrDTC(queryText) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a master automotive parts and diagnostic advisor for UCAUTOTECH. Analyze this client request: "${queryText}". Provide a professional estimate breakdown including estimated part sourcing and labor context in Naira (₦).`
        });

        return response.text;
    } catch (err) {
        console.error("[AI SERVICE - DTC/PARTS ERROR]:", err.message);
        return null;
    }
}

module.exports = {
    analyzeVoiceNote,
    analyzePartsOrDTC
};
