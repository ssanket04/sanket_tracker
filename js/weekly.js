/* =============================================
   WEEKLY REVIEW MODULE
   ============================================= */

const WeeklyView = {
  selectedWeekStart: null,

  init() {
    if (!this.selectedWeekStart) this.selectedWeekStart = this.getCurrentWeekMonday();
    this.renderWeekSelector();
    this.renderWeekly();
  },

  getCurrentWeekMonday() {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    monday.setHours(0,0,0,0);
    return monday;
  },

  renderWeekSelector() {
    const sel = document.getElementById('week-select');
    if (!sel) return;
    const weeks = Storage.getAvailableWeeks();
    const today = new Date();
    const todayStr = Storage.formatDate(today);

    // Current week monday for default selection
    const curMonStr = Storage.formatDate(this.selectedWeekStart);

    sel.innerHTML = weeks.map(mon => {
      const monStr = Storage.formatDate(mon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const sunStr = Storage.formatDate(sun);
      // Skip weeks entirely in the future beyond today
      if (monStr > todayStr) return ''; // still show but mark
      const label = `${mon.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} – ${sun.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
      return `<option value="${monStr}" ${monStr === curMonStr ? 'selected' : ''}>${label}</option>`;
    }).filter(Boolean).join('');

    // Add future weeks too (greyed out style via label)
    // Actually add all weeks including future so user can plan
    const futureWeeks = weeks.filter(mon => Storage.formatDate(mon) > todayStr);
    futureWeeks.forEach(mon => {
      const monStr = Storage.formatDate(mon);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const label = `${mon.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} – ${sun.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} (upcoming)`;
      const opt = document.createElement('option');
      opt.value = monStr;
      opt.textContent = label;
      sel.appendChild(opt);
    });

    sel.addEventListener('change', () => {
      const parts = sel.value.split('-');
      this.selectedWeekStart = new Date(+parts[0], +parts[1]-1, +parts[2]);
      this.selectedWeekStart.setHours(0,0,0,0);
      this.renderWeekly();
    });
  },

  renderWeekly() {
    const weekDays = Storage.getWeekData(this.selectedWeekStart);
    const today = Storage.formatDate(new Date());
    const startDate = '2026-05-25';

    // Only count days that are: on/after tracker start AND on/before today
    const activeDays = weekDays.filter(w => w.date >= startDate && w.date <= today);
    const loggedDays = activeDays.filter(w => w.data);

    const totalTasks = loggedDays.reduce((s, w) => s + (w.data.totalCount || 0), 0);
    const completedTasks = loggedDays.reduce((s, w) => s + (w.data.completedCount || 0), 0);
    const weekPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const heroScoreEl = document.getElementById('weekly-score');
    if (heroScoreEl) heroScoreEl.textContent = activeDays.length > 0 ? `${weekPct}%` : '—';

    const heroTasksEl = document.getElementById('weekly-tasks');
    if (heroTasksEl) heroTasksEl.textContent = activeDays.length > 0
      ? `${completedTasks} / ${totalTasks} tasks completed`
      : 'No data yet for this week';

    const sun = new Date(this.selectedWeekStart);
    sun.setDate(this.selectedWeekStart.getDate() + 6);
    const rangeEl = document.getElementById('week-range');
    if (rangeEl) rangeEl.textContent =
      `${this.selectedWeekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} – ${sun.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    this.renderDayBars(weekDays, today, startDate);
    this.renderStreaks();
    this.renderHabits(weekDays, today, startDate);
    this.renderImprovements(weekDays, today, startDate);
    this.renderPriorities(weekDays, today, startDate);
    this.renderExtraNotes(weekDays);
    this.renderWeeklySummary(weekPct, completedTasks, totalTasks, loggedDays, activeDays);
  },

  renderDayBars(weekDays, today, startDate) {
    const el = document.getElementById('day-bars');
    if (!el) return;
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    el.innerHTML = weekDays.map((w, i) => {
      const isActive = w.date >= startDate && w.date <= today;
      const pct = (isActive && w.data) ? (w.data.productivity || 0) : 0;
      const label = isActive ? (pct > 0 ? pct + '%' : '0%') : '—';
      const bg = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : pct > 0 ? 'var(--red)' : 'var(--border)';
      return `
        <div class="day-bar-row">
          <div class="day-bar-label">${dayNames[i]}</div>
          <div class="day-bar-wrap"><div class="day-bar-fill" style="width:${pct}%;background:${bg}"></div></div>
          <div class="day-bar-pct">${label}</div>
        </div>
      `;
    }).join('');
  },

  renderStreaks() {
    const { currentStreak, bestStreak } = Storage.calculateStreaks();
    const el = document.getElementById('weekly-streaks');
    if (!el) return;
    el.innerHTML = `
      <div class="habit-row"><span class="habit-name">🔥 Current Streak</span><span class="habit-count">${currentStreak} days</span></div>
      <div class="habit-row"><span class="habit-name">🏆 Best Streak</span><span class="habit-count">${bestStreak} days</span></div>
    `;
  },

  renderHabits(weekDays, today, startDate) {
    const el = document.getElementById('habit-list');
    if (!el) return;
    const stats = Storage.getWeekActivityStats(weekDays);

    if (stats.length === 0) {
      el.innerHTML = `<div style="color:var(--text-muted);font-size:0.875rem;padding:8px 0">No tracked days yet for this week.</div>`;
      return;
    }

    const sorted = [...stats].sort((a, b) => (b.completed / Math.max(b.total,1)) - (a.completed / Math.max(a.total,1)));
    el.innerHTML = sorted.map(s => {
      const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      const bg = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';
      return `
        <div class="habit-row">
          <span class="habit-name">${s.icon} ${s.name}</span>
          <div style="display:flex;align-items:center;gap:8px;margin-left:auto">
            <div class="habit-bar-mini"><div class="habit-bar-mini-fill" style="width:${pct}%;background:${bg}"></div></div>
            <span class="habit-count">${s.completed}/${s.total}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  renderImprovements(weekDays, today, startDate) {
    const el = document.getElementById('improvements-list');
    if (!el) return;
    const stats = Storage.getWeekActivityStats(weekDays);
    const activeDays = weekDays.filter(w => w.date >= startDate && w.date <= today);

    if (activeDays.length === 0) {
      el.innerHTML = `<div style="color:var(--text-muted);font-size:0.875rem;padding:8px 0">No data yet for this week.</div>`;
      return;
    }

    const weak = stats.filter(s => s.total > 0 && (s.completed / s.total) < 0.5);
    if (weak.length === 0) {
      el.innerHTML = `<div style="color:var(--green);font-size:0.875rem;padding:8px 0">✅ All tracked habits performing well this week!</div>`;
      return;
    }
    el.innerHTML = `<div class="improvement-list">` + weak.map(s => `
      <div class="improvement-item">
        <span class="imp-icon">⚠️</span>
        <span>${s.name} — ${s.completed}/${s.total} days completed</span>
      </div>
    `).join('') + `</div>`;
  },

  renderPriorities(weekDays, today, startDate) {
    const el = document.getElementById('priorities-perf');
    if (!el) return;
    const priorityDef = [
      { id: 'mba', name: '🎓 MBA Preparation' },
      { id: 'workout', name: '💪 Exercise (Workout)' },
      { id: 'eat', name: '🥗 Eat Clean' },
    ];
    el.innerHTML = priorityDef.map(p => {
      let completed = 0, total = 0;
      weekDays.forEach(w => {
        if (w.date < startDate || w.date > today) return;
        if (!w.data) return;
        const act = w.data.activities.find(a => a.id === p.id);
        if (act) { total++; if (act.status === 'done') completed++; }
      });
      if (total === 0) return `<div class="prio-row"><div class="prio-name">${p.name} <span>No data</span></div></div>`;
      const pct = Math.round((completed / total) * 100);
      const bg = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';
      return `
        <div class="prio-row">
          <div class="prio-name">${p.name} <span>${completed}/${total} days</span></div>
          <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%;background:${bg}"></div></div>
        </div>
      `;
    }).join('');
  },

  renderExtraNotes(weekDays) {
    const el = document.getElementById('weekly-extra-notes');
    const section = document.getElementById('weekly-extra-notes-section');
    if (!el || !section) return;
    const notes = Storage.getWeekExtraNotes(weekDays);
    if (notes.length === 0) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    el.innerHTML = notes.map(n => `
      <div class="weekly-note-item">
        <span class="weekly-note-icon">${n.icon}</span>
        <div>
          <div class="weekly-note-day">${n.day}</div>
          <div class="weekly-note-text">${n.text}</div>
        </div>
      </div>
    `).join('');
  },

  renderWeeklySummary(weekPct, completed, total, loggedDays, activeDays) {
    const el = document.getElementById('weekly-summary');
    if (!el) return;
    let msg = '';
    if (activeDays.length === 0) msg = 'This week hasn\'t started yet or is before the tracker launch. Select a current or past week to see your review.';
    else if (loggedDays.length === 0) msg = 'No data logged yet this week. Start today — even one day tracked is a win.';
    else if (weekPct >= 85) msg = 'Outstanding week — exceptional discipline and consistency across all priorities. You\'re building something lasting.';
    else if (weekPct >= 70) msg = 'Strong effort this week with growing discipline. A few small improvements will unlock higher consistency next week.';
    else if (weekPct >= 50) msg = 'Good progress this week. Solid foundation forming — focus on top 3 priorities to elevate your score.';
    else msg = 'A challenging week, but every week is a fresh start. Identify 1–2 habits to sharpen and build from there.';

    const wonCount = loggedDays.filter(w => w.data && w.data.wonTheDay).length;
    const wonNote = wonCount > 0 ? ` You won the day ${wonCount} time${wonCount > 1 ? 's' : ''} this week. 🏆` : '';
    el.innerHTML = `<div class="ws-icon">📋</div><p>${msg}${wonNote}</p>`;
  },
};

window.WeeklyView = WeeklyView;
