function initStickyObserver() {
  const stickyElement = document.querySelector(".sticky");

  if (!stickyElement) return;

  function checkSticky() {
    const rect = stickyElement.getBoundingClientRect();
    const stickyTop = parseInt(getComputedStyle(stickyElement).top) || 0;

    if (rect.top <= stickyTop) {
      stickyElement.classList.add("stuck");
    } else {
      stickyElement.classList.remove("stuck");
    }
  }

  // Проверяем при скролле
  window.addEventListener("scroll", checkSticky);

  // Проверяем при изменении размера окна
  window.addEventListener("resize", checkSticky);

  // Проверяем сразу при загрузке
  checkSticky();
}

// Инициализируем когда DOM готов
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initStickyObserver);
} else {
  initStickyObserver();
}
