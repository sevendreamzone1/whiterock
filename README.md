# Registration API

Small TypeScript Express project with a users table, registration, and bearer-token login.

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

3. Update `.env` with your MySQL username, password, host, database name, and JWT secret.

4. Create the database and users table:

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

## TypeScript

- `npm run dev` runs the TypeScript source directly with `tsx`.
- `npm run typecheck` checks types without emitting files.
- `npm run build` compiles TypeScript to `dist/`.
- `npm start` runs the compiled `dist/server.js`; run `npm run build` first.

## Routes

- `GET /` - API status
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
