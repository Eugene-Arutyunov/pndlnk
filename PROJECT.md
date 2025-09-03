# Документация проекта

## Структура

Проект построен на Eleventy (11ty) версии 3.0.0.

- `src/` — исходные файлы
- `_site/` — сгенерированные файлы (не коммитится)
- `eleventy.config.js` — конфигурация Eleventy

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
