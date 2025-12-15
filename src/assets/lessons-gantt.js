(function() {
  'use strict';

  const ganttContainer = document.querySelector('.lessons-gantt');
  if (!ganttContainer) return;

  const hoverIndicator = ganttContainer.querySelector('.gantt-hover-indicator');
  const hoverTime = hoverIndicator ? hoverIndicator.querySelector('.gantt-hover-time') : null;
  const barsContainer = ganttContainer.querySelector('.gantt-bars');

  if (!hoverIndicator || !hoverTime || !barsContainer) return;

  // Получаем общую длительность из CSS переменной
  const totalDuration = parseInt(getComputedStyle(ganttContainer).getPropertyValue('--total-duration').trim()) || 295;

  // Переменные для плавного следования индикатора
  let targetIndicatorX = 0;
  let currentIndicatorX = 0;
  let targetTime = '0:00';
  let animationFrameId = null;
  let isAnimating = false;

  /**
   * Форматирует минуты в формат ЧЧ:ММ
   * @param {number} minutes - количество минут
   * @returns {string} - строка в формате ЧЧ:ММ
   */
  function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Анимация плавного следования индикатора
   */
  function animateIndicator() {
    // Интерполяция с коэффициентом для эффекта "резиночки" (уменьшено еще в 3 раза)
    const factor = 0.2;
    const diff = targetIndicatorX - currentIndicatorX;
    currentIndicatorX += diff * factor;
    
    // Обновляем позицию индикатора (цифра движется вместе с ним, так как она внутри)
    hoverIndicator.style.left = `${currentIndicatorX}px`;
    hoverTime.textContent = targetTime;
    
    // Продолжаем анимацию, если есть разница
    if (Math.abs(diff) > 0.01) {
      animationFrameId = requestAnimationFrame(animateIndicator);
    } else {
      // Если достигли цели, останавливаем анимацию
      isAnimating = false;
      animationFrameId = null;
    }
  }

  /**
   * Обработчик движения мыши
   */
  function handleMouseMove(e) {
    const barsRect = barsContainer.getBoundingClientRect();
    const containerRect = ganttContainer.getBoundingClientRect();
    
    // Рассчитываем позицию курсора относительно barsContainer для расчета времени
    const x = e.clientX - barsRect.left;
    const percent = Math.max(0, Math.min(100, (x / barsRect.width) * 100));
    
    // Рассчитываем время в минутах
    const timeInMinutes = (percent / 100) * totalDuration;
    
    // Рассчитываем абсолютную позицию в пикселях относительно ganttContainer
    const absoluteX = e.clientX - containerRect.left;
    
    // Обновляем целевую позицию индикатора и время
    targetIndicatorX = absoluteX;
    targetTime = formatTime(Math.round(timeInMinutes));
    
    // Запускаем анимацию, если она еще не запущена
    if (!isAnimating) {
      isAnimating = true;
      animationFrameId = requestAnimationFrame(animateIndicator);
    }
  }

  /**
   * Обработчик выхода мыши
   */
  function handleMouseLeave() {
    hoverIndicator.style.opacity = '0';
    hoverTime.style.opacity = '0';
    
    // Останавливаем анимацию
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    isAnimating = false;
  }

  /**
   * Обработчик входа мыши
   */
  function handleMouseEnter() {
    hoverIndicator.style.opacity = '1';
    hoverTime.style.opacity = '1';
  }

  // Добавляем обработчики событий на весь контейнер, чтобы ховер работал и над шкалой
  ganttContainer.addEventListener('mousemove', handleMouseMove);
  ganttContainer.addEventListener('mouseenter', handleMouseEnter);
  ganttContainer.addEventListener('mouseleave', handleMouseLeave);
})();

