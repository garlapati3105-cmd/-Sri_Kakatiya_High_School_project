// ============================================================
//  Sri Kakatiya School Management Platform – auth.js
//  Handles login, logout, password reset, RBAC and sessions
// ============================================================

const SESSION_KEY = "skhs_active_session";
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const SESSION_ABSOLUTE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
const REMEMBER_ME_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_CHECK_INTERVAL = 10000; // 10 seconds
const MIN_PASSWORD_LENGTH = 8;
const MAX_RESET_ATTEMPTS = 5;

// Centralized Role-Permission Matrix
const PERMISSIONS = {
  VIEW_DASHBOARD:  ['admin', 'teacher', 'parent', 'student'],
  VIEW_AUDIT_LOGS: ['admin'],
  MANAGE_USERS:    ['admin'],
  EDIT_PROFILE:    ['admin', 'teacher', 'parent', 'student'],
  TEACH_WORKFLOWS: ['teacher'],
  PARENT_VIEWS:    ['parent'],
  STUDENT_VIEWS:   ['student']
};

// Dashboard Route Configuration mapping roles to portal destinations
const ROUTE_CONFIG = {
  'admin':   'admin-dashboard.html',
  'teacher': 'teacher-portal.html',
  'parent':  'parent-portal.html',
  'student': 'student-portal.html'
};

function normalizeEmail(email) {
  return window.skhs_security ? window.skhs_security.normalizeEmail(email) : String(email ?? '').trim().toLowerCase();
}

function getResetTokenKey(email) {
  return "reset_token_" + encodeURIComponent(normalizeEmail(email));
}

function clearActiveSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}

function isValidSessionShape(session) {
  return Boolean(
    session &&
    typeof session.userId === 'string' &&
    typeof session.role === 'string' &&
    typeof session.loginTimestamp === 'number' &&
    typeof session.lastActivity === 'number' &&
    typeof session.expiresAt === 'number'
  );
}

function validatePasswordStrength(password) {
  const trimmed = String(password ?? '').trim();
  if (trimmed.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` };
  }
  if (!/[A-Za-z]/.test(trimmed) || !/[0-9]/.test(trimmed)) {
    return { valid: false, message: "Password must include at least one letter and one number." };
  }
  const commonPasswords = ['admin123', 'teacher123', 'parent123', 'student123', 'password', 'password123', '12345678'];
  if (commonPasswords.includes(trimmed.toLowerCase())) {
    return { valid: false, message: "Please choose a stronger password than the default/demo passwords." };
  }
  return { valid: true };
}

function currentSessionOwnsUser(userId) {
  const session = getActiveSession();
  return Boolean(session && session.userId === userId);
}

// Helper: retrieve raw session object from storage
function getActiveSession() {
  const sessionStr = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;
  try {
    const session = JSON.parse(sessionStr);
    if (!isValidSessionShape(session) || Date.now() > session.expiresAt) {
      clearActiveSession();
      return null;
    }
    return session;
  } catch (e) {
    clearActiveSession();
    return null;
  }
}

// Helper: save session object to storage
function saveActiveSession(session) {
  const sessionStr = JSON.stringify(session);
  clearActiveSession();
  if (session.rememberMe) {
    localStorage.setItem(SESSION_KEY, sessionStr);
  } else {
    sessionStorage.setItem(SESSION_KEY, sessionStr);
  }
}

// Check if a session has timed out due to inactivity
function checkSessionTimeout() {
  const session = getActiveSession();
  if (session && !session.rememberMe) {
    const inactiveDuration = Date.now() - session.lastActivity;
    if (inactiveDuration > INACTIVITY_TIMEOUT) {
      // Create system log before logging out
      window.skhs_db.logActivity(
        'logout',
        'auth',
        'info',
        session.userId,
        null,
        `Session expired due to ${Math.floor(inactiveDuration / 60000)} minutes of inactivity.`
      );
      
      // Clear session and redirect
      clearActiveSession();
      
      alert("Your session has expired due to inactivity. Please log in again.");
      window.location.href = "login.html";
    }
  }
}

// Monitor user activity and update timestamp
function initActivityTracker() {
  const session = getActiveSession();
  if (!session) return;
  let lastSaved = 0;

  const resetTimer = () => {
    const activeSession = getActiveSession();
    if (activeSession && Date.now() - lastSaved > 30000) {
      activeSession.lastActivity = Date.now();
      saveActiveSession(activeSession);
      lastSaved = Date.now();
    }
  };

  const activityEvents = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll', 'click'];
  activityEvents.forEach(evt => {
    document.addEventListener(evt, resetTimer, { passive: true });
  });

  // Run a periodic checker
  setInterval(checkSessionTimeout, SESSION_CHECK_INTERVAL);
}

// Authentication AP// Helper to convert base64 image data url to Blob
function dataURLtoBlob(dataurl) {
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return { blob: new Blob([u8arr], { type: mime }), mime };
  } catch (e) {
    console.error("[AUTH] Failed to parse base64 image data url:", e);
    return null;
  }
}

// Authentication API
const auth = {
  // Login flow with security restrictions
  async login(email, password, rememberMe = false, expectedRole = null) {
    email = normalizeEmail(email);
    expectedRole = expectedRole && ROUTE_CONFIG[expectedRole] ? expectedRole : null;

    if (!email || !password) {
      return { success: false, message: "Please fill in all fields." };
    }

    if (window.isSupabaseActive()) {
      const supabase = window.getSupabaseClient();
      
      // Perform Supabase Auth login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (authError) {
        console.warn("[AUTH] Supabase login error:", authError);
        return { success: false, message: authError.message };
      }

      const sessionUser = authData.user;
      
      // Fetch public profile user details
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (profileError || !userProfile) {
        console.error("[AUTH] User authenticated but public profile is missing:", profileError);
        return { success: false, message: "Authorized but user profile could not be found." };
      }

      if (expectedRole && userProfile.role !== expectedRole) {
        return { success: false, message: "Invalid email, password, or role." };
      }

      if (userProfile.status === 'locked' || !userProfile.account_active) {
        return { success: false, message: "This account has been locked or deactivated. Please contact an administrator." };
      }

      // Map snake_case database columns to expected camelCase keys
      const safeUser = {
        userId: userProfile.id,
        fullName: userProfile.full_name,
        email: userProfile.email,
        mobileNumber: userProfile.mobile_number,
        role: userProfile.role,
        profilePhoto: userProfile.profile_photo,
        status: userProfile.status,
        accountActive: userProfile.account_active,
        isDefaultPassword: userProfile.is_default_password,
        createdDate: userProfile.created_date,
        lastLogin: userProfile.last_login
      };

      // Update last login in background
      await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', sessionUser.id);

      // Generate local session structure
      const now = Date.now();
      const sessionToken = "SESS-" + sessionUser.id;
      const session = {
        sessionToken,
        userId: safeUser.userId,
        role: safeUser.role,
        loginTimestamp: now,
        lastActivity: now,
        expiresAt: now + (rememberMe ? REMEMBER_ME_TIMEOUT : SESSION_ABSOLUTE_TIMEOUT),
        rememberMe: rememberMe,
        userProfile: safeUser // Cache safe user profile synchronously in storage
      };

      saveActiveSession(session);
      
      // Log audit trail
      if (window.skhs_db && typeof window.skhs_db.logActivity === 'function') {
        await window.skhs_db.logActivity('login', 'auth', 'info', safeUser.userId, null, `Successful login from role: ${safeUser.role}`);
      }

      return { success: true, redirect: ROUTE_CONFIG[safeUser.role] };
    } else {
      // LocalStorage Fallback
      const user = window.skhs_db.findOne('users', 'email', email);
      if (user instanceof Promise) {
        // Handle if findOne returned a promise in local mode
        return { success: false, message: "Please wait, database is loading." };
      }
      
      // Synchronous LocalStorage search
      const localUsers = JSON.parse(localStorage.getItem("skhs_db_users") || "[]");
      const localUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!localUser) {
        return { success: false, message: "Invalid email or password." };
      }

      const hashedInput = await window.skhs_sha256(password);
      if (hashedInput === localUser.password) {
        const now = Date.now();
        const sessionToken = window.skhs_security.createId("SESS");
        
        const safeUser = {
          userId: localUser.userId,
          fullName: localUser.fullName,
          email: localUser.email,
          mobileNumber: localUser.mobileNumber,
          role: localUser.role,
          profilePhoto: localUser.profilePhoto,
          status: localUser.status,
          accountActive: localUser.accountActive,
          isDefaultPassword: localUser.isDefaultPassword,
          createdDate: localUser.createdDate,
          lastLogin: localUser.lastLogin
        };

        const session = {
          sessionToken,
          userId: safeUser.userId,
          role: safeUser.role,
          loginTimestamp: now,
          lastActivity: now,
          expiresAt: now + (rememberMe ? REMEMBER_ME_TIMEOUT : SESSION_ABSOLUTE_TIMEOUT),
          rememberMe: rememberMe,
          userProfile: safeUser
        };

        saveActiveSession(session);
        return { success: true, redirect: ROUTE_CONFIG[safeUser.role] };
      } else {
        return { success: false, message: "Invalid email or password." };
      }
    }
  },

  // Logout current user
  async logout() {
    const session = getActiveSession();
    if (session) {
      if (window.isSupabaseActive()) {
        const supabase = window.getSupabaseClient();
        await supabase.auth.signOut();
      }
      if (window.skhs_db && typeof window.skhs_db.logActivity === 'function') {
        await window.skhs_db.logActivity('logout', 'auth', 'info', session.userId, null, `User manually logged out.`);
      }
      clearActiveSession();
    }
    window.location.href = "login.html";
  },

  // Get currently logged in user info (no password)
  getCurrentUser() {
    const session = getActiveSession();
    if (!session) return null;
    return session.userProfile || null;
  },

  // Check if role has permission
  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (!user) return false;
    const allowedRoles = PERMISSIONS[permission];
    return allowedRoles ? allowedRoles.includes(user.role) : false;
  },

  // Route Guard: user must be logged in
  requireAuth() {
    const user = this.getCurrentUser();
    if (!user) {
      clearActiveSession();
      window.location.href = "login.html";
      return false;
    }
    return true;
  },

  // Route Guard: user must have specific permission
  requirePermission(permission) {
    if (!this.requireAuth()) return false;
    if (!this.hasPermission(permission)) {
      const user = this.getCurrentUser();
      if (user && ROUTE_CONFIG[user.role]) {
        window.location.href = ROUTE_CONFIG[user.role];
      } else {
        window.location.href = "login.html";
      }
      return false;
    }
    return true;
  },

  // Password Recovery Part 1: Verify and request token
  async forgotPasswordRequest(email) {
    email = normalizeEmail(email);
    if (!email) return { success: false, message: "Please enter your email." };
    
    if (window.isSupabaseActive()) {
      const supabase = window.getSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login.html?reset=true'
      });
      if (error) return { success: false, message: error.message };
      return { success: true, message: "A recovery code and reset instructions have been dispatched by email." };
    } else {
      // LocalStorage Recovery code
      const localUsers = JSON.parse(localStorage.getItem("skhs_db_users") || "[]");
      const user = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return { success: false, message: "If that email exists, a recovery code will be generated." };
      }
      const token = window.skhs_security.createNumericCode(6);
      sessionStorage.setItem(getResetTokenKey(email), JSON.stringify({
        token,
        userId: user.userId,
        attempts: 0,
        expires: Date.now() + 10 * 60 * 1000
      }));
      return { success: true, message: "A simulated email has been dispatched with your code.", token };
    }
  },

  // Password Recovery Part 2: Verify code
  verifyResetToken(email, token) {
    email = normalizeEmail(email);
    token = String(token ?? '').trim();
    const tokenKey = getResetTokenKey(email);
    const tokenDataStr = sessionStorage.getItem(tokenKey);
    if (!tokenDataStr) return { success: false, message: "No active recovery session found." };

    let tokenData;
    try {
      tokenData = JSON.parse(tokenDataStr);
    } catch (err) {
      sessionStorage.removeItem(tokenKey);
      return { success: false, message: "Recovery session is invalid. Request a new code." };
    }

    if (Date.now() > tokenData.expires) {
      sessionStorage.removeItem(tokenKey);
      return { success: false, message: "Reset token has expired. Request a new one." };
    }

    if (tokenData.token !== token) {
      tokenData.attempts = (tokenData.attempts || 0) + 1;
      if (tokenData.attempts >= MAX_RESET_ATTEMPTS) {
        sessionStorage.removeItem(tokenKey);
        return { success: false, message: "Too many invalid reset attempts. Request a new code." };
      }
      sessionStorage.setItem(tokenKey, JSON.stringify(tokenData));
      return { success: false, message: "Invalid reset token." };
    }

    return { success: true };
  },

  // Password Recovery Part 3: Apply new password
  async resetPasswordUpdate(email, token, newPassword) {
    email = normalizeEmail(email);
    
    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) return { success: false, message: strength.message };

    if (window.isSupabaseActive()) {
      const supabase = window.getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, message: error.message };
      return { success: true, message: "Password updated successfully!" };
    } else {
      const verify = this.verifyResetToken(email, token);
      if (!verify.success) return verify;

      const localUsers = JSON.parse(localStorage.getItem("skhs_db_users") || "[]");
      const idx = localUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (idx === -1) return { success: false, message: "User not found." };

      const hashedPwd = await window.skhs_sha256(newPassword);
      localUsers[idx].password = hashedPwd;
      localUsers[idx].isDefaultPassword = false;
      localStorage.setItem("skhs_db_users", JSON.stringify(localUsers));

      sessionStorage.removeItem(getResetTokenKey(email));
      return { success: true, message: "Password updated successfully!" };
    }
  },

  // Inside profile: Change Password
  async changePassword(userId, oldPassword, newPassword) {
    const user = this.getCurrentUser();
    if (!user || user.userId !== userId) {
      return { success: false, message: "You can only change your own password." };
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) return { success: false, message: strength.message };

    if (window.isSupabaseActive()) {
      const supabase = window.getSupabaseClient();
      
      // Update password via Auth API
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) return { success: false, message: authError.message };

      // Update flag in profile details
      await supabase.from('users').update({ is_default_password: false }).eq('id', userId);
      
      // Sync cache
      const session = getActiveSession();
      if (session && session.userProfile) {
        session.userProfile.isDefaultPassword = false;
        saveActiveSession(session);
      }

      await window.skhs_db.logActivity('password_change', 'profile', 'info', userId, null, `Password updated successfully.`);
      return { success: true, message: "Password updated successfully!" };
    } else {
      // LocalStorage Password change
      const localUsers = JSON.parse(localStorage.getItem("skhs_db_users") || "[]");
      const idx = localUsers.findIndex(u => u.userId === userId);
      if (idx === -1) return { success: false, message: "User not found." };

      const oldHash = await window.skhs_sha256(oldPassword);
      if (oldHash !== localUsers[idx].password) {
        return { success: false, message: "Incorrect current password." };
      }

      const newHash = await window.skhs_sha256(newPassword);
      localUsers[idx].password = newHash;
      localUsers[idx].isDefaultPassword = false;
      localStorage.setItem("skhs_db_users", JSON.stringify(localUsers));

      const session = getActiveSession();
      if (session && session.userProfile) {
        session.userProfile.isDefaultPassword = false;
        saveActiveSession(session);
      }

      return { success: true, message: "Password updated successfully!" };
    }
  },

  // Update contact details and profile photo
  async updateProfile(userId, fullName, mobileNumber, profilePhoto) {
    const user = this.getCurrentUser();
    if (!user || user.userId !== userId) {
      return { success: false, message: "You can only update your own profile." };
    }

    const updates = {};
    if (fullName !== null && fullName !== undefined) {
      const safeName = window.skhs_security.normalizeText(fullName, 80);
      if (safeName.length < 2) {
        return { success: false, message: "Full name must contain at least 2 characters." };
      }
      updates.fullName = safeName;
    }

    if (mobileNumber !== null && mobileNumber !== undefined) {
      const safeMobile = window.skhs_security.normalizeText(mobileNumber, 24);
      if (!window.skhs_security.isValidMobileNumber(safeMobile)) {
        return { success: false, message: "Please enter a valid mobile number." };
      }
      updates.mobileNumber = safeMobile;
    }

    const session = getActiveSession();
    if (!session) return { success: false, message: "No active session." };
    
    const updatedUser = { ...session.userProfile, ...updates };

    if (window.isSupabaseActive()) {
      const supabase = window.getSupabaseClient();
      
      const dbUpdates = {};
      if (updates.fullName) dbUpdates.full_name = updates.fullName;
      if (updates.mobileNumber) dbUpdates.mobile_number = updates.mobileNumber;

      // Handle Storage Upload
      if (profilePhoto !== null && profilePhoto !== undefined) {
        if (!window.skhs_security.isAllowedImageDataUrl(profilePhoto)) {
          return { success: false, message: "Profile photo must be a PNG, JPG, WebP, or GIF under 1MB." };
        }
        
        const fileData = dataURLtoBlob(profilePhoto);
        if (fileData) {
          const fileExtension = fileData.mime.split('/')[1] || 'png';
          const filePath = `photos/${userId}.${fileExtension}`;
          
          const { error: uploadError } = await supabase.storage
            .from('school-media')
            .upload(filePath, fileData.blob, { upsert: true, contentType: fileData.mime });

          if (uploadError) {
            return { success: false, message: "Failed to upload image: " + uploadError.message };
          }

          const { data: publicUrlData } = supabase.storage
            .from('school-media')
            .getPublicUrl(filePath);

          dbUpdates.profile_photo = publicUrlData.publicUrl;
          updatedUser.profilePhoto = publicUrlData.publicUrl;
        }
      }

      // Update name and phone/photo in DB
      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await supabase.from('users').update(dbUpdates).eq('id', userId);
        if (error) {
          console.error("[AUTH] Profile update failed:", error);
          return { success: false, message: "Database update failed: " + error.message };
        }
      }

      session.userProfile = updatedUser;
      saveActiveSession(session);
      
      // Update in skhs_db cache
      window.skhs_db.update('users', 'id', userId, dbUpdates);

      return { success: true, user: updatedUser };

    } else {
      // LocalStorage Fallback profile update
      if (profilePhoto !== null && profilePhoto !== undefined) {
        if (!window.skhs_security.isAllowedImageDataUrl(profilePhoto)) {
          return { success: false, message: "Profile photo must be a PNG, JPG, WebP, or GIF under 1MB." };
        }
        updates.profilePhoto = profilePhoto;
      }

      const localUsers = JSON.parse(localStorage.getItem("skhs_db_users") || "[]");
      const idx = localUsers.findIndex(u => u.userId === userId);
      if (idx === -1) return { success: false, message: "User not found." };

      localUsers[idx] = { ...localUsers[idx], ...updates };
      localStorage.setItem("skhs_db_users", JSON.stringify(localUsers));

      const safeUser = { ...updatedUser, ...updates };
      const session = getActiveSession();
      if (session) {
        session.userProfile = safeUser;
        saveActiveSession(session);
      }

      return { success: true, user: safeUser };
    }
  }
};

// Start session activity monitoring on loading this script
document.addEventListener('DOMContentLoaded', () => {
  initActivityTracker();
});

window.skhs_auth = auth;
