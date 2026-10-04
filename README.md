# Employee Leave Management System

A deliberately small full-stack project for learning and interview practice:
a Spring Boot REST API with JWT authentication, backed by PostgreSQL, and a
React (Vite) frontend.

Employees can register, log in, see their leave balance, apply for leave,
view their own requests and cancel a pending one. Managers can log in, see all
pending requests, approve or reject them, and list employees.

---

## Features

Authentication

- Register a new account (password stored as a BCrypt hash)
- Log in and receive a JWT valid for 24 hours
- Log out (the token is discarded client-side)
- Every request after login is authenticated from the `Authorization: Bearer <token>` header
- Two roles, `EMPLOYEE` and `MANAGER`, enforced by Spring Security

Employee

- View own profile (name, email, role)
- View leave balance per leave type with total / used / remaining days
- Apply for leave: type, start date, end date, reason
- View own leave history, newest first
- Cancel one of own requests while it is still `PENDING`

Manager

- View all pending leave requests (with the employee name)
- Approve a request, which books the days against that employee's balance
- Reject a request, which leaves the balance untouched
- View the list of employees

Rules and validation

- Statuses: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`
- Only `PENDING` requests can be cancelled, approved or rejected
- An employee can only cancel their own requests
- A request must fit the remaining balance for its leave type
- `endDate` cannot be before `startDate`; days are counted inclusively
- Field validation on every request body (`@NotBlank`, `@Email`, `@Size`, `@NotNull`)
- Errors are returned as JSON with the matching HTTP status (400 / 401 / 403 / 404)

---

## Tech stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Backend   | Java 21, Spring Boot 4, Maven                                     |
|           | Spring Web (REST), Spring Data JPA / Hibernate, Bean Validation    |
|           | Spring Security + JWT (jjwt)                                       |
| Database  | PostgreSQL (local, no cloud)                                       |
| Frontend  | React 19, React Router, Vite, plain JavaScript, plain CSS          |

Everything runs locally. There is no Docker, no message broker, no cache, no
external API and no cloud service.

---

## Project structure

```
leave-management-system/
├── backend/                     Spring Boot application
│   ├── pom.xml                  Maven dependencies
│   └── src/main/java/com/ashlesh/leavemanagement/
│       ├── controller/          REST endpoints  (HTTP layer)
│       ├── service/             business rules  (logic layer)
│       ├── repository/          Spring Data JPA interfaces (database layer)
│       ├── entity/              @Entity classes = database tables
│       ├── dto/                 request/response objects (what the API sends)
│       ├── security/            JWT filter, JWT service, security config
│       ├── config/              DataInitializer (demo accounts)
│       └── exception/           maps exceptions to HTTP status codes
├── frontend/                    React app
│   └── src/
│       ├── api.js               fetch wrapper + all backend calls
│       ├── auth/                AuthContext (who is logged in) + storage
│       ├── components/          Navbar, ProtectedRoute
│       └── pages/               Login, Register, Employee/Manager dashboards
├── setup-db.sql                 creates the local PostgreSQL role + database
├── start.sh                     starts backend and frontend together
└── README.md
```

Request flow:

```
React page -> api.js (fetch + JWT header) -> Controller
           -> Service (rules) -> Repository -> Hibernate -> PostgreSQL
```

---

## Prerequisites

- Java 21 or newer (`java -version`)
- Node.js 20.19+ or 22.12+ (`node -v`) - the version range Vite 8 supports
- PostgreSQL 14+ running locally (`psql --version`)

---

## Database setup

The database runs on your machine. Create the role and the database once:

```bash
# from the repository root
sudo -u postgres psql -f setup-db.sql
```

That creates:

- role `leave_user` with password `leave_password`
- database `leave_db` owned by `leave_user`

If you prefer to do it by hand:

```bash
sudo -u postgres psql
```

```sql
CREATE ROLE leave_user WITH LOGIN PASSWORD 'leave_password';
CREATE DATABASE leave_db OWNER leave_user;
\q
```

You do **not** need to create any tables. Hibernate creates and updates
`users`, `leave_balances` and `leave_requests` from the `@Entity` classes on
startup (`spring.jpa.hibernate.ddl-auto=update`).

Check that the server is reachable:

```bash
pg_isready -h localhost -p 5432
```

If your PostgreSQL uses a different user/password/port, either edit
`backend/src/main/resources/application.properties` or set the environment
variables `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` (see Configuration below).

---

## How to run locally

### Option 1 - one command (recommended)

```bash
# first time only: install frontend dependencies
cd frontend && npm install && cd ..

# start PostgreSQL if it is not already running, then:
./start.sh
```

`start.sh` starts the backend on <http://localhost:8080> and the frontend on
<http://localhost:5173>. Press `Ctrl+C` to stop both.

Open <http://localhost:5173> in your browser.

After the first run, everything works offline: Maven and npm already have their
dependencies in the local caches.

### Option 2 - two terminals

```bash
# terminal 1 - backend
cd backend
./mvnw spring-boot:run

# terminal 2 - frontend
cd frontend
npm run dev
```

---

## Demo credentials

`DataInitializer` creates two accounts the first time the backend starts:

| Role     | Email                | Password    |
| -------- | -------------------- | ----------- |
| Manager  | `manager@leave.com`  | `manager123` |
| Employee | `employee@leave.com` | `employee123` |

New accounts created on the Register page are always **employees**. To get
another manager, change that account's `role` to `MANAGER` in the `users` table
(or edit `DataInitializer`).

---

## How to use the application

**As an employee**

1. Log in (or register) - you land on the Employee Dashboard.
2. The dashboard shows your profile and your leave balance per leave type
   (CASUAL 12, SICK 8, EARNED 15 by default).
3. Fill in "Apply for leave": type, start date, end date, reason, submit.
   The request is created with status `PENDING`. Applying for more days than
   you have remaining is rejected.
4. Your requests are listed below with their status. A `PENDING` request has a
   **Cancel** button; approved/rejected/cancelled requests cannot be changed.

**As a manager**

1. Log in with the manager account - you land on the Manager Dashboard.
2. "Pending leave requests" lists every employee's waiting request.
3. **Approve** books the days against that employee's balance;
   **Reject** leaves the balance untouched.
4. "Employees" lists all registered employees.

---

## API overview

All endpoints are under `/api`. Protected endpoints need the header
`Authorization: Bearer <token>`.

| Method | Path                             | Who      | Purpose                              |
| ------ | -------------------------------- | -------- | ------------------------------------ |
| POST   | `/api/auth/register`             | public   | Create an employee account, get JWT  |
| POST   | `/api/auth/login`                | public   | Log in, get JWT                      |
| GET    | `/api/employees/me`              | logged in| Own profile                          |
| GET    | `/api/employees/me/balances`     | logged in| Own leave balances                   |
| POST   | `/api/leaves`                    | logged in| Apply for leave                      |
| GET    | `/api/leaves`                    | logged in| Own leave requests                   |
| PATCH  | `/api/leaves/{id}/cancel`        | owner    | Cancel own pending request           |
| GET    | `/api/manager/leaves/pending`    | MANAGER  | All pending requests                 |
| PATCH  | `/api/manager/leaves/{id}/approve` | MANAGER | Approve a pending request           |
| PATCH  | `/api/manager/leaves/{id}/reject`  | MANAGER | Reject a pending request            |
| GET    | `/api/manager/employees`         | MANAGER  | List employees                       |

Status codes: `200` OK, `201` created, `400` validation or business rule
failure, `401` bad credentials/missing token, `403` wrong role or someone
else's request, `404` unknown id.

Example with curl:

```bash
# log in and keep the token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@leave.com","password":"employee123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# apply for leave
curl -X POST http://localhost:8080/api/leaves \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"leaveType":"CASUAL","startDate":"2026-10-05","endDate":"2026-10-07","reason":"Family function"}'
```

---

## Configuration

`backend/src/main/resources/application.properties` reads environment variables
and falls back to local defaults, so no secrets are hardcoded:

| Variable           | Default                                             |
| ------------------ | --------------------------------------------------- |
| `DB_URL`           | `jdbc:postgresql://localhost:5432/leave_db`          |
| `DB_USERNAME`      | `leave_user`                                        |
| `DB_PASSWORD`      | `leave_password`                                    |
| `JWT_SECRET`       | a long dev-only string (change it for real use)      |
| `JWT_EXPIRATION_MS`| `86400000` (24 hours)                               |

The frontend talks to the backend through the Vite dev-server proxy
(`/api` -> `http://localhost:8080`, see `frontend/vite.config.js`), so no
backend URL is hardcoded in the React code.

---

## Tests

```bash
cd backend
./mvnw test
```

The current test only checks that the whole Spring application context starts
(which also verifies the database connection), so PostgreSQL must be running.

---

## Important interview concepts demonstrated

Everyone of these is visible in the code of this project:

- **Dependency injection** (constructor injection, `@Service`, `@Repository`, `@RestController` beans)
- **Layered architecture**: controller → service → repository → database
- **Spring Data JPA derived queries** (`findByEmail`, `findByUserIdAndLeaveType`) and generated `JpaRepository` methods
- **Entity mapping**: `@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@Column`, `@Enumerated`, `@Transient`
- **Relationships**: `@ManyToOne` + `@JoinColumn` (`User 1 ── * LeaveRequest`, `User 1 ── * LeaveBalance`) with `FetchType.LAZY`
- **Transactions**: `@Transactional` and `@Transactional(readOnly = true)` (and why lazy loading needs one)
- **Bean Validation** with `@Valid` and a `@RestControllerAdvice` turning errors into 400 responses
- **Spring Security**: `SecurityFilterChain`, URL-based authorization (`permitAll` / `authenticated` / `hasRole`), `ROLE_` authorities, stateless sessions, CSRF disabled for a token API
- **Authentication flow**: `AuthenticationManager` + `UserDetailsService` + `PasswordEncoder` (BCrypt)
- **JWT**: claims (`sub`, `role`, `iat`, `exp`), HMAC signing, signature/expiry verification in a custom `OncePerRequestFilter`
- **HTTP/REST**: methods and paths for resources, status codes (200/201/400/401/403/404), path variables, request bodies, headers
- **React**: function components, `useState`, `useEffect`, `useMemo`, `useContext` context + custom hook, controlled forms, conditional rendering, lists with keys
- **React Router**: `Routes`/`Route`, `Navigate`, `Link`, `useNavigate`, and a role-guarded route wrapper
- **Frontend/backend integration**: a single `fetch` wrapper that attaches the token, a Vite dev proxy, and CORS configuration

Small pointers for explaining this project in an interview:

- **Dependency injection**: classes declare what they need in their
  constructor (`AuthService` needs a `UserRepository`); Spring creates the
  objects and passes them in. No `new` for beans, no manual wiring.
- **`@RestController`**: marks the HTTP layer. It combines `@Controller` (a
  bean that handles web requests) with `@ResponseBody` (the return value is
  serialized to JSON).
- **`@Service`**: the layer that holds business rules and transactions
  (`LeaveService`: balance checks, "only pending requests can be cancelled").
- **`@Repository`**: the database layer. `JpaRepository` implementations are
  generated by Spring Data from the method names (`findByEmail`).
- **JPA/Hibernate**: `@Entity` classes map to tables, `@ManyToOne` + `@JoinColumn`
  become foreign keys, and Hibernate turns repository calls into SQL.
- **REST**: URLs name resources, HTTP methods name the action
  (`POST /api/leaves`, `PATCH /api/leaves/{id}/cancel`), status codes express
  the result.
- **JWT authentication**: at login the server signs a token containing the
  email and role. The frontend stores it and sends it in the `Authorization`
  header. `JwtAuthFilter` verifies the signature and puts the user in the
  security context for that request.
- **Spring Security**: `SecurityConfig` decides which paths are public,
  which need a role (`hasRole("MANAGER")`) and that sessions are stateless.
  Passwords are stored as BCrypt hashes.
- **React routing**: `App.jsx` maps URLs to pages with `<Routes>/<Route>`;
  `ProtectedRoute` redirects users who are not logged in.
- **React state**: `useState` for a page's data, `useEffect` to load it,
  and `AuthContext` (`useAuth()`) to share "who is logged in" everywhere.

---

## Known limitations

**This is a teaching project, not a production-ready system.**

- Authentication is intentionally simplified: no refresh tokens, password reset, or account-locking mechanisms.
- Each user has one leave-balance record per leave type. Holiday calendars and half-day leave are intentionally out of scope.
- Leave balances are updated only when a request is approved and apply exclusively to the current year.
- Approved or rejected leave requests cannot be modified.
- The frontend uses plain CSS without any UI framework or component library, with a single hand-written stylesheet containing design tokens and responsive breakpoints.
