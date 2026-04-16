# Hair Atelier — Сайт салона красоты

Fullstack приложение на Next.js 14 + PostgreSQL + Prisma для управления салоном красоты.

## Возможности

### Публичная часть (mobile-first)
- **Главная** — герой-секция, услуги, мастера, CTA
- **Услуги** — каталог по категориям с ценами
- **Запись** — пошаговая форма (услуга → дата/время → контакты)
- **Магазин** — витрина бьюти-товаров
- **Школа** — курсы с записью
- **Нижний навбар** на мобильных (tab bar), верхний на десктопе

### Админ-панель (/admin)
- JWT-авторизация
- Дашборд со статистикой
- CRM записей (фильтры, статусы, пагинация)
- CRUD мастеров, услуг, товаров, курсов
- Просмотр записей на курсы
- Telegram-уведомления о новых записях

## Стек

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes
- **БД:** PostgreSQL + Prisma ORM
- **Авторизация:** JWT + bcrypt
- **Уведомления:** Telegram Bot API
- **Шрифты:** Cormorant Garamond + DM Sans

## Установка и запуск

### 1. Клонировать и установить зависимости

```bash
cd hair-atelier
npm install
```

### 2. Настроить переменные окружения

```bash
cp .env.example .env
```

Отредактировать `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/hair_atelier?schema=public"
JWT_SECRET="your-super-secret-key"
TELEGRAM_BOT_TOKEN="your-bot-token"      # опционально
TELEGRAM_CHAT_ID="your-chat-id"          # опционально
```

### 3. Создать базу данных и применить схему

```bash
npx prisma db push
```

### 4. Заполнить тестовыми данными

```bash
npm run db:seed
```

### 5. Запустить

```bash
npm run dev
```

Приложение доступно на `http://localhost:3000`

## Вход в админку

- URL: `http://localhost:3000/admin`
- Email: `admin@hairatelier.com`
- Пароль: `admin123`

## Настройка Telegram-уведомлений

1. Создать бота через [@BotFather](https://t.me/BotFather)
2. Получить токен бота
3. Добавить бота в группу или написать ему
4. Получить chat_id (можно через `https://api.telegram.org/bot{TOKEN}/getUpdates`)
5. Добавить в `.env`:
   ```
   TELEGRAM_BOT_TOKEN=your-token
   TELEGRAM_CHAT_ID=your-chat-id
   ```

## Структура проекта

```
src/
├── app/
│   ├── (public)/          # Публичные страницы
│   │   ├── layout.js      # Layout с навбаром
│   │   ├── page.js        # Главная
│   │   ├── services/      # Услуги
│   │   ├── booking/       # Запись
│   │   ├── shop/          # Магазин
│   │   └── school/        # Школа
│   ├── admin/             # Админ-панель
│   │   ├── layout.js      # Admin layout + auth
│   │   ├── login/         # Логин
│   │   ├── page.js        # Дашборд
│   │   ├── appointments/  # Записи
│   │   ├── masters/       # Мастера
│   │   ├── services/      # Услуги
│   │   ├── products/      # Товары
│   │   └── courses/       # Курсы
│   ├── api/               # API Routes
│   │   ├── auth/          # Авторизация
│   │   ├── services/      # Публичный API
│   │   ├── masters/
│   │   ├── products/
│   │   ├── courses/
│   │   ├── appointments/
│   │   ├── enrollments/
│   │   └── admin/         # Защищённый API
│   ├── globals.css
│   └── layout.js
├── lib/
│   ├── prisma.js          # Prisma client
│   ├── auth.js            # JWT helpers
│   └── telegram.js        # Telegram notifications
prisma/
├── schema.prisma          # Схема БД
└── seed.js                # Сидер
```

## Дизайн

- Нейтрально-люксовый стиль в светлых тонах
- Цветовая палитра: cream, charcoal, gold, sage
- Mobile-first подход
- Нижний tab bar на мобильных устройствах
- Плавные анимации и переходы
