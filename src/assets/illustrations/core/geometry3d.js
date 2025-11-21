/**
 * Базовые функции для работы с 3D геометрией
 * Универсальные модули для всех типов 3D иллюстраций
 */

/**
 * Вращение точки вокруг оси X
 * @param {Object} point - точка с координатами {x, y, z}
 * @param {number} angle - угол вращения в радианах
 * @returns {Object} повернутая точка
 */
export function rotateX(point, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos
  };
}

/**
 * Вращение точки вокруг оси Y
 * @param {Object} point - точка с координатами {x, y, z}
 * @param {number} angle - угол вращения в радианах
 * @returns {Object} повернутая точка
 */
export function rotateY(point, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos
  };
}

/**
 * Вращение точки вокруг оси Z
 * @param {Object} point - точка с координатами {x, y, z}
 * @param {number} angle - угол вращения в радианах
 * @returns {Object} повернутая точка
 */
export function rotateZ(point, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z
  };
}

/**
 * Применение всех вращений к точке
 * @param {Object} point - точка с координатами {x, y, z}
 * @param {Object} rotation - объект с углами вращения {x, y, z} в радианах
 * @returns {Object} повернутая точка
 */
export function rotatePoint(point, rotation) {
  let rotated = { ...point };
  rotated = rotateX(rotated, rotation.x);
  rotated = rotateY(rotated, rotation.y);
  rotated = rotateZ(rotated, rotation.z);
  return rotated;
}

/**
 * Проекция 3D точки в 2D пространство (ортогональная проекция)
 * @param {Object} point3D - точка с координатами {x, y, z}
 * @param {Object} options - опции проекции
 * @param {number} options.centerX - центр проекции по X (по умолчанию 500)
 * @param {number} options.centerY - центр проекции по Y (по умолчанию 500)
 * @returns {Object} спроецированная точка {x, y, z} где z сохранен для эффекта глубины
 */
export function project3DTo2D(point3D, options = {}) {
  const centerX = options.centerX ?? 500;
  const centerY = options.centerY ?? 500;
  
  // Ортогональная проекция (вид сверху по оси Z)
  return {
    x: centerX + point3D.x,
    y: centerY + point3D.y,
    z: point3D.z // сохраняем Z для эффекта глубины
  };
}

/**
 * Изометрическая проекция 3D точки в 2D пространство
 * @param {Object} point3D - точка с координатами {x, y, z}
 * @param {Object} options - опции проекции
 * @param {number} options.centerX - центр проекции по X (по умолчанию 500)
 * @param {number} options.centerY - центр проекции по Y (по умолчанию 500)
 * @returns {Object} спроецированная точка {x, y, z} где z сохранен для эффекта глубины
 */
export function projectIsometric(point3D, options = {}) {
  const centerX = options.centerX ?? 500;
  const centerY = options.centerY ?? 500;
  
  // Изометрическая проекция
  // Используем стандартные углы: 30° для изометрии
  const cos30 = Math.cos(Math.PI / 6); // cos(30°) = √3/2 ≈ 0.866
  const sin30 = Math.sin(Math.PI / 6); // sin(30°) = 0.5
  
  // Изометрическая проекция: X' = (x - y) * cos(30°), Y' = (x + y) * sin(30°) + z
  const x = (point3D.x - point3D.y) * cos30;
  const y = (point3D.x + point3D.y) * sin30 + point3D.z;
  
  return {
    x: centerX + x,
    y: centerY + y,
    z: point3D.z // сохраняем Z для эффекта глубины
  };
}

