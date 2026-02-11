
const dotenv = require('dotenv');
dotenv.config();

function decodeJwt(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return "Invalid JWT format";
        const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
        return JSON.parse(payload);
    } catch (e) {
        return "Error decoding: " + e.message;
    }
}

const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("--- ANON KEY ---");
console.log(decodeJwt(anonKey));

console.log("\n--- SERVICE ROLE KEY ---");
console.log(decodeJwt(serviceKey));
