# FieldWorkCam Folder Scan

## Scope

This document summarizes the current folder structure of the `fieldwork-cam` workspace after scanning the repository source folders.

- Scan focus: application code, shared packages, infra, and docs
- Intentionally de-emphasized: `node_modules`, build output, and other vendor/generated content
- Scan date: 2026-04-02

## Top-Level Layout

```text
fieldwork-cam/
|- apps/
|- docs/
|- infra/
|- node_modules/
|- packages/
|- package.json
|- package-lock.json
|- .gitignore
```

## Monorepo Summary

The repository is set up as an npm workspace monorepo.

- Root workspaces:
  - `apps/*`
  - `apps/services/*`
  - `packages/*`
- Root scripts expose service startup shortcuts such as `gateway`, `auth`, `user`, `project`, `notification`, `media`, `ai`, `report`, `billing`, and `submission`

## Apps

### `apps/admin-web`

React + Vite admin portal.

- Key stack:
  - React 19
  - Vite
  - MUI
  - Axios
  - Chart.js
  - React Router
- Main areas:
  - `src/api/` for frontend API clients
  - `src/pages/admin/` for admin-facing screens
  - `src/pages/vendor/` for vendor-facing screens
  - `src/auth/` for auth guards and context
  - `src/layouts/` for admin/vendor layout wrappers
  - `src/routes/` for app routing

Notable file:

- `src/api/analytics.api.js` exists and appears to support the analytics page currently open in your IDE

### `apps/mobile`

Expo + React Native mobile app.

- Key stack:
  - Expo 54
  - React Native 0.81
  - React Navigation
  - Axios
  - TypeScript
- Major folders:
  - `src/screens/` grouped by feature such as auth, camera, projects, reports, billing, support, team, notifications, and performance
  - `src/api/` for mobile API clients
  - `src/components/common/` for reusable UI
  - `src/navigation/` for auth/main navigation
  - `src/theme/` for colors, spacing, and typography
  - `src/services/` for token handling

### `apps/api-gateway`

Express gateway service that fronts downstream services.

- Main folders:
  - `src/config/`
  - `src/middlewares/`
  - `src/routes/`
  - `src/services/`
  - `src/utils/`
- Uses `axios`, `express`, `cors`, `helmet`, and `morgan`

### `apps/services`

Backend microservices folder with 9 services:

1. `ai-service`
2. `auth-service`
3. `billing-service`
4. `media-service`
5. `notification-service`
6. `project-service`
7. `report-service`
8. `submission-service`
9. `user-service`

## Backend Service Pattern

Most services follow a similar Express/Mongoose layout:

```text
src/
|- app.js
|- server.js
|- config/
|- controllers/
|- middlewares/
|- models/
|- repositories/
|- routes/
|- services/
|- utils/
|- validators/
```

Observed supporting patterns:

- `auth-service` and `user-service` also include RabbitMQ config/publisher-consumer files
- Services commonly use:
  - `express`
  - `mongoose`
  - `dotenv`
  - `cors`
  - `helmet`
  - `morgan`
  - `express-validator`
- Several services duplicate utility helpers like `asyncHandler`, `apiResponse`, and `apiError`

## Service Notes

### `auth-service`

- Handles auth logic, OTP flows, JWT work, and event publishing
- Includes:
  - `models/AuthUser.model.js`
  - `models/Otp.model.js`
  - `services/auth.service.js`
  - `services/jwt.service.js`
  - `services/otp.service.js`
  - `scripts/seedAdmin.js`

### `user-service`

- Handles users, staff, vendors, and dashboard-related features
- Includes:
  - `controllers/` for user, staff, vendor, and dashboard
  - `repositories/` and `models/` for user/staff/vendor entities
  - `consumers/auth.consumer.js`
  - `scripts/seedAdminUser.js`

### `project-service`

- Handles projects and service configuration
- Includes models for `Project` and `ServiceConfig`
- Has validators for assignment, notes, project, and service operations

### `media-service`

- Handles media/photo operations
- Includes upload middleware and `Photo.model.js`

### `submission-service`

- Handles submissions with dedicated validator, model, repository, and service layers

### `report-service`

- Covers reports and performance flows
- Includes separate report and performance routes/controllers/services

### `notification-service`

- Handles notifications, support, and tickets
- Includes RabbitMQ consumer/event wiring

### `billing-service`

- Focused on invoice management

### `ai-service`

- Small AI-focused service with route, controller, service, and shared backend structure

## Shared Packages

The `packages/` folder contains reusable workspace packages:

1. `shared-api-contracts`
2. `shared-config`
3. `shared-constants`
4. `shared-events`
5. `shared-middleware`
6. `shared-types`
7. `shared-utils`

Notable contents:

- `shared-constants/src/` contains roles and service name constants
- `shared-events/src/` contains exchange names, event names, and routing keys
- `shared-utils/src/` contains shared async/response helpers

Some shared packages currently appear lightly populated or package-manifest-only.

## Docs

The `docs/` folder is already organized by topic:

1. `api-contracts`
2. `architecture`
3. `database`
4. `event-contracts`
5. `sprint-plans`
6. `ui-notes`

This suggests the repo already has a documentation strategy, even if the contents were not expanded in this scan.

## Infra

`infra/docker-compose.yml` provisions local infrastructure for:

1. MongoDB
2. Redis
3. RabbitMQ

This lines up with the backend service code that references MongoDB and RabbitMQ, and likely supports caching/queueing use cases through Redis and RabbitMQ.

## Practical Observations

### Strengths

- Clear monorepo separation between frontend apps, backend services, shared packages, infra, and docs
- Consistent service-layer folder structure across backend services
- Separate admin web and mobile clients already exist
- Shared package strategy is in place for constants, events, and utilities

### Things to Watch

- `node_modules/` is present in the workspace and is very large, which makes raw folder scans noisy
- Utility/helper code is duplicated across multiple services instead of always pulling from shared packages
- Some shared packages appear to be placeholders or early-stage packages
- A `.git` directory was not visible from the scanned workspace path, so git metadata may live elsewhere or not be included in this local copy

## Suggested Next Documentation Files

If you want, the next useful docs to generate from this scan would be:

1. A service-by-service endpoint inventory
2. A frontend page-to-API mapping document
3. A dependency map showing how gateway, services, MongoDB, RabbitMQ, and clients connect
4. A focused scan for `apps/admin-web` only
