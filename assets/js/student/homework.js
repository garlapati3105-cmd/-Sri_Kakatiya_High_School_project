// ============================================================
//  Sri Kakatiya School Management Platform – student/homework.js
//  Homework Workspace and Submission Simulation Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    loadHomeworkData();
    window.addEventListener('skhs_db_synced', loadHomeworkData);
  });

  function loadHomeworkData() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const student = window.skhs_db.findOne('students', 'userId', currentUser.userId || currentUser.id);
    if (!student) return;

    const rosterBody = document.getElementById('homework-roster-body');
    const dueSoonList = document.getElementById('homework-due-soon-list');
    if (!rosterBody || !dueSoonList) return;

    // FIX: use camelCase key 'classId'
    const homeworks = window.skhs_db.find('homework', 'classId', student.classId);
    if (homeworks.length === 0) {
      rosterBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--portal-text-muted);">🎉 Excellent! No homework assigned.</td></tr>`;
      dueSoonList.innerHTML = `<p style="color: var(--portal-text-muted); font-size: 0.85rem; text-align: center;">No upcoming deadlines.</p>`;
      updateHwStats(0, 0);
      return;
    }

    // Sort homework by due date
    homeworks.sort((a, b) => new Date(a.dueDate || a.due_date) - new Date(b.dueDate || b.due_date));

    let completedCount = 0;
    let pendingCount = 0;

    rosterBody.innerHTML = '';
    dueSoonList.innerHTML = '';

    homeworks.forEach(hw => {
      // FIX: completedStudents is an array (from postprocessFromDB) or comma string
      const compList = Array.isArray(hw.completedStudents)
        ? hw.completedStudents
        : String(hw.completedStudents || hw.completed_students || '').split(',').map(s => s.trim()).filter(Boolean);
      const isDone = compList.includes(student.studentId);

      // FIX: use camelCase 'subjectId'
      const sub = window.skhs_db.findOne('subjects', 'subjectId', hw.subjectId || hw.subject_id);
      const subName = sub ? sub.name : 'General';
      const hwId = hw.homeworkId || hw.homework_id;
      const dueDate = hw.dueDate || hw.due_date;

      if (isDone) completedCount++;
      else pendingCount++;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${subName}</strong></td>
        <td>
          <div style="font-weight: 600;">${hw.title}</div>
          <div style="font-size: 0.75rem; color: var(--portal-text-muted); margin-top: 0.25rem;">${hw.description || 'No description provided.'}</div>
        </td>
        <td>${dueDate}</td>
        <td>
          <span class="badge ${isDone ? 'badge-success' : 'badge-warning'}">${isDone ? 'Submitted' : 'Pending'}</span>
        </td>
        <td>
          ${isDone
            ? `<button class="btn-portal" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; background: var(--portal-bg-card); color: var(--portal-text-muted); border-color: var(--portal-border); cursor: not-allowed;" disabled>Done</button>`
            : `<button class="btn-portal submit-hw-btn" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" data-id="${hwId}">Submit</button>`
          }
        </td>
      `;
      rosterBody.appendChild(row);

      // Due soon check (within next 3 days and not done)
      if (!isDone) {
        const msDiff = new Date(dueDate) - new Date().setHours(0, 0, 0, 0);
        const daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff <= 3) {
          const dueCard = document.createElement('div');
          dueCard.style.padding = '0.75rem';
          dueCard.style.borderRadius = '8px';
          dueCard.style.background = 'rgba(245, 166, 35, 0.05)';
          dueCard.style.borderLeft = '4px solid var(--portal-warning)';
          dueCard.style.display = 'flex';
          dueCard.style.justifyContent = 'space-between';
          dueCard.style.alignItems = 'center';

          dueCard.innerHTML = `
            <div>
              <strong style="font-size: 0.85rem; display: block;">${hw.title}</strong>
              <span style="font-size: 0.7rem; color: var(--portal-text-muted);">Due: ${daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Tomorrow' : 'In ' + daysDiff + ' days'}</span>
            </div>
            <button class="btn-portal submit-hw-btn" style="padding: 0.2rem 0.4rem; font-size: 0.75rem; background: var(--portal-warning); border: none;" data-id="${hwId}">Submit</button>
          `;
          dueSoonList.appendChild(dueCard);
        }
      }
    });

    if (dueSoonList.children.length === 0) {
      dueSoonList.innerHTML = `<p style="color: var(--portal-text-muted); font-size: 0.85rem; text-align: center;">No urgent upcoming deadlines.</p>`;
    }

    updateHwStats(completedCount, pendingCount);

    // Bind event listeners to submission buttons
    document.querySelectorAll('.submit-hw-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const hwId = e.currentTarget.getAttribute('data-id');
        openSubmitModal(hwId, student);
      });
    });
  }

  function updateHwStats(comp, pend) {
    const compEl = document.getElementById('hw-count-comp');
    const pendEl = document.getElementById('hw-count-pend');
    const percentEl = document.getElementById('hw-gauge-percent');
    const circle = document.getElementById('hw-gauge-circle');

    if (compEl) compEl.textContent = comp;
    if (pendEl) pendEl.textContent = pend;

    const total = comp + pend;
    const pct = total > 0 ? Math.round((comp / total) * 100) : 100;

    if (percentEl) percentEl.textContent = `${pct}%`;

    if (circle) {
      const circumference = 283;
      const offset = circumference - (pct / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }
  }

  function openSubmitModal(hwId, student) {
    // FIX: use camelCase 'homeworkId'
    const hw = window.skhs_db.findOne('homework', 'homeworkId', hwId)
             || window.skhs_db.findOne('homework', 'homework_id', hwId);
    if (!hw) {
      console.warn('[HOMEWORK] Could not find homework with ID:', hwId);
      return;
    }

    let modal = document.getElementById('hw-submit-modal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'hw-submit-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '9999';
    modal.style.backdropFilter = 'blur(4px)';

    modal.innerHTML = `
      <div class="portal-card" style="width: 90%; max-width: 450px; padding: 2rem; position: relative;">
        <h3 class="card-title" style="margin-bottom: 0.5rem;">✍️ Submit Homework</h3>
        <p style="font-size: 0.85rem; color: var(--portal-text-muted); margin-bottom: 1.5rem;">Uploading assignment for: <strong>${hw.title}</strong></p>
        
        <form id="hw-modal-form">
          <div class="form-group">
            <label class="form-label" for="hw-modal-notes">Submission Notes (Optional)</label>
            <textarea id="hw-modal-notes" class="form-input" rows="3" placeholder="Write any comments for your teacher..."></textarea>
          </div>
          
          <div class="form-group">
            <label class="form-label" for="hw-modal-file">Choose Reference File</label>
            <input type="file" id="hw-modal-file" class="form-input" required>
            <small style="color:var(--portal-text-muted); display:block; margin-top:0.25rem;">Supports Document, PDF or Image up to 5MB.</small>
          </div>

          <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
            <button type="button" class="btn-portal" id="hw-modal-cancel" style="background: var(--portal-bg); color: var(--portal-text-main); border: 1px solid var(--portal-border); box-shadow: none;">Cancel</button>
            <button type="submit" class="btn-portal">Confirm Upload</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('hw-modal-cancel').addEventListener('click', () => {
      modal.remove();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.getElementById('hw-modal-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const fileInput = document.getElementById('hw-modal-file');
      if (fileInput.files.length === 0) {
        alert('Please select a file to upload.');
        return;
      }

      // Add student to completedStudents list
      const existingList = Array.isArray(hw.completedStudents)
        ? [...hw.completedStudents]
        : String(hw.completedStudents || hw.completed_students || '').split(',').map(s => s.trim()).filter(Boolean);

      if (!existingList.includes(student.studentId)) {
        existingList.push(student.studentId);
      }

      // FIX: update using camelCase key 'homeworkId'
      const res = await window.skhs_db.update('homework', 'homeworkId', hwId, {
        completedStudents: existingList
      });

      const alertContainer = document.getElementById('dashboard-alert-container');
      const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

      if (res) {
        await window.skhs_db.logActivity(
          'homework_submit',
          'homework',
          'info',
          student.userId || student.user_id,
          hwId,
          `Homework "${hw.title}" submitted by student.`
        );
        showAlert(`Homework "${hw.title}" uploaded successfully!`, 'success');
        modal.remove();
        loadHomeworkData();
      } else {
        showAlert('Homework submission failed. Try again.', 'error');
      }
    });
  }
})();
