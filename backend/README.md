# Стрімінгова Платформа

Повноцінна стрімінгова платформа з функцією прямих ефірів та їх збереженням.

## Архітектура

- **Backend API** - Node.js + Express.js для керування користувачами та стрімами
- **Media Server** - Node Media Server для обробки RTMP потоків та HLS трансляцій
- **Frontend** - Next.js додаток для користувачів та стрімерів
- **База даних** - MongoDB для зберігання даних
- **Сховище** - AWS S3 для збереження відео (VOD)

## Швидкий старт

### 1. Встановлення залежностей

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install

# Media Server
cd media-server
npm install
```

### 2. Налаштування середовища

Створіть `.env` файли в кожній папці з необхідними змінними середовища.

### 3. Запуск

```bash
# Термінал 1: Backend API
cd backend
npm run dev

# Термінал 2: Media Server
cd media-server
npm start

# Термінал 3: Frontend
cd frontend
npm run dev
```

## Функціональність

- ✅ Реєстрація та авторизація користувачів
- ✅ Генерація ключів трансляції
- ✅ RTMP стрімінг через OBS Studio
- ✅ HLS трансляції для глядачів
- ✅ Автоматичне збереження ефірів
- ✅ Конвертація та завантаження на S3
- ✅ Перегляд збережених відео

## Технології

- **Backend**: Node.js, Express.js, MongoDB, JWT
- **Media Server**: Node Media Server, FFmpeg
- **Frontend**: Next.js, React, HLS.js
- **Сховище**: AWS S3
- **База даних**: MongoDB

## Структура проекту

```
streaming-platform/
├── backend/          # Express.js API сервер
├── frontend/         # Next.js додаток
├── media-server/     # Node Media Server
└── README.md
```
