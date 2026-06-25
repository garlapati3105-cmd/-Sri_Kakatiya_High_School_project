// ============================================================
//  Sri Kakatiya School Management Platform – parent/academics.js
//  Parent Academics Controller (Refined)
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    renderResults();
    window.addEventListener('skhs_db_synced', renderResults);
    window.addEventListener('skhs_parent_child_changed', renderResults);
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

  function renderResults() {
    const studentId = getActiveChildId();
    if (!studentId) return;

    const tbody = document.getElementById('academics-report-body');
    const avgPctEl = document.getElementById('acad-avg-pct');

    if (!tbody || !avgPctEl) return;

    const marks = window.skhs_db.find('marks', 'studentId', studentId);
    if (marks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--portal-text-muted);">No examination marks reported yet.</td></tr>`;
      avgPctEl.textContent = '--%';
      return;
    }

    let obtainedSum = 0;
    let maxSum = 0;

    tbody.innerHTML = '';
    marks.forEach(m => {
      const exam = window.skhs_db.findOne('exams', 'examId', m.examId);
      const sub = exam ? window.skhs_db.findOne('subjects', 'subjectId', exam.subjectId) : null;
      const obtained = m.marksObtained || m.marks_obtained || 0;
      const max = m.maxMarks || m.max_marks || 100;
      const pct = max > 0 ? Math.round((obtained / max) * 100) : 0;

      obtainedSum += obtained;
      maxSum += max;

      let grade = 'F';
      if (pct >= 90) grade = 'A+';
      else if (pct >= 80) grade = 'A';
      else if (pct >= 70) grade = 'B';
      else if (pct >= 60) grade = 'C';
      else if (pct >= 50) grade = 'D';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${exam ? exam.name : 'Report Card'}</strong></td>
        <td>${sub ? sub.name : 'General'}</td>
        <td>${obtained} / ${max}</td>
        <td><span class="badge badge-success">Grade ${grade} (${pct}%)</span></td>
        <td><small>${m.remarks || 'No remarks provided.'}</small></td>
      `;
      tbody.appendChild(row);
    });

    const averagePct = maxSum > 0 ? Math.round((obtainedSum / maxSum) * 100) : 0;
    avgPctEl.textContent = `${averagePct}%`;
  }
})();
