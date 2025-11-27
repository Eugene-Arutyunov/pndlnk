/**
 * Модель сферы для 3D иллюстрации
 * Генерация точек на сфере и управление жизненным циклом линий
 */

import { rotatePoint } from '../core/geometry3d.js';

export const lineStates = {
  APPEARING: 'appearing',
  ACTIVE: 'active',
  DISAPPEARING: 'disappearing'
};

export class SphereModel {
  constructor(config) {
    this.config = config;
    this.points = [];
    this.originalPoints = [];
    this.rotation = { x: 0, y: 0, z: 0 };
    this.nextId = config.numPoints;
    this.activeLines = [];
    this.addLineTimeout = null;
    this.removeLineTimeout = null;
  }

  /**
   * Генерация точек на сфере (равномерное распределение)
   * @param {number} numPoints - количество точек
   * @param {number} radius - радиус сферы
   * @returns {Array} массив точек с координатами {x, y, z, id}
   */
  generateSpherePoints(numPoints, radius) {
    const points = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // золотой угол для равномерного распределения
    
    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2; // от -1 до 1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      
      points.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        id: i
      });
    }
    
    return points;
  }

  /**
   * Генерация случайной точки на сфере
   * @param {number} radius - радиус сферы
   * @returns {Object} точка с координатами {x, y, z}
   */
  generateRandomSpherePoint(radius) {
    // Генерируем случайную точку на единичной сфере
    const theta = Math.random() * 2 * Math.PI; // азимутальный угол
    const phi = Math.acos(2 * Math.random() - 1); // полярный угол (равномерное распределение)
    
    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.cos(phi);
    const z = Math.sin(phi) * Math.sin(theta);
    
    return {
      x: x * radius,
      y: y * radius,
      z: z * radius
    };
  }

  /**
   * Инициализация модели
   */
  initialize() {
    const initialPoints = this.generateSpherePoints(
      this.config.numPoints,
      this.config.radius
    );
    this.originalPoints = initialPoints.map(p => ({ ...p }));
    
    // Инициализируем метаданные для начальных линий
    initialPoints.forEach((point) => {
      this.activeLines.push({
        id: point.id,
        state: lineStates.ACTIVE,
        opacity: 1,
        lengthProgress: 1.0,
        createdAt: Date.now(),
        fadeStartTime: null
      });
    });
    
    // Обновляем точки после инициализации метаданных
    this.updateRotation();
  }

  /**
   * Обновление точек после вращения
   */
  updateRotation() {
    // Создаем новый массив точек на основе originalPoints и активных линий
    const activeLineIds = new Set(this.activeLines.map(l => l.id));
    this.points = this.originalPoints
      .filter(point => activeLineIds.has(point.id))
      .map(point => {
        const rotated = rotatePoint(point, this.rotation);
        return { ...rotated, id: point.id };
      });
  }

  /**
   * Обновление углов вращения
   * @param {Object} rotationSpeed - скорости вращения {x, y, z}
   */
  updateRotationAngles(rotationSpeed) {
    this.rotation.x += rotationSpeed.x;
    this.rotation.y += rotationSpeed.y;
    this.rotation.z += rotationSpeed.z;
    this.updateRotation();
  }

  /**
   * Обновление opacity и длины линий в процессе анимации
   */
  updateLineOpacities() {
    const now = Date.now();
    const linesToRemove = [];
    
    this.activeLines.forEach(lineMeta => {
      if (lineMeta.state === lineStates.APPEARING) {
        if (lineMeta.fadeStartTime === null) {
          lineMeta.fadeStartTime = now;
        }
        const elapsed = now - lineMeta.fadeStartTime;
        const progress = Math.min(elapsed / this.config.lineConfig.fadeDuration, 1);
        lineMeta.opacity = progress;
        // Длина линии растет от середины (0.5) до полной длины (1.0)
        lineMeta.lengthProgress = 0.5 + (progress * 0.5);
        
        if (progress >= 1) {
          lineMeta.state = lineStates.ACTIVE;
          lineMeta.fadeStartTime = null;
          lineMeta.lengthProgress = 1.0;
        }
      } else if (lineMeta.state === lineStates.DISAPPEARING) {
        if (lineMeta.fadeStartTime === null) {
          lineMeta.fadeStartTime = now;
        }
        const elapsed = now - lineMeta.fadeStartTime;
        const progress = Math.min(elapsed / this.config.lineConfig.fadeDuration, 1);
        lineMeta.opacity = 1 - progress;
        // Длина линии уменьшается от полной длины (1.0) до середины (0.5)
        lineMeta.lengthProgress = 1.0 - (progress * 0.5);
        
        if (progress >= 1) {
          linesToRemove.push(lineMeta.id);
        }
      } else {
        // Для активных линий длина всегда полная
        lineMeta.lengthProgress = 1.0;
      }
    });
    
    // Удаляем линии после завершения итерации
    linesToRemove.forEach(id => this.removeLineById(id));
  }

  /**
   * Добавление новой линии
   */
  addNewLine() {
    // Проверяем максимальное количество линий
    const activeCount = this.activeLines.filter(l => 
      l.state !== lineStates.DISAPPEARING
    ).length;
    
    if (activeCount >= this.config.lineConfig.maxLines) {
      this.scheduleAddLine();
      return;
    }
    
    // Генерируем случайную точку на сфере
    const newPoint = this.generateRandomSpherePoint(this.config.radius);
    const newId = this.nextId++;
    
    // Добавляем точку в originalPoints
    const pointWithId = { ...newPoint, id: newId };
    this.originalPoints.push({ ...pointWithId });
    
    // Добавляем метаданные линии
    this.activeLines.push({
      id: newId,
      state: lineStates.APPEARING,
      opacity: 0,
      lengthProgress: 0.5,
      createdAt: Date.now(),
      fadeStartTime: null
    });
    
    this.scheduleAddLine();
  }

  /**
   * Удаление линии по ID
   */
  removeLineById(id) {
    // Удаляем из массива метаданных
    const metaIndex = this.activeLines.findIndex(l => l.id === id);
    if (metaIndex !== -1) {
      this.activeLines.splice(metaIndex, 1);
    }
    
    // Удаляем из originalPoints
    const pointIndex = this.originalPoints.findIndex(p => p.id === id);
    if (pointIndex !== -1) {
      this.originalPoints.splice(pointIndex, 1);
    }
  }

  /**
   * Удаление случайной активной линии
   */
  removeRandomLine() {
    // Проверяем минимальное количество линий
    const activeCount = this.activeLines.filter(l => 
      l.state === lineStates.ACTIVE || l.state === lineStates.APPEARING
    ).length;
    
    if (activeCount <= this.config.lineConfig.minLines) {
      this.scheduleRemoveLine();
      return;
    }
    
    // Выбираем случайную активную линию
    const candidates = this.activeLines.filter(l => 
      l.state === lineStates.ACTIVE && 
      Date.now() - l.createdAt > this.config.lineConfig.fadeDuration * 2
    );
    
    if (candidates.length === 0) {
      this.scheduleRemoveLine();
      return;
    }
    
    const randomLine = candidates[Math.floor(Math.random() * candidates.length)];
    randomLine.state = lineStates.DISAPPEARING;
    randomLine.fadeStartTime = null;
    
    this.scheduleRemoveLine();
  }

  /**
   * Планирование добавления новой линии
   */
  scheduleAddLine() {
    if (this.addLineTimeout) {
      clearTimeout(this.addLineTimeout);
    }
    
    const interval = this.config.lineConfig.addIntervalMin + 
      Math.random() * (this.config.lineConfig.addIntervalMax - this.config.lineConfig.addIntervalMin);
    
    this.addLineTimeout = setTimeout(() => {
      this.addNewLine();
    }, interval);
  }

  /**
   * Планирование удаления линии
   */
  scheduleRemoveLine() {
    if (this.removeLineTimeout) {
      clearTimeout(this.removeLineTimeout);
    }
    
    const interval = this.config.lineConfig.removeIntervalMin + 
      Math.random() * (this.config.lineConfig.removeIntervalMax - this.config.lineConfig.removeIntervalMin);
    
    this.removeLineTimeout = setTimeout(() => {
      this.removeRandomLine();
    }, interval);
  }

  /**
   * Запуск системы управления линиями
   */
  startLineManagement() {
    this.scheduleAddLine();
    this.scheduleRemoveLine();
  }

  /**
   * Остановка системы управления линиями
   */
  stopLineManagement() {
    if (this.addLineTimeout) {
      clearTimeout(this.addLineTimeout);
      this.addLineTimeout = null;
    }
    if (this.removeLineTimeout) {
      clearTimeout(this.removeLineTimeout);
      this.removeLineTimeout = null;
    }
  }

  /**
   * Получение точек для рендеринга с метаданными
   * @returns {Array} массив объектов {point, lineMeta, z}
   */
  getPointsForRender() {
    const lineMetaMap = new Map();
    this.activeLines.forEach(meta => {
      lineMetaMap.set(meta.id, meta);
    });
    
    const pointsToRender = [];
    
    this.originalPoints.forEach(originalPoint => {
      const lineMeta = lineMetaMap.get(originalPoint.id);
      if (!lineMeta) return;
      
      const rotatedPoint = rotatePoint(originalPoint, this.rotation);
      
      pointsToRender.push({
        point: rotatedPoint,
        lineMeta,
        id: originalPoint.id,
        z: rotatedPoint.z
      });
    });
    
    return pointsToRender;
  }
}

