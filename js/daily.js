/* =============================================
   DAILY DETAIL VIEW MODULE
   ============================================= */

const DailyView = {
  currentDate: null,
  dayData: null,
  saveTimeout: null,

  init(dateStr) {
    this.currentDate = dateStr;
    this.dayData = Storage.getOrCreateDay(dateStr);
    this.render();
  },

  render() {
    const d = new Date(this.currentDate + 'T00:00:00');
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    document.getElementById('day-title').textContent =
      d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const dayType = document.getElementById('day-type');
    if (dayType) {
      dayType.innerHTML = isWeekend
        ? `<span class="pill priority">Weekend</span><span style="font-size:0.8rem;color:var(--text-muted)">MBA: 7+ hrs target</span>`
        : `<span class="pill" style="background:var(--blue-light);color:var(--blue);border-color:var(--blue-mid)">Weekday</span><span style="font-size:0.8rem;color:var(--text-muted)">MBA: 2+ hrs target</span>`;
    }

    this.renderActivities();
    this.renderExtraNotes();
    this.renderScore();
    this.renderStreaks();
  },

  renderActivities() {
    const priorityList = document.getElementById('priority-activities');
    const regularList = document.getElementById('regular-activities');
    if (!priorityList || !regularList) return;

    const priorities = this.dayData.activities.filter(a => a.priority);
    const regulars = this.dayData.activities.filter(a => !a.priority);

    priorityList.innerHTML = priorities.map(a => this.activityCard(a)).join('');
    regularList.innerHTML = regulars.map(a => this.activityCard(a)).join('');

    this.bindActivityEvents();
  },

  activityCard(a) {
    const statusClass = a.status === 'done' ? 'completed' : a.status === 'fail' ? 'failed' : a.status === 'partial' ? 'partial' : '';
    const toggleIcon = a.status === 'done' ? '✓' : a.status === 'fail' ? '✕' : a.status === 'partial' ? '●' : '';
    const toggleClass = a.status === 'done' ? 'done' : a.status === 'fail' ? 'fail' : a.status === 'partial' ? 'partial' : '';
    const priorityBadge = a.priority ? `<span class="pill priority">⭐ Priority</span>` : '';
    const timeBadge = a.time ? `<span class="time-badge">${a.time}</span>` : '';

    return `
      <div class="activity-card ${statusClass} ${a.priority ? 'priority-card' : ''} animate-in" data-id="${a.id}">
        <div class="activity-info">
          <div class="activity-name">
            <span>${a.icon}</span>
            <span>${a.name}</span>
            ${priorityBadge}
            ${timeBadge}
          </div>
          <input
            class="activity-note-input"
            type="text"
            placeholder="Add note or hours (optional)"
            value="${(a.note || '').replace(/"/g, '&quot;')}"
            data-id="${a.id}"
            maxlength="120"
          />
        </div>
        <div class="status-indicators">
          <button class="status-btn green-btn" data-id="${a.id}" data-status="done" title="Completed">✓</button>
          <button class="status-btn red-btn" data-id="${a.id}" data-status="fail" title="Not Completed">✕</button>
          <button class="status-btn yellow-btn" data-id="${a.id}" data-status="partial" title="Partially Completed">●</button>
          <div class="toggle-btn ${toggleClass}" data-id="${a.id}" title="Status">${toggleIcon}</div>
        </div>
      </div>
    `;
  },

  bindActivityEvents() {
    document.querySelectorAll('.status-btn[data-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setActivityStatus(btn.dataset.id, btn.dataset.status);
      });
    });

    document.querySelectorAll('.toggle-btn[data-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Toggle button is now just for display, clicking does nothing
      });
    });

    document.querySelectorAll('.activity-note-input[data-id]').forEach(input => {
      input.addEventListener('input', () => {
        const activity = this.dayData.activities.find(a => a.id === input.dataset.id);
        if (activity) { activity.note = input.value; this.scheduleSave(); }
      });
      input.addEventListener('click', e => e.stopPropagation());
    });

    document.querySelectorAll('.activity-card[data-id]').forEach(card => {
      card.addEventListener('click', () => {
        // Card click does nothing now, only status buttons work
      });
    });
  },

  setActivityStatus(id, status) {
    const activity = this.dayData.activities.find(a => a.id === id);
    if (!activity) return;
    activity.status = status;

    this.renderActivities();
    this.renderScore();
    this.scheduleSave();

    const btn = document.querySelector(`.toggle-btn[data-id="${id}"]`);
    if (btn) { btn.classList.add('pop'); setTimeout(() => btn.classList.remove('pop'), 300); }
  },

  toggleActivity(id) {
    const activity = this.dayData.activities.find(a => a.id === id);
    if (!activity) return;
    if (activity.status === null) activity.status = 'done';
    else if (activity.status === 'done') activity.status = 'partial';
    else if (activity.status === 'partial') activity.status = 'fail';
    else activity.status = null;

    this.renderActivities();
    this.renderScore();
    this.scheduleSave();

    const btn = document.querySelector(`.toggle-btn[data-id="${id}"]`);
    if (btn) { btn.classList.add('pop'); setTimeout(() => btn.classList.remove('pop'), 300); }
  },

  /* ---- EXTRA NOTES SECTION ---- */
  renderExtraNotes() {
    const container = document.getElementById('extra-notes-container');
    if (!container) return;
    if (!this.dayData.extraNotes) this.dayData.extraNotes = [];

    container.innerHTML = this.dayData.extraNotes.map((n, i) => `
      <div class="extra-note-row animate-in" data-ni="${i}">
        <span class="extra-note-icon">${n.icon || '📌'}</span>
        <input
          class="extra-note-input"
          type="text"
          placeholder="e.g. Swimming 45 mins, Blog post written..."
          value="${(n.text || '').replace(/"/g, '&quot;')}"
          data-ni="${i}"
          maxlength="150"
        />
        <button class="extra-note-del" data-ni="${i}" title="Remove">✕</button>
      </div>
    `).join('');

    // Bind inputs
    container.querySelectorAll('.extra-note-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const i = parseInt(inp.dataset.ni);
        this.dayData.extraNotes[i].text = inp.value;
        this.scheduleSave();
      });
    });
    container.querySelectorAll('.extra-note-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.ni);
        this.dayData.extraNotes.splice(i, 1);
        this.renderExtraNotes();
        this.scheduleSave();
      });
    });
  },

  addExtraNote() {
    if (!this.dayData.extraNotes) this.dayData.extraNotes = [];
    const icons = ['📌','🏊','🎸','✍️','🧘','🍳','🎯','🚴','📝','🎨','🏃','🧠'];
    const icon = icons[this.dayData.extraNotes.length % icons.length];
    this.dayData.extraNotes.push({ text: '', icon });
    this.renderExtraNotes();
    // Focus new input
    setTimeout(() => {
      const inputs = document.querySelectorAll('.extra-note-input');
      if (inputs.length) inputs[inputs.length - 1].focus();
    }, 50);
  },

  renderScore() {
    const { pct, completedCount, totalCount, wonTheDay, answeredCount } = Storage.computeProductivity(this.dayData.activities);
    const colorClass = Storage.getColorClass(pct);
    const summary = Storage.generateSummary(pct, wonTheDay);

    this.dayData.productivity = pct;
    this.dayData.completedCount = completedCount;
    this.dayData.totalCount = totalCount;
    this.dayData.answeredCount = answeredCount;
    this.dayData.wonTheDay = wonTheDay;
    this.dayData.summary = summary;

    const scoreNum = document.getElementById('score-num');
    if (scoreNum) {
      scoreNum.textContent = `${pct}%`;
      scoreNum.style.color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)';
    }
    const tasksCount = document.getElementById('tasks-count');
    if (tasksCount) tasksCount.textContent = `${completedCount} / ${totalCount} tasks completed`;

    const fill = document.getElementById('score-fill');
    if (fill) { fill.className = `progress-bar-fill ${colorClass}`; fill.style.width = `${pct}%`; }

    const winBadge = document.getElementById('win-day-badge');
    if (winBadge) {
      winBadge.className = wonTheDay ? 'win-day-badge' : 'win-day-badge not-yet';
      winBadge.innerHTML = wonTheDay ? '✅ You won the day.' : '⬜ Complete top 3 priorities to win.';
    }

    const summaryEl = document.getElementById('day-summary');
    if (summaryEl) {
      summaryEl.textContent = summary;
      summaryEl.className = `summary-box ${colorClass === 'yellow' ? 'yellow' : colorClass === 'red' ? 'red' : ''}`;
    }
  },

  renderStreaks() {
    const { currentStreak, bestStreak } = Storage.calculateStreaks();
    const el = document.getElementById('daily-streaks');
    if (!el) return;
    el.innerHTML = `
      <div class="streak-badge fire">🔥 ${currentStreak}-day streak</div>
      <div class="streak-badge trophy">🏆 Best: ${bestStreak} days</div>
    `;
  },

  scheduleSave() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => Storage.saveDay(this.currentDate, this.dayData), 600);
  },

  forceSave() {
    clearTimeout(this.saveTimeout);
    Storage.saveDay(this.currentDate, this.dayData);
  },
};

window.DailyView = DailyView;
