# Документация: 3D иллюстрации

Система модульных 3D иллюстраций для проекта. Все иллюстрации рендерятся через Canvas и используют общие базовые модули для работы с 3D геометрией, анимацией и рендерингом.

## Архитектура

Система состоит из двух уровней:

### 1. Базовые модули (`src/assets/illustrations/core/`)

Универсальные модули, используемые всеми типами иллюстраций:

#### `geometry3d.js`

Функции для работы с 3D геометрией:

- `rotateX(point, angle)` — вращение точки вокруг оси X
- `rotateY(point, angle)` — вращение точки вокруг оси Y
- `rotateZ(point, angle)` — вращение точки вокруг оси Z
- `rotatePoint(point, rotation)` — применение всех вращений к точке
- `project3DTo2D(point3D, options)` — проекция 3D точки в 2D пространство

#### `renderer.js`

Базовый класс `BaseRenderer` для работы с Canvas:

- Настройка Canvas с учетом `devicePixelRatio`
- Масштабирование под размер контейнера
- Извлечение цветов из CSS-переменных
- Сортировка точек по глубине (Z-order)
- Методы `scaleCoordinateX()` и `scaleCoordinateY()` для масштабирования координат

#### `animation.js`

Класс `AnimationLoop` для управления анимационным циклом:

- Управление `requestAnimationFrame`
- Обработка событий изменения размера окна
- Методы `start()` и `stop()` для управления анимацией

### 2. Конкретные иллюстрации (`src/assets/illustrations/[name]/`)

Каждая иллюстрация — отдельная папка со своей логикой. Структура:

```
sphere/
├── sphere-model.js      # Модель данных и логика генерации
├── sphere-renderer.js   # Специфичный рендерер (расширяет BaseRenderer)
├── sphere-config.js     # Парсинг конфигурации из data-атрибутов
└── sphere.js            # Главный класс иллюстрации
```

## Иллюстрация: Сфера (`sphere`)

Первая реализованная иллюстрация — генеративная сфера с динамически появляющимися и исчезающими линиями.

### Компоненты

#### `sphere-model.js`

Класс `SphereModel`:

- Генерация точек на сфере (равномерное распределение через золотой угол)
- Генерация случайных точек для динамического добавления
- Управление жизненным циклом линий (APPEARING → ACTIVE → DISAPPEARING)
- Обновление opacity и lengthProgress для анимации появления/исчезновения
- Автоматическое добавление/удаление линий в заданных пределах

#### `sphere-renderer.js`

Класс `SphereRenderer` extends `BaseRenderer`:

- Отрисовка линий с учетом состояния и перспективы
- Отрисовка точек (кругов) с динамическим радиусом и opacity
- Эффект глубины на основе Z-координаты

#### `sphere-config.js`

Функция `parseSphereConfig(container)` — парсинг data-атрибутов:

- `data-radius` — радиус сферы (по умолчанию: 400)
- `data-num-points` — начальное количество точек (по умолчанию: 45)
- `data-rotation-speed-x/y/z` — скорость вращения по осям (по умолчанию: 0.002, 0.003, 0.001)
- `data-line-width` — толщина линии (по умолчанию: 2)
- `data-point-radius` — радиус точек (по умолчанию: 4)
- `data-fade-duration` — длительность fade-in/out в мс (по умолчанию: 250)
- `data-min-lines` / `data-max-lines` — границы количества линий (по умолчанию: 30, 60)
- `data-accent-color` — CSS-переменная для цвета акцента (по умолчанию: `--ids__accent-RGB`)

#### `sphere.js`

Класс `SphereIllustration`:

- Связывает модель, рендерер и анимацию
- Методы `start()` и `stop()` для управления
- Методы `getModel()` и `getRenderer()` для внешнего доступа

### Использование

```html
<div class="illustration-container dark-theme" data-illustration-type="sphere">
  <canvas class="illustration-canvas"></canvas>
</div>

<script type="module" src="/assets/illustrations/init.js"></script>
```

С кастомизацией через data-атрибуты:

```html
<div
  class="illustration-container"
  data-illustration-type="sphere"
  data-line-width="3"
  data-rotation-speed-x="0.001"
  data-accent-color="--ids__accent-RGB">
  <canvas class="illustration-canvas"></canvas>
</div>
```

## Иллюстрация: Splash (`splash`)

Третья реализованная иллюстрация — векторное изображение домика из 10 объектов, каждый с разной z-координатой, с циклическим вращением по осям X и Y.

### Компоненты

#### `splash-model.js`

Класс `SplashModel`:

- Парсинг SVG файла (`Artboard 38.svg`) с извлечением всех элементов (rect и polygon)
- Создание массива из 10 объектов, каждый с уникальной z-координатой
- Равномерное распределение z-координат с шагом 50 (от -225 до +225)
- Вращение только по осям X и Y (без Z)
- Применение 3D трансформаций и проекции к точкам объектов

#### `splash-renderer.js`

Класс `SplashRenderer` extends `BaseRenderer`:

- Отрисовка объектов с полупрозрачной заливкой и красной обводкой
- Сортировка объектов по z-координате для правильного порядка отрисовки
- Без эффектов глубины (одинаковый opacity и размер для всех объектов)

#### `splash-config.js`

Функция `parseSplashConfig(container)` — парсинг data-атрибутов:

- `data-rotation-speed-x` / `data-rotation-speed-y` — скорости вращения по осям (по умолчанию: 0.002, 0.003)
- `data-z-spacing` — шаг между объектами по z-оси (по умолчанию: 50)
- `data-accent-color` — CSS-переменная для цвета акцента (по умолчанию: `--ids__accent-RGB`)
- `data-background-color` — CSS-переменная для цвета фона (обязательный)
- `data-line-width` — толщина обводки (по умолчанию: 4)
- `data-offset-x` / `data-offset-y` — смещение (по умолчанию: 0)
- `data-scale` — масштаб (по умолчанию: автоматический расчёт)

#### `splash.js`

Класс `SplashIllustration`:

- Загрузка SVG файла асинхронно
- Связывает модель, рендерер и анимацию
- Методы `start()` и `stop()` для управления
- Методы `getModel()` и `getRenderer()` для внешнего доступа
- ResizeObserver для отслеживания изменений размера контейнера

### Использование

```html
<div
  class="illustration-container"
  data-illustration-type="splash"
  data-background-color="--ids__background-RGB">
  <canvas class="illustration-canvas"></canvas>
</div>

<script type="module" src="/assets/illustrations/init.js"></script>
```

С кастомизацией через data-атрибуты:

```html
<div
  class="illustration-container"
  data-illustration-type="splash"
  data-background-color="--ids__background-RGB"
  data-rotation-speed-x="0.001"
  data-rotation-speed-y="0.002"
  data-z-spacing="60"
  data-line-width="3"
  data-accent-color="--ids__accent-RGB">
  <canvas class="illustration-canvas"></canvas>
</div>
```

## Создание новой иллюстрации

### Шаг 1: Создать структуру папок

Создайте папку для новой иллюстрации:

```
src/assets/illustrations/[name]/
```

### Шаг 2: Создать модель (`[name]-model.js`)

Модель отвечает за данные и логику конкретной иллюстрации:

```javascript
import { rotatePoint } from "../core/geometry3d.js";

export class MyModel {
  constructor(config) {
    this.config = config;
    // Инициализация данных модели
  }

  initialize() {
    // Инициализация начального состояния
  }

  update() {
    // Обновление модели (например, вращение)
  }

  getPointsForRender() {
    // Возвращает массив точек для рендеринга
    // Формат: [{ point: {x, y, z}, ...другие данные }]
  }
}
```

### Шаг 3: Создать рендерер (`[name]-renderer.js`)

Рендерер расширяет `BaseRenderer` и реализует специфичную отрисовку:

```javascript
import { BaseRenderer } from "../core/renderer.js";
import { project3DTo2D } from "../core/geometry3d.js";

export class MyRenderer extends BaseRenderer {
  constructor(canvas, container, config) {
    super(canvas, container);
    this.config = config;
  }

  render(model) {
    this.setupCanvas();
    const points = model.getPointsForRender();
    const sortedPoints = this.sortByDepth(points);

    this.clear();
    // Ваша логика отрисовки
  }
}
```

### Шаг 4: Создать конфигурацию (`[name]-config.js`)

Парсинг data-атрибутов для кастомизации:

```javascript
export function parseMyConfig(container) {
  const defaults = {
    // Значения по умолчанию
  };

  const config = { ...defaults };

  // Парсинг data-атрибутов
  if (container.dataset.myParam) {
    config.myParam = parseFloat(container.dataset.myParam);
  }

  return config;
}
```

### Шаг 5: Создать главный класс (`[name].js`)

Связывает все компоненты:

```javascript
import { AnimationLoop } from "../core/animation.js";
import { MyModel } from "./my-model.js";
import { MyRenderer } from "./my-renderer.js";
import { parseMyConfig } from "./my-config.js";

export class MyIllustration {
  constructor(container) {
    this.container = container;
    this.canvas = container.querySelector(".illustration-canvas");

    this.config = parseMyConfig(container);
    this.model = new MyModel(this.config);
    this.renderer = new MyRenderer(this.canvas, container, this.config);
    this.animation = new AnimationLoop(() => this.onFrame());

    this.model.initialize();
  }

  onFrame() {
    this.model.update();
    this.renderer.render(this.model);
  }

  start() {
    this.animation.start();
    this.renderer.render(this.model);
  }

  stop() {
    this.animation.stop();
  }
}
```

### Шаг 6: Зарегистрировать в `init.js`

Добавьте новую иллюстрацию в реестр:

```javascript
import { MyIllustration } from "./[name]/[name].js";

const illustrationTypes = {
  sphere: SphereIllustration,
  [name]: MyIllustration, // Добавить здесь
};
```

### Шаг 7: Использовать в HTML

```html
<div class="illustration-container" data-illustration-type="[name]">
  <canvas class="illustration-canvas"></canvas>
</div>
```

## Типы иллюстраций

### Генеративные иллюстрации

Модель создается алгоритмом (как `sphere`):

- Генерация точек/элементов по алгоритму
- Динамическое добавление/удаление элементов
- Пример: `sphere` — генерация точек на сфере

### Статические иллюстрации

Модель основана на заданной графике:

- Загрузка данных из SVG или массивов координат
- Поддержка повторяющихся элементов
- Пример: иллюстрация из 5 одинаковых частей, заданных как SVG фрагменты

## API для программного управления

### Получение экземпляра иллюстрации

```javascript
import { getIllustrationInstance } from "/assets/illustrations/init.js";

const container = document.querySelector(".illustration-container");
const illustration = getIllustrationInstance(container);

// Доступ к модели и рендереру
const model = illustration.getModel();
const renderer = illustration.getRenderer();
```

### Управление анимацией

```javascript
illustration.start(); // Запустить анимацию
illustration.stop(); // Остановить анимацию
```

### Остановка всех иллюстраций

```javascript
import { stopAllIllustrations } from "/assets/illustrations/init.js";

stopAllIllustrations();
```

## CSS-переменные для цветов

Иллюстрации автоматически используют цвета из дизайн-системы IDS:

- `--ids__accent-RGB` — цвет акцента (для точек, выделений)
- Цвет текста из `getComputedStyle()` — для линий и основного контента

Можно указать свою CSS-переменную через data-атрибут `data-accent-color`.

## Примеры кастомизации

### Изменение скорости вращения

```html
<div
  class="illustration-container"
  data-illustration-type="sphere"
  data-rotation-speed-x="0.001"
  data-rotation-speed-y="0.002"
  data-rotation-speed-z="0.0005">
  <canvas class="illustration-canvas"></canvas>
</div>
```

### Изменение толщины линий и размера точек

```html
<div
  class="illustration-container"
  data-illustration-type="sphere"
  data-line-width="3"
  data-point-radius="6">
  <canvas class="illustration-canvas"></canvas>
</div>
```

### Изменение параметров анимации

```html
<div
  class="illustration-container"
  data-illustration-type="sphere"
  data-fade-duration="500"
  data-min-lines="20"
  data-max-lines="80">
  <canvas class="illustration-canvas"></canvas>
</div>
```

## Технические детали

### Система координат

- Внутренняя система координат: 1000×1000 (центр в точке 500, 500)
- Автоматическое масштабирование под размер контейнера
- Учет `devicePixelRatio` для четкого отображения на Retina-экранах

### Проекция

Используется ортогональная проекция (вид сверху по оси Z):

- X и Y проецируются напрямую
- Z сохраняется для эффекта глубины (opacity, размер)

### Производительность

- Использование `requestAnimationFrame` для плавной анимации
- Сортировка по глубине только при необходимости
- Debounce для обработки resize событий

## Расширение системы

При создании новых иллюстраций учитывайте:

1. **Переиспользование базовых модулей** — не дублируйте код из `core/`
2. **Единый интерфейс** — все иллюстрации должны иметь методы `start()` и `stop()`
3. **Конфигурация через data-атрибуты** — для кастомизации без изменения кода
4. **Документация** — опишите специфичные параметры вашей иллюстрации
