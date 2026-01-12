/**
 * Главный класс иллюстрации splash
 * Связывает модель, рендерер и анимацию
 */

import { AnimationLoop } from '../core/animation.js';
import { SplashModel } from './splash-model.js';
import { SplashRenderer } from './splash-renderer.js';
import { parseSplashConfig } from './splash-config.js';

export class SplashIllustration {
  constructor(container) {
    this.container = container;
    
    // Проверяем, есть ли родительский контейнер с двумя слоями
    const parentContainer = container.closest('.dkcp-splash-container');
    const canvasLayer = container.dataset.canvasLayer;
    
    let backContainer, frontContainer;
    
    if (parentContainer && canvasLayer) {
      // Режим с двумя canvas - находим оба контейнера
      backContainer = parentContainer.querySelector('[data-canvas-layer="back"]');
      frontContainer = parentContainer.querySelector('[data-canvas-layer="front"]');
      
      if (!backContainer || !frontContainer) {
        throw new Error('Both back and front containers must be present');
      }
      
      this.backCanvas = backContainer.querySelector('.illustration-canvas');
      this.frontCanvas = frontContainer.querySelector('.illustration-canvas');
      
      if (!this.backCanvas || !this.frontCanvas) {
        throw new Error('Canvas elements not found in containers');
      }
      
      // Используем первый контейнер для конфигурации
      this.container = backContainer;
      this.isDualCanvas = true;
    } else {
      // Обычный режим с одним canvas
      this.canvas = container.querySelector('.illustration-canvas');
      if (!this.canvas) {
        throw new Error('Canvas element not found in container');
      }
      this.isDualCanvas = false;
    }

    // Парсим конфигурацию
    this.config = parseSplashConfig(this.container);

    // Создаём компоненты
    this.model = new SplashModel(this.config);
    
    if (this.isDualCanvas) {
      this.renderer = new SplashRenderer(null, this.container, this.config);
      this.renderer.backCanvas = this.backCanvas;
      this.renderer.frontCanvas = this.frontCanvas;
      this.renderer.backContainer = backContainer;
      this.renderer.frontContainer = frontContainer;
    } else {
      this.renderer = new SplashRenderer(this.canvas, this.container, this.config);
    }
    
    this.animation = new AnimationLoop(() => this.onFrame());

    // Флаг для отслеживания загрузки
    this.isLoaded = false;
    this.resizeObserver = null;
  }

  /**
   * Загрузка SVG файла
   * @returns {Promise<void>}
   */
  async loadSVG() {
    try {
      const response = await fetch('/assets/illustrations/splash/Artboard 39.svg');
      if (!response.ok) {
        throw new Error(`Failed to load SVG: ${response.statusText}`);
      }
      const svgContent = await response.text();
      this.model.loadSVG(svgContent);
      this.isLoaded = true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Обработчик каждого кадра анимации
   */
  onFrame() {
    if (!this.isLoaded) return;
    
    // Обновляем модель (анимация вращения)
    this.model.update();
    
    // Рендерим кадр
    this.renderer.render(this.model);
  }

  /**
   * Запуск иллюстрации с анимацией
   */
  async start() {
    // Загружаем SVG
    await this.loadSVG();

    // Инициализируем ResizeObserver для отслеживания изменений размера контейнера
    this.initResizeObserver();

    // Используем requestAnimationFrame для первого рендера, чтобы контейнеры успели получить размеры
    requestAnimationFrame(() => {
      // Настраиваем canvas (один или два в зависимости от режима)
      if (this.isDualCanvas) {
        this.renderer.setupDualCanvas();
      } else {
        this.renderer.setupCanvas();
      }

      // Запускаем анимацию
      this.animation.start();
      
      // Первый рендер
      this.renderer.render(this.model);
    });
  }

  /**
   * Остановка иллюстрации
   */
  stop() {
    this.animation.stop();
    
    // Отключаем ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  /**
   * Инициализация ResizeObserver для отслеживания изменений размера контейнера
   */
  initResizeObserver() {
    // Отключаем предыдущий observer, если он существует
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // Создаём новый ResizeObserver
    this.resizeObserver = new ResizeObserver(() => {
      // При изменении размера контейнера пересчитываем canvas и перерисовываем
      if (this.isLoaded) {
        if (this.isDualCanvas) {
          this.renderer.setupDualCanvas();
        } else {
          this.renderer.setupCanvas();
        }
        this.renderer.render(this.model);
      }
    });

    // Начинаем наблюдение за контейнером
    this.resizeObserver.observe(this.container);
  }

  /**
   * Получение модели для внешнего доступа
   * @returns {SplashModel}
   */
  getModel() {
    return this.model;
  }

  /**
   * Получение рендерера для внешнего доступа
   * @returns {SplashRenderer}
   */
  getRenderer() {
    return this.renderer;
  }
}
