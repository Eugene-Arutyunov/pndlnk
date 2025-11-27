/**
 * Анимационный цикл для 3D иллюстраций
 * Универсальный модуль для всех типов иллюстраций
 */

export class AnimationLoop {
  constructor(onFrame) {
    this.onFrame = onFrame;
    this.animationId = null;
    this.isRunning = false;
  }

  /**
   * Запуск анимационного цикла
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.animate();
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
}

