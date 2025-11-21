/**
 * Модель данных для иллюстрации layered-house
 * Парсинг SVG и создание 5 слоёв с 3D трансформациями
 */

import { rotatePoint, project3DTo2D } from '../core/geometry3d.js';

/**
 * Парсинг SVG и извлечение геометрии
 * @param {string} svgContent - содержимое SVG файла
 * @returns {Object} объект с fills и strokes
 */
function parseSVG(svgContent) {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  
  // Проверка на ошибки парсинга
  const parserError = svgDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`SVG parsing error: ${parserError.textContent}`);
  }

  const svgElement = svgDoc.documentElement;

  // Извлекаем viewBox
  const viewBox = svgElement.getAttribute('viewBox');
  const viewBoxValues = viewBox ? viewBox.split(/\s+/).map(Number) : [0, 0, 400, 315];
  const [minX, minY, width, height] = viewBoxValues;
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  const fills = [];
  const strokes = [];

  // Парсим полигоны (заливки)
  const polygons = svgElement.querySelectorAll('polygon.cls-2');
  polygons.forEach(polygon => {
    const pointsAttr = polygon.getAttribute('points');
    if (pointsAttr) {
      const points = [];
      const coords = pointsAttr.trim().split(/[\s,]+/);
      for (let i = 0; i < coords.length; i += 2) {
        if (i + 1 < coords.length) {
          const x = parseFloat(coords[i]) - centerX;
          const y = parseFloat(coords[i + 1]) - centerY;
          points.push({ x, y });
        }
      }
      if (points.length > 0) {
        fills.push({ points });
      }
    }
  });

  // Парсим линии (обводки)
  const lines = svgElement.querySelectorAll('line.cls-1');
  lines.forEach(line => {
    const x1 = parseFloat(line.getAttribute('x1')) - centerX;
    const y1 = parseFloat(line.getAttribute('y1')) - centerY;
    const x2 = parseFloat(line.getAttribute('x2')) - centerX;
    const y2 = parseFloat(line.getAttribute('y2')) - centerY;
    strokes.push({ x1, y1, x2, y2 });
  });

  return {
    fills,
    strokes,
    bounds: {
      width,
      height,
      centerX,
      centerY
    }
  };
}

/**
 * Вычисление центра геометрии (центра масс всех точек)
 * @param {Object} geometry - распарсенная геометрия
 * @returns {Object} центр {x, y}
 */
function getGeometryCenter(geometry) {
  const { fills, strokes } = geometry;
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  // Точки из полигонов
  fills.forEach(fill => {
    fill.points.forEach(point => {
      sumX += point.x;
      sumY += point.y;
      count++;
    });
  });

  // Точки из линий
  strokes.forEach(stroke => {
    sumX += stroke.x1;
    sumY += stroke.y1;
    count++;
    sumX += stroke.x2;
    sumY += stroke.y2;
    count++;
  });

  if (count === 0) {
    return { x: 0, y: 0 };
  }

  return {
    x: sumX / count,
    y: sumY / count
  };
}

/**
 * Easing функция ease-in-out
 * @param {number} t - прогресс от 0 до 1
 * @returns {number} eased прогресс от 0 до 1
 */
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * 2D поворот точки вокруг центра
 * @param {Object} point - точка {x, y}
 * @param {Object} center - центр поворота {x, y}
 * @param {number} angle - угол поворота в радианах
 * @returns {Object} повернутая точка {x, y}
 */
function rotate2DAroundCenter(point, center, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  // Смещаем относительно центра
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  // Применяем 2D поворот
  const rotatedX = dx * cos - dy * sin;
  const rotatedY = dx * sin + dy * cos;
  
  // Возвращаем обратно
  return {
    x: rotatedX + center.x,
    y: rotatedY + center.y
  };
}

/**
 * Вычисление автоматического масштаба для размещения в квадрате 1000x1000
 * @param {Object} geometry - распарсенная геометрия
 * @param {Object} config - конфигурация с углами поворота
 * @returns {number} масштаб
 */
function calculateAutoScale(geometry, config) {
  const { fills, strokes } = geometry;
  const { rotationX, rotationY, rotationZ, layerSpacing } = config;

  // Конвертируем углы в радианы
  const rotX = (rotationX * Math.PI) / 180;
  const rotY = (rotationY * Math.PI) / 180;
  const rotZ = (rotationZ * Math.PI) / 180;

  // Находим все точки для определения границ
  const allPoints = [];

  // Точки из полигонов
  fills.forEach(fill => {
    fill.points.forEach(point => {
      allPoints.push({ ...point, z: 0 });
    });
  });

  // Точки из линий
  strokes.forEach(stroke => {
    allPoints.push({ x: stroke.x1, y: stroke.y1, z: 0 });
    allPoints.push({ x: stroke.x2, y: stroke.y2, z: 0 });
  });

  // Проверка на пустую геометрию
  if (allPoints.length === 0) {
    return 1; // возвращаем масштаб по умолчанию
  }

  // Применяем поворот и проекцию для всех слоёв
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let layer = 0; layer < 5; layer++) {
    const z = layer * layerSpacing;
    allPoints.forEach(point => {
      const point3D = { x: point.x, y: point.y, z };
      const rotated = rotatePoint(point3D, { x: rotX, y: rotY, z: rotZ });
      const projected = project3DTo2D(rotated, { centerX: 450, centerY: 280 });

      minX = Math.min(minX, projected.x);
      maxX = Math.max(maxX, projected.x);
      minY = Math.min(minY, projected.y);
      maxY = Math.max(maxY, projected.y);
    });
  }

  // Проверка на валидные границы
  if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
    return 1; // возвращаем масштаб по умолчанию
  }

  // Вычисляем масштаб для размещения в квадрате 1000x1000 с отступами
  // Уменьшаем отступы и увеличиваем масштаб
  const paddingTop = 20; // маленький отступ сверху
  const paddingBottom = 50; // больший отступ снизу
  const paddingSides = 30; // отступы по бокам
  const availableWidth = 1000 - paddingSides * 2;
  const availableHeight = 1000 - paddingTop - paddingBottom;
  const width = maxX - minX;
  const height = maxY - minY;

  const scaleX = width > 0 ? availableWidth / width : 1;
  const scaleY = height > 0 ? availableHeight / height : 1;

  // Увеличиваем масштаб на 20%
  const scale = Math.min(scaleX, scaleY) * 1.2;
  
  // Убеждаемся, что масштаб положительный и разумный
  return Math.max(0.1, Math.min(scale, 10));
}

export class LayeredHouseModel {
  constructor(config) {
    this.config = config;
    this.geometry = null;
    this.layers = [];
    this.scale = config.scale || 1;
    this.geometryCenter = null; // центр геометрии (вычисляется один раз)
    
    // Состояние анимации для каждого слоя
    // Каждый слой имеет: { phase, startTime, currentAngle }
    // phase: 'forward' | 'pause1' | 'backward' | 'pause2'
    this.layerAnimations = [];
    this.animationStartTime = null;
  }

  /**
   * Загрузка и парсинг SVG
   * @param {string} svgContent - содержимое SVG файла
   */
  loadSVG(svgContent) {
    this.geometry = parseSVG(svgContent);

    // Вычисляем масштаб если не задан
    if (!this.config.scale) {
      this.scale = calculateAutoScale(this.geometry, this.config);
    } else {
      this.scale = this.config.scale;
    }

    // Применяем масштаб к геометрии
    this.geometry.fills.forEach(fill => {
      fill.points.forEach(point => {
        point.x *= this.scale;
        point.y *= this.scale;
      });
    });

    this.geometry.strokes.forEach(stroke => {
      stroke.x1 *= this.scale;
      stroke.y1 *= this.scale;
      stroke.x2 *= this.scale;
      stroke.y2 *= this.scale;
    });

    // Вычисляем центр геометрии один раз
    this.geometryCenter = getGeometryCenter(this.geometry);

    // Инициализируем анимацию для каждого слоя
    this.initializeAnimations();
    
    // Создаём 5 слоёв
    this.createLayers();
  }

  /**
   * Инициализация анимации для каждого слоя
   */
  initializeAnimations() {
    this.layerAnimations = [];
    const { animationDelay } = this.config;
    
    for (let i = 0; i < 5; i++) {
      this.layerAnimations.push({
        phase: 'forward', // forward | pause1 | backward | pause2
        startTime: i * animationDelay, // задержка для каждого слоя
        currentAngle: 0 // текущий угол поворота вокруг Y (градусы)
      });
    }
    
    this.animationStartTime = null; // будет установлено при первом обновлении
  }

  /**
   * Обновление анимации всех слоёв
   */
  updateAnimations() {
    if (!this.geometry) return;
    
    const now = Date.now();
    if (this.animationStartTime === null) {
      this.animationStartTime = now;
    }
    
    const {
      animationAngle,
      animationDurationForward,
      animationPauseAfterForward,
      animationDurationBackward,
      animationPauseAfterBackward
    } = this.config;
    
    const cycleDuration = animationDurationForward + animationPauseAfterForward +
                         animationDurationBackward + animationPauseAfterBackward;
    
    this.layerAnimations.forEach((anim, layerIndex) => {
      // Время относительно начала анимации этого слоя
      const elapsed = now - this.animationStartTime - anim.startTime;
      
      if (elapsed < 0) {
        // Ещё не началась анимация этого слоя
        anim.currentAngle = 0;
        anim.phase = 'forward';
        return;
      }
      
      // Определяем текущий цикл и время внутри цикла
      const cycleTime = elapsed % cycleDuration;
      
      // Чёткое разделение на 4 фазы
      if (cycleTime < animationDurationForward) {
        // Фаза 1: движение вперёд (0° → +10°) с easing
        anim.phase = 'forward';
        const progress = cycleTime / animationDurationForward;
        const easedProgress = easeInOut(progress);
        anim.currentAngle = animationAngle * easedProgress;
      } else if (cycleTime < animationDurationForward + animationPauseAfterForward) {
        // Фаза 2: пауза после движения вперёд (угол = +10°)
        anim.phase = 'pause1';
        anim.currentAngle = animationAngle;
      } else if (cycleTime < animationDurationForward + animationPauseAfterForward + animationDurationBackward) {
        // Фаза 3: движение назад (+10° → 0°) с easing
        anim.phase = 'backward';
        const progress = (cycleTime - animationDurationForward - animationPauseAfterForward) / animationDurationBackward;
        const easedProgress = easeInOut(progress);
        anim.currentAngle = animationAngle * (1 - easedProgress);
      } else {
        // Фаза 4: пауза после движения назад (угол = 0°)
        anim.phase = 'pause2';
        anim.currentAngle = 0;
      }
    });
    
    // Пересоздаём слои с новыми углами
    this.createLayers();
  }

  /**
   * Создание 5 слоёв с 3D трансформациями
   */
  createLayers() {
    const { rotationX, rotationY, rotationZ, layerSpacing } = this.config;
    const rotX = (rotationX * Math.PI) / 180;
    const rotY = (rotationY * Math.PI) / 180; // базовый угол Y без анимации
    const rotZ = (rotationZ * Math.PI) / 180;

    this.layers = [];

    for (let i = 0; i < 5; i++) {
      const z = i * layerSpacing;
      const layer = {
        z,
        fills: [],
        strokes: []
      };

      // Получаем текущий угол 2D поворота для этого слоя (в радианах)
      const animAngleDeg = this.layerAnimations[i]?.currentAngle || 0;
      const animAngleRad = (animAngleDeg * Math.PI) / 180;

      // Трансформируем полигоны
      this.geometry.fills.forEach(fill => {
        const transformedPoints = fill.points.map(point => {
          // Сначала применяем 2D поворот вокруг центра геометрии
          const rotated2D = rotate2DAroundCenter(point, this.geometryCenter, animAngleRad);
          
          // Затем применяем 3D трансформации
          const point3D = { x: rotated2D.x, y: rotated2D.y, z };
          const rotated = rotatePoint(point3D, { x: rotX, y: rotY, z: rotZ });
          const projected = project3DTo2D(rotated, { centerX: 450, centerY: 280 });
          return projected;
        });
        layer.fills.push({ points: transformedPoints, z });
      });

      // Трансформируем линии
      this.geometry.strokes.forEach(stroke => {
        // Применяем 2D поворот к конечным точкам линии
        const rotated2D_1 = rotate2DAroundCenter(
          { x: stroke.x1, y: stroke.y1 },
          this.geometryCenter,
          animAngleRad
        );
        const rotated2D_2 = rotate2DAroundCenter(
          { x: stroke.x2, y: stroke.y2 },
          this.geometryCenter,
          animAngleRad
        );

        // Затем применяем 3D трансформации
        const point1_3D = { x: rotated2D_1.x, y: rotated2D_1.y, z };
        const point2_3D = { x: rotated2D_2.x, y: rotated2D_2.y, z };

        const rotated1 = rotatePoint(point1_3D, { x: rotX, y: rotY, z: rotZ });
        const rotated2 = rotatePoint(point2_3D, { x: rotX, y: rotY, z: rotZ });

        const projected1 = project3DTo2D(rotated1, { centerX: 450, centerY: 280 });
        const projected2 = project3DTo2D(rotated2, { centerX: 450, centerY: 280 });

        layer.strokes.push({
          x1: projected1.x,
          y1: projected1.y,
          x2: projected2.x,
          y2: projected2.y,
          z: projected1.z
        });
      });

      this.layers.push(layer);
    }
  }

  /**
   * Получение слоёв для рендеринга (отсортированных по глубине)
   * @returns {Array} массив слоёв
   */
  getLayersForRender() {
    return [...this.layers].sort((a, b) => b.z - a.z);
  }
}

