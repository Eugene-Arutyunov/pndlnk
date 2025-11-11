# Настройки для отключения подсказок в Cursor

Чтобы отключить подсказки глобально для пользователя, добавьте следующие настройки в ваш файл пользовательских настроек:

**Путь к файлу настроек (macOS):**
```
~/Library/Application Support/Cursor/User/settings.json
```

## Настройки для отключения подсказок:

```json
{
  // Отключить автодополнение
  "editor.quickSuggestions": {
    "other": false,
    "comments": false,
    "strings": false
  },
  
  // Отключить подсказки при наборе
  "editor.suggestOnTriggerCharacters": false,
  "editor.acceptSuggestionOnCommitCharacter": false,
  "editor.acceptSuggestionOnEnter": "off",
  
  // Отключить всплывающие подсказки
  "editor.hover.enabled": false,
  
  // Отключить подсказки параметров
  "editor.parameterHints.enabled": false,
  
  // Отключить автодополнение при вводе
  "editor.wordBasedSuggestions": "off",
  "editor.wordBasedSuggestionsMode": "off",
  
  // Отключить встроенные предложения (AI)
  "editor.inlineSuggest.enabled": false,
  
  // Отключить все предложения
  "editor.suggest.enabled": false,
  
  // Отключить мини-карту с подсказками
  "editor.minimap.enabled": false
}
```

## Как применить:

1. Откройте Cursor
2. Нажмите `Cmd+Shift+P` (или `Ctrl+Shift+P` на Windows/Linux)
3. Введите "Preferences: Open User Settings (JSON)"
4. Добавьте или измените нужные настройки
5. Сохраните файл

## Через интерфейс настроек:

1. Откройте настройки: `Cmd+,` (или `Ctrl+,`)
2. В поиске введите:
   - "suggest" - для настроек автодополнения
   - "hover" - для всплывающих подсказок
   - "inline suggest" - для встроенных предложений AI
3. Отключите нужные опции

