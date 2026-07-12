document.addEventListener('DOMContentLoaded', () => {
  Sidebar.inject();

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 20,
    });
  }

  initPage();
});

function initPage() {
  const page = document.body.dataset.page || 'unknown';
  if (typeof window[`${page}Init`] === 'function') {
    window[`${page}Init`]();
  }
}
