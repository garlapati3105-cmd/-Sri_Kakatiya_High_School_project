# 🦅 Sri Kakatiya High School – School Management Website

> *"We Give Wings To Your Child"*

A fully responsive, feature-rich school website with a built-in **role-based management portal** for Admins, Teachers, Parents, and Students. Built entirely with **vanilla HTML, CSS, and JavaScript** — no frameworks, no backend required.

---

## 🌐 Live Pages

| Page | Description |
|------|-------------|
| `index.html` | Public homepage with hero, stats, features, news, gallery, testimonials & contact |
| `about.html` | Detailed school history, vision, mission, and staff |
| `academics.html` | Curriculum overview, subjects, timetable, and academic calendar |
| `login.html` | Unified login portal with role-based routing and password recovery |
| `admin-dashboard.html` | Admin control panel — user management, audit logs, notifications |
| `teacher-portal.html` | Teacher dashboard — circulars, profile, and class tools |
| `parent-portal.html` | Parent portal — child progress, notifications, and profile |
| `student-portal.html` | Student portal — timetable, assignments, and notices |

---

## 🏫 About the School

**Sri Kakatiya High School** is a premier educational institution located in **Bagyanagar Colony, Shadnagar, Rangareddy District, Telangana**.

- 📅 Established: **2009**
- 🎓 Classes: **Nursery to Class X (SSC Board)**
- 👩‍🏫 Faculty: **25+ experienced teachers**
- 👦 Students: **800+ enrolled**
- 📊 Board Pass Rate: **98%**
- 🗣️ Medium: **Telugu & English**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 (Semantic) |
| Styling | Vanilla CSS3 (custom design system, animations, responsive grid) |
| Logic | Vanilla JavaScript (ES6+, async/await) |
| Storage | `localStorage` + `sessionStorage` (client-side DB) |
| Fonts | Google Fonts — Inter & Playfair Display |
| Crypto | Web Crypto API (`SubtleCrypto`) for SHA-256 password hashing |

---

## 🔐 Authentication & Security

The platform uses a custom-built authentication system (`assets/js/auth.js`) with the following security features:

| Feature | Details |
|---------|---------|
| **Password Hashing** | SHA-256 via Web Crypto API (`SubtleCrypto`) |
| **Account Lockout** | Locks after 5 consecutive failed login attempts for 5 minutes |
| **Session Management** | Inactivity timeout (15 min) + absolute session expiry (8 hours) |
| **Remember Me** | Optional 7-day persistent session via `localStorage` |
| **RBAC** | Role-Based Access Control — 4 roles with scoped permissions |
| **Route Guards** | `requireAuth()` and `requirePermission()` guard all portal pages |
| **Password Strength** | Enforces minimum length, letter+number mix, and blocks common passwords |
| **Password Reset** | 6-digit one-time code with 10-minute expiry and 5-attempt limit |

### 👥 Role-Permission Matrix

| Permission | Admin | Teacher | Parent | Student |
|-----------|:-----:|:-------:|:------:|:-------:|
| View Dashboard | ✅ | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ |
| Edit Profile | ✅ | ✅ | ✅ | ✅ |
| Teacher Workflows | ❌ | ✅ | ❌ | ❌ |
| Parent Views | ❌ | ❌ | ✅ | ❌ |
| Student Views | ❌ | ❌ | ❌ | ✅ |

---

## 🗄️ Local Database (`db.js`)

The app uses a lightweight, localStorage-backed database (`assets/js/db.js`) that mimics a real DB with collections, CRUD operations, and input sanitization.

### Collections

| Collection | Purpose |
|-----------|---------|
| `users` | All user accounts (admin, teacher, parent, student) |
| `notifications` | Per-user notification inbox |
| `audit_logs` | System-wide activity log for security tracking |
| `messages` | Reserved for inter-user messaging |

### Key API Methods

```js
db.insert(collection, record)           // Add a new record
db.findOne(collection, key, value)      // Find single record
db.find(collection, key, value)         // Find all matching records
db.update(collection, key, value, data) // Update a record
db.delete(collection, key, value)       // Delete a record
db.logActivity(...)                     // Write to audit log
db.addNotification(userId, ...)         // Send user notification
db.calculateCompletion(user)            // Profile completion %
```

### Input Sanitization

All data written to storage is sanitized through:
- `normalizeText(value, maxLength)` — strips control characters, trims whitespace
- `normalizeMultilineText(value, maxLength)` — preserves newlines, normalizes spacing
- `normalizeEmail(value)` — lowercase, trimmed, max 254 chars
- `isValidMobileNumber(value)` — validates international mobile formats

---

## 🔑 Demo Login Credentials

> ⚠️ These are **demo credentials** for testing. Change passwords after first login.

| Role | Email | Password |
|------|-------|----------|
| 🛠️ Admin | `admin@srikakatiya.com` | `School@123` |
| 👩‍🏫 Teacher | `teacher@srikakatiya.com` | `School@456` |
| 👨‍👩‍👧 Parent | `parent@srikakatiya.com` | `School@789` |
| 🎓 Student | `student@srikakatiya.com` | `School@321` |

---

## 📁 Project Structure

```
school-website/
│
├── index.html                  # Public homepage
├── about.html                  # About the school
├── academics.html              # Academics & curriculum
├── login.html                  # Login & password recovery
├── admin-dashboard.html        # Admin management panel
├── teacher-portal.html         # Teacher dashboard
├── parent-portal.html          # Parent dashboard
├── student-portal.html         # Student dashboard
│
├── assets/
│   ├── css/
│   │   ├── style.css           # Main public site styles
│   │   └── portal.css          # Shared portal styles (all 4 portals)
│   │
│   ├── js/
│   │   ├── db.js               # localStorage DB engine + DOM helpers
│   │   ├── auth.js             # Auth, sessions, RBAC, password management
│   │   └── main.js             # Public site interactivity (navbar, scroll, counters)
│   │
│   └── images/
│       └── hero.jpg            # Hero section background image
│
└── README.md                   # This file
```

---

## 🚀 Running Locally

This is a **100% static website** — no Node.js, npm, or build step required.

### Option 1 — Python HTTP Server (Recommended)
```bash
cd school-website
python -m http.server 5500
```
Then open: **http://localhost:5500**

### Option 2 — VS Code Live Server
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `index.html` → **"Open with Live Server"**

### Option 3 — Direct File
Simply open `index.html` in any modern browser.
> ⚠️ Some portal features (like profile photo upload) may require a local server due to browser security policies.

---

## ✨ Features Highlights

### Public Website
- 🎨 **Modern Design** — Glassmorphism, gradient backgrounds, smooth animations
- 📱 **Fully Responsive** — Mobile-first layout with hamburger navigation
- 🔢 **Animated Counters** — Stats that count up on scroll
- 📋 **Enquiry Form** — Contact form with client-side validation
- 🖼️ **Gallery Section** — School life photo gallery
- 📰 **News & Events** — Latest announcements display
- 💬 **Testimonials** — Parent reviews carousel

### Portal System
- 🔒 **Secure Login** — Hashed passwords, lockout, session expiry
- 🔔 **Notifications** — Per-user inbox with mark-as-read
- 👤 **Profile Management** — Edit name, mobile, profile photo (with 1MB limit)
- 🔑 **Password Change** — Old password verification + strength rules
- 📝 **Audit Trail** — Admin can view all system activity logs
- 🧹 **Session Cleanup** — Auto-logout on inactivity or browser close

---

## 📞 Contact Information

| Detail | Value |
|--------|-------|
| 📍 Address | Bagyanagar Colony, Shadnagar, Rangareddy, Telangana |
| 📞 Phone | +91 9100177682 |
| ✉️ Email | srikakatiyahighschool@gmail.com |
| 🕐 Office Hours | Monday – Saturday: 8:00 AM – 5:00 PM |

---

## 🙏 Acknowledgements

- Fonts by [Google Fonts](https://fonts.google.com/) (Inter & Playfair Display)
- Icons via Unicode Emoji
- Password hashing via the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

© 2026 Sri Kakatiya High School. All rights reserved.  
*Designed with ❤️ for excellence in education.*
