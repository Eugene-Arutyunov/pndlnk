/**
 * Рендерер для иллюстрации splash
 * Расширяет BaseRenderer специфичной логикой отрисовки объектов
 */

import { BaseRenderer } from '../core/renderer.js';

export class SplashRenderer extends BaseRenderer {
  constructor(canvas, container, config) {
    super(canvas, container);
    this.config = config;
    this.isDualCanvas = false;
  }

  /**
   * Настройка двух canvas для режима с разделением по z-координате
   */
  setupDualCanvas() {
    if (!this.backCanvas || !this.frontCanvas || !this.backContainer || !this.frontContainer) {
      return;
    }

    // Настраиваем оба canvas
    const backRect = this.backContainer.getBoundingClientRect();
    const frontRect = this.frontContainer.getBoundingClientRect();
    const backSize = Math.max(Math.min(backRect.width, backRect.height), 100); // минимум 100px
    const frontSize = Math.max(Math.min(frontRect.width, frontRect.height), 100);
    
    if (backSize === 0 || frontSize === 0) {
      // Возвращаемся без инициализации, попробуем в следующем кадре
      return;
    }
    
    this.dpr = window.devicePixelRatio || 1;
    
    // Настраиваем back canvas
    this.backCanvas.width = backSize * this.dpr;
    this.backCanvas.height = backSize * this.dpr;
    this.backCanvas.style.width = backSize + 'px';
    this.backCanvas.style.height = backSize + 'px';
    this.backCtx = this.backCanvas.getContext('2d');
    this.backCtx.scale(this.dpr, this.dpr);
    
    // Настраиваем front canvas
    this.frontCanvas.width = frontSize * this.dpr;
    this.frontCanvas.height = frontSize * this.dpr;
    this.frontCanvas.style.width = frontSize + 'px';
    this.frontCanvas.style.height = frontSize + 'px';
    this.frontCtx = this.frontCanvas.getContext('2d');
    this.frontCtx.scale(this.dpr, this.dpr);
    
    // Масштабируем координаты под новый размер (было 1000x1000, теперь size x size)
    this.scaleX = backSize / 1000;
    this.scaleY = backSize / 1000;
    this.centerX = backSize / 2;
    this.centerY = backSize / 2;
    
    // Сохраняем размеры для использования в render
    this.backCanvasSize = backSize;
    this.frontCanvasSize = frontSize;
    
    this.isDualCanvas = true;
  }

  /**
   * Рендеринг иллюстрации splash
   * @param {SplashModel} model - модель данных
   */
  render(model) {
    // Проверяем режим работы - если есть backCanvas и frontCanvas, значит dual canvas режим
    const isDualMode = this.backCanvas && this.frontCanvas && this.backContainer && this.frontContainer;
    
    if (isDualMode) {
      // Убеждаемся, что контексты инициализированы
      if (!this.backCtx || !this.frontCtx || !this.isDualCanvas) {
        this.setupDualCanvas();
      }
      
      if (this.backCtx && this.frontCtx) {
        this.renderDualCanvas(model);
      }
    } else {
      // Обычный режим с одним canvas
      if (!this.ctx) {
        this.setupCanvas();
      }
      this.renderSingleCanvas(model);
    }
  }

  /**
   * Рендеринг в два canvas в зависимости от z-координаты
   */
  renderDualCanvas(model) {
    // Получаем объекты для рендеринга
    const objects = model.getObjectsForRender();

    // Разделяем объекты по z-координате
    // Объекты с z < 0 идут в front canvas (над заголовком)
    // Объекты с z >= 0 идут в back canvas (под заголовком)
    const backObjects = objects.filter(obj => obj.z >= 0);
    const frontObjects = objects.filter(obj => obj.z < 0);

    // Сортируем объекты по z-координате (от дальних к ближним)
    const sortedBackObjects = [...backObjects].sort((a, b) => b.z - a.z);
    const sortedFrontObjects = [...frontObjects].sort((a, b) => b.z - a.z);

    // Получаем цвета
    const accentColor = this.getColorFromCSS(
      this.config.accentColor,
      1
    ) || 'rgba(255, 105, 105, 1)';

    const backgroundColor = this.getColorFromCSS(
      this.config.backgroundColor,
      0.7 // прозрачность для заливки
    );

    if (!backgroundColor) {
      return;
    }

    // Очищаем оба canvas (используем сохраненные размеры или вычисляем заново)
    const backSize = this.backCanvasSize || Math.min(this.backContainer.getBoundingClientRect().width, this.backContainer.getBoundingClientRect().height);
    const frontSize = this.frontCanvasSize || Math.min(this.frontContainer.getBoundingClientRect().width, this.frontContainer.getBoundingClientRect().height);
    this.backCtx.clearRect(0, 0, backSize, backSize);
    this.frontCtx.clearRect(0, 0, frontSize, frontSize);

    // Рисуем объекты с z >= 0 в back canvas (под заголовком)
    sortedBackObjects.forEach(obj => {
      this.renderObjectToContext(obj, backgroundColor, accentColor, this.backCtx);
    });

    // Рисуем объекты с z < 0 в front canvas (над заголовком)
    sortedFrontObjects.forEach(obj => {
      this.renderObjectToContext(obj, backgroundColor, accentColor, this.frontCtx);
    });
  }

  /**
   * Рендеринг в один canvas (обычный режим)
   */
  renderSingleCanvas(model) {
    // Получаем объекты для рендеринга
    const objects = model.getObjectsForRender();

    // Сортируем объекты по z-координате (от дальних к ближним)
    const sortedObjects = [...objects].sort((a, b) => b.z - a.z);

    // Получаем цвета
    const accentColor = this.getColorFromCSS(
      this.config.accentColor,
      1
    ) || 'rgba(255, 105, 105, 1)';

    const backgroundColor = this.getColorFromCSS(
      this.config.backgroundColor,
      0.7 // прозрачность для заливки
    );

    if (!backgroundColor) {
      return;
    }

    // Очищаем canvas (прозрачный фон)
    this.clear();

    // Рисуем объекты от дальних к ближним
    sortedObjects.forEach(obj => {
      this.renderObject(obj, backgroundColor, accentColor);
    });
  }

  /**
   * Отрисовка одного объекта (полигона) в текущий контекст
   * @param {Object} obj - объект с точками для отрисовки
   * @param {string} fillColor - цвет заливки
   * @param {string} strokeColor - цвет обводки
   */
  renderObject(obj, fillColor, strokeColor) {
    this.renderObjectToContext(obj, fillColor, strokeColor, this.ctx);
  }

  /**
   * Отрисовка одного объекта в указанный контекст
   * @param {Object} obj - объект с точками для отрисовки
   * @param {string} fillColor - цвет заливки
   * @param {string} strokeColor - цвет обводки
   * @param {CanvasRenderingContext2D} ctx - контекст для отрисовки
   */
  renderObjectToContext(obj, fillColor, strokeColor, ctx) {
    if (obj.points.length < 2 || !ctx) return;

    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = this.config.lineWidth * Math.min(this.scaleX, this.scaleY);

    const offsetX = (this.config.offsetX || 0) * this.scaleX;
    const offsetY = (this.config.offsetY || 0) * this.scaleY;

    ctx.beginPath();
    const firstPoint = obj.points[0];
    const scaledX = this.scaleCoordinateX(firstPoint.x) + offsetX;
    const scaledY = this.scaleCoordinateY(firstPoint.y) + offsetY;
    ctx.moveTo(scaledX, scaledY);

    for (let i = 1; i < obj.points.length; i++) {
      const point = obj.points[i];
      const scaledX = this.scaleCoordinateX(point.x) + offsetX;
      const scaledY = this.scaleCoordinateY(point.y) + offsetY;
      ctx.lineTo(scaledX, scaledY);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
