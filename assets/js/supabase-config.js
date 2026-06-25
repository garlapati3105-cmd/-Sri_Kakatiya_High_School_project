// ============================================================
//  Sri Kakatiya School Management Platform – supabase-config.js
//  Initializes Supabase connection with LocalStorage fallbacks
// ============================================================

const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

let supabaseClient = null;
let isSupabaseActiveFlag = false;

function checkSupabaseConfiguration() {
  const isPlaceholderUrl = !SUPABASE_URL || SUPABASE_URL.includes("YOUR_SUPABASE_URL");
  const isPlaceholderKey = !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");
  
  // Force local storage mode for testing by short-circuiting
  console.warn("[DATABASE] Supabase is forced OFF. Falling back to LocalStorage mode.");
  isSupabaseActiveFlag = false;
  return false;
  
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

window.uploadFileToSupabase = async function(bucketName, path, file) {
  if (!window.isSupabaseActive()) {
    console.error("[DATABASE] Supabase is not active. Cannot upload file.");
    return { success: false, message: "Supabase client is not active." };
  }
  try {
    const supabase = window.getSupabaseClient();
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      console.error("[DATABASE] File upload failed:", error);
      return { success: false, message: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);

    return { success: true, publicUrl: publicUrlData.publicUrl };
  } catch (err) {
    console.error("[DATABASE] Unexpected error during file upload:", err);
    return { success: false, message: err.message };
  }
};
