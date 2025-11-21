/**
 * Главный класс иллюстрации layered-house
 * Связывает модель, рендерер и анимацию
 */

import { AnimationLoop } from '../core/animation.js';
import { LayeredHouseModel } from './layered-house-model.js';
import { LayeredHouseRenderer } from './layered-house-renderer.js';
import { parseLayeredHouseConfig } from './layered-house-config.js';

export class LayeredHouseIllustration {
  constructor(container) {
    this.container = container;
    this.canvas = container.querySelector('.illustration-canvas');

    if (!this.canvas) {
      throw new Error('Canvas element not found in container');
    }

    // Парсим конфигурацию
    this.config = parseLayeredHouseConfig(container);

    // Создаём компоненты
    this.model = new LayeredHouseModel(this.config);
    this.renderer = new LayeredHouseRenderer(this.canvas, container, this.config);
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
      const response = await fetch('/assets/illustrations/layered-house/sourse-graphics.html');
      if (!response.ok) {
        throw new Error(`Failed to load SVG: ${response.statusText}`);
      }
      const svgContent = await response.text();
      this.model.loadSVG(svgContent);
      this.isLoaded = true;
    } catch (error) {
      console.error('Error loading SVG:', error);
      throw error;
    }
  }

  /**
   * Обработчик каждого кадра анимации
   */
  onFrame() {
    if (!this.isLoaded) return;
    
    // Обновляем анимацию всех слоёв
    this.model.updateAnimations();
    
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

    // Запускаем анимацию
    this.animation.start();
    
    // Первый рендер
    this.renderer.render(this.model);
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
        this.renderer.setupCanvas();
        this.renderer.render(this.model);
      }
    });

    // Начинаем наблюдение за контейнером
    this.resizeObserver.observe(this.container);
  }

  /**
   * Получение модели для внешнего доступа
   * @returns {LayeredHouseModel}
   */
  getModel() {
    return this.model;
  }

  /**
   * Получение рендерера для внешнего доступа
   * @returns {LayeredHouseRenderer}
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * Обновление параметров поворота и расстояния между слоями
   * @param {number} rotationX - угол поворота вокруг X в градусах
   * @param {number} rotationY - угол поворота вокруг Y в градусах
   * @param {number} rotationZ - угол поворота вокруг Z в градусах
   * @param {number} layerSpacing - расстояние между слоями
   */
  updateRotation(rotationX, rotationY, rotationZ, layerSpacing) {
    if (!this.isLoaded) return;

    // Обновляем конфигурацию
    this.config.rotationX = rotationX;
    this.config.rotationY = rotationY;
    this.config.rotationZ = rotationZ;
    this.config.layerSpacing = layerSpacing;

    // Пересоздаём слои с новыми параметрами
    this.model.config.rotationX = rotationX;
    this.model.config.rotationY = rotationY;
    this.model.config.rotationZ = rotationZ;
    this.model.config.layerSpacing = layerSpacing;
    this.model.createLayers();

    // Перерисовываем
    this.renderer.render(this.model);
  }
}

