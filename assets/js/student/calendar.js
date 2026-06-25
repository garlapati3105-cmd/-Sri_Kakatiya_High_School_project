// ============================================================
//  Sri Kakatiya School Management Platform – student/calendar.js
//  School Calendar and Agenda Feed Controller
// ============================================================

(function () {
  let currentDate = new Date();

  document.addEventListener('DOMContentLoaded', () => {
    // Only run if user is student
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    loadCalendar();

    // Listen to data syncs to update calendar view
    window.addEventListener('skhs_db_synced', loadCalendar);

    // Prev/Next buttons
    const btnPrev = document.getElementById('btn-cal-prev');
    const btnNext = document.getElementById('btn-cal-next');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        loadCalendar();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        loadCalendar();
      });
    }
  });

  function loadCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthLabel = document.getElementById('calendar-month-label');
    const agendaList = document.getElementById('calendar-agenda-list');
    
    if (!grid || !monthLabel || !agendaList) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Set Label e.g., "June 2026"
    monthLabel.textContent = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Fetch calendar events from DB
    const allEvents = window.skhs_db.getCollection('calendar_events');
    const currentMonthEvents = allEvents.filter(ev => {
      const d = new Date(ev.start_date || ev.startDate);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    // Renders Agenda list
    renderAgendaList(currentMonthEvents, agendaList);

    // Renders Calendar dates grid
    renderCalendarGrid(year, month, currentMonthEvents, grid);
  }

  function renderCalendarGrid(year, month, events, grid) {
    grid.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    // Render padding days from previous month
    for (let x = firstDayIndex; x > 0; x--) {
      const dayEl = document.createElement('div');
      dayEl.style.padding = '0.5rem';
      dayEl.style.textAlign = 'center';
      dayEl.style.color = 'var(--portal-text-muted)';
      dayEl.style.opacity = '0.3';
      dayEl.style.background = 'var(--portal-bg)';
      dayEl.textContent = prevTotalDays - x + 1;
      grid.appendChild(dayEl);
    }

    // Render current month days
    for (let day = 1; day <= totalDays; day++) {
      const dayEl = document.createElement('div');
      dayEl.style.padding = '0.5rem';
      dayEl.style.textAlign = 'center';
      dayEl.style.background = 'var(--portal-bg)';
      dayEl.style.position = 'relative';
      dayEl.style.minHeight = '45px';
      dayEl.style.borderRadius = '4px';

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.start_date === dateStr);

      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      if (isToday) {
        dayEl.style.background = 'rgba(10, 45, 110, 0.15)';
        dayEl.style.border = '1px solid var(--portal-primary-light)';
        dayEl.style.fontWeight = 'bold';
      }

      dayEl.innerHTML = `<span style="font-size: 0.95rem;">${day}</span>`;

      // Event dots indicators
      if (dayEvents.length > 0) {
        const dotsContainer = document.createElement('div');
        dotsContainer.style.display = 'flex';
        dotsContainer.style.justifyContent = 'center';
        dotsContainer.style.gap = '2px';
        dotsContainer.style.marginTop = '4px';

        dayEvents.forEach(e => {
          const dot = document.createElement('span');
          dot.style.width = '6px';
          dot.style.height = '6px';
          dot.style.borderRadius = '50%';
          
          // Color based on category
          if (e.category === 'Holiday') dot.style.background = 'var(--portal-error)';
          else if (e.category === 'Exam') dot.style.background = 'var(--portal-warning)';
          else if (e.category === 'Meeting') dot.style.background = 'var(--portal-primary-light)';
          else dot.style.background = 'var(--portal-success)';

          dot.title = `${e.category}: ${e.title}`;
          dotsContainer.appendChild(dot);
        });
        dayEl.appendChild(dotsContainer);
      }

      grid.appendChild(dayEl);
    }
  }

  function renderAgendaList(events, container) {
    if (events.length === 0) {
      container.innerHTML = `<p style="text-align: center; color: var(--portal-text-muted); padding: 1.5rem;">No events or school assemblies scheduled for this month.</p>`;
      return;
    }

    // Sort by start date ascending
    events.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    container.innerHTML = '';
    events.forEach(e => {
      const card = document.createElement('div');
      card.style.padding = '0.75rem';
      card.style.border = '1px solid var(--portal-border)';
      card.style.borderRadius = '8px';
      card.style.background = 'var(--portal-bg-card)';
      
      let borderCol = 'var(--portal-border)';
      let badgeClass = 'badge-neutral';
      if (e.category === 'Holiday') {
        borderCol = 'var(--portal-error)';
        badgeClass = 'badge-critical';
      } else if (e.category === 'Exam') {
        borderCol = 'var(--portal-warning)';
        badgeClass = 'badge-warning';
      } else if (e.category === 'Meeting') {
        borderCol = 'var(--portal-primary-light)';
        badgeClass = 'badge-info';
      } else if (e.category === 'Event') {
        borderCol = 'var(--portal-success)';
        badgeClass = 'badge-success';
      }

      card.style.borderLeft = `4px solid ${borderCol}`;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.25rem;">
          <strong style="font-size: 0.9rem;">${e.title}</strong>
          <span class="badge ${badgeClass}" style="font-size: 0.7rem;">${e.category}</span>
        </div>
        <p style="font-size: 0.75rem; color: var(--portal-text-muted); margin: 0 0 0.5rem 0;">${e.description || 'No description provided.'}</p>
        <span style="font-size: 0.7rem; font-weight: 500;">📅 Date: ${e.start_date} ${e.end_date && e.end_date !== e.start_date ? 'to ' + e.end_date : ''}</span>
      `;
      container.appendChild(card);
    });
  }
})();
