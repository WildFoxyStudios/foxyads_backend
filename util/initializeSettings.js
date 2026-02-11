
const supabase = require("./supabase");

async function initializeSettings() {
  try {
    const { data: setting, error } = await supabase
      .from('settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (setting) {
      // Map snake_case to camelCase for compatibility
      const mappedSetting = { ...setting };

      const toCamel = (s) => {
        return s.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      };

      Object.keys(setting).forEach(key => {
        const camelKey = toCamel(key);
        if (camelKey !== key) {
          mappedSetting[camelKey] = setting[key];
        }
      });

      // Special case mappings if auto-convert isn't enough (e.g. acronyms)
      // But standard camelCase should cover most: stripe_public_key -> stripePublicKey

      global.settingJSON = mappedSetting;
      console.log("✅ Settings Initialized from Supabase (with camelCase mapping)");
    } else {
      global.settingJSON = require("../setting");
      console.log("⚠️ Settings not found in DB, using default");
    }
  } catch (error) {
    console.error("Error initializing settings:", error.message);
    global.settingJSON = require("../setting");
  }
}

module.exports = initializeSettings;
