// Applies the saved color theme before the first paint, so a light-mode user never
// sees a dark flash (and vice versa). Loaded as a blocking script from <head>: an
// external file rather than inline code, so a strict Content-Security-Policy still allows it.
// Keep the key and default in sync with src/core/theme/theme.ts.
(function () {
  var preference = 'dark';
  try {
    var stored = localStorage.getItem('pc-monitor-theme');
    if (stored === 'dark' || stored === 'light' || stored === 'system') preference = stored;
  } catch {
    // Storage blocked: keep the default.
  }
  var theme =
    preference === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preference;
  document.documentElement.dataset.theme = theme;
})();
