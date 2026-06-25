// ============================================================
//  Sri Kakatiya School Management Platform – student/dashboard.js
//  Personalized academic command center controller
// ============================================================

(function () {
  // Global switchTab helper for Quick Actions and redirects
  window.switchTab = function (tabId) {
    const sidebarLink = document.querySelector(`.sidebar-link[data-tab="${tabId}"]`);
    if (sidebarLink) {
      sidebarLink.click();
    } else {
      // Fallback
      document.querySelectorAll('.tab-view').forEach(v => v.style.display = 'none');
      const target = document.getElementById('tab-' + tabId);
      if (target) target.style.display = 'block';
      const label = document.getElementById('page-title-label');
      if (label) {
        const titleMap = {
          'dashboard': 'Dashboard Home',
          'profile': 'Student Profile',
          'attendance': 'Attendance',
          'academics': 'Academics & Subjects',
          'exams': 'Exams & Results',
          'homework': 'Homework & Tasks',
          'study-materials': 'Study Materials',
          'timetable': 'Timetable',
          'notifications': 'Circulars & Alerts',
          'calendar': 'School Calendar',
          'leaves': 'Leave Requests',
          'fees': 'Fee Information',
          'settings': 'Settings'
        };
        label.textContent = titleMap[tabId] || 'Dashboard';
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    // Only run if user is student
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    initDashboard();

    // Listen to data syncs to update dashboard
    window.addEventListener('skhs_db_synced', initDashboard);
  });

  function initDashboard() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    // Fetch corresponding student record — local DB uses camelCase keys
    const student = window.skhs_db.findOne('students', 'userId', currentUser.userId || currentUser.id);
    if (!student) {
      console.warn('[DASHBOARD] Student record not found for user:', currentUser.userId || currentUser.id);
      // Show "no data" state but don't crash
      renderWelcomeBannerGuest(currentUser);
      return;
    }

    // 1. Welcome Banner & Greeting
    renderWelcomeBanner(currentUser, student);

    // 2. Load KPIs
    loadKPIs(student);

    // 3. Timetable for Today
    loadTodayTimetable(student);

    // 4. Recent Homework
    loadRecentHomework(student);

    // 5. Academic Performance & Summaries
    loadAcademicSummary(student);

    // 6. Exam Countdown
    loadExamCountdown(student);

    // 7. Academic Badges
    loadBadges(student);

    // 8. Recent Activity Feed
    loadActivityFeed(student);
  }

  function renderWelcomeBannerGuest(user) {
    const greetingEl = document.getElementById('banner-greeting');
    const subtextEl = document.getElementById('banner-subtext');
    if (!greetingEl) return;
    const hrs = new Date().getHours();
    let greet = 'Good Evening';
    if (hrs < 12) greet = 'Good Morning';
    else if (hrs < 17) greet = 'Good Afternoon';
    greetingEl.textContent = `${greet}, ${user.fullName || 'Student'}`;
    if (subtextEl) subtextEl.textContent = 'Welcome to your student portal.';
  }

  function renderWelcomeBanner(user, student) {
    const greetingEl = document.getElementById('banner-greeting');
    const subtextEl = document.getElementById('banner-subtext');
    const classEl = document.getElementById('banner-class');
    const ayEl = document.getElementById('banner-ay');
    const attEl = document.getElementById('banner-att');

    if (!greetingEl) return;

    const hrs = new Date().getHours();
    let greet = 'Good Evening';
    if (hrs < 12) greet = 'Good Morning';
    else if (hrs < 17) greet = 'Good Afternoon';

    greetingEl.textContent = `${greet}, ${student.fullName || user.fullName}`;
    if (subtextEl) subtextEl.textContent = `Welcome back to your academic command center. Below is your current status update.`;

    // Fetch Class Name — local DB uses camelCase 'classId'
    if (classEl) {
      const classRecord = window.skhs_db.findOne('classes', 'classId', student.classId);
      classEl.textContent = classRecord
        ? `${classRecord.name} - ${student.section || 'A'}`
        : `Class ${student.classId || 'N/A'}`;
    }

    // Get Active Academic Year
    if (ayEl) {
      const allYears = window.skhs_db.getCollection('academic_years');
      const ay = allYears.find(y => y.status === 'Active');
      ayEl.textContent = ay ? ay.name : '2026-27';
    }

    // Attendance calculation — local DB 'studentId' (camelCase)
    if (attEl) {
      const attRecords = window.skhs_db.find('attendance', 'studentId', student.studentId);
      if (attRecords.length > 0) {
        const presents = attRecords.filter(r => r.status === 'Present').length;
        const pct = Math.round((presents / attRecords.length) * 100);
        attEl.textContent = `${pct}%`;

        // Attendance risk warning
        const riskBanner = document.getElementById('attendance-risk-banner');
        if (riskBanner) {
          if (pct < 75) {
            riskBanner.className = 'portal-alert portal-alert-error';
            riskBanner.style.display = 'block';
            riskBanner.style.padding = '1rem';
            riskBanner.style.borderRadius = '8px';
            riskBanner.style.fontSize = '0.9rem';
            riskBanner.style.marginBottom = '1.5rem';
            riskBanner.innerHTML = `⚠️ <strong>Attendance Alert:</strong> Your attendance (${pct}%) is currently below the mandatory 75% requirement. Please consult your class teacher.`;
          } else {
            riskBanner.style.display = 'none';
          }
        }
      } else {
        attEl.textContent = '100%';
      }
    }
  }

  function loadKPIs(student) {
    // 1. Attendance — key: studentId
    const attRecords = window.skhs_db.find('attendance', 'studentId', student.studentId);
    let attPct = 100;
    if (attRecords.length > 0) {
      const presents = attRecords.filter(r => r.status === 'Present').length;
      attPct = Math.round((presents / attRecords.length) * 100);
    }
    const kpiAtt = document.getElementById('kpi-attendance');
    if (kpiAtt) kpiAtt.textContent = `${attPct}%`;

    // 2. Subjects — key: classId
    const subjects = window.skhs_db.find('subjects', 'classId', student.classId);
    const kpiSub = document.getElementById('kpi-subjects');
    if (kpiSub) kpiSub.textContent = subjects.length;

    // 3. Pending Homework — key: classId; completedStudents is array (postprocessed)
    const homework = window.skhs_db.find('homework', 'classId', student.classId);
    const pendingHw = homework.filter(h => {
      const compList = Array.isArray(h.completedStudents)
        ? h.completedStudents
        : String(h.completedStudents || '').split(',').map(s => s.trim()).filter(Boolean);
      return !compList.includes(student.studentId);
    });
    const kpiHw = document.getElementById('kpi-homework');
    if (kpiHw) kpiHw.textContent = pendingHw.length;

    // 4. Upcoming Exams — key: classId
    const exams = window.skhs_db.find('exams', 'classId', student.classId);
    const today = new Date().setHours(0, 0, 0, 0);
    const upcomingExams = exams.filter(ex => new Date(ex.date) >= today);
    const kpiEx = document.getElementById('kpi-exams');
    if (kpiEx) kpiEx.textContent = upcomingExams.length;

    // 5. Unread Notices — key: userId
    const notices = window.skhs_db.find('notifications', 'userId', student.userId || student.user_id || '');
    const unread = notices.filter(n => !n.isRead);
    const kpiNt = document.getElementById('kpi-notices');
    if (kpiNt) kpiNt.textContent = unread.length;
  }

  function loadTodayTimetable(student) {
    const tbody = document.getElementById('dash-timetable-body');
    if (!tbody) return;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];

    if (today === 'Sunday') {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--portal-text-muted);">🎉 Happy Sunday! No classes scheduled today.</td></tr>`;
      return;
    }

    // Load subjects for student class — key: classId
    const subjects = window.skhs_db.find('subjects', 'classId', student.classId);
    if (subjects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--portal-text-muted);">No timetable setup for your class.</td></tr>`;
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
      // Teacher key: teacherId (camelCase)
      const teacher = window.skhs_db.findOne('teachers', 'teacherId', sub.teacherId || sub.teacher_id);

      const row = document.createElement('tr');
      const curHour = new Date().getHours();
      const isCurrent = (index === 0 && curHour === 9) ||
                        (index === 1 && curHour === 10) ||
                        (index === 2 && curHour === 11) ||
                        (index === 3 && curHour === 12) ||
                        (index === 4 && curHour === 14) ||
                        (index === 5 && curHour === 15);

      if (isCurrent) {
        row.style.background = 'rgba(10, 45, 110, 0.08)';
        row.style.fontWeight = 'bold';
      }

      row.innerHTML = `
        <td>Period ${index + 1} ${isCurrent ? '⚡' : ''}</td>
        <td><strong>${sub.name}</strong></td>
        <td>${time}</td>
        <td>${teacher ? teacher.fullName : 'Class Teacher'}</td>
      `;
      tbody.appendChild(row);
    });
  }

  function loadRecentHomework(student) {
    const list = document.getElementById('dash-homework-list');
    if (!list) return;

    // key: classId
    const homeworks = window.skhs_db.find('homework', 'classId', student.classId);
    if (homeworks.length === 0) {
      list.innerHTML = `<p style="text-align: center; color: var(--portal-text-muted); padding: 1rem;">🎉 Excellent! No homework assigned.</p>`;
      return;
    }

    // Sort by due date
    homeworks.sort((a, b) => new Date(a.dueDate || a.due_date) - new Date(b.dueDate || b.due_date));

    list.innerHTML = '';

    homeworks.slice(0, 3).forEach(hw => {
      // completedStudents is either array (local) or comma string
      const compList = Array.isArray(hw.completedStudents)
        ? hw.completedStudents
        : String(hw.completedStudents || '').split(',').map(s => s.trim()).filter(Boolean);
      const isDone = compList.includes(student.studentId);

      // key: subjectId
      const sub = window.skhs_db.findOne('subjects', 'subjectId', hw.subjectId || hw.subject_id);

      const card = document.createElement('div');
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.padding = '0.75rem';
      card.style.border = '1px solid var(--portal-border)';
      card.style.borderRadius = '8px';
      card.style.background = 'var(--portal-bg-card)';

      card.innerHTML = `
        <div>
          <div style="font-weight: 600; font-size: 0.95rem;">${hw.title}</div>
          <div style="font-size: 0.75rem; color: var(--portal-text-muted); margin-top: 0.25rem;">
            Subject: ${sub ? sub.name : 'General'} | Due: ${hw.dueDate || hw.due_date}
          </div>
        </div>
        <span class="badge ${isDone ? 'badge-success' : 'badge-warning'}">${isDone ? 'Submitted' : 'Pending'}</span>
      `;
      list.appendChild(card);
    });
  }

  function loadAcademicSummary(student) {
    const pctEl = document.getElementById('dash-perf-percent');
    const gradeEl = document.getElementById('dash-perf-grade');
    const strongEl = document.getElementById('dash-perf-strong');
    const weakEl = document.getElementById('dash-perf-weak');
    const compareEl = document.getElementById('dash-perf-compare');
    const levelEl = document.getElementById('dash-perf-level');

    if (!pctEl) return;

    // key: studentId
    const marks = window.skhs_db.find('marks', 'studentId', student.studentId);
    if (marks.length === 0) {
      pctEl.textContent = '--%';
      if (gradeEl) gradeEl.textContent = 'Grade --';
      if (strongEl) strongEl.textContent = 'None';
      if (weakEl) weakEl.textContent = 'None';
      if (compareEl) compareEl.textContent = 'Average';
      if (levelEl) levelEl.textContent = 'Standard';
      return;
    }

    let totalObtained = 0;
    let totalMax = 0;
    const subjectScores = {};

    marks.forEach(m => {
      const obtained = m.marksObtained || m.marks_obtained || 0;
      const max = m.maxMarks || m.max_marks || 100;
      totalObtained += obtained;
      totalMax += max;

      // key: examId
      const exam = window.skhs_db.findOne('exams', 'examId', m.examId || m.exam_id);
      if (exam) {
        const subId = exam.subjectId || exam.subject_id;
        if (subId) {
          if (!subjectScores[subId]) subjectScores[subId] = { obtained: 0, max: 0 };
          subjectScores[subId].obtained += obtained;
          subjectScores[subId].max += max;
        }
      }
    });

    const overallPct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    pctEl.textContent = `${overallPct}%`;

    let grade = 'F';
    if (overallPct >= 90) grade = 'A+';
    else if (overallPct >= 80) grade = 'A';
    else if (overallPct >= 70) grade = 'B';
    else if (overallPct >= 60) grade = 'C';
    else if (overallPct >= 50) grade = 'D';

    if (gradeEl) {
      gradeEl.textContent = `Grade ${grade}`;
      gradeEl.className = `badge ${overallPct >= 75 ? 'badge-success' : overallPct >= 50 ? 'badge-warning' : 'badge-critical'}`;
    }

    // Strongest & Weakest — key: subjectId
    let strongName = 'N/A';
    let weakName = 'N/A';
    let maxSubPct = -1;
    let minSubPct = 101;

    Object.keys(subjectScores).forEach(subId => {
      const score = subjectScores[subId];
      if (score.max === 0) return;
      const subPct = (score.obtained / score.max) * 100;
      const sub = window.skhs_db.findOne('subjects', 'subjectId', subId);
      if (sub) {
        if (subPct > maxSubPct) { maxSubPct = subPct; strongName = sub.name; }
        if (subPct < minSubPct) { minSubPct = subPct; weakName = sub.name; }
      }
    });

    if (strongEl) strongEl.textContent = strongName;
    if (weakEl) weakEl.textContent = weakName;

    if (compareEl) {
      if (overallPct >= 85) compareEl.textContent = '🏆 Top 10% of class';
      else if (overallPct >= 70) compareEl.textContent = '👍 Above Class Median';
      else compareEl.textContent = '⚖️ Meets standards';
    }

    if (levelEl) {
      if (overallPct >= 85) levelEl.textContent = '🎯 Advanced Learner';
      else if (overallPct >= 70) levelEl.textContent = '🎯 Competent';
      else levelEl.textContent = '🎯 Focus Required';
    }
  }

  function loadExamCountdown(student) {
    const container = document.getElementById('dash-exam-countdown');
    if (!container) return;

    // key: classId
    const exams = window.skhs_db.find('exams', 'classId', student.classId);
    const today = new Date().setHours(0, 0, 0, 0);
    const upcomingExams = exams.filter(ex => new Date(ex.date) >= today);

    if (upcomingExams.length === 0) {
      container.innerHTML = `<p style="color: var(--portal-text-muted); font-size: 0.85rem; text-align: center;">No upcoming exams scheduled.</p>`;
      return;
    }

    upcomingExams.sort((a, b) => new Date(a.date) - new Date(b.date));
    const nextExam = upcomingExams[0];
    // key: subjectId
    const sub = window.skhs_db.findOne('subjects', 'subjectId', nextExam.subjectId || nextExam.subject_id);

    const ms = new Date(nextExam.date) - new Date();
    const days = Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));

    container.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 2.5rem; font-weight: 800; color: var(--portal-warning);">${days}</div>
        <div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--portal-text-muted);">Days Remaining</div>
      </div>
      <div style="margin-top: 0.5rem; padding: 0.75rem; border-radius: 8px; background: rgba(245, 166, 35, 0.05); border: 1px dashed var(--portal-warning); text-align: center;">
        <strong style="display: block; font-size: 0.9rem;">${nextExam.name}</strong>
        <span style="font-size: 0.75rem; color: var(--portal-text-muted);">Subject: ${sub ? sub.name : 'General'} | Date: ${nextExam.date}</span>
      </div>
    `;
  }

  function loadBadges(student) {
    const container = document.getElementById('dash-badges-container');
    if (!container) return;

    const badges = container.children;
    if (badges.length < 4) return;

    // 1. Attendance Champion (≥95%)
    const attRecords = window.skhs_db.find('attendance', 'studentId', student.studentId);
    let attPct = 0;
    if (attRecords.length > 0) {
      const presents = attRecords.filter(r => r.status === 'Present').length;
      attPct = (presents / attRecords.length) * 100;
    }
    if (attPct >= 95) {
      badges[0].style.opacity = '1';
      badges[0].style.filter = 'drop-shadow(0 0 4px var(--portal-warning))';
    }

    // 2. Homework Star (all completed)
    const homework = window.skhs_db.find('homework', 'classId', student.classId);
    const homeworkCompleted = homework.length > 0 && homework.every(h => {
      const compList = Array.isArray(h.completedStudents)
        ? h.completedStudents
        : String(h.completedStudents || '').split(',').map(s => s.trim()).filter(Boolean);
      return compList.includes(student.studentId);
    });
    if (homeworkCompleted) {
      badges[1].style.opacity = '1';
      badges[1].style.filter = 'drop-shadow(0 0 4px gold)';
    }

    // 3. Top Performer (≥90% average)
    const marks = window.skhs_db.find('marks', 'studentId', student.studentId);
    let tObtained = 0, tMax = 0;
    marks.forEach(m => {
      tObtained += m.marksObtained || m.marks_obtained || 0;
      tMax += m.maxMarks || m.max_marks || 100;
    });
    const avg = tMax > 0 ? (tObtained / tMax) * 100 : 0;
    if (avg >= 90) {
      badges[2].style.opacity = '1';
      badges[2].style.filter = 'drop-shadow(0 0 4px #a855f7)';
    }

    // 4. Consistent Learner
    const leaves = window.skhs_db.find('leave_requests', 'applicantId', student.studentId);
    const fees = window.skhs_db.find('fees', 'studentId', student.studentId);
    const paidAll = fees.length > 0 && fees.every(f => f.status === 'Paid');
    if (leaves.length > 0 && paidAll) {
      badges[3].style.opacity = '1';
      badges[3].style.filter = 'drop-shadow(0 0 4px var(--portal-success))';
    }
  }

  function loadActivityFeed(student) {
    const timeline = document.getElementById('dash-activity-timeline');
    if (!timeline) return;

    const feeds = [];

    // 1. Leave statuses
    const leaves = window.skhs_db.find('leave_requests', 'applicantId', student.studentId);
    leaves.forEach(l => {
      feeds.push({
        icon: '✉️',
        title: `Leave request for ${l.startDate || l.start_date}`,
        desc: `Status: ${l.status}. Reason: ${l.reason}`,
        time: new Date(l.startDate || l.start_date || Date.now())
      });
    });

    // 2. Homework
    const homework = window.skhs_db.find('homework', 'classId', student.classId);
    homework.forEach(hw => {
      feeds.push({
        icon: '✍️',
        title: `Homework Assigned: ${hw.title}`,
        desc: `Due: ${hw.dueDate || hw.due_date}. Click on Tasks module to submit.`,
        time: new Date(hw.dateAssigned || hw.date_assigned || Date.now())
      });
    });

    // 3. Notices
    const notices = window.skhs_db.find('notifications', 'userId', student.userId || student.user_id || '');
    notices.forEach(n => {
      feeds.push({
        icon: '🔔',
        title: n.title,
        desc: n.message,
        time: new Date(n.createdAt || n.created_at || Date.now())
      });
    });

    if (feeds.length === 0) {
      timeline.innerHTML = `<p style="color: var(--portal-text-muted); font-size: 0.85rem; text-align: center; border-left: none; padding-left: 0;">No recent activities found.</p>`;
      return;
    }

    feeds.sort((a, b) => b.time - a.time);
    timeline.innerHTML = '';

    feeds.slice(0, 5).forEach(f => {
      const item = document.createElement('div');
      item.style.position = 'relative';
      item.style.marginBottom = '0.5rem';

      item.innerHTML = `
        <div style="position: absolute; left: -25px; background: var(--portal-bg); padding: 2px; border-radius: 50%; font-size: 1.1rem;">${f.icon}</div>
        <div style="font-weight: 600; font-size: 0.85rem;">${f.title}</div>
        <div style="font-size: 0.75rem; color: var(--portal-text-muted); margin-top: 0.15rem;">${f.desc}</div>
        <div style="font-size: 0.65rem; color: var(--portal-text-muted); margin-top: 0.25rem;">${f.time.toLocaleDateString()}</div>
      `;
      timeline.appendChild(item);
    });
  }
})();
