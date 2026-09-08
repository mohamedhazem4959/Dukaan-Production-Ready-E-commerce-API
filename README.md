# 🛒 Dukaan — Production-Ready E-Commerce REST API

A modular, resilient backend REST API for an e-commerce platform built with **NestJS 11**, **TypeScript**, **PostgreSQL**, **Prisma ORM 7**, and **Redis 7**. Designed with a strong focus on data consistency, concurrency control, multi-tiered idempotency, secure session management, and provider abstractions.

[![CI Status](https://github.com/mohamedhazem4959/Dukaan-Production-Ready-E-commerce-API/actions/workflows/CI-backend.yaml/badge.svg)](https://github.com/mohamedhazem4959/Dukaan-Production-Ready-E-commerce-API/actions/workflows/CI-backend.yaml)
![Node.js](https://img.shields.io/badge/Node.js-20.x%20%7C%2024.x-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%20%7C%2016-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748?logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Multi--stage-2496ED?logo=docker&logoColor=white)

---

### 📌 Quick Links
* **Repository**: [mohamedhazem4959/Dukaan-Production-Ready-E-commerce-API](https://github.com/mohamedhazem4959/Dukaan-Production-Ready-E-commerce-API)
* **Docker Image**: `mohamedhazem4959/dukaan:v1.0.5`
* **Interactive API Documentation (Swagger)**: `http://localhost:3000/api/v1/docs`
* **Healthcheck**: `GET http://localhost:3000/api/v1/ping`

---

## Overview

**Dukaan** is a backend e-commerce REST API designed to solve core backend challenges in transaction processing, stateful workflows, and concurrent operations.

Rather than implementing basic CRUD operations, the codebase addresses real-world distributed system challenges:
* **Deadlock-Free Row-Level Locking (`SELECT ... FOR UPDATE`)**: Eliminates race conditions and deadlocks during concurrent multi-item checkout operations.
* **Two-Layer Idempotency**: Prevents double-charging and duplicate order placements across both client checkout requests and asynchronous payment gateway webhook deliveries.
* **Token Rotation with Breach Detection**: Employs stateful refresh token rotation with Bcrypt-hashed tokens in Redis; detects token reuse and invalidates compromised user sessions automatically.
* **Compensating Transactions**: Cleans up remote uploaded media from third-party storage if transactional database operations fail.
* **Automated Background Reconciliation**: Cancels abandoned pending credit card orders and restores reserved inventory via scheduled cron jobs.

---

## Key Features

### 🔐 Authentication & Authorization
* **Two-Stage Registration**: Temporary user credentials are encrypted and staged in Redis (`tempUser:<email>`, 15-minute TTL). Users are only persisted to PostgreSQL once email verification is completed via Nodemailer and Handlebars templates.
* **Dual-Token System**: Issues short-lived JWT access tokens (15-minute expiry) in HTTP responses and cryptographically random refresh tokens inside HTTP-only, secure, strict-samesite cookies (`authPayload`).
* **Refresh Token Rotation & Reuse Detection**: Refresh tokens are hashed with Bcrypt and tracked in Redis per session (`session:<sessionId>`). If an already-rotated refresh token is presented, the entire session is purged immediately to mitigate session hijacking.
* **Role-Based Access Control (RBAC)**: Custom `@Roles('ADMIN')` decorator and `RolesGuard` protecting administrative endpoints from unauthorized access.

### 📦 Orders & Concurrency-Safe Checkout
* **Atomic Checkout Transactions**: Encloses cart retrieval, stock validation, promo code application, order generation, inventory reduction, and cart clearing inside a single ACID PostgreSQL transaction.
* **Ordered Row-Level Stock Locking**: Queries `Stock` records with `SELECT ... FOR UPDATE` ordered by `productId ASC` to prevent PostgreSQL deadlock cycles during concurrent multi-product checkouts.
* **Order Cancellation & Stock Restoration**: Allows users to cancel pending orders, locking the order row and restoring inventory atomically.

### 💳 Payments & Webhook Processing
* **Paymob Gateway Integration**: Decoupled intention-based payment checkout generating secure redirect URLs for credit card transactions.
* **Timing-Safe Webhook Verification**: Computes SHA-512 HMAC signatures over 20 concatenated transaction fields and verifies signatures using `crypto.timingSafeEqual` to defend against timing attacks.
* **Atomic Webhook Idempotency**: Acquires distributed Redis locks via `SET ... EX 3600 NX` per Paymob transaction ID, ensuring webhook callbacks are processed exactly once.
* **Auto-Rollback on Payment Failure**: If a webhook signals payment failure, the order is cancelled and reserved inventory is restored to the stock table.

### 🎟️ Promotions & Campaigns
* **Flexible Discount Engine**: Supports `PERCENTAGE` and `FIXED_AMOUNT` promo codes.
* **Concurrency-Safe Usage Caps**: Enforces campaign-level usage limits with conditional SQL updates (`usedCount < usageLimit`) alongside unique composite database constraints (`campaignId_userId`) to prevent multi-use abuse.

### 📁 Provider-Agnostic File Storage
* **Decoupled Interface**: Abstract `IStorageProvider` contract allowing seamless swaps between local disk, Cloudinary, AWS S3, or other storage engines without altering business logic.
* **Cloudinary Adapter**: Memory-buffered stream uploads (`streamifier`) with strict MIME-type and size validation (5MB max; JPEG, PNG, WebP).
* **Compensating Rollback**: Automatically deletes uploaded images via `Promise.allSettled` if downstream database creation fails.

### ⚙️ Observability & Resilience
* **Structured JSON Logging**: Request tracing with `nestjs-pino` and `pino-pretty`, propagating unique `X-Request-ID` headers across all incoming requests and logging duration.
* **Rate Limiting**: Global API throttling using `@nestjs/throttler` (configurable TTL and request limits), with bypasses on healthcheck probes.
* **Automated Cron Jobs**: Scheduled cleanup (`@nestjs/schedule`) running every 10 minutes to auto-cancel pending orders older than 30 minutes and restore inventory.
* **Input Validation & Sanitization**: Global `ZodValidationPipe` paired with custom HTML sanitization (`sanitize-html`) on string inputs to protect against XSS injections.

---

## Architecture

The application is structured as a **Modular Monolith** using NestJS, enforcing strict domain boundaries and dependency injection principles.

```mermaid
flowchart TD
    Client(["HTTP Client / Frontend"])

    subgraph "NestJS Application Layer"
        MW["Middleware (CookieParser, Cors)"]
        Guard["Guards (ThrottlerGuard, AuthGuard, RolesGuard)"]
        Pipes["Pipes (ZodValidationPipe, ImageUploadPipe)"]
        Interceptor["Interceptors (RequestLogging, TransformInterceptor)"]
        
        subgraph "Modules & Controllers"
            AuthCtrl["Auth Module"]
            UserCtrl["User Module"]
            ProdCtrl["Products Module"]
            CartCtrl["Cart Module"]
            OrderCtrl["Order Module"]
            PromoCtrl["Promo Module"]
            PayCtrl["Payment Module & Webhooks"]
            UploadCtrl["Uploads Module"]
        end
        
        subgraph "Domain Services & Abstractions"
            AuthSvc["AuthService"]
            OrderSvc["OrderService"]
            PaySvc["PaymentService"]
            CronSvc["OrderCleanupService (Cron)"]
            StorageAdapter["IStorageProvider (CloudinaryStorage)"]
            PayGateway["PaymentGateway (PaymobGateway)"]
        end
    end

    subgraph "External Infrastructure & Data Tier"
        PG[(PostgreSQL Database\nPrisma ORM 7 + Driver Adapter)]
        Redis[(Redis 7 Cache & Locks\nioredis)]
        PaymobAPI["Paymob API (Intention & Webhooks)"]
        CloudinaryAPI["Cloudinary CDN"]
        SMTP["SMTP Mail Server"]
    end

    Client --> MW --> Guard --> Interceptor --> Pipes
    Pipes --> AuthCtrl & UserCtrl & ProdCtrl & CartCtrl & OrderCtrl & PromoCtrl & PayCtrl & UploadCtrl

    AuthCtrl --> AuthSvc
    OrderCtrl --> OrderSvc
    PayCtrl --> PaySvc
    UploadCtrl --> StorageAdapter

    AuthSvc --> Redis
    AuthSvc --> PG
    AuthSvc --> SMTP

    OrderSvc --> PG
    OrderSvc --> Redis
    OrderSvc --> PaySvc

    PaySvc --> PayGateway
    PayGateway --> PaymobAPI
    PaySvc --> PG
    PaySvc --> Redis

    StorageAdapter --> CloudinaryAPI
    CronSvc --> PG
```

### Architectural Boundaries
* **Transport Layer**: Receives HTTP requests, validates DTOs via Zod schemas, extracts authentication tokens, and normalizes responses into a uniform `{ success, statusCode, data }` format.
* **Domain Service Layer**: Implements business rules (e.g., checkout workflows, promo math, token hashing, webhook HMAC verification).
* **Provider Layer**: Decouples external third-party SDKs (Cloudinary, Paymob) behind TypeScript interfaces (`IStorageProvider`, `PaymentGateway`).
* **Persistence Tier**: Manages database state via Prisma ORM 7 using native PostgreSQL driver adapters (`@prisma/adapter-pg`) for optimized connection pooling and transactional query execution.

---

## Engineering Decisions

### 1. Why Redis for Sessions, Temporary Signups & Webhook Locks?
* **Decoupled Verification Staging**: Instead of polluting PostgreSQL with unverified account rows, user signup payloads are held in Redis with a 15-minute TTL. Unverified accounts naturally expire without requiring periodic database purge scripts.
* **Stateful Token Invalidation**: Redis provides sub-millisecond lookups for active session validation while allowing instantaneous revocation upon logout or breach detection.
* **Distributed Atomic Locking**: `ioredis` commands like `SET ... EX ... NX` enable atomic lock acquisition for webhook processing, preventing duplicate processing when payment providers retry deliveries.

### 2. Why Database Transactions with Explicit Row Locks (`SELECT ... FOR UPDATE`)?
In high-concurrency checkout environments, reading stock and updating it across multiple statements can lead to race conditions and inventory overselling.
* **Pessimistic Locking**: `SELECT ... FOR UPDATE` acquires an exclusive lock on the stock rows until the transaction commits.
* **Deadlock Prevention via Key Sorting**: If Transaction A locks Product 1 then Product 2, while Transaction B locks Product 2 then Product 1, a database deadlock occurs. Sorting `productId`s in ascending order (`sort((a, b) => a - b)`) ensures all transactions acquire locks in the exact same sequence, eliminating lock cycles.

### 3. Why Two-Tiered Idempotency?
Network timeouts and double clicks often lead to duplicated order placements and charges:
* **Client-Facing Checkout Idempotency**: Uses a client-provided `Idempotency-Key` header stored in Redis as `idempotency:order:${userId}:${key}`. An initial status of `PROCESSING` blocks concurrent executions; once completed, the cached order response is stored for 24 hours.
* **Payment Webhook Idempotency**: Payment gateways (e.g., Paymob) guarantee at-least-once delivery, resulting in duplicate webhooks. An atomic Redis key (`payment:webhook:paymob:${transactionId}`) guarantees single execution.

### 4. Why Provider Abstractions (`IStorageProvider` & `PaymentGateway`)?
Third-party APIs change, deprecate endpoints, or need replacement as business needs evolve.
* The application domain depends solely on abstract interfaces (`IStorageProvider`, `PaymentGateway`).
* Provider implementations (e.g., `CloudinaryStorage`, `PaymobGateway`) are bound via NestJS dependency injection tokens. Switching from Cloudinary to AWS S3 or from Paymob to Stripe requires implementing a new adapter without touching core business services.

---

## Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client
    participant Auth as AuthController / AuthService
    participant Redis as Redis Cache
    participant DB as PostgreSQL
    participant Mail as SMTP Mailer

    Note over User, Mail: Step 1: User Registration
    User->>Auth: POST /api/v1/auth/sign-up (username, email, password)
    Auth->>DB: Check if email exists
    DB-->>Auth: null (available)
    Auth->>Auth: Hash password (Bcrypt)
    Auth->>Redis: SET tempUser:<email> (JSON, 15m TTL)
    Auth->>Mail: Send verification email with link
    Auth-->>User: 201 Created (Verification email sent)

    Note over User, DB: Step 2: Email Verification
    User->>Auth: GET /api/v1/auth/verify?email=...
    Auth->>Redis: GET tempUser:<email>
    Redis-->>Auth: Temp user data
    Auth->>DB: INSERT INTO "User" (isVerified: true)
    Auth->>Redis: DEL tempUser:<email>
    Auth-->>User: 200 OK (User verified)

    Note over User, Redis: Step 3: Login & Session Initialization
    User->>Auth: POST /api/v1/auth/sign-in (email, password)
    Auth->>DB: Find user by email
    DB-->>Auth: User record
    Auth->>Auth: Verify password (Bcrypt)
    Auth->>Auth: Generate 15m JWT Access Token
    Auth->>Auth: Generate 40-byte Random Refresh Token & Session ID
    Auth->>Auth: Hash Refresh Token (Bcrypt)
    Auth->>Redis: SETEX session:<sessionId> (hashedToken, 7d TTL)
    Auth-->>User: Set-Cookie: authPayload=<sessionId>.<refreshToken> (HttpOnly)<br/>Body: { access_token }

    Note over User, Redis: Step 4: Token Refresh & Reuse Detection
    User->>Auth: GET /api/v1/auth/refresh (Cookie: authPayload)
    Auth->>Redis: GET session:<sessionId>
    alt Session Not Found / Expired
        Auth-->>User: 401 Unauthorized
    else Token Match Valid
        Auth->>Auth: Verify raw token against hashed token
        Auth->>Auth: Issue new JWT & Generate new Refresh Token
        Auth->>Redis: SETEX session:<sessionId> (newHashedToken, 7d TTL)
        Auth-->>User: Update Cookie + Return new access_token
    else Token Reuse Detected (Breach)
        Auth->>Redis: DEL session:<sessionId>
        Auth-->>User: 403 Forbidden (Security breach detected)
    end
```

---

## Order & Checkout Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant OrderCtrl as OrderController
    participant Redis
    participant OrderSvc as OrderService
    participant DB as PostgreSQL (ACID Tx)
    participant Paymob as Paymob Gateway

    Client->>OrderCtrl: POST /api/v1/order (Header: Idempotency-Key)
    OrderCtrl->>Redis: GET idempotency:order:<userId>:<key>
    alt Already Processing
        OrderCtrl-->>Client: 409 Conflict ("Order is currently processing")
    else Cached Result Exists
        OrderCtrl-->>Client: 200 OK (Cached Order JSON)
    end

    OrderCtrl->>Redis: SETEX idempotency:order:<userId>:<key> "PROCESSING" (300s)

    OrderCtrl->>OrderSvc: create(createOrderDto, userId)
    
    rect rgb(240, 248, 255)
        note right of DB: PostgreSQL Atomic Transaction
        OrderSvc->>DB: 1. Fetch User Cart
        OrderSvc->>DB: 2. SELECT * FROM "Stock" WHERE productId IN (...) ORDER BY productId ASC FOR UPDATE
        OrderSvc->>OrderSvc: 3. Validate stock availability for all items
        OrderSvc->>DB: 4. Validate & apply promo code (if provided)
        OrderSvc->>DB: 5. INSERT INTO "Order" & "OrderItem"s
        OrderSvc->>DB: 6. UPDATE "Stock" (decrement quantities)
        OrderSvc->>DB: 7. Soft-clear user cart items (isDeleted = true)
    end

    alt Payment Method: CREDIT_CARD
        OrderSvc->>Paymob: Create Payment Intention (amount, billing, items)
        Paymob-->>OrderSvc: { client_secret, checkoutUrl, intention_id }
        OrderSvc->>DB: Record Payment (status: PENDING, provider: PAYMOB)
    end

    OrderSvc-->>OrderCtrl: Order & Payment Info
    OrderCtrl->>Redis: SETEX idempotency:order:<userId>:<key> (Order JSON, 24h TTL)
    OrderCtrl-->>Client: 201 Created (Order details + checkoutUrl)
```

---

## Payment & Webhook Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Paymob as Paymob Server
    participant WebhookCtrl as PaymentWebhookController
    participant WebhookSvc as PaymentWebhookService
    participant HMAC as PaymobHmacService
    participant Idemp as WebhookIdempotencyService (Redis)
    participant PaySvc as PaymentService
    participant DB as PostgreSQL (Tx)

    Paymob->>WebhookCtrl: POST /api/v1/payment/webhooks/paymob?hmac=... (Payload)
    WebhookCtrl->>WebhookSvc: handlePaymobWebhook(payload, hmac)
    
    WebhookSvc->>HMAC: verifyTransactionHmac(payload, hmac)
    alt Invalid HMAC Signature
        HMAC-->>WebhookSvc: false
        WebhookSvc-->>Paymob: 401 Unauthorized ("Invalid signature")
    end

    WebhookSvc->>Idemp: acquire("paymob", transactionId) (SET NX EX 3600)
    alt Lock Acquisition Failed (Already Processed)
        Idemp-->>WebhookSvc: false
        WebhookSvc-->>Paymob: 200 OK ("Webhook already processed")
    end

    WebhookSvc->>PaySvc: handleWebhookTransaction(orderId, transactionId, isSuccess)
    
    rect rgb(240, 255, 240)
        note right of DB: Transactional Order Settlement
        alt isSuccess == true
            PaySvc->>DB: UPDATE "Payment" SET status = 'PAID'
            PaySvc->>DB: UPDATE "Order" SET orderStatus = 'PROCESSING'
        else isSuccess == false
            PaySvc->>DB: UPDATE "Payment" SET status = 'FAILED'
            PaySvc->>DB: UPDATE "Order" SET orderStatus = 'CANCELLED'
            PaySvc->>DB: UPDATE "Stock" SET quantity = quantity + item.quantity (Restoration)
        end
    end

    PaySvc-->>WebhookSvc: Success
    WebhookSvc-->>Paymob: 200 OK ({ success: true })
```

---

## File Storage Architecture

Media uploads are handled via an extensible provider pattern:

```mermaid
classDiagram
    class IStorageProvider {
        <<interface>>
        +upload(file: Express.Multer.File, options: UploadOptions) Promise~UploadedFile~
        +uploadMany(files: Express.Multer.File[], options: UploadOptions) Promise~UploadedFile[]~
        +delete(fileId: string) Promise~void~
    }

    class CloudinaryStorage {
        -cloudinaryService: CloudinaryService
        +upload(file, options)
        +uploadMany(files, options)
        +delete(fileId)
    }

    class UploadsService {
        -storage: IStorageProvider
        +upload(file, options)
        +uploadMany(files, options)
        +delete(fileId)
    }

    IStorageProvider <|.. CloudinaryStorage : implements
    UploadsService --> IStorageProvider : injects
```

* **Memory Storage Buffer**: Incoming multipart images are held in memory buffers using Multer and validated for file type and size using `ImagesUploadPipe`.
* **Compensating Rollback**: When a product with multiple images is created, `ProductsService` uploads the files first. If the subsequent database transaction fails, `deleteUploadedFiles()` calls `this.uploadsService.delete()` via `Promise.allSettled` for each uploaded key to eliminate dangling cloud assets.

---

## Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Runtime & Framework** | Node.js (v20 / v24) | High-performance asynchronous JavaScript engine |
| | NestJS 11 | Enterprise TypeScript framework enforcing modular architecture |
| | TypeScript 5.7 | Strict static typing and compile-time verification |
| **Database & ORM** | PostgreSQL 15 / 16 | Relational database supporting ACID transactions and row locks |
| | Prisma ORM 7.9 | Next-gen ORM configured with `@prisma/adapter-pg` driver adapter |
| **Caching & Locking** | Redis 7 (`ioredis`) | In-memory store for session states, temporary signups, and idempotency locks |
| **Validation & Security** | Zod (`nestjs-zod`) | Runtime schema validation and sanitization |
| | Bcrypt | Password and refresh token hashing |
| | `@nestjs/throttler` | Rate limiting and brute-force protection |
| | `sanitize-html` | XSS sanitization pipe for incoming text |
| **Third-Party Integrations** | Paymob | Payment intention gateway and HMAC-SHA512 webhook integration |
| | Cloudinary | Cloud-based media storage and image transformations |
| | Nodemailer / Handlebars | Transactional verification email delivery |
| **Observability** | `nestjs-pino` & `pino-pretty` | Structured JSON logging with request ID tracking (`X-Request-ID`) |
| **Scheduling** | `@nestjs/schedule` | Cron jobs for automated expired order reconciliation |
| **Documentation** | Swagger / OpenAPI 3.0 | Auto-generated interactive API documentation |
| **DevOps & CI/CD** | Docker & Docker Compose | Multi-stage container builds and local service orchestration |
| | GitHub Actions | Automated CI pipeline (lint, migrations, unit tests, build) |

---

## API Documentation

Interactive API documentation is generated via Swagger / OpenAPI and served directly from the application instance.

* **Swagger UI Endpoint**: [`/api/v1/docs`](http://localhost:3000/api/v1/docs)
* **Global API Prefix**: `/api`
* **API Versioning**: URI Versioning (`v1`)

> [!NOTE]
> All secured endpoints require a `Bearer <access_token>` in the `Authorization` header. Refresh tokens are automatically exchanged via the HttpOnly `authPayload` cookie.

---

## API Examples

### 1. User Sign In
```http
POST /api/v1/auth/sign-in HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "SecurePassword123!"
}
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
*(Sets HttpOnly cookie `authPayload=<sessionId>.<refreshToken>`)*

---

### 2. Create Concurrency-Safe Idempotent Order
```http
POST /api/v1/order HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token>
Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
Content-Type: application/json

{
  "shippingAddressId": 1,
  "paymentMethod": "CREDIT_CARD",
  "promoCode": "SUMMER2026"
}
```
**Response (`201 Created`):**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": 42,
    "userId": 10,
    "shippingCity": "Cairo",
    "shippingStreet": "El Tahrir St",
    "shippingBuilding": "Building 5A",
    "orderStatus": "PENDING",
    "totalAmount": "450.00",
    "paymentMethod": "CREDIT_CARD",
    "payment": {
      "checkoutUrl": "https://accept.paymob.com/unifiedcheckout?publicKey=...&clientSecret=...",
      "clientSecret": "sec_live_..."
    }
  }
}
```

---

### 3. Paymob Webhook Callback
```http
POST /api/v1/payment/webhooks/paymob?hmac=3a8f... HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "type": "TRANSACTION",
  "obj": {
    "id": 12345678,
    "success": true,
    "amount_cents": 45000,
    "currency": "EGP",
    "special_reference": "42",
    "order": {
      "id": 987654
    }
  }
}
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "success": true
  }
}
```

---

## Getting Started

### Prerequisites
* **Node.js**: `v20.x` or `v24.x`
* **npm**: `v10.x+`
* **Docker & Docker Compose** (optional, for containerized execution)
* **PostgreSQL** instance (`v15+`)
* **Redis** instance (`v7+`)

---

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/mohamedhazem4959/Dukaan-Production-Ready-E-commerce-API.git
cd Dukaan-Production-Ready-E-commerce-API

# Install dependencies
npm ci
```

---

### 2. Configure Environment Variables
Create a `.env` file in the project root:

```env
# Application & Server
NODE_ENV=development
PORT=3000
FRONTEND_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
VERIFY_URL=http://localhost:3000/api/v1/auth/verify

# Security & Tokens
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# Database (PostgreSQL & Prisma)
DATABASE_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/e-commerce?schema=public
DATABASE_URL_PROD=postgresql://user:pass@remote-host:5432/e-commerce?schema=public

# Admin Seed Credentials
ADMIN_EMAIL=admin@dukaan.com
ADMIN_PASSWORD=AdminSecurePassword123!
ADMIN_USERNAME=SuperAdmin

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_URL_PROD=redis://default:pass@remote-redis:6379

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Nodemailer / SMTP
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_smtp_user
MAIL_PASS=your_smtp_password

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Paymob Payment Gateway
PAYMOB_API_KEY=your_paymob_api_key
PAYMOB_PUBLIC_KEY=your_paymob_public_key
PAYMOB_SECRET_KEY=your_paymob_secret_key
PAYMOB_HMAC=your_paymob_hmac_secret
PAYMOB_INTEGRATION_ID=123456
PAYMOB_BASE_URL=https://accept.paymob.com
```

---

### 3. Database Migration & Seeding
```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed initial administrative user
npm run prisma:seed
```

---

### 4. Running Locally
```bash
# Development mode with hot-reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

---

## Docker Deployment

The repository includes a multi-stage `dockerfile` and a `docker-compose.yaml` orchestrating PostgreSQL, Redis, and the NestJS application.

### Start All Services
```bash
docker-compose up -d --build
```

### Services Initialized:
* **`postgres_db`**: PostgreSQL 15 on port `5432` with healthcheck probe `pg_isready`.
* **`redis_cache`**: Redis 7 on port `6379` with AOF persistence enabled.
* **`Dukaan-api`**: Multi-stage runner executing migrations on startup before binding to port `3000`.

### View Logs & Status
```bash
# Check container status
docker-compose ps

# Tail application logs
docker-compose logs -f app
```

---

## Testing

The project uses **Jest** for unit testing and **Supertest** for end-to-end integration testing.

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate code coverage report
npm run test:cov

# Run end-to-end (E2E) tests
npm run test:e2e
```

### Covered Test Scenarios
* **Auth Registration & Staging**: Verifies password hashing, Redis TTL temporary storage, and verification email dispatch without creating database records prematurely.
* **DTO & Serialization Parsing**: Validates ISO date-time parsing and OpenAPI metadata definitions on promo payloads.
* **Controller & Service Invocations**: Unit test suites validating service instantiation and mocking dependencies across Auth, Cart, Order, Payment, Category, User, and Upload modules.

---

## CI/CD Pipeline

Continuous Integration is automated via GitHub Actions in [`.github/workflows/CI-backend.yaml`](.github/workflows/CI-backend.yaml).

Every push and pull request to `main` executes:
1. **PostgreSQL Service Container**: Spins up `postgres:16` test database container with health checks.
2. **Environment Setup**: Initializes Node.js `v24` with npm caching.
3. **Dependency Installation**: Runs clean install (`npm ci`).
4. **Prisma Generation & Migration**: Executes `npx prisma generate` and `npx prisma migrate deploy` against the ephemeral database.
5. **Unit Test Suite**: Executes `npm test` verifying application logic and mocking boundaries.
6. **Build Compilation**: Validates TypeScript compilation and output bundling with `npm run build`.

---

## Project Structure

```text
├── .github/
│   └── workflows/
│       └── CI-backend.yaml             # GitHub Actions CI pipeline configuration
├── prisma/
│   ├── migrations/                     # SQL migration history
│   ├── schema.prisma                   # Database models, relations, and enums
│   └── seed.ts                         # Administrative user database seeding
├── src/
│   ├── common/                         # Shared cross-cutting concerns
│   │   ├── decorator/                  # @Public(), @Roles() decorators
│   │   ├── guard/                      # AuthGuard (JWT), RolesGuard (RBAC)
│   │   ├── interceptors/               # RequestLoggingInterceptor (Pino, X-Request-ID)
│   │   ├── logger/                     # AppLoggerModule (nestjs-pino configuration)
│   │   ├── services/                   # HashingService (Bcrypt), RedisService (ioredis)
│   │   └── utils/                      # Zod validation & sanitize-html utilities
│   ├── mail/                           # Nodemailer module & Handlebars email templates
│   ├── modules/
│   │   ├── auth/                       # Signup, Signin, Token Rotation, Email Verification
│   │   ├── cart/                       # User cart management & Cart-Item operations
│   │   ├── categories/                 # Category hierarchy & subcategories
│   │   ├── order/                      # Concurrency-safe checkout, cancellations, cron cleanup
│   │   ├── payment/                    # Paymob gateway, HMAC verification, Webhook idempotency
│   │   ├── products/                   # Product catalog, stock tracking, reviews & ratings
│   │   ├── promo/                      # Promo codes, discount calculation, campaign usage caps
│   │   ├── uploads/                    # IStorageProvider abstraction & Cloudinary adapter
│   │   └── user/                       # User profile, password management, address book
│   ├── app.controller.ts               # Healthcheck ping endpoint
│   ├── app.module.ts                   # Root NestJS application module
│   ├── main.ts                         # Bootstrap entry point (Swagger, Cors, Versioning, Pipes)
│   ├── prisma.service.ts               # PrismaClient instance with @prisma/adapter-pg
│   └── transform.interceptor.ts        # Global standard response wrapper
├── test/
│   ├── app.e2e-spec.ts                 # End-to-end API test suites
│   └── jest-e2e.json                   # Jest E2E configuration
├── docker-compose.yaml                 # Multi-container orchestration (App, Postgres, Redis)
├── dockerfile                          # Multi-stage production container build
├── package.json                        # Scripts and dependency specifications
├── prisma.config.ts                    # Prisma 7 environment and migration config
└── tsconfig.json                       # TypeScript compiler options
```

---

## Security Considerations

* **Constant-Time Signature Verification**: Paymob webhook HMAC-SHA512 hashes are compared via `crypto.timingSafeEqual`, preventing side-channel timing analysis attacks.
* **Token Hijacking Defense**: Hashing refresh tokens with Bcrypt in Redis combined with token rotation ensures that stolen refresh tokens trigger instant session destruction upon reuse.
* **XSS & Content Sanitization**: User inputs are stripped of executable scripts and malicious tags via `sanitize-html` inside custom Zod schema transforms.
* **Pessimistic Locking**: `SELECT ... FOR UPDATE` prevents balance and inventory double-spend vulnerabilities under high concurrency.
* **Rate Limiting Protection**: Configured via `@nestjs/throttler` to guard endpoints from denial-of-service (DoS) and credential-stuffing attacks.
* **Secure Cookie Transmission**: Session cookies are configured with `HttpOnly`, `SameSite=Strict`, and conditionally enforce `Secure` flags in production environments.

---

## Roadmap

- [ ] Add Redis-backed caching decorators for high-throughput product catalog queries.
- [ ] Implement database-level migration transactions for high-availability blue/green deployments.
- [ ] Add integration test suites covering concurrent checkout race conditions using testcontainers.
- [ ] Support additional storage adapters (e.g., AWS S3 / Cloudflare R2).
- [ ] Support additional payment providers (e.g., Stripe / PayPal) under the existing `PaymentGateway` interface.
- [ ] Integrate OpenTelemetry distributed tracing alongside Pino logging.

---

## Design Philosophy

**Dukaan** was designed with the philosophy that robust backend systems prioritize **correctness, data integrity, and resilience** over mere CRUD functionality:

1. **Defensive Concurrency**: Concurrency bugs are prevented at the database lock level (`SELECT ... FOR UPDATE` with sorted keys) rather than relying solely on application-memory state.
2. **Idempotency as a First-Class Citizen**: Every state-mutating operation (orders, payments, webhooks) anticipates duplicate deliveries and network retries.
3. **Decoupled Architecture**: Domain business logic never directly calls external vendor SDKs, isolating the codebase from third-party vendor lock-in through well-defined provider contracts.
