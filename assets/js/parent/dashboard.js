// ============================================================
//  Sri Kakatiya School Management Platform – parent/dashboard.js
//  Parent Dashboard Controller (Refined)
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    initDashboard();
    window.addEventListener('skhs_db_synced', initDashboard);
    window.addEventListener('skhs_parent_child_changed', initDashboard);
  });

  function getActiveChildId() {
    const selector = document.getElementById('parent-child-selector');
    if (selector && selector.value) return selector.value;
    const saved = localStorage.getItem('skhs_parent_active_child');
    if (saved) return saved;
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return null;
    const parent = window.skhs_db.findOne('parents', 'userId', currentUser.userId || currentUser.id);
    if (!parent) return null;
    const linked = Array.isArray(parent.linkedStudents) ? parent.linkedStudents : [];
    return linked[0] || null;
  }

  function initDashboard() {
    const currentUser = window.skhs_auth.getCurrentUser();
    const studentId = getActiveChildId();
    if (!currentUser || !studentId) return;

    const student = window.skhs_db.findOne('students', 'studentId', studentId);
    if (!student) return;

    const parent = window.skhs_db.findOne('parents', 'userId', currentUser.userId || currentUser.id);
    if (!parent) return;

    // 1. Child Overview Card
    const classRecord = window.skhs_db.findOne('classes', 'classId', student.classId);
    const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzFlMTUyZSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjZmZkZmJhIi8+PHBhdGggZD0iTTIwIDg1IEMyMCA2NSwgODAgNjUsIDgwIDg1IFoiIGZpbGw9IiM0NTg1ODgiLz48cGF0aCBkPSJNMzUgMzAgUTUwIDE1IDY1IDMwIiBzdHJva2U9IiMyODI4MjgiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";
    
    document.getElementById('dash-overview-avatar').src = student.profilePhoto || defaultAvatar;
    document.getElementById('dash-overview-name').textContent = student.fullName;
    document.getElementById('dash-overview-class').textContent = classRecord ? `${classRecord.name} - ${student.section || 'A'}` : student.classId;

    // Attendance calculation
    const attRecords = window.skhs_db.find('attendance', 'studentId', studentId);
    let attPct = 100;
    if (attRecords.length > 0) {
      const presents = attRecords.filter(r => r.status === 'Present').length;
      attPct = Math.round((presents / attRecords.length) * 100);
    }
    document.getElementById('dash-overview-att').textContent = `${attPct}%`;
    document.getElementById('health-attendance').textContent = `${attPct}%`;

    // Attendance warning banner
    const riskBanner = document.getElementById('attendance-risk-banner');
    if (riskBanner) {
      if (attPct < 75) {
        riskBanner.className = 'portal-alert portal-alert-error';
        riskBanner.style.display = 'block';
        riskBanner.style.padding = '1rem';
        riskBanner.style.borderRadius = '8px';
        riskBanner.style.fontSize = '0.9rem';
        riskBanner.innerHTML = `⚠️ <strong>Attendance Warning:</strong> Your child's attendance (${attPct}%) is currently below the mandatory 75% requirement.`;
      } else {
        riskBanner.style.display = 'none';
      }
    }

    // Homework Rate
    const hws = window.skhs_db.find('homework', 'classId', student.classId);
    let hwPct = 100;
    if (hws.length > 0) {
      const completed = hws.filter(h => {
        const list = Array.isArray(h.completedStudents) ? h.completedStudents : [];
        return list.includes(studentId);
      }).length;
      hwPct = Math.round((completed / hws.length) * 100);
    }
    document.getElementById('health-homework').textContent = `${hwPct}%`;

    // Average Marks & Overall Grade
    const marks = window.skhs_db.find('marks', 'studentId', studentId);
    let scoreAvg = 0;
    let remarks = "Satisfactory progress throughout the semester.";
    if (marks.length > 0) {
      let obtainedSum = 0;
      let maxSum = 0;
      marks.forEach(m => {
        obtainedSum += m.marksObtained || m.marks_obtained || 0;
        maxSum += m.maxMarks || m.max_marks || 100;
        if (m.remarks) remarks = m.remarks;
      });
      scoreAvg = maxSum > 0 ? Math.round((obtainedSum / maxSum) * 100) : 0;
    } else {
      scoreAvg = 85;
    }
    document.getElementById('health-marks').textContent = `${scoreAvg}%`;
    document.getElementById('health-remark-text').innerHTML = `"${remarks}"`;

    let grade = 'B';
    if (scoreAvg >= 90) grade = 'A+';
    else if (scoreAvg >= 80) grade = 'A';
    else if (scoreAvg >= 70) grade = 'B';
    else if (scoreAvg >= 60) grade = 'C';
    document.getElementById('dash-overview-grade').textContent = grade;

    // Fees Status
    const fees = window.skhs_db.find('fees', 'studentId', studentId);
    let pendingFee = 0;
    fees.forEach(f => {
      if (f.status === 'Pending') pendingFee += f.amount || 0;
    });
    document.getElementById('dash-overview-fees').textContent = pendingFee > 0 ? `₹${pendingFee} Due` : 'Paid';
    document.getElementById('dash-overview-fees').style.color = pendingFee > 0 ? 'var(--portal-error)' : 'var(--portal-success)';

    // Timetable load
    loadDashboardTimetable(student);

    // Notifications load
    loadDashboardNotifications(currentUser.userId);

    // Upcoming Actions Checklist
    loadUpcomingActions(student, hws, fees);
  }

  function loadDashboardTimetable(student) {
    const tbody = document.getElementById('dash-timetable-body');
    if (!tbody) return;

    const subjects = window.skhs_db.find('subjects', 'classId', student.classId);
    if (subjects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--portal-text-muted);">No timetable scheduled.</td></tr>`;
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
      const teacher = window.skhs_db.findOne('teachers', 'teacherId', sub.teacherId);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>Period ${index + 1}</td>
        <td><strong>${sub.name}</strong></td>
        <td>${time}</td>
        <td>${teacher ? teacher.fullName : 'Class Teacher'}</td>
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

  function loadUpcomingActions(student, hws, fees) {
    const list = document.getElementById('dash-upcoming-actions');
    if (!list) return;

    list.innerHTML = '';
    let actionsCount = 0;

    // 1. Homework due soon
    const pendingHw = hws.filter(h => {
      const comp = Array.isArray(h.completedStudents) ? h.completedStudents : [];
      return !comp.includes(student.studentId);
    });
    if (pendingHw.length > 0) {
      pendingHw.slice(0, 2).forEach(h => {
        addChecklistItem(list, `✍️ Homework due: ${h.title} (Due: ${h.dueDate})`, 'critical');
        actionsCount++;
      });
    }

    // 2. Fees due soon
    const pendingFees = fees.filter(f => f.status === 'Pending');
    if (pendingFees.length > 0) {
      pendingFees.forEach(f => {
        addChecklistItem(list, `💰 Fee Reminder: ${f.feeType} (₹${f.amount}) due ${f.dueDate}`, 'warning');
        actionsCount++;
      });
    }

    // 3. PTM scheduled
    const ptmRequests = window.skhs_db.getCollection('leave_requests'); // Simulated meeting request check or general event
    const upcomingMeetings = window.skhs_db.getCollection('calendar_events').filter(e => e.category === 'Meeting');
    upcomingMeetings.forEach(m => {
      addChecklistItem(list, `🤝 PTM Scheduled: ${m.title} on ${m.startDate}`, 'info');
      actionsCount++;
    });

    if (actionsCount === 0) {
      list.innerHTML = `<p style="color: var(--portal-text-muted);">🎉 All caught up! No pending actions due.</p>`;
    }
  }

  function addChecklistItem(parent, text, severity) {
    const item = document.createElement('div');
    item.style = `
      padding: 0.5rem;
      border-left: 4px solid var(--portal-${severity === 'critical' ? 'error' : severity === 'warning' ? 'warning' : 'info'});
      background: var(--portal-bg);
      border-radius: 4px;
      margin-bottom: 0.35rem;
      font-weight: 500;
    `;
    item.textContent = text;
    parent.appendChild(item);
  }
})();
