/**
 * Главный класс иллюстрации сферы
 * Связывает модель, рендерер и анимацию
 */

import { AnimationLoop } from '../core/animation.js';
import { SphereModel } from './sphere-model.js';
import { SphereRenderer } from './sphere-renderer.js';
import { parseSphereConfig } from './sphere-config.js';

export class SphereIllustration {
  constructor(container) {
    this.container = container;
    this.canvas = container.querySelector('.illustration-canvas');
    
    if (!this.canvas) {
      throw new Error('Canvas element not found in container');
    }
    
    // Парсим конфигурацию
    this.config = parseSphereConfig(container);
    
    // Создаем компоненты
    this.model = new SphereModel(this.config);
    this.renderer = new SphereRenderer(this.canvas, container, this.config);
    this.animation = new AnimationLoop(() => this.onFrame());
    
    // Инициализируем модель
    this.model.initialize();
    
    // Запускаем управление линиями
    this.model.startLineManagement();
  }

  /**
   * Обработчик каждого кадра анимации
   */
  onFrame() {
    // Обновляем углы вращения
    this.model.updateRotationAngles(this.config.rotationSpeed);
    
    // Рендерим кадр
    this.renderer.render(this.model);
  }

  /**
   * Запуск анимации
   */
  start() {
    this.animation.start();
    // Первый рендер
    this.renderer.render(this.model);
  }

  /**
   * Остановка анимации
   */
  stop() {
    this.animation.stop();
    this.model.stopLineManagement();
  }

  /**
   * Получение модели для внешнего доступа
   * @returns {SphereModel}
   */
  getModel() {
    return this.model;
  }

  /**
   * Получение рендерера для внешнего доступа
   * @returns {SphereRenderer}
   */
  getRenderer() {
    return this.renderer;
  }
}

