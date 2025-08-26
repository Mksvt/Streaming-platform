# Стрімінгова Платформа

Платформа для стрімінгу та перегляду відео з функцією збереження трансляцій.

## 🏗️ Архітектура

- **Backend API** - Node.js + Express.js для керування користувачами та стрімами
- **Media Server** - Node Media Server для обробки RTMP потоків та HLS трансляцій  
- **Frontend** - Next.js додаток для користувачів та стрімерів
- **База даних** - MongoDB для зберігання даних
- **Сховище** - AWS S3 для збереження відео (VOD)

## 🚀 Швидкий старт

### 1. Запуск Backend API
```bash
cd backend
npm install
npm start
```
Сервер запуститься на порту 3001

### 2. Запуск Media Server
```bash
cd media-server
npm install
npm start
```
- RTMP сервер на порту 1935
- HTTP/HLS сервер на порту 8000

### 3. Запуск Frontend
```bash
cd frontend
npm install
npm run dev
```
Додаток запуститься на порту 3000

## 📁 Структура проекту

```
streaming-platform/
├── backend/           # API сервер
├── media-server/      # RTMP/HLS сервер
├── frontend/          # Next.js додаток
└── README.md
```

## ⚠️ Залежності

Для повної роботи потрібно встановити:
- **MongoDB** - база даних
- **FFmpeg** - обробка відео
- **AWS S3** - зберігання файлів

## 🔧 Налаштування

1. Скопіювати `.env.example` в `.env` в кожній папці
2. Заповнити реальні значення для змінних середовища
3. Запустити MongoDB
4. Налаштувати AWS S3 (опціонально)

## 📡 Тестування

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Media Server HLS: http://localhost:8000/live/
- RTMP ingest: rtmp://localhost:1935/live/
