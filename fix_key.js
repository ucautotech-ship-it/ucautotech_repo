const fs = require('fs');

const API_KEY = "YOUR_GEMINI_API_KEY_HERE";

let indexCode = fs.readFileSync('index.js', 'utf8');

// Replace SDK initialization to hardcode your key directly
indexCode = indexCode.replace(/const ai = new GoogleGenAI\([^)]*\);/, `const ai = new GoogleGenAI({ apiKey: "${API_KEY}" });`);

fs.writeFileSync('index.js', indexCode, 'utf8');
console.log('✅ Gemini API Key hardcoded directly into index.js!');
