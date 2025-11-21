/**
 * Анимационный цикл для 3D иллюстраций
 * Универсальный модуль для всех типов иллюстраций
 */

export class AnimationLoop {
  constructor(onFrame) {
    this.onFrame = onFrame;
    this.animationId = null;
    this.isRunning = false;
    this.resizeTimeout = null;
    this.handleResize = this.handleResize.bind(this);
  }

  /**
   * Запуск анимационного цикла
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.animate();
    
    // Подписываемся на события изменения размера окна
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Остановка анимационного цикла
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Отписываемся от событий
    window.removeEventListener('resize', this.handleResize);
    
    // Очищаем таймер resize
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
  }

  /**
   * Основной цикл анимации
   */
  animate() {
    if (!this.isRunning) return;
    
    // Вызываем callback для обновления кадра
    if (this.onFrame) {
      this.onFrame();
    }
    
    // Продолжаем анимацию
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Обработчик изменения размера окна (с debounce)
   */
  handleResize() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = setTimeout(() => {
      // Canvas пересчитается при следующем рендере
      // Конкретные иллюстрации могут переопределить этот метод
      if (this.onResize) {
        this.onResize();
      }
    }, 100);
  }
}

