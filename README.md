# Registration API

Small TypeScript Express and React project with a users table, registration, and bearer-token login. It uses MySQL locally by default and PostgreSQL/Neon on Vercel.

## Project Structure

```text
src/
  config/          Database and environment configuration
  controllers/     Auth request handlers
  services/        Registration, login, validation, and password hashing
  models/          Users table queries
  routes/          Registration route
  middlewares/     Error handling
  app.ts           Express app setup
  server.ts        Entry point
client/
  src/             React TypeScript login/register and user CRUD UI
  vite.config.ts   Frontend dev server and build config
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
copy .env.example .env
```

3. Update `.env` with your local MySQL username, password, host, database name, and JWT secret.

4. Create the local MySQL database and users table:

```bash
npm run db:schema
```

This command is non-destructive and uses `CREATE TABLE IF NOT EXISTS`.

5. Check the database connection:

```bash
npm run db:check
```

6. Start the API:

```bash
npm run dev
```

7. In another terminal, start the React frontend:

```bash
npm run dev:client
```

The API runs at `http://localhost:3000` and the React app runs at `http://127.0.0.1:5173`.
In local React dev, `/api` requests are proxied to the local API. To point the UI at the deployed API instead, set `VITE_API_BASE_URL` in `client/.env`.

## Database Selection

The active database is selected from environment variables:

- Local default: MySQL
- Vercel default: PostgreSQL, because Vercel sets `VERCEL=1`
- Manual override: set `DB_CLIENT=mysql` or `DB_CLIENT=postgres`

For local MySQL, use:

```env
DB_CLIENT=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=development
```

For Vercel with Neon, add these environment variables in the Vercel project settings:

```env
DB_CLIENT=postgres
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
JWT_SECRET=your-production-secret
```

The Neon integration can also provide `DATABASE_URL_UNPOOLED`, `POSTGRES_URL`, `PGHOST`, `PGUSER`, `PGDATABASE`, and `PGPASSWORD`; the app supports those too. `JWT_SECRET` is required for login tokens. The app also accepts `AUTH_SECRET` or `NEXTAUTH_SECRET` if you already use one of those names in Vercel.

After changing Vercel environment variables, redeploy the project. Existing deployments do not receive new environment variable values.

Run the Neon/PostgreSQL schema once with `DATABASE_URL` set:

```bash
npm run db:schema:postgres
```

You can verify deployment configuration with:

- `GET /api/health` - checks database connectivity and whether JWT auth is configured
- `GET /api/health/tables` - checks the database tables and confirms the `users` table exists
- `GET /api/health/tables` also confirms the `products` table exists for the catalog page

## TypeScript

- `npm run dev` runs the TypeScript source directly with `tsx`.
- `npm run dev:client` runs the React app with Vite.
- `npm run typecheck` checks types without emitting files.
- `npm run build` compiles the API and builds the React app to `dist/client`.
- `npm start` runs the compiled `dist/server.js`; run `npm run build` first.

## Routes

- `GET /` - API status
- `GET /api/health` - API and database status
- `GET /api/health/tables` - active database table list and `users` table check
- `POST /api/register` - register a user with JSON body `{ "firstName": "Asha", "email": "asha@example.com", "password": "secret123" }`
- `POST /api/login` - login with JSON body `{ "email": "asha@example.com", "password": "secret123" }`
- `GET /api/users` - list users, requires Bearer token
- `GET /api/users/events` - stream user-list changes, requires Bearer token
- `GET /api/users/:id` - get one user, requires Bearer token
- `POST /api/users` - create a user, requires Bearer token
- `PUT /api/users/:id` - update a user, requires Bearer token
- `DELETE /api/users/:id` - delete a user, requires Bearer token
- `GET /api/products` - list products for the public shop
- `POST /api/products` - create a product with JSON body `{ "name": "Headphones", "category": "Electronics", "price": 49.99 }`, requires Bearer token
- `PUT /api/products/:id` - update a product, requires Bearer token
- `DELETE /api/products/:id` - delete a product, requires Bearer token

The React app includes:

- `/products` - logged-in product inventory management with add, edit, and delete
- `/shop` - public shopping page with search, category filter, cart, and buy flow

Passwords are accepted as `password` and stored as a bcrypt hash in `password_hash`.

Example:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/register" -ContentType "application/json" -Body '{"firstName":"Asha","email":"asha@example.com","password":"secret123"}'
```

Login returns a bearer token:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/login" -ContentType "application/json" -Body '{"email":"asha@example.com","password":"secret123"}'
```

Use the returned token for protected user routes:

```powershell
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/login" -ContentType "application/json" -Body '{"email":"asha@example.com","password":"secret123"}'
Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Headers @{ Authorization = "Bearer $($login.access_token)" }
```
