// ============================================================
//  Sri Kakatiya School Management Platform – teacher/calendar.js
//  Teacher School Calendar Controller
// ============================================================

(function () {
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') return;

    renderCalendar();
    setupListeners();

    window.addEventListener('skhs_db_synced', renderCalendar);
  });

  function setupListeners() {
    const prevBtn = document.getElementById('btn-cal-prev');
    const nextBtn = document.getElementById('btn-cal-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        renderCalendar();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        renderCalendar();
      });
    }
  }

  function renderCalendar() {
    const monthLabel = document.getElementById('calendar-month-label');
    const daysGrid = document.getElementById('calendar-days-grid');
    const agendaList = document.getElementById('calendar-agenda-list');

    if (!monthLabel || !daysGrid || !agendaList) return;

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    monthLabel.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    daysGrid.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Fill empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      const cell = document.createElement('div');
      cell.style.padding = '0.75rem';
      cell.style.opacity = '0';
      daysGrid.appendChild(cell);
    }

    const events = window.skhs_db.getCollection('calendar_events');
    const currentMonthEvents = events.filter(e => {
      const d = new Date(e.startDate || e.start_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    // Populate month days
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.style = `
        padding: 0.75rem 0.25rem;
        border: 1px solid var(--portal-border);
        border-radius: 8px;
        text-align: center;
        position: relative;
        font-weight: 600;
        background: var(--portal-bg-card);
      `;
      cell.textContent = day;

      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = currentMonthEvents.filter(e => (e.startDate || e.start_date) === dateStr);

      if (dayEvents.length > 0) {
        const dot = document.createElement('div');
        dot.style = `
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--portal-accent);
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
        `;
        cell.appendChild(dot);
        cell.style.border = '1px solid var(--portal-accent)';
        cell.title = dayEvents.map(e => e.title).join(', ');
      }

      // Today highlight
      const today = new Date();
      if (today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear) {
        cell.style.background = 'var(--portal-primary-light)';
        cell.style.color = '#ffffff';
      }

      daysGrid.appendChild(cell);
    }

    // Populate agenda
    if (currentMonthEvents.length === 0) {
      agendaList.innerHTML = `<p style="text-align: center; color: var(--portal-text-muted);">No events scheduled for this month.</p>`;
      return;
    }

    currentMonthEvents.sort((a, b) => new Date(a.startDate || a.start_date) - new Date(b.startDate || b.start_date));

    agendaList.innerHTML = '';
    currentMonthEvents.forEach(e => {
      const item = document.createElement('div');
      item.style = `
        padding: 0.75rem;
        border: 1px solid var(--portal-border);
        border-radius: 8px;
        background: var(--portal-bg-card);
      `;
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
          <strong style="font-size: 0.9rem;">${e.title}</strong>
          <span class="badge badge-info" style="font-size: 0.7rem;">${e.category}</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--portal-text-muted);">${e.startDate || e.start_date}</div>
        <div style="font-size: 0.8rem; margin-top: 0.25rem;">${e.description}</div>
      `;
      agendaList.appendChild(item);
    });
  }
})();
