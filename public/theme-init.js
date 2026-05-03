/* CSP-friendly early theme: no inline script in HTML. */
try {
  if (localStorage.getItem('flowaddis-theme') === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
} catch (e) {}
