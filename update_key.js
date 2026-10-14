const fs = require('fs');
let code = fs.readFileSync('index.js', 'utf8');

// Update GoogleGenAI initialization to use process.env.GEMINI_API_KEY
code = code.replace("const ai = new GoogleGenAI();", "const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });");

fs.writeFileSync('index.js', code, 'utf8');
console.log('✅ Updated index.js with Gemini API key handling!');
