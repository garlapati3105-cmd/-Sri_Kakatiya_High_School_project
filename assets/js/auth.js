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

// Authentication API
const auth = {
  // Login flow with security restrictions
  async login(email, password, rememberMe = false, expectedRole = null) {
    email = normalizeEmail(email);
    expectedRole = expectedRole && ROUTE_CONFIG[expectedRole] ? expectedRole : null;

    if (!email || !password) {
      return { success: false, message: "Please fill in all fields." };
    }

    const user = window.skhs_db.findOne('users', 'email', email);
    if (!user) {
      window.skhs_db.logActivity('failed_login', 'auth', 'warning', 'system', null, `Failed login attempt for non-existent email: ${email}`);
      return { success: false, message: "Invalid email or password." };
    }

    if (expectedRole && user.role !== expectedRole) {
      window.skhs_db.logActivity('failed_login', 'auth', 'warning', user.userId, null, `Login role mismatch for ${email}.`);
      return { success: false, message: "Invalid email, password, or role." };
    }

    // Check lock state
    if (user.status === 'locked') {
      if (user.lockUntil && Date.now() > user.lockUntil) {
        // Unlock account
        window.skhs_db.update('users', 'userId', user.userId, {
          status: 'active',
          failedLoginAttempts: 0,
          lockUntil: null
        });
        user.status = 'active';
        user.failedLoginAttempts = 0;
      } else {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
        window.skhs_db.logActivity('failed_login', 'auth', 'warning', user.userId, null, `Attempt to log in to locked account: ${email}`);
        return { success: false, message: `Account is temporarily locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).` };
      }
    }

    // Validate password
    const hashedInput = await window.skhs_sha256(password);
    if (hashedInput === user.password) {
      // Reset attempts and update login time
      window.skhs_db.update('users', 'userId', user.userId, {
        failedLoginAttempts: 0,
        lockUntil: null,
        lastLogin: new Date().toISOString()
      });

      // Generate session
      const now = Date.now();
      const sessionToken = window.skhs_security.createId("SESS");
      const session = {
        sessionToken,
        userId: user.userId,
        role: user.role,
        loginTimestamp: now,
        lastActivity: now,
        expiresAt: now + (rememberMe ? REMEMBER_ME_TIMEOUT : SESSION_ABSOLUTE_TIMEOUT),
        rememberMe: rememberMe
      };

      saveActiveSession(session);
      window.skhs_db.logActivity('login', 'auth', 'info', user.userId, null, `Successful login from role: ${user.role}`);
      
      // Only set accountActive if it was never explicitly set (first-time data migration guard).
      // Do NOT silently re-activate an account that was deliberately deactivated by an admin.
      if (user.accountActive === undefined || user.accountActive === null) {
        window.skhs_db.update('users', 'userId', user.userId, { accountActive: true });
      }

      return { success: true, redirect: ROUTE_CONFIG[user.role] };
    } else {
      // Failed login logic
      const nextAttempts = (user.failedLoginAttempts || 0) + 1;
      const updates = { failedLoginAttempts: nextAttempts };
      let message = `Invalid email or password. Attempt ${nextAttempts} of 5.`;

      if (nextAttempts >= 5) {
        updates.status = 'locked';
        updates.lockUntil = Date.now() + 5 * 60 * 1000; // lock for 5 minutes
        message = "Incorrect password. Account is now locked for 5 minutes due to consecutive failed attempts.";
        window.skhs_db.logActivity('account_lock', 'auth', 'critical', user.userId, null, `User account locked due to excessive failed attempts.`);
      } else {
        window.skhs_db.logActivity('failed_login', 'auth', 'warning', user.userId, null, `Incorrect password entered for ${email} (attempt ${nextAttempts}/5)`);
      }

      window.skhs_db.update('users', 'userId', user.userId, updates);
      return { success: false, message };
    }
  },

  // Logout current user
  logout() {
    const session = getActiveSession();
    if (session) {
      window.skhs_db.logActivity('logout', 'auth', 'info', session.userId, null, `User manually logged out.`);
      clearActiveSession();
    }
    window.location.href = "login.html";
  },

  // Get currently logged in user info (no password)
  getCurrentUser() {
    const session = getActiveSession();
    if (!session) return null;

    const user = window.skhs_db.findOne('users', 'userId', session.userId);
    if (!user || user.status !== 'active' || user.role !== session.role) {
      clearActiveSession();
      return null;
    }

    // Return user details without password fields
    const { password, ...safeUser } = user;
    return safeUser;
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
      // Redirect to correct dashboard destination rather than showing raw error
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
  forgotPasswordRequest(email) {
    email = normalizeEmail(email);
    if (!email) return { success: false, message: "Please enter your email." };
    const user = window.skhs_db.findOne('users', 'email', email);
    if (!user) {
      window.skhs_db.logActivity('password_reset_request', 'auth', 'warning', 'system', null, `Failed reset request for non-existent email: ${email}`);
      return { success: false, message: "If that email exists, a recovery code will be generated." };
    }

    // Generate a 6-digit random token
    const token = window.skhs_security.createNumericCode(6);
    sessionStorage.setItem(getResetTokenKey(email), JSON.stringify({
      token,
      userId: user.userId,
      attempts: 0,
      expires: Date.now() + 10 * 60 * 1000 // expires in 10 minutes
    }));

    window.skhs_db.logActivity(
      'password_reset_request',
      'auth',
      'info',
      user.userId,
      null,
      `Password reset code generated for ${email}.`
    );

    // Return success along with token (simulated email code display in login panel)
    return { success: true, message: "A simulated email has been dispatched with your code.", token };
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
    const verify = this.verifyResetToken(email, token);
    if (!verify.success) return verify;

    const user = window.skhs_db.findOne('users', 'email', email);
    if (!user) return { success: false, message: "User not found." };

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) return { success: false, message: strength.message };

    const hashedPwd = await window.skhs_sha256(newPassword);
    
    // Update user record
    window.skhs_db.update('users', 'userId', user.userId, {
      password: hashedPwd,
      isDefaultPassword: false,
      failedLoginAttempts: 0,
      status: 'active',
      lockUntil: null
    });

    sessionStorage.removeItem(getResetTokenKey(email));
    
    window.skhs_db.logActivity(
      'password_reset_complete',
      'auth',
      'warning',
      user.userId,
      null,
      `User password reset complete.`
    );

    window.skhs_db.addNotification(
      user.userId,
      "Password Reset Successful",
      "Your password has been successfully reset. You can now log in with your new credentials.",
      "success"
    );

    return { success: true, message: "Password updated successfully!" };
  },

  // Inside profile: Change Password
  async changePassword(userId, oldPassword, newPassword) {
    if (!currentSessionOwnsUser(userId)) {
      return { success: false, message: "You can only change your own password." };
    }

    const user = window.skhs_db.findOne('users', 'userId', userId);
    if (!user) return { success: false, message: "User not found." };

    const oldHash = await window.skhs_sha256(oldPassword);
    if (oldHash !== user.password) {
      window.skhs_db.logActivity('password_change', 'profile', 'warning', userId, null, `Attempt to change password failed (wrong old password).`);
      return { success: false, message: "Incorrect current password." };
    }

    if (oldPassword === newPassword) {
      return { success: false, message: "New password must be different from the current password." };
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) return { success: false, message: strength.message };

    const newHash = await window.skhs_sha256(newPassword);
    window.skhs_db.update('users', 'userId', userId, {
      password: newHash,
      isDefaultPassword: false
    });

    window.skhs_db.logActivity('password_change', 'profile', 'info', userId, null, `Password updated successfully.`);
    window.skhs_db.addNotification(
      userId,
      "Password Changed",
      "Your profile password was changed successfully.",
      "success"
    );

    return { success: true, message: "Password updated successfully!" };
  },

  // Update contact details and profile photo
  updateProfile(userId, fullName, mobileNumber, profilePhoto) {
    if (!currentSessionOwnsUser(userId)) {
      return { success: false, message: "You can only update your own profile." };
    }

    const user = window.skhs_db.findOne('users', 'userId', userId);
    if (!user) return { success: false, message: "User not found." };

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

    if (profilePhoto !== null && profilePhoto !== undefined) {
      if (!window.skhs_security.isAllowedImageDataUrl(profilePhoto)) {
        return { success: false, message: "Profile photo must be a PNG, JPG, WebP, or GIF under 1MB." };
      }
      updates.profilePhoto = profilePhoto;
    }

    const updatedUser = window.skhs_db.update('users', 'userId', userId, updates);
    if (!updatedUser) {
      return { success: false, message: "Could not save profile changes. Storage may be full." };
    }
    
    window.skhs_db.logActivity('profile_update', 'profile', 'info', userId, null, `Updated profile contact/photo details.`);
    
    return { success: true, user: updatedUser };
  }
};

// Start session activity monitoring on loading this script
document.addEventListener('DOMContentLoaded', () => {
  initActivityTracker();
});

window.skhs_auth = auth;
