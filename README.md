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
1. Скопируйте и заполните `.env` (порты, пароли, `JWT_SECRET`).
   - `cp .env.example .env`
2. Запустите инфраструктуру: `docker-compose up -d`
3. Установите зависимости: `npm install`

### Запуск сервиса
- Development (watch mode): `npm run start:dev`
- Production build: `npm run build` → `npm run start:prod`

Приложение стартует на `http://localhost:3000`.

### Запуск через Docker
1. Убедитесь, что `.env` заполнен (как минимум переменные БД и `JWT_SECRET`).
2. Соберите и поднимите контейнеры: `docker-compose up -d --build`
   - сервис `homy-api` запустит NestJS с `npm run start:dev`
   - контейнер `homy-postgres` поднимет PostgreSQL с данными в volume `homy-postgres-data`
3. Просмотреть логи: `docker-compose logs -f homy-api`
4. Остановить окружение: `docker-compose down`

### Swagger
- Документация доступна по `http://localhost:3000/api/docs`
- Для авторизации в Swagger используйте JWT токен (кнопка Authorize → Bearer).

### Полезные команды
- Линтер: `npm run lint`
- Тесты: `npm run test`, `npm run test:e2e`, `npm run test:cov`

### Postman
- Используйте переменную `api = http://localhost:3000` и подставляйте `{{api}}` в URL.
- Экспортируйте коллекцию в формате v2.1, чтобы поделиться запросами.
