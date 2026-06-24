// ============================================================
//  Sri Kakatiya School Management Platform – supabase-config.js
//  Initializes Supabase connection with LocalStorage fallbacks
// ============================================================

const SUPABASE_URL = "https://naozdmidwaiumvuotgoc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BEVWbRlU2GjLwLpcdK1PYA_Vwt0sQbT";

let supabaseClient = null;
let isSupabaseActiveFlag = false;

function checkSupabaseConfiguration() {
  const isPlaceholderUrl = !SUPABASE_URL || SUPABASE_URL.includes("YOUR_SUPABASE_URL");
  const isPlaceholderKey = !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");
  
  if (isPlaceholderUrl || isPlaceholderKey) {
    console.warn("[DATABASE] Supabase is not configured yet. Falling back to LocalStorage mode.");
    isSupabaseActiveFlag = false;
    return false;
  }
  
  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      isSupabaseActiveFlag = true;
      console.log("[DATABASE] Supabase client initialized successfully.");
      return true;
    } else {
      console.error("[DATABASE] Supabase client JS library is missing in current document context.");
      isSupabaseActiveFlag = false;
      return false;
    }
  } catch (error) {
    console.error("[DATABASE] Failed to initialize Supabase client connection:", error);
    isSupabaseActiveFlag = false;
    return false;
  }
}

// Global accessor functions
window.isSupabaseActive = function() {
  if (supabaseClient === null) {
    checkSupabaseConfiguration();
  }
  return isSupabaseActiveFlag;
};

window.getSupabaseClient = function() {
  if (supabaseClient === null) {
    checkSupabaseConfiguration();
  }
  return supabaseClient;
};
