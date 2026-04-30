# Registration API

Small TypeScript Express project with a users table, registration, and bearer-token login. It uses MySQL locally by default and PostgreSQL/Neon on Vercel.

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

5. Check the database connection:

```bash
npm run db:check
```

6. Start the API:

```bash
npm run dev
```

The server runs at `http://localhost:3000` by default.

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

The Neon integration can also provide `POSTGRES_URL`, `PGHOST`, `PGUSER`, `PGDATABASE`, and `PGPASSWORD`; the app supports those too.

Run the Neon/PostgreSQL schema once with `DATABASE_URL` set:

```bash
npm run db:schema:postgres
```

## TypeScript

- `npm run dev` runs the TypeScript source directly with `tsx`.
- `npm run typecheck` checks types without emitting files.
- `npm run build` compiles TypeScript to `dist/`.
- `npm start` runs the compiled `dist/server.js`; run `npm run build` first.

## Routes

- `GET /` - API status
- `GET /api/health` - API and database status
- `POST /api/register` - register a user with JSON body `{ "firstName": "Asha", "email": "asha@example.com", "password": "secret123" }`
- `POST /api/login` - login with JSON body `{ "email": "asha@example.com", "password": "secret123" }`
- `GET /api/users` - list users, requires Bearer token
- `GET /api/users/:id` - get one user, requires Bearer token
- `POST /api/users` - create a user, requires Bearer token
- `DELETE /api/users/:id` - delete a user, requires Bearer token

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
