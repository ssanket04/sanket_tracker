/* =============================================
   DATA STORAGE MODULE
   All data stored in localStorage
   Start date: 2026-05-25 (Day 1)
   ============================================= */

const DB_PREFIX = 'pt_';
const TRACKER_START = '2026-05-25';

const Storage = {
  dayKey: (dateStr) => `${DB_PREFIX}day_${dateStr}`,
  metaKey: () => `${DB_PREFIX}meta`,

  /* ---- ACTIVITIES TEMPLATE ---- */
  defaultActivities(dateStr) {
    const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    return [
      { id: 'wake',    name: 'Wake up at 6:30 AM',        icon: '🌅', priority: false, status: null, note: '', time: '6:30 AM' },
      { id: 'workout', name: 'Exercise (Workout)',          icon: '💪', priority: true,  status: null, note: '', time: '' },
      { id: isWeekend ? 'techlearn' : 'office',
                       name: isWeekend ? 'Learn Tech (2 hrs)' : 'Office Work',
                                                            icon: isWeekend ? '💻' : '💼', priority: false, status: null, note: '', time: '' },
      { id: 'reading', name: 'Reading (30 mins travel)',    icon: '📖', priority: false, status: null, note: '', time: '' },
      { id: 'eat',     name: 'Eat Clean (No Junk)',         icon: '🥗', priority: true,  status: null, note: '', time: '' },
      { id: 'skin',    name: 'Skin & Hair Care',            icon: '✨', priority: false, status: null, note: '', time: '' },
      { id: 'mba',     name: 'MBA Preparation',             icon: '🎓', priority: true,  status: null, note: '', time: '' },
      { id: 'sleep',   name: 'Sleep by 11:30 PM',           icon: '🌙', priority: false, status: null, note: '', time: '11:30 PM' },
    ];
  },

  /* ---- DAY NOTES (extra activities) ---- */
  // stored inside dayData.extraNotes = [ { id, text, time }, ... ]

  getDay(dateStr) {
    try {
      const raw = localStorage.getItem(this.dayKey(dateStr));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  },

  saveDay(dateStr, data) {
    try {
      localStorage.setItem(this.dayKey(dateStr), JSON.stringify(data));
      this.updateMeta();
      return true;
    } catch { return false; }
  },

  getOrCreateDay(dateStr) {
    const existing = this.getDay(dateStr);
    if (existing) {
      // Migrate old data: if no extraNotes field, add it
      if (!existing.extraNotes) existing.extraNotes = [];
      // Migrate weekend activity id if needed
      return existing;
    }
    return {
      date: dateStr,
      activities: this.defaultActivities(dateStr),
      extraNotes: [],
      productivity: 0,
      completedCount: 0,
      totalCount: 8,
      wonTheDay: false,
      summary: '',
      answeredCount: 0,
    };
  },

  computeProductivity(activities) {
    const answered = activities.filter(a => a.status !== null);
    const completed = activities.filter(a => a.status === 'done');
    const partial = activities.filter(a => a.status === 'partial');
    const total = activities.length;
    // Count partial as 0.5 completed
    const effectiveCompleted = completed.length + (partial.length * 0.5);
    const pct = total > 0 ? Math.round((effectiveCompleted / total) * 100) : 0;
    const priorities = activities.filter(a => a.priority);
    const wonTheDay = priorities.length > 0 && priorities.every(a => a.status === 'done');
    return { pct, completedCount: completed.length, totalCount: total, answeredCount: answered.length, wonTheDay };
  },

  generateSummary(pct, wonTheDay) {
    if (pct >= 90) return "Excellent consistency today — strong focus on all key priorities. Outstanding effort.";
    if (pct >= 80) return "Great day with high productivity and solid discipline across your habits.";
    if (pct >= 70 && wonTheDay) return "Good progress today. You won the day by completing what truly matters. Keep building.";
    if (pct >= 70) return "Good progress today, building steady momentum toward your goals.";
    if (pct >= 50) return "Solid effort — some wins today. Each completed habit adds up over time.";
    if (pct >= 30) return "A challenging day, but showing up is step one. Tomorrow is a fresh opportunity.";
    return "A fresh opportunity to strengthen your routine tomorrow. Rest and restart strong.";
  },

  /* ---- STREAK CALCULATION ---- */
  calculateStreaks() {
    const today = new Date();
    const todayStr = this.formatDate(today);
    const startDate = new Date(TRACKER_START + 'T00:00:00');

    // Collect all dates from start to today
    const allDates = [];
    const cur = new Date(startDate);
    while (this.formatDate(cur) <= todayStr) {
      allDates.push(this.formatDate(cur));
      cur.setDate(cur.getDate() + 1);
    }
    allDates.reverse(); // newest first

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let countingCurrent = true;

    for (let i = 1; i < allDates.length; i++) {
      const day = this.getDay(allDates[i]);
      if (day && day.productivity >= 70) {
        if (countingCurrent) currentStreak++;
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        countingCurrent = false;
        tempStreak = 0;
      }
    }
    const todayDay = this.getDay(allDates[0]);
    if (todayDay && todayDay.productivity >= 70) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    }

    const meta = this.getMeta();
    if (meta.bestStreak > bestStreak) bestStreak = meta.bestStreak;
    return { currentStreak, bestStreak };
  },

  getMeta() {
    try {
      const raw = localStorage.getItem(this.metaKey());
      if (!raw) return { bestStreak: 0 };
      return JSON.parse(raw);
    } catch { return { bestStreak: 0 }; }
  },

  updateMeta() {
    const { bestStreak } = this.calculateStreaks();
    const meta = this.getMeta();
    if (bestStreak > (meta.bestStreak || 0)) {
      localStorage.setItem(this.metaKey(), JSON.stringify({ ...meta, bestStreak }));
    }
  },

  getWeekData(weekStartDate) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + i);
      const dateStr = this.formatDate(d);
      const day = this.getDay(dateStr);
      days.push({ date: dateStr, dayObj: d, data: day });
    }
    return days;
  },

  /* ---- ACTIVITY STATS — out of days elapsed so far in this week ---- */
  getWeekActivityStats(weekDays) {
    const today = this.formatDate(new Date());
    const startDate = TRACKER_START;

    // Only count days up to today AND on/after tracker start
    const eligibleDays = weekDays.filter(w => w.date <= today && w.date >= startDate);

    const activityMap = {};
    const defaultActs = this.defaultActivities();
    // Build map with known IDs (cover both weekday and weekend variants)
    const allIds = ['wake','workout','office','techlearn','reading','eat','skin','mba','sleep'];
    const nameMap = {
      wake: { name: 'Wake up at 6:30 AM', icon: '🌅' },
      workout: { name: 'Exercise (Workout)', icon: '💪' },
      office: { name: 'Office Work', icon: '💼' },
      techlearn: { name: 'Learn Tech (2 hrs)', icon: '💻' },
      reading: { name: 'Reading (30 mins travel)', icon: '📖' },
      eat: { name: 'Eat Clean (No Junk)', icon: '🥗' },
      skin: { name: 'Skin & Hair Care', icon: '✨' },
      mba: { name: 'MBA Preparation', icon: '🎓' },
      sleep: { name: 'Sleep by 11:30 PM', icon: '🌙' },
    };
    allIds.forEach(id => {
      activityMap[id] = { name: nameMap[id].name, icon: nameMap[id].icon, completed: 0, total: 0 };
    });

    eligibleDays.forEach(({ data }) => {
      if (!data) return;
      data.activities.forEach(a => {
        if (!activityMap[a.id]) return;
        activityMap[a.id].total++;
        if (a.status === 'done') activityMap[a.id].completed++;
      });
    });

    return Object.values(activityMap).filter(s => s.total > 0);
  },

  /* ---- EXTRA NOTES for week ---- */
  getWeekExtraNotes(weekDays) {
    const today = this.formatDate(new Date());
    const startDate = TRACKER_START;
    const notes = [];
    weekDays.forEach(w => {
      if (w.date > today || w.date < startDate) return;
      if (!w.data || !w.data.extraNotes || w.data.extraNotes.length === 0) return;
      const dayLabel = new Date(w.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      w.data.extraNotes.forEach(n => {
        if (n.text && n.text.trim()) notes.push({ day: dayLabel, text: n.text, icon: n.icon || '📌' });
      });
    });
    return notes;
  },

  /* ---- AVAILABLE WEEKS from tracker start to 2050 ---- */
  getAvailableWeeks() {
    const start = new Date(TRACKER_START + 'T00:00:00');
    // Find Monday on or before start
    const startDay = start.getDay();
    const diffToMon = startDay === 0 ? -6 : 1 - startDay;
    const firstMonday = new Date(start);
    firstMonday.setDate(start.getDate() + diffToMon);
    firstMonday.setHours(0,0,0,0);

    const endDate = new Date('2050-12-31');
    const weeks = [];
    const cur = new Date(firstMonday);
    while (cur <= endDate) {
      weeks.push(new Date(cur));
      cur.setDate(cur.getDate() + 7);
    }
    return weeks;
  },

  getMonthData(year, month) {
    const days = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const day = this.getDay(dateStr);
      days.push({ dateStr, day });
    }
    return days;
  },

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  getColorClass(pct) {
    if (pct >= 80) return 'green';
    if (pct >= 50) return 'yellow';
    return 'red';
  },

  isBeforeStart(dateStr) {
    return dateStr < TRACKER_START;
  },
};

window.Storage = Storage;
