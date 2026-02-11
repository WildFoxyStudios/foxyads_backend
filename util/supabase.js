
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path'); // Added path module

// Force override from .env file to avoid stale shell variables
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getJwtRole(token) {
    try {
        if (!token) return "null";
        const parts = token.split('.');
        if (parts.length < 2) return "invalid";
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        return payload.role || "unknown";
    } catch (e) {
        return "error";
    }
}

if (!supabaseUrl || !supabaseKey) {
    console.error("⚠️ Supabase URL or Key is missing in .env file");
} else {
    const keyRole = getJwtRole(supabaseKey);
    const keyVar = supabaseKey === process.env.SUPABASE_SERVICE_ROLE_KEY ? "SERVICE_ROLE_KEY" : "ANON_KEY";
    console.log(`🔌 Supabase Client Initialized with: ${keyVar} (Role: ${keyRole})`);

    if (keyRole !== 'service_role') {
        console.warn("⚠️ WARNING: Admin Backend is NOT using a service_role key. This may cause Permission Denied errors.");
    }
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

module.exports = supabase;
