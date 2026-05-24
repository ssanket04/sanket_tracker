/* =============================================
   MAIN APP — ROUTING, THEME, SHELL
   ============================================= */

const App = {
  currentPage: 'calendar',

  init() {
    this.initTheme();
    this.bindNav();
    this.showPage('calendar');
  },

  /* ---- THEME ---- */
  initTheme() {
    const saved = localStorage.getItem('pt_theme') || 'light';
    this.setTheme(saved, false);
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      this.setTheme(current === 'light' ? 'dark' : 'light');
    });
  },

  setTheme(theme, save = true) {
    document.documentElement.setAttribute('data-theme', theme);
    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    if (save) localStorage.setItem('pt_theme', theme);
  },

  showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn[data-page]').forEach(b => b.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');
    this.currentPage = page;

    if (page === 'calendar') CalendarView.init();
    if (page === 'weekly') WeeklyView.init();
  },

  openDay(dateStr) {
    if (this.currentPage === 'daily' && DailyView.currentDate) DailyView.forceSave();
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn[data-page]').forEach(b => b.classList.remove('active'));
    const pageEl = document.getElementById('page-daily');
    if (pageEl) pageEl.classList.add('active');
    this.currentPage = 'daily';
    DailyView.init(dateStr);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  backToCalendar() {
    if (DailyView.currentDate) DailyView.forceSave();
    this.showPage('calendar');
    this.toast('Day saved ✓', 'success');
  },

  bindNav() {
    document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.currentPage === 'daily') DailyView.forceSave();
        this.showPage(btn.dataset.page);
      });
    });

    document.getElementById('back-btn')?.addEventListener('click', () => this.backToCalendar());
    document.getElementById('done-btn')?.addEventListener('click', () => this.backToCalendar());

    document.getElementById('open-today')?.addEventListener('click', () => {
      this.openDay(Storage.formatDate(new Date()));
    });

    document.getElementById('add-extra-note-btn')?.addEventListener('click', () => {
      DailyView.addExtraNote();
    });
  },

  toast(msg, type = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.3s'; setTimeout(() => el.remove(), 300); }, 2800);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
  const { currentStreak } = Storage.calculateStreaks();
  if (currentStreak === 3) App.toast('🌟 3-day streak! Good momentum.', 'success');
  else if (currentStreak === 5) App.toast('💪 5-day streak! Strong discipline forming.', 'success');
  else if (currentStreak === 10) App.toast('🔥 10-day streak! Consistency is your identity.', 'success');
});

window.App = App;
