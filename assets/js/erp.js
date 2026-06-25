// ============================================================
//  Sri Kakatiya School Management Platform – erp.js
//  Complete ERP Controller containing logic, CRUD and widgets
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Guard checks
  if (!window.skhs_auth.requirePermission('VIEW_AUDIT_LOGS')) return;

  // Global variables & state
  let currentUser = window.skhs_auth.getCurrentUser();
  let chartInstances = {};

  // Theme toggle initialization
  const themeToggle = document.getElementById('theme-toggle');
  const htmlEl = document.documentElement;

  if (localStorage.getItem('portal_theme') === 'dark') {
    htmlEl.classList.add('dark-theme');
    themeToggle.textContent = '🌙';
  } else {
    htmlEl.classList.remove('dark-theme');
    themeToggle.textContent = '☀️';
  }

  themeToggle.addEventListener('click', () => {
    const isDark = htmlEl.classList.toggle('dark-theme');
    localStorage.setItem('portal_theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '🌙' : '☀️';
  });

  // Sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  sidebarToggle.addEventListener('click', () => {
    const isCollapsed = sidebar.classList.toggle('collapsed');
    sidebarToggle.textContent = isCollapsed ? '▶' : '◀';
    sidebarToggle.setAttribute('aria-label', isCollapsed ? 'Expand Menu' : 'Collapse Menu');
  });

  // Universal Modal Setup
  const modalBackdrop = document.getElementById('universal-modal-backdrop');
  const modalTitle = document.getElementById('universal-modal-title');
  const modalBody = document.getElementById('universal-modal-body');
  const modalClose = document.getElementById('universal-modal-close-btn');

  function openModal(title, htmlContent) {
    modalTitle.textContent = title;
    modalBody.innerHTML = htmlContent;
    modalBackdrop.style.display = 'flex';
  }

  function closeModal() {
    modalBackdrop.style.display = 'none';
    modalBody.innerHTML = '';
  }

  modalClose.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  // Sidebar Navigation tab views switching
  const menuLinks = document.querySelectorAll('.sidebar-link[data-tab]');
  const tabViews = document.querySelectorAll('.tab-view');
  const pageTitleLabel = document.getElementById('page-title-label');

  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute('data-tab');
      
      menuLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      tabViews.forEach(v => v.style.display = 'none');
      document.getElementById('tab-' + targetTab).style.display = 'block';

      // Update header title
      const titleMap = {
        'overview': 'Dashboard Home',
        'students': 'Student Directory',
        'teachers': 'Teacher Directory',
        'parents': 'Parent Profiles',
        'classes': 'Class & Section Management',
        'subjects': 'Subject Directory',
        'attendance': 'Attendance Manager',
        'exams': 'Exams Calendar',
        'marks': 'Grades & Marks Register',
        'homework': 'Homework Assignments',
        'fees': 'Finance & Fees Registry',
        'notifications': 'Circulars & System Announcements',
        'reports': 'ERP Reports Center',
        'audit-logs': 'System Audit Trails',
        'settings': 'ERP Configuration Settings',
        'profile': 'Account Profile'
      };
      pageTitleLabel.textContent = titleMap[targetTab] || 'Dashboard';
      
      // Load respective module data
      loadModule(targetTab);
    });
  });

  // Loader function for each module
  function loadModule(moduleName) {
    switch (moduleName) {
      case 'overview':
        renderDashboardStats();
        break;
      case 'students':
        loadStudentsList();
        break;
      case 'teachers':
        loadTeachersList();
        break;
      case 'parents':
        loadParentsList();
        break;
      case 'classes':
        loadClassesList();
        break;
      case 'subjects':
        loadSubjectsList();
        break;
      case 'attendance':
        initAttendanceModule();
        break;
      case 'exams':
        loadExamsList();
        break;
      case 'marks':
        initMarksModule();
        break;
      case 'homework':
        loadHomeworkList();
        break;
      case 'fees':
        loadFeesModule();
        break;
      case 'notifications':
        loadNotificationsModule();
        break;
      case 'reports':
        initReportsModule();
        break;
      case 'audit-logs':
        loadAuditLogs();
        break;
      case 'settings':
        loadSettingsModule();
        break;
      case 'profile':
        renderUserData();
        break;
      case 'academic-years':
        loadAcademicYearsList();
        break;
      case 'promotions':
        initPromotionsModule();
        break;
      case 'leaves':
        loadLeavesModule();
        break;
      case 'calendar':
        initCalendarModule();
        break;
      case 'backup-restore':
        initBackupRestoreModule();
        break;
      case 'id-generator':
        initIdGeneratorModule();
        break;
      case 'certificates':
        initCertificatesModule();
        break;
    }
  }

  // Helper alert display
  const alertContainer = document.getElementById('dashboard-alert-container');
  function showAlert(message, type = 'success') {
    window.skhs_dom.showAlert(alertContainer, message, type, 4000);
  }

  // ============================================================
  //  1. DASHBOARD OVERVIEW MODULE
  // ============================================================
  function renderDashboardStats() {
    const students = window.skhs_db.getCollection('students');
    const teachers = window.skhs_db.getCollection('teachers');
    const parents = window.skhs_db.getCollection('parents');
    const classes = window.skhs_db.getCollection('classes');
    const subjects = window.skhs_db.getCollection('subjects');
    const notifications = window.skhs_db.getCollection('notifications');
    const logs = window.skhs_db.getCollection('audit_logs');
    
    // Count active sessions (simulated via unique user interactions in audit logs)
    const activeUsersSet = new Set();
    logs.forEach(log => {
      if (log.performedBy && log.performedBy !== 'system') {
        activeUsersSet.add(log.performedBy);
      }
    });

    document.getElementById('kpi-students').textContent = students.length;
    document.getElementById('kpi-teachers').textContent = teachers.length;
    document.getElementById('kpi-parents').textContent = parents.length;
    document.getElementById('kpi-classes').textContent = classes.length;
    document.getElementById('kpi-subjects').textContent = subjects.length;
    document.getElementById('kpi-admissions').textContent = students.filter(s => s.status === 'Active').length;
    document.getElementById('kpi-notifications').textContent = notifications.length;
    document.getElementById('kpi-active-users').textContent = Math.max(1, activeUsersSet.size);

    // Recent Admissions Widget
    const widgetAdmissionsBody = document.getElementById('widget-admissions-tbody');
    widgetAdmissionsBody.innerHTML = '';
    // Sort descending by admissionDate
    const recentStudents = [...students].sort((a,b) => new Date(b.admissionDate) - new Date(a.admissionDate)).slice(0, 5);
    recentStudents.forEach(stud => {
      const cls = window.skhs_db.findOne('classes', 'classId', stud.classId);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${stud.studentId}</td>
        <td><strong>${stud.fullName}</strong></td>
        <td>${cls ? cls.name : stud.classId}</td>
        <td>${stud.admissionDate}</td>
      `;
      widgetAdmissionsBody.appendChild(row);
    });

    // Upcoming Events Widget
    const widgetEventsBody = document.getElementById('widget-events-tbody');
    widgetEventsBody.innerHTML = '';
    const activeAY = sessionStorage.getItem("skhs_active_ay");
    const exams = window.skhs_db.getCollection('exams').filter(ex => ex.academicYear === activeAY);
    const activeExams = exams.slice(0, 5);
    if(activeExams.length === 0) {
      widgetEventsBody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No upcoming exams scheduled.</td></tr>';
    } else {
      activeExams.forEach(ex => {
        const cls = window.skhs_db.findOne('classes', 'classId', ex.classId);
        const sub = window.skhs_db.findOne('subjects', 'subjectId', ex.subjectId);
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${ex.name}</strong> (${sub ? sub.name : ''})</td>
          <td>${cls ? cls.name : ex.classId}</td>
          <td>${ex.date}</td>
        `;
        widgetEventsBody.appendChild(row);
      });
    }
  }

  // ============================================================
  //  2. STUDENT MANAGEMENT MODULE
  // ============================================================
  const studSearch = document.getElementById('student-search');
  const studFilterClass = document.getElementById('student-filter-class');
  const studFilterStatus = document.getElementById('student-filter-status');
  const btnAddStudent = document.getElementById('btn-add-student');

  if (studSearch) studSearch.addEventListener('input', loadStudentsList);
  if (studFilterClass) studFilterClass.addEventListener('change', loadStudentsList);
  if (studFilterStatus) studFilterStatus.addEventListener('change', loadStudentsList);

  if (btnAddStudent) {
    btnAddStudent.addEventListener('click', () => {
      const classes = window.skhs_db.getCollection('classes');
      const parents = window.skhs_db.getCollection('parents');
      const teachers = window.skhs_db.getCollection('teachers');
      
      let classOpts = classes.map(c => `<option value="${c.classId}">${c.name}</option>`).join('');
      let parentOpts = parents.map(p => `<option value="${p.parentId}">${p.fullName}</option>`).join('');
      let teacherOpts = teachers.map(t => `<option value="${t.teacherId}">${t.fullName}</option>`).join('');

      openModal('Add New Student', `
        <form id="modal-student-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="m-stud-name" class="form-input" required>
          </div>
          <div class="portal-grid portal-grid-2">
            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              <input type="date" id="m-stud-dob" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select id="m-stud-gender" class="form-input">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div class="portal-grid portal-grid-3">
            <div class="form-group">
              <label class="form-label">Class</label>
              <select id="m-stud-class" class="form-input">${classOpts}</select>
            </div>
            <div class="form-group">
              <label class="form-label">Section</label>
              <input type="text" id="m-stud-section" class="form-input" value="A" required>
            </div>
            <div class="form-group">
              <label class="form-label">Roll Number</label>
              <input type="number" id="m-stud-roll" class="form-input" min="1" required>
            </div>
          </div>
          <div class="portal-grid portal-grid-2">
            <div class="form-group">
              <label class="form-label">Assign Parent</label>
              <select id="m-stud-parent" class="form-input">${parentOpts}</select>
            </div>
            <div class="form-group">
              <label class="form-label">Class Teacher</label>
              <select id="m-stud-teacher" class="form-input">${teacherOpts}</select>
            </div>
          </div>
          <div class="portal-grid portal-grid-2">
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" id="m-stud-phone" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Admission Date</label>
              <input type="date" id="m-stud-admd" class="form-input" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <textarea id="m-stud-addr" class="form-input" rows="2" required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="m-stud-status" class="form-input">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" class="btn-portal">Register Student</button>
        </form>
      `);

      document.getElementById('modal-student-form').addEventListener('submit', (ev) => {
        ev.preventDefault();
        
        const fullName = document.getElementById('m-stud-name').value.trim();
        const studentId = "STD-" + Math.floor(1000 + Math.random() * 9000);
        const autoEmail = studentId.toLowerCase() + "@srikakatiya.com";
        const phone = document.getElementById('m-stud-phone').value.trim();
        
        // Generate user account for authentication
        const newUserId = window.skhs_security ? window.skhs_security.createId("USR") : "USR-" + Math.floor(1000 + Math.random() * 9000);
        const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzFlMTUyZSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjZmZkZmJhIi8+PHBhdGggZD0iTTIwIDg1IEMyMCA2NSwgODAgNjUsIDgwIDg1IFoiIGZpbGw9IiM0NTg1ODgiLz48cGF0aCBkPSJNMzUgMzAgUTUwIDE1IDY1IDMwIiBzdHJva2U9IiMyODI4MjgiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";
        
        const userRec = window.skhs_db.insert('users', {
          userId: newUserId,
          fullName: fullName,
          email: autoEmail,
          passwordHash: "c02dab1a545fed10f3d9a0f2d1fd2cc9ebd1ab7c4860615baa41441627816563", // Default: School@321
          mobileNumber: phone,
          role: "student",
          profilePhoto: defaultAvatar,
          status: "active",
          accountActive: true,
          isDefaultPassword: true,
          createdDate: new Date().toISOString(),
          lastLogin: null
        });

        const stdId = window.skhs_db.insert('students', {
          studentId: studentId,
          userId: newUserId,
          fullName: fullName,
          dob: document.getElementById('m-stud-dob').value,
          gender: document.getElementById('m-stud-gender').value,
          classId: document.getElementById('m-stud-class').value,
          section: document.getElementById('m-stud-section').value.trim(),
          rollNumber: document.getElementById('m-stud-roll').value,
          parentId: document.getElementById('m-stud-parent').value,
          classTeacherId: document.getElementById('m-stud-teacher').value,
          phone: phone,
          address: document.getElementById('m-stud-addr').value.trim(),
          admissionDate: document.getElementById('m-stud-admd').value,
          status: document.getElementById('m-stud-status').value
        });
        
        if (stdId && userRec) {
          window.skhs_db.logActivity('student_create', 'student', 'info', currentUser.userId, stdId.studentId, `Added new student record: ${stdId.fullName}`);
          closeModal();
          loadStudentsList();
          if (typeof showAlert !== 'undefined') {
            showAlert("Student added! Login Email: " + autoEmail + " (Password: School@321)");
          } else if (window.skhs_dom && typeof window.skhs_dom.showAlert === 'function') {
            window.skhs_dom.showAlert(document.getElementById('dashboard-alert-container'), "Student added! Login Email: " + autoEmail + " (Password: School@321)", "success", 0);
          } else {
            alert("Student added! Login Email: " + autoEmail + " (Password: School@321)");
          }
        }
      });
    });
  }

  function loadStudentsList() {
    const tbody = document.getElementById('students-table-body');
    const classes = window.skhs_db.getCollection('classes');
    let list = window.skhs_db.getCollection('students');

    // Populate filter select options if empty
    if (studFilterClass && studFilterClass.children.length <= 1) {
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.classId;
        opt.textContent = c.name;
        studFilterClass.appendChild(opt);
      });
    }

    // Apply Search
    const searchVal = studSearch ? studSearch.value.toLowerCase().trim() : '';
    if (searchVal) {
      list = list.filter(s => s.fullName.toLowerCase().includes(searchVal) || s.studentId.toLowerCase().includes(searchVal));
    }

    // Apply Class Filter
    const classVal = studFilterClass ? studFilterClass.value : 'all';
    if (classVal !== 'all') {
      list = list.filter(s => s.classId === classVal);
    }

    // Apply Status Filter
    const statusVal = studFilterStatus ? studFilterStatus.value : 'all';
    if (statusVal !== 'all') {
      list = list.filter(s => s.status === statusVal);
    }

    tbody.innerHTML = '';
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No students matched search filters.</td></tr>`;
      return;
    }

    list.forEach(s => {
      const cls = classes.find(c => c.classId === s.classId);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${s.studentId}</td>
        <td><strong>${s.fullName}</strong></td>
        <td>${cls ? cls.name : s.classId}</td>
        <td>${s.section}</td>
        <td>${s.rollNumber}</td>
        <td><span class="badge ${s.status === 'Active' ? 'badge-info' : 'badge-warning'}">${s.status}</span></td>
        <td>
          <div class="btn-action-group">
            <button class="btn-action btn-view" title="View Profile" data-id="${s.studentId}">👤</button>
            <button class="btn-action btn-edit" title="Edit Student" data-id="${s.studentId}">✏️</button>
            <button class="btn-action btn-delete" title="Delete Student" data-id="${s.studentId}">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Attach student table action event listeners
    tbody.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => showStudentProfile(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editStudent(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteStudent(btn.getAttribute('data-id')));
    });
  }

  function showStudentProfile(id) {
    const stud = window.skhs_db.findOne('students', 'studentId', id);
    if (!stud) return;

    const cls = window.skhs_db.findOne('classes', 'classId', stud.classId);
    const parent = window.skhs_db.findOne('parents', 'parentId', stud.parentId);
    const teacher = window.skhs_db.findOne('teachers', 'teacherId', stud.classTeacherId);
    
    // Calculate student statistics
    const attendance = window.skhs_db.find('attendance', 'studentId', id);
    const presentCount = attendance.filter(a => a.status === 'Present').length;
    const totalCount = attendance.length;
    const attPct = totalCount ? Math.round((presentCount / totalCount) * 100) : 100;

    const marks = window.skhs_db.find('marks', 'studentId', id);
    const marksListHTML = marks.length > 0
      ? marks.map(m => {
          const ex = window.skhs_db.findOne('exams', 'examId', m.examId);
          return `<li><strong>${ex ? ex.name : m.examId}</strong>: ${m.marksObtained}/${m.maxMarks}</li>`;
        }).join('')
      : '<li>No grades posted yet.</li>';

    openModal(`Student Card: ${stud.fullName}`, `
      <div class="profile-detail-section">
        <h4 class="profile-section-title">Personal Details</h4>
        <div class="profile-detail-grid">
          <div class="profile-detail-item"><span class="profile-detail-label">Student ID</span><span class="profile-detail-value">${stud.studentId}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Gender</span><span class="profile-detail-value">${stud.gender}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Date of Birth</span><span class="profile-detail-value">${stud.dob}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Admission Date</span><span class="profile-detail-value">${stud.admissionDate}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Phone</span><span class="profile-detail-value">${stud.phone}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Address</span><span class="profile-detail-value">${stud.address}</span></div>
        </div>
      </div>
      <div class="profile-detail-section">
        <h4 class="profile-section-title">Academic Details</h4>
        <div class="profile-detail-grid">
          <div class="profile-detail-item"><span class="profile-detail-label">Class & Section</span><span class="profile-detail-value">${cls ? cls.name : stud.classId} (${stud.section})</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Roll Number</span><span class="profile-detail-value">${stud.rollNumber}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Class Teacher</span><span class="profile-detail-value">${teacher ? teacher.fullName : stud.classTeacherId}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Attendance Rate</span><span class="profile-detail-value">${attPct}% (${presentCount}/${totalCount} Days)</span></div>
        </div>
      </div>
      <div class="profile-detail-section">
        <h4 class="profile-section-title">Parent Details</h4>
        <div class="profile-detail-grid">
          <div class="profile-detail-item"><span class="profile-detail-label">Parent Name</span><span class="profile-detail-value">${parent ? parent.fullName : stud.parentId}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Contact Number</span><span class="profile-detail-value">${parent ? parent.mobileNumber : ''}</span></div>
        </div>
      </div>
      <div class="profile-detail-section">
        <h4 class="profile-section-title">Academic Grades Summary</h4>
        <ul style="padding-left: 1.25rem; font-size: 0.85rem;">
          ${marksListHTML}
        </ul>
      </div>
    `);
  }

  function editStudent(id) {
    const stud = window.skhs_db.findOne('students', 'studentId', id);
    if (!stud) return;

    const classes = window.skhs_db.getCollection('classes');
    const parents = window.skhs_db.getCollection('parents');
    const teachers = window.skhs_db.getCollection('teachers');
    
    let classOpts = classes.map(c => `<option value="${c.classId}" ${c.classId === stud.classId ? 'selected':''}>${c.name}</option>`).join('');
    let parentOpts = parents.map(p => `<option value="${p.parentId}" ${p.parentId === stud.parentId ? 'selected':''}>${p.fullName}</option>`).join('');
    let teacherOpts = teachers.map(t => `<option value="${t.teacherId}" ${t.teacherId === stud.classTeacherId ? 'selected':''}>${t.fullName}</option>`).join('');

    openModal(`Edit Student Record: ${stud.fullName}`, `
      <form id="modal-edit-student-form">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" id="m-stud-name" class="form-input" value="${stud.fullName}" required>
        </div>
        <div class="portal-grid portal-grid-2">
          <div class="form-group">
            <label class="form-label">Date of Birth</label>
            <input type="date" id="m-stud-dob" class="form-input" value="${stud.dob}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Gender</label>
            <select id="m-stud-gender" class="form-input">
              <option value="Male" ${stud.gender === 'Male'?'selected':''}>Male</option>
              <option value="Female" ${stud.gender === 'Female'?'selected':''}>Female</option>
              <option value="Other" ${stud.gender === 'Other'?'selected':''}>Other</option>
            </select>
          </div>
        </div>
        <div class="portal-grid portal-grid-3">
          <div class="form-group">
            <label class="form-label">Class</label>
            <select id="m-stud-class" class="form-input">${classOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Section</label>
            <input type="text" id="m-stud-section" class="form-input" value="${stud.section}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Roll Number</label>
            <input type="number" id="m-stud-roll" class="form-input" value="${stud.rollNumber}" min="1" required>
          </div>
        </div>
        <div class="portal-grid portal-grid-2">
          <div class="form-group">
            <label class="form-label">Assign Parent</label>
            <select id="m-stud-parent" class="form-input">${parentOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Class Teacher</label>
            <select id="m-stud-teacher" class="form-input">${teacherOpts}</select>
          </div>
        </div>
        <div class="portal-grid portal-grid-2">
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" id="m-stud-phone" class="form-input" value="${stud.phone}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Admission Date</label>
            <input type="date" id="m-stud-admd" class="form-input" value="${stud.admissionDate}" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Address</label>
          <textarea id="m-stud-addr" class="form-input" rows="2" required>${stud.address}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select id="m-stud-status" class="form-input">
            <option value="Active" ${stud.status==='Active'?'selected':''}>Active</option>
            <option value="Inactive" ${stud.status==='Inactive'?'selected':''}>Inactive</option>
          </select>
        </div>
        <button type="submit" class="btn-portal">Save Modifications</button>
      </form>
    `);

    document.getElementById('modal-edit-student-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const updated = window.skhs_db.update('students', 'studentId', id, {
        fullName: document.getElementById('m-stud-name').value.trim(),
        dob: document.getElementById('m-stud-dob').value,
        gender: document.getElementById('m-stud-gender').value,
        classId: document.getElementById('m-stud-class').value,
        section: document.getElementById('m-stud-section').value.trim(),
        rollNumber: document.getElementById('m-stud-roll').value,
        parentId: document.getElementById('m-stud-parent').value,
        classTeacherId: document.getElementById('m-stud-teacher').value,
        phone: document.getElementById('m-stud-phone').value.trim(),
        address: document.getElementById('m-stud-addr').value.trim(),
        admissionDate: document.getElementById('m-stud-admd').value,
        status: document.getElementById('m-stud-status').value
      });

      if (updated) {
        window.skhs_db.logActivity('student_update', 'student', 'info', currentUser.userId, id, `Updated student parameters: ${updated.fullName}`);
        closeModal();
        loadStudentsList();
        showAlert("Student updated successfully!");
      }
    });
  }

  function deleteStudent(id) {
    if (confirm("Are you sure you want to delete this student record? This action is permanent.")) {
      const deleted = window.skhs_db.delete('students', 'studentId', id);
      if (deleted) {
        window.skhs_db.logActivity('student_delete', 'student', 'warning', currentUser.userId, id, `Deleted student record: ${id}`);
        loadStudentsList();
        showAlert("Student profile deleted.");
      }
    }
  }

  // ============================================================
  //  3. TEACHER MANAGEMENT MODULE
  // ============================================================
  const teachSearch = document.getElementById('teacher-search');
  const teachFilterStatus = document.getElementById('teacher-filter-status');
  const btnAddTeacher = document.getElementById('btn-add-teacher');

  if (teachSearch) teachSearch.addEventListener('input', loadTeachersList);
  if (teachFilterStatus) teachFilterStatus.addEventListener('change', loadTeachersList);

  if (btnAddTeacher) {
    btnAddTeacher.addEventListener('click', () => {
      openModal('Add New Teacher', `
        <form id="modal-teacher-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="m-teach-name" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Qualification</label>
            <input type="text" id="m-teach-qual" class="form-input" placeholder="e.g. M.Sc, B.Ed" required>
          </div>
          <div class="portal-grid portal-grid-2">
            <div class="form-group">
              <label class="form-label">Specialized Subject</label>
              <input type="text" id="m-teach-sub" class="form-input" placeholder="e.g. Mathematics" required>
            </div>
            <div class="form-group">
              <label class="form-label">Years of Experience</label>
              <input type="text" id="m-teach-exp" class="form-input" placeholder="e.g. 5 Years" required>
            </div>
          </div>
          <div class="portal-grid portal-grid-2">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="m-teach-email" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" id="m-teach-phone" class="form-input" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="m-teach-status" class="form-input">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" class="btn-portal">Register Teacher</button>
        </form>
      `);

      document.getElementById('modal-teacher-form').addEventListener('submit', (ev) => {
        ev.preventDefault();
        
        const fullName = document.getElementById('m-teach-name').value.trim();
        const teacherEmail = document.getElementById('m-teach-email').value.trim();
        const phone = document.getElementById('m-teach-phone').value.trim();
        
        // Generate user account for authentication
        const newUserId = window.skhs_security ? window.skhs_security.createId("USR") : "USR-" + Math.floor(1000 + Math.random() * 9000);
        const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzFlMTUyZSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjZmZkZmJhIi8+PHBhdGggZD0iTTIwIDg1IEMyMCA2NSwgODAgNjUsIDgwIDg1IFoiIGZpbGw9IiM0NTg1ODgiLz48cGF0aCBkPSJNMzUgMzAgUTUwIDE1IDY1IDMwIiBzdHJva2U9IiMyODI4MjgiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";
        
        const userRec = window.skhs_db.insert('users', {
          userId: newUserId,
          fullName: fullName,
          email: teacherEmail,
          passwordHash: "9a358ed6777d8c0286b4fb7f052b294d11a1fb6886e1586e1e76875377449471", // Default: School@456 for teachers
          mobileNumber: phone,
          role: "teacher",
          profilePhoto: defaultAvatar,
          status: "active",
          accountActive: true,
          isDefaultPassword: true,
          createdDate: new Date().toISOString(),
          lastLogin: null
        });

        const tId = window.skhs_db.insert('teachers', {
          teacherId: "TCH-" + Math.floor(2000 + Math.random() * 9000),
          userId: newUserId,
          fullName: fullName,
          qualification: document.getElementById('m-teach-qual').value.trim(),
          subject: document.getElementById('m-teach-sub').value.trim(),
          assignedClasses: [],
          email: teacherEmail,
          phone: phone,
          experience: document.getElementById('m-teach-exp').value.trim(),
          status: document.getElementById('m-teach-status').value
        });

        if (tId && userRec) {
          window.skhs_db.logActivity('teacher_create', 'teacher', 'info', currentUser.userId, tId.teacherId, `Registered faculty: ${tId.fullName}. Auto-generated login: ${teacherEmail}`);
          closeModal();
          loadTeachersList();
          if (typeof showAlert !== 'undefined') {
            showAlert("Faculty registered! Login Email: " + teacherEmail + " (Password: School@456)");
          } else if (window.skhs_dom && typeof window.skhs_dom.showAlert === 'function') {
            window.skhs_dom.showAlert(document.getElementById('dashboard-alert-container'), "Faculty registered! Login Email: " + teacherEmail + " (Password: School@456)", "success", 0);
          } else {
            alert("Faculty registered! Login Email: " + teacherEmail + " (Password: School@456)");
          }
        }
      });
    });
  }

  function loadTeachersList() {
    const tbody = document.getElementById('teachers-table-body');
    let list = window.skhs_db.getCollection('teachers');

    // Apply Search
    const searchVal = teachSearch ? teachSearch.value.toLowerCase().trim() : '';
    if (searchVal) {
      list = list.filter(t => t.fullName.toLowerCase().includes(searchVal) || t.subject.toLowerCase().includes(searchVal));
    }

    // Apply Status Filter
    const statusVal = teachFilterStatus ? teachFilterStatus.value : 'all';
    if (statusVal !== 'all') {
      list = list.filter(t => t.status === statusVal);
    }

    tbody.innerHTML = '';
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No teachers found matching criteria.</td></tr>`;
      return;
    }

    list.forEach(t => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${t.teacherId}</td>
        <td><strong>${t.fullName}</strong></td>
        <td>${t.qualification}</td>
        <td>${t.subject}</td>
        <td>${t.experience}</td>
        <td><span class="badge ${t.status === 'Active' ? 'badge-info' : 'badge-warning'}">${t.status}</span></td>
        <td>
          <div class="btn-action-group">
            <button class="btn-action btn-view" title="View Profile" data-id="${t.teacherId}">👤</button>
            <button class="btn-action btn-edit" title="Edit Teacher" data-id="${t.teacherId}">✏️</button>
            <button class="btn-action btn-delete" title="Delete Teacher" data-id="${t.teacherId}">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => showTeacherProfile(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editTeacher(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteTeacher(btn.getAttribute('data-id')));
    });
  }

  function showTeacherProfile(id) {
    const teach = window.skhs_db.findOne('teachers', 'teacherId', id);
    if (!teach) return;

    const subjects = window.skhs_db.getCollection('subjects').filter(sub => sub.teacherId === id);
    const classes = window.skhs_db.getCollection('classes').filter(c => c.classTeacherId === id || teach.assignedClasses.includes(c.classId));

    const subHTML = subjects.length ? subjects.map(s => s.name).join(', ') : 'None';
    const clsHTML = classes.length ? classes.map(c => c.name).join(', ') : 'None';

    openModal(`Faculty Card: ${teach.fullName}`, `
      <div class="profile-detail-section">
        <h4 class="profile-section-title">Personal Settings & Faculty Details</h4>
        <div class="profile-detail-grid">
          <div class="profile-detail-item"><span class="profile-detail-label">Teacher ID</span><span class="profile-detail-value">${teach.teacherId}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Qualification</span><span class="profile-detail-value">${teach.qualification}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Specialization</span><span class="profile-detail-value">${teach.subject}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Experience</span><span class="profile-detail-value">${teach.experience}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Email</span><span class="profile-detail-value">${teach.email}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Phone</span><span class="profile-detail-value">${teach.phone}</span></div>
        </div>
      </div>
      <div class="profile-detail-section">
        <h4 class="profile-section-title">Assignments</h4>
        <div class="profile-detail-grid">
          <div class="profile-detail-item"><span class="profile-detail-label">Subject Syllabus Workload</span><span class="profile-detail-value">${subHTML}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Assigned Classes</span><span class="profile-detail-value">${clsHTML}</span></div>
        </div>
      </div>
    `);
  }

  function editTeacher(id) {
    const teach = window.skhs_db.findOne('teachers', 'teacherId', id);
    if (!teach) return;

    openModal(`Modify Faculty: ${teach.fullName}`, `
      <form id="modal-edit-teacher-form">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" id="m-teach-name" class="form-input" value="${teach.fullName}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Qualification</label>
          <input type="text" id="m-teach-qual" class="form-input" value="${teach.qualification}" required>
        </div>
        <div class="portal-grid portal-grid-2">
          <div class="form-group">
            <label class="form-label">Specialized Subject</label>
            <input type="text" id="m-teach-sub" class="form-input" value="${teach.subject}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Experience</label>
            <input type="text" id="m-teach-exp" class="form-input" value="${teach.experience}" required>
          </div>
        </div>
        <div class="portal-grid portal-grid-2">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" id="m-teach-email" class="form-input" value="${teach.email}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" id="m-teach-phone" class="form-input" value="${teach.phone}" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select id="m-teach-status" class="form-input">
            <option value="Active" ${teach.status === 'Active'?'selected':''}>Active</option>
            <option value="Inactive" ${teach.status === 'Inactive'?'selected':''}>Inactive</option>
          </select>
        </div>
        <button type="submit" class="btn-portal">Save Modifications</button>
      </form>
    `);

    document.getElementById('modal-edit-teacher-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const updated = window.skhs_db.update('teachers', 'teacherId', id, {
        fullName: document.getElementById('m-teach-name').value.trim(),
        qualification: document.getElementById('m-teach-qual').value.trim(),
        subject: document.getElementById('m-teach-sub').value.trim(),
        email: document.getElementById('m-teach-email').value.trim(),
        phone: document.getElementById('m-teach-phone').value.trim(),
        experience: document.getElementById('m-teach-exp').value.trim(),
        status: document.getElementById('m-teach-status').value
      });

      if (updated) {
        window.skhs_db.logActivity('teacher_update', 'teacher', 'info', currentUser.userId, id, `Updated faculty details: ${updated.fullName}`);
        closeModal();
        loadTeachersList();
        showAlert("Faculty details updated successfully!");
      }
    });
  }

  function deleteTeacher(id) {
    if (confirm("Are you sure you want to remove this faculty record?")) {
      const deleted = window.skhs_db.delete('teachers', 'teacherId', id);
      if (deleted) {
        window.skhs_db.logActivity('teacher_delete', 'teacher', 'warning', currentUser.userId, id, `Deleted teacher record: ${id}`);
        loadTeachersList();
        showAlert("Teacher profile deleted.");
      }
    }
  }

  // ============================================================
  //  4. PARENT MANAGEMENT MODULE
  // ============================================================
  const parentSearch = document.getElementById('parent-search');
  const btnAddParent = document.getElementById('btn-add-parent');

  if (parentSearch) parentSearch.addEventListener('input', loadParentsList);

  if (btnAddParent) {
    btnAddParent.addEventListener('click', () => {
      openModal('Add New Parent Profile', `
        <form id="modal-parent-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="m-parent-name" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Mobile Number</label>
            <input type="tel" id="m-parent-phone" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" id="m-parent-email" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label">Occupation</label>
            <input type="text" id="m-parent-occ" class="form-input" required>
          </div>
          <button type="submit" class="btn-portal">Register Parent Profile</button>
        </form>
      `);

      document.getElementById('modal-parent-form').addEventListener('submit', (ev) => {
        ev.preventDefault();
        
        const fullName = document.getElementById('m-parent-name').value.trim();
        const parentEmail = document.getElementById('m-parent-email').value.trim();
        const phone = document.getElementById('m-parent-phone').value.trim();
        
        // Generate user account for authentication
        const newUserId = window.skhs_security ? window.skhs_security.createId("USR") : "USR-" + Math.floor(1000 + Math.random() * 9000);
        const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzFlMTUyZSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjZmZkZmJhIi8+PHBhdGggZD0iTTIwIDg1IEMyMCA2NSwgODAgNjUsIDgwIDg1IFoiIGZpbGw9IiM0NTg1ODgiLz48cGF0aCBkPSJNMzUgMzAgUTUwIDE1IDY1IDMwIiBzdHJva2U9IiMyODI4MjgiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";
        
        const userRec = window.skhs_db.insert('users', {
          userId: newUserId,
          fullName: fullName,
          email: parentEmail,
          passwordHash: "228cf01b5dbd0e6504a5bf8f0ea37efb32eecbd8700ba5bf44b419eb96ed0947", // Default: School@789 for parents
          mobileNumber: phone,
          role: "parent",
          profilePhoto: defaultAvatar,
          status: "active",
          accountActive: true,
          isDefaultPassword: true,
          createdDate: new Date().toISOString(),
          lastLogin: null
        });

        const pId = window.skhs_db.insert('parents', {
          parentId: "PRN-" + Math.floor(3000 + Math.random() * 9000),
          userId: newUserId,
          fullName: fullName,
          mobileNumber: phone,
          email: parentEmail,
          occupation: document.getElementById('m-parent-occ').value.trim(),
          linkedStudents: []
        });

        if (pId && userRec) {
          window.skhs_db.logActivity('parent_create', 'parent', 'info', currentUser.userId, pId.parentId, `Registered parent: ${pId.fullName}. Auto-generated login: ${parentEmail}`);
          closeModal();
          loadParentsList();
          if (typeof showAlert !== 'undefined') {
            showAlert("Parent registered! Login Email: " + parentEmail + " (Password: School@789)");
          } else if (window.skhs_dom && typeof window.skhs_dom.showAlert === 'function') {
            window.skhs_dom.showAlert(document.getElementById('dashboard-alert-container'), "Parent registered! Login Email: " + parentEmail + " (Password: School@789)", "success", 0);
          } else {
            alert("Parent registered! Login Email: " + parentEmail + " (Password: School@789)");
          }
        }
      });
    });
  }

  function loadParentsList() {
    const tbody = document.getElementById('parents-table-body');
    let list = window.skhs_db.getCollection('parents');

    const searchVal = parentSearch ? parentSearch.value.toLowerCase().trim() : '';
    if (searchVal) {
      list = list.filter(p => p.fullName.toLowerCase().includes(searchVal) || p.mobileNumber.includes(searchVal));
    }

    tbody.innerHTML = '';
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No parent records found.</td></tr>`;
      return;
    }

    list.forEach(p => {
      const students = window.skhs_db.getCollection('students').filter(s => p.linkedStudents.includes(s.studentId));
      const linkedStr = students.length ? students.map(s => `${s.fullName} (${s.studentId})`).join(', ') : 'None';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${p.parentId}</td>
        <td><strong>${p.fullName}</strong></td>
        <td>${p.mobileNumber}</td>
        <td>${p.email}</td>
        <td>${linkedStr}</td>
        <td>
          <div class="btn-action-group">
            <button class="btn-action btn-edit" title="Link Student" data-action="link" data-id="${p.parentId}">🔗</button>
            <button class="btn-action btn-edit" title="Edit details" data-action="edit" data-id="${p.parentId}">✏️</button>
            <button class="btn-action btn-delete" title="Delete" data-action="delete" data-id="${p.parentId}">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll('[data-id]').forEach(btn => {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      btn.addEventListener('click', () => {
        if (action === 'link') linkStudentToParent(id);
        else if (action === 'edit') editParent(id);
        else if (action === 'delete') deleteParent(id);
      });
    });
  }

  function linkStudentToParent(parentId) {
    const parent = window.skhs_db.findOne('parents', 'parentId', parentId);
    if (!parent) return;

    const students = window.skhs_db.getCollection('students');
    let opts = students.map(s => `<option value="${s.studentId}">${s.fullName} (${s.studentId})</option>`).join('');

    openModal(`Link Student to: ${parent.fullName}`, `
      <form id="modal-link-form">
        <div class="form-group">
          <label class="form-label">Choose Student</label>
          <select id="m-link-student-id" class="form-input">
            ${opts}
          </select>
        </div>
        <button type="submit" class="btn-portal">Add Link</button>
      </form>
    `);

    document.getElementById('modal-link-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const sId = document.getElementById('m-link-student-id').value;
      
      const newLinks = [...parent.linkedStudents];
      if (!newLinks.includes(sId)) {
        newLinks.push(sId);
        window.skhs_db.update('parents', 'parentId', parentId, { linkedStudents: newLinks });
        window.skhs_db.update('students', 'studentId', sId, { parentId: parentId });
        window.skhs_db.logActivity('parent_link_student', 'parent', 'info', currentUser.userId, parentId, `Linked student ${sId} to parent ${parent.fullName}`);
        closeModal();
        loadParentsList();
        showAlert("Student linked successfully.");
      } else {
        showAlert("Student already linked to this parent record.", "warning");
      }
    });
  }

  function editParent(id) {
    const parent = window.skhs_db.findOne('parents', 'parentId', id);
    if (!parent) return;

    openModal(`Modify Parent Record: ${parent.fullName}`, `
      <form id="modal-edit-parent-form">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" id="m-parent-name" class="form-input" value="${parent.fullName}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Mobile Number</label>
          <input type="tel" id="m-parent-phone" class="form-input" value="${parent.mobileNumber}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input type="email" id="m-parent-email" class="form-input" value="${parent.email}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Occupation</label>
          <input type="text" id="m-parent-occ" class="form-input" value="${parent.occupation}" required>
        </div>
        <button type="submit" class="btn-portal">Save Modifications</button>
      </form>
    `);

    document.getElementById('modal-edit-parent-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const updated = window.skhs_db.update('parents', 'parentId', id, {
        fullName: document.getElementById('m-parent-name').value.trim(),
        mobileNumber: document.getElementById('m-parent-phone').value.trim(),
        email: document.getElementById('m-parent-email').value.trim(),
        occupation: document.getElementById('m-parent-occ').value.trim()
      });

      if (updated) {
        window.skhs_db.logActivity('parent_update', 'parent', 'info', currentUser.userId, id, `Updated parent profile: ${updated.fullName}`);
        closeModal();
        loadParentsList();
        showAlert("Parent profile updated.");
      }
    });
  }

  function deleteParent(id) {
    if (confirm("Are you sure you want to delete this parent profile?")) {
      const deleted = window.skhs_db.delete('parents', 'parentId', id);
      if (deleted) {
        window.skhs_db.logActivity('parent_delete', 'parent', 'warning', currentUser.userId, id, `Deleted parent record: ${id}`);
        loadParentsList();
        showAlert("Parent profile deleted.");
      }
    }
  }

  // ============================================================
  //  5. CLASS MANAGEMENT MODULE
  // ============================================================
  const btnAddClass = document.getElementById('btn-add-class');

  if (btnAddClass) {
    btnAddClass.addEventListener('click', () => {
      const teachers = window.skhs_db.getCollection('teachers');
      let teacherOpts = teachers.map(t => `<option value="${t.teacherId}">${t.fullName}</option>`).join('');

      openModal('Add New Class', `
        <form id="modal-class-form">
          <div class="form-group">
            <label class="form-label">Class Name</label>
            <input type="text" id="m-class-name" class="form-input" placeholder="e.g. Class 11" required>
          </div>
          <div class="form-group">
            <label class="form-label">Assign Class Teacher</label>
            <select id="m-class-teacher" class="form-input">
              ${teacherOpts}
            </select>
          </div>
          <button type="submit" class="btn-portal">Create Class</button>
        </form>
      `);

      document.getElementById('modal-class-form').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const cId = window.skhs_db.insert('classes', {
          classId: "class-" + document.getElementById('m-class-name').value.toLowerCase().replace(/\s+/g, '-'),
          name: document.getElementById('m-class-name').value.trim(),
          classTeacherId: document.getElementById('m-class-teacher').value
        });

        if (cId) {
          window.skhs_db.logActivity('class_create', 'class', 'info', currentUser.userId, cId.classId, `Created class room: ${cId.name}`);
          closeModal();
          loadClassesList();
          showAlert("Class room created.");
        }
      });
    });
  }

  function loadClassesList() {
    const tbody = document.getElementById('classes-table-body');
    const classes = window.skhs_db.getCollection('classes');
    const teachers = window.skhs_db.getCollection('teachers');
    const students = window.skhs_db.getCollection('students');

    tbody.innerHTML = '';
    classes.forEach(c => {
      const teach = teachers.find(t => t.teacherId === c.classTeacherId);
      const count = students.filter(s => s.classId === c.classId).length;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${c.classId}</td>
        <td><strong>${c.name}</strong></td>
        <td>${teach ? teach.fullName : 'Unassigned'}</td>
        <td>${count} Students</td>
        <td>
          <div class="btn-action-group">
            <button class="btn-action btn-edit" title="Edit Teacher Link" data-id="${c.classId}">✏️</button>
            <button class="btn-action btn-delete" title="Delete Class" data-id="${c.classId}">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editClass(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteClass(btn.getAttribute('data-id')));
    });
  }

  function editClass(id) {
    const cls = window.skhs_db.findOne('classes', 'classId', id);
    if (!cls) return;

    const teachers = window.skhs_db.getCollection('teachers');
    let teacherOpts = teachers.map(t => `<option value="${t.teacherId}" ${t.teacherId === cls.classTeacherId?'selected':''}>${t.fullName}</option>`).join('');

    openModal(`Edit Class: ${cls.name}`, `
      <form id="modal-edit-class-form">
        <div class="form-group">
          <label class="form-label">Class Name</label>
          <input type="text" id="m-class-name" class="form-input" value="${cls.name}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Class Teacher</label>
          <select id="m-class-teacher" class="form-input">
            ${teacherOpts}
          </select>
        </div>
        <button type="submit" class="btn-portal">Save Modifications</button>
      </form>
    `);

    document.getElementById('modal-edit-class-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const updated = window.skhs_db.update('classes', 'classId', id, {
        name: document.getElementById('m-class-name').value.trim(),
        classTeacherId: document.getElementById('m-class-teacher').value
      });

      if (updated) {
        window.skhs_db.logActivity('class_update', 'class', 'info', currentUser.userId, id, `Updated class assignments for class: ${updated.name}`);
        closeModal();
        loadClassesList();
        showAlert("Class assignments saved.");
      }
    });
  }

  function deleteClass(id) {
    if (confirm("Are you sure you want to delete this class?")) {
      const deleted = window.skhs_db.delete('classes', 'classId', id);
      if (deleted) {
        window.skhs_db.logActivity('class_delete', 'class', 'warning', currentUser.userId, id, `Deleted class registry: ${id}`);
        loadClassesList();
        showAlert("Class registry entry deleted.");
      }
    }
  }

  // ============================================================
  //  6. SUBJECT MANAGEMENT MODULE
  // ============================================================
  const btnAddSubject = document.getElementById('btn-add-subject');

  if (btnAddSubject) {
    btnAddSubject.addEventListener('click', () => {
      const teachers = window.skhs_db.getCollection('teachers');
      const classes = window.skhs_db.getCollection('classes');
      
      let teachOpts = teachers.map(t => `<option value="${t.teacherId}">${t.fullName}</option>`).join('');
      let classOpts = classes.map(c => `<option value="${c.classId}">${c.name}</option>`).join('');

      openModal('Add New Subject Mapping', `
        <form id="modal-subject-form">
          <div class="form-group">
            <label class="form-label">Subject Name</label>
            <input type="text" id="m-sub-name" class="form-input" placeholder="e.g. Science" required>
          </div>
          <div class="form-group">
            <label class="form-label">Assign Class Room</label>
            <select id="m-sub-class" class="form-input">${classOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Assign Teacher</label>
            <select id="m-sub-teacher" class="form-input">${teachOpts}</select>
          </div>
          <button type="submit" class="btn-portal">Assign Subject</button>
        </form>
      `);

      document.getElementById('modal-subject-form').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const sub = window.skhs_db.insert('subjects', {
          subjectId: "sub-" + Math.floor(100 + Math.random()*900),
          name: document.getElementById('m-sub-name').value.trim(),
          classId: document.getElementById('m-sub-class').value,
          teacherId: document.getElementById('m-sub-teacher').value
        });

        if (sub) {
          window.skhs_db.logActivity('subject_create', 'subject', 'info', currentUser.userId, sub.subjectId, `Created subject link: ${sub.name}`);
          closeModal();
          loadSubjectsList();
          showAlert("Subject link established.");
        }
      });
    });
  }

  function loadSubjectsList() {
    const tbody = document.getElementById('subjects-table-body');
    const subjects = window.skhs_db.getCollection('subjects');
    const teachers = window.skhs_db.getCollection('teachers');
    const classes = window.skhs_db.getCollection('classes');

    tbody.innerHTML = '';
    subjects.forEach(sub => {
      const teach = teachers.find(t => t.teacherId === sub.teacherId);
      const cls = classes.find(c => c.classId === sub.classId);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${sub.subjectId}</td>
        <td><strong>${sub.name}</strong></td>
        <td>${cls ? cls.name : sub.classId}</td>
        <td>${teach ? teach.fullName : 'Unassigned'}</td>
        <td>
          <div class="btn-action-group">
            <button class="btn-action btn-edit" title="Edit Assignment" data-id="${sub.subjectId}">✏️</button>
            <button class="btn-action btn-delete" title="Delete Subject" data-id="${sub.subjectId}">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => editSubject(btn.getAttribute('data-id')));
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => deleteSubject(btn.getAttribute('data-id')));
    });
  }

  function editSubject(id) {
    const sub = window.skhs_db.findOne('subjects', 'subjectId', id);
    if (!sub) return;

    const teachers = window.skhs_db.getCollection('teachers');
    const classes = window.skhs_db.getCollection('classes');
    
    let teachOpts = teachers.map(t => `<option value="${t.teacherId}" ${t.teacherId === sub.teacherId?'selected':''}>${t.fullName}</option>`).join('');
    let classOpts = classes.map(c => `<option value="${c.classId}" ${c.classId === sub.classId?'selected':''}>${c.name}</option>`).join('');

    openModal(`Edit Subject Mapping: ${sub.name}`, `
      <form id="modal-edit-subject-form">
        <div class="form-group">
          <label class="form-label">Subject Name</label>
          <input type="text" id="m-sub-name" class="form-input" value="${sub.name}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Assign Class Room</label>
          <select id="m-sub-class" class="form-input">${classOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Assign Teacher</label>
          <select id="m-sub-teacher" class="form-input">${teachOpts}</select>
        </div>
        <button type="submit" class="btn-portal">Save Modifications</button>
      </form>
    `);

    document.getElementById('modal-edit-subject-form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const updated = window.skhs_db.update('subjects', 'subjectId', id, {
        name: document.getElementById('m-sub-name').value.trim(),
        classId: document.getElementById('m-sub-class').value,
        teacherId: document.getElementById('m-sub-teacher').value
      });

      if (updated) {
        window.skhs_db.logActivity('subject_update', 'subject', 'info', currentUser.userId, id, `Updated subject links: ${updated.name}`);
        closeModal();
        loadSubjectsList();
        showAlert("Subject details modified.");
      }
    });
  }

  function deleteSubject(id) {
    if (confirm("Are you sure you want to delete this subject mapping?")) {
      const deleted = window.skhs_db.delete('subjects', 'subjectId', id);
      if (deleted) {
        window.skhs_db.logActivity('subject_delete', 'subject', 'warning', currentUser.userId, id, `Deleted subject link: ${id}`);
        loadSubjectsList();
        showAlert("Subject mapping deleted.");
      }
    }
  }

  // ============================================================
  //  7. ATTENDANCE MANAGEMENT
  // ============================================================
  const attSelectClass = document.getElementById('attendance-select-class');
  const attSelectDate = document.getElementById('attendance-select-date');
  const btnLoadAttendance = document.getElementById('btn-load-attendance');
  const btnSaveAttendance = document.getElementById('btn-save-attendance');
  const attSheetWrapper = document.getElementById('attendance-sheet-wrapper');
  const attEmptyMsg = document.getElementById('attendance-empty-message');

  function initAttendanceModule() {
    // Populate select class dropdown
    if (attSelectClass && attSelectClass.children.length <= 1) {
      const classes = window.skhs_db.getCollection('classes');
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.classId;
        opt.textContent = c.name;
        attSelectClass.appendChild(opt);
      });
      attSelectDate.value = new Date().toISOString().split('T')[0];
    }
  }

  if (btnLoadAttendance) {
    btnLoadAttendance.addEventListener('click', () => {
      const cId = attSelectClass.value;
      const dateVal = attSelectDate.value;

      if (!cId || !dateVal) {
        showAlert("Please choose both a Class and Date before loading.", "warning");
        return;
      }

      const students = window.skhs_db.find('students', 'classId', cId);
      const attendance = window.skhs_db.getCollection('attendance');
      const tbody = document.getElementById('attendance-table-body');
      
      tbody.innerHTML = '';
      attEmptyMsg.style.display = 'none';
      attSheetWrapper.style.display = 'block';

      if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 2rem;">No students registered in this class.</td></tr>`;
        btnSaveAttendance.style.display = 'none';
        return;
      }

      btnSaveAttendance.style.display = 'inline-block';
      const activeAY = sessionStorage.getItem("skhs_active_ay");
      students.forEach(s => {
        // Find existing record for this student on this date and academic year
        const record = attendance.find(a => a.studentId === s.studentId && a.date === dateVal && a.academicYear === activeAY);
        const isAbsent = record && record.status === 'Absent';
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${s.rollNumber}</td>
          <td><strong>${s.fullName}</strong> (${s.studentId})</td>
          <td>
            <div style="display: flex; gap: 1rem; align-items: center;">
              <label><input type="radio" name="att-status-${s.studentId}" value="Present" ${!isAbsent ? 'checked':''}> Present</label>
              <label><input type="radio" name="att-status-${s.studentId}" value="Absent" ${isAbsent ? 'checked':''}> Absent</label>
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });
    });
  }

  if (btnSaveAttendance) {
    btnSaveAttendance.addEventListener('click', () => {
      const cId = attSelectClass.value;
      const dateVal = attSelectDate.value;
      const students = window.skhs_db.find('students', 'classId', cId);
      const attendance = window.skhs_db.getCollection('attendance');
      const activeAY = sessionStorage.getItem("skhs_active_ay");

      students.forEach(s => {
        const radioVal = document.querySelector(`input[name="att-status-${s.studentId}"]:checked`).value;
        const index = attendance.findIndex(a => a.studentId === s.studentId && a.date === dateVal && a.academicYear === activeAY);

        if (index !== -1) {
          attendance[index].status = radioVal;
        } else {
          attendance.push({
            attendanceId: "ATT-" + Math.floor(100000 + Math.random()*900000),
            date: dateVal,
            studentId: s.studentId,
            classId: cId,
            status: radioVal,
            academicYear: activeAY
          });
        }
      });

      window.skhs_db.saveCollection('attendance', attendance);
      window.skhs_db.logActivity('attendance_submit', 'attendance', 'info', currentUser.userId, cId, `Saved attendance registry for class: ${cId} on date: ${dateVal} in year: ${activeAY}`);
      showAlert("Attendance parameters successfully stored.");
    });
  }

  // ============================================================
  //  8. EXAMINATION MANAGEMENT
  // ============================================================
  const btnAddExam = document.getElementById('btn-add-exam');

  if (btnAddExam) {
    btnAddExam.addEventListener('click', () => {
      const classes = window.skhs_db.getCollection('classes');
      const subjects = window.skhs_db.getCollection('subjects');
      
      let classOpts = classes.map(c => `<option value="${c.classId}">${c.name}</option>`).join('');
      let subOpts = subjects.map(s => `<option value="${s.subjectId}">${s.name}</option>`).join('');

      openModal('Schedule New Examination', `
        <form id="modal-exam-form">
          <div class="form-group">
            <label class="form-label">Exam Name</label>
            <input type="text" id="m-ex-name" class="form-input" placeholder="e.g. Unit Test 1" required>
          </div>
          <div class="form-group">
            <label class="form-label">Exam Category</label>
            <select id="m-ex-type" class="form-input">
              <option value="Unit Test">Unit Test</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Half-Yearly">Half-Yearly</option>
              <option value="Pre-Final">Pre-Final</option>
              <option value="Final">Final Examination</option>
            </select>
          </div>
          <div class="portal-grid portal-grid-2">
            <div class="form-group">
              <label class="form-label">Class</label>
              <select id="m-ex-class" class="form-input">${classOpts}</select>
            </div>
            <div class="form-group">
              <label class="form-label">Subject</label>
              <select id="m-ex-sub" class="form-input">${subOpts}</select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Exam Date</label>
            <input type="date" id="m-ex-date" class="form-input" required>
          </div>
          <button type="submit" class="btn-portal">Schedule Exam</button>
        </form>
      `);

      document.getElementById('modal-exam-form').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const activeAY = sessionStorage.getItem("skhs_active_ay");
        const ex = window.skhs_db.insert('exams', {
          examId: "EXM-" + Math.floor(500 + Math.random()*500),
          name: document.getElementById('m-ex-name').value.trim(),
          type: document.getElementById('m-ex-type').value,
          classId: document.getElementById('m-ex-class').value,
          subjectId: document.getElementById('m-ex-sub').value,
          date: document.getElementById('m-ex-date').value,
          published: false,
          academicYear: activeAY
        });

        if (ex) {
          window.skhs_db.logActivity('exam_schedule', 'exams', 'info', currentUser.userId, ex.examId, `Scheduled exam: ${ex.name} in year: ${activeAY}`);
          closeModal();
          loadExamsList();
          showAlert("Examination schedule created.");
        }
      });
    });
  }

  function loadExamsList() {
    const tbody = document.getElementById('exams-table-body');
    const activeAY = sessionStorage.getItem("skhs_active_ay");
    const exams = window.skhs_db.getCollection('exams').filter(ex => ex.academicYear === activeAY);
    const classes = window.skhs_db.getCollection('classes');
    const subjects = window.skhs_db.getCollection('subjects');

    tbody.innerHTML = '';
    exams.forEach(ex => {
      const cls = classes.find(c => c.classId === ex.classId);
      const sub = subjects.find(s => s.subjectId === ex.subjectId);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${ex.examId}</td>
        <td><strong>${ex.name}</strong></td>
        <td>${ex.type}</td>
        <td>${cls ? cls.name : ex.classId}</td>
        <td>${sub ? sub.name : ex.subjectId}</td>
        <td>${ex.date}</td>
        <td><span class="badge ${ex.published ? 'badge-success' : 'badge-warning'}">${ex.published ? 'Published' : 'Draft'}</span></td>
        <td>
          <div class="btn-action-group">
            ${!ex.published ? `<button class="btn-action btn-view" title="Publish Grades" data-action="publish" data-id="${ex.examId}">📣</button>` : ''}
            <button class="btn-action btn-delete" title="Remove" data-action="delete" data-id="${ex.examId}">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll('[data-id]').forEach(btn => {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      btn.addEventListener('click', () => {
        if (action === 'publish') publishExamResults(id);
        else if (action === 'delete') deleteExam(id);
      });
    });
  }

  function publishExamResults(examId) {
    const ex = window.skhs_db.findOne('exams', 'examId', examId);
    if (!ex) return;

    window.skhs_db.update('exams', 'examId', examId, { published: true });
    window.skhs_db.logActivity('exam_publish', 'exams', 'info', currentUser.userId, examId, `Published grading results for examination: ${ex.name}`);
    
    // Broadcast notifications to students/parents linked
    const students = window.skhs_db.find('students', 'classId', ex.classId);
    students.forEach(s => {
      window.skhs_db.addNotification(s.studentId, "Grades Released", `Report cards for exam "${ex.name}" are now visible on the student registry.`, "success");
    });

    loadExamsList();
    showAlert("Results published and alerts broadcasted.");
  }

  function deleteExam(id) {
    if (confirm("Are you sure you want to cancel this scheduled exam?")) {
      const deleted = window.skhs_db.delete('exams', 'examId', id);
      if (deleted) {
        window.skhs_db.logActivity('exam_delete', 'exams', 'warning', currentUser.userId, id, `Canceled scheduled exam: ${id}`);
        loadExamsList();
        showAlert("Exam scheduled entry deleted.");
      }
    }
  }

  // ============================================================
  //  9. MARKS REGISTRY
  // ============================================================
  const marksSelectExam = document.getElementById('marks-select-exam');
  const marksSelectClass = document.getElementById('marks-select-class');
  const btnLoadMarks = document.getElementById('btn-load-marks-sheet');
  const btnSaveMarks = document.getElementById('btn-save-marks');
  const marksSheetWrapper = document.getElementById('marks-sheet-wrapper');
  const marksEmptyMsg = document.getElementById('marks-empty-message');

  function initMarksModule() {
    if (marksSelectExam && marksSelectExam.children.length <= 1) {
      const activeAY = sessionStorage.getItem("skhs_active_ay");
      const exams = window.skhs_db.getCollection('exams').filter(ex => ex.academicYear === activeAY);
      const classes = window.skhs_db.getCollection('classes');

      exams.forEach(ex => {
        const opt = document.createElement('option');
        opt.value = ex.examId;
        opt.textContent = ex.name;
        marksSelectExam.appendChild(opt);
      });

      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.classId;
        opt.textContent = c.name;
        marksSelectClass.appendChild(opt);
      });
    }
  }

  if (btnLoadMarks) {
    btnLoadMarks.addEventListener('click', () => {
      const exId = marksSelectExam.value;
      const cId = marksSelectClass.value;

      if (!exId || !cId) {
        showAlert("Select both an Exam and Class.", "warning");
        return;
      }

      const students = window.skhs_db.find('students', 'classId', cId);
      const activeAY = sessionStorage.getItem("skhs_active_ay");
      const marks = window.skhs_db.getCollection('marks').filter(m => m.academicYear === activeAY);
      const tbody = document.getElementById('marks-table-body');

      tbody.innerHTML = '';
      marksEmptyMsg.style.display = 'none';
      marksSheetWrapper.style.display = 'block';

      if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">No students in selected class.</td></tr>`;
        btnSaveMarks.style.display = 'none';
        return;
      }

      btnSaveMarks.style.display = 'inline-block';
      students.forEach(s => {
        const record = marks.find(m => m.studentId === s.studentId && m.examId === exId);
        const score = record ? record.marksObtained : '';
        const maxScore = record ? record.maxMarks : '100';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${s.rollNumber}</td>
          <td>${s.studentId}</td>
          <td><strong>${s.fullName}</strong></td>
          <td><input type="number" class="form-input m-score-input" data-stud="${s.studentId}" style="max-width:120px;" value="${score}" placeholder="Score" required></td>
          <td><input type="number" class="form-input m-max-input" data-stud="${s.studentId}" style="max-width:120px;" value="${maxScore}" placeholder="Max Marks" required></td>
        `;
        tbody.appendChild(row);
      });
    });
  }

  if (btnSaveMarks) {
    btnSaveMarks.addEventListener('click', () => {
      const exId = marksSelectExam.value;
      const cId = marksSelectClass.value;
      const students = window.skhs_db.find('students', 'classId', cId);
      const marks = window.skhs_db.getCollection('marks');
      const activeAY = sessionStorage.getItem("skhs_active_ay");

      let allValid = true;
      students.forEach(s => {
        const scoreInput = document.querySelector(`.m-score-input[data-stud="${s.studentId}"]`);
        const maxInput = document.querySelector(`.m-max-input[data-stud="${s.studentId}"]`);

        const scoreVal = parseInt(scoreInput.value);
        const maxVal = parseInt(maxInput.value);

        if (isNaN(scoreVal) || isNaN(maxVal) || scoreVal > maxVal) {
          allValid = false;
          scoreInput.style.borderColor = 'var(--portal-error)';
        } else {
          scoreInput.style.borderColor = '';
          const index = marks.findIndex(m => m.studentId === s.studentId && m.examId === exId && m.academicYear === activeAY);

          if (index !== -1) {
            marks[index].marksObtained = scoreVal;
            marks[index].maxMarks = maxVal;
          } else {
            marks.push({
              markId: "MRK-" + Math.floor(100000 + Math.random()*900000),
              examId: exId,
              studentId: s.studentId,
              marksObtained: scoreVal,
              maxMarks: maxVal,
              academicYear: activeAY
            });
          }
        }
      });

      if (!allValid) {
        showAlert("Invalid scores detected. Score cannot exceed Max Marks.", "error");
        return;
      }

      window.skhs_db.saveCollection('marks', marks);
      window.skhs_db.logActivity('marks_submit', 'marks', 'info', currentUser.userId, exId, `Saved exam scorecard marks for exam: ${exId} in class: ${cId} for year: ${activeAY}`);
      showAlert("Grades & scores successfully saved.");
    });
  }

  // ============================================================
  //  10. HOMEWORK MODULE
  // ============================================================
  const btnAddHomework = document.getElementById('btn-add-homework');

  if (btnAddHomework) {
    btnAddHomework.addEventListener('click', () => {
      const classes = window.skhs_db.getCollection('classes');
      const subjects = window.skhs_db.getCollection('subjects');

      let classOpts = classes.map(c => `<option value="${c.classId}">${c.name}</option>`).join('');
      let subOpts = subjects.map(s => `<option value="${s.subjectId}">${s.name}</option>`).join('');

      openModal('Post Homework Assignment', `
        <form id="modal-homework-form">
          <div class="form-group">
            <label class="form-label">Homework Title</label>
            <input type="text" id="m-hw-title" class="form-input" required>
          </div>
          <div class="portal-grid portal-grid-2">
            <div class="form-group">
              <label class="form-label">Class</label>
              <select id="m-hw-class" class="form-input">${classOpts}</select>
            </div>
            <div class="form-group">
              <label class="form-label">Subject</label>
              <select id="m-hw-sub" class="form-input">${subOpts}</select>
            </div>
          </div>
          <div class="portal-grid portal-grid-2">
            <div class="form-group">
              <label class="form-label">Assign Date</label>
              <input type="date" id="m-hw-assd" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input type="date" id="m-hw-dued" class="form-input" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Instructions / Description</label>
            <textarea id="m-hw-desc" class="form-input" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Reference Document / Attachment (Optional)</label>
            <input type="file" id="m-hw-file" class="form-input" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif">
            <small style="color:var(--text-muted); font-size:0.75rem; display:block; margin-top:0.25rem;">Max file size: 5MB</small>
          </div>
          <button type="submit" class="btn-portal">Publish Assignment</button>
        </form>
      `);

      document.getElementById('modal-homework-form').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const activeAY = sessionStorage.getItem("skhs_active_ay");
        const submitBtn = ev.target.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        
        let attachmentUrl = '';
        const fileInput = document.getElementById('m-hw-file');
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;
        
        if (file) {
          if (file.size > 5 * 1024 * 1024) {
            showAlert("File is too large. Maximum size is 5MB.", "error");
            return;
          }
          if (submitBtn) {
            submitBtn.textContent = '⏳ Uploading Attachment...';
            submitBtn.disabled = true;
          }
          
          if (window.isSupabaseActive()) {
            const homeworkId = "HW-" + Math.floor(700 + Math.random()*300);
            const fileExtension = file.name.split('.').pop() || 'dat';
            const filePath = `homework/${homeworkId}_${Date.now()}.${fileExtension}`;
            
            const uploadRes = await window.uploadFileToSupabase('school-media', filePath, file);
            if (uploadRes.success) {
              attachmentUrl = uploadRes.publicUrl;
            } else {
              showAlert("Attachment upload failed: " + uploadRes.message, "error");
              if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
              }
              return;
            }
            
            const hw = window.skhs_db.insert('homework', {
              homeworkId: homeworkId,
              classId: document.getElementById('m-hw-class').value,
              subjectId: document.getElementById('m-hw-sub').value,
              title: document.getElementById('m-hw-title').value.trim(),
              description: document.getElementById('m-hw-desc').value.trim(),
              dateAssigned: document.getElementById('m-hw-assd').value,
              dueDate: document.getElementById('m-hw-dued').value,
              completedStudents: [],
              attachmentUrl: attachmentUrl,
              academicYear: activeAY
            });

            if (hw) {
              window.skhs_db.logActivity('homework_create', 'homework', 'info', currentUser.userId, hw.homeworkId, `Posted homework: ${hw.title} with attachment`);
              closeModal();
              loadHomeworkList();
              showAlert("Homework assignment published.");
            }
          } else {
            // LocalStorage mode mock base64/placeholder
            const homeworkId = "HW-" + Math.floor(700 + Math.random()*300);
            const reader = new FileReader();
            reader.onload = function(evt) {
              const hw = window.skhs_db.insert('homework', {
                homeworkId: homeworkId,
                classId: document.getElementById('m-hw-class').value,
                subjectId: document.getElementById('m-hw-sub').value,
                title: document.getElementById('m-hw-title').value.trim(),
                description: document.getElementById('m-hw-desc').value.trim(),
                dateAssigned: document.getElementById('m-hw-assd').value,
                dueDate: document.getElementById('m-hw-dued').value,
                completedStudents: [],
                attachmentUrl: evt.target.result, // base64 mock
                academicYear: activeAY
              });
              if (hw) {
                window.skhs_db.logActivity('homework_create', 'homework', 'info', currentUser.userId, hw.homeworkId, `Posted homework: ${hw.title} with attachment (local)`);
                closeModal();
                loadHomeworkList();
                showAlert("Homework assignment published.");
              }
            };
            reader.readAsDataURL(file);
          }
        } else {
          // Normal publish without file
          if (submitBtn) {
            submitBtn.textContent = 'Publishing...';
            submitBtn.disabled = true;
          }
          const hw = window.skhs_db.insert('homework', {
            homeworkId: "HW-" + Math.floor(700 + Math.random()*300),
            classId: document.getElementById('m-hw-class').value,
            subjectId: document.getElementById('m-hw-sub').value,
            title: document.getElementById('m-hw-title').value.trim(),
            description: document.getElementById('m-hw-desc').value.trim(),
            dateAssigned: document.getElementById('m-hw-assd').value,
            dueDate: document.getElementById('m-hw-dued').value,
            completedStudents: [],
            attachmentUrl: '',
            academicYear: activeAY
          });

          if (hw) {
            window.skhs_db.logActivity('homework_create', 'homework', 'info', currentUser.userId, hw.homeworkId, `Posted homework: ${hw.title} in year: ${activeAY}`);
            closeModal();
            loadHomeworkList();
            showAlert("Homework assignment published.");
          }
        }
      });
    });
  }

  function loadHomeworkList() {
    const tbody = document.getElementById('homework-table-body');
    const activeAY = sessionStorage.getItem("skhs_active_ay");
    const homework = window.skhs_db.getCollection('homework').filter(hw => hw.academicYear === activeAY);
    const classes = window.skhs_db.getCollection('classes');
    const subjects = window.skhs_db.getCollection('subjects');
    const students = window.skhs_db.getCollection('students');

    tbody.innerHTML = '';
    homework.forEach(hw => {
      const cls = classes.find(c => c.classId === hw.classId);
      const sub = subjects.find(s => s.subjectId === hw.subjectId);
      const totalStudents = students.filter(s => s.classId === hw.classId).length;
      const countCompleted = hw.completedStudents.length;

      const titleHtml = hw.attachmentUrl 
        ? `<strong>${hw.title}</strong><br><a href="${hw.attachmentUrl}" target="_blank" style="font-size: 0.75rem; color: var(--portal-accent); display: inline-flex; align-items: center; gap: 0.25rem; margin-top: 0.25rem; text-decoration: none;">📎 View Attachment</a>`
        : `<strong>${hw.title}</strong>`;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${hw.homeworkId}</td>
        <td>${cls ? cls.name : hw.classId}</td>
        <td>${sub ? sub.name : hw.subjectId}</td>
        <td>${titleHtml}</td>
        <td>${hw.dateAssigned}</td>
        <td>${hw.dueDate}</td>
        <td>${countCompleted} / ${totalStudents} Submitted</td>
        <td>
          <div class="btn-action-group">
            <button class="btn-action btn-delete" title="Remove" data-id="${hw.homeworkId}">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm("Are you sure you want to delete this homework assignment?")) {
          const deleted = window.skhs_db.delete('homework', 'homeworkId', id);
          if (deleted) {
            window.skhs_db.logActivity('homework_delete', 'homework', 'warning', currentUser.userId, id, `Deleted homework: ${id}`);
            loadHomeworkList();
            showAlert("Homework assignment deleted.");
          }
        }
      });
    });
  }

  // ============================================================
  //  11. FEE MANAGEMENT MODULE
  // ============================================================
  const btnFeeInvoices = document.getElementById('btn-fee-invoices');
  const btnFeeDefaulters = document.getElementById('btn-fee-defaulters');
  const feeInvoicesPane = document.getElementById('fee-invoices-pane');
  const feeDefaultersPane = document.getElementById('fee-defaulters-pane');
  const feeSearch = document.getElementById('fee-search');
  const btnAddFee = document.getElementById('btn-add-fee');

  if (btnFeeInvoices) {
    btnFeeInvoices.addEventListener('click', () => {
      btnFeeInvoices.classList.add('active');
      btnFeeDefaulters.classList.remove('active');
      feeInvoicesPane.style.display = 'block';
      feeDefaultersPane.style.display = 'none';
      loadFeesModule();
    });
  }

  if (btnFeeDefaulters) {
    btnFeeDefaulters.addEventListener('click', () => {
      btnFeeDefaulters.classList.add('active');
      btnFeeInvoices.classList.remove('active');
      feeDefaultersPane.style.display = 'block';
      feeInvoicesPane.style.display = 'none';
      loadFeeDefaultersList();
    });
  }

  if (feeSearch) feeSearch.addEventListener('input', loadFeesModule);

  if (btnAddFee) {
    btnAddFee.addEventListener('click', () => {
      const students = window.skhs_db.getCollection('students');
      let studOpts = students.map(s => `<option value="${s.studentId}">${s.fullName} (${s.studentId})</option>`).join('');

      openModal('Generate Fee Invoice', `
        <form id="modal-fee-form">
          <div class="form-group">
            <label class="form-label">Select Student</label>
            <select id="m-fee-student" class="form-input">${studOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">Fee Category</label>
            <select id="m-fee-type" class="form-input">
              <option value="Tuition Fee">Tuition Fee</option>
              <option value="Term Fee">Term Fee</option>
              <option value="Transport Fee">Transport Fee</option>
              <option value="Exam Fee">Exam Fee</option>
            </select>
          </div>
          <div class="portal-grid portal-grid-2">
            <div class="form-group">
              <label class="form-label">Amount (INR)</label>
              <input type="number" id="m-fee-amount" class="form-input" min="100" required>
            </div>
            <div class="form-group">
              <label class="form-label">Due Date</label>
              <input type="date" id="m-fee-dued" class="form-input" required>
            </div>
          </div>
          <button type="submit" class="btn-portal">Invoice Fee</button>
        </form>
      `);

      document.getElementById('modal-fee-form').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const activeAY = sessionStorage.getItem("skhs_active_ay");
        const fee = window.skhs_db.insert('fees', {
          feeId: "FEE-" + Math.floor(800 + Math.random()*200),
          studentId: document.getElementById('m-fee-student').value,
          feeType: document.getElementById('m-fee-type').value,
          amount: parseFloat(document.getElementById('m-fee-amount').value),
          dueDate: document.getElementById('m-fee-dued').value,
          status: "Pending",
          paymentHistory: [],
          academicYear: activeAY
        });

        if (fee) {
          window.skhs_db.logActivity('fee_invoice', 'fees', 'info', currentUser.userId, fee.feeId, `Created fee invoice: ${fee.feeType} for student ${fee.studentId} in year: ${activeAY}`);
          closeModal();
          loadFeesModule();
          showAlert("Fee invoice generated.");
        }
      });
    });
  }

  function loadFeesModule() {
    const tbody = document.getElementById('fees-table-body');
    const activeAY = sessionStorage.getItem("skhs_active_ay");
    let list = window.skhs_db.getCollection('fees').filter(f => f.academicYear === activeAY);
    const students = window.skhs_db.getCollection('students');

    const searchVal = feeSearch ? feeSearch.value.toLowerCase().trim() : '';
    if (searchVal) {
      list = list.filter(f => {
        const s = students.find(stud => stud.studentId === f.studentId);
        return s && s.fullName.toLowerCase().includes(searchVal);
      });
    }

    tbody.innerHTML = '';
    list.forEach(f => {
      const s = students.find(stud => stud.studentId === f.studentId);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${f.feeId}</td>
        <td><strong>${s ? s.fullName : f.studentId}</strong></td>
        <td>${f.feeType}</td>
        <td>₹${f.amount.toLocaleString()}</td>
        <td>${f.dueDate}</td>
        <td><span class="badge ${f.status === 'Paid' ? 'badge-success' : 'badge-warning'}">${f.status}</span></td>
        <td>
          <div class="btn-action-group">
            ${f.status === 'Pending' ? `<button class="btn-action btn-view" title="Record Payment" data-action="pay" data-id="${f.feeId}">💵</button>` : ''}
            <button class="btn-action btn-delete" title="Delete Invoice" data-action="delete" data-id="${f.feeId}">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });

    tbody.querySelectorAll('[data-id]').forEach(btn => {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      btn.addEventListener('click', () => {
        if (action === 'pay') recordFeePayment(id);
        else if (action === 'delete') deleteFeeInvoice(id);
      });
    });
  }

  function recordFeePayment(feeId) {
    const fee = window.skhs_db.findOne('fees', 'feeId', feeId);
    if (!fee) return;

    if (confirm(`Confirm payment of ₹${fee.amount} for this invoice?`)) {
      window.skhs_db.update('fees', 'feeId', feeId, {
        status: "Paid",
        paymentHistory: [{
          paymentId: "PAY-" + Math.floor(1000 + Math.random()*9000),
          date: new Date().toISOString().split('T')[0],
          amount: fee.amount,
          method: "Cash/Counter"
        }]
      });
      window.skhs_db.logActivity('fee_payment', 'fees', 'info', currentUser.userId, feeId, `Recorded payment for fee invoice: ${feeId}`);
      loadFeesModule();
      showAlert("Fee payment recorded.");
    }
  }

  function deleteFeeInvoice(id) {
    if (confirm("Are you sure you want to remove this invoice?")) {
      const deleted = window.skhs_db.delete('fees', 'feeId', id);
      if (deleted) {
        window.skhs_db.logActivity('fee_delete', 'fees', 'warning', currentUser.userId, id, `Canceled fee invoice: ${id}`);
        loadFeesModule();
        showAlert("Fee invoice deleted.");
      }
    }
  }

  function loadFeeDefaultersList() {
    const tbody = document.getElementById('fee-defaulters-table-body');
    const activeAY = sessionStorage.getItem("skhs_active_ay");
    const fees = window.skhs_db.getCollection('fees').filter(f => f.status === 'Pending' && f.academicYear === activeAY);
    const students = window.skhs_db.getCollection('students');
    const classes = window.skhs_db.getCollection('classes');

    tbody.innerHTML = '';
    if (fees.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No payment defaults recorded.</td></tr>`;
      return;
    }

    fees.forEach(f => {
      const s = students.find(stud => stud.studentId === f.studentId);
      const cls = s ? classes.find(c => c.classId === s.classId) : null;
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${f.studentId}</td>
        <td><strong>${s ? s.fullName : 'Unknown'}</strong></td>
        <td>${cls ? cls.name : ''}</td>
        <td>₹${f.amount.toLocaleString()}</td>
        <td>${f.dueDate}</td>
      `;
      tbody.appendChild(row);
    });
  }

  // ============================================================
  //  12. NOTIFICATION CENTER (ENHANCED)
  // ============================================================
  function loadNotificationsModule() {
    loadNotifications();
  }

  function loadNotifications() {
    const feedList = document.getElementById('notifications-feed-list');
    const ntfs = window.skhs_db.findOne('notifications', 'userId', currentUser.userId) 
      ? window.skhs_db.find('notifications', 'userId', currentUser.userId)
      : window.skhs_db.getCollection('notifications'); // show all for admin view

    // Sort descending by date
    ntfs.sort((a, b) => b.createdAt - a.createdAt);
    window.skhs_dom.renderNotifications(feedList, ntfs, markNotificationRead, { colorByType: true });
  }

  function markNotificationRead(id) {
    window.skhs_db.update('notifications', 'notificationId', id, { isRead: true });
    loadNotifications();
  }

  // Notice broadcast submission
  document.getElementById('broadcast-notification-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const target = document.getElementById('ntf-target').value;
    const title = window.skhs_security.normalizeText(document.getElementById('ntf-title').value, 120);
    const msg = window.skhs_security.normalizeMultilineText(document.getElementById('ntf-message').value, 1000);
    const type = document.getElementById('ntf-type').value;

    if (target === 'all') {
      const allUsers = window.skhs_db.getCollection('users');
      allUsers.forEach(u => {
        window.skhs_db.addNotification(u.userId, title, msg, type);
      });
    } else if (target === 'teachers') {
      const users = window.skhs_db.getCollection('users').filter(u => u.role === 'teacher');
      users.forEach(u => window.skhs_db.addNotification(u.userId, title, msg, type));
    } else if (target === 'parents') {
      const users = window.skhs_db.getCollection('users').filter(u => u.role === 'parent');
      users.forEach(u => window.skhs_db.addNotification(u.userId, title, msg, type));
    } else if (target === 'students') {
      const users = window.skhs_db.getCollection('users').filter(u => u.role === 'student');
      users.forEach(u => window.skhs_db.addNotification(u.userId, title, msg, type));
    }

    // Write activity log
    window.skhs_db.logActivity(
      'broadcast_notification',
      'user_management',
      'info',
      currentUser.userId,
      null,
      `Broadcasted notice "${title}" targeting: ${target}`
    );

    document.getElementById('broadcast-notification-form').reset();
    loadNotifications();
    showAlert("Broadcast notice published successfully!", "success");
  });

  // ============================================================
  //  13. REPORTS CENTER
  // ============================================================
  const repStudClass = document.getElementById('report-student-class');
  const repAttClass = document.getElementById('report-att-class');
  let reportsInitialized = false;

  function getWeeksInMonth(year, monthIndex) {
    const weeks = [];
    let firstDate = new Date(year, monthIndex, 1);
    let lastDate = new Date(year, monthIndex + 1, 0);

    let current = new Date(firstDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    current.setDate(diff);

    let weekNum = 1;
    while (current <= lastDate) {
      const monday = new Date(current);
      const sunday = new Date(current);
      sunday.setDate(monday.getDate() + 6);

      const formatDateStr = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const r = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${r}`;
      };

      const formatLabel = (d) => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[d.getMonth()]} ${d.getDate()}`;
      };

      weeks.push({
        label: `Week ${weekNum} (${formatLabel(monday)} - ${formatLabel(sunday)})`,
        start: formatDateStr(monday),
        end: formatDateStr(sunday)
      });

      current.setDate(current.getDate() + 7);
      weekNum++;
    }
    return weeks;
  }

  function renderAttendanceControls(period) {
    const container = document.getElementById('report-att-controls-container');
    if (!container) return;
    container.innerHTML = '';

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const createSelect = (id, options, selectedVal) => {
      const select = document.createElement('select');
      select.id = id;
      select.className = 'filter-select';
      select.style.flex = '1';
      select.style.minWidth = '100px';
      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        if (opt.value == selectedVal) option.selected = true;
        select.appendChild(option);
      });
      return select;
    };

    const yearOptions = [];
    for (let y = currentYear - 3; y <= currentYear + 2; y++) {
      yearOptions.push({ value: y, label: String(y) });
    }

    const monthOptions = [
      { value: 0, label: 'January' },
      { value: 1, label: 'February' },
      { value: 2, label: 'March' },
      { value: 3, label: 'April' },
      { value: 4, label: 'May' },
      { value: 5, label: 'June' },
      { value: 6, label: 'July' },
      { value: 7, label: 'August' },
      { value: 8, label: 'September' },
      { value: 9, label: 'October' },
      { value: 10, label: 'November' },
      { value: 11, label: 'December' }
    ];

    if (period === 'daily') {
      const input = document.createElement('input');
      input.type = 'date';
      input.id = 'report-att-date';
      input.className = 'filter-select';
      input.style.flex = '1';
      input.style.minWidth = '140px';
      input.style.lineHeight = 'normal';
      input.value = new Date().toISOString().split('T')[0];
      container.appendChild(input);
    } else if (period === 'weekly') {
      const yearSel = createSelect('report-att-year', yearOptions, currentYear);
      const monthSel = createSelect('report-att-month', monthOptions, currentMonth);
      const weekSel = document.createElement('select');
      weekSel.id = 'report-att-week';
      weekSel.className = 'filter-select';
      weekSel.style.flex = '1.5';
      weekSel.style.minWidth = '150px';

      const populateWeeks = () => {
        weekSel.innerHTML = '';
        const y = parseInt(yearSel.value, 10);
        const m = parseInt(monthSel.value, 10);
        const weeks = getWeeksInMonth(y, m);
        weeks.forEach(w => {
          const opt = document.createElement('option');
          opt.value = `${w.start}|${w.end}`;
          opt.textContent = w.label;
          weekSel.appendChild(opt);
        });
      };

      yearSel.addEventListener('change', populateWeeks);
      monthSel.addEventListener('change', populateWeeks);

      container.appendChild(yearSel);
      container.appendChild(monthSel);
      container.appendChild(weekSel);
      populateWeeks();
    } else if (period === 'monthly') {
      const yearSel = createSelect('report-att-year', yearOptions, currentYear);
      const monthSel = createSelect('report-att-month', monthOptions, currentMonth);
      container.appendChild(yearSel);
      container.appendChild(monthSel);
    } else if (period === 'yearly') {
      const yearSel = createSelect('report-att-year', yearOptions, currentYear);
      container.appendChild(yearSel);
    }
  }

  function initReportsModule() {
    if (repStudClass && repStudClass.children.length <= 1) {
      const classes = window.skhs_db.getCollection('classes');
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.classId;
        opt.textContent = c.name;
        repStudClass.appendChild(opt.cloneNode(true));
        repAttClass.appendChild(opt.cloneNode(true));
      });
    }

    if (!reportsInitialized) {
      const reportAttPeriod = document.getElementById('report-att-period');
      if (reportAttPeriod) {
        renderAttendanceControls(reportAttPeriod.value);
        reportAttPeriod.addEventListener('change', () => {
          renderAttendanceControls(reportAttPeriod.value);
        });
      }
      reportsInitialized = true;
    }
  }

  // Export helper
  function exportCSV(filename, rows) {
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Student report CSV
  document.getElementById('btn-rep-stud-csv').addEventListener('click', () => {
    const cId = repStudClass.value;
    let list = window.skhs_db.getCollection('students');
    if (cId !== 'all') list = list.filter(s => s.classId === cId);

    const rows = [["Student ID", "Full Name", "Gender", "Class ID", "Roll Number", "Status"]];
    list.forEach(s => rows.push([s.studentId, `"${s.fullName}"`, s.gender, s.classId, s.rollNumber, s.status]));
    exportCSV(`students_report_${cId}.csv`, rows);
  });

  // Student report PDF
  document.getElementById('btn-rep-stud-pdf').addEventListener('click', () => {
    const cId = repStudClass.value;
    let list = window.skhs_db.getCollection('students');
    if (cId !== 'all') list = list.filter(s => s.classId === cId);

    let html = `<h2>Student Directory Report - ${cId === 'all' ? 'All Classes' : cId}</h2>`;
    html += `<table class="portal-table" style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Gender</th>
          <th>Class</th>
          <th>Roll No</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>`;
    list.forEach(s => {
      html += `<tr>
        <td>${s.studentId}</td>
        <td>${s.fullName}</td>
        <td>${s.gender}</td>
        <td>${s.classId}</td>
        <td>${s.rollNumber}</td>
        <td>${s.status}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    
    printHTMLReport(html);
  });

  // Faculty report CSV
  document.getElementById('btn-rep-teach-csv').addEventListener('click', () => {
    const list = window.skhs_db.getCollection('teachers');
    const rows = [["Teacher ID", "Full Name", "Qualification", "Specialization", "Experience", "Status"]];
    list.forEach(t => rows.push([t.teacherId, `"${t.fullName}"`, t.qualification, t.subject, t.experience, t.status]));
    exportCSV("faculty_report.csv", rows);
  });

  // Faculty report PDF
  document.getElementById('btn-rep-teach-pdf').addEventListener('click', () => {
    const list = window.skhs_db.getCollection('teachers');
    let html = `<h2>Faculty Directory Report</h2>`;
    html += `<table class="portal-table" style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Qualification</th>
          <th>Specialization</th>
          <th>Experience</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>`;
    list.forEach(t => {
      html += `<tr>
        <td>${t.teacherId}</td>
        <td>${t.fullName}</td>
        <td>${t.qualification}</td>
        <td>${t.subject}</td>
        <td>${t.experience}</td>
        <td>${t.status}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    
    printHTMLReport(html);
  });

  // Helper to filter attendance by class and period parameters
  function getFilteredAttendance(cId, periodVal) {
    const activeAY = sessionStorage.getItem("skhs_active_ay");
    let list = window.skhs_db.getCollection('attendance').filter(a => a.academicYear === activeAY);
    if (cId !== 'all') {
      list = list.filter(a => a.classId === cId);
    }

    if (periodVal === 'daily') {
      const dateVal = document.getElementById('report-att-date').value;
      if (dateVal) {
        list = list.filter(a => a.date === dateVal);
      }
    } else if (periodVal === 'weekly') {
      const weekVal = document.getElementById('report-att-week').value; // format: "start|end"
      if (weekVal) {
        const [start, end] = weekVal.split('|');
        list = list.filter(a => a.date >= start && a.date <= end);
      }
    } else if (periodVal === 'monthly') {
      const year = document.getElementById('report-att-year').value;
      const month = String(parseInt(document.getElementById('report-att-month').value, 10) + 1).padStart(2, '0');
      const prefix = `${year}-${month}`;
      list = list.filter(a => a.date.startsWith(prefix));
    } else if (periodVal === 'yearly') {
      const year = document.getElementById('report-att-year').value;
      list = list.filter(a => a.date.startsWith(year));
    }
    return list;
  }

  // Attendance report CSV
  document.getElementById('btn-rep-att-csv').addEventListener('click', () => {
    const cId = repAttClass.value;
    const periodVal = document.getElementById('report-att-period').value;

    const list = getFilteredAttendance(cId, periodVal);

    let filename = `attendance_report_${cId}_${periodVal}`;
    if (periodVal === 'daily') {
      const dateVal = document.getElementById('report-att-date').value;
      filename += `_${dateVal || 'all'}`;
    } else if (periodVal === 'weekly') {
      const weekVal = document.getElementById('report-att-week');
      if (weekVal) {
        const label = weekVal.options[weekVal.selectedIndex].textContent.split(' (')[0].replace(' ', '_');
        filename += `_${label}`;
      }
    } else if (periodVal === 'monthly') {
      const year = document.getElementById('report-att-year').value;
      const month = String(parseInt(document.getElementById('report-att-month').value, 10) + 1).padStart(2, '0');
      filename += `_${year}_${month}`;
    } else if (periodVal === 'yearly') {
      const year = document.getElementById('report-att-year').value;
      filename += `_${year}`;
    }
    filename += '.csv';

    const rows = [["Attendance ID", "Student ID", "Class ID", "Date", "Status"]];
    list.forEach(a => rows.push([a.attendanceId, a.studentId, a.classId, a.date, a.status]));
    exportCSV(filename, rows);
  });

  // Attendance report PDF
  document.getElementById('btn-rep-att-pdf').addEventListener('click', () => {
    const cId = repAttClass.value;
    const periodVal = document.getElementById('report-att-period').value;

    const list = getFilteredAttendance(cId, periodVal);

    let periodDisplay = 'All Dates';
    if (periodVal === 'daily') {
      const dateVal = document.getElementById('report-att-date').value;
      periodDisplay = `Day: ${dateVal || 'All'}`;
    } else if (periodVal === 'weekly') {
      const weekVal = document.getElementById('report-att-week');
      periodDisplay = weekVal ? weekVal.options[weekVal.selectedIndex].textContent : 'Weekly';
    } else if (periodVal === 'monthly') {
      const year = document.getElementById('report-att-year').value;
      const monthName = document.getElementById('report-att-month').options[document.getElementById('report-att-month').selectedIndex].textContent;
      periodDisplay = `${monthName} ${year}`;
    } else if (periodVal === 'yearly') {
      const year = document.getElementById('report-att-year').value;
      periodDisplay = `Year: ${year}`;
    }

    let html = `<h2>Attendance Report - Class: ${cId.toUpperCase()}, Period: ${periodDisplay}</h2>`;
    html += `<table class="portal-table" style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th>ID</th>
          <th>Student ID</th>
          <th>Class</th>
          <th>Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>`;
    list.forEach(a => {
      html += `<tr>
        <td>${a.attendanceId}</td>
        <td>${a.studentId}</td>
        <td>${a.classId}</td>
        <td>${a.date}</td>
        <td>${a.status}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    
    printHTMLReport(html);
  });

  // Fee report CSV
  document.getElementById('btn-rep-fee-csv').addEventListener('click', () => {
    const statusVal = document.getElementById('report-fee-status').value;
    const activeAY = sessionStorage.getItem("skhs_active_ay");
    let list = window.skhs_db.getCollection('fees').filter(f => f.academicYear === activeAY);
    if (statusVal !== 'all') list = list.filter(f => f.status === statusVal);

    const rows = [["Invoice ID", "Student ID", "Fee Type", "Amount", "Due Date", "Status"]];
    list.forEach(f => rows.push([f.feeId, f.studentId, f.feeType, f.amount, f.dueDate, f.status]));
    exportCSV(`fees_report_${statusVal}.csv`, rows);
  });

  // Fee report PDF
  document.getElementById('btn-rep-fee-pdf').addEventListener('click', () => {
    const statusVal = document.getElementById('report-fee-status').value;
    const activeAY = sessionStorage.getItem("skhs_active_ay");
    let list = window.skhs_db.getCollection('fees').filter(f => f.academicYear === activeAY);
    if (statusVal !== 'all') list = list.filter(f => f.status === statusVal);

    let html = `<h2>Fee Invoice Registry Report - Status: ${statusVal}</h2>`;
    html += `<table class="portal-table" style="width:100%; border-collapse:collapse;">
      <thead>
        <tr>
          <th>Invoice ID</th>
          <th>Student ID</th>
          <th>Fee Type</th>
          <th>Amount</th>
          <th>Due Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>`;
    list.forEach(f => {
      html += `<tr>
        <td>${f.feeId}</td>
        <td>${f.studentId}</td>
        <td>${f.feeType}</td>
        <td>₹${f.amount}</td>
        <td>${f.dueDate}</td>
        <td>${f.status}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
    
    printHTMLReport(html);
  });

  // Helper print view generator
  function printHTMLReport(htmlContent) {
    const holder = document.getElementById('print-report-holder');
    holder.innerHTML = htmlContent;
    window.print();
    holder.innerHTML = '';
  }

  // ============================================================
  //  14. AUDIT LOGS MODULE (ENHANCED)
  // ============================================================
  const logModuleFilter = document.getElementById('log-filter-module');
  const logSeverityFilter = document.getElementById('log-filter-severity');
  const logSearchUser = document.getElementById('log-search-user');

  if (logModuleFilter) logModuleFilter.addEventListener('change', loadAuditLogs);
  if (logSeverityFilter) logSeverityFilter.addEventListener('change', loadAuditLogs);
  if (logSearchUser) logSearchUser.addEventListener('input', loadAuditLogs);

  function loadAuditLogs() {
    const tbody = document.getElementById('audit-logs-table-body');
    if (!tbody) return;
    let logs = window.skhs_db.getCollection('audit_logs');

    // Apply Filters
    const moduleVal = logModuleFilter ? logModuleFilter.value : 'all';
    const severityVal = logSeverityFilter ? logSeverityFilter.value : 'all';
    const searchUserVal = logSearchUser ? logSearchUser.value.toLowerCase().trim() : '';

    if (moduleVal !== 'all') {
      logs = logs.filter(l => l.module === moduleVal);
    }
    if (severityVal !== 'all') {
      logs = logs.filter(l => l.severity === severityVal);
    }
    if (searchUserVal) {
      logs = logs.filter(l => l.performedBy && l.performedBy.toLowerCase().includes(searchUserVal));
    }

    // Sort descending by timestamp
    logs.sort((a, b) => b.timestamp - a.timestamp);

    // Render using DOM APIs to prevent XSS
    window.skhs_dom.renderAuditLogs(tbody, logs);
  }

  // ============================================================
  //  15. SETTINGS MODULE
  // ============================================================
  const schoolForm = document.getElementById('settings-school-form');
  const securityForm = document.getElementById('settings-security-form');

  function loadSettingsModule() {
    const settings = window.skhs_db.getCollection('settings')[0];
    if (settings) {
      document.getElementById('set-school-name').value = settings.schoolName;
      document.getElementById('set-principal-name').value = settings.principalInfo;
      document.getElementById('set-contact-info').value = settings.contactInfo;

      document.getElementById('set-pwd-min-len').value = settings.passwordPolicy.minLength;
      document.getElementById('set-session-timeout').value = settings.sessionTimeout;
    }
  }

  if (schoolForm) {
    schoolForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const settings = window.skhs_db.getCollection('settings');
      if (settings.length > 0) {
        settings[0].schoolName = document.getElementById('set-school-name').value.trim();
        settings[0].principalInfo = document.getElementById('set-principal-name').value.trim();
        settings[0].contactInfo = document.getElementById('set-contact-info').value.trim();
        window.skhs_db.saveCollection('settings', settings);
        
        window.skhs_db.logActivity('settings_update', 'settings', 'info', currentUser.userId, null, "Updated general school profile metadata details.");
        showAlert("School profile details saved.");
      }
    });
  }

  if (securityForm) {
    securityForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const settings = window.skhs_db.getCollection('settings');
      if (settings.length > 0) {
        settings[0].passwordPolicy.minLength = parseInt(document.getElementById('set-pwd-min-len').value);
        settings[0].sessionTimeout = parseInt(document.getElementById('set-session-timeout').value);
        window.skhs_db.saveCollection('settings', settings);
        
        window.skhs_db.logActivity('settings_update', 'settings', 'warning', currentUser.userId, null, "Modified active session security policies.");
        showAlert("Security parameters successfully modified.");
      }
    });
  }

  // ============================================================
  //  16. MY PROFILE MODULE (ORIGINAL ACTIONS)
  // ============================================================
  function renderUserData() {
    if (!currentUser) return;
    
    // Header profile widget
    document.getElementById('header-fullname').textContent = currentUser.fullName;
    const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzFlMTUyZSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjZmZkZmJhIi8+PHBhdGggZD0iTTIwIDg1IEMyMCA2NSwgODAgNjUsIDgwIDg1IFoiIGZpbGw9IiM0NTg1ODgiLz48cGF0aCBkPSJNMzUgMzAgUTUwIDE1IDY1IDMwIiBzdHJva2U9IiMyODI4MjgiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";
    const avatarSrc = window.skhs_security.isAllowedImageDataUrl(currentUser.profilePhoto)
      ? currentUser.profilePhoto
      : defaultAvatar;
    document.getElementById('header-avatar').src = avatarSrc;
    document.getElementById('profile-avatar-preview').src = avatarSrc;

    // Form inputs
    document.getElementById('profile-name').value = currentUser.fullName || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-phone').value = currentUser.mobileNumber || '';

    // Update gauge
    updateProfileGauge();
  }

  function updateProfileGauge() {
    const percentage = window.skhs_db.calculateCompletion(currentUser);
    
    document.getElementById('profile-gauge-text').textContent = percentage + '%';
    const circle = document.getElementById('profile-gauge-circle');
    const circumference = 195;
    const offset = circumference - (percentage / 100) * circumference;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = offset;

    const checkPhoto = document.getElementById('check-photo');
    const checkContact = document.getElementById('check-contact');
    const checkPassword = document.getElementById('check-password');
    const checkActive = document.getElementById('check-active');

    if (currentUser.profilePhoto) {
      checkPhoto.classList.add('done');
      checkPhoto.querySelector('.status-icon').textContent = '✅';
    } else {
      checkPhoto.classList.remove('done');
      checkPhoto.querySelector('.status-icon').textContent = '❌';
    }

    if (currentUser.mobileNumber) {
      checkContact.classList.add('done');
      checkContact.querySelector('.status-icon').textContent = '✅';
    } else {
      checkContact.classList.remove('done');
      checkContact.querySelector('.status-icon').textContent = '❌';
    }

    if (!currentUser.isDefaultPassword) {
      checkPassword.classList.add('done');
      checkPassword.querySelector('.status-icon').textContent = '✅';
    } else {
      checkPassword.classList.remove('done');
      checkPassword.querySelector('.status-icon').textContent = '❌';
    }

    if (currentUser.accountActive) {
      checkActive.classList.add('done');
      checkActive.querySelector('.status-icon').textContent = '✅';
    } else {
      checkActive.classList.remove('done');
      checkActive.querySelector('.status-icon').textContent = '❌';
    }

    const desc = document.getElementById('profile-gauge-desc');
    if (percentage === 100) {
      desc.textContent = "Excellent! Your portal profile has been fully secured and verified.";
    } else {
      desc.textContent = `Finish the checklist below to complete profile settings (Current: ${percentage}%).`;
    }
  }

  // Save profile contact edits
  document.getElementById('profile-details-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-name').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.textContent = 'Saving...';
      submitBtn.disabled = true;
    }

    const res = await window.skhs_auth.updateProfile(currentUser.userId, name, phone, null);
    if (submitBtn) {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }

    if (res.success) {
      currentUser = res.user;
      renderUserData();
      showAlert("Profile details updated successfully!", "success");
    } else {
      showAlert(res.message, "error");
    }
  });

  // Photo uploader
  document.getElementById('photo-file-input').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.skhs_security.isAllowedImageFile(file)) {
      showAlert("Choose PNG, JPG, WebP or GIF under 1MB.", "error");
      e.target.value = '';
      return;
    }

    // Show loading spinner/overlay
    const avatarPreview = document.getElementById('profile-avatar-preview');
    const originalOpacity = avatarPreview ? avatarPreview.style.opacity : '';
    if (avatarPreview) avatarPreview.style.opacity = '0.5';
    const uploadLabel = document.querySelector('.photo-upload-label');
    const originalLabelText = uploadLabel ? uploadLabel.textContent : '';
    if (uploadLabel) uploadLabel.textContent = '⏳ Uploading...';

    const reader = new FileReader();
    reader.onload = async function(evt) {
      const base64Image = evt.target.result;
      const res = await window.skhs_auth.updateProfile(currentUser.userId, null, null, base64Image);
      
      if (avatarPreview) avatarPreview.style.opacity = originalOpacity;
      if (uploadLabel) uploadLabel.textContent = originalLabelText;

      if (res.success) {
        currentUser = res.user;
        renderUserData();
        showAlert("Profile image successfully updated.", "success");
      } else {
        showAlert(res.message, "error");
      }
    };
    reader.readAsDataURL(file);
  });

  // Password modify
  document.getElementById('profile-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldP = document.getElementById('pwd-old').value;
    const newP = document.getElementById('pwd-new').value;

    const res = await window.skhs_auth.changePassword(currentUser.userId, oldP, newP);
    if (res.success) {
      currentUser = window.skhs_auth.getCurrentUser();
      renderUserData();
      document.getElementById('profile-password-form').reset();
      showAlert("Account security credentials updated!", "success");
    } else {
      showAlert(res.message, "error");
    }
  });

  // Sign out triggers
  document.getElementById('sidebar-logout-btn').addEventListener('click', () => {
    window.skhs_auth.logout();
  });

  // ============================================================
  //  ACTIVE ACADEMIC YEAR SCOPING
  // ============================================================
  function initHeaderAcademicYear() {
    const select = document.getElementById('header-academic-year-select');
    if (!select) return;
    const ays = window.skhs_db.getCollection('academic_years');
    select.innerHTML = '';
    
    let activeAY = ays.find(y => y.status === 'Active');
    let storedAYId = sessionStorage.getItem("skhs_active_ay");
    
    if (storedAYId && ays.some(y => y.ayId === storedAYId)) {
      // Keep selected
    } else if (activeAY) {
      storedAYId = activeAY.ayId;
      sessionStorage.setItem("skhs_active_ay", storedAYId);
    } else if (ays.length > 0) {
      storedAYId = ays[0].ayId;
      sessionStorage.setItem("skhs_active_ay", storedAYId);
    }
    
    ays.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y.ayId;
      opt.textContent = y.name + (y.status === 'Active' ? ' (Active)' : '');
      if (y.ayId === storedAYId) opt.selected = true;
      select.appendChild(opt);
    });
    
    // Bind change handler
    select.onchange = () => {
      sessionStorage.setItem("skhs_active_ay", select.value);
      // Reload current tab view
      const activeLink = document.querySelector('.sidebar-link.active');
      const currentTab = activeLink ? activeLink.getAttribute('data-tab') : 'overview';
      loadModule(currentTab);
    };
  }

  // ============================================================
  //  17. ACADEMIC YEARS MANAGEMENT
  // ============================================================
  function loadAcademicYearsList() {
    const tbody = document.getElementById('academic-years-table-body');
    if (!tbody) return;
    const ays = window.skhs_db.getCollection('academic_years');
    tbody.innerHTML = '';
    
    if (ays.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No academic years configured.</td></tr>';
      return;
    }
    
    ays.forEach(y => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${y.ayId}</td>
        <td><strong>${y.name}</strong></td>
        <td>${y.startDate}</td>
        <td>${y.endDate}</td>
        <td><span class="badge ${y.status === 'Active' ? 'badge-success' : 'badge-warning'}">${y.status}</span></td>
        <td>
          <div class="btn-action-group">
            ${y.status !== 'Active' ? `<button class="btn-action btn-view" title="Activate Session" data-action="activate" data-id="${y.ayId}">✅</button>` : ''}
            <button class="btn-action btn-edit" title="Edit Session" data-action="edit" data-id="${y.ayId}">✏️</button>
            <button class="btn-action btn-delete" title="Delete Session" data-action="delete" data-id="${y.ayId}">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
    
    tbody.querySelectorAll('[data-id]').forEach(btn => {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      btn.onclick = () => {
        if (action === 'activate') activateAcademicYear(id);
        else if (action === 'edit') editAcademicYear(id);
        else if (action === 'delete') deleteAcademicYear(id);
      };
    });
  }

  const btnAddAY = document.getElementById('btn-add-academic-year');
  if (btnAddAY) {
    btnAddAY.onclick = () => {
      openModal('Add New Academic Year', `
        <form id="modal-ay-form">
          <div class="form-group">
            <label class="form-label">Academic Year Name (e.g. 2026-27)</label>
            <input type="text" id="m-ay-name" class="form-input" placeholder="yyyy-yy" required>
          </div>
          <div class="portal-grid portal-grid-2">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" id="m-ay-start" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">End Date</label>
              <input type="date" id="m-ay-end" class="form-input" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="m-ay-status" class="form-input">
              <option value="Archived">Archived / Inactive</option>
              <option value="Active">Active</option>
            </select>
          </div>
          <button type="submit" class="btn-portal">Create Academic Year</button>
        </form>
      `);
      
      document.getElementById('modal-ay-form').onsubmit = (e) => {
        e.preventDefault();
        const name = document.getElementById('m-ay-name').value.trim();
        const start = document.getElementById('m-ay-start').value;
        const end = document.getElementById('m-ay-end').value;
        const status = document.getElementById('m-ay-status').value;
        
        const ays = window.skhs_db.getCollection('academic_years');
        const ayId = "AY-" + name.replace(/\s+/g, '-');
        
        if (ays.some(y => y.ayId === ayId)) {
          showAlert("Academic year name already exists.", "error");
          return;
        }
        
        if (status === 'Active') {
          ays.forEach(y => y.status = 'Archived');
        }
        
        ays.push({ ayId, name, startDate: start, endDate: end, status });
        window.skhs_db.saveCollection('academic_years', ays);
        window.skhs_db.logActivity('ay_create', 'settings', 'info', currentUser.userId, ayId, `Created academic session: ${name}`);
        
        closeModal();
        initHeaderAcademicYear();
        loadAcademicYearsList();
        showAlert("Academic Year created successfully!");
      };
    };
  }

  function activateAcademicYear(id) {
    const ays = window.skhs_db.getCollection('academic_years');
    const target = ays.find(y => y.ayId === id);
    if (!target) return;
    
    ays.forEach(y => y.status = 'Archived');
    target.status = 'Active';
    
    window.skhs_db.saveCollection('academic_years', ays);
    window.skhs_db.logActivity('ay_activate', 'settings', 'warning', currentUser.userId, id, `Activated academic session: ${target.name}`);
    
    initHeaderAcademicYear();
    loadAcademicYearsList();
    showAlert(`Academic Year ${target.name} activated successfully!`);
  }

  function editAcademicYear(id) {
    const y = window.skhs_db.findOne('academic_years', 'ayId', id);
    if (!y) return;
    
    openModal(`Edit Academic Year: ${y.name}`, `
      <form id="modal-edit-ay-form">
        <div class="form-group">
          <label class="form-label">Academic Year Name</label>
          <input type="text" id="m-ay-name" class="form-input" value="${y.name}" readonly style="opacity:0.75; cursor:not-allowed;">
        </div>
        <div class="portal-grid portal-grid-2">
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input type="date" id="m-ay-start" class="form-input" value="${y.startDate}" required>
          </div>
          <div class="form-group">
            <label class="form-label">End Date</label>
            <input type="date" id="m-ay-end" class="form-input" value="${y.endDate}" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select id="m-ay-status" class="form-input">
            <option value="Archived" ${y.status === 'Archived' ? 'selected':''}>Archived / Inactive</option>
            <option value="Active" ${y.status === 'Active' ? 'selected':''}>Active</option>
          </select>
        </div>
        <button type="submit" class="btn-portal">Save Modifications</button>
      </form>
    `);
    
    document.getElementById('modal-edit-ay-form').onsubmit = (e) => {
      e.preventDefault();
      const start = document.getElementById('m-ay-start').value;
      const end = document.getElementById('m-ay-end').value;
      const status = document.getElementById('m-ay-status').value;
      
      const ays = window.skhs_db.getCollection('academic_years');
      const idx = ays.findIndex(item => item.ayId === id);
      if (idx !== -1) {
        if (status === 'Active' && ays[idx].status !== 'Active') {
          ays.forEach(item => item.status = 'Archived');
        }
        ays[idx].startDate = start;
        ays[idx].endDate = end;
        ays[idx].status = status;
        
        window.skhs_db.saveCollection('academic_years', ays);
        window.skhs_db.logActivity('ay_update', 'settings', 'info', currentUser.userId, id, `Modified academic session: ${y.name}`);
        
        closeModal();
        initHeaderAcademicYear();
        loadAcademicYearsList();
        showAlert("Academic Year configurations updated.");
      }
    };
  }

  function deleteAcademicYear(id) {
    const y = window.skhs_db.findOne('academic_years', 'ayId', id);
    if (!y) return;
    if (y.status === 'Active') {
      showAlert("Cannot delete the active academic year.", "error");
      return;
    }
    if (confirm(`Are you sure you want to delete Academic Year: ${y.name}?`)) {
      const deleted = window.skhs_db.delete('academic_years', 'ayId', id);
      if (deleted) {
        window.skhs_db.logActivity('ay_delete', 'settings', 'warning', currentUser.userId, id, `Deleted academic session: ${y.name}`);
        initHeaderAcademicYear();
        loadAcademicYearsList();
        showAlert("Academic Year removed.");
      }
    }
  }

  // ============================================================
  //  18. STUDENT PROMOTION MODULE
  // ============================================================
  const btnPromoDesk = document.getElementById('btn-promo-desk');
  const btnPromoLogs = document.getElementById('btn-promo-logs');
  const promoDeskPane = document.getElementById('promo-desk-pane');
  const promoLogsPane = document.getElementById('promo-logs-pane');
  const promoSourceClass = document.getElementById('promo-source-class');
  const promoTargetClass = document.getElementById('promo-target-class');
  const btnLoadPromoRoster = document.getElementById('btn-load-promo-roster');
  const promoRosterWrapper = document.getElementById('promo-roster-wrapper');
  const promoEmptyMsg = document.getElementById('promo-empty-msg');
  const btnPromoSelectAll = document.getElementById('btn-promo-select-all');
  const btnPromoDeselectAll = document.getElementById('btn-promo-deselect-all');
  const btnSubmitBulkPromotion = document.getElementById('btn-submit-bulk-promotion');

  function initPromotionsModule() {
    const classes = window.skhs_db.getCollection('classes');
    if (promoSourceClass && promoSourceClass.children.length <= 1) {
      promoSourceClass.innerHTML = '<option value="">-- Choose Class --</option>';
      promoTargetClass.innerHTML = '<option value="">-- Choose Class --</option>';
      classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.classId;
        opt.textContent = c.name;
        promoSourceClass.appendChild(opt.cloneNode(true));
        promoTargetClass.appendChild(opt.cloneNode(true));
      });
    }
    
    if (promoRosterWrapper) promoRosterWrapper.style.display = 'none';
    if (promoEmptyMsg) promoEmptyMsg.style.display = 'block';
    
    loadPromotionLogs();
  }

  if (btnPromoDesk) {
    btnPromoDesk.onclick = () => {
      btnPromoDesk.classList.add('active');
      btnPromoLogs.classList.remove('active');
      promoDeskPane.style.display = 'block';
      promoLogsPane.style.display = 'none';
    };
  }

  if (btnPromoLogs) {
    btnPromoLogs.onclick = () => {
      btnPromoLogs.classList.add('active');
      btnPromoDesk.classList.remove('active');
      promoLogsPane.style.display = 'block';
      promoDeskPane.style.display = 'none';
      loadPromotionLogs();
    };
  }

  if (btnLoadPromoRoster) {
    btnLoadPromoRoster.onclick = () => {
      const src = promoSourceClass.value;
      const dest = promoTargetClass.value;
      if (!src || !dest) {
        showAlert("Choose both Source and Target classes.", "warning");
        return;
      }
      if (src === dest) {
        showAlert("Source and Target classes must be different.", "warning");
        return;
      }
      
      const students = window.skhs_db.find('students', 'classId', src).filter(s => s.status === 'Active');
      const tbody = document.getElementById('promo-roster-table-body');
      tbody.innerHTML = '';
      
      if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem;">No active students in selected class.</td></tr>';
        promoRosterWrapper.style.display = 'block';
        promoEmptyMsg.style.display = 'none';
        btnSubmitBulkPromotion.disabled = true;
        return;
      }
      
      btnSubmitBulkPromotion.disabled = false;
      students.forEach(s => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><input type="checkbox" class="promo-student-checkbox" value="${s.studentId}" checked></td>
          <td>${s.rollNumber}</td>
          <td>${s.studentId}</td>
          <td><strong>${s.fullName}</strong></td>
          <td>${promoSourceClass.options[promoSourceClass.selectedIndex].textContent}</td>
        `;
        tbody.appendChild(row);
      });
      
      promoRosterWrapper.style.display = 'block';
      promoEmptyMsg.style.display = 'none';
    };
  }

  if (btnPromoSelectAll) {
    btnPromoSelectAll.onclick = () => {
      document.querySelectorAll('.promo-student-checkbox').forEach(cb => cb.checked = true);
    };
  }

  if (btnPromoDeselectAll) {
    btnPromoDeselectAll.onclick = () => {
      document.querySelectorAll('.promo-student-checkbox').forEach(cb => cb.checked = false);
    };
  }

  if (btnSubmitBulkPromotion) {
    btnSubmitBulkPromotion.onclick = () => {
      const src = promoSourceClass.value;
      const dest = promoTargetClass.value;
      const checkboxes = document.querySelectorAll('.promo-student-checkbox:checked');
      if (checkboxes.length === 0) {
        showAlert("Please select at least one student to promote.", "warning");
        return;
      }
      
      const activeAY = sessionStorage.getItem("skhs_active_ay");
      if (confirm(`Confirm promotion of ${checkboxes.length} student(s) to Class ${promoTargetClass.options[promoTargetClass.selectedIndex].textContent}?`)) {
        checkboxes.forEach(cb => {
          const studentId = cb.value;
          const stud = window.skhs_db.findOne('students', 'studentId', studentId);
          if (stud) {
            window.skhs_db.update('students', 'studentId', studentId, { classId: dest });
            window.skhs_db.insert('promotions', {
              promoId: window.createId("PRM"),
              studentId,
              prevClassId: src,
              newClassId: dest,
              promoDate: new Date().toISOString().split('T')[0],
              ayId: activeAY
            });
            window.skhs_db.logActivity('student_promote', 'student', 'info', currentUser.userId, studentId, `Promoted student ${stud.fullName} from class ${src} to ${dest}`);
          }
        });
        
        showAlert("Class promotion completed successfully!");
        promoRosterWrapper.style.display = 'none';
        promoEmptyMsg.style.display = 'block';
        promoSourceClass.value = '';
        promoTargetClass.value = '';
        loadPromotionLogs();
      }
    };
  }

  function loadPromotionLogs() {
    const tbody = document.getElementById('promo-logs-table-body');
    if (!tbody) return;
    const logs = window.skhs_db.getCollection('promotions');
    const students = window.skhs_db.getCollection('students');
    const classes = window.skhs_db.getCollection('classes');
    tbody.innerHTML = '';
    
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No promotion records found.</td></tr>';
      return;
    }
    
    const sortedLogs = [...logs].sort((a, b) => new Date(b.promoDate) - new Date(a.promoDate));
    sortedLogs.forEach(log => {
      const s = students.find(stud => stud.studentId === log.studentId);
      const prevC = classes.find(c => c.classId === log.prevClassId);
      const newC = classes.find(c => c.classId === log.newClassId);
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${log.promoId}</td>
        <td>${log.studentId}</td>
        <td><strong>${s ? s.fullName : 'Unknown Student'}</strong></td>
        <td>${prevC ? prevC.name : log.prevClassId}</td>
        <td>${newC ? newC.name : log.newClassId}</td>
        <td>${log.promoDate}</td>
        <td>${log.ayId}</td>
      `;
      tbody.appendChild(row);
    });
  }

  // ============================================================
  //  19. LEAVE MANAGEMENT MODULE
  // ============================================================
  const leaveFilterType = document.getElementById('leave-filter-type');
  const leaveFilterStatus = document.getElementById('leave-filter-status');
  const btnRequestLeave = document.getElementById('btn-request-leave');

  if (leaveFilterType) leaveFilterType.onchange = loadLeavesModule;
  if (leaveFilterStatus) leaveFilterStatus.onchange = loadLeavesModule;

  function loadLeavesModule() {
    const tbody = document.getElementById('leaves-table-body');
    if (!tbody) return;
    let leaves = window.skhs_db.getCollection('leave_requests');
    
    const typeVal = leaveFilterType ? leaveFilterType.value : 'all';
    if (typeVal !== 'all') {
      leaves = leaves.filter(l => l.applicantType === typeVal);
    }
    
    const statusVal = leaveFilterStatus ? leaveFilterStatus.value : 'all';
    if (statusVal !== 'all') {
      leaves = leaves.filter(l => l.status === statusVal);
    }
    
    const allLeaves = window.skhs_db.getCollection('leave_requests');
    document.getElementById('leave-kpi-pending').textContent = allLeaves.filter(l => l.status === 'Pending').length;
    document.getElementById('leave-kpi-approved').textContent = allLeaves.filter(l => l.status === 'Approved').length;
    document.getElementById('leave-kpi-rejected').textContent = allLeaves.filter(l => l.status === 'Rejected').length;
    
    tbody.innerHTML = '';
    if (leaves.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No leave requests match filters.</td></tr>';
      return;
    }
    
    leaves.forEach(l => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${l.leaveId}</td>
        <td><strong>${l.applicantName}</strong> (${l.applicantId})</td>
        <td><span class="badge" style="color:white; background:${l.applicantType === 'Teacher' ? 'var(--portal-primary-light)' : '#8b5cf6'}">${l.applicantType}</span></td>
        <td>${l.startDate} to ${l.endDate}</td>
        <td>${l.reason}</td>
        <td><span class="badge ${l.status === 'Approved' ? 'badge-success' : l.status === 'Rejected' ? 'badge-warning' : 'badge-info'}" style="${l.status === 'Rejected' ? 'background:var(--portal-error) !important;' : ''}">${l.status}</span></td>
        <td>
          <div class="btn-action-group">
            ${l.status === 'Pending' ? `
              <button class="btn-action btn-view" title="Approve Request" data-action="approve" data-id="${l.leaveId}">✅</button>
              <button class="btn-action btn-edit" title="Reject Request" data-action="reject" data-id="${l.leaveId}" style="background:var(--portal-error); color:white;">❌</button>
            ` : ''}
            <button class="btn-action btn-delete" title="Delete Log" data-action="delete" data-id="${l.leaveId}">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
    
    tbody.querySelectorAll('[data-id]').forEach(btn => {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      btn.onclick = () => {
        if (action === 'approve') updateLeaveStatus(id, 'Approved');
        else if (action === 'reject') updateLeaveStatus(id, 'Rejected');
        else if (action === 'delete') deleteLeaveRequest(id);
      };
    });
  }

  function updateLeaveStatus(id, status) {
    const l = window.skhs_db.findOne('leave_requests', 'leaveId', id);
    if (!l) return;
    
    window.skhs_db.update('leave_requests', 'leaveId', id, { status });
    window.skhs_db.logActivity('leave_status_update', 'profile', 'info', currentUser.userId, id, `Set leave status to ${status} for ${l.applicantName}`);
    
    if (l.applicantType === 'Student') {
      window.skhs_db.addNotification(l.applicantId, `Leave Request ${status}`, `Your leave application from ${l.startDate} has been ${status.toLowerCase()}.`, status === 'Approved' ? 'success' : 'alert');
    }
    
    loadLeavesModule();
    showAlert(`Leave request successfully ${status.toLowerCase()}`);
  }

  function deleteLeaveRequest(id) {
    if (confirm("Are you sure you want to remove this leave entry?")) {
      const deleted = window.skhs_db.delete('leave_requests', 'leaveId', id);
      if (deleted) {
        window.skhs_db.logActivity('leave_delete', 'profile', 'warning', currentUser.userId, id, `Deleted leave request record: ${id}`);
        loadLeavesModule();
        showAlert("Leave entry removed.");
      }
    }
  }

  if (btnRequestLeave) {
    btnRequestLeave.onclick = () => {
      openModal('Create Leave Request', `
        <form id="modal-leave-form">
          <div class="form-group">
            <label class="form-label">Applicant Role</label>
            <select id="m-lv-role" class="form-input">
              <option value="Student">Student</option>
              <option value="Teacher">Teacher / Faculty</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Select Person</label>
            <select id="m-lv-person" class="form-input" required>
              <!-- Dynamic -->
            </select>
          </div>
          <div class="portal-grid portal-grid-2">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" id="m-lv-start" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">End Date</label>
              <input type="date" id="m-lv-end" class="form-input" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Reason for Leave</label>
            <textarea id="m-lv-reason" class="form-input" rows="2" placeholder="Describe leave justification..." required></textarea>
          </div>
          <button type="submit" class="btn-portal">Submit Request</button>
        </form>
      `);
      
      const roleSel = document.getElementById('m-lv-role');
      const personSel = document.getElementById('m-lv-person');
      
      const populateApplicants = () => {
        personSel.innerHTML = '';
        if (roleSel.value === 'Student') {
          const list = window.skhs_db.getCollection('students');
          list.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.studentId + '|' + s.fullName;
            opt.textContent = `${s.fullName} (${s.studentId})`;
            personSel.appendChild(opt);
          });
        } else {
          const list = window.skhs_db.getCollection('teachers');
          list.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.teacherId + '|' + t.fullName;
            opt.textContent = `${t.fullName} (${t.teacherId})`;
            personSel.appendChild(opt);
          });
        }
      };
      
      roleSel.onchange = populateApplicants;
      populateApplicants();
      
      document.getElementById('modal-leave-form').onsubmit = (e) => {
        e.preventDefault();
        const role = roleSel.value;
        const [pId, pName] = personSel.value.split('|');
        const start = document.getElementById('m-lv-start').value;
        const end = document.getElementById('m-lv-end').value;
        const reason = document.getElementById('m-lv-reason').value.trim();
        
        const req = window.skhs_db.insert('leave_requests', {
          leaveId: "LV-" + Math.floor(1000 + Math.random()*9000),
          applicantId: pId,
          applicantName: pName,
          applicantType: role,
          reason,
          startDate: start,
          endDate: end,
          status: "Pending"
        });
        
        if (req) {
          window.skhs_db.logActivity('leave_request_create', 'profile', 'info', currentUser.userId, req.leaveId, `Created leave request for ${pName}`);
          closeModal();
          loadLeavesModule();
          showAlert("Leave request submitted successfully!");
        }
      };
    };
  }

  // ============================================================
  //  20. SCHOOL CALENDAR MODULE
  // ============================================================
  let calDate = new Date();
  let calViewMode = 'month';
  const calTitle = document.getElementById('cal-current-month-year');
  const btnCalPrev = document.getElementById('btn-cal-prev');
  const btnCalNext = document.getElementById('btn-cal-next');
  const btnCalViewMonth = document.getElementById('btn-cal-view-month');
  const btnCalViewWeek = document.getElementById('btn-cal-view-week');
  const btnCalViewAgenda = document.getElementById('btn-cal-view-agenda');
  const calFilterCat = document.getElementById('cal-filter-category');
  const btnCalAddEvent = document.getElementById('btn-cal-add-event');

  function initCalendarModule() {
    if (calFilterCat) calFilterCat.onchange = renderCalendar;
    renderCalendar();
  }

  if (btnCalPrev) {
    btnCalPrev.onclick = () => {
      if (calViewMode === 'month') calDate.setMonth(calDate.getMonth() - 1);
      else if (calViewMode === 'week') calDate.setDate(calDate.getDate() - 7);
      else calDate.setMonth(calDate.getMonth() - 1);
      renderCalendar();
    };
  }

  if (btnCalNext) {
    btnCalNext.onclick = () => {
      if (calViewMode === 'month') calDate.setMonth(calDate.getMonth() + 1);
      else if (calViewMode === 'week') calDate.setDate(calDate.getDate() + 7);
      else calDate.setMonth(calDate.getMonth() + 1);
      renderCalendar();
    };
  }

  const setView = (mode) => {
    calViewMode = mode;
    btnCalViewMonth.classList.remove('active');
    btnCalViewWeek.classList.remove('active');
    btnCalViewAgenda.classList.remove('active');
    
    document.getElementById('calendar-month-view').style.display = 'none';
    document.getElementById('calendar-week-view').style.display = 'none';
    document.getElementById('calendar-agenda-view').style.display = 'none';
    
    if (mode === 'month') {
      btnCalViewMonth.classList.add('active');
      document.getElementById('calendar-month-view').style.display = 'block';
    } else if (mode === 'week') {
      btnCalViewWeek.classList.add('active');
      document.getElementById('calendar-week-view').style.display = 'block';
    } else {
      btnCalViewAgenda.classList.add('active');
      document.getElementById('calendar-agenda-view').style.display = 'block';
    }
    renderCalendar();
  };

  if (btnCalViewMonth) btnCalViewMonth.onclick = () => setView('month');
  if (btnCalViewWeek) btnCalViewWeek.onclick = () => setView('week');
  if (btnCalViewAgenda) btnCalViewAgenda.onclick = () => setView('agenda');

  function getEventsListFiltered() {
    let list = window.skhs_db.getCollection('calendar_events');
    const cat = calFilterCat ? calFilterCat.value : 'all';
    if (cat !== 'all') {
      list = list.filter(e => e.category === cat);
    }
    return list;
  }

  function renderCalendar() {
    const list = getEventsListFiltered();
    if (calViewMode === 'month') {
      renderMonthView(list);
    } else if (calViewMode === 'week') {
      renderWeekView(list);
    } else {
      renderAgendaView(list);
    }
  }

  function renderMonthView(events) {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    calTitle.textContent = `${months[month]} ${year}`;
    
    const container = document.getElementById('calendar-month-grid-container');
    if (!container) return;
    container.innerHTML = '';
    
    const header = document.createElement('div');
    header.className = 'calendar-grid-header';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(d => {
      const el = document.createElement('div');
      el.textContent = d;
      header.appendChild(el);
    });
    container.appendChild(header);
    
    const body = document.createElement('div');
    body.className = 'calendar-grid-body';
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();
    
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell other-month';
      const num = prevTotalDays - i;
      cell.innerHTML = `<span class="calendar-day-number">${num}</span>`;
      body.appendChild(cell);
    }
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    for (let day = 1; day <= totalDays; day++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell';
      
      const currentFullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (currentFullDate === todayStr) {
        cell.classList.add('today');
      }
      
      const dayEvents = events.filter(e => {
        return currentFullDate >= e.startDate && currentFullDate <= e.endDate;
      });
      
      let eventsHTML = '';
      dayEvents.forEach(e => {
        eventsHTML += `<button class="calendar-event-pill event-${e.category}" data-evt-id="${e.eventId}">${e.title}</button>`;
      });
      
      cell.innerHTML = `
        <span class="calendar-day-number">${day}</span>
        <div class="calendar-day-events">${eventsHTML}</div>
      `;
      
      cell.querySelectorAll('.calendar-event-pill').forEach(pill => {
        pill.onclick = (e) => {
          e.stopPropagation();
          viewEventDetails(pill.getAttribute('data-evt-id'));
        };
      });
      
      body.appendChild(cell);
    }
    
    const totalCells = firstDayIndex + totalDays;
    const nextPadding = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= nextPadding; i++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell other-month';
      cell.innerHTML = `<span class="calendar-day-number">${i}</span>`;
      body.appendChild(cell);
    }
    
    container.appendChild(body);
  }

  function renderWeekView(events) {
    const year = calDate.getFullYear();
    const day = calDate.getDate();
    
    const currentWeekStart = new Date(calDate);
    currentWeekStart.setDate(day - calDate.getDay());
    
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    calTitle.textContent = `${months[currentWeekStart.getMonth()]} ${currentWeekStart.getDate()} - ${months[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${year}`;
    
    const tbody = document.getElementById('calendar-week-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
      
      const dayEvents = events.filter(e => dateStr >= e.startDate && dateStr <= e.endDate);
      let eventsHTML = '';
      if (dayEvents.length === 0) {
        eventsHTML = '<span style="color:var(--portal-text-muted); font-size:0.8rem;">No events scheduled.</span>';
      } else {
        dayEvents.forEach(e => {
          eventsHTML += `
            <div style="background:var(--portal-bg); padding:0.5rem; margin-bottom:0.4rem; border-left:4px solid ${e.category === 'Exam' ? 'var(--portal-error)' : e.category === 'Holiday' ? '#8b5cf6' : e.category === 'Meeting' ? 'var(--portal-info)' : 'var(--portal-success)'}; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <strong style="font-size:0.85rem; cursor:pointer;" class="cal-link" data-evt-id="${e.eventId}">${e.title}</strong>
                <p style="margin:0.25rem 0 0 0; font-size:0.75rem; color:var(--portal-text-muted);">${e.description}</p>
              </div>
              <span class="badge" style="font-size:0.65rem; color:white; background:${e.category === 'Exam' ? 'var(--portal-error)' : e.category === 'Holiday' ? '#8b5cf6' : e.category === 'Meeting' ? 'var(--portal-info)' : 'var(--portal-success)'}">${e.category}</span>
            </div>
          `;
        });
      }
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${label}</strong></td>
        <td>${eventsHTML}</td>
      `;
      tbody.appendChild(row);
    }
    
    tbody.querySelectorAll('.cal-link').forEach(link => {
      link.onclick = () => viewEventDetails(link.getAttribute('data-evt-id'));
    });
  }

  function renderAgendaView(events) {
    calTitle.textContent = "Agenda Summary Timeline";
    const container = document.getElementById('calendar-agenda-list-container');
    if (!container) return;
    container.innerHTML = '';
    
    if (events.length === 0) {
      container.innerHTML = '<div style="text-align:center; color:var(--portal-text-muted); padding:3rem 1rem;">No events found.</div>';
      return;
    }
    
    const sorted = [...events].sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
    sorted.forEach(e => {
      const card = document.createElement('div');
      card.className = 'notification-card';
      card.style.background = 'var(--portal-card-bg)';
      card.style.borderLeft = `4px solid ${e.category === 'Exam' ? 'var(--portal-error)' : e.category === 'Holiday' ? '#8b5cf6' : e.category === 'Meeting' ? 'var(--portal-info)' : 'var(--portal-success)'}`;
      
      card.innerHTML = `
        <div class="notification-card-header">
          <div class="notification-card-title" style="font-size:0.95rem; color:var(--portal-text-main); font-weight:700;">${e.title}</div>
          <div class="notification-card-time">${e.startDate} to ${e.endDate}</div>
        </div>
        <p style="margin:0.5rem 0; font-size:0.85rem; color:var(--portal-text-muted);">${e.description}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.75rem;">
          <span class="badge" style="font-size:0.7rem; color:white; background:${e.category === 'Exam' ? 'var(--portal-error)' : e.category === 'Holiday' ? '#8b5cf6' : e.category === 'Meeting' ? 'var(--portal-info)' : 'var(--portal-success)'}">${e.category}</span>
          <button class="btn-portal cal-agenda-view-btn" data-evt-id="${e.eventId}" style="width:auto; padding:0.25rem 0.75rem; font-size:0.75rem;">Manage Event</button>
        </div>
      `;
      container.appendChild(card);
    });
    
    container.querySelectorAll('.cal-agenda-view-btn').forEach(btn => {
      btn.onclick = () => viewEventDetails(btn.getAttribute('data-evt-id'));
    });
  }

  function viewEventDetails(id) {
    const e = window.skhs_db.findOne('calendar_events', 'eventId', id);
    if (!e) return;
    
    openModal(`Event: ${e.title}`, `
      <div class="profile-detail-section">
        <h4 class="profile-section-title">Schedule Information</h4>
        <div class="profile-detail-grid" style="grid-template-columns: 1fr; gap:0.50rem;">
          <div class="profile-detail-item"><span class="profile-detail-label">Title</span><span class="profile-detail-value"><strong>${e.title}</strong></span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Category</span><span class="profile-detail-value"><span class="badge" style="color:white; background:${e.category === 'Exam' ? 'var(--portal-error)' : e.category === 'Holiday' ? '#8b5cf6' : e.category === 'Meeting' ? 'var(--portal-info)' : 'var(--portal-success)'}">${e.category}</span></span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Duration</span><span class="profile-detail-value">${e.startDate} to ${e.endDate}</span></div>
          <div class="profile-detail-item"><span class="profile-detail-label">Description</span><span class="profile-detail-value">${e.description}</span></div>
        </div>
      </div>
      <div style="margin-top:1.5rem; display:flex; gap:0.75rem; justify-content:flex-end;">
        <button class="btn-portal" id="btn-edit-evt" style="width:auto; padding:0.5rem 1rem;">Edit Event</button>
        <button class="btn-portal" id="btn-delete-evt" style="width:auto; padding:0.5rem 1rem; background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%)">Delete Event</button>
      </div>
    `);
    
    document.getElementById('btn-edit-evt').onclick = () => {
      closeModal();
      editCalendarEvent(id);
    };
    
    document.getElementById('btn-delete-evt').onclick = () => {
      if (confirm("Are you sure you want to delete this event?")) {
        const deleted = window.skhs_db.delete('calendar_events', 'eventId', id);
        if (deleted) {
          window.skhs_db.logActivity('event_delete', 'settings', 'warning', currentUser.userId, id, `Deleted calendar event: ${e.title}`);
          closeModal();
          renderCalendar();
          showAlert("Event removed successfully.");
        }
      }
    };
  }

  function editCalendarEvent(id) {
    const e = window.skhs_db.findOne('calendar_events', 'eventId', id);
    if (!e) return;
    
    openModal(`Edit Event: ${e.title}`, `
      <form id="modal-edit-event-form">
        <div class="form-group">
          <label class="form-label">Event Title</label>
          <input type="text" id="m-evt-title" class="form-input" value="${e.title}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select id="m-evt-cat" class="form-input">
            <option value="Exam" ${e.category === 'Exam' ? 'selected':''}>Examination</option>
            <option value="Holiday" ${e.category === 'Holiday' ? 'selected':''}>Holiday</option>
            <option value="Event" ${e.category === 'Event' ? 'selected':''}>School Event</option>
            <option value="Meeting" ${e.category === 'Meeting' ? 'selected':''}>Parent Meeting</option>
          </select>
        </div>
        <div class="portal-grid portal-grid-2">
          <div class="form-group">
            <label class="form-label">Start Date</label>
            <input type="date" id="m-evt-start" class="form-input" value="${e.startDate}" required>
          </div>
          <div class="form-group">
            <label class="form-label">End Date</label>
            <input type="date" id="m-evt-end" class="form-input" value="${e.endDate}" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="m-evt-desc" class="form-input" rows="2" required>${e.description}</textarea>
        </div>
        <button type="submit" class="btn-portal">Save Modifications</button>
      </form>
    `);
    
    document.getElementById('modal-edit-event-form').onsubmit = (ev) => {
      ev.preventDefault();
      const title = document.getElementById('m-evt-title').value.trim();
      const category = document.getElementById('m-evt-cat').value;
      const startDate = document.getElementById('m-evt-start').value;
      const endDate = document.getElementById('m-evt-end').value;
      const description = document.getElementById('m-evt-desc').value.trim();
      
      const updated = window.skhs_db.update('calendar_events', 'eventId', id, {
        title, category, startDate, endDate, description
      });
      
      if (updated) {
        window.skhs_db.logActivity('event_update', 'settings', 'info', currentUser.userId, id, `Modified calendar event details for: ${title}`);
        closeModal();
        renderCalendar();
        showAlert("Calendar event updated.");
      }
    };
  }

  if (btnCalAddEvent) {
    btnCalAddEvent.onclick = () => {
      openModal('Create New Event', `
        <form id="modal-event-form">
          <div class="form-group">
            <label class="form-label">Event Title</label>
            <input type="text" id="m-evt-title" class="form-input" placeholder="e.g. Science Exhibition" required>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <select id="m-evt-cat" class="form-input">
              <option value="Event">School Event</option>
              <option value="Exam">Examination</option>
              <option value="Holiday">Holiday</option>
              <option value="Meeting">Parent Meeting</option>
            </select>
          </div>
          <div class="portal-grid portal-grid-2">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" id="m-evt-start" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">End Date</label>
              <input type="date" id="m-evt-end" class="form-input" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description Details</label>
            <textarea id="m-evt-desc" class="form-input" rows="2" placeholder="Brief event details..." required></textarea>
          </div>
          <button type="submit" class="btn-portal">Schedule Event</button>
        </form>
      `);
      
      document.getElementById('modal-event-form').onsubmit = (e) => {
        e.preventDefault();
        const title = document.getElementById('m-evt-title').value.trim();
        const category = document.getElementById('m-evt-cat').value;
        const startDate = document.getElementById('m-evt-start').value;
        const endDate = document.getElementById('m-evt-end').value;
        const description = document.getElementById('m-evt-desc').value.trim();
        
        const req = window.skhs_db.insert('calendar_events', {
          eventId: "EVT-" + Math.floor(1000 + Math.random()*9000),
          title, category, startDate, endDate, description
        });
        
        if (req) {
          window.skhs_db.logActivity('event_create', 'settings', 'info', currentUser.userId, req.eventId, `Created calendar event: ${title}`);
          closeModal();
          renderCalendar();
          showAlert("Calendar event scheduled successfully!");
        }
      };
    };
  }

  // ============================================================
  //  21. DATABASE BACKUP & RESTORE MODULE
  // ============================================================
  const btnDbExport = document.getElementById('btn-db-export');
  const dbRestoreFile = document.getElementById('db-restore-file-input');
  const btnDbImport = document.getElementById('btn-db-import');
  const btnDbResetDemo = document.getElementById('btn-db-reset-demo');
  const dbStatSize = document.getElementById('db-stat-size');

  function initBackupRestoreModule() {
    calculateDbSize();
    initSeederControls();
  }

  function initSeederControls() {
    const btnSeedRun = document.getElementById('btn-seed-run');
    const btnSeedReseed = document.getElementById('btn-seed-reseed');
    const btnSeedDelete = document.getElementById('btn-seed-delete');
    const btnSeedExportSql = document.getElementById('btn-seed-export-sql');
    const btnSeedDownloadCsv = document.getElementById('btn-seed-download-csv');

    const progressFill = document.getElementById('seeder-progress-bar');
    const statusModule = document.getElementById('seeder-status-module');
    const statusPercent = document.getElementById('seeder-status-percent');
    const statCompleted = document.getElementById('seeder-stat-completed');
    const statFailed = document.getElementById('seeder-stat-failed');
    const statElapsed = document.getElementById('seeder-stat-elapsed');
    const statEta = document.getElementById('seeder-stat-eta');

    const updateUI = (state) => {
      if (progressFill) progressFill.style.width = state.progress + "%";
      if (statusModule) statusModule.textContent = state.currentModule;
      if (statusPercent) statusPercent.textContent = state.progress + "%";
      if (statCompleted) statCompleted.textContent = state.completed;
      if (statFailed) statFailed.textContent = state.failed;
      if (statElapsed) statElapsed.textContent = state.elapsed + "s";
      if (statEta) statEta.textContent = state.eta + "s";

      if (state.progress === 100) {
        if (btnSeedDownloadCsv) btnSeedDownloadCsv.disabled = false;
      }
    };

    if (btnSeedRun) {
      btnSeedRun.onclick = async () => {
        if (confirm("Proceed to seed the complete production-grade school database?")) {
          updateUI({ progress: 0, currentModule: "Starting...", completed: 0, failed: 0, elapsed: 0, eta: 0 });
          const res = await window.seedProductionDatabase(updateUI);
          if (res.success) {
            showAlert("Database successfully seeded!");
            calculateDbSize();
          } else {
            showAlert("Seeding failed: " + res.error, "error");
          }
        }
      };
    }

    if (btnSeedReseed) {
      btnSeedReseed.onclick = async () => {
        if (confirm("This will clear all current records and re-seed the entire database. Proceed?")) {
          updateUI({ progress: 0, currentModule: "Starting...", completed: 0, failed: 0, elapsed: 0, eta: 0 });
          const res = await window.seedProductionDatabase(updateUI);
          if (res.success) {
            showAlert("Database successfully re-seeded!");
            calculateDbSize();
          } else {
            showAlert("Re-seeding failed: " + res.error, "error");
          }
        }
      };
    }

    if (btnSeedDelete) {
      btnSeedDelete.onclick = async () => {
        if (confirm("Are you sure you want to delete all demo data? This will clear all collections.")) {
          if (window.isSupabaseActive()) {
            const supabase = window.getSupabaseClient();
            const collections = ['study_materials', 'audit_logs', 'notifications', 'leave_requests', 'calendar_events', 'promotions', 'fees', 'marks', 'homework', 'exams', 'attendance', 'students', 'subjects', 'parents', 'classes', 'teachers', 'academic_years'];
            for (const col of collections) {
              await supabase.from(col).delete().neq('material_id', 'placeholder').is('material_id', null);
              await supabase.from(col).delete().neq('log_id', 'placeholder').is('log_id', null);
              await supabase.from(col).delete().neq('notification_id', 'placeholder').is('notification_id', null);
              await supabase.from(col).delete().neq('leave_id', 'placeholder').is('leave_id', null);
              await supabase.from(col).delete().neq('event_id', 'placeholder').is('event_id', null);
              await supabase.from(col).delete().neq('promo_id', 'placeholder').is('promo_id', null);
              await supabase.from(col).delete().neq('fee_id', 'placeholder').is('fee_id', null);
              await supabase.from(col).delete().neq('mark_id', 'placeholder').is('mark_id', null);
              await supabase.from(col).delete().neq('homework_id', 'placeholder').is('homework_id', null);
              await supabase.from(col).delete().neq('exam_id', 'placeholder').is('exam_id', null);
              await supabase.from(col).delete().neq('attendance_id', 'placeholder').is('attendance_id', null);
              await supabase.from(col).delete().neq('student_id', 'placeholder').is('student_id', null);
              await supabase.from(col).delete().neq('subject_id', 'placeholder').is('subject_id', null);
              await supabase.from(col).delete().neq('parent_id', 'placeholder').is('parent_id', null);
              await supabase.from(col).delete().neq('class_id', 'placeholder').is('class_id', null);
              await supabase.from(col).delete().neq('teacher_id', 'placeholder').is('teacher_id', null);
              await supabase.from(col).delete().neq('ay_id', 'placeholder').is('ay_id', null);
            }
          } else {
            const collections = ['users', 'audit_logs', 'notifications', 'messages', 'students', 'teachers', 'parents', 'classes', 'subjects', 'attendance', 'exams', 'marks', 'homework', 'fees', 'settings', 'academic_years', 'promotions', 'leave_requests', 'calendar_events', 'study_materials'];
            collections.forEach(col => localStorage.setItem("skhs_db_" + col, JSON.stringify([])));
          }
          showAlert("All demo data deleted.");
          calculateDbSize();
          updateUI({ progress: 0, currentModule: "Deleted All Data", completed: 0, failed: 0, elapsed: 0, eta: 0 });
        }
      };
    }

    if (btnSeedExportSql) {
      btnSeedExportSql.onclick = () => {
        window.exportSQLAuthMigration();
      };
    }

    if (btnSeedDownloadCsv) {
      btnSeedDownloadCsv.onclick = () => {
        window.downloadDemoCredentialsCSV();
      };
    }
  }

  function calculateDbSize() {
    if (!dbStatSize) return;
    let totalChars = 0;
    const collections = ['users', 'audit_logs', 'notifications', 'messages', 'students', 'teachers', 'parents', 'classes', 'subjects', 'attendance', 'exams', 'marks', 'homework', 'fees', 'settings', 'academic_years', 'promotions', 'leave_requests', 'calendar_events'];
    
    collections.forEach(col => {
      const key = "skhs_db_" + col;
      const data = localStorage.getItem(key);
      if (data) totalChars += data.length;
    });
    
    const sizeKb = (totalChars * 2 / 1024).toFixed(2);
    dbStatSize.textContent = `${sizeKb} KB`;
  }

  if (btnDbExport) {
    btnDbExport.onclick = () => {
      const databaseDump = {};
      const collections = ['users', 'audit_logs', 'notifications', 'messages', 'students', 'teachers', 'parents', 'classes', 'subjects', 'attendance', 'exams', 'marks', 'homework', 'fees', 'settings', 'academic_years', 'promotions', 'leave_requests', 'calendar_events'];
      
      collections.forEach(col => {
        databaseDump[col] = window.skhs_db.getCollection(col);
      });
      
      const jsonString = JSON.stringify(databaseDump, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `srikatiya_erp_backup_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      window.skhs_db.logActivity('db_backup_export', 'settings', 'info', currentUser.userId, null, `Performed database backup export to JSON file.`);
      showAlert("Database backup successfully compiled and downloaded!");
      calculateDbSize();
    };
  }

  if (dbRestoreFile) {
    dbRestoreFile.onchange = (e) => {
      const file = e.target.files[0];
      const label = document.getElementById('db-restore-file-label');
      if (file) {
        label.textContent = `Selected: ${file.name}`;
        btnDbImport.disabled = false;
      } else {
        label.textContent = "Choose Backup JSON File";
        btnDbImport.disabled = true;
      }
    };
  }

  if (btnDbImport) {
    btnDbImport.onclick = () => {
      const file = dbRestoreFile.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          const importedData = JSON.parse(evt.target.result);
          const requiredCollections = ['users', 'students', 'teachers', 'parents', 'classes'];
          
          const hasVitalTables = requiredCollections.every(col => Array.isArray(importedData[col]));
          if (!hasVitalTables) {
            showAlert("Invalid database backup file. Crucial collections are missing.", "error");
            return;
          }
          
          if (confirm("Restore Database? This will overwrite ALL current local data with the imported backup file details, and reload the platform.")) {
            Object.keys(importedData).forEach(col => {
              window.skhs_db.saveCollection(col, importedData[col]);
            });
            window.skhs_db.logActivity('db_backup_restore', 'settings', 'warning', currentUser.userId, null, `Database session restored from JSON backup file.`);
            showAlert("Database successfully restored! Re-loading portal...", "success");
            
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        } catch (err) {
          showAlert("Corrupt or invalid backup JSON payload.", "error");
        }
      };
      reader.readAsText(file);
    };
  }

  if (btnDbResetDemo) {
    btnDbResetDemo.onclick = () => {
      if (confirm("WARNING: You are about to wipe out all custom school profiles, registrations, grade registers, and configurations. System will restore defaults. Proceed?")) {
        localStorage.removeItem("skhs_db_version");
        showAlert("Clearing tables and initializing fresh seeds. Re-loading...", "info");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    };
  }

  // ============================================================
  //  22. ID CARD GENERATOR MODULE
  // ============================================================
  const idCardRole = document.getElementById('id-card-role');
  const idCardSelect = document.getElementById('id-card-member-select');
  const idCardLabel = document.getElementById('id-card-member-select-label');
  const idCardForm = document.getElementById('id-card-config-form');
  const idPreview = document.getElementById('id-card-render-preview');
  const btnIdPrint = document.getElementById('btn-id-print');
  const btnIdPdf = document.getElementById('btn-id-pdf');

  function initIdGeneratorModule() {
    if (idCardRole) {
      idCardRole.onchange = populateIdCardMembers;
      populateIdCardMembers();
    }
  }

  function populateIdCardMembers() {
    if (!idCardSelect) return;
    idCardSelect.innerHTML = '';
    const role = idCardRole.value;
    
    if (role === 'student') {
      idCardLabel.textContent = "Choose Student";
      const list = window.skhs_db.getCollection('students');
      list.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.studentId;
        opt.textContent = `${s.fullName} (${s.studentId})`;
        idCardSelect.appendChild(opt);
      });
    } else {
      idCardLabel.textContent = "Choose Teacher / Faculty";
      const list = window.skhs_db.getCollection('teachers');
      list.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.teacherId;
        opt.textContent = `${t.fullName} (${t.teacherId})`;
        idCardSelect.appendChild(opt);
      });
    }
  }

  function getSimulatedQRCodeSVG(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = data.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    let path = '';
    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; c++) {
        const isFinderPattern = (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);
        const drawFinderPoint = isFinderPattern && (
          (r === 0 || r === 6 || c === 0 || c === 6) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
          (r === 0 || r === 6 || c === 14 || c === 20) ||
          (r >= 2 && r <= 4 && c >= 16 && c <= 18) ||
          (r === 14 || r === 20 || c === 0 || c === 6) ||
          (r >= 16 && r <= 18 && c >= 2 && c <= 4)
        );
        
        const pseudoRandomFill = ((hash >> (r + c)) & 1) === 1;
        if (drawFinderPoint || (!isFinderPattern && pseudoRandomFill)) {
          path += `M${c},${r} h1 v1 h-1 z `;
        }
      }
    }
    
    return `<svg viewBox="0 0 21 21" shape-rendering="crispEdges" style="fill:#000; width:100%; height:100%;"><path d="${path}"/></svg>`;
  }

  if (idCardForm) {
    idCardForm.onsubmit = (e) => {
      e.preventDefault();
      const role = idCardRole.value;
      const id = idCardSelect.value;
      if (!id) return;
      
      let html = '';
      const qrCodeSVG = getSimulatedQRCodeSVG(id);
      
      if (role === 'student') {
        const s = window.skhs_db.findOne('students', 'studentId', id);
        if (!s) return;
        const cls = window.skhs_db.findOne('classes', 'classId', s.classId);
        
        html = `
          <div class="id-card-container">
            <div class="id-card-header">
              <div class="id-card-school-name">SRI KAKATIYA HIGH SCHOOL</div>
              <div class="id-card-tagline">Academic Excellence Portal</div>
            </div>
            <div class="id-card-photo-wrap">
              <span class="id-card-no-photo">🎓</span>
            </div>
            <div class="id-card-name">${s.fullName}</div>
            <div class="id-card-role-badge">Student</div>
            <div class="id-card-details">
              <div class="id-card-row"><span class="id-card-label">Student ID</span><span class="id-card-val">${s.studentId}</span></div>
              <div class="id-card-row"><span class="id-card-label">Class</span><span class="id-card-val">${cls ? cls.name : s.classId} (${s.section})</span></div>
              <div class="id-card-row"><span class="id-card-label">Roll Number</span><span class="id-card-val">${s.rollNumber}</span></div>
              <div class="id-card-row"><span class="id-card-label">Contact</span><span class="id-card-val">${s.phone}</span></div>
            </div>
            <div class="id-card-footer">
              <div class="id-card-qr-container">${qrCodeSVG}</div>
              <div class="id-card-sig-wrap">
                <div class="id-card-sig-line"></div>
                Principal Signature
              </div>
            </div>
          </div>
        `;
      } else {
        const t = window.skhs_db.findOne('teachers', 'teacherId', id);
        if (!t) return;
        
        html = `
          <div class="id-card-container" style="background:linear-gradient(135deg, #1e293b 0%, #475569 100%); border-color:rgba(255,255,255,0.15)">
            <div class="id-card-header">
              <div class="id-card-school-name">SRI KAKATIYA HIGH SCHOOL</div>
              <div class="id-card-tagline">Staff & Faculty Portal</div>
            </div>
            <div class="id-card-photo-wrap" style="border-color:var(--portal-accent);">
              <span class="id-card-no-photo">💼</span>
            </div>
            <div class="id-card-name">${t.fullName}</div>
            <div class="id-card-role-badge" style="background:var(--portal-accent-light); color:var(--portal-primary-dark)">Teacher</div>
            <div class="id-card-details">
              <div class="id-card-row"><span class="id-card-label">Teacher ID</span><span class="id-card-val">${t.teacherId}</span></div>
              <div class="id-card-row"><span class="id-card-label">Specialization</span><span class="id-card-val">${t.subject}</span></div>
              <div class="id-card-row"><span class="id-card-label">Qualification</span><span class="id-card-val">${t.qualification}</span></div>
              <div class="id-card-row"><span class="id-card-label">Contact</span><span class="id-card-val">${t.phone}</span></div>
            </div>
            <div class="id-card-footer">
              <div class="id-card-qr-container">${qrCodeSVG}</div>
              <div class="id-card-sig-wrap">
                <div class="id-card-sig-line"></div>
                Principal Signature
              </div>
            </div>
          </div>
        `;
      }
      
      idPreview.innerHTML = html;
      btnIdPrint.disabled = false;
      btnIdPdf.disabled = false;
      
      btnIdPrint.setAttribute('data-print-html', html);
      btnIdPdf.setAttribute('data-print-html', html);
    };
  }

  const triggerIdPrint = (btn) => {
    const html = btn.getAttribute('data-print-html');
    if (html) printHTMLReport(html);
  };

  if (btnIdPrint) btnIdPrint.onclick = () => triggerIdPrint(btnIdPrint);
  if (btnIdPdf) btnIdPdf.onclick = () => triggerIdPrint(btnIdPdf);

  // ============================================================
  //  23. CERTIFICATE GENERATOR MODULE
  // ============================================================
  const certType = document.getElementById('cert-type');
  const certStudent = document.getElementById('cert-student-select');
  const certAy = document.getElementById('cert-ay-select');
  const certDate = document.getElementById('cert-issue-date');
  const certAchievementTextGroup = document.getElementById('cert-achievement-text-group');
  const certAchievementText = document.getElementById('cert-achievement-text');
  const certForm = document.getElementById('certificate-generator-form');
  const certPreview = document.getElementById('certificate-render-preview');
  const btnCertPrint = document.getElementById('btn-cert-print');
  const btnCertPdf = document.getElementById('btn-cert-pdf');

  function initCertificatesModule() {
    const students = window.skhs_db.getCollection('students');
    const ays = window.skhs_db.getCollection('academic_years');
    
    if (certStudent && certStudent.children.length <= 1) {
      certStudent.innerHTML = '';
      students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.studentId;
        opt.textContent = `${s.fullName} (${s.studentId})`;
        certStudent.appendChild(opt);
      });
      
      certAy.innerHTML = '';
      ays.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y.ayId + '|' + y.name;
        opt.textContent = y.name;
        if (y.status === 'Active') opt.selected = true;
        certAy.appendChild(opt);
      });
      
      certDate.value = new Date().toISOString().split('T')[0];
    }
  }

  if (certType) {
    certType.onchange = () => {
      if (certType.value === 'Achievement Certificate') {
        certAchievementTextGroup.style.display = 'block';
      } else {
        certAchievementTextGroup.style.display = 'none';
      }
    };
  }

  if (certForm) {
    certForm.onsubmit = (e) => {
      e.preventDefault();
      const sId = certStudent.value;
      const [ayId, ayName] = certAy.value.split('|');
      const type = certType.value;
      const dateVal = new Date(certDate.value).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
      
      const s = window.skhs_db.findOne('students', 'studentId', sId);
      if (!s) return;
      
      const cls = window.skhs_db.findOne('classes', 'classId', s.classId);
      const className = cls ? cls.name : s.classId;
      
      let textBody = '';
      if (type === 'Bonafide Certificate') {
        textBody = `This is to officially certify that <strong>${s.fullName}</strong>, Son/Daughter of parent profile records, is a bonafide student of Sri Kakatiya High School, studying in <strong>${className}</strong> during the academic session <strong>${ayName}</strong>. His/Her conduct during this period has been exemplary.`;
      } else if (type === 'Study Certificate') {
        textBody = `This is to certify that <strong>${s.fullName}</strong> has successfully pursued his/her course of study in Sri Kakatiya High School in class <strong>${className}</strong> for the academic year <strong>${ayName}</strong>. He/She has been a diligent student with satisfying records.`;
      } else if (type === 'Participation Certificate') {
        textBody = `This certificate of participation is proudly presented to <strong>${s.fullName}</strong> of class <strong>${className}</strong> for active contribution and involvement in school curricular activities during the academic session <strong>${ayName}</strong>.`;
      } else if (type === 'Achievement Certificate') {
        const achievement = certAchievementText.value.trim() || 'outstanding performance in academic events';
        textBody = `This certificate of merit is awarded to <strong>${s.fullName}</strong> of class <strong>${className}</strong> in recognition of his/her outstanding achievement: <br><strong>"${achievement}"</strong> during the academic session <strong>${ayName}</strong>.`;
      }
      
      const html = `
        <div class="cert-container">
          <div class="cert-header">
            <div class="cert-logo">🦅</div>
            <div class="cert-school-name">SRI KAKATIYA HIGH SCHOOL</div>
            <div class="cert-school-sub">Recognized by the Government of Andhra Pradesh</div>
          </div>
          <div class="cert-title-badge">${type}</div>
          <div class="cert-text-intro">This is to certify that</div>
          <div class="cert-recipient-name">${s.fullName}</div>
          <div class="cert-main-text">${textBody}</div>
          <div class="cert-signatures">
            <div class="cert-sig-box">
              <div class="cert-sig-line"></div>
              Class Teacher
            </div>
            <div class="cert-sig-box">
              <div style="font-family:'Playfair Display', serif; font-size:1.15rem; font-style:italic; color:#0a2d6e; font-weight:700; margin-top:-0.5rem; text-shadow:0 0 1px rgba(0,0,0,0.1)">Swathi Reddy</div>
              <div class="cert-sig-line" style="margin-top:0.6rem;"></div>
              Principal Seal & Sign
            </div>
          </div>
        </div>
      `;
      
      certPreview.innerHTML = html;
      btnCertPrint.disabled = false;
      btnCertPdf.disabled = false;
      
      btnCertPrint.setAttribute('data-print-html', html);
      btnCertPdf.setAttribute('data-print-html', html);
      
      window.skhs_db.logActivity('cert_generate', 'student', 'info', currentUser.userId, sId, `Generated ${type} for student ${s.fullName}`);
    };
  }

  const triggerCertPrint = (btn) => {
    const html = btn.getAttribute('data-print-html');
    if (html) printHTMLReport(html);
  };

  if (btnCertPrint) btnCertPrint.onclick = () => triggerCertPrint(btnCertPrint);
  if (btnCertPdf) btnCertPdf.onclick = () => triggerCertPrint(btnCertPdf);

  // Draw initial page elements
  initHeaderAcademicYear();
  loadModule('overview');
  renderUserData();
});
