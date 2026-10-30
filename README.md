# Rentora

Rentora is a web app for landlords and property managers. A team keeps its rental business in one place:
the properties and the spaces in them, the tenants, their leases and the rent those leases bring in, the
property's expenses and maintenance requests, and reports on all of it.

## What it does

- **Properties and spaces**: each property has spaces (residential units, offices, retail units) that are
  vacant, reserved, occupied or under maintenance.
- **Tenants**: individuals or companies.
- **Leases**: a tenant renting a space for a period. Leases can be renewed, ended early or cancelled, and a
  space's status follows its leases. A nightly job ends leases that have run out and marks spaces occupied
  once their lease starts.
- **Payments**: creating a lease sets up its rent, due every month. Payments are recorded or voided and
  show as overdue, pending, paid or voided.
- **Expenses** and **maintenance requests** for a property or one of its spaces.
- **Reports**: income, expenses, occupancy, leases and maintenance by month, quarter, year or custom dates.
- **Organizations and roles**: whoever registers owns a new organization and can add managers and members.
  What each role may do is in [docs/ROLES.md](docs/ROLES.md).

## Tech stack

- **Backend**: Java 21, Spring Boot 4, Spring Security with JWT access tokens and a refresh-token cookie,
  Spring Data JPA, PostgreSQL 18, Flyway.
- **Frontend**: React 19, TypeScript, Vite, React Router, Tailwind CSS.
- **Tests**: JUnit, Mockito and Testcontainers for the backend; Vitest for the frontend.

## Repository layout

```
backend/              Spring Boot API, one package per area (auth, organization, property, tenant, lease,
                      payment, expense, maintenance, reporting, dashboard)
frontend/             React app, one folder per area under src/features
docs/                 ROLES.md (what each role may do) and ROADMAP.md
docker-compose.yml    The whole app in containers
```

Inside the backend, each area is split into `api` (controllers and DTOs), `application` (services),
`domain` (entities) and `infrastructure` (repositories). A service that needs another area usually goes
through the `*Access` interface in that area's `api` package.

## Run it locally

You need Java 21, Node.js 22 and PostgreSQL 18. Docker is needed for the backend tests and for the
Docker Compose option below.

### 1. Database

Create an empty database; Flyway creates the tables the first time the backend starts.

```sql
CREATE DATABASE rentora;
```

### 2. Backend

Create `backend/.env` (it is gitignored, and the backend loads it on startup):

```properties
DB_URL=jdbc:postgresql://localhost:5432/rentora
DB_USERNAME=postgres
DB_PASSWORD=your-database-password
# At least 32 characters; it signs the access tokens.
JWT_SECRET=replace-with-at-least-32-random-characters
# Milliseconds: 15 minutes for access tokens, 7 days for refresh tokens.
JWT_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000
```

Then start it from the `backend` folder:

```bash
cd backend
sh mvnw spring-boot:run
```

The API listens on http://localhost:8080. (`mvnw` runs through `sh` because it isn't marked executable in
git; on Windows without Git Bash, use `mvnw.cmd spring-boot:run`.)

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and register: that creates your account and your organization, with you as its
owner. The frontend calls the API on http://localhost:8080; to use another address, set `VITE_API_URL` in
`frontend/.env`.

### Or: everything in Docker

```bash
JWT_SECRET=replace-with-at-least-32-random-characters docker compose up --build
```

This starts PostgreSQL, the backend and the frontend; the app is on http://localhost:3000, and the
frontend's nginx forwards `/api` to the backend. `JWT_SECRET` can also go in a `.env` file next to
`docker-compose.yml`.

## Configuration

The backend reads these environment variables (or the same names in `backend/.env`):

| Variable | Default | What it sets |
|---|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | none | The PostgreSQL database. |
| `JWT_SECRET` | none | Signs access tokens. At least 32 characters. |
| `JWT_EXPIRATION` | none | Access token lifetime in milliseconds. |
| `JWT_REFRESH_EXPIRATION` | none | Refresh token lifetime in milliseconds. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated origins the browser may call the API from. Required with the `prod` profile. |
| `COOKIE_SECURE` | `false`, `true` with `prod` | Sends the refresh-token cookie over HTTPS only. |
| `APP_TIME_ZONE` | `Europe/Belgrade` | Decides what day it is: when leases start and end, what is overdue, and when the nightly lease job runs (00:05). |
| `SPRING_PROFILES_ACTIVE` | none | `prod` turns on the production settings in `application-prod.yml`. |

## Tests

### Backend

```bash
cd backend
sh mvnw test
```

Docker must be running: the tests that use the database start a throwaway PostgreSQL 18 with
Testcontainers, so they never touch your own database and need no `.env`. To run one class, add
`-Dtest=LeaseServiceTest`.

### Frontend

```bash
cd frontend
npm run lint
npm test
npm run build
```

`npm run build` type-checks with `tsc` before building.

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs the backend tests and the
frontend lint, tests and build on every push to `main` and every pull request.
