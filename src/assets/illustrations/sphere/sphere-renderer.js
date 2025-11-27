/**
 * Рендерер для иллюстрации сферы
 * Расширяет BaseRenderer специфичной логикой отрисовки линий и точек
 */

import { BaseRenderer } from '../core/renderer.js';
import { project3DTo2D } from '../core/geometry3d.js';

export class SphereRenderer extends BaseRenderer {
  constructor(canvas, container, config) {
    super(canvas, container);
    this.config = config;
  }

  /**
   * Рендеринг иллюстрации сферы
   * @param {SphereModel} model - модель сферы
   */
  render(model) {
    // Настраиваем canvas
    this.setupCanvas();
    
    // Обновляем opacity линий
    model.updateLineOpacities();
    
    // Получаем точки для рендеринга
    const pointsToRender = model.getPointsForRender();
    
    // Сортируем по глубине
    const sortedPoints = this.sortByDepth(pointsToRender);
    
    // Получаем цвета
    const textColor = this.getTextColor();
    const accentColor = this.getColorFromCSS(
      this.config.accentColor,
      1
    ) || 'rgba(255, 105, 105, 1)';
    
    // Очищаем canvas
    this.clear();
    
    // Рисуем линии
    this.renderLines(sortedPoints, textColor, model);
    
    // Рисуем точки
    this.renderPoints(sortedPoints, accentColor, model);
  }

  /**
   * Отрисовка линий
   * @param {Array} points - отсортированные точки для рендеринга
   * @param {string} color - цвет линий
   * @param {SphereModel} model - модель сферы
   */
  renderLines(points, color, model) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = this.config.lineWidth * Math.min(this.scaleX, this.scaleY);
    
    points.forEach(({ point, lineMeta }) => {
      const projected = project3DTo2D(point);
      
      const lengthProgress = lineMeta.lengthProgress || 1.0;
      
      // Вычисляем перспективу на основе глубины (Z координаты)
      const depthFactor = (point.z + model.config.radius) / (2 * model.config.radius);
      const depthOpacity = 0.4 + depthFactor * 0.6;
      
      // Масштабируем координаты проекции
      const scaledX = this.scaleCoordinateX(projected.x);
      const scaledY = this.scaleCoordinateY(projected.y);
      
      const startX = this.centerX + (scaledX - this.centerX) * 0.5;
      const startY = this.centerY + (scaledY - this.centerY) * 0.5;
      
      const endX = this.centerX + (scaledX - this.centerX) * lengthProgress;
      const endY = this.centerY + (scaledY - this.centerY) * lengthProgress;
      
      // Применяем перспективу к opacity линии
      this.ctx.globalAlpha = lineMeta.opacity * depthOpacity;
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    });
    
    // Сбрасываем globalAlpha
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Отрисовка точек
   * @param {Array} points - отсортированные точки для рендеринга
   * @param {string} color - цвет точек
   * @param {SphereModel} model - модель сферы
   */
  renderPoints(points, color, model) {
    this.ctx.fillStyle = color;
    
    points.forEach(({ point, lineMeta }) => {
      const projected = project3DTo2D(point);
      
      const lengthProgress = lineMeta.lengthProgress || 1.0;
      
      // Вычисляем перспективу на основе глубины
      const depthFactor = (point.z + model.config.radius) / (2 * model.config.radius);
      const depthOpacity = 0.4 + depthFactor * 0.6;
      
      const scaledX = this.scaleCoordinateX(projected.x);
      const scaledY = this.scaleCoordinateY(projected.y);
      
      const circleX = this.centerX + (scaledX - this.centerX) * lengthProgress;
      const circleY = this.centerY + (scaledY - this.centerY) * lengthProgress;
      
      const baseRadius = this.config.pointRadius * Math.min(this.scaleX, this.scaleY);
      const radius = baseRadius + (depthFactor - 0.5) * 2 * Math.min(this.scaleX, this.scaleY);
      
      // Opacity круга зависит от opacity линии, lengthProgress и перспективы
      const circleOpacity = lineMeta.opacity * Math.max(0, (lengthProgress - 0.5) * 2) * depthOpacity;
      
      this.ctx.globalAlpha = circleOpacity;
      this.ctx.beginPath();
      this.ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    
    // Сбрасываем globalAlpha
    this.ctx.globalAlpha = 1.0;
  }
}

