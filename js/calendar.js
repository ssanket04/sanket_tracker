/* =============================================
   CALENDAR PAGE MODULE
   ============================================= */

const CalendarView = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(),

  init() {
    this.render();
    this.bindNav();
  },

  render() {
    this.renderStreaks();
    this.renderQuote();
    this.renderCalendar();
  },

  renderStreaks() {
    const { currentStreak, bestStreak } = Storage.calculateStreaks();
    const el = document.getElementById('streak-section');
    if (!el) return;

    // Weekly avg
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    weekStart.setHours(0,0,0,0);
    const weekDays = Storage.getWeekData(weekStart);
    const datadays = weekDays.filter(w => w.data);
    const weekAvg = datadays.length
      ? Math.round(datadays.reduce((s, w) => s + (w.data.productivity || 0), 0) / datadays.length)
      : 0;

    el.innerHTML = `
      <div class="streak-card fire-card animate-in">
        <div class="sc-icon">🔥</div>
        <div class="sc-value">${currentStreak}</div>
        <div class="sc-label">Day Streak</div>
      </div>
      <div class="streak-card trophy-card animate-in" style="animation-delay:0.05s">
        <div class="sc-icon">🏆</div>
        <div class="sc-value">${bestStreak}</div>
        <div class="sc-label">Best Streak</div>
      </div>
      <div class="streak-card score-card animate-in" style="animation-delay:0.1s">
        <div class="sc-icon">📊</div>
        <div class="sc-value">${weekAvg}%</div>
        <div class="sc-label">This Week Avg</div>
      </div>
    `;

    // Streak reward message
    const rewardEl = document.getElementById('streak-reward');
    if (rewardEl) {
      let msg = '';
      if (currentStreak >= 10) msg = '🎯 Consistency is becoming your identity.';
      else if (currentStreak >= 5) msg = '💪 Strong discipline forming — keep going!';
      else if (currentStreak >= 3) msg = '✨ Good momentum building.';
      rewardEl.textContent = msg;
      rewardEl.style.display = msg ? 'block' : 'none';
    }
  },

  renderQuote() {
    const quotes = [
      { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
      { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
      { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
      { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
      { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
      { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
      { text: "Motivation gets you going. Discipline keeps you growing.", author: "John C. Maxwell" },
      { text: "Your habits will determine your future.", author: "Jack Canfield" },
      { text: "Every master was once a disaster. Every expert was once a beginner.", author: "Robin Sharma" },
      { text: "The pain of discipline weighs ounces. The pain of regret weighs tons.", author: "Jim Rohn" },
      { text: "Do what is hard; your life will be easy.", author: "Confucius" },
      { text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
      { text: "One day or day one — you decide.", author: "Paulo Coelho" },
      { text: "The best time to plant a tree was 20 years ago. The second best is today.", author: "Proverb" },
      { text: "Win the morning, win the day.", author: "Tim Ferriss" },
    ];
    // Pick quote based on day of year for consistency
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const q = quotes[dayOfYear % quotes.length];
    const el = document.getElementById('daily-quote');
    if (!el) return;
    el.innerHTML = `<p>${q.text}</p><small>— ${q.author}</small>`;
  },

  renderCalendar() {
    const year = this.currentYear;
    const month = this.currentMonth;
    const today = new Date();
    const todayStr = Storage.formatDate(today);

    document.getElementById('month-title').textContent =
      new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthData = Storage.getMonthData(year, month);

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-cell empty';
      grid.appendChild(empty);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayData = monthData[d-1]?.day;
      const isFuture = dateStr > todayStr;
      const isBeforeStart = Storage.isBeforeStart(dateStr);
      const isToday = dateStr === todayStr;

      const cell = document.createElement('div');
      const isBlocked = isFuture || isBeforeStart;
      cell.className = `cal-cell${isBlocked ? ' future' : ''}${isToday ? ' today' : ''}`;
      if (isBeforeStart) cell.style.opacity = '0.25';

      const numSpan = document.createElement('div');
      numSpan.className = 'cal-date-num';
      numSpan.textContent = d;
      cell.appendChild(numSpan);

      if (dayData && dayData.productivity != null && dayData.answeredCount > 0) {
        const pct = dayData.productivity;
        const colorClass = Storage.getColorClass(pct);

        const bar = document.createElement('div');
        bar.className = 'cal-score-bar';
        const fill = document.createElement('div');
        fill.className = `cal-score-bar-fill ${colorClass}`;
        fill.style.width = `${pct}%`;
        bar.appendChild(fill);
        cell.appendChild(bar);

        if (dayData.wonTheDay) {
          const dot = document.createElement('div');
          dot.className = 'cal-dot-row';
          dot.innerHTML = `<div class="cal-dot green" title="Won the Day!"></div>`;
          cell.appendChild(dot);
        }
      }

      if (!isFuture && !isBeforeStart) {
        cell.addEventListener('click', () => {
          App.openDay(dateStr);
        });
      }

      grid.appendChild(cell);
    }
  },

  bindNav() {
    document.getElementById('prev-month')?.addEventListener('click', () => {
      this.currentMonth--;
      if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
      this.renderCalendar();
    });
    document.getElementById('next-month')?.addEventListener('click', () => {
      this.currentMonth++;
      if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
      this.renderCalendar();
    });
  },
};

window.CalendarView = CalendarView;
