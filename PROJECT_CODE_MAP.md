# Project Code Map

Map of the **Employee Leave Management System** exactly as it exists in this repository.
Backend: Java 21, Spring Boot 4.1.1, Maven. Frontend: React 19 + Vite + React Router (JavaScript).
Descriptions only - no source is reproduced here.

---

## 1. Root Structure

| Path | Purpose |
| ---- | ------- |
| `README.md` | Project overview, tech stack, database setup, run instructions, demo accounts, API table, learning notes. |
| `HANDOFF.md` | Handoff report: status, files created, features, verification results, known limitations. |
| `PROJECT_CODE_MAP.md` | This file. |
| `start.sh` | Bash script that starts the backend (`./mvnw spring-boot:run`) and the frontend (`npm run dev`) together and kills both on Ctrl+C. |
| `setup-db.sql` | One-time local PostgreSQL setup: creates role `leave_user` and database `leave_db`. No `CREATE TABLE` statements. |
| `.gitignore` | Excludes `backend/target/`, `frontend/node_modules/`, `frontend/dist/`, `.env`, IDE folders. |
| `backend/` | Spring Boot Maven project (own `.gitignore`, `mvnw`, `mvnw.cmd`, `.mvn/wrapper/`, `pom.xml`, `src/`, generated `target/`). |
| `frontend/` | Vite React project (`package.json`, `package-lock.json`, `vite.config.js`, `index.html`, `.gitignore`, `src/`, generated `node_modules/` and `dist/`). |

There is no `.git` directory: this is not a git repository.

---

## 2. Backend Structure

Single Maven module, package root `com.ashlesh.leavemanagement`.
Packages: `controller`, `service`, `repository`, `entity`, `dto`, `security`, `config`, `exception`.
29 classes in `src/main/java` plus the application class, and 1 test class in `src/test/java`.

### LeaveManagementSystemApplication
- **path**: `backend/src/main/java/com/ashlesh/leavemanagement/LeaveManagementSystemApplication.java`
- **annotations**: `@SpringBootApplication`
- **responsibility**: entry point; holds `main(String[])`.
- **dependencies used**: `org.springframework.boot.SpringApplication`.
- **important methods**: `main` calls `SpringApplication.run(LeaveManagementSystemApplication.class, args)`.

### LeaveManagementSystemApplicationTests
- **path**: `backend/src/test/java/com/ashlesh/leavemanagement/LeaveManagementSystemApplicationTests.java`
- **annotations**: `@SpringBootTest` (class), `@Test` (method)
- **responsibility**: scaffold test that only proves the Spring context starts.
- **dependencies used**: JUnit 5 (`org.junit.jupiter.api.Test`), Spring Boot test support.
- **important methods**: `contextLoads()` (empty body). Because it boots the full context it needs a reachable PostgreSQL.

#### package `entity`

### Role
- **path**: `entity/Role.java`
- **annotations**: none (plain `enum`)
- **responsibility**: the two user roles.
- **dependencies used**: none.
- **important methods**: constants `EMPLOYEE`, `MANAGER`.

### LeaveType
- **path**: `entity/LeaveType.java`
- **annotations**: none (plain `enum` with a constructor and field)
- **responsibility**: leave categories plus their default yearly allowance.
- **dependencies used**: none.
- **important methods**: constants `CASUAL(12)`, `SICK(8)`, `EARNED(15)`; `getDefaultDays()`.

### LeaveStatus
- **path**: `entity/LeaveStatus.java`
- **annotations**: none (plain `enum`)
- **responsibility**: leave request life cycle.
- **dependencies used**: none.
- **important methods**: constants `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

### User
- **path**: `entity/User.java`
- **annotations**: `@Entity`, `@Table(name = "users")`, fields: `@Id`, `@GeneratedValue(strategy = IDENTITY)`, `@Column(nullable = false)` / `@Column(nullable = false, unique = true)`, `@Enumerated(EnumType.STRING)`
- **responsibility**: a person who can log in (employee or manager).
- **dependencies used**: `jakarta.persistence.*`
- **important methods**: protected no-arg constructor for JPA; `User(String name, String email, String password, Role role)`; standard getters/setters for `name`, `email`, `password`, `role`; `getId()`.

### LeaveBalance
- **path**: `entity/LeaveBalance.java`
- **annotations**: `@Entity`, `@Table(name = "leave_balances", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "leave_type"}))`, `@Id`, `@GeneratedValue(IDENTITY)`, `@ManyToOne(fetch = LAZY, optional = false)`, `@JoinColumn(name = "user_id", nullable = false)`, `@Enumerated(EnumType.STRING)`, `@Column`, `@Transient` on the computed getter.
- **responsibility**: how many days of one leave type a user has.
- **dependencies used**: `jakarta.persistence.*`
- **important methods**: `LeaveBalance(User, LeaveType, int totalDays, int usedDays)`; `getRemainingDays()` (calculated, `totalDays - usedDays`, annotated `@Transient`); getters/setters for `totalDays`, `usedDays`; `getUser()`, `getLeaveType()`.

### LeaveRequest
- **path**: `entity/LeaveRequest.java`
- **annotations**: `@Entity`, `@Table(name = "leave_requests")`, `@Id`, `@GeneratedValue(IDENTITY)`, `@ManyToOne(fetch = LAZY, optional = false)`, `@JoinColumn(name = "user_id", nullable = false)`, `@Enumerated(EnumType.STRING)` on `leaveType` and `status`, `@Column` (`nullable = false`, `reason` has `length = 500`), `@Transient` on the computed getter.
- **responsibility**: one leave application made by one employee.
- **dependencies used**: `jakarta.persistence.*`, `java.time.LocalDate`, `java.time.LocalDateTime`, `java.time.temporal.ChronoUnit`.
- **important methods**: `LeaveRequest(User, LeaveType, LocalDate, LocalDate, String reason)`; `getDays()` (`ChronoUnit.DAYS.between(startDate, endDate) + 1`, `@Transient`); `setStatus(LeaveStatus)`; getters for `id`, `user`, `leaveType`, `startDate`, `endDate`, `reason`, `status`, `appliedAt`. `status` field initialises to `LeaveStatus.PENDING`, `appliedAt` to `LocalDateTime.now()`.

#### package `repository`

### UserRepository
- **path**: `repository/UserRepository.java`
- **annotations**: none on the interface
- **responsibility**: database access for `User`.
- **dependencies used**: extends `org.springframework.data.jpa.repository.JpaRepository<User, Long>`; imports `Role`, `User`, `Optional`, `List`.
- **important methods**: declared `findByEmail(String)`, `existsByEmail(String)`, `findByRole(Role)`. Everything else is inherited.

### LeaveBalanceRepository
- **path**: `repository/LeaveBalanceRepository.java`
- **annotations**: none
- **responsibility**: database access for `LeaveBalance`.
- **dependencies used**: extends `JpaRepository<LeaveBalance, Long>`; imports `LeaveType`, `Optional`, `List`.
- **important methods**: declared `findByUserId(Long)`, `findByUserIdAndLeaveType(Long, LeaveType)`.

### LeaveRequestRepository
- **path**: `repository/LeaveRequestRepository.java`
- **annotations**: none
- **responsibility**: database access for `LeaveRequest`.
- **dependencies used**: extends `JpaRepository<LeaveRequest, Long>`; imports `LeaveStatus`, `List`.
- **important methods**: declared `findByUserIdOrderByAppliedAtDesc(Long)`, `findByStatusOrderByAppliedAtAsc(LeaveStatus)`.

#### package `dto` (all Java `record`s)

### RegisterRequest
- **path**: `dto/RegisterRequest.java`
- **annotations**: `@NotBlank` (name), `@NotBlank` + `@Email` (email), `@NotBlank` + `@Size(min = 6)` (password); each with a `message`.
- **responsibility**: body of `POST /api/auth/register`.
- **dependencies used**: `jakarta.validation.constraints.*`
- **important methods**: accessors `name()`, `email()`, `password()` (record-generated).

### LoginRequest
- **path**: `dto/LoginRequest.java`
- **annotations**: `@NotBlank` + `@Email` (email), `@NotBlank` (password).
- **responsibility**: body of `POST /api/auth/login`.
- **dependencies used**: `jakarta.validation.constraints.*`
- **important methods**: `email()`, `password()`.

### AuthResponse
- **path**: `dto/AuthResponse.java`
- **annotations**: none
- **responsibility**: response of register and login.
- **dependencies used**: `entity.Role`
- **important methods**: `token()`, `name()`, `email()`, `role()`.

### UserProfileResponse
- **path**: `dto/UserProfileResponse.java`
- **annotations**: none
- **responsibility**: profile returned to the frontend (never contains the password).
- **dependencies used**: `entity.User`, `entity.Role`
- **important methods**: static `from(User user)` reading `getId()`, `getName()`, `getEmail()`, `getRole()`.

### LeaveBalanceResponse
- **path**: `dto/LeaveBalanceResponse.java`
- **annotations**: none
- **responsibility**: one balance row.
- **dependencies used**: `entity.LeaveBalance`, `entity.LeaveType`
- **important methods**: static `from(LeaveBalance balance)` using `getLeaveType()`, `getTotalDays()`, `getUsedDays()`, `getRemainingDays()`.

### ApplyLeaveRequest
- **path**: `dto/ApplyLeaveRequest.java`
- **annotations**: `@NotNull` (leaveType), `@NotNull` (startDate), `@NotNull` (endDate), `@NotBlank` + `@Size(max = 500)` (reason).
- **responsibility**: body of `POST /api/leaves`.
- **dependencies used**: `entity.LeaveType`, `jakarta.validation.constraints.*`, `java.time.LocalDate`
- **important methods**: `leaveType()`, `startDate()`, `endDate()`, `reason()`.

### LeaveRequestResponse
- **path**: `dto/LeaveRequestResponse.java`
- **annotations**: none
- **responsibility**: one leave request as returned by the API.
- **dependencies used**: `entity.LeaveRequest`, `LeaveStatus`, `LeaveType`, `java.time.LocalDate`, `java.time.LocalDateTime`
- **important methods**: static `from(LeaveRequest leave)`; reads id, `getUser().getId()`, `getUser().getName()`, type, dates, `getDays()`, reason, status, `getAppliedAt()`.

#### package `service`

### AuthService
- **path**: `service/AuthService.java`
- **annotations**: `@Service` (class)
- **responsibility**: registration and login.
- **dependencies used**: `UserRepository`, `LeaveBalanceRepository`, `PasswordEncoder`, `AuthenticationManager`, `JwtService`.
- **important methods**: `register(RegisterRequest)`, `login(LoginRequest)`, `createDefaultBalances(User)`.

### EmployeeService
- **path**: `service/EmployeeService.java`
- **annotations**: `@Service` (class)
- **responsibility**: read user profile, balances and the employee list.
- **dependencies used**: `UserRepository`, `LeaveBalanceRepository`, `Role`, `User`, `UserProfileResponse`, `LeaveBalanceResponse`.
- **important methods**: `findUser(String email)`, `getProfile(String email)`, `getBalances(String email)`, `getAllEmployees()`.

### LeaveService
- **path**: `service/LeaveService.java`
- **annotations**: `@Service`; `@Transactional` on `apply`, `cancel`, `approve`, `reject`; `@Transactional(readOnly = true)` on `getMyLeaves` and `getPendingLeaves`.
- **responsibility**: all leave rules and status changes.
- **dependencies used**: `LeaveRequestRepository`, `LeaveBalanceRepository`, `EmployeeService`, `AccessDeniedException`, `ChronoUnit`, `NoSuchElementException`.
- **important methods**: `apply(ApplyLeaveRequest, String email)`, `getMyLeaves(String email)`, `cancel(Long, String email)`, `getPendingLeaves()`, `approve(Long)`, `reject(Long)`, private `findLeave(Long)`.

#### package `controller`

### AuthController
- **path**: `controller/AuthController.java`
- **annotations**: `@RestController`, `@RequestMapping("/api/auth")`, `@PostMapping`, `@Valid`, `@RequestBody`
- **responsibility**: expose register and login.
- **dependencies used**: `AuthService`, `AuthResponse`, `LoginRequest`, `RegisterRequest`, `ResponseEntity`, `HttpStatus`.
- **important methods**: `register(RegisterRequest)` (returns `ResponseEntity` with 201), `login(LoginRequest)`.

### EmployeeController
- **path**: `controller/EmployeeController.java`
- **annotations**: `@RestController`, `@RequestMapping("/api/employees")`, `@GetMapping`
- **responsibility**: endpoints about the logged-in user.
- **dependencies used**: `EmployeeService`, `Authentication`, `List`, DTOs.
- **important methods**: `me(Authentication)`, `myBalances(Authentication)`.

### LeaveController
- **path**: `controller/LeaveController.java`
- **annotations**: `@RestController`, `@RequestMapping("/api/leaves")`, `@PostMapping`, `@GetMapping`, `@PatchMapping("/{id}/cancel")`, `@PathVariable`, `@Valid`, `@RequestBody`
- **responsibility**: employee side of the leave workflow.
- **dependencies used**: `LeaveService`, `Authentication`, `ResponseEntity`, DTOs.
- **important methods**: `apply(...)` (201), `myLeaves(Authentication)`, `cancel(Long, Authentication)`.

### ManagerController
- **path**: `controller/ManagerController.java`
- **annotations**: `@RestController`, `@RequestMapping("/api/manager")`, `@GetMapping`, `@PatchMapping`, `@PathVariable`
- **responsibility**: manager-only endpoints.
- **dependencies used**: `LeaveService`, `EmployeeService`, DTOs.
- **important methods**: `pendingLeaves()`, `approve(Long)`, `reject(Long)`, `employees()`.

#### package `security`

### JwtService
- **path**: `security/JwtService.java`
- **annotations**: `@Service`; constructor uses `@Value("${jwt.secret}")` and `@Value("${jwt.expiration-ms}")`
- **responsibility**: create and read JWTs.
- **dependencies used**: `io.jsonwebtoken.Jwts`, `Claims`, `JwtException`, `io.jsonwebtoken.security.Keys`, `javax.crypto.SecretKey`, `User`, `UserDetails`, `java.util.Date`.
- **important methods**: `generateToken(User)`, `extractEmail(String)`, `isTokenValid(String, UserDetails)`, private `parseClaims(String)`. `SecretKey` is built once in the constructor via `Keys.hmacShaKeyFor(secret.getBytes(UTF_8))`.

### CustomUserDetailsService
- **path**: `security/CustomUserDetailsService.java`
- **annotations**: `@Service` (implements `UserDetailsService`)
- **responsibility**: bridge the `users` table to Spring Security's `UserDetails`.
- **dependencies used**: `UserRepository`, `UserDetails`, `UsernameNotFoundException`.
- **important methods**: `loadUserByUsername(String email)` - `findByEmail(...).orElseThrow(UsernameNotFoundException)` then builds `org.springframework.security.core.userdetails.User.withUsername(...).password(...).roles(user.getRole().name()).build()`. Note the fully-qualified Spring `User` class to avoid clashing with the `User` entity.

### JwtAuthFilter
- **path**: `security/JwtAuthFilter.java`
- **annotations**: `@Component` (extends `OncePerRequestFilter`), `@Override` on `doFilterInternal`
- **responsibility**: authenticate each request from the bearer token.
- **dependencies used**: `JwtService`, `CustomUserDetailsService`, `SecurityContextHolder`, `UsernamePasswordAuthenticationToken`, `WebAuthenticationDetailsSource`, `jakarta.servlet.FilterChain`.
- **important methods**: `doFilterInternal(HttpServletRequest, HttpServletResponse, FilterChain)`; constant `BEARER_PREFIX = "Bearer "`.

### SecurityConfig
- **path**: `security/SecurityConfig.java`
- **annotations**: `@Configuration`, `@EnableWebSecurity` (class); `@Bean` on `passwordEncoder`, `authenticationManager`, `securityFilterChain`, `corsConfigurationSource`.
- **responsibility**: single place defining public paths, role rules, statelessness, entry point, CORS and the filter order. It also permits `/error`, the internal path Spring Boot forwards error responses to.
- **dependencies used**: `JwtAuthFilter`, `HttpSecurity`, `AuthenticationConfiguration`, `BCryptPasswordEncoder`, `PasswordEncoder`, `SecurityFilterChain`, `UsernamePasswordAuthenticationFilter`, `CorsConfiguration`, `UrlBasedCorsConfigurationSource`, static import of `HttpServletResponse.SC_UNAUTHORIZED`.
- **important methods**: `securityFilterChain(HttpSecurity)` (the configuration chain), `passwordEncoder()`, `authenticationManager(AuthenticationConfiguration)`, `corsConfigurationSource()`.

#### package `config`

### DataInitializer
- **path**: `config/DataInitializer.java`
- **annotations**: `@Component` (implements `CommandLineRunner`), `@Override` on `run`
- **responsibility**: create demo accounts on startup if they do not exist.
- **dependencies used**: `UserRepository`, `AuthService`, `RegisterRequest`, `Role`, `User`, `Logger`.
- **important methods**: `run(String...)` - guarded by `existsByEmail`; calls `authService.register(...)`, then promotes the manager account with `setRole(Role.MANAGER)` + `save`.

#### package `exception`

### GlobalExceptionHandler
- **path**: `exception/GlobalExceptionHandler.java`
- **annotations**: `@RestControllerAdvice` (class), `@ExceptionHandler` on four methods
- **responsibility**: convert exceptions into JSON error bodies with correct HTTP status codes.
- **dependencies used**: `MethodArgumentNotValidException`, `BadCredentialsException`, `NoSuchElementException`, `ResponseEntity`, `HttpStatus`, `Map`, `LinkedHashMap`.
- **important methods**: `handleValidation`, `handleUnreadableBody`, `handleBadCredentials`, `handleBadRequest`, `handleNotFound`.

---

## 3. Main Application

- Class: `com.ashlesh.leavemanagement.LeaveManagementSystemApplication`.
- Annotations: `@SpringBootApplication` - a shortcut for `@SpringBootConfiguration` + `@EnableAutoConfiguration` + `@ComponentScan` on the package `com.ashlesh.leavemanagement` and everything below it.
- Startup: `main` calls `SpringApplication.run(...)`. Spring then:
  1. scans that package and registers every `@Component`, `@Service`, `@Repository`, `@RestController`, `@Configuration` (including `security` and `config` classes),
  2. applies auto-configuration based on the classpath (embedded Tomcat, Spring MVC, DataSource/Hibernate, Spring Security, Jackson),
  3. reads `application.properties` (datasource, JPA, jwt.*),
  4. connects to PostgreSQL and runs Hibernate schema update from the entities,
  5. builds the `SecurityFilterChain`, and starts Tomcat on port 8080,
  6. runs `DataInitializer` (`CommandLineRunner`) which seeds the demo users.

---

## 4. Controllers

Every controller gets the current user's email from the `Authentication` parameter (which `JwtAuthFilter` populated). No `@PreAuthorize` is used anywhere; authorization is by URL pattern in `SecurityConfig`.

### AuthController - `/api/auth` (public)

| Endpoint | HTTP method | Request | Response | Service method | Auth |
| -------- | ----------- | ------- | -------- | -------------- | ---- |
| `/api/auth/register` | POST | `@Valid @RequestBody RegisterRequest` (name, email, password) | `ResponseEntity<AuthResponse>`, status `201 Created` (token, name, email, role) | `AuthService.register` | none (`permitAll`) |
| `/api/auth/login` | POST | `@Valid @RequestBody LoginRequest` (email, password) | `AuthResponse`, status `200` | `AuthService.login` | none (`permitAll`) |

### EmployeeController - `/api/employees` (authenticated)

| Endpoint | HTTP method | Request | Response | Service method | Auth |
| -------- | ----------- | ------- | -------- | -------------- | ---- |
| `/api/employees/me` | GET | `Authentication` (no body) | `UserProfileResponse` | `EmployeeService.getProfile` | any valid token |
| `/api/employees/me/balances` | GET | `Authentication` | `List<LeaveBalanceResponse>` | `EmployeeService.getBalances` | any valid token |

### LeaveController - `/api/leaves` (authenticated)

| Endpoint | HTTP method | Request | Response | Service method | Auth |
| -------- | ----------- | ------- | -------- | -------------- | ---- |
| `/api/leaves` | POST | `@Valid @RequestBody ApplyLeaveRequest` (leaveType, startDate, endDate, reason) + `Authentication` | `ResponseEntity<LeaveRequestResponse>` with `201 Created` | `LeaveService.apply` | any valid token |
| `/api/leaves` | GET | `Authentication` | `List<LeaveRequestResponse>` | `LeaveService.getMyLeaves` | any valid token |
| `/api/leaves/{id}/cancel` | PATCH | `@PathVariable Long id` + `Authentication` | `LeaveRequestResponse` | `LeaveService.cancel` | any valid token; service re-checks ownership |

### ManagerController - `/api/manager` (requires role MANAGER)

| Endpoint | HTTP method | Request | Response | Service method | Auth |
| -------- | ----------- | ------- | -------- | -------------- | ---- |
| `/api/manager/leaves/pending` | GET | none | `List<LeaveRequestResponse>` | `LeaveService.getPendingLeaves` | `hasRole("MANAGER")` |
| `/api/manager/leaves/{id}/approve` | PATCH | `@PathVariable Long id` | `LeaveRequestResponse` | `LeaveService.approve` | `hasRole("MANAGER")` |
| `/api/manager/leaves/{id}/reject` | PATCH | `@PathVariable Long id` | `LeaveRequestResponse` | `LeaveService.reject` | `hasRole("MANAGER")` |
| `/api/manager/employees` | GET | none | `List<UserProfileResponse>` | `EmployeeService.getAllEmployees` | `hasRole("MANAGER")` |

---

## 5. Services

### AuthService (`@Service`)
- Responsibilities: create accounts, hash passwords, hand out JWTs, create the default balance rows, verify credentials at login.
- Repository dependencies: `UserRepository`, `LeaveBalanceRepository`.
- Other dependencies: `PasswordEncoder`, `AuthenticationManager`, `JwtService`.
- Business logic:
  - email is lower-cased before any lookup or save,
  - `existsByEmail` guards duplicates and throws `IllegalArgumentException`,
  - new users are always `Role.EMPLOYEE`,
  - `passwordEncoder.encode(...)` stores a BCrypt hash,
  - after saving the user, `createDefaultBalances` inserts one `LeaveBalance` per `LeaveType.values()` with `type.getDefaultDays()` and `usedDays = 0`,
  - `login` delegates password checking to `authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, rawPassword))` and then issues a fresh token.
- Methods: `register(RegisterRequest)`, `login(LoginRequest)`, `createDefaultBalances(User)`.

### EmployeeService (`@Service`)
- Responsibilities: read-side queries for the logged-in user and the manager's employee list.
- Repository dependencies: `UserRepository`, `LeaveBalanceRepository`.
- Business logic: `findUser` throws `IllegalArgumentException` when the email from the token has no row; `getAllEmployees` filters with `findByRole(Role.EMPLOYEE)` so managers are not listed as employees; `getBalances` maps rows with `LeaveBalanceResponse::from`.
- Methods: `findUser(String)`, `getProfile(String)`, `getBalances(String)`, `getAllEmployees()`. Also used by `LeaveService` (service-to-service dependency, no cycle: `LeaveService` → `EmployeeService`, `AuthService` → repositories only).

### LeaveService (`@Service`)
- Responsibilities: every leave rule and every status change.
- Repository dependencies: `LeaveRequestRepository`, `LeaveBalanceRepository`; plus `EmployeeService` to resolve the caller.
- Business logic:
  - `apply`: rejects `endDate` before `startDate`; computes inclusive days (`DAYS.between(start, end) + 1`); loads the balance row for `(userId, leaveType)`; rejects the request when `days > remainingDays`; saves a new `LeaveRequest` whose status defaults to `PENDING`. `@Transactional`.
  - `getMyLeaves`: newest first; `@Transactional(readOnly = true)` so the lazy `@ManyToOne` employee name can be read while mapping.
  - `cancel`: throws `AccessDeniedException` when the request belongs to another user, and `IllegalStateException` when the status is not `PENDING`; sets `CANCELLED` and saves.
  - `getPendingLeaves`: `findByStatusOrderByAppliedAtAsc(PENDING)`.
  - `approve`: requires `PENDING`, adds `getDays()` to `usedDays` and saves the balance, then sets `APPROVED`.
  - `reject`: requires `PENDING`, sets `REJECTED`, leaves the balance untouched.
  - private `findLeave`: `findById(...).orElseThrow(NoSuchElementException)`.
- Methods: `apply`, `getMyLeaves`, `cancel`, `getPendingLeaves`, `approve`, `reject`, `findLeave`.

---

## 6. Repositories

All three are interfaces that extend `org.springframework.data.jpa.repository.JpaRepository`, carry no `@Repository` annotation and contain only method declarations.

`JpaRepository` automatically provides: `save`, `saveAll`, `findById`, `findAll`, `existsById`, `count`, `deleteById`, `delete`, `deleteAll`, plus paging/sorting (`findAll(Sort)`, `findAll(Pageable)`) and flushing. Spring Data generates the implementation class at startup (proxied into the context as a bean) - there is no hand-written implementation anywhere in this project.

| Repository | Entity managed | ID type | Declared methods | Derived query semantics |
| ---------- | -------------- | ------- | ---------------- | ----------------------- |
| `UserRepository` | `User` | `Long` | `findByEmail(String)`, `existsByEmail(String)`, `findByRole(Role)` | `WHERE email = ?`, `SELECT count(*) > 0 WHERE email = ?`, `WHERE role = ?` |
| `LeaveBalanceRepository` | `LeaveBalance` | `Long` | `findByUserId(Long)`, `findByUserIdAndLeaveType(Long, LeaveType)` | traverse `user.id` (`WHERE user_id = ?`), and `WHERE user_id = ? AND leave_type = ?` |
| `LeaveRequestRepository` | `LeaveRequest` | `Long` | `findByUserIdOrderByAppliedAtDesc(Long)`, `findByStatusOrderByAppliedAtAsc(LeaveStatus)` | `WHERE user_id = ? ORDER BY applied_at DESC`, `WHERE status = ? ORDER BY applied_at ASC` |

---

## 7. Entities

All entities use field access (the `@Id` sits on a field), identity-generated primary keys and `jakarta.persistence` annotations. Enum columns are stored as `VARCHAR` (`@Enumerated(EnumType.STRING)`).

### User
- Table: `users`
- Primary key: `id` (`Long`, `@GeneratedValue(strategy = IDENTITY)`), no setter.
- Fields:
  | Field | Type | Annotations / constraints |
  | ----- | ---- | ------------------------- |
  | `id` | `Long` | `@Id`, `@GeneratedValue(IDENTITY)` |
  | `name` | `String` | `@Column(nullable = false)` |
  | `email` | `String` | `@Column(nullable = false, unique = true)` |
  | `password` | `String` | `@Column(nullable = false)` - stores a BCrypt hash |
  | `role` | `Role` (enum) | `@Enumerated(EnumType.STRING)`, `@Column(nullable = false)` |
- Relationships: none mapped on this side; it is the "one" side for both other entities.
- Constructors: protected no-arg (JPA) + `User(String, String, String, Role)`.

### LeaveBalance
- Table: `leave_balances`, with `@UniqueConstraint(columnNames = {"user_id", "leave_type"})`.
- Primary key: `id` (`Long`, identity), no setter.
- Fields:
  | Field | Type | Annotations / constraints |
  | ----- | ---- | ------------------------- |
  | `id` | `Long` | `@Id`, `@GeneratedValue(IDENTITY)` |
  | `user` | `User` | `@ManyToOne(fetch = LAZY, optional = false)`, `@JoinColumn(name = "user_id", nullable = false)` |
  | `leaveType` | `LeaveType` | `@Enumerated(STRING)`, `@Column(name = "leave_type", nullable = false)` |
  | `totalDays` | `int` | `@Column(nullable = false)` |
  | `usedDays` | `int` | `@Column(nullable = false)` |
  | `remainingDays` | `int` (computed) | `@Transient` getter `getRemainingDays()` - not a column |
- Constraints: one row per user per leave type (unique `user_id` + `leave_type`); no explicit setter for `user` or `leaveType` (set through the constructor).

### LeaveRequest
- Table: `leave_requests`
- Primary key: `id` (`Long`, identity), no setter.
- Fields:
  | Field | Type | Annotations / constraints |
  | ----- | ---- | ------------------------- |
  | `id` | `Long` | `@Id`, `@GeneratedValue(IDENTITY)` |
  | `user` | `User` | `@ManyToOne(fetch = LAZY, optional = false)`, `@JoinColumn(name = "user_id", nullable = false)` |
  | `leaveType` | `LeaveType` | `@Enumerated(STRING)`, `@Column(nullable = false)` |
  | `startDate` | `LocalDate` | `@Column(nullable = false)` |
  | `endDate` | `LocalDate` | `@Column(nullable = false)` |
  | `reason` | `String` | `@Column(nullable = false, length = 500)` |
  | `status` | `LeaveStatus` | `@Enumerated(STRING)`, `@Column(nullable = false)`, field default `PENDING` |
  | `appliedAt` | `LocalDateTime` | `@Column(nullable = false)`, field default `LocalDateTime.now()`, no setter |
  | `days` | `long` (computed) | `@Transient` getter `getDays()` - not a column |
- Constructors: protected no-arg (JPA) + `LeaveRequest(User, LeaveType, LocalDate, LocalDate, String)`. Only `status` has a setter.

### Relationships

```
User 1 ────────── * LeaveRequest          (@ManyToOne from LeaveRequest.user, FK leave_requests.user_id)
User 1 ────────── * LeaveBalance          (@ManyToOne from LeaveBalance.user, FK leave_balances.user_id)
LeaveBalance ✓ unique (user_id, leave_type)   -> one row per user per leave type
```

Unidirectional only: `User` has no `@OneToMany` collections, so nothing is cascaded and no collection is fetched when loading a user.

### Enums
- `Role`: `EMPLOYEE`, `MANAGER`.
- `LeaveType`: `CASUAL(12)`, `SICK(8)`, `EARNED(15)` - carries `defaultDays`.
- `LeaveStatus`: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.

---

## 8. DTOs

All DTOs are Java `record`s in `dto/`; entities are never returned directly by a controller.

| DTO | Purpose | Fields | Validation annotations | Used by |
| --- | ------- | ------ | ---------------------- | ------- |
| `RegisterRequest` | register body | name, email, password | `@NotBlank`; `@NotBlank @Email`; `@NotBlank @Size(min = 6)` | `AuthController.register` → `AuthService.register`, `DataInitializer` |
| `LoginRequest` | login body | email, password | `@NotBlank @Email`; `@NotBlank` | `AuthController.login` → `AuthService.login` |
| `AuthResponse` | token + identity after auth | token, name, email, role | none | returned by register/login; stored by the React `AuthContext` |
| `UserProfileResponse` | safe profile (no password) | id, name, email, role | none | `/api/employees/me`, `/api/manager/employees` |
| `LeaveBalanceResponse` | one balance row | leaveType, totalDays, usedDays, remainingDays | none | `/api/employees/me/balances` |
| `ApplyLeaveRequest` | apply body | leaveType, startDate, endDate, reason | `@NotNull`; `@NotNull`; `@NotNull`; `@NotBlank @Size(max = 500)` | `LeaveController.apply` → `LeaveService.apply` |
| `LeaveRequestResponse` | leave request as returned | id, employeeId, employeeName, leaveType, startDate, endDate, days, reason, status, appliedAt | none | all leave endpoints (employee and manager) |

Validation is triggered by `@Valid` in the controller; record accessors are used as method references (e.g. `LeaveRequestResponse::from`, `LeaveBalanceResponse::from`).

---

## 9. Security

### Security configuration class
`security/SecurityConfig.java`, annotated `@Configuration` + `@EnableWebSecurity`, constructor-injects `JwtAuthFilter`. It defines four beans:
- `passwordEncoder()` → `BCryptPasswordEncoder`
- `authenticationManager(AuthenticationConfiguration)` → `configuration.getAuthenticationManager()`
- `securityFilterChain(HttpSecurity)` → the actual chain
- `corsConfigurationSource()` → `UrlBasedCorsConfigurationSource` registered for `/api/**`, allowed origin `http://localhost:5173`, methods GET/POST/PUT/PATCH/DELETE/OPTIONS, all headers

The `SecurityFilterChain` chain, in code order:
1. `.csrf(csrf -> csrf.disable())` - no cookies/sessions are used.
2. `.cors(Customizer.withDefaults())` - picks up the `CorsConfigurationSource` bean.
3. `.sessionManagement(... STATELESS)` - no `HttpSession`, Spring Security does not log anyone in for later requests.
4. `.authorizeHttpRequests(...)`: `/api/auth/**` → `permitAll`; `/error` → `permitAll`; `/api/manager/**` → `hasRole("MANAGER")`; `anyRequest()` → `authenticated()`. The `/error` entry is required because Boot forwards every error response to that path and the forward carries no token (see the note below).
5. `.exceptionHandling(...authenticationEntryPoint(...))` → anonymous requests get `401` with body "Unauthorized".
6. `.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)` → our filter runs before the standard username/password filter.

### JWT classes
- `security/JwtService` (`@Service`): creation and validation, configured by `jwt.secret` and `jwt.expiration-ms`.
- `security/JwtAuthFilter` (`@Component`, extends `OncePerRequestFilter`): extraction + authentication per request.
- `security/CustomUserDetailsService` (`@Service`, implements `UserDetailsService`): loads the user row.

### JWT creation
`JwtService.generateToken(User)` builds with `Jwts.builder()`:
- `subject(user.getEmail())`
- claims `role` = `user.getRole().name()` and `name` = `user.getName()`
- `issuedAt(now)`, `expiration(now + expirationMs)`
- `signWith(key)` where `key = Keys.hmacShaKeyFor(secret.getBytes(UTF_8))` (HMAC-SHA; jjwt selects HS256/HS384/HS512 from the key length, so the default secret produces an HS384 token)
- `compact()` returns the signed string.

### JWT validation
`JwtService.parseClaims` = `Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload()` - the signature and expiry are checked by the library; a bad token throws `JwtException`. `isTokenValid(token, userDetails)` returns true only when the token subject equals `userDetails.getUsername()` and `expiration` is in the future, catching `JwtException`/`IllegalArgumentException` and returning false.

### Authentication flow (per request)
`JwtAuthFilter.doFilterInternal`:
1. reads header `Authorization`; if absent or not starting with `"Bearer "`, calls `filterChain.doFilter` and returns (anonymous),
2. strips the `"Bearer "` prefix,
3. `jwtService.extractEmail(token)`,
4. only if an authentication is not already present in the `SecurityContext`: `userDetailsService.loadUserByUsername(email)`,
5. `jwtService.isTokenValid(token, userDetails)` → build `UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities())` with `WebAuthenticationDetailsSource().buildDetails(request)`,
6. `SecurityContextHolder.getContext().setAuthentication(authentication)`,
7. any exception → logs nothing, `SecurityContextHolder.clearContext()` and the request continues unauthenticated.

### Request flow (as required)
```
Request
 -> JwtAuthFilter (SecurityFilterChain, before UsernamePasswordAuthenticationFilter)
 -> "Authorization: Bearer <jwt>" extracted, email read from the token
 -> CustomUserDetailsService.loadUserByUsername(email) loads the user row
 -> JwtService.isTokenValid(token, userDetails) verifies signature + subject + expiry
 -> SecurityContextHolder gets a UsernamePasswordAuthenticationToken
 -> authorizeHttpRequests matches the URL (/api/auth/** public, /api/manager/** role MANAGER, rest authenticated)
 -> 401 if anonymous, 403 if wrong role
 -> Controller method runs, Authentication.getName() = the email from the JWT
```

### Authorization flow
- URL-based only, in `SecurityConfig` (no `@PreAuthorize`, no method security).
- Role names come from `CustomUserDetailsService` using `.roles(user.getRole().name())`, which stores the authority `ROLE_EMPLOYEE` / `ROLE_MANAGER`; `hasRole("MANAGER")` looks for `ROLE_MANAGER`, so the prefix is added exactly once (without `.roles(...)` there would be no prefix and `hasRole` would fail).
- Wrong role → `403` (default `AccessDeniedHandler`); missing/invalid token → `401` (configured entry point).
- Ownership (an employee cancelling someone else's request) is not expressible in URL rules, so `LeaveService.cancel` throws `org.springframework.security.access.AccessDeniedException`, which escapes the controller and is turned into `403` by Spring Security's exception translation.

### Which endpoints require what
| Path pattern | Requirement |
| ------------ | ----------- |
| `/api/auth/**` | none (public) |
| `/error` | none (public) - internal Boot error dispatch, must stay reachable |
| `/api/manager/**` | authenticated with role `MANAGER` |
| every other path (all `/api/employees/**`, `/api/leaves/**`) | any authenticated user, any role |

### Password hashing
- `BCryptPasswordEncoder` bean; `AuthService.register` calls `passwordEncoder.encode(rawPassword)` before saving; `AuthService.login` never compares passwords itself - `AuthenticationManager` does it using the encoder and the `UserDetails` password hash. Hashes are stored as text; the raw password is never persisted or returned.

### UserDetails service
`CustomUserDetailsService implements UserDetailsService`; uses the `User` entity + repository and returns Spring's own `org.springframework.security.core.userdetails.User` (fully qualified in the source because the project also has a `User` entity). Throws `UsernameNotFoundException` when the email is unknown.

### Important annotations/config in this area
`@EnableWebSecurity`, `@Configuration`, `@Bean`, `.csrf(...).disable()`, `.cors(Customizer.withDefaults())`, `SessionCreationPolicy.STATELESS`, `requestMatchers(...).permitAll()/hasRole(...)/authenticated()`, `exceptionHandling(...authenticationEntryPoint(...))`, `addFilterBefore(..., UsernamePasswordAuthenticationFilter.class)`, `@Value("${jwt.secret}")`, `@Value("${jwt.expiration-ms}")`.

Note on `.requestMatchers("/error").permitAll()`: when a handler returns 400/403 (or any error), Spring Boot performs an internal forward to `/error` to render the error body. `OncePerRequestFilter` does not run on error dispatches by default, so `JwtAuthFilter` is skipped and that forward arrives unauthenticated; without this matcher the error dispatch would be denied and reported as `401`, hiding the real 403/400. This is why the line exists - removing it makes wrong-role calls answer 401 instead of 403.

---

## 10. Exception Handling

### Exception classes in the code
There are **no custom exception classes** in this project. It uses JDK and Spring exceptions:
- `IllegalArgumentException` (email already registered, bad date order, not enough balance, unknown user, "Incorrect email or password")
- `IllegalStateException` (status is not PENDING; balance row missing)
- `NoSuchElementException` (leave request id not found; produced by `orElseThrow` in `LeaveService.findLeave`)
- `org.springframework.security.authentication.BadCredentialsException` (thrown by `AuthenticationManager` inside `AuthService.login`)
- `org.springframework.security.access.AccessDeniedException` (`LeaveService.cancel` when the request is not yours)
- `org.springframework.web.bind.MethodArgumentNotValidException` (thrown by Spring MVC when `@Valid` fails)
- `org.springframework.http.converter.HttpMessageNotReadableException` (thrown by Jackson when the body cannot be read: malformed JSON, an unknown enum value, an unparsable date)
- `UsernameNotFoundException` (`CustomUserDetailsService`)

### Global exception handler
`exception/GlobalExceptionHandler`, annotated `@RestControllerAdvice`, with four `@ExceptionHandler` methods:

| Handled exception | HTTP status | Body |
| ----------------- | ----------- | ---- |
| `MethodArgumentNotValidException` | `400 Bad Request` | `{"message": "Validation failed", "errors": {field: message, ...}}` (built from `getBindingResult().getFieldErrors()`, `LinkedHashMap` keeps order) |
| `BadCredentialsException` | `401 Unauthorized` | `{"message": "Incorrect email or password"}` |
| `IllegalArgumentException` + `IllegalStateException` (one handler, parameter typed `RuntimeException`) | `400 Bad Request` | `{"message": ex.getMessage()}` |
| `NoSuchElementException` | `404 Not Found` | `{"message": ex.getMessage()}` |
| `HttpMessageNotReadableException` | `400 Bad Request` | `{"message": "Invalid request body: one of the values could not be read (check enum values and the date format YYYY-MM-DD)"}` |

`AccessDeniedException` is deliberately not listed, so it propagates out of the dispatcher and is converted to `403` by Spring Security's exception translation. There is no catch-all `Exception` handler, so unexpected errors fall through to Spring Boot's default error response, and there are no custom error DTOs (plain `Map` bodies).

### Examples of exceptions thrown by services
- `AuthService.register`: `new IllegalArgumentException("Email is already registered: " + email)`
- `AuthService.login`: `IllegalArgumentException("Incorrect email or password")`; AuthenticationManager throws `BadCredentialsException`
- `EmployeeService.findUser`: `IllegalArgumentException("User not found: " + email)`
- `LeaveService.apply`: `IllegalArgumentException("endDate cannot be before startDate")`, `IllegalStateException("No " + type + " balance for this user")`, `IllegalArgumentException("Not enough " + type + " leave: requested N day(s) but only M remaining")`
- `LeaveService.cancel`: `AccessDeniedException("You can only cancel your own leave requests")`, `IllegalStateException("Only pending requests can be cancelled")`
- `LeaveService.approve` / `reject`: `IllegalStateException("Only pending requests can be approved/rejected")`, `IllegalStateException("No balance found for this employee")`
- `LeaveService.findLeave`: `NoSuchElementException("Leave request not found: " + id)`

---

## 11. Database

- **PostgreSQL configuration**: `backend/src/main/resources/application.properties`
  - `spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/leave_db}`
  - `spring.datasource.username=${DB_USERNAME:leave_user}`
  - `spring.datasource.password=${DB_PASSWORD:leave_password}`
  - `spring.jpa.hibernate.ddl-auto=update`, `spring.jpa.show-sql=true`, `spring.jpa.properties.hibernate.format_sql=true`, `spring.jpa.open-in-view=false`
  - `server.port=8080`
- **Database name**: `leave_db`, owner/role `leave_user` (created by `setup-db.sql`). PostgreSQL is local only, on the PostgreSQL 14 cluster at `localhost:5432`. It exists and is in use: it currently holds the two seeded demo users, six balance rows, and three leave requests (one CANCELLED, one APPROVED, one REJECTED) left from the verification run as demo history.
- **Tables** (created by Hibernate, not by any SQL script):
  | Table | Source entity | Key columns |
  | ----- | ------------- | ----------- |
  | `users` | `User` | `id` PK, `name`, `email` (unique), `password` (BCrypt hash), `role` |
  | `leave_balances` | `LeaveBalance` | `id` PK, `user_id` FK → `users.id`, `leave_type`, `total_days`, `used_days`, unique (`user_id`, `leave_type`) |
  | `leave_requests` | `LeaveRequest` | `id` PK, `user_id` FK → `users.id`, `leave_type`, `start_date`, `end_date`, `reason`, `status`, `applied_at` |
- **Relationships**: `leave_requests.user_id → users.id` and `leave_balances.user_id → users.id`, both many-to-one, unidirectional, no cascade. Enum and date columns: enums stored as strings, `LocalDate` → `date`, `LocalDateTime` → `timestamp`.
- **How the schema is created/updated**: `ddl-auto=update` makes Hibernate read the `@Entity` mappings at startup and create or alter tables to match them. No Flyway/Liquibase, no `schema.sql`/`data.sql`, no `CREATE TABLE` anywhere in the repository.
- **Data seeder**: `config/DataInitializer` implements `CommandLineRunner`; it runs after the context is up, skips anything that already exists (`existsByEmail`) and otherwise calls `AuthService.register(...)` (which also creates the three balance rows) and promotes the manager account via `setRole(Role.MANAGER)` + `save`. It logs the created credentials.
- **Demo users**:
  | Role | Email | Password | Balances |
  | ---- | ----- | -------- | -------- |
  | MANAGER | `manager@leave.com` | `manager123` | default rows, same as any new user |
  | EMPLOYEE | `employee@leave.com` | `employee123` | CASUAL 12, SICK 8, EARNED 15 |
- Registration through the API always creates `EMPLOYEE`; a second manager can only be made by editing the row or the seeder.

---

## 12. React Structure

Location `frontend/`, JavaScript (no TypeScript). Entry `index.html` → `src/main.jsx`.

### Pages (`src/pages/`)
- `Login.jsx` - email/password form, pre-filled with `employee@leave.com` / `employee123`; on success `navigate()` to `/manager` for a MANAGER or `/employee` otherwise; shows the backend error in an `Alert`; link to `/register`; a "Demo credentials" box (`DEMO_ACCOUNTS` array) whose "Use" buttons only fill the two fields via `fillDemo(account)`.
- `Register.jsx` - name/email/password form (password `minLength={6}`); calls `auth.register`, then navigates to `/employee`.
- `EmployeeDashboard.jsx` - loads profile, balances and own leave requests with `Promise.all` in `loadData()`, called from `useEffect(..., [])` and after each action; contains the apply-for-leave form (`leaveType` select over `['CASUAL','SICK','EARNED']`, `startDate`/`endDate` date inputs, `reason` textarea) and a table of own requests whose PENDING rows show a Cancel button.
- `ManagerDashboard.jsx` - loads pending requests and employees; table of pending requests with Approve/Reject buttons per row (`handleDecision(id, 'approve'|'reject')`, tracked by a `busy` state `{id, decision}`), plus an employees table with `RoleBadge`.

### Components (`src/components/`)
- `ui.jsx` - the small shared presentational layer, no state and no API calls: `titleCase`, `initials`, `formatDate` helpers, `StatusBadge` / `RoleBadge` (coloured pills), `Alert` (renders `null` without children), `Loading` (spinner) and `EmptyState`. Used by both dashboards, the auth pages and the navbar, which is why it exists as its own file.
- `Navbar.jsx` - brand link (mark + app name), and when logged in a user chip (initials avatar, name, `RoleBadge`) and a Log out button (`logout()` then `navigate('/login')`).
- `ProtectedRoute.jsx` - returns `<Navigate to="/login" replace />` when there is no auth, `<Navigate to={role === 'MANAGER' ? '/manager' : '/employee'} replace />` when the role does not match, otherwise renders `children`.

### Contexts (`src/auth/`)
- `AuthContext.jsx` - `createContext(null)`, `AuthProvider` holding `auth` in `useState` (initialised from `loadAuth()`), `useMemo` value exposing `auth`, `login(email, password)`, `register(name, email, password)`, `logout()`; `useAuth()` throws when used outside the provider.
- `authStorage.js` - `saveAuth`, `loadAuth` (JSON parse with `clearAuth()` fallback on bad data), `clearAuth`, `getToken`; all around `localStorage` key `lms_auth`.

### API layer
- `src/api.js` - module-level `BASE_URL = '/api'`, private `request(path, {method = 'GET', body})` that sets `Content-Type: application/json` when a body exists, adds `Authorization: Bearer <token>` from `getToken()`, calls `fetch`, parses JSON (or `null` for 204), and when not ok throws `Error(data?.message || data?.error || 'Request failed with status <code>')` - application handlers send `message`, Spring Security/Boot error bodies send `error` - and also attaches `error.fieldErrors = data?.errors` so the login/register/apply forms can highlight the offending input from a Bean Validation 400. Exports one function per endpoint: `register`, `login`, `getProfile`, `getMyBalances`, `getMyLeaves`, `applyLeave`, `cancelLeave`, `getPendingLeaves`, `approveLeave`, `rejectLeave`, `getEmployees`. The only file that performs HTTP calls.

### Routing
- `main.jsx`: `ReactDOM.createRoot(...).render(<StrictMode><BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter></StrictMode>)`.
- `App.jsx`: `<Navbar/>` + `<Routes>` with `/` (redirect by role through the local `homePath(auth)` helper), `/login`, `/register`, `/employee` (wrapped in `ProtectedRoute role="EMPLOYEE"`), `/manager` (wrapped in `ProtectedRoute role="MANAGER"`), and `*` → "Page not found."
- Navigation uses `useNavigate()`; links use `<Link>`.

### Important state
- In context: `auth` = `{ token, name, email, role }` (persisted in `localStorage`).
- Per page: `profile`, `balances`, `leaves` (employee), `pendingLeaves`, `employees` (manager), `form` (leave form object), `error`, `fieldErrors`, `message`, `loading` (all pages). `EmployeeDashboard` adds `applying` and `cancellingId`, `ManagerDashboard` adds `busy` - they only disable the button whose request is in flight. A local constant `EMPTY_FORM` and `LEAVE_TYPES` array are used in `EmployeeDashboard.jsx`.

### Styling
- No UI framework, no CSS-in-JS: one hand-written `src/index.css` (~900 lines, commented in sections). CSS custom properties in `:root` hold the design tokens (colours, radii, shadows, focus ring); then navbar, layout/cards, stat cards, forms and buttons, tables and badges, alerts/loading/empty states, auth pages, and two responsive breakpoints at 900px and 640px. `index.html` also carries an inline SVG favicon (data URI) and a `theme-color` meta tag.

### Authentication flow (frontend)
1. Login/Register page collects the fields and calls `login()` / `register()` from `useAuth()`.
2. `AuthContext` calls `api.login` / `api.register`, receives `{token, name, email, role}`.
3. `saveAuth(data)` writes it to `localStorage`, `setAuth(data)` re-renders the tree.
4. The page navigates by role; `ProtectedRoute` allows the matching dashboard.
5. Every later `api.*` call attaches the stored token; `Navbar.logout()` clears storage and state and returns to `/login`.
6. There is no token-expiry handling in React: an expired token simply makes the backend answer 401 and the page shows the error message.

---

## 13. Frontend → Backend Flow

### Login
```
Login.jsx form submit -> useAuth().login(email, password)
  -> AuthContext -> api.login({ email, password }) -> request('/auth/login', POST, body)
  -> fetch('/api/auth/login')  [browser -> Vite dev server :5173 -> proxy -> :8080]
  -> SecurityFilterChain: /api/auth/** is permitAll, so JwtAuthFilter finds no Authorization header
     and the request continues anonymously
  -> AuthController.login(@Valid @RequestBody LoginRequest) -> AuthService.login(LoginRequest)
  -> AuthenticationManager.authenticate(UsernamePasswordAuthenticationToken(email, rawPassword))
       -> CustomUserDetailsService.loadUserByUsername(email) -> UserRepository.findByEmail
       -> PasswordEncoder(BCrypt) matches the raw password against the stored hash
  -> wrong password: BadCredentialsException -> GlobalExceptionHandler -> 401 {"message":"Incorrect email or password"}
  -> success: userRepository.findByEmail(email) -> JwtService.generateToken(user)
  -> 200 AuthResponse { token, name, email, role }
  -> AuthContext: saveAuth(data) -> localStorage('lms_auth') + setAuth(data)
  -> navigate('/employee' or '/manager') depending on data.role
```

### Employee applies for leave
```
EmployeeDashboard apply form -> api.applyLeave(form)
  -> request('/leaves', POST, body) with Authorization: Bearer <token>
  -> JwtAuthFilter extracts/validates the token, loads the user, sets the SecurityContext
  -> authorizeHttpRequests: /api/leaves is only "authenticated" -> allowed
  -> LeaveController.apply(@Valid @RequestBody ApplyLeaveRequest, Authentication)
       - invalid body -> MethodArgumentNotValidException -> 400 with field errors
  -> LeaveService.apply(request, authentication.getName())
       - EmployeeService.findUser(email) -> UserRepository.findByEmail
       - date order check, days = DAYS.between(start,end)+1
       - LeaveBalanceRepository.findByUserIdAndLeaveType(userId, type)   [SELECT]
       - days > remainingDays -> IllegalArgumentException -> 400
       - new LeaveRequest(user, type, start, end, reason) (status PENDING)
  -> LeaveRequestRepository.save(leave) -> Hibernate INSERT into leave_requests
  -> LeaveRequestResponse.from(saved)  -> 201 JSON (id, employeeName, type, dates, days, reason, status, appliedAt)
  -> EmployeeDashboard: setMessage('Leave request submitted.'), resets the form, loadData() re-reads
     profile + balances + leaves (GET /api/employees/me, /api/employees/me/balances, /api/leaves)
  -> the new PENDING row appears with a Cancel button
```

### Manager approves leave
```
ManagerDashboard Approve button -> handleDecision(id, 'approve') -> api.approveLeave(id)
  -> request('/manager/leaves/1/approve', PATCH) with Authorization: Bearer <token>
  -> JwtAuthFilter authenticates the manager (token holds role=MANAGER, authority ROLE_MANAGER)
  -> authorizeHttpRequests: /api/manager/** requires hasRole("MANAGER") -> allowed
       - employee token instead -> AccessDeniedException -> 403
  -> ManagerController.approve(@PathVariable Long id)
  -> LeaveService.approve(id)  [@Transactional]
       - findLeave(id) -> LeaveRequestRepository.findById -> NoSuchElementException -> 404 if unknown
       - status != PENDING -> IllegalStateException -> 400
       - LeaveBalanceRepository.findByUserIdAndLeaveType(...) -> usedDays += leave.getDays() -> save  [UPDATE]
       - leave.setStatus(APPROVED) -> leaveRequestRepository.save(leave)                            [UPDATE]
  -> LeaveRequestResponse.from(leave) -> 200 JSON with status APPROVED
  -> ManagerDashboard: setMessage('Leave request approved.'), loadData() re-reads pending + employees,
     so the row disappears from the pending table
```

Note on the extra `GET` reads the dashboards do: they always re-fetch from the server rather than mutating local state, so the UI is refreshed from the database after every action.

---

## 14. Configuration

| File | What it currently configures |
| ---- | ---------------------------- |
| `backend/pom.xml` | Spring Boot 4.1.1 parent, `java.version=21`, `jjwt.version=0.12.6`, the dependency list (web, JPA, security, validation, PostgreSQL driver, jjwt api/impl/jackson, test starter) and the `spring-boot-maven-plugin` (executable jar). |
| `backend/src/main/resources/application.properties` | `spring.application.name`, `server.port=8080`, datasource URL/username/password (env-overridable, local defaults), `ddl-auto=update`, `show-sql=true`, `format_sql=true`, `open-in-view=false`, `jwt.secret`, `jwt.expiration-ms=86400000`. |
| `backend/.mvn/wrapper/maven-wrapper.properties` | Maven wrapper: `wrapperVersion=3.3.4`, `distributionType=only-script`, Maven distribution `apache-maven-3.9.16`. |
| `backend/.gitignore` | Scaffold ignore rules for `HELP.md`, `target/`, IDE files. |
| `frontend/package.json` | Project metadata (`"type": "module"`), scripts `dev`/`build`/`preview` (all Vite), react/react-dom/react-router-dom dependencies, vite + @vitejs/plugin-react devDependencies. |
| `frontend/vite.config.js` | `@vitejs/plugin-react`, dev server `port: 5173`, proxy `/api` → `http://localhost:8080` with `changeOrigin: true`. |
| `frontend/index.html` | HTML shell with `<div id="root">` and `<script type="module" src="/src/main.jsx">`. |
| `frontend/.gitignore` | Ignores `node_modules`, `dist`, `dist-ssr`, `*.local`, `.vite`, npm debug logs. |
| `start.sh` | Runs both apps: checks `java`, `node`, `frontend/node_modules`, warns via `pg_isready -h localhost -p 5432`, starts `./mvnw spring-boot:run` and `npm run dev` in the background, `trap cleanup EXIT INT TERM` kills both. |
| `setup-db.sql` | `CREATE ROLE leave_user WITH LOGIN PASSWORD 'leave_password';` and `CREATE DATABASE leave_db OWNER leave_user;`. |
| root `.gitignore` | Ignores backend `target/`, frontend `node_modules/` + `dist/`, `.env`, IDE folders. |

There is no `application.yml`, no profile-specific properties file (`application-dev.properties` etc.), no `.env` file and no custom `@ConfigurationProperties` class.

---

## 15. Dependencies

### Backend (`backend/pom.xml`)

| Dependency | Version source | Purpose in this project |
| ---------- | -------------- | ----------------------- |
| `spring-boot-starter-parent` | 4.1.1 | Parent POM: dependency and plugin version management, sensible defaults; also the source of `<java.version>` handling. |
| `spring-boot-starter-webmvc` | managed | Spring MVC + Jackson + embedded Tomcat: makes `@RestController`, `@RequestMapping`, `Authentication` parameters, JSON (de)serialisation and `LocalDate` handling work. |
| `spring-boot-starter-data-jpa` | managed | Spring Data repository proxies (`JpaRepository`) + Hibernate ORM + transaction management (`@Transactional`) + JDBC/HikariCP. |
| `spring-boot-starter-security` | managed | `SecurityFilterChain`, `BCryptPasswordEncoder`, `AuthenticationManager`, `UsernamePasswordAuthenticationToken`, `SecurityContextHolder`, `AccessDeniedException`, authority checks. |
| `spring-boot-starter-validation` | managed | Hibernate Validator + Jakarta Validation API: makes `@Valid` on request bodies enforce `@NotBlank`, `@Email`, `@Size`, `@NotNull`. |
| `org.postgresql:postgresql` (runtime) | managed | PostgreSQL JDBC driver; needed by Hibernate at runtime (not referenced in code). |
| `io.jsonwebtoken:jjwt-api` | 0.12.6 | The compile-time JWT API used in `JwtService` (`Jwts`, `Claims`, `Keys`, `JwtException`). |
| `io.jsonwebtoken:jjwt-impl` (runtime) | 0.12.6 | The implementation that actually signs/parses (pulled in at runtime only). |
| `io.jsonwebtoken:jjwt-jackson` (runtime) | 0.12.6 | JSON serialisation of JWT claims via Jackson. |
| `spring-boot-starter-webmvc-test` (test) | managed | Brings JUnit 5 + Spring Boot test support so `@SpringBootTest` in `LeaveManagementSystemApplicationTests` compiles and runs. |
| `spring-boot-maven-plugin` (build plugin) | managed | Repackages the jar into the executable fat jar (`target/leave-management-system-0.0.1-SNAPSHOT.jar`) and provides `spring-boot:run`. |

Not present (deliberately): Lombok, MapStruct, Flyway/Liquibase, Testcontainers, H2, Docker plugins, Actuator, Swagger/springdoc, Redis, messaging.

### Frontend (`frontend/package.json`)

| Dependency | Version (as installed) | Purpose in this project |
| ---------- | ---------------------- | ----------------------- |
| `react` | ^19.3.0 | Component model, hooks (`useState`, `useEffect`, `useMemo`, `useContext`). |
| `react-dom` | ^19.3.0 | `ReactDOM.createRoot(...).render(<App/>)` in `main.jsx`. |
| `react-router-dom` | ^7.18.4 | `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Link`, `useNavigate` for the four pages and the redirects. |
| `vite` (dev) | ^8.3.0 | Dev server (port 5173, `/api` proxy) and production build (`npm run build`). |
| `@vitejs/plugin-react` (dev) | ^6.1.1 | Transforms JSX and enables React Fast Refresh during development. |

No Redux, no Axios (the browser `fetch` API is used), no UI/CSS framework, no TypeScript - styling is a single hand-written `src/index.css`.

---

## 16. Interview Concepts Present in This Project

Only concepts actually visible in the code.

### Java
- Classes, interfaces, enums with constructors and fields (`LeaveType` carrying `defaultDays`).
- `record` types for DTOs (compact immutable data carriers, accessor methods).
- Interfaces + implementations (`UserDetailsService`, `JpaRepository`), abstract class extension (`OncePerRequestFilter`).
- Generics (`JpaRepository<User, Long>`, `List<ResponseEntity<...>>`, `Map<String, Object>`).
- Collections/streams (`List.of`, `.stream().map(...).toList()`, `LinkedHashMap`, `Map.of`).
- Exception types and unchecked exception propagation (`IllegalArgumentException`, `IllegalStateException`, `NoSuchElementException`, `AccessDeniedException`).
- `Optional` with `orElseThrow`.
- `java.time` (`LocalDate`, `LocalDateTime`, `ChronoUnit.DAYS.between`).
- Lambda expressions and method references (`LeaveRequestResponse::from`, functional `orElseThrow` supplier).
- Static factory methods (`from(entity)`) and defensive choices like a `protected` JPA-only constructor.
- Static imports and constants (`BEARER_PREFIX`, `SC_UNAUTHORIZED`).

### Spring Core
- Dependency injection by constructor in every service, controller, filter and config class.
- `@Component`/`@Service`/`@Configuration`/`@Bean`/`@ComponentScan` (via `@SpringBootApplication`).
- Singleton beans, bean wiring order, and service-to-service injection (`LeaveService` → `EmployeeService`).
- `@Value` property injection (`jwt.secret`, `jwt.expiration-ms`).
- Bean lifecycle callbacks in the shape of `CommandLineRunner` (`DataInitializer`).
- `@Transactional` and `@Transactional(readOnly = true)` on the service layer (transaction boundaries + lazy loading interaction).

### Spring Boot
- `@SpringBootApplication`, auto-configuration, embedded Tomcat.
- Externalised configuration through `application.properties` with `${ENV_VAR:default}` placeholders (no secrets in the file).
- Starter dependencies and the parent BOM.
- Data seeding at startup with `CommandLineRunner`.
- Executable/fat jar packaging (`spring-boot-maven-plugin` repackage) and `spring-boot:run`.
- Note: this is Spring Boot 4, so the Web starter is `spring-boot-starter-webmvc` and Boot-4 test annotations live under `org.springframework.boot.webmvc.test.autoconfigure`.

### Spring MVC
- `@RestController`, `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PatchMapping`, `@PathVariable`, `@RequestBody`, `@Valid`.
- `ResponseEntity` + `HttpStatus` to control the status code (201 for register/apply).
- `Authentication` as a handler-method parameter.
- JSON serialisation of records and `LocalDate`/`LocalDateTime` via Jackson (ISO strings).
- `@RestControllerAdvice` + `@ExceptionHandler` for centralised error responses.
- Jackson binding of a JSON body into a record.

### REST
- Resource-oriented URLs (`/api/leaves`, `/api/leaves/{id}/cancel`) and correct verbs (GET/POST/PATCH).
- Status codes used: 200, 201, 400, 401, 403, 404.
- Statelessness: the server keeps no session; each request carries its own token.
- Path variables vs. request body vs. header (`Authorization`).
- Consistent DTO responses including a computed field (`days`, `remainingDays`).

### JPA/Hibernate
- `@Entity`, `@Table`, `@Id`, `@GeneratedValue(strategy = IDENTITY)`, `@Column(nullable = ..., unique = ..., length = ...)`, `@Enumerated(EnumType.STRING)`, `@Transient`.
- `@ManyToOne` (unidirectional) with `@JoinColumn` as a foreign key; `FetchType.LAZY` and what that implies.
- `@UniqueConstraint` as a composite business rule (one balance per user per leave type).
- Schema generation from mappings (`ddl-auto=update`).
- Entity identity, no-arg constructors required by JPA, field access, dirty checking on a managed entity, SQL generated by `save` (INSERT vs UPDATE).
- Lazy loading and `LazyInitializationException` avoidance via a transaction (`getMyLeaves`).
- JPQL/derived queries via method naming, and generated `findById`/`findAll`/`save`.
- `@Transactional` rollback semantics (runtime exceptions only).

### PostgreSQL
- A relational store reached over JDBC/HikariCP with a URL, user and password.
- Actual schema shape: three tables, two foreign keys, a composite unique constraint, enum values stored as text.
- Local setup with `CREATE ROLE` / `CREATE DATABASE` (in `setup-db.sql`).
- No cloud database, no Docker, no migration tool.

### Spring Security
- `SecurityFilterChain` bean, `HttpSecurity` DSL, `@EnableWebSecurity`.
- URL-based authorization: `permitAll`, `authenticated`, `hasRole`.
- `ROLE_` prefix convention and authorities (`ROLE_EMPLOYEE` / `ROLE_MANAGER`).
- `BCryptPasswordEncoder` behind the `PasswordEncoder` abstraction; password hashing vs. password comparison.
- `AuthenticationManager`, `UsernamePasswordAuthenticationToken`, `SecurityContextHolder`, `SecurityContext` per request.
- `UserDetailsService` + `UserDetails` bridging an application table to Spring Security.
- Stateless session policy, CSRF disabled for a token-based JSON API.
- `AuthenticationEntryPoint` (401 for anonymous) vs. `AccessDeniedHandler` (403 for wrong role).
- `AccessDeniedException` thrown from a service and translated to 403.
- Custom filter via `OncePerRequestFilter` + `addFilterBefore`.

### JWT
- Token structure (header.payload.signature) and claims (`sub`, `role`, `name`, `iat`, `exp`).
- HMAC signing with a secret key (`Keys.hmacShaKeyFor`) and signature verification (`Jwts.parser().verifyWith(key)`).
- Expiry (`expiration-ms`) and validation of subject + expiry.
- Bearer-token usage in the `Authorization` header; the token is the sole proof of identity (no session).
- Stateless trade-offs: no server-side revocation, token in `localStorage` on the client.

### React
- Function components, props (`ProtectedRoute({ role, children })`), `children`.
- Hooks: `useState`, `useEffect` (empty dependency array = run once), `useMemo`, `useContext`, plus `createContext`.
- Context API + a custom hook (`useAuth`) with a guard when used outside the provider.
- Controlled form inputs (`value` + `onChange`), `event.preventDefault()`, conditional rendering (`&&`, ternaries), list rendering with `key`, `disabled` while loading.
- Routing: `BrowserRouter`, `Routes`/`Route`, `Navigate` with `replace`, `Link`, `useNavigate`.
- Component composition, module-level constants, and separation of concerns (`pages` / `components` / `auth` / `api`).
- Data fetching on mount with `Promise.all` and refreshing by re-fetching after mutations.

### HTTP
- Methods, paths, status codes, request bodies, response bodies, headers.
- `Content-Type: application/json` and `Authorization: Bearer ...`.
- Request/response cycle through a dev-server proxy (Vite `/api` → port 8080) which also avoids CORS in the browser.
- Client-side handling of non-2xx (`response.ok` check and reading the error body).
- CORS configuration as a server-side concern (`CorsConfigurationSource` for `localhost:5173`).

---

## 17. Potential Interview Questions

### Basic
- Why does this project test with `@SpringBootTest` and what does that actually load?
- What does `@SpringBootApplication` combine, and which package does component scanning cover here?
- Why is this class annotated with `@Service`? What changes if you remove it?
- What does `@RestController` do, and how does it differ from `@Controller`?
- Why does this repository extend `JpaRepository`? What do you get for free?
- Why are the DTOs `record`s instead of classes with getters and setters?
- Which class holds the entry point, and what happens step by step when `main` runs?
- Why does `application.properties` use `${DB_USERNAME:leave_user}` instead of a literal value?
- What is the difference between `@PathVariable` and `@RequestBody` in this codebase?
- Why does `LeaveRequest.getDays()` carry `@Transient`?
- What is the role of `Authentication` as a controller parameter?
- How does the frontend know whether to show the employee or the manager dashboard?

### Intermediate
- How does Spring find this bean? How does `AuthService` get its five dependencies without `new`?
- How does dependency injection work for `LeaveService`, which depends on `EmployeeService`?
- How does this `@ManyToOne` relationship work, and what is the foreign key column called?
- Why is `FetchType.LAZY` set on the relationships, and why would `LazyInitializationException` be a risk here?
- Why are `getMyLeaves` and `getPendingLeaves` `@Transactional(readOnly = true)` but `apply` a normal `@Transactional`?
- How does Spring Data turn `findByUserIdAndLeaveType` into a query? Which entity property does `UserId` traverse?
- What SQL does Hibernate generate for `apply`, and what does it generate for `approve`? Why is `save` an INSERT in one case and an UPDATE in the other?
- What exactly does `passwordEncoder.encode(...)` store, and how is the password checked at login?
- Why is the JWT validated twice in a sense - by `JwtService.isTokenValid` and by Spring Security?
- Why is CSRF disabled, and would that be acceptable if this app used cookies?
- Why is the session policy `STATELESS`, and what would break if it were not?
- What happens when this HTTP request reaches the application, filter by filter?
- How does `addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)` change the order of execution?
- Why is `CustomUserDetailsService` needed when there is already a `User` entity?
- Why does the security config return `401` with a custom `AuthenticationEntryPoint` but leave `403` to the default handler?
- Why does `LeaveService.cancel` need an ownership check when Spring Security already restricts URLs?
- How does `@RestControllerAdvice` decide which handler method handles which exception?
- Why is `BadCredentialsException` mapped to 401 while `IllegalArgumentException` maps to 400?
- Why is the balance check done in `apply` and the balance update done in `approve`?
- Why does `LeaveType` carry `defaultDays` instead of a constant map somewhere else?
- How does the Vite proxy relate to the `corsConfigurationSource` bean - why could you arguably delete one of them?
- What does `useMemo` protect in `AuthProvider`, and why is `auth` in its dependency array?
- How does `ProtectedRoute` interact with backend authorization - is it security?

### Deep follow-up
- What breaks if two employees submit overlapping leave, and where would you enforce that in this code?
- If `Approve` is clicked twice quickly, what could happen to `usedDays`, and how would `@Transactional` and/or optimistic locking change the outcome?
- Is `ddl-auto=update` safe? What would you need to change to use a real migration tool?
- What are the consequences of storing the JWT in `localStorage` rather than an httpOnly cookie, and how does logout work today?
- What happens when the token expires mid-session in this code - where is that detectable on the client?
- Why is `usedDays` only incremented on approval? What would a cancel-after-approval flow require?
- `EmployeeService.getAllEmployees()` returns `findByRole(Role.EMPLOYEE)` - what if a manager's profile is needed?
- What does `.roles(user.getRole().name())` do internally, and what would change if `.authorities(...)` were used instead?
- Where does request-level transaction/`EntityManager` state come from in `getMyLeaves`, and why does mapping happen inside the transaction?
- Why does the JWT filter swallow exceptions and clear the context instead of returning 401 itself?
- Where do the `role` and `name` claims in the token get used by the backend at all, given authorization uses the database-loaded `UserDetails`?
- What would break if the `users.email` uniqueness were enforced only in `AuthService.register` and not by the column constraint?
- How would you add a paginated manager view, and which parts of the repository layer would change?
- What is the N+1 risk in `getPendingLeaves`, and how would a fetch join change the SQL?
- Why does `DataInitializer` reuse `AuthService.register` and then overwrite the role, rather than inserting a manager directly? What are the downsides?
- Trace what a wrong-role request does end to end: which component returns 403, and where does the exception come from?
- Why is `LeaveRequestResponse` assembled in the service rather than letting Jackson serialise the entity directly?
- If the secret changes, what happens to tokens that are already issued, and which method fails first?
- Which parts of this application are stateless and which are not (hint: `localStorage`, `SecurityContextHolder`)?
- How would you test `LeaveService.approve` without a database, and what would you have to mock?

---

## 18. Known Limitations

Only limitations visible in the current implementation:

- No custom exception classes; error bodies are ad-hoc `Map`s (`{"message": ...}`), and there is no catch-all handler for unexpected exceptions (e.g. a database error surfaces as Spring Boot's default 500 response).
- No global input normalisation beyond lower-casing the email; no trimming of names/reasons.
- The leave rules are minimal:
  - `days` is always inclusive (`DAYS.between + 1`); no half days, and weekends/holidays are counted as leave.
  - No overlap check between two requests of the same user.
  - No past-date validation (`startDate` may be in the past); `ApplyLeaveRequest` does not use `@Future`.
  - `usedDays` is only incremented on approval; rejecting does nothing, and cancelling an already-approved request is not supported.
  - Balances are a single set of numbers per user - no year, no accrual, no carry-over.
- `LeaveService.approve` reads the balance and writes it in one transaction, but there is no optimistic locking (`@Version`) or atomic SQL update, so two concurrent approvals of the same employee's requests can compute `usedDays` from the same starting value.
- Authorization is entirely URL-pattern based in `SecurityConfig`; there is no `@PreAuthorize`/method security, and the ownership rule lives inside `LeaveService.cancel` as a manual check.
- `EmployeeService.getAllEmployees()` only returns `Role.EMPLOYEE` users, and there is no endpoint to view another user's profile, balance or request history.
- Registration always creates an `EMPLOYEE`; the only way to create a `MANAGER` is the seeder or a manual database edit. Any user can therefore register with an arbitrary email and there is no email verification, password reset, account lockout or rate limiting.
- `JwtAuthFilter` catches every exception while parsing the token and continues anonymously; there is no logging or distinction between "expired" and "malformed".
- The JWT is stored in `localStorage`, cannot be revoked before expiry (24h default), and there is no refresh token; the client has no expiry handling beyond showing the 401 error.
- CORS allows exactly one origin (`http://localhost:5173`) and is defined twice in effect (proxy + CORS bean); a production build would need the API on the same origin or a wider origin list.
- `spring.jpa.show-sql=true` and `ddl-auto=update` are development settings; there is no migration tool and schema changes are applied automatically.
- Tests: only the scaffold `contextLoads` test exists - no unit tests for `LeaveService`, no controller/MockMvc tests, no repository tests. That test also requires a running PostgreSQL, so `mvn test` fails without a database.
- `mvn test` boots the full context, so it needs a running PostgreSQL with `leave_db`/`leave_user`; on a machine without that database the single test fails with a connection error rather than a test failure.
- The `contextLoads` test is the only test, so a broken rule in `LeaveService` or a broken mapping in a controller would not be caught automatically - the current behaviour was verified by driving the running API with curl.
- `Login.jsx` pre-fills real demo credentials into the form fields.
- Timestamps use the server's default time zone; `appliedAt` is returned without a zone offset. No pagination or sorting options are exposed on any list endpoint.
- Not a git repository: there is no `.git`, so there is no history, branch or commit to inspect.
- The project uses Spring Boot 4.1.1, so code differs from most tutorials: `spring-boot-starter-webmvc` instead of `spring-boot-starter-web`, and test annotations such as `@WebMvcTest`/`@AutoConfigureMockMvc` live in `org.springframework.boot.webmvc.test.autoconfigure`.

---

## 19. Recommended Learning Order

Focused on interview preparation, following this project's dependencies:

1. **Entity layer first** - `entity/Role`, `LeaveType`, `LeaveStatus` (enums, including `LeaveType.defaultDays`), then `User`, `LeaveBalance`, `LeaveRequest`. Learn `@Entity`, `@Id`, `@GeneratedValue`, `@Column`, `@Enumerated`, `@Transient`, `@ManyToOne`, `@JoinColumn`, the `User 1 ── * LeaveRequest` relationship and why the no-arg constructor exists.
2. **Repositories** - `UserRepository`, `LeaveBalanceRepository`, `LeaveRequestRepository`: what `JpaRepository` gives you, how `findByEmail` / `findByUserIdAndLeaveType` / `findByStatusOrderByAppliedAtAsc` are derived, and which SQL Hibernate emits.
3. **DTOs** - the seven records, `@Valid` and the validation annotations, and the static `from(entity)` factories (why entities are not returned directly).
4. **Services** - `AuthService.register` and `createDefaultBalances` first (simple repository usage), then `EmployeeService`, then `LeaveService` end to end: `apply` (rule checks + transaction), `getMyLeaves` (read-only transaction + lazy loading), `cancel` (ownership + `AccessDeniedException`), `approve` (balance update), `reject`.
5. **Controllers and REST** - `AuthController`, `EmployeeController`, `LeaveController`, `ManagerController`: mappings, `@PathVariable`/`@RequestBody`/`Authentication`, `ResponseEntity`, and how each method maps to a service call.
6. **Exception handling** - `GlobalExceptionHandler`, every exception thrown in the services, and which status code each one produces (400/401/403/404).
7. **Spring Security and JWT** - `JwtService` (creation and verification), `JwtAuthFilter` (extraction and authentication), `CustomUserDetailsService` (bridging the table to `UserDetails`), then `SecurityConfig` (public paths, `hasRole`, stateless, entry point, CORS, filter order). Reconstruct the request flow from section 9 until you can draw it unaided.
8. **Spring Boot startup and configuration** - `LeaveManagementSystemApplication`, auto-configuration, `application.properties` (including the `${ENV:default}` pattern and the two `jwt.*` keys), `DataInitializer`, `pom.xml` starters, and the difference between `spring-boot:run` and the packaged jar.
9. **Frontend foundations** - `main.jsx` → `App.jsx` routing → `Navbar`/`ProtectedRoute` → `AuthContext` + `authStorage.js`.
10. **Frontend data flow** - `api.js` (fetch wrapper, JWT header, error handling), then `Login.jsx`/`Register.jsx`, then `EmployeeDashboard.jsx` (mount loading with `Promise.all`, controlled form, conditional Cancel button), then `ManagerDashboard.jsx` (approve/reject decisions).
11. **Full-stack traces** - walk the three flows in section 13 out loud (login, apply, approve), naming each file the request passes through. Then answer the section 17 questions without looking at the code.
12. **Trade-offs and follow-ups** - study the section 18 limitations as the natural source of interview follow-ups (concurrency on approval, `ddl-auto`, token storage, missing tests, pagination, overlap checks).
