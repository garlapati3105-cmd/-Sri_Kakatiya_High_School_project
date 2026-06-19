// ============================================================
//  Sri Kakatiya School Management Platform – db.js
//  Local storage database management and seed utilities
// ============================================================

const DB_PREFIX = "skhs_db_";
const DB_VERSION = "2"; // Bump this number to force a full re-seed of localStorage
const DB_VERSION_KEY = "skhs_db_version";
const ALLOWED_COLLECTIONS = ['users', 'audit_logs', 'notifications', 'messages'];
const ALLOWED_NOTIFICATION_TYPES = ['info', 'success', 'warning', 'alert'];
const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_PROFILE_PHOTO_BYTES = 1024 * 1024;

function getStorageKey(name) {
  return DB_PREFIX + name;
}

function safeParseArray(rawValue) {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Invalid local database payload was ignored.", err);
    return [];
  }
}

function removeControlCharacters(value) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
}

function normalizeText(value, maxLength = 160) {
  return removeControlCharacters(value).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeMultilineText(value, maxLength = 1200) {
  return removeControlCharacters(value)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

function normalizeEmail(value) {
  return normalizeText(value, 254).toLowerCase();
}

function isValidMobileNumber(value) {
  const normalized = normalizeText(value, 24);
  return /^\+?[0-9][0-9\s-]{7,18}[0-9]$/.test(normalized);
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return bytes;
  }
  // WARNING: Math.random() is NOT cryptographically secure.
  // This fallback is only reached in very old environments that lack SubtleCrypto.
  console.warn('[SECURITY] Falling back to Math.random() for random byte generation. This is NOT secure.');
  for (let i = 0; i < length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

function createRandomString(length = 16) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(length);
  let output = '';
  bytes.forEach(byte => {
    output += alphabet[byte % alphabet.length];
  });
  return output;
}

function createId(prefix) {
  return `${prefix}-${createRandomString(12)}`;
}

function createNumericCode(length = 6) {
  const bytes = randomBytes(length);
  let code = '';
  bytes.forEach(byte => {
    code += String(byte % 10);
  });
  return code;
}

function isAllowedImageFile(file) {
  return Boolean(
    file &&
    ALLOWED_IMAGE_MIME_TYPES.includes(file.type) &&
    file.size > 0 &&
    file.size <= MAX_PROFILE_PHOTO_BYTES
  );
}

function isAllowedImageDataUrl(value) {
  if (typeof value !== 'string') return false;
  const match = value.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,/i);
  if (!match || !ALLOWED_IMAGE_MIME_TYPES.includes(match[1].toLowerCase())) return false;
  const estimatedBytes = Math.ceil((value.length - value.indexOf(',') - 1) * 3 / 4);
  return estimatedBytes <= MAX_PROFILE_PHOTO_BYTES;
}

function clearElement(element) {
  if (!element) return;
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function appendTextElement(parent, tagName, text, className) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

// Demo seed account password hashes.
// Passwords: admin=School@123, teacher=School@456, parent=School@789, student=School@321
const SEED_PASSWORDS = {
  admin:   "6afbc76167e65b5d052b1762ad9ae6c9208740828ac1eaa2690a5606f43faf6c",
  teacher: "9a358ed6777d8c0286b4fb7f052b294d11a1fb6886e1586e1e76875377449471",
  parent:  "b474ff9df7b9f0a5320f922d3d0db835759ddaa5d377674b30172542cf3e0e2f",
  student: "c02dab1a545fed10f3d9a0f2d1fd2cc9ebd1ab7c4860615baa41441627816563"
};

// Simple hashing function to simulate SHA-256 in JavaScript
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check and initialize database tables
function initDatabase() {
  // If DB version doesn't match, wipe and re-seed everything
  if (localStorage.getItem(DB_VERSION_KEY) !== DB_VERSION) {
    ALLOWED_COLLECTIONS.forEach(col => localStorage.removeItem(getStorageKey(col)));
    localStorage.setItem(DB_VERSION_KEY, DB_VERSION);
  }

  ALLOWED_COLLECTIONS.forEach(col => {
    if (!localStorage.getItem(getStorageKey(col))) {
      localStorage.setItem(getStorageKey(col), JSON.stringify([]));
    }
  });

  // Seed default users if users table is empty
  const users = safeParseArray(localStorage.getItem(getStorageKey('users')));
  if (users.length === 0) {
    const seedUsers = [
      {
        userId: "USR-001",
        fullName: "Swathi Reddy",
        email: "admin@srikakatiya.com",
        mobileNumber: "9100177682",
        role: "admin",
        password: SEED_PASSWORDS.admin,
        profilePhoto: "",
        status: "active",
        failedLoginAttempts: 0,
        lockUntil: null,
        createdDate: new Date().toISOString(),
        lastLogin: null,
        accountActive: true,
        isDefaultPassword: true
      },
      {
        userId: "USR-002",
        fullName: "K. Raghupathi",
        email: "teacher@srikakatiya.com",
        mobileNumber: "9848022338",
        role: "teacher",
        password: SEED_PASSWORDS.teacher,
        profilePhoto: "",
        status: "active",
        failedLoginAttempts: 0,
        lockUntil: null,
        createdDate: new Date().toISOString(),
        lastLogin: null,
        accountActive: true,
        isDefaultPassword: true
      },
      {
        userId: "USR-003",
        fullName: "Madhusudhan Rao",
        email: "parent@srikakatiya.com",
        mobileNumber: "9988776655",
        role: "parent",
        password: SEED_PASSWORDS.parent,
        profilePhoto: "",
        status: "active",
        failedLoginAttempts: 0,
        lockUntil: null,
        createdDate: new Date().toISOString(),
        lastLogin: null,
        accountActive: true,
        isDefaultPassword: true
      },
      {
        userId: "USR-004",
        fullName: "K. Sai Kiran",
        email: "student@srikakatiya.com",
        mobileNumber: "9900112233",
        role: "student",
        password: SEED_PASSWORDS.student,
        profilePhoto: "",
        status: "active",
        failedLoginAttempts: 0,
        lockUntil: null,
        createdDate: new Date().toISOString(),
        lastLogin: null,
        accountActive: true,
        isDefaultPassword: true
      }
    ];

    localStorage.setItem(getStorageKey('users'), JSON.stringify(seedUsers));
    
    // Seed initial welcome notifications for each seeded user
    const welcomeNotifications = [
      {
        notificationId: "NTF-001",
        userId: "USR-001",
        title: "Welcome Administrator",
        message: "Your administrator account has been set up successfully. Please change your default password.",
        type: "warning",
        isRead: false,
        createdAt: Date.now()
      },
      {
        notificationId: "NTF-002",
        userId: "USR-002",
        title: "Portal Setup Complete",
        message: "Welcome to the Teacher Portal. You can view notifications and manage student profiles here.",
        type: "info",
        isRead: false,
        createdAt: Date.now()
      },
      {
        notificationId: "NTF-003",
        userId: "USR-003",
        title: "Parent Account Initialized",
        message: "Welcome to the Parent Portal. You can track your child's records once dashboards are loaded.",
        type: "info",
        isRead: false,
        createdAt: Date.now()
      },
      {
        notificationId: "NTF-004",
        userId: "USR-004",
        title: "Welcome Student",
        message: "Access your homework, study materials, and timetable dynamically here.",
        type: "info",
        isRead: false,
        createdAt: Date.now()
      }
    ];
    localStorage.setItem(getStorageKey('notifications'), JSON.stringify(welcomeNotifications));

    // Seed system audit log
    const seedLogs = [
      {
        logId: "LOG-000",
        actionType: "profile_update",
        module: "auth",
        severity: "info",
        performedBy: "system",
        targetRecord: null,
        timestamp: Date.now(),
        details: "Database initialized and seeded with default administrator, teacher, parent, and student accounts."
      }
    ];
    localStorage.setItem(getStorageKey('audit_logs'), JSON.stringify(seedLogs));
  }
}

// Helper methods to access collections
const db = {
  getCollection(name) {
    if (!ALLOWED_COLLECTIONS.includes(name)) return [];
    return safeParseArray(localStorage.getItem(getStorageKey(name)));
  },

  saveCollection(name, data) {
    if (!ALLOWED_COLLECTIONS.includes(name) || !Array.isArray(data)) return false;
    try {
      localStorage.setItem(getStorageKey(name), JSON.stringify(data));
      return true;
    } catch (err) {
      console.error("Unable to save local database collection.", err);
      return false;
    }
  },

  // Insert a new record
  insert(collectionName, record) {
    const data = this.getCollection(collectionName);
    data.push(record);
    return this.saveCollection(collectionName, data) ? record : null;
  },

  // Update a record matching key:value
  update(collectionName, key, value, updatedFields) {
    const data = this.getCollection(collectionName);
    const index = data.findIndex(item => item[key] === value);
    if (index !== -1) {
      data[index] = { ...data[index], ...updatedFields };
      return this.saveCollection(collectionName, data) ? data[index] : null;
    }
    return null;
  },

  // Find a single record matching key:value
  findOne(collectionName, key, value) {
    const data = this.getCollection(collectionName);
    return data.find(item => item[key] === value) || null;
  },

  // Find all records matching key:value
  find(collectionName, key, value) {
    const data = this.getCollection(collectionName);
    return data.filter(item => item[key] === value);
  },

  // Delete a record
  delete(collectionName, key, value) {
    let data = this.getCollection(collectionName);
    const initialLength = data.length;
    data = data.filter(item => item[key] !== value);
    if (data.length === initialLength) return false;
    return this.saveCollection(collectionName, data);
  },

  // Create audit log entry
  logActivity(actionType, module, severity, performedBy, targetRecord, details) {
    const allowedSeverity = ['info', 'warning', 'critical'].includes(severity) ? severity : 'info';
    const logId = createId("LOG");
    const newLog = {
      logId,
      actionType: normalizeText(actionType, 60),
      module: normalizeText(module, 60),
      severity: allowedSeverity,
      performedBy: normalizeText(performedBy, 80),
      targetRecord: targetRecord ? normalizeText(targetRecord, 80) : null,
      timestamp: Date.now(),
      details: normalizeMultilineText(details, 1000)
    };
    this.insert('audit_logs', newLog);
    return newLog;
  },

  // Create user notification
  addNotification(userId, title, message, type = 'info') {
    const normalizedType = ALLOWED_NOTIFICATION_TYPES.includes(type) ? type : 'info';
    const notificationId = createId("NTF");
    const newNtf = {
      notificationId,
      userId: normalizeText(userId, 40),
      title: normalizeText(title, 120),
      message: normalizeMultilineText(message, 1000),
      type: normalizedType,
      isRead: false,
      createdAt: Date.now()
    };
    this.insert('notifications', newNtf);
    return newNtf;
  },

  // Calculate profile completion percentage
  calculateCompletion(user) {
    if (!user) return 0;
    let completion = 0;
    
    // 1. Profile Photo (25%)
    if (user.profilePhoto && user.profilePhoto.trim() !== "") {
      completion += 25;
    }
    
    // 2. Contact details (Mobile complete) (25%)
    if (user.mobileNumber && user.mobileNumber.trim() !== "") {
      completion += 25;
    }
    
    // 3. Default password updated (25%)
    if (!user.isDefaultPassword) {
      completion += 25;
    }
    
    // 4. Account status active / Email populated (25%)
    if (user.email && user.email.trim() !== "" && user.accountActive) {
      completion += 25;
    }
    
    return completion;
  }
};

const dom = {
  showAlert(container, message, type = 'success', duration = 4000) {
    if (!container) return;
    const allowedTypes = ['success', 'error', 'info', 'warning'];
    const safeType = allowedTypes.includes(type) ? type : 'info';
    clearElement(container);

    const alert = document.createElement('div');
    alert.className = `portal-alert portal-alert-${safeType}`;

    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = safeType === 'success' ? '✅' : safeType === 'info' ? 'ℹ️' : '⚠️';

    const body = document.createElement('div');
    body.textContent = normalizeMultilineText(message, 500);

    alert.append(icon, body);
    container.appendChild(alert);

    if (duration > 0) {
      window.setTimeout(() => clearElement(container), duration);
    }
  },

  renderEmptyMessage(container, message, tagName = 'p') {
    clearElement(container);
    const empty = appendTextElement(container, tagName, message);
    empty.style.textAlign = 'center';
    empty.style.color = 'var(--portal-text-muted)';
    empty.style.fontSize = '0.85rem';
    return empty;
  },

  renderNotifications(container, notifications, onMarkRead, options = {}) {
    clearElement(container);

    if (!notifications.length) {
      this.renderEmptyMessage(container, 'No circulars found.');
      return;
    }

    notifications.forEach(notification => {
      const card = document.createElement('div');
      card.className = `notification-card ${notification.isRead ? '' : 'unread'}`.trim();

      const header = document.createElement('div');
      header.className = 'notification-card-header';

      const title = appendTextElement(header, 'div', notification.title, 'notification-card-title');
      if (options.colorByType) {
        if (notification.type === 'alert') title.style.color = 'var(--portal-error)';
        if (notification.type === 'warning') title.style.color = 'var(--portal-warning)';
      }

      const time = appendTextElement(
        header,
        'div',
        new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        'notification-card-time'
      );
      time.setAttribute('title', new Date(notification.createdAt).toLocaleString());

      const body = appendTextElement(card, 'div', notification.message, 'notification-card-body');
      body.style.whiteSpace = 'pre-wrap';

      card.prepend(header);

      if (!notification.isRead) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'notification-mark-read-btn';
        button.textContent = 'Mark as read';
        button.addEventListener('click', () => onMarkRead(notification.notificationId));
        card.appendChild(button);
      }

      container.appendChild(card);
    });
  },

  renderAuditLogs(tbody, logs) {
    clearElement(tbody);

    if (!logs.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 7;
      cell.style.textAlign = 'center';
      cell.textContent = 'No audit records found.';
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }

    logs.forEach(log => {
      const row = document.createElement('tr');
      const fields = [
        { text: log.logId, mono: true },
        { text: log.actionType, strong: true },
        { text: log.module },
        { badge: log.severity },
        { text: log.performedBy, small: true },
        { text: log.details },
        { text: new Date(log.timestamp).toLocaleString(), nowrap: true }
      ];

      fields.forEach(field => {
        const cell = document.createElement('td');
        if (field.mono) {
          cell.style.fontFamily = 'monospace';
          cell.style.fontSize = '0.75rem';
        }
        if (field.small) cell.style.fontSize = '0.8rem';
        if (field.nowrap) {
          cell.style.whiteSpace = 'nowrap';
          cell.style.fontSize = '0.75rem';
        }

        if (field.strong) {
          appendTextElement(cell, 'strong', field.text);
        } else if (field.badge) {
          const severity = ['critical', 'warning', 'info'].includes(field.badge) ? field.badge : 'info';
          const badge = appendTextElement(cell, 'span', severity, `badge badge-${severity}`);
          badge.textContent = severity.charAt(0).toUpperCase() + severity.slice(1);
        } else {
          cell.textContent = field.text ?? '';
        }
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });
  }
};

// Initialize
initDatabase();
window.skhs_security = {
  createId,
  createNumericCode,
  normalizeText,
  normalizeMultilineText,
  normalizeEmail,
  isAllowedImageFile,
  isAllowedImageDataUrl,
  isValidMobileNumber
};
window.skhs_dom = dom;
window.skhs_db = db;
window.skhs_sha256 = sha256;
