# Документация проекта

## Структура

Проект построен на Eleventy (11ty) версии 3.0.0.

- `src/` — исходные файлы
- `_site/` — сгенерированные файлы (не коммитится)
- `eleventy.config.js` — конфигурация Eleventy

## Компоненты

### Диаграмма ценностного предложения

Диаграмма реализована в файле `src/includes/vp-diagram.html` как единый инклюд.

Используется в двух местах:
- Внутри контейнера `.vp-illustration.vp-initial` — начальная версия
- Внутри контейнера `.vp-illustration.vp-focus` — версия с фокусом

Различия между версиями реализуются через каскадные стили в зависимости от родительского контейнера. Это позволяет редактировать текст диаграммы в одном месте, а стилистические различия задавать через CSS.

## Шрифты

В проекте используются кастомные шрифты:
- **Robert** — основной шрифт для body текста
- **CoFoSansSemi-Mono** — заголовки и навигация
- **CoFoGothic** — дополнительный шрифт
- **CoFoHand** — для списков

### Оптимизация загрузки

Шрифты подключаются двумя способами для ускорения загрузки:

1. **Предзагрузка в HTML** (в `src/includes/layout.html`):
```html
<link rel="preload" href="/fonts/Robert/CoFoRobert-Book-Trial.otf" as="font" type="font/otf" crossorigin />
<link rel="preload" href="/fonts/CoFoSansSemi-Mono-VF-Trial.ttf" as="font" type="font/ttf" crossorigin />
```

2. **Объявление в CSS** (в `src/ids/settings.css`):
```css
@font-face {
  font-family: "Robert";
  font-style: normal;
  font-display: swap;
  src: url("fonts/Robert/CoFoRobert-Book-Trial.otf") format("opentype");
}
```

Предзагрузка в HTML позволяет браузеру начать загрузку шрифтов параллельно с CSS, что устраняет мигание системного шрифта при переходах между страницами.

## Стили и CSS

### Единицы измерения

В проекте используется строгое правило для единиц измерения в CSS:

- **em** — для всех размеров, отступов, трансформаций, размытия и других свойств
- **px** — только для бордеров и подчеркиваний (`border`, `outline`, `text-decoration-thickness`)

Это обеспечивает масштабируемость интерфейса и корректную работу на разных устройствах.

```css
/* Правильно */
font-size: 1.2em;
margin: 2em 1em;
transform: translateZ(5em);
filter: blur(0.12em);
border: 1px solid red;

/* Неправильно */
font-size: 16px;
margin: 32px 16px;
filter: blur(2px);
```

## PathPrefix

Проект развернут на поддомене `https://pndlnk.dev.intuition.team/`, поэтому PathPrefix не используется. Фильтр `| url` остается в шаблонах для совместимости, но не добавляет префикс.

### Где используется

PathPrefix автоматически добавляется ко всем ссылкам через фильтр `| url` в шаблонах:

```njk
<link rel="shortcut icon" href="{{ '/assets/favicon.png' | url }}" />
<link rel="stylesheet" href="{{ '/bundle.css' | url }}" />
<script src="{{ '/assets/script.js' | url }}" defer></script>
```

При сборке эти ссылки остаются без изменений:
- `/assets/favicon.png`
- `/bundle.css`
- `/assets/script.js`

### Скрипты сборки

- `npm run dev` — локальная разработка (`localhost:8080/`)
- `npm run build` — сборка для продакшена (поддомен)
- `npm run build:clean` — то же, что и build (оставлен для совместимости)

### Настройка для разных платформ

**Поддомен (текущий деплой):**
```bash
npm run build
```

**Деплой в подпапку (если потребуется):**
```bash
PATH_PREFIX=/subfolder/ eleventy
```

## Деплой

### GitHub Pages
Настроен автоматический деплой через GitHub Actions (`.github/workflows/deploy.yml`).

При пуше в ветку `main`:
1. Устанавливаются зависимости
2. Выполняется сборка без префикса
3. Результат деплоится на поддомен

Сайт доступен: `https://pndlnk.dev.intuition.team/`

### Другие платформы
Для Netlify/Vercel используйте `npm run build` в настройках сборки.

Для деплоя в подпапку настройте переменную `PATH_PREFIX` согласно структуре URL.
