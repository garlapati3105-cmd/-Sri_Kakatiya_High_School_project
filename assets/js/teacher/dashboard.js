// ============================================================
//  Sri Kakatiya School Management Platform – teacher/dashboard.js
//  Teacher Dashboard Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') return;

    initDashboard();
    window.addEventListener('skhs_db_synced', initDashboard);
  });

  function initDashboard() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
    if (!teacher) {
      console.warn('[DASHBOARD] Teacher record not found for user:', currentUser.userId || currentUser.id);
      return;
    }

    // User Widget Headers
    const fullnameEl = document.getElementById('header-fullname');
    if (fullnameEl) fullnameEl.textContent = teacher.fullName;

    const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzFlMTUyZSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjZmZkZmJhIi8+PHBhdGggZD0iTTIwIDg1IEMyMCA2NSwgODAgNjUsIDgwIDg1IFoiIGZpbGw9IiM0NTg1ODgiLz48cGF0aCBkPSJNMzUgMzAgQzUwIDE1IDY1IDMwIiBzdHJva2U9IiMyODI4MjgiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";
    const avatarSrc = window.skhs_security.isAllowedImageDataUrl(currentUser.profilePhoto)
      ? currentUser.profilePhoto
      : defaultAvatar;
    
    const headerAvatar = document.getElementById('header-avatar');
    if (headerAvatar) headerAvatar.src = avatarSrc;

    // Greeting Banner
    const greetingEl = document.getElementById('banner-greeting');
    const subtextEl = document.getElementById('banner-subtext');
    if (greetingEl) {
      const hrs = new Date().getHours();
      let greet = 'Good Evening';
      if (hrs < 12) greet = 'Good Morning';
      else if (hrs < 17) greet = 'Good Afternoon';
      greetingEl.textContent = `${greet}, ${teacher.fullName}`;
    }
    if (subtextEl) {
      subtextEl.textContent = `Manage attendance, review assignments, grade examinations, and support student success.`;
    }

    // KPI 1: Assigned Classes
    const assignedClasses = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
    const kpiClasses = document.getElementById('kpi-classes');
    if (kpiClasses) kpiClasses.textContent = assignedClasses.length;

    // KPI 2: Assigned Subjects
    const subjects = window.skhs_db.find('subjects', 'teacherId', teacher.teacherId);
    const kpiSubjects = document.getElementById('kpi-subjects');
    if (kpiSubjects) kpiSubjects.textContent = subjects.length;

    // KPI 3: Today's Classes / Periods
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = days[new Date().getDay()];
    // Timetable is built by finding subjects belonging to the teacher
    const kpiTodayClasses = document.getElementById('kpi-today-classes');
    if (kpiTodayClasses) {
      kpiTodayClasses.textContent = todayDay === 'Sunday' ? 0 : Math.min(6, subjects.length);
    }

    // KPI 4: Pending Attendance for Today
    const dateToday = new Date().toISOString().split('T')[0];
    const attendanceRecords = window.skhs_db.getCollection('attendance');
    let pendingAttCount = 0;
    assignedClasses.forEach(classId => {
      const recorded = attendanceRecords.find(a => a.classId === classId && a.date === dateToday);
      if (!recorded) pendingAttCount++;
    });
    const kpiPendingAtt = document.getElementById('kpi-pending-att');
    if (kpiPendingAtt) kpiPendingAtt.textContent = pendingAttCount;

    // KPI 5: Homework Reviews
    const teacherHomework = window.skhs_db.find('homework', 'subjectId', subjects[0]?.subjectId || '');
    const kpiPendingHw = document.getElementById('kpi-pending-hw');
    if (kpiPendingHw) {
      kpiPendingHw.textContent = teacherHomework.filter(hw => {
        const comp = Array.isArray(hw.completedStudents) ? hw.completedStudents : [];
        return comp.length === 0;
      }).length;
    }

    // KPI 6: Leave Status
    const teacherLeaves = window.skhs_db.find('leave_requests', 'applicantId', teacher.teacherId);
    const kpiLeaveStatus = document.getElementById('kpi-leave-status');
    if (kpiLeaveStatus) {
      if (teacherLeaves.length > 0) {
        teacherLeaves.sort((a, b) => new Date(b.startDate || b.start_date) - new Date(a.startDate || a.start_date));
        kpiLeaveStatus.textContent = teacherLeaves[0].status;
      } else {
        kpiLeaveStatus.textContent = 'None';
      }
    }

    // Today's Timetable Render
    loadDashboardTimetable(subjects, todayDay);

    // Upcoming Exams Render
    loadDashboardExams(assignedClasses);

    // Recent Notifications Render
    loadDashboardNotifications(currentUser.userId);

    // Completion Rates
    loadDashboardStatistics(assignedClasses, subjects);
  }

  function loadDashboardTimetable(subjects, todayDay) {
    const tbody = document.getElementById('dash-timetable-body');
    if (!tbody) return;

    if (todayDay === 'Sunday' || subjects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--portal-text-muted);">No classes scheduled today.</td></tr>`;
      return;
    }

    const mockTimes = [
      '08:30 AM - 09:30 AM',
      '09:30 AM - 10:30 AM',
      '10:45 AM - 11:45 AM',
      '11:45 AM - 12:45 PM',
      '01:30 PM - 02:30 PM',
      '02:30 PM - 03:30 PM'
    ];

    tbody.innerHTML = '';
    mockTimes.forEach((time, index) => {
      const sub = subjects[index % subjects.length];
      const classRecord = window.skhs_db.findOne('classes', 'classId', sub.classId);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>Period ${index + 1}</td>
        <td><strong>${sub.name}</strong></td>
        <td>${classRecord ? classRecord.name : 'Class ' + sub.classId}</td>
        <td>${time}</td>
      `;
      tbody.appendChild(row);
    });
  }

  function loadDashboardExams(assignedClasses) {
    const tbody = document.getElementById('dash-exams-body');
    if (!tbody) return;

    const exams = window.skhs_db.getCollection('exams');
    const teacherExams = exams.filter(e => assignedClasses.includes(e.classId));

    if (teacherExams.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--portal-text-muted);">No upcoming exams scheduled.</td></tr>`;
      return;
    }

    teacherExams.sort((a, b) => new Date(a.date) - new Date(b.date));

    tbody.innerHTML = '';
    teacherExams.slice(0, 3).forEach(ex => {
      const classRecord = window.skhs_db.findOne('classes', 'classId', ex.classId);
      const sub = window.skhs_db.findOne('subjects', 'subjectId', ex.subjectId);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${ex.name}</strong></td>
        <td>${classRecord ? classRecord.name : ex.classId}</td>
        <td>${sub ? sub.name : 'General'}</td>
        <td>${ex.date}</td>
      `;
      tbody.appendChild(row);
    });
  }

  function loadDashboardNotifications(userId) {
    const list = document.getElementById('dash-notifications-list');
    if (!list) return;

    const notices = window.skhs_db.find('notifications', 'userId', userId);
    if (notices.length === 0) {
      list.innerHTML = `<p style="text-align: center; color: var(--portal-text-muted);">No circulars found.</p>`;
      return;
    }

    notices.sort((a, b) => b.createdAt - a.createdAt);

    list.innerHTML = '';
    notices.slice(0, 3).forEach(n => {
      const item = document.createElement('div');
      item.style.padding = '0.5rem 0';
      item.style.borderBottom = '1px solid var(--portal-border)';
      item.innerHTML = `
        <div style="font-weight: 600; font-size: 0.85rem;">${n.title}</div>
        <div style="font-size: 0.75rem; color: var(--portal-text-muted); margin-top: 0.15rem;">${n.message}</div>
      `;
      list.appendChild(item);
    });
  }

  function loadDashboardStatistics(assignedClasses, subjects) {
    // 1. Attendance rate (simulated completion rate for the month)
    const attRecords = window.skhs_db.getCollection('attendance');
    const totalPossible = assignedClasses.length * 30; // last 30 days
    const recordedCount = attRecords.filter(a => assignedClasses.includes(a.classId)).length;
    const attPct = totalPossible > 0 ? Math.min(100, Math.round((recordedCount / totalPossible) * 100)) : 85;

    const attPctEl = document.getElementById('dash-att-stat-pct');
    const attBarEl = document.getElementById('dash-att-stat-bar');
    if (attPctEl) attPctEl.textContent = `${attPct}%`;
    if (attBarEl) attBarEl.style.width = `${attPct}%`;

    // 2. Homework Review rate
    const teacherHomework = window.skhs_db.getCollection('homework').filter(h => assignedClasses.includes(h.classId));
    let reviewPct = 100;
    if (teacherHomework.length > 0) {
      const reviewed = teacherHomework.filter(hw => {
        const comp = Array.isArray(hw.completedStudents) ? hw.completedStudents : [];
        return comp.length > 0;
      }).length;
      reviewPct = Math.round((reviewed / teacherHomework.length) * 100);
    }
    const hwPctEl = document.getElementById('dash-hw-stat-pct');
    const hwBarEl = document.getElementById('dash-hw-stat-bar');
    if (hwPctEl) hwPctEl.textContent = `${reviewPct}%`;
    if (hwBarEl) hwBarEl.style.width = `${reviewPct}%`;
  }
})();
