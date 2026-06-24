// ============================================================
//  Sri Kakatiya School Management Platform – db.js
//  Local storage database management and seed utilities
// ============================================================

const DB_PREFIX = "skhs_db_";
const DB_VERSION = "7"; // Bump this number to force a full re-seed of localStorage
const DB_VERSION_KEY = "skhs_db_version";
const ALLOWED_COLLECTIONS = ['users', 'audit_logs', 'notifications', 'messages', 'students', 'teachers', 'parents', 'classes', 'subjects', 'attendance', 'exams', 'marks', 'homework', 'fees', 'settings', 'academic_years', 'promotions', 'leave_requests', 'calendar_events'];
const ALLOWED_NOTIFICATION_TYPES = ['info', 'success', 'warning', 'alert'];
const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
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

// Ensure createId is global for other files to access
window.createId = function(prefix) {
  return `${prefix}-${createRandomString(12)}`;
};

function createId(prefix) {
  return window.createId(prefix);
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
  const match = value.match(/^data:(image\/(?:png|jpeg|webp|gif|svg\+xml));base64,/i);
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
    localStorage.removeItem("skhs_active_session");
    sessionStorage.removeItem("skhs_active_session");
    localStorage.setItem(DB_VERSION_KEY, DB_VERSION);
  }

  ALLOWED_COLLECTIONS.forEach(col => {
    if (!localStorage.getItem(getStorageKey(col))) {
      localStorage.setItem(getStorageKey(col), JSON.stringify([]));
    }
  });

  // 1. Seed users if empty
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
        profilePhoto: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzFlMjkzYiIvPgogIDwhLS0gSGVhZC9mYWNlIC0tPgogIDxjaXJjbGUgY3g9IjUwIiBjeT0iNDUiIHI9IjIwIiBmaWxsPSIjZmJjZmU4Ii8+CiAgPCEtLSBIYWlyIC0tPgogIDxwYXRoIGQ9Ik0zMCA0NSBDMzAgMjUsIDcwIDI1LCA3MCA0NSBDNzAgNTUsIDY1IDYwLCA2MCA1NSBDNTUgNTAsIDQ1IDUwLCA0MCA1NSBDMzUgNjAsIDMwIDU1LCAzMCA0NSBaIiBmaWxsPSIjNDc1NTY5Ii8+CiAgPCEtLSBCb2R5L2NvbGxhciAtLT4KICA8cGF0aCBkPSJNMjAgOTAgQzIwIDcwLCA4MCA3MCwgODAgOTAgWiIgZmlsbD0iIzNiODJmNiIvPgo8L3N2Zz4=",
        status: "active",
        failedLoginAttempts: 0,
        lockUntil: null,
        createdDate: new Date().toISOString(),
        lastLogin: null,
        accountActive: true,
        isDefaultPassword: false
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
      },
      {
        userId: "USR-005",
        fullName: "Smt. G. Lakshmi",
        email: "lakshmi.g@srikakatiya.com",
        mobileNumber: "9123456780",
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
        userId: "USR-006",
        fullName: "Venkata Ramanappa",
        email: "ramanappa@gmail.com",
        mobileNumber: "9876543210",
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
        userId: "USR-007",
        fullName: "M. Preethi",
        email: "preethi@srikakatiya.com",
        mobileNumber: "9876543210",
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
  }

  // 2. Seed notifications if empty
  const notifications = safeParseArray(localStorage.getItem(getStorageKey('notifications')));
  if (notifications.length === 0) {
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
  }

  // 3. Seed audit logs if empty
  const logs = safeParseArray(localStorage.getItem(getStorageKey('audit_logs')));
  if (logs.length === 0) {
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

  // 4. Seed settings if empty
  const settings = safeParseArray(localStorage.getItem(getStorageKey('settings')));
  if (settings.length === 0) {
    const seedSettings = [
      {
        schoolName: "Sri Kakatiya High School",
        schoolLogo: "",
        contactInfo: "Ph: +91 9100177682, Email: contact@srikakatiya.com",
        principalInfo: "Dr. Swathi Reddy",
        passwordPolicy: { minLength: 8, requireNumbers: true },
        sessionTimeout: 30
      }
    ];
    localStorage.setItem(getStorageKey('settings'), JSON.stringify(seedSettings));
  }

  // 5. Seed parents if empty
  const parents = safeParseArray(localStorage.getItem(getStorageKey('parents')));
  if (parents.length === 0) {
    const seedParents = [
      { parentId: "PRN-3001", fullName: "Madhusudhan Rao", mobileNumber: "9988776655", email: "parent@srikakatiya.com", occupation: "Business", linkedStudents: ["STD-1001"] },
      { parentId: "PRN-3002", fullName: "Venkata Ramanappa", mobileNumber: "9876543210", email: "ramanappa@gmail.com", occupation: "Agriculture", linkedStudents: ["STD-1002"] },
      { parentId: "PRN-3003", fullName: "M. Srinivasa Rao", mobileNumber: "9440123456", email: "srinivas@yahoo.com", occupation: "Engineer", linkedStudents: ["STD-1003", "STD-1004"] }
    ];
    localStorage.setItem(getStorageKey('parents'), JSON.stringify(seedParents));
  }

  // 6. Seed teachers if empty
  const teachers = safeParseArray(localStorage.getItem(getStorageKey('teachers')));
  if (teachers.length === 0) {
    const seedTeachers = [
      { teacherId: "TCH-2001", fullName: "K. Raghupathi", qualification: "M.Sc, B.Ed", subject: "Mathematics", assignedClasses: ["class-10", "class-9"], email: "teacher@srikakatiya.com", phone: "9848022338", experience: "12 Years", status: "Active" },
      { teacherId: "TCH-2002", fullName: "Smt. G. Lakshmi", qualification: "M.A, B.Ed", subject: "English", assignedClasses: ["class-8", "class-7"], email: "lakshmi.g@srikakatiya.com", phone: "9123456780", experience: "8 Years", status: "Active" },
      { teacherId: "TCH-2003", fullName: "Sri P. Kumar", qualification: "M.Sc (Physics)", subject: "Science", assignedClasses: ["class-10", "class-8"], email: "kumar.p@srikakatiya.com", phone: "9000123456", experience: "10 Years", status: "Active" },
      { teacherId: "TCH-2004", fullName: "Smt. T. Radha", qualification: "B.A, B.Ed", subject: "Social Studies", assignedClasses: ["class-9", "class-6"], email: "radha.t@srikakatiya.com", phone: "9885566778", experience: "6 Years", status: "Active" }
    ];
    localStorage.setItem(getStorageKey('teachers'), JSON.stringify(seedTeachers));
  }

  // 7. Seed classes if empty
  const classes = safeParseArray(localStorage.getItem(getStorageKey('classes')));
  if (classes.length === 0) {
    const seedClasses = [
      { classId: "class-nursery", name: "Nursery", classTeacherId: "TCH-2004" },
      { classId: "class-lkg", name: "LKG", classTeacherId: "TCH-2002" },
      { classId: "class-ukg", name: "UKG", classTeacherId: "TCH-2002" },
      { classId: "class-1", name: "Class 1", classTeacherId: "TCH-2002" },
      { classId: "class-2", name: "Class 2", classTeacherId: "TCH-2004" },
      { classId: "class-3", name: "Class 3", classTeacherId: "TCH-2004" },
      { classId: "class-4", name: "Class 4", classTeacherId: "TCH-2003" },
      { classId: "class-5", name: "Class 5", classTeacherId: "TCH-2003" },
      { classId: "class-6", name: "Class 6", classTeacherId: "TCH-2004" },
      { classId: "class-7", name: "Class 7", classTeacherId: "TCH-2002" },
      { classId: "class-8", name: "Class 8", classTeacherId: "TCH-2003" },
      { classId: "class-9", name: "Class 9", classTeacherId: "TCH-2004" },
      { classId: "class-10", name: "Class 10", classTeacherId: "TCH-2001" }
    ];
    localStorage.setItem(getStorageKey('classes'), JSON.stringify(seedClasses));
  }

  // 8. Seed students if empty
  const students = safeParseArray(localStorage.getItem(getStorageKey('students')));
  if (students.length === 0) {
    const seedStudents = [
      { studentId: "STD-1001", fullName: "K. Sai Kiran", dob: "2012-05-15", gender: "Male", classId: "class-10", section: "A", rollNumber: "1", parentId: "PRN-3001", classTeacherId: "TCH-2001", phone: "9900112233", address: "H.No: 12-4-5, Bramhanapalli, Guntur", admissionDate: "2018-06-12", status: "Active" },
      { studentId: "STD-1002", fullName: "M. Preethi", dob: "2013-09-20", gender: "Female", classId: "class-10", section: "A", rollNumber: "2", parentId: "PRN-3002", classTeacherId: "TCH-2001", phone: "9876543210", address: "Guntur Road, Narasaraopet", admissionDate: "2018-06-14", status: "Active" },
      { studentId: "STD-1003", fullName: "V. Rajesh", dob: "2013-02-10", gender: "Male", classId: "class-9", section: "B", rollNumber: "1", parentId: "PRN-3003", classTeacherId: "TCH-2004", phone: "9440123456", address: "Brookepeet, Guntur", admissionDate: "2019-06-08", status: "Active" },
      { studentId: "STD-1004", fullName: "P. Harshitha", dob: "2014-11-22", gender: "Female", classId: "class-9", section: "B", rollNumber: "2", parentId: "PRN-3003", classTeacherId: "TCH-2004", phone: "9440123456", address: "Srinivasa Nagar, Guntur", admissionDate: "2019-06-10", status: "Active" },
      { studentId: "STD-1005", fullName: "A. Akhil", dob: "2015-07-04", gender: "Male", classId: "class-8", section: "A", rollNumber: "1", parentId: "PRN-3002", classTeacherId: "TCH-2003", phone: "9123456789", address: "Nallapadu, Guntur", admissionDate: "2020-06-15", status: "Active" }
    ];
    localStorage.setItem(getStorageKey('students'), JSON.stringify(seedStudents));
  }

  // 9. Seed subjects if empty
  const subjects = safeParseArray(localStorage.getItem(getStorageKey('subjects')));
  if (subjects.length === 0) {
    const seedSubjects = [
      { subjectId: "sub-1", name: "English", teacherId: "TCH-2002", classId: "class-10" },
      { subjectId: "sub-2", name: "Mathematics", teacherId: "TCH-2001", classId: "class-10" },
      { subjectId: "sub-3", name: "Science", teacherId: "TCH-2003", classId: "class-10" },
      { subjectId: "sub-4", name: "Social Studies", teacherId: "TCH-2004", classId: "class-10" },
      { subjectId: "sub-5", name: "Telugu", teacherId: "TCH-2002", classId: "class-10" },
      { subjectId: "sub-6", name: "Hindi", teacherId: "TCH-2004", classId: "class-10" },
      { subjectId: "sub-7", name: "Computer Science", teacherId: "TCH-2003", classId: "class-10" }
    ];
    localStorage.setItem(getStorageKey('subjects'), JSON.stringify(seedSubjects));
  }

  // 10. Seed attendance if empty
  const attendance = safeParseArray(localStorage.getItem(getStorageKey('attendance')));
  if (attendance.length === 0) {
    const seedAttendance = [];
    const dateToday = new Date().toISOString().split('T')[0];
    const dateYesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const currentStudents = safeParseArray(localStorage.getItem(getStorageKey('students')));
    currentStudents.forEach((student, idx) => {
      seedAttendance.push({
        attendanceId: "ATT-" + (10000 + idx * 2),
        date: dateToday,
        studentId: student.studentId,
        classId: student.classId,
        status: idx % 4 === 0 ? "Absent" : "Present",
        academicYear: "AY-2026-27"
      });
      seedAttendance.push({
        attendanceId: "ATT-" + (10001 + idx * 2),
        date: dateYesterday,
        studentId: student.studentId,
        classId: student.classId,
        status: idx % 5 === 0 ? "Absent" : "Present",
        academicYear: "AY-2026-27"
      });
    });
    localStorage.setItem(getStorageKey('attendance'), JSON.stringify(seedAttendance));
  }

  // 11. Seed exams if empty
  const exams = safeParseArray(localStorage.getItem(getStorageKey('exams')));
  if (exams.length === 0) {
    const seedExams = [
      { examId: "EXM-501", name: "Quarterly Exam", type: "Quarterly", classId: "class-10", subjectId: "sub-2", date: "2026-09-15", published: true, academicYear: "AY-2026-27" },
      { examId: "EXM-502", name: "Unit Test 1", type: "Unit Test", classId: "class-10", subjectId: "sub-3", date: "2026-07-10", published: true, academicYear: "AY-2026-27" }
    ];
    localStorage.setItem(getStorageKey('exams'), JSON.stringify(seedExams));
  }

  // 12. Seed marks if empty
  const marks = safeParseArray(localStorage.getItem(getStorageKey('marks')));
  if (marks.length === 0) {
    const seedMarks = [
      { markId: "MRK-601", examId: "EXM-501", studentId: "STD-1001", marksObtained: 85, maxMarks: 100, academicYear: "AY-2026-27" },
      { markId: "MRK-602", examId: "EXM-501", studentId: "STD-1002", marksObtained: 92, maxMarks: 100, academicYear: "AY-2026-27" },
      { markId: "MRK-603", examId: "EXM-502", studentId: "STD-1001", marksObtained: 22, maxMarks: 25, academicYear: "AY-2026-27" },
      { markId: "MRK-604", examId: "EXM-502", studentId: "STD-1002", marksObtained: 24, maxMarks: 25, academicYear: "AY-2026-27" }
    ];
    localStorage.setItem(getStorageKey('marks'), JSON.stringify(seedMarks));
  }

  // 13. Seed homework if empty
  const homework = safeParseArray(localStorage.getItem(getStorageKey('homework')));
  if (homework.length === 0) {
    const seedHomework = [
      { homeworkId: "HW-701", classId: "class-10", subjectId: "sub-2", title: "Algebra Assignment", description: "Solve exercises 4.1 to 4.3 in math notebook.", dateAssigned: "2026-06-20", dueDate: "2026-06-25", completedStudents: ["STD-1001"], academicYear: "AY-2026-27" },
      { homeworkId: "HW-702", classId: "class-10", subjectId: "sub-3", title: "Photosynthesis Diagram", description: "Draw and label the photosynthesis process diagram.", dateAssigned: "2026-06-21", dueDate: "2026-06-24", completedStudents: [], academicYear: "AY-2026-27" }
    ];
    localStorage.setItem(getStorageKey('homework'), JSON.stringify(seedHomework));
  }

  // 14. Seed fees if empty
  const fees = safeParseArray(localStorage.getItem(getStorageKey('fees')));
  if (fees.length === 0) {
    const seedFees = [
      { feeId: "FEE-801", studentId: "STD-1001", feeType: "Tuition Fee", amount: 15000, dueDate: "2026-07-31", status: "Paid", paymentHistory: [{ paymentId: "PAY-901", date: "2026-06-10", amount: 15000, method: "Online" }], academicYear: "AY-2026-27" },
      { feeId: "FEE-802", studentId: "STD-1002", feeType: "Tuition Fee", amount: 15000, dueDate: "2026-07-31", status: "Pending", paymentHistory: [], academicYear: "AY-2026-27" },
      { feeId: "FEE-803", studentId: "STD-1003", feeType: "Tuition Fee", amount: 12000, dueDate: "2026-07-31", status: "Pending", paymentHistory: [], academicYear: "AY-2026-27" }
    ];
    localStorage.setItem(getStorageKey('fees'), JSON.stringify(seedFees));
  }

  // 15. Seed academic_years if empty
  const academicYears = safeParseArray(localStorage.getItem(getStorageKey('academic_years')));
  if (academicYears.length === 0) {
    const seedAYs = [
      { ayId: "AY-2025-26", name: "2025-26", startDate: "2025-06-01", endDate: "2026-04-30", status: "Archived" },
      { ayId: "AY-2026-27", name: "2026-27", startDate: "2026-06-01", endDate: "2027-04-30", status: "Active" },
      { ayId: "AY-2027-28", name: "2027-28", startDate: "2027-06-01", endDate: "2028-04-30", status: "Archived" }
    ];
    localStorage.setItem(getStorageKey('academic_years'), JSON.stringify(seedAYs));
  }

  // 16. Seed promotions if empty
  const promotions = safeParseArray(localStorage.getItem(getStorageKey('promotions')));
  if (promotions.length === 0) {
    const seedPromotions = [
      { promoId: "PRM-001", studentId: "STD-1001", prevClassId: "class-9", newClassId: "class-10", promoDate: "2026-05-15", ayId: "AY-2025-26" },
      { promoId: "PRM-002", studentId: "STD-1002", prevClassId: "class-9", newClassId: "class-10", promoDate: "2026-05-15", ayId: "AY-2025-26" }
    ];
    localStorage.setItem(getStorageKey('promotions'), JSON.stringify(seedPromotions));
  }

  // 17. Seed leave_requests if empty
  const leaveRequests = safeParseArray(localStorage.getItem(getStorageKey('leave_requests')));
  if (leaveRequests.length === 0) {
    const seedLeaves = [
      { leaveId: "LV-101", applicantId: "STD-1001", applicantName: "K. Sai Kiran", applicantType: "Student", reason: "Viral fever recovery", startDate: "2026-06-25", endDate: "2026-06-27", status: "Pending" },
      { leaveId: "LV-102", applicantId: "TCH-2001", applicantName: "K. Raghupathi", applicantType: "Teacher", reason: "Family wedding attendance", startDate: "2026-06-28", endDate: "2026-06-29", status: "Approved" }
    ];
    localStorage.setItem(getStorageKey('leave_requests'), JSON.stringify(seedLeaves));
  }

  // 18. Seed calendar_events if empty
  const calendarEvents = safeParseArray(localStorage.getItem(getStorageKey('calendar_events')));
  if (calendarEvents.length === 0) {
    const seedEvents = [
      { eventId: "EVT-001", title: "Quarterly Exam Starts", category: "Exam", startDate: "2026-09-15", endDate: "2026-09-22", description: "Term-1 Quarterly exams for all classes." },
      { eventId: "EVT-002", title: "Independence Day Holiday", category: "Holiday", startDate: "2026-08-15", endDate: "2026-08-15", description: "National holiday, flag hoisting at 8:00 AM." },
      { eventId: "EVT-003", title: "PTA General Body Meeting", category: "Meeting", startDate: "2026-07-05", endDate: "2026-07-05", description: "Meeting with parents to discuss syllabus plan." },
      { eventId: "EVT-004", title: "Annual Sports Day Meet", category: "Event", startDate: "2026-11-14", endDate: "2026-11-15", description: "Two-day athletic events for school students." }
    ];
    localStorage.setItem(getStorageKey('calendar_events'), JSON.stringify(seedEvents));
  }
}

// Helper methods to access collections
// ============================================================
// Supabase-to-LocalStorage Service Layer Core
// ============================================================

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str) {
  return str.replace(/([-_][a-z])/g, group =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
}

function mapKeys(obj, keyMappingFn) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => mapKeys(item, keyMappingFn));
  }
  if (typeof obj === 'object') {
    const mapped = {};
    Object.keys(obj).forEach(key => {
      let mappedKey = keyMappingFn(key);
      let val = obj[key];
      if (
        key !== 'paymentHistory' && 
        key !== 'payment_history' && 
        key !== 'passwordPolicy' && 
        key !== 'password_policy' && 
        val !== null && 
        typeof val === 'object'
      ) {
        val = mapKeys(val, keyMappingFn);
      }
      mapped[mappedKey] = val;
    });
    return mapped;
  }
  return obj;
}

function toSnake(obj) {
  return mapKeys(obj, camelToSnake);
}

function toCamel(obj) {
  return mapKeys(obj, snakeToCamel);
}

function preprocessToDB(collectionName, record) {
  if (!record) return record;
  const cloned = { ...record };
  if (collectionName === 'teachers' && Array.isArray(cloned.assignedClasses)) {
    cloned.assignedClasses = cloned.assignedClasses.join(',');
  }
  if (collectionName === 'parents' && Array.isArray(cloned.linkedStudents)) {
    cloned.linkedStudents = cloned.linkedStudents.join(',');
  }
  if (collectionName === 'homework' && Array.isArray(cloned.completedStudents)) {
    cloned.completedStudents = cloned.completedStudents.join(',');
  }
  return toSnake(cloned);
}

function postprocessFromDB(collectionName, record) {
  if (!record) return record;
  const cloned = toCamel(record);
  if (collectionName === 'teachers' && typeof cloned.assignedClasses === 'string') {
    cloned.assignedClasses = cloned.assignedClasses ? cloned.assignedClasses.split(',') : [];
  }
  if (collectionName === 'parents' && typeof cloned.linkedStudents === 'string') {
    cloned.linkedStudents = cloned.linkedStudents ? cloned.linkedStudents.split(',') : [];
  }
  if (collectionName === 'homework' && typeof cloned.completedStudents === 'string') {
    cloned.completedStudents = cloned.completedStudents ? cloned.completedStudents.split(',') : [];
  }
  return cloned;
}

// ============================================================
// Supabase Local Sync-Cache Layer & DOMContentLoaded Interceptor
// ============================================================
window.skhs_db_cache = {};
let isCacheSynced = false;
const domContentLoadedCallbacks = [];

// Intercept DOMContentLoaded to delay dashboard initialization until cache is ready
const originalAddEventListener = document.addEventListener;
document.addEventListener = function(type, listener, options) {
  if (type === 'DOMContentLoaded') {
    const hasActiveSession = sessionStorage.getItem("skhs_active_session") || localStorage.getItem("skhs_active_session");
    if (isCacheSynced || !window.isSupabaseActive() || !hasActiveSession) {
      originalAddEventListener.call(document, type, listener, options);
    } else {
      domContentLoadedCallbacks.push(listener);
    }
  } else {
    originalAddEventListener.call(document, type, listener, options);
  }
};

async function syncSupabaseCache() {
  if (!window.isSupabaseActive()) return;

  // Only sync if there is an active user session to prevent errors on the login screen
  const hasActiveSession = sessionStorage.getItem("skhs_active_session") || localStorage.getItem("skhs_active_session");
  if (!hasActiveSession) return;

  // Create loading overlay
  const overlay = document.createElement('div');
  overlay.id = 'supabase-loading-overlay';
  overlay.style = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(15, 23, 42, 0.96);
    color: #f8fafc;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    font-family: 'Inter', sans-serif;
  `;
  overlay.innerHTML = `
    <div style="font-size: 3.5rem; margin-bottom: 1.5rem; animation: skhs-pulse 1.5s infinite;">🦅</div>
    <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; letter-spacing: -0.025em;">Syncing with Supabase</div>
    <div style="font-size: 0.85rem; color: #94a3b8;">Loading school portal databases...</div>
    <style>
      @keyframes skhs-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.7; }
      }
    </style>
  `;
  document.body.appendChild(overlay);

  try {
    const supabase = window.getSupabaseClient();
    
    // Fetch all 19 tables in parallel
    const promises = ALLOWED_COLLECTIONS.map(async (col) => {
      const { data, error } = await supabase.from(col).select('*');
      if (error) {
        console.error(`[DATABASE] Cache fetch error for ${col}:`, error);
        window.skhs_db_cache[col] = [];
      } else {
        window.skhs_db_cache[col] = (data || []).map(row => postprocessFromDB(col, row));
      }
    });
    
    await Promise.all(promises);
    isCacheSynced = true;
    console.log("[DATABASE] Supabase local memory cache fully synced.");
  } catch (err) {
    console.error("[DATABASE] Failed to sync cache:", err);
  } finally {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    
    // Dispatch sync event
    window.dispatchEvent(new Event('skhs_db_synced'));
    
    // Trigger deferred DOMContentLoaded callbacks
    console.log(`[DATABASE] Triggering deferred DOMContentLoaded (${domContentLoadedCallbacks.length} listeners)...`);
    domContentLoadedCallbacks.forEach(cb => {
      try {
        cb(new Event('DOMContentLoaded'));
      } catch (err) {
        console.error("[DATABASE] Error in deferred DOMContentLoaded:", err);
      }
    });
  }
}

// Automatically start cache sync on load
if (document.readyState === 'loading') {
  originalAddEventListener.call(document, 'DOMContentLoaded', syncSupabaseCache);
} else {
  syncSupabaseCache();
}

const db = {
  // Synchronous read operations
  getCollection(name) {
    if (!ALLOWED_COLLECTIONS.includes(name)) return [];
    if (window.isSupabaseActive()) {
      return window.skhs_db_cache[name] || [];
    } else {
      return safeParseArray(localStorage.getItem(getStorageKey(name)));
    }
  },

  findOne(collectionName, key, value) {
    const data = this.getCollection(collectionName);
    return data.find(item => item[key] === value) || null;
  },

  find(collectionName, key, value) {
    const data = this.getCollection(collectionName);
    return data.filter(item => item[key] === value);
  },

  // Write operations (write to cache synchronously, then update Supabase in background)
  async saveCollection(name, data) {
    if (!ALLOWED_COLLECTIONS.includes(name) || !Array.isArray(data)) return false;
    if (window.isSupabaseActive()) {
      // Sync cache synchronously
      window.skhs_db_cache[name] = data;
      
      const supabase = window.getSupabaseClient();
      const mapped = data.map(item => preprocessToDB(name, item));
      const { error } = await supabase.from(name).upsert(mapped);
      if (error) {
        console.error(`[DATABASE] saveCollection error for ${name}:`, error);
        return false;
      }
      return true;
    } else {
      try {
        localStorage.setItem(getStorageKey(name), JSON.stringify(data));
        return true;
      } catch (err) {
        console.error("Unable to save local database collection.", err);
        return false;
      }
    }
  },

  // Insert a new record
  async insert(collectionName, record) {
    if (window.isSupabaseActive()) {
      const supabase = window.getSupabaseClient();
      
      // Update local cache synchronously so UI renders immediately
      if (!window.skhs_db_cache[collectionName]) {
        window.skhs_db_cache[collectionName] = [];
      }
      window.skhs_db_cache[collectionName].push(record);
      
      // Automatic Auth user creation for members (Student, Teacher, Parent)
      if (['students', 'teachers', 'parents'].includes(collectionName)) {
        try {
          let email = record.email;
          let role = 'student';
          let defaultPassword = 'School@321';
          
          if (collectionName === 'students') {
            role = 'student';
            defaultPassword = 'School@321';
            email = email || `${record.studentId.toLowerCase()}@srikakatiya.com`;
          } else if (collectionName === 'teachers') {
            role = 'teacher';
            defaultPassword = 'School@456';
          } else if (collectionName === 'parents') {
            role = 'parent';
            defaultPassword = 'School@789';
          }
          
          if (email) {
            console.log(`[DATABASE] Registering Auth user for new ${role}: ${email}`);
            
            const tempSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
              }
            });
            
            const { data: signUpData, error: signUpError } = await tempSupabase.auth.signUp({
              email: email,
              password: defaultPassword,
              options: {
                data: {
                  role: role,
                  full_name: record.fullName
                }
              }
            });
            
            if (signUpError) {
              console.warn(`[DATABASE] Automatic Auth SignUp failed/skipped for ${email}:`, signUpError.message);
            } else if (signUpData && signUpData.user) {
              console.log(`[DATABASE] Automatic Auth SignUp succeeded for ${email}, ID: ${signUpData.user.id}`);
              record.userId = signUpData.user.id;
              
              // Sync phone number to public.users table in background
              const phoneVal = record.phone || record.mobileNumber;
              if (phoneVal) {
                setTimeout(async () => {
                  await supabase.from('users').update({ mobile_number: phoneVal }).eq('id', signUpData.user.id);
                }, 500);
              }
            }
          }
        } catch (authErr) {
          console.error("[DATABASE] Error during automatic Auth creation:", authErr);
        }
      }

      const prepped = preprocessToDB(collectionName, record);
      const { data, error } = await supabase.from(collectionName).insert(prepped).select();
      if (error) {
        console.error(`[DATABASE] insert error for ${collectionName}:`, error);
        return null;
      }
      
      // Update cache with the returned database record
      if (data && data[0]) {
        const postPrepped = postprocessFromDB(collectionName, data[0]);
        if (window.skhs_db_cache[collectionName]) {
          const idx = window.skhs_db_cache[collectionName].findIndex(item => 
            (item.studentId && item.studentId === postPrepped.studentId) ||
            (item.teacherId && item.teacherId === postPrepped.teacherId) ||
            (item.parentId && item.parentId === postPrepped.parentId) ||
            (item.userId && item.userId === postPrepped.userId)
          );
          if (idx !== -1) {
            window.skhs_db_cache[collectionName][idx] = postPrepped;
          }
        }
        return postPrepped;
      }
      return record;
    } else {
      const data = await this.getCollection(collectionName);
      data.push(record);
      return (await this.saveCollection(collectionName, data)) ? record : null;
    }
  },

  // Update a record matching key:value
  async update(collectionName, key, value, updatedFields) {
    if (window.isSupabaseActive()) {
      const supabase = window.getSupabaseClient();
      
      // Update local cache synchronously so UI responds instantly
      if (window.skhs_db_cache[collectionName]) {
        const idx = window.skhs_db_cache[collectionName].findIndex(item => item[key] === value);
        if (idx !== -1) {
          window.skhs_db_cache[collectionName][idx] = { ...window.skhs_db_cache[collectionName][idx], ...updatedFields };
        }
      }
      
      const prepped = preprocessToDB(collectionName, updatedFields);
      const snakeKey = camelToSnake(key);
      const { data, error } = await supabase.from(collectionName).update(prepped).eq(snakeKey, value).select();
      if (error) {
        console.error(`[DATABASE] update error for ${collectionName}:`, error);
        return null;
      }
      
      if (data && data[0]) {
        const postPrepped = postprocessFromDB(collectionName, data[0]);
        if (window.skhs_db_cache[collectionName]) {
          const idx = window.skhs_db_cache[collectionName].findIndex(item => item[key] === value);
          if (idx !== -1) {
            window.skhs_db_cache[collectionName][idx] = postPrepped;
          }
        }
        return postPrepped;
      }
      return null;
    } else {
      const data = await this.getCollection(collectionName);
      const index = data.findIndex(item => item[key] === value);
      if (index !== -1) {
        data[index] = { ...data[index], ...updatedFields };
        return (await this.saveCollection(collectionName, data)) ? data[index] : null;
      }
      return null;
    }
  },

  // Delete a record
  async delete(collectionName, key, value) {
    if (window.isSupabaseActive()) {
      const supabase = window.getSupabaseClient();
      
      // Update local cache synchronously
      if (window.skhs_db_cache[collectionName]) {
        window.skhs_db_cache[collectionName] = window.skhs_db_cache[collectionName].filter(item => item[key] !== value);
      }
      
      const snakeKey = camelToSnake(key);
      const { error } = await supabase.from(collectionName).delete().eq(snakeKey, value);
      if (error) {
        console.error(`[DATABASE] delete error for ${collectionName}:`, error);
        return false;
      }
      return true;
    } else {
      let data = await this.getCollection(collectionName);
      const initialLength = data.length;
      data = data.filter(item => item[key] !== value);
      if (data.length === initialLength) return false;
      return await this.saveCollection(collectionName, data);
    }
  },

  // Create audit log entry
  async logActivity(actionType, module, severity, performedBy, targetRecord, details) {
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
    await this.insert('audit_logs', newLog);
    return newLog;
  },

  // Create user notification
  async addNotification(userId, title, message, type = 'info') {
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
    await this.insert('notifications', newNtf);
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
