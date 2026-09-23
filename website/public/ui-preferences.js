// Runs synchronously in the document head so the saved theme is applied before paint.
(() => {
  const keys = {
    language: 'txl-language',
    theme: 'txl-theme',
    sidebarCollapsed: 'txl-sidebar-collapsed',
  };
  const languages = new Set(['de', 'en', 'fr']);

  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // The current choice still works when browser storage is unavailable.
    }
  }

  const savedLanguage = read(keys.language);
  const state = {
    language: languages.has(savedLanguage) ? savedLanguage : 'de',
    theme: read(keys.theme) === 'light' ? 'light' : 'dark',
    sidebarCollapsed: read(keys.sidebarCollapsed) === 'true',
  };

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    document.querySelector('meta[name="theme-color"]').content =
      state.theme === 'dark' ? '#101b1e' : '#fbfcf8';
  }

  applyTheme();

  window.txlUiPreferences = {
    get language() { return state.language; },
    setLanguage(value) {
      state.language = languages.has(value) ? value : 'en';
      write(keys.language, state.language);
      return state.language;
    },
    get theme() { return state.theme; },
    setTheme(value) {
      state.theme = value === 'dark' ? 'dark' : 'light';
      applyTheme();
      write(keys.theme, state.theme);
      return state.theme;
    },
    get sidebarCollapsed() { return state.sidebarCollapsed; },
    setSidebarCollapsed(value) {
      state.sidebarCollapsed = Boolean(value);
      write(keys.sidebarCollapsed, String(state.sidebarCollapsed));
      return state.sidebarCollapsed;
    },
  };
})();
