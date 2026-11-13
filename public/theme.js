/* Keep storage key and colors in sync with src/app/theme.ts. */
(function () {
  var LIGHT = '#FAF8F2'
  var DARK = '#0E0C0A'
  var theme = 'dark'
  try {
    var stored = localStorage.getItem('tax-scratchpad-theme')
    if (stored === 'light' || stored === 'dark') theme = stored
  } catch {
    /* private mode */
  }
  document.documentElement.setAttribute('data-theme', theme)
  var meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? DARK : LIGHT)
})()
