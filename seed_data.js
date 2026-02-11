const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key for Admin Access

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DB_DIR = path.join(__dirname, '../../DB');

async function seedData() {
    console.log("Starting data seeding...");

    // Helper to read JSON
    const readJson = (file) => {
        try {
            const filePath = path.join(DB_DIR, file);
            if (!fs.existsSync(filePath)) {
                console.warn(`File not found: ${file}, skipping.`);
                return [];
            }
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
            console.error(`Error reading ${file}:`, e);
            return [];
        }
    };

    // 1. Settings
    const settingsData = readJson('settings.json');
    if (settingsData.length > 0) {
        console.log(`Seeding Settings (${settingsData.length})...`);
        // Check if settings exist
        const { count } = await supabase.from('settings').select('*', { count: 'exact', head: true });

        if (count === 0) {
            const mappedSettings = settingsData.map(s => ({
                currency: s.currency, // Assuming JSONB
                enable_google_play: s.enableGooglePlay,
                enable_stripe: s.enableStripe,
                stripe_public_key: s.stripePublicKey,
                stripe_private_key: s.stripePrivateKey,
                enable_razorpay: s.enableRazorpay,
                razorpay_key_id: s.razorpayKeyId,
                razorpay_secret_key: s.razorpaySecretKey,
                enable_flutterwave: s.enableFlutterwave,
                flutterwave_key_id: s.flutterwaveKeyId,
                enable_paystack: s.enablePaystack,
                paystack_public_key: s.paystackPublicKey,
                paystack_secret_key: s.paystackSecretKey,
                enable_cashfree: s.enableCashfree,
                cashfree_client_id: s.cashfreeClientId,
                cashfree_secret_key: s.cashfreeSecretKey,
                enable_paypal: s.enablePaypal,
                paypal_client_id: s.paypalClientId,
                paypal_secret_key: s.paypalSecretKey,
                about_page_url: s.aboutPageUrl,
                privacy_policy_url: s.privacyPolicyUrl,
                terms_and_conditions_url: s.termsAndConditionsUrl,
                agora_app_id: s.agoraAppId,
                agora_app_sign_key: s.agoraAppSignKey,
                support_phone: s.supportPhone,
                support_email: s.supportEmail,
                max_video_duration_sec: s.maxVideoDurationSec,
                firebase_private_key: s.firebasePrivateKey,
                created_at: s.createdAt?.$date || new Date(),
                updated_at: s.updatedAt?.$date || new Date()
            }));

            const { error } = await supabase.from('settings').insert(mappedSettings);
            if (error) console.error("Error inserting settings:", error);
            else console.log("Settings newly inserted.");
        } else {
            console.log("Settings already exist, skipping.");
        }
    }

    // 2. Report Reasons
    const { count: rrCount } = await supabase.from('report_reasons').select('*', { count: 'exact', head: true });
    if (rrCount === 0) {
        const reportReasons = readJson('reportreasons.json');
        if (reportReasons.length > 0) {
            console.log(`Seeding Report Reasons (${reportReasons.length})...`);
            const mapped = reportReasons.map(r => ({
                title: r.title,
                created_at: r.createdAt?.$date || new Date(),
                updated_at: r.updatedAt?.$date || new Date()
            }));
            const { error } = await supabase.from('report_reasons').insert(mapped);
            if (error) console.error("Error report_reasons:", error);
        }
    } else {
        console.log("Report Reasons already exist, skipping.");
    }

    // 3. Tips
    const { count: tipsCount } = await supabase.from('tips').select('*', { count: 'exact', head: true });
    if (tipsCount === 0) {
        const tips = readJson('tips.json');
        if (tips.length > 0) {
            console.log(`Seeding Tips (${tips.length})...`);
            const mapped = tips.map(t => ({
                description: t.description,
                is_active: t.isActive,
                created_at: t.createdAt?.$date || new Date(),
                updated_at: t.updatedAt?.$date || new Date()
            }));
            const { error } = await supabase.from('tips').insert(mapped);
            if (error) console.error("Error tips:", error);
        }
    } else {
        console.log("Tips already exist, skipping.");
    }

    // 4. Id Proofs
    const { count: idCount } = await supabase.from('id_proofs').select('*', { count: 'exact', head: true });
    if (idCount === 0) {
        const idProofs = readJson('idproofs.json');
        if (idProofs.length > 0) {
            console.log(`Seeding Id Proofs (${idProofs.length})...`);
            const mapped = idProofs.map(i => ({
                title: i.title,
                is_active: i.isActive,
                created_at: i.createdAt?.$date || new Date(),
                updated_at: i.updatedAt?.$date || new Date()
            }));
            const { error } = await supabase.from('id_proofs').insert(mapped);
            if (error) console.error("Error id_proofs:", error);
        }
    } else {
        console.log("Id Proofs already exist, skipping.");
    }

    // 5. Geography: Countries -> States -> Cities
    // SKIPPING GEOGRAPHY SEEDING AS IT WAS SUCCESSFUL PREVIOUSLY
    console.log("Skipping Geography seeding (Countries, States, Cities) as it is assumed complete.");


    console.log("Seeding complete!");
}

seedData();
