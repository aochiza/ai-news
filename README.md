# AI News (React + TypeScript)


<img width="3200" height="1828" alt="1" src="https://github.com/user-attachments/assets/d3867cfb-93ab-4ee4-a67f-4a240a4047ce" />


 

Сайт с лентой новостей, сгенерированных AI.  
Проект получает новости через `text.pollinations.ai`, кеширует результат в `localStorage`, поддерживает фильтрацию по категориям и поиск.
Реализован бекенд(https://github.com/aochiza/ai-news-backend)

## Что уже есть

- Лента новостей с карточками и адаптивной сеткой
- Категории: `Технологии`, `Наука`, `Спорт`, `Экономика`
- Поиск по заголовку и тексту
- Детальная страница новости при клике на карточку
- Правая закрепленная панель «Популярные новости»
- Кеш ленты в браузере (TTL: 5 минут)
- Лайки
- Комментарии
- Авторизация/регистрация
- Футер с информацией

## Технологии

- React 18
- TypeScript
- Vite
- ESLint
- Docker + Docker Compose
- Nginx (для production-образа)

## Быстрый старт

### 1) Установка зависимостей

```bash
npm install
```

### 2) Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу: [http://localhost:5173](http://localhost:5173)

### 3) Production-сборка

```bash
npm run build
```

### 4) Просмотр production-сборки локально

```bash
npm run preview
```

## Docker

В проекте есть два режима в `docker-compose.yml`:

- `dev` — контейнер для разработки с hot reload (`Dockerfile.dev`, порт `5173`)
- `prod` — сборка и отдача через Nginx (`Dockerfile`, порт `80`)

### Запуск разработки в Docker

```bash
docker compose up dev --build
```

### Запуск production в Docker

```bash
docker compose up prod --build
```

## Скрипты NPM

- `npm run dev` — запуск Vite dev server
- `npm run build` — проверка TypeScript + production build
- `npm run preview` — предпросмотр собранного `dist`
- `npm run lint` — запуск ESLint

## Структура проекта

```text
src/
  components/        # UI-компоненты (карточки, навигация, сайдбар, детали)
  domain/            # типы и репозиторий новостей (API, парсинг, кеш)
  hooks/             # кастомные React-хуки (useNewsFeed)
  App.tsx            # сборка страницы из компонентов
```

## Примечания

- Данные новостей генерируются внешним AI API, поэтому контент может отличаться при каждом обновлении.
- Кеш хранится в `localStorage` под ключом `aiNewsCacheV1`.
