/**
 * Автоматическая инициализация всех 3D иллюстраций на странице
 */

import { SphereIllustration } from './sphere/sphere.js';
import { LayeredHouseIllustration } from './layered-house/layered-house.js';

// Реестр типов иллюстраций
const illustrationTypes = {
  sphere: SphereIllustration,
  'layered-house': LayeredHouseIllustration
};

// Хранилище экземпляров иллюстраций
const instances = new Map();

/**
 * Инициализация всех иллюстраций на странице
 */
export function initIllustrations() {
  const containers = document.querySelectorAll('.illustration-container');
  
  containers.forEach((container, index) => {
    // Определяем тип иллюстрации
    const type = container.dataset.illustrationType || 'sphere';
    
    if (!illustrationTypes[type]) {
      console.warn(`Unknown illustration type: ${type}`);
      return;
    }
    
    try {
      const IllustrationClass = illustrationTypes[type];
      const instance = new IllustrationClass(container);
      
      // Сохраняем экземпляр
      const id = `illustration-${index}`;
      instances.set(id, instance);
      container.dataset.illustrationId = id;
      
      // Запускаем анимацию
      const startIllustration = () => {
        Promise.resolve(instance.start()).catch(error => {
          console.error(`Failed to start illustration in container:`, container, error);
        });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startIllustration);
      } else {
        startIllustration();
      }
    } catch (error) {
      console.error(`Failed to initialize illustration in container:`, container, error);
    }
  });
}

/**
 * Получение экземпляра иллюстрации по контейнеру
 * @param {Element} container - контейнер иллюстрации
 * @returns {Object|null} экземпляр иллюстрации или null
 */
export function getIllustrationInstance(container) {
  const id = container?.dataset?.illustrationId;
  if (id && instances.has(id)) {
    return instances.get(id);
  }
  return null;
}

/**
 * Остановка всех иллюстраций
 */
export function stopAllIllustrations() {
  instances.forEach(instance => {
    instance.stop();
  });
}

// Автоматическая инициализация при загрузке
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIllustrations);
} else {
  initIllustrations();
}

// Экспортируем для ручного управления
export { SphereIllustration, LayeredHouseIllustration };

