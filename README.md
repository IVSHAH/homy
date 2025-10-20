## Homy Backend

Backend-сервис для работы с пользователями: регистрация, проверка логина/email, авторизация по JWT, управление профилем.

### Технологический стек
- Node.js (NestJS)
- TypeScript
- PostgreSQL + TypeORM
- JWT авторизация

### Требования
- Node.js ≥ 18
- npm
- Docker и Docker Compose

### Настройка окружения
1. Заполнить `.env`, скопирова содержание из `.env.example` 
2. Запустите инфраструктуру: `docker-compose up -d`
3. Установите зависимости: `npm install`

### Запуск сервиса
- Development (watch mode): `npm run start:dev`

Приложение стартует на `http://localhost:3000`.

### Swagger
- Документация доступна по `http://localhost:3000/api/docs`
- Для авторизации в Swagger используйте JWT токен (кнопка Authorize → Bearer).

### Minio
 - Вход в минио `http://localhost:9001/login`

### Полезные команды
- Линтер: `npm run lint`
- Тесты: `npm run test`
