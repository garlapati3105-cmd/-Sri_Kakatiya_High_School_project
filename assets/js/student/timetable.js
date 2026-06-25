// ============================================================
//  Sri Kakatiya School Management Platform – student/timetable.js
//  Timetable Spreadsheet Grid Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Only run if user is student
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    loadTimetableData();

    // Listen to data syncs to update timetable
    window.addEventListener('skhs_db_synced', loadTimetableData);
  });

  function loadTimetableData() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const student = window.skhs_db.findOne('students', 'userId', currentUser.userId || currentUser.id);
    if (!student) return;

    const gridBody = document.getElementById('timetable-grid-body');
    const periodTracker = document.getElementById('timetable-period-tracker');
    if (!gridBody || !periodTracker) return;

    // FIX: use camelCase 'classId'
    const subjects = window.skhs_db.find('subjects', 'classId', student.classId);
    if (subjects.length === 0) {
      gridBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--portal-text-muted);">No timetable set up.</td></tr>`;
      periodTracker.innerHTML = `<div><span style="opacity: 0.75; font-size: 0.8rem;">Current Status:</span> <strong style="display:block;">No Schedule Loaded</strong></div>`;
      return;
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

    gridBody.innerHTML = '';
    days.forEach(day => {
      const row = document.createElement('tr');
      const isToday = day === currentDay;

      if (isToday) {
        row.style.background = 'rgba(10, 45, 110, 0.05)';
        row.style.fontWeight = '600';
        row.style.borderLeft = '4px solid var(--portal-primary-light)';
      }

      let rowHtml = `<td><strong>${day}</strong> ${isToday ? '🏷️' : ''}</td>`;
      
      // Generate periods dynamically
      for (let i = 0; i < 6; i++) {
        // Cycle subjects based on day and period index
        const subIndex = (days.indexOf(day) + i) % subjects.length;
        const sub = subjects[subIndex];
        rowHtml += `<td><strong>${sub.name}</strong><br><small style="font-size:0.75rem; color:var(--portal-text-muted);">Room ${100 + i}</small></td>`;
      }

      row.innerHTML = rowHtml;
      gridBody.appendChild(row);
    });

    // Render current tracker status
    renderPeriodTracker(subjects, currentDay);
  }

  function renderPeriodTracker(subjects, currentDay) {
    const tracker = document.getElementById('timetable-period-tracker');
    if (!tracker) return;

    if (currentDay === 'Sunday') {
      tracker.innerHTML = `
        <div><span style="opacity: 0.75; font-size: 0.8rem;">Current Status:</span> <strong style="display:block; font-size: 1.1rem; color: var(--portal-success);">Weekend Rest Day</strong></div>
        <div><span style="opacity: 0.75; font-size: 0.8rem;">Next Class:</span> <strong style="display:block; font-size: 1.1rem;">Monday 08:30 AM</strong></div>
        <div><span style="opacity: 0.75; font-size: 0.8rem;">Ongoing Period:</span> <strong style="display:block; font-size: 1.1rem;">None</strong></div>
      `;
      return;
    }

    const curHour = new Date().getHours();
    const curMin = new Date().getMinutes();
    const totalMins = curHour * 60 + curMin;

    // Period timings in minutes from midnight
    // P1: 8:30 (510) - 9:30 (570)
    // P2: 9:30 (570) - 10:30 (630)
    // Break: 10:30 (630) - 10:45 (645)
    // P3: 10:45 (645) - 11:45 (705)
    // P4: 11:45 (705) - 12:45 (765)
    // Lunch: 12:45 (765) - 1:30 (810)
    // P5: 1:30 (810) - 2:30 (870)
    // P6: 2:30 (870) - 3:30 (930)

    let currentPeriodName = "None (School Closed)";
    let currentRoom = "N/A";
    let nextPeriodName = "End of Day";
    let statusText = "Active Class Hour";

    if (totalMins < 510) {
      currentPeriodName = "Before Classes";
      const sub = subjects[0];
      nextPeriodName = `${sub.name} (Period 1)`;
      statusText = "Not Started";
    } else if (totalMins >= 510 && totalMins < 570) {
      const idx = 0 % subjects.length;
      currentPeriodName = `${subjects[idx].name} (Period 1)`;
      currentRoom = `Room ${100 + idx}`;
      const nextIdx = 1 % subjects.length;
      nextPeriodName = `${subjects[nextIdx].name} (Period 2)`;
    } else if (totalMins >= 570 && totalMins < 630) {
      const idx = 1 % subjects.length;
      currentPeriodName = `${subjects[idx].name} (Period 2)`;
      currentRoom = `Room ${100 + idx}`;
      nextPeriodName = "Morning Tea Break";
    } else if (totalMins >= 630 && totalMins < 645) {
      currentPeriodName = "Tea Break ☕";
      statusText = "Recess Break";
      const nextIdx = 2 % subjects.length;
      nextPeriodName = `${subjects[nextIdx].name} (Period 3)`;
    } else if (totalMins >= 645 && totalMins < 705) {
      const idx = 2 % subjects.length;
      currentPeriodName = `${subjects[idx].name} (Period 3)`;
      currentRoom = `Room ${100 + idx}`;
      const nextIdx = 3 % subjects.length;
      nextPeriodName = `${subjects[nextIdx].name} (Period 4)`;
    } else if (totalMins >= 705 && totalMins < 765) {
      const idx = 3 % subjects.length;
      currentPeriodName = `${subjects[idx].name} (Period 4)`;
      currentRoom = `Room ${100 + idx}`;
      nextPeriodName = "Lunch Break";
    } else if (totalMins >= 765 && totalMins < 810) {
      currentPeriodName = "Lunch Recess 🍱";
      statusText = "Lunch Break";
      const nextIdx = 4 % subjects.length;
      nextPeriodName = `${subjects[nextIdx].name} (Period 5)`;
    } else if (totalMins >= 810 && totalMins < 870) {
      const idx = 4 % subjects.length;
      currentPeriodName = `${subjects[idx].name} (Period 5)`;
      currentRoom = `Room ${100 + idx}`;
      const nextIdx = 5 % subjects.length;
      nextPeriodName = `${subjects[nextIdx].name} (Period 6)`;
    } else if (totalMins >= 870 && totalMins < 930) {
      const idx = 5 % subjects.length;
      currentPeriodName = `${subjects[idx].name} (Period 6)`;
      currentRoom = `Room ${100 + idx}`;
      nextPeriodName = "School Closed";
    }

    tracker.innerHTML = `
      <div><span style="opacity: 0.75; font-size: 0.8rem;">Current Period:</span> <strong style="display:block; font-size: 1.1rem; color: var(--portal-primary-light);">${currentPeriodName}</strong></div>
      <div><span style="opacity: 0.75; font-size: 0.8rem;">Classroom Location:</span> <strong style="display:block; font-size: 1.1rem;">${currentRoom}</strong></div>
      <div><span style="opacity: 0.75; font-size: 0.8rem;">Next Scheduled:</span> <strong style="display:block; font-size: 1.1rem;">${nextPeriodName}</strong></div>
    `;
  }
})();
