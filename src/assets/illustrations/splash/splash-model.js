/**
 * Модель данных для иллюстрации splash
 * Парсинг SVG и создание 10 объектов с разными z-координатами
 */

import { project3DTo2D, rotateY } from '../core/geometry3d.js';

/**
 * Парсинг SVG и извлечение геометрии
 * @param {string} svgContent - содержимое SVG файла
 * @returns {Array} массив объектов с геометрией
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
  const viewBoxValues = viewBox ? viewBox.split(/\s+/).map(Number) : [0, 0, 399.361, 300.39];
  const [minX, minY, width, height] = viewBoxValues;
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  const objects = [];

  // Парсим rect элементы
  const rects = svgElement.querySelectorAll('rect.cls-1');
  rects.forEach(rect => {
    const x = parseFloat(rect.getAttribute('x')) - centerX;
    const y = parseFloat(rect.getAttribute('y')) - centerY;
    const w = parseFloat(rect.getAttribute('width'));
    const h = parseFloat(rect.getAttribute('height'));
    
    // Преобразуем rect в полигон (4 точки)
    const points = [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h }
    ];
    
    objects.push({
      type: 'rect',
      points
    });
  });

  // Парсим polygon элементы
  const polygons = svgElement.querySelectorAll('polygon.cls-1');
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
        objects.push({
          type: 'polygon',
          points
        });
      }
    }
  });

  return {
    objects,
    bounds: {
      width,
      height,
      centerX,
      centerY
    }
  };
}

/**
 * Перспективная проекция 3D точки в 2D с учетом масштабирования по глубине
 * @param {Object} point3D - точка с координатами {x, y, z}
 * @param {Object} options - опции проекции
 * @param {number} options.centerX - центр проекции по X (по умолчанию 500)
 * @param {number} options.centerY - центр проекции по Y (по умолчанию 500)
 * @param {number} options.distance - расстояние от камеры до плоскости проекции (по умолчанию 1000)
 * @returns {Object} спроецированная точка {x, y, z, scale} где scale - коэффициент масштабирования
 */
function projectPerspective(point3D, options = {}) {
  const centerX = options.centerX ?? 500;
  const centerY = options.centerY ?? 500;
  const distance = options.distance ?? 1000;
  
  // Перспективная проекция: объекты дальше по z становятся меньше
  // scale = distance / (distance + z)
  const scale = distance / (distance + point3D.z);
  
  return {
    x: centerX + point3D.x * scale,
    y: centerY + point3D.y * scale,
    z: point3D.z,
    scale: scale
  };
}

/**
 * Вычисление автоматического масштаба для размещения в квадрате 1000x1000
 * @param {Array} objects - массив объектов с геометрией
 * @param {Array} zCoordinates - массив z-координат для объектов
 * @returns {number} масштаб
 */
function calculateAutoScale(objects, zCoordinates) {
  // Находим все точки для определения границ
  const allPoints = [];

  // Собираем все точки из всех объектов
  objects.forEach((obj, index) => {
    const z = zCoordinates[index] || 0;
    obj.points.forEach(point => {
      allPoints.push({ ...point, z });
    });
  });

  // Проверка на пустую геометрию
  if (allPoints.length === 0) {
    return 1;
  }

  // Проецируем точки с перспективой для расчета границ
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  // Используем стандартное расстояние для расчета масштаба
  const defaultPerspectiveDistance = 600;
  
  allPoints.forEach(point => {
    const point3D = { x: point.x, y: point.y, z: point.z };
    const projected = projectPerspective(point3D, { 
      centerX: 500, 
      centerY: 500,
      distance: defaultPerspectiveDistance
    });

    minX = Math.min(minX, projected.x);
    maxX = Math.max(maxX, projected.x);
    minY = Math.min(minY, projected.y);
    maxY = Math.max(maxY, projected.y);
  });

  // Проверка на валидные границы
  if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) {
    return 1;
  }

  // Вычисляем масштаб для размещения в квадрате 1000x1000 с отступами
  const paddingTop = 20;
  const paddingBottom = 50;
  const paddingSides = 30;
  const availableWidth = 1000 - paddingSides * 2;
  const availableHeight = 1000 - paddingTop - paddingBottom;
  const width = maxX - minX;
  const height = maxY - minY;

  const scaleX = width > 0 ? availableWidth / width : 1;
  const scaleY = height > 0 ? availableHeight / height : 1;

  // Уменьшаем масштаб (делаем картинку меньше)
  const scale = Math.min(scaleX, scaleY) * 0.7;
  
  return Math.max(0.1, Math.min(scale, 10));
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
 * Резкая временная функция для смены глубин: быстрое начало, медленный хвост
 * @param {number} t - прогресс от 0 до 1
 * @param {number} power - степень резкости (больше = резче)
 * @returns {number} eased прогресс от 0 до 1
 */
function sharpEaseOut(t, power = 4) {
  return 1 - Math.pow(1 - t, power);
}

/**
 * Рандомное перемешивание массива (алгоритм Фишера-Йетса)
 * @param {Array} array - массив для перемешивания
 * @returns {Array} новый перемешанный массив
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export class SplashModel {
  constructor(config) {
    this.config = config;
    this.geometry = null;
    this.objects = [];
    this.scale = config.scale || 1;
    this.rotationY = 0; // текущий угол вращения вокруг Y в радианах
    this.animationStartTime = null;
    
    // Состояние анимации смены глубин
    this.depthChangeState = {
      isChanging: false,
      startTime: null,
      startZ: [], // начальные z-координаты
      targetZ: [], // целевые z-координаты
      lastDepthChangeTime: null // время последней смены глубин
    };
  }

  /**
   * Загрузка и парсинг SVG
   * @param {string} svgContent - содержимое SVG файла
   */
  loadSVG(svgContent) {
    this.geometry = parseSVG(svgContent);

    // Вычисляем масштаб если не задан
    if (!this.config.scale) {
      this.scale = calculateAutoScale(this.geometry.objects, this.config.zCoordinates);
    } else {
      this.scale = this.config.scale;
    }

    // Применяем масштаб к геометрии и создаем объекты с z-координатами
    this.objects = this.geometry.objects.map((obj, index) => {
      const z = this.config.zCoordinates[index] || 0;
      
      // Применяем масштаб к точкам
      const scaledPoints = obj.points.map(point => ({
        x: point.x * this.scale,
        y: point.y * this.scale
      }));

      return {
        type: obj.type,
        originalPoints: scaledPoints,
        z,
        targetZ: z // целевая z-координата (для анимации смены глубин)
      };
    });
    
    // Инициализируем начальные z-координаты для анимации
    this.depthChangeState.startZ = this.objects.map(obj => obj.z);
    this.depthChangeState.targetZ = [...this.config.zCoordinates];
  }

  /**
   * Генерация новых z-координат путем рандомного перемешивания существующих
   */
  generateNewZCoordinates() {
    // Перемешиваем массив доступных z-координат
    const shuffled = shuffleArray([...this.config.zCoordinates]);
    return shuffled;
  }

  /**
   * Обновление анимации смены глубин
   */
  updateDepthChange(now) {
    const { depthChangeEasingPower = 4, depthChangeDuration = 3000 } = this.config;
    
    if (!this.depthChangeState.isChanging) {
      return;
    }

    const elapsed = now - this.depthChangeState.startTime;
    const progress = Math.min(elapsed / depthChangeDuration, 1);
    
    // Применяем резкую временную функцию
    const easedProgress = sharpEaseOut(progress, depthChangeEasingPower);

    // Интерполируем z-координаты от начальных к целевым
    this.objects.forEach((obj, index) => {
      const startZ = this.depthChangeState.startZ[index];
      const targetZ = this.depthChangeState.targetZ[index];
      obj.z = startZ + (targetZ - startZ) * easedProgress;
    });

    // Если анимация завершена, обновляем начальные координаты
    if (progress >= 1) {
      this.depthChangeState.isChanging = false;
      this.depthChangeState.startZ = this.objects.map(obj => obj.z);
    }
  }

  /**
   * Обновление анимации вращения вокруг Y оси
   * Вращение туда-обратно от -10° до +10°
   */
  updateAnimation() {
    const now = Date.now();
    if (this.animationStartTime === null) {
      this.animationStartTime = now;
    }

    const {
      animationAngle = 10, // угол поворота в градусах (в каждую сторону)
      animationDuration = 3000 // длительность полного цикла (мс)
    } = this.config;

    const elapsed = now - this.animationStartTime;
    const cycleTime = elapsed % (animationDuration * 2); // полный цикл туда-обратно

    let progress;
    
    if (cycleTime < animationDuration) {
      // Фаза 1: движение от -10° к +10°
      progress = cycleTime / animationDuration;
      const easedProgress = easeInOut(progress);
      // От -10° до +10°
      this.rotationY = ((-animationAngle + animationAngle * 2 * easedProgress) * Math.PI) / 180;
    } else {
      // Фаза 2: движение от +10° к -10°
      progress = (cycleTime - animationDuration) / animationDuration;
      const easedProgress = easeInOut(progress);
      // От +10° к -10°
      this.rotationY = ((animationAngle - animationAngle * 2 * easedProgress) * Math.PI) / 180;
    }

    // Вычисляем текущий угол в градусах (для отладки)
    const angleDeg = (this.rotationY * 180) / Math.PI;
    
    // Интервал смены глубин в миллисекундах (по умолчанию 3 секунды)
    const depthChangeInterval = (this.config.depthChangeInterval || 3000);
    
    // Проверяем, нужно ли запустить смену глубин по таймеру
    if (this.depthChangeState.lastDepthChangeTime === null) {
      // Первая инициализация - устанавливаем время последней смены
      this.depthChangeState.lastDepthChangeTime = now;
    } else {
      // Проверяем, прошло ли достаточно времени с последней смены
      const timeSinceLastChange = now - this.depthChangeState.lastDepthChangeTime;
      
      if (timeSinceLastChange >= depthChangeInterval && !this.depthChangeState.isChanging) {
        // Запускаем смену глубин
        this.depthChangeState.isChanging = true;
        this.depthChangeState.startTime = now;
        this.depthChangeState.startZ = this.objects.map(obj => obj.z);
        this.depthChangeState.targetZ = this.generateNewZCoordinates();
        this.depthChangeState.lastDepthChangeTime = now;
      }
    }

    // Обновляем анимацию смены глубин
    this.updateDepthChange(now);
  }

  /**
   * Обновление модели (вызывается каждый кадр)
   */
  update() {
    this.updateAnimation();
  }

  /**
   * Получение объектов для рендеринга (с трансформированными точками)
   * @returns {Array} массив объектов с трансформированными точками
   */
  getObjectsForRender() {
    const perspectiveDistance = this.config.perspectiveDistance || 600;
    
    return this.objects.map(obj => {
      // Применяем вращение вокруг Y оси и перспективную проекцию
      const transformedPoints = obj.originalPoints.map(point => {
        const point3D = { x: point.x, y: point.y, z: obj.z };
        // Вращаем вокруг Y оси
        const rotated = rotateY(point3D, this.rotationY);
        // Применяем перспективную проекцию с настраиваемым расстоянием
        const projected = projectPerspective(rotated, { 
          centerX: 500, 
          centerY: 500,
          distance: perspectiveDistance
        });
        return projected;
      });

      return {
        type: obj.type,
        points: transformedPoints,
        z: obj.z
      };
    });
  }
}
