# Project Handoff

## Status
- Current overall status: Complete, running and verified end to end against the local PostgreSQL database. Every listed feature was exercised over HTTP and returned the expected status codes and data; two real defects found during that run were fixed (see Verification).
- Backend status: Compiles cleanly, `mvn test` passes (1/1), and `mvn clean package` produces `backend/target/leave-management-system-0.0.1-SNAPSHOT.jar` (58 MB, executable). The packaged jar starts in ~3.5s, seeds demo data and serves all endpoints.
- Frontend status: `npm run build` succeeds (33 modules, `dist/` produced). Dev server on port 5173 serves the app, supports deep links (`/employee`, `/manager`) and proxies `/api` to the backend.
- Database status: Created and working. `leave_db` owned by `leave_user` exists on the local PostgreSQL 14 cluster (port 5432); Hibernate created the three tables and `DataInitializer` seeded the two demo users with their balances. Connection over JDBC with `leave_user` / `leave_password` verified with psql and with the application.

## What Was Implemented
- Backend REST API (Java 21, Spring Boot 4.1.1, Maven) in the conventional Controller → Service → Repository → Database layering.
- JWT authentication: register, login, `Authorization: Bearer <token>` on every subsequent request, stateless (no HTTP session).
- Two roles, `EMPLOYEE` and `MANAGER`, enforced by Spring Security: `/api/manager/**` requires `hasRole("MANAGER")`.
- Employee features: own profile, leave balances per leave type, apply for leave, list own requests, cancel own pending request.
- Manager features: list pending requests, approve (books days against the balance), reject, list employees.
- Leave rules: statuses PENDING/APPROVED/REJECTED/CANCELLED; only PENDING requests can be cancelled/approved/rejected; a request must fit the remaining balance of its type; employees can only cancel their own requests.
- Bean Validation on request bodies, mapped to `400` with per-field messages by a small `@RestControllerAdvice`.
- Demo data seeder that creates one manager and one employee with default balances on first startup.
- React 19 + Vite + React Router frontend with four pages, an auth context, a shared fetch wrapper, and a dev-server proxy so no CORS/backend URL config is needed in the browser.
- Root `start.sh` that starts backend and frontend together and stops both on Ctrl+C.
- `README.md` (setup, run, usage, API overview, learning notes), `setup-db.sql`, and `PROJECT_CODE_MAP.md` (file-by-file map of the implementation for study purposes).
- Fixes applied during final verification: (1) `SecurityConfig` now permits the internal `/error` dispatch, which was turning every 400/403 on a protected URL into a 401; (2) `GlobalExceptionHandler` now maps an unreadable request body (malformed JSON, unknown enum value, bad date) to a clean 400; (3) `frontend/src/api.js` falls back to the error body's `error` field so 401/403 responses show a readable message.

## Files Created/Modified
- backend/pom.xml: MODIFIED
  - purpose: Maven build definition.
  - important implementation details: adds `spring-boot-starter-webmvc` (Web), `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `spring-boot-starter-validation`, `postgresql` (runtime), `jjwt-api`/`jjwt-impl`/`jjwt-jackson` 0.12.6 (`${jjwt.version}`), and `spring-boot-starter-webmvc-test`. Parent stays at the scaffold's Spring Boot 4.1.1; empty scaffold `<name/>`, `<url/>`, `<licenses/>`, `<developers/>`, `<scm/>` placeholder tags were removed and `<name>`/`<description>` filled in.
- backend/src/main/resources/application.properties: MODIFIED
  - purpose: datasource + JPA + JWT configuration.
  - important implementation details: `spring.datasource.url/username/password` read `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` with local defaults (`jdbc:postgresql://localhost:5432/leave_db`, `leave_user`, `leave_password`) — no secrets in the file. `spring.jpa.hibernate.ddl-auto=update`, `show-sql=true`, `open-in-view=false`. `jwt.secret` (≥32 chars, env-overridable) and `jwt.expiration-ms` = 24h.
- backend/src/main/java/com/ashlesh/leavemanagement/entity/: CREATED (Role, User, LeaveType, LeaveStatus, LeaveBalance, LeaveRequest)
  - purpose: JPA entities = database tables.
  - important implementation details: `User` → `users` (unique email, BCrypt-hashed password, `@Enumerated(STRING)` role); `LeaveBalance` → `leave_balances` with a unique constraint on `(user_id, leave_type)` and a `@Transient getRemainingDays()`; `LeaveRequest` → `leave_requests` with `@ManyToOne` user, `@Enumerated(STRING)` type/status, `LocalDate` start/end, `@Transient getDays()` = inclusive day count; `LeaveType` carries `defaultDays` (CASUAL 12, SICK 8, EARNED 15) so registration and the seeder share one source of truth.
- backend/src/main/java/com/ashlesh/leavemanagement/repository/: CREATED (UserRepository, LeaveBalanceRepository, LeaveRequestRepository)
  - purpose: Spring Data JPA data access.
  - important implementation details: only derived query methods — `findByEmail`, `existsByEmail`, `findByRole`, `findByUserId`, `findByUserIdAndLeaveType`, `findByUserIdOrderByAppliedAtDesc`, `findByStatusOrderByAppliedAtAsc`. No hand-written SQL.
- backend/src/main/java/com/ashlesh/leavemanagement/dto/: CREATED (RegisterRequest, LoginRequest, AuthResponse, UserProfileResponse, LeaveBalanceResponse, ApplyLeaveRequest, LeaveRequestResponse)
  - purpose: request/response shapes; entities are never returned directly.
  - important implementation details: Java records. Request records carry Jakarta Validation annotations (`@NotBlank`, `@Email`, `@Size`, `@NotNull`). Response records have a static `from(entity)` factory; `LeaveRequestResponse` includes `employeeName` so the manager view can show who applied. Passwords are never in a response.
- backend/src/main/java/com/ashlesh/leavemanagement/service/: CREATED (AuthService, EmployeeService, LeaveService)
  - purpose: business logic layer, constructor-injected dependencies.
  - important implementation details: `AuthService` lower-cases emails, hashes with `PasswordEncoder`, delegates credential checking to `AuthenticationManager` (so a wrong password surfaces as `BadCredentialsException` → 401), returns a JWT, and creates the default balance rows. `EmployeeService` resolves the logged-in `User` by email (also used by `LeaveService`) and reads balances/employee list. `LeaveService` holds every leave rule and is the only class that changes statuses; approve increments `usedDays`. `getMyLeaves`/`getPendingLeaves` are `@Transactional(readOnly = true)` because they read the lazy `@ManyToOne` employee name while mapping.
- backend/src/main/java/com/ashlesh/leavemanagement/security/: CREATED (JwtService, CustomUserDetailsService, JwtAuthFilter, SecurityConfig)
  - purpose: JWT creation/validation and Spring Security configuration.
  - important implementation details: `JwtService` signs HMAC tokens with `Keys.hmacShaKeyFor(secret)` (jjwt chooses HS256/HS384/HS512 by key length - HS384 with the default secret) and verifies with `Jwts.parser().verifyWith(key)`; `CustomUserDetailsService` bridges the `users` table to Spring Security's `UserDetails` (`.roles(...)` adds the `ROLE_` prefix); `JwtAuthFilter extends OncePerRequestFilter` reads the bearer token and populates the `SecurityContext`; `SecurityConfig` disables CSRF (stateless JSON API), sets `SessionCreationPolicy.STATELESS`, permits `/api/auth/**`, requires `MANAGER` for `/api/manager/**`, requires authentication elsewhere, returns 401 via an explicit `AuthenticationEntryPoint`, adds the JWT filter before `UsernamePasswordAuthenticationFilter`, and exposes `PasswordEncoder` (BCrypt), a CORS source for `http://localhost:5173` and the `AuthenticationManager`. It also permits `/error`: Spring Boot forwards every error response to that path, and because `OncePerRequestFilter` skips error dispatches the forward arrives without a token - without that line Spring Security would replace every 400/403 on a protected URL with a 401.
- backend/src/main/java/com/ashlesh/leavemanagement/controller/: CREATED (AuthController, EmployeeController, LeaveController, ManagerController)
  - purpose: HTTP layer only — translate requests into service calls.
  - important implementation details: paths exactly as specified (`POST /api/auth/register|login`, `GET /api/employees/me`, `GET /api/employees/me/balances`, `POST /api/leaves`, `GET /api/leaves`, `PATCH /api/leaves/{id}/cancel`, `GET /api/manager/leaves/pending`, `PATCH /api/manager/leaves/{id}/approve|reject`, `GET /api/manager/employees`). `@Valid @RequestBody` on writes; register returns `201 Created` via `ResponseEntity`; the current user comes from the `Authentication` parameter (`getName()` = the email in the JWT).
- backend/src/main/java/com/ashlesh/leavemanagement/exception/GlobalExceptionHandler.java: CREATED
  - purpose: map exceptions to HTTP status codes and clean JSON bodies.
  - important implementation details: `MethodArgumentNotValidException` → 400 with an `errors` map, `HttpMessageNotReadableException` → 400 (malformed JSON / unknown enum value / unparsable date), `BadCredentialsException` → 401, `IllegalArgumentException`/`IllegalStateException` → 400, `NoSuchElementException` → 404. `AccessDeniedException` is intentionally not handled so Spring Security returns 403.
- backend/src/main/java/com/ashlesh/leavemanagement/config/DataInitializer.java: CREATED
  - purpose: create demo manager + employee accounts on startup.
  - important implementation details: `CommandLineRunner`; reuses `AuthService.register(...)` (which also creates the balance rows) and then promotes the manager to `Role.MANAGER`; guarded by `existsByEmail` so restarts do not duplicate users.
- backend/src/main/java/com/ashlesh/leavemanagement/LeaveManagementSystemApplication.java: UNCHANGED (scaffold `@SpringBootApplication`)
- backend/src/test/java/com/ashlesh/leavemanagement/LeaveManagementSystemApplicationTests.java: UNCHANGED (scaffold `contextLoads`, needs PostgreSQL running)
- frontend/package.json: CREATED
  - purpose: npm scripts and dependencies.
  - important implementation details: `dev`/`build`/`preview` scripts; react 19.3, react-dom 19.3, react-router-dom 7.18.4, vite 8.3, @vitejs/plugin-react 6.1 (versions resolved by npm install).
- frontend/vite.config.js: CREATED
  - purpose: dev server + proxy.
  - important implementation details: `/api` → `http://localhost:8080` proxy (so the browser is same-origin and no backend URL is hardcoded), port 5173.
- frontend/index.html, frontend/src/main.jsx, frontend/src/App.jsx: CREATED
  - purpose: entry point and route table.
  - important implementation details: `BrowserRouter` + `AuthProvider` wrap the app; routes `/`, `/login`, `/register`, `/employee`, `/manager`, `*`; `/employee` and `/manager` are wrapped in `ProtectedRoute` with the matching role; `/` redirects by role.
- frontend/src/api.js: CREATED
  - purpose: single place that talks to the backend.
  - important implementation details: `fetch` wrapper using the relative base `/api`, adds `Content-Type: application/json` when there is a body and `Authorization: Bearer <token>` when logged in, throws `Error(data.message || data.error || 'Request failed with status N')` on non-2xx (our handlers send `message`, Spring Boot's error page sends `error`). Exposes one function per endpoint.
- frontend/src/auth/authStorage.js and frontend/src/auth/AuthContext.jsx: CREATED
  - purpose: keep the token/user in `localStorage` and share it through React context.
  - important implementation details: `saveAuth`/`loadAuth`/`clearAuth`/`getToken` under key `lms_auth`; `AuthProvider` holds `auth` state, exposes `login`, `register`, `logout`; `useAuth()` throws if used outside the provider.
- frontend/src/components/Navbar.jsx and frontend/src/components/ProtectedRoute.jsx: CREATED
  - purpose: shared chrome and role-based guarding.
  - important implementation details: navbar shows name + role and a logout button; `ProtectedRoute` redirects anonymous users to `/login` and wrong-role users to their own dashboard (backend still enforces security).
- frontend/src/pages/Login.jsx, Register.jsx, EmployeeDashboard.jsx, ManagerDashboard.jsx: CREATED
  - purpose: the four screens.
  - important implementation details: login/register use `useAuth()` then `navigate()` by role; dashboards load data with `useEffect` + `Promise.all` and re-load after each action; employee page has profile, balance table, apply form and own-request table with a Cancel button for PENDING rows; manager page has pending requests with Approve/Reject and an employee list. Login form is pre-filled with the demo employee credentials.
- start.sh: CREATED (mode 755)
  - purpose: start backend + frontend together.
  - important implementation details: checks for `java`, `node` and `frontend/node_modules`, warns if `pg_isready` fails on 5432, starts `./mvnw spring-boot:run` and `npm run dev` in the background, and kills both on Ctrl+C via a `trap`.
- setup-db.sql: CREATED
  - purpose: one-shot local database setup.
  - important implementation details: `CREATE ROLE leave_user WITH LOGIN PASSWORD 'leave_password'` + `CREATE DATABASE leave_db OWNER leave_user`; containers/tables are left to Hibernate.
- README.md: CREATED — project overview, tech stack, features, structure, prerequisites, database setup, both run options, demo accounts, usage walkthrough, API table with status codes, curl example, configuration/env vars, test command, interview concepts demonstrated, known limitations.
- PROJECT_CODE_MAP.md: CREATED (after the first handoff) — file-by-file map of the implementation (packages, classes, controllers, services, repositories, entities, DTOs, security, database, React structure, the three request flows, dependencies, interview concepts, likely interview questions, known limitations, suggested learning order).
- .gitignore (root): CREATED — backend `target/`, frontend `node_modules/` + `dist/`, `.env`, IDE folders.
- frontend/.gitignore: CREATED — node_modules, dist, .vite.

## Backend
### Endpoints
- POST /api/auth/register — create an EMPLOYEE account, return a JWT (201)
- POST /api/auth/login — verify credentials, return a JWT (200, or 401)
- GET /api/employees/me — profile of the logged-in user
- GET /api/employees/me/balances — leave balance per leave type
- POST /api/leaves — apply for leave (201)
- GET /api/leaves — own leave requests, newest first
- PATCH /api/leaves/{id}/cancel — cancel own PENDING request
- GET /api/manager/leaves/pending — all PENDING requests (MANAGER)
- PATCH /api/manager/leaves/{id}/approve — approve and book the days (MANAGER)
- PATCH /api/manager/leaves/{id}/reject — reject, balance untouched (MANAGER)
- GET /api/manager/employees — list employees (MANAGER)

### Entities
- User (`users`):
  - fields: id (identity), name, email (unique), password (BCrypt hash), role (enum string)
  - relationships: referenced by LeaveBalance.user and LeaveRequest.user (no collections mapped)
- LeaveBalance (`leave_balances`):
  - fields: id, leaveType (enum string), totalDays, usedDays; computed `remainingDays` (`@Transient`)
  - relationships: `@ManyToOne(LAZY)` → User via `user_id`; unique constraint on `(user_id, leave_type)`
- LeaveRequest (`leave_requests`):
  - fields: id, leaveType (enum string), startDate, endDate, reason (≤500), status (enum string, defaults PENDING), appliedAt; computed `days` (`@Transient`, inclusive)
  - relationships: `@ManyToOne(LAZY)` → User via `user_id`
- Enums: `Role` (EMPLOYEE, MANAGER), `LeaveType` (CASUAL 12, SICK 8, EARNED 15), `LeaveStatus` (PENDING, APPROVED, REJECTED, CANCELLED)

### Services
- AuthService: register (uniqueness check, BCrypt hashing, default balances, JWT), login (AuthenticationManager + JWT), `createDefaultBalances`
- EmployeeService: `findUser(email)`, `getProfile(email)`, `getBalances(email)`, `getAllEmployees()` (role EMPLOYEE only)
- LeaveService: `apply` (date order check, days calculation, balance check), `getMyLeaves`, `cancel` (ownership + PENDING check), `getPendingLeaves`, `approve` (PENDING check + `usedDays += days`), `reject` (PENDING check)

### Security
- Authentication: `POST /api/auth/login` verifies the password through `AuthenticationManager` → `CustomUserDetailsService` (loads from `users`) + `BCryptPasswordEncoder`; register hashes the password before saving. Passwords are never returned.
- Authorization: denied by URL pattern in `SecurityConfig` — `/api/auth/**` public, `/api/manager/**` requires `ROLE_MANAGER`, everything else requires a valid token. Missing/invalid token → 401 (explicit `AuthenticationEntryPoint`); authenticated but wrong role or someone else's leave request (`AccessDeniedException`) → 403. Sessions are stateless; CSRF is disabled because no cookies are used.
- JWT implementation: jjwt 0.12.6, HMAC-SHA signed (the algorithm is chosen from the key length: HS384 with the default 53-character secret, HS256 if the key is 32-47 bytes). Payload carries `sub` (email), `role`, `name`, `iat`, `exp` (24h from `jwt.expiration-ms`). The secret comes from `jwt.secret` (env-overridable, dev default ≥32 chars). The token is issued by `JwtService.generateToken`, sent by the frontend as `Authorization: Bearer …`, and verified by `JwtAuthFilter` on every request, which puts a `UsernamePasswordAuthenticationToken` into the `SecurityContext`.

## Frontend
### Pages
- Login (`/login`) — email/password form, pre-filled demo employee credentials, redirects to `/employee` or `/manager` by role.
- Register (`/register`) — name/email/password; always creates an EMPLOYEE; on success goes to `/employee`.
- Employee (`/employee`, role EMPLOYEE) — profile, leave balance table, apply-for-leave form, own leave request table with a Cancel button on PENDING rows.
- Manager (`/manager`, role MANAGER) — pending leave request table with Approve/Reject, and an employee list.

### Components
- Navbar — app title link, logged-in name + role, Log out button.
- ProtectedRoute — redirect to `/login` when anonymous, to the user's own dashboard when the role does not match.

### State / Context
- `AuthContext` (`AuthProvider` + `useAuth()`) holds the logged-in `{ token, name, email, role }`, exposes `login`, `register`, `logout`, and persists it in `localStorage` (`lms_auth`) so a refresh keeps you logged in.
- Page-level state is plain `useState`; data is loaded in `useEffect` and re-loaded after each action. No Redux.
- `src/api.js` is the only module that performs HTTP calls; it reads the token from `authStorage`.

## Database
- Database: PostgreSQL (local only), database `leave_db`, owner/role `leave_user`. Created and in use on this machine (PostgreSQL 14, port 5432). `setup-db.sql` at the repository root recreates it from scratch. Current contents: 2 demo users, 6 balance rows, 3 leave requests (one CANCELLED, one APPROVED, one REJECTED) left over from the verification run as demo history.
- Tables: `users`, `leave_balances`, `leave_requests` — all created/updated by Hibernate from the entities (`ddl-auto=update`). No migration tool.
- Relationships: `leave_balances.user_id → users.id` (many-to-one, unique per `(user_id, leave_type)`); `leave_requests.user_id → users.id` (many-to-one). Enum columns are stored as strings.

## Dependencies Added
- spring-boot-starter-webmvc: Spring MVC REST controllers + embedded Tomcat (this is the Spring Boot 4 name for the Web starter).
- spring-boot-starter-data-jpa: Spring Data repositories + Hibernate ORM.
- spring-boot-starter-security: authentication, authorization, password hashing, filter chain.
- spring-boot-starter-validation: Bean Validation (`@NotBlank`, `@Email`, `@Size`, `@NotNull`) on request bodies.
- org.postgresql:postgresql: JDBC driver for PostgreSQL.
- io.jsonwebtoken:jjwt-api / jjwt-impl / jjwt-jackson 0.12.6: sign, verify and parse JWTs (`api` compiles, `impl` + `jackson` are runtime only).
- spring-boot-starter-webmvc-test (test): JUnit 5 + Spring test support; keeps the scaffold `contextLoads` test compiling.
- Frontend: react, react-dom, react-router-dom (routing); vite + @vitejs/plugin-react (dev/build tooling). No state, UI or HTTP library — `fetch` and `useState` are enough.

## Commands Used
- `mvn -B compile` (backend compile; downloaded security/jjwt/validation and surfaced the Spring Boot 4 API differences)
- `mvn -B compile -Dmaven.compiler.showDeprecation=true` (found `org.springframework.lang.NonNull` removed → annotations dropped from `JwtAuthFilter`)
- `mvn -B package -DskipTests` (downloads runtime-scope jars, builds the executable jar)
- `mvn -B test-compile` (test sources compile)
- `mvn -B -o clean package -DskipTests` (verifies the build works offline from the local Maven cache)
- `java -jar target/leave-management-system-0.0.1-SNAPSHOT.jar` (startup check; expect a datasource failure until the database exists)
- `./mvnw -v` (Maven wrapper verified, Maven 3.9.16 cached in `~/.m2/wrapper`)
- `npm install react react-dom react-router-dom`, `npm install -D vite @vitejs/plugin-react`
- `npm run build` (frontend production build)
- `bash -n start.sh` (shell syntax check)
- Read-only inspection of the machine: `java -version`, `node -v`, `psql --version`, `pg_lsclusters`, `pg_isready`, `psql -U ashlesh -d postgres -c "\du"` / `"\l"`, `ls /usr/lib/postgresql/16/bin`
- `mvn test` (contextLoads against the real database)
- `mvn -B -o package -DskipTests`, then `java -jar target/leave-management-system-0.0.1-SNAPSHOT.jar` (runtime verification on port 8080)
- psql inspection with `PGPASSWORD=leave_password psql -h localhost -U leave_user -d leave_db`: `\dt`, plus selects on `users`, `leave_balances`, `leave_requests`
- curl workflow suite against `http://localhost:8080` (register, duplicate register, validation, login, wrong password, unknown email, profile, balances, apply, over-balance apply, reversed dates, invalid leave type, own history, cross-user cancel, cancel, approve, double approve, reject, unknown ids, unauthenticated and garbage-token requests, wrong-role requests)
- `npm run dev` (Vite on port 5173) then curl against `http://localhost:5173`: `/`, `/employee`, `/manager`, `POST /api/auth/login`, `GET /api/employees/me`, `GET /api/leaves`, `GET /api/manager/leaves/pending`
- `curl -X OPTIONS` and `curl -D -` with `Origin: http://localhost:5173` to check the CORS preflight and response headers
- SQL cleanup of the verification account: `delete from leave_requests/leave_balances/users where email like 'test%@leave.com'`

## Verification
All checks below were run after the two backend fixes and the frontend error-message tweak.

- Build: PASS. Backend `mvn clean package` → BUILD SUCCESS, `backend/target/leave-management-system-0.0.1-SNAPSHOT.jar` (58 MB). Offline build (`mvn -o clean package -DskipTests`) → PASS after the surefire provider jar had been fetched once. Frontend `npm run build` → PASS (33 modules, `dist/index.html` 0.40 kB, CSS 1.29 kB, JS 270.46 kB).
- Tests: PASS. `mvn test` → `Tests run: 1, Failures: 0, Errors: 0, Skipped: 0` (the scaffold `contextLoads` boots the full context against the real database; its log shows the `users` queries from `DataInitializer`). Test sources compile in offline mode too.
- Database: PASS. psql confirmed three tables owned by `leave_user` (`users`, `leave_balances`, `leave_requests`), two demo users with BCrypt hashes (`$2a$10$...`), six balance rows (CASUAL 12 / SICK 8 / EARNED 15), and consistent request history. `DataInitializer` is idempotent - a second start created no duplicates.
- Application start: PASS. `java -jar target/leave-management-system-0.0.1-SNAPSHOT.jar` → “Tomcat started on port 8080”, “Started LeaveManagementSystemApplication in 3.556 seconds”, no ERROR lines in the log.
- API/security behaviour: PASS for every feature, verified with curl against the running jar.
  - register → 201 with token; duplicate email → 400; invalid email/short password → 400 with per-field `errors` map; login → 200 with token; wrong password → 401; unknown email → 401; malformed login body → 400.
  - authenticated `GET /api/employees/me` → 200 profile; `GET /api/employees/me/balances` → 200 with three rows and correct `remainingDays`.
  - apply leave → 201 with `status: PENDING`; 3-day range → `days: 3`; single-day range → `days: 1` (inclusive); 30 days against a 12-day balance → 400 “Not enough CASUAL leave…”; `endDate` before `startDate` → 400; blank reason → 400; unknown leave type → 400 with a readable message.
  - own history → 200, newest first, only the caller's requests; cancel own pending → 200 `CANCELLED`; cancel again → 400; cancel an approved request → 400; cancel someone else's request → 403 (ownership check).
  - manager: pending list → 200; employee list → 200; approve → 200 `APPROVED` and `usedDays` incremented (SICK 0 → 1, remaining 7); approve twice → 400; reject → 200 `REJECTED` with the balance unchanged; unknown id → 404 for both approve and cancel.
  - authorization: employee calling `/api/manager/**` → 403 (GET and PATCH); no token → 401; garbage token → 401; error bodies carry the right status (`401 Unauthorized`, `403 Forbidden`).
- Frontend integration: PASS. Dev server served `index.html` on 5173, deep links `/employee` and `/manager` both returned 200 with the SPA shell (so a page refresh works), login through the Vite proxy returned 200 with a token, authenticated `GET /api/employees/me` and `GET /api/leaves` through the proxy returned 200, a wrong-role call through the proxy returned 403, and CORS preflight (OPTIONS) plus a real GET from origin `http://localhost:5173` returned `Access-Control-Allow-Origin: http://localhost:5173` with the expected methods/headers.
- Fixes made because of these checks (not style changes):
  1. `SecurityConfig`: added `.requestMatchers("/error").permitAll()`. Before this, wrong-role requests returned **401 instead of 403**, and an unreadable body returned **401 instead of 400**, because Spring Boot's internal forward to `/error` was itself treated as a protected endpoint (and `OncePerRequestFilter` does not run on error dispatches, so the forward carried no token).
  2. `GlobalExceptionHandler`: added a handler for `HttpMessageNotReadableException` → 400 with a clear message, instead of falling through to Spring Boot's generic error page.
  3. `frontend/src/api.js`: error text now falls back to the body's `error` field, so 401/403 from Spring Security display a readable message.
- Test accounts created during verification (one `test…@leave.com` user and its balance rows) were deleted afterwards; the demo accounts and their leave history were left in place as demo data. No other data was touched, and the running servers were stopped.

## Current Git State
- Branch: none — this directory is **not a git repository** (`git status` → `fatal: not a git repository`). There is no `.git` directory at `~/Documents/code/leave-management-system`.
- Latest commit: none.
- Uncommitted changes: not applicable. (No `git init`, commit or push was performed. The scaffold's `backend/.gitignore` and a new root `.gitignore` are in place for whenever you initialise the repository.)
- Files not meant to be committed are ignored: `backend/target/`, `frontend/node_modules/`, `frontend/dist/`.

## Known Limitations
- No automated test coverage beyond the scaffold `contextLoads`; there are no unit tests for the leave rules and no API-level or MockMvc tests. The `contextLoads` test needs a running PostgreSQL, so `mvn test` fails on a machine where `setup-db.sql` has not been run.
- `LeaveService.approve` reads the balance, adds the days and saves it without optimistic locking (`@Version`) or an atomic SQL update, so two approvals processed concurrently for the same employee could compute `usedDays` from the same starting value.
- `frontend/src/pages/Login.jsx` pre-fills the demo employee credentials; remove that for anything beyond local demos.
- The JWT is stored in `localStorage` and cannot be revoked before it expires (24h default); there is no refresh token, logout blacklist, password reset or account lockout.
- One leave balance row per user per leave type, per year, and only the approve action changes `usedDays`. There is no holiday calendar, half-day support, overlap check between requests, or carry-over. Cancelling an already-approved request is not supported.
- CORS is configured for `http://localhost:5173` only, and the frontend relies on the Vite dev-server proxy, so a production build would need the API served on the same origin (or the CORS origin list widened).
- `spring.jpa.show-sql=true` and `ddl-auto=update` are development settings, not production ones.
- Timestamps use the server's default time zone; `appliedAt` is not exposed as a timezone-aware value.
- Spring Boot 4.1.1 specifics that differ from most online tutorials (worth knowing while studying): the Web starter is `spring-boot-starter-webmvc`, and test annotations such as `@AutoConfigureMockMvc`/`@WebMvcTest` live in `org.springframework.boot.webmvc.test.autoconfigure`, not the older `org.springframework.boot.test.autoconfigure.web.servlet` package.

## Next Recommended Step
- Rehearse the demo once from a clean start: `./start.sh`, then open `http://localhost:5173`; log in as `employee@leave.com / employee123`, apply for a leave that fits the balance, log out, log in as `manager@leave.com / manager123`, approve it, then log back in as the employee to show the updated balance (the database already contains one CANCELLED, one APPROVED and one REJECTED request as history). Everything shown has been verified to work, so nothing needs fixing first - only the walkthrough and the explanation need practice.
