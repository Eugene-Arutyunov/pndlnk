# Документация проекта

## Структура

Проект построен на Eleventy (11ty) версии 3.0.0.

- `src/` — исходные файлы
- `_site/` — сгенерированные файлы (не коммитится)
- `eleventy.config.js` — конфигурация Eleventy

## PathPrefix

PathPrefix управляется через переменную окружения `PATH_PREFIX`. По умолчанию пустой, что подходит для большинства случаев деплоя.

### Где используется

PathPrefix автоматически добавляется ко всем ссылкам через фильтр `| url` в шаблонах:

```njk
<link rel="shortcut icon" href="{{ '/assets/favicon.png' | url }}" />
<link rel="stylesheet" href="{{ '/bundle.css' | url }}" />
<script src="{{ '/assets/script.js' | url }}" defer></script>
```

При сборке эти ссылки становятся:
- `/pndlnk/assets/favicon.png`
- `/pndlnk/bundle.css`
- `/pndlnk/assets/script.js`

### Скрипты сборки

- `npm run dev` — локальная разработка без префикса (`localhost:8080/`)
- `npm run build` — сборка для GitHub Pages с префиксом `/pndlnk/`
- `npm run build:clean` — сборка без префикса для других платформ

### Настройка для разных платформ

**GitHub Pages:**
```bash
PATH_PREFIX=/pndlnk/ npm run build
# или просто npm run build (уже настроен)
```

**Netlify, Vercel, собственный сервер:**
```bash
npm run build:clean
# или PATH_PREFIX="" npm run build
```

**Корпоративный сервер с подпапкой:**
```bash
PATH_PREFIX=/projects/website/ npm run build
```

## Деплой

### GitHub Pages
Настроен автоматический деплой через GitHub Actions (`.github/workflows/deploy.yml`).

При пуше в ветку `main`:
1. Устанавливаются зависимости
2. Выполняется сборка с `PATH_PREFIX=/pndlnk/`
3. Результат деплоится в GitHub Pages

Сайт доступен: `https://[username].github.io/pndlnk/`

### Другие платформы
Для Netlify/Vercel просто используйте `npm run build:clean` в настройках сборки.

Для других серверов настройте переменную `PATH_PREFIX` согласно структуре URL.
