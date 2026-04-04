# FieldWorkCam Repository Scan

## Purpose

This document is a repo-level understanding note for the current `fieldwork-cam` workspace. It is meant to capture what is actually present in the folder today, how the main parts fit together, and where implementation is complete versus still scaffolded.

- Scan date: 2026-04-04
- Workspace root: `fieldwork-cam/`
- Focus: product code, runtime structure, docs scaffolding, and implementation patterns
- De-emphasized: `node_modules/`, Expo cache output, and other vendor/generated content

## Recent Implementation Updates

The following repo changes were completed after the initial scan and are now part of the current working state:

- fixed `413 Entity Too Large` on profile update by removing the duplicate default JSON body parser from `user-service`
- fixed admin and vendor profile image/banner rendering in web by:
  - normalizing media URLs in the frontend
  - making gateway profile image URLs safer behind proxy/host differences
  - updating profile UI state immediately after save
- fixed image flicker/disappear issues caused by cross-origin resource policy headers by relaxing `helmet` image response behavior in:
  - `api-gateway`
  - `user-service`
  - `media-service`
- enabled working interactive map preview in admin create-project page using a Google Maps embed URL derived from the typed address
- fixed mobile project cover image rendering by normalizing project media URLs in the mobile API layer
- fixed admin submission review image rendering for photos uploaded from mobile
- hid earnings navigation and dashboard earnings card for `STAFF` users in the mobile app
- fixed vendor web project-to-staff assignment flow by forwarding auth correctly through the gateway
- added success messages for vendor assignment actions in web
- added staff unassign/remove-from-project flow across:
  - admin web APIs
  - API gateway team/project routes
  - `project-service`
  - `user-service`
- improved vendor assignment sync so project-side and staff-side assignments are reconciled, which fixes cases where mobile staff saw fewer assigned projects than vendor web
- enabled gallery image selection inside the mobile camera flow so users can:
  - pick from device gallery
  - continue through preview
  - upload
  - run AI verification
  - submit normally
- fixed mobile vendor/staff profile avatar and banner rendering by normalizing user and vendor profile media URLs in mobile user APIs
- fixed mobile staff profile image upload error under Expo 54 by switching deprecated `expo-file-system` usage to the legacy import required for `readAsStringAsync`

## Top-Level Structure

```text
fieldwork-cam/
|- .run-logs/
|- .vscode/
|- apps/
|  |- admin-web/
|  |- api-gateway/
|  |- mobile/
|  |- services/
|- docs/
|- infra/
|- node_modules/
|- packages/
|- FOLDER_SCAN.md
|- package.json
|- package-lock.json
|- .gitignore
```

## Monorepo Setup

The repository is an npm workspace monorepo.

- Root workspaces:
  - `apps/*`
  - `apps/services/*`
  - `packages/*`
- Root scripts are focused on backend startup:
  - `npm run gateway`
  - `npm run auth`
  - `npm run user`
  - `npm run project`
  - `npm run notification`
  - `npm run media`
  - `npm run ai`
  - `npm run report`
  - `npm run billing`
  - `npm run submission`

The root package is intentionally thin. Most of the real application logic sits in the individual workspaces.

## Runtime Architecture

At a high level, the repo contains:

1. A web admin/vendor frontend in `apps/admin-web`
2. A mobile vendor/staff workflow app in `apps/mobile`
3. An Express API gateway in `apps/api-gateway`
4. Nine backend microservices in `apps/services`
5. Shared workspace packages in `packages`
6. Local infrastructure definitions in `infra/docker-compose.yml`

### Default local ports

Based on the checked-in env configs, the local service map is:

- API gateway: `4000`
- Auth service: `4001`
- User service: `4002`
- Project service: `4003`
- Notification service: `4004`
- Media service: `4005`
- AI service: `4006`
- Report service: `4007`
- Billing service: `4008`
- Submission service: `4009`
- Admin web: Vite default dev server, usually `5173`

### Infra dependencies

`infra/docker-compose.yml` provisions:

- MongoDB on `27017`
- Redis on `6379`
- RabbitMQ on `5672`
- RabbitMQ management UI on `15672`

MongoDB and RabbitMQ are clearly used by the backend code. Redis is provisioned in infra, but its usage was not obvious in the scanned application code.

## Apps

## `apps/admin-web`

This is a React + Vite frontend for two roles:

- `ADMIN`
- `VENDOR_OWNER`

### Stack

- React 19
- Vite 8
- MUI 7
- Axios
- React Router 7
- Chart.js / `react-chartjs-2`

### Main folder layout

```text
apps/admin-web/
|- public/
|- src/
|  |- api/
|  |- assets/
|  |- auth/
|  |- components/
|  |- layouts/
|  |- pages/
|  |  |- admin/
|  |  |- auth/
|  |  |- billing/
|  |  |- dashboard/
|  |  |- notifications/
|  |  |- projects/
|  |  |- reports/
|  |  |- review/
|  |  |- vendor/
|  |- routes/
|  |- App.jsx
|  |- App.css
|  |- styles.css
|  |- theme.js
|- package.json
|- README.md
|- vite.config.js
```

### What it currently does

The router in `src/routes/AppRouter.jsx` shows a fairly complete role-based UI:

- Public/auth screens:
  - `LoginPage`
  - `AcceptInvitePage`
- Admin area:
  - dashboard
  - project list/create/edit/details
  - vendor list/details/create
  - invoices
  - analytics
  - services
  - support
  - profile/edit profile
  - submission review
- Vendor area:
  - dashboard
  - projects and project details
  - staff/team management
  - invoices
  - earnings
  - performance
  - support
  - vendor profile

### Auth/session pattern

`src/auth/AuthContext.jsx` stores auth state in `localStorage` using:

- `auth_token`
- `auth_user`

It validates sessions by calling:

- `/vendors/me/profile` for vendor owners
- `/users/profile` for other roles

### API client layout

`src/api/` is organized by feature, including:

- `auth.api.js`
- `admin.api.js`
- `analytics.api.js`
- `dashboard.api.js`
- `invoice.api.js`
- `media.api.js`
- `notification.api.js`
- `project.api.js`
- `service.api.js`
- `staff.api.js`
- `submission.api.js`
- `support.api.js`
- `vendor.api.js`

This app is not a shell anymore; it already maps closely to the backend domains.

## `apps/mobile`

This is an Expo + React Native TypeScript app oriented around field/vendor workflows.

### Stack

- Expo 54
- React Native 0.81
- React 19
- React Navigation 7
- Axios
- TypeScript
- Expo camera, image picker, image manipulator, file system, and location

### Main folder layout

```text
apps/mobile/
|- assets/
|- src/
|  |- api/
|  |- components/common/
|  |- navigation/
|  |- screens/
|  |  |- auth/
|  |  |- billing/
|  |  |- camera/
|  |  |- capture/
|  |  |- dashboard/
|  |  |- earnings/
|  |  |- notifications/
|  |  |- performance/
|  |  |- profile/
|  |  |- projects/
|  |  |- reports/
|  |  |- settings/
|  |  |- submission/
|  |  |- support/
|  |  |- team/
|  |  |- uploads/
|  |- services/
|  |- theme/
|  |- types/
|  |- utils/
|- App.tsx
|- app.json
|- index.ts
|- metro.config.js
|- tsconfig.json
```

### Navigation shape

The app has:

- An auth stack:
  - `Splash`
  - `Login`
  - `Otp`
  - `VendorProfile`
  - `MainApp`
- A main bottom tab flow:
  - `Home`
  - `Projects`
  - `Capture`
  - `Earnings`
  - `Support`
- A deeper native stack for:
  - notifications
  - profile and settings
  - team management
  - project details/timeline/filter/map
  - camera capture and upload pipeline
  - AI verification
  - reports
  - invoice creation/preview
  - performance dashboard

### What the mobile app appears to cover

This is not just a login shell. It includes end-to-end vendor workflows for:

- onboarding and OTP auth
- profile setup
- project browsing and filtering
- photo capture and upload
- AI verification review
- submission tracking
- reports
- earnings and invoice raise flows
- team/staff management
- support tickets
- notifications

### API client layout

`src/api/` includes clients for:

- `auth`
- `dashboard`
- `media`
- `project`
- `submission`
- `report`
- `performance`
- `billing`
- `notification`
- `support`
- `team`
- `user`
- `notes`
- `ai`

The mobile frontend is tightly aligned with the backend service boundaries.

## `apps/api-gateway`

This is the public-facing Express gateway that fronts all backend services.

### Stack

- Express 5
- Axios
- CORS
- Helmet
- Morgan

### Main responsibilities

- expose a unified `/api/*` surface
- forward requests to downstream services
- apply request logging and centralized error handling
- keep frontend clients mostly unaware of direct microservice URLs

### Route prefixes mounted by the gateway

- `/api/auth`
- `/api/users`
- `/api/dashboard`
- `/api/projects`
- `/api/notifications`
- `/api/team`
- `/api/support`
- `/api/media`
- `/api/ai`
- `/api/reports`
- `/api/invoices`
- `/api/performance`
- `/api/submissions`
- `/api/services`
- `/api/vendors`

### Observations

- The gateway env config includes all downstream service URLs.
- There is a naming inconsistency in config: `Media_SERVICE_URL` is capitalized differently from the other service keys.
- The gateway has a checked-in `temp-uploads/` folder, which suggests some multipart upload forwarding or temporary file buffering.

## Backend Services

The repository contains nine backend services:

1. `auth-service`
2. `user-service`
3. `project-service`
4. `notification-service`
5. `media-service`
6. `ai-service`
7. `report-service`
8. `billing-service`
9. `submission-service`

### Common backend pattern

Most services follow a consistent Express + Mongoose layout:

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

Common dependencies across services include:

- Express 5
- Mongoose
- Helmet
- CORS
- Morgan
- JWT-based auth middleware
- `express-validator` in most write-heavy services

Common duplicated helpers appear in many services:

- `asyncHandler`
- `apiResponse`
- `apiError`

This suggests a codebase that intends to centralize utility behavior, but has not fully migrated all services to shared packages yet.

### `auth-service`

Primary purpose:

- authentication
- OTP flow
- invite flow
- JWT issuance
- email sending
- event publishing

Notable contents:

- `models/AuthUser.model.js`
- `models/Otp.model.js`
- `services/auth.service.js`
- `services/jwt.service.js`
- `services/otp.service.js`
- `services/email.service.js`
- `services/publisher.service.js`
- `config/rabbitmq.js`
- `scripts/seedAdmin.js`

Routes in `src/routes/auth.routes.js`:

- `POST /auth/login-phone`
- `POST /auth/login-email`
- `POST /auth/send-otp`
- `POST /auth/verify-otp`
- `POST /auth/invite-user`
- `POST /auth/accept-invite`

Default local port: `4001`

### `user-service`

Primary purpose:

- user profile management
- vendor profile management
- team/staff management
- dashboard data
- auth-related event consumption

Notable contents:

- `models/User.model.js`
- `models/VendorProfile.model.js`
- `models/StaffProfile.model.js`
- `controllers/user.controller.js`
- `controllers/vendor.controller.js`
- `controllers/staff.controller.js`
- `controllers/dashboard.controller.js`
- `consumers/auth.consumer.js`
- `config/rabbitmq.js`
- `utils/profileMediaStorage.js`
- `scripts/seedAdminUser.js`

Mounted route groups:

- `/users`
- `/vendors`
- `/dashboard`
- `/team`

Notable team routes include:

- get team list
- get team stats
- add staff
- get staff details
- assign project to staff
- update staff status
- update staff details
- remove staff

The service also calls `auth-service` to invite users from team/staff workflows.

Default local port: `4002`

### `project-service`

Primary purpose:

- project CRUD
- service configuration catalog
- project notes
- vendor assignment
- staff assignment
- project status transitions

Notable contents:

- `models/Project.model.js`
- `models/ServiceConfig.model.js`
- `controllers/project.controller.js`
- `controllers/service.controller.js`
- validators for:
  - project creation/update/status
  - notes
  - assignment
- `utils/projectMediaStorage.js`
- `services/notification.service.js`

Mounted route groups:

- `/projects`
- `/services`

Important project routes include:

- list projects
- get project by ID
- create project
- update project
- delete project
- get/add notes
- assign vendor
- assign staff
- update status

Default local port: `4003`

### `notification-service`

Primary purpose:

- user notifications
- support requests
- ticket management
- event-driven notification intake

Notable contents:

- `models/Notification.model.js`
- `models/Ticket.model.js`
- `controllers/notification.controller.js`
- `controllers/support.controller.js`
- `controllers/ticket.controller.js`
- `events/notification.consumer.js`
- `config/rabbitmq.js`
- `services/notification.service.js`
- `services/support.service.js`
- `services/ticket.service.js`

Mounted route groups:

- `/notifications`
- `/tickets`
- `/support`

Notable notification routes include:

- create internal notification
- get notifications
- mark single notification read
- mark all read
- clear all
- get unread count

Default local port: `4004`

### `media-service`

Primary purpose:

- photo upload and storage
- photo retrieval by project/submission
- metadata update
- deletion
- AI result persistence

Notable contents:

- `models/Photo.model.js`
- `middlewares/upload.middleware.js`
- `routes/media.routes.js`
- `services/media.service.js`

The service exposes its upload folder as static files and uses `multer`.

Observed checked-in runtime artifacts:

- multiple `.jpg` files already exist under `uploads/`

That suggests local test data or retained dev assets are currently tracked in the workspace.

Default local port: `4005`

### `ai-service`

Primary purpose:

- photo verification
- batch verification
- project-level AI processing

Notable contents:

- `controllers/ai.controller.js`
- `services/ai.service.js`
- `routes/ai.routes.js`
- dependency on `sharp`

The AI service talks back to `media-service` to fetch media data and write AI result updates.

Default local port: `4006`

### `report-service`

Primary purpose:

- project reports
- performance summaries

Notable contents:

- `models/Report.model.js`
- `controllers/report.controller.js`
- `controllers/performance.controller.js`
- `services/report.service.js`
- `services/performance.service.js`

Mounted route groups:

- `/reports`
- `/performance`

This service integrates with project and media services to assemble report data.

Default local port: `4007`

### `billing-service`

Primary purpose:

- invoice creation
- invoice listing and detail retrieval
- invoice-triggered notification/project status updates

Notable contents:

- `models/Invoice.model.js`
- `controllers/invoice.controller.js`
- `services/invoice.service.js`
- `services/notification.service.js`

Mounted route group:

- `/invoices`

The billing service uses project-service and notification-service during invoice workflows.

Default local port: `4008`

### `submission-service`

Primary purpose:

- submission creation
- submission review state changes
- linking project/media state to review actions
- internal notification triggers

Notable contents:

- `models/Submission.model.js`
- `controllers/submission.controller.js`
- `services/submission.service.js`
- `services/notification.service.js`

Mounted route group:

- `/submissions`

Notable routes include:

- create submission
- list submissions
- get submission by ID
- approve submission
- reject submission

This service coordinates with project, media, and notification services.

Default local port: `4009`

## Service Interaction Summary

The following dependencies were evident in code:

- `api-gateway` forwards to all backend services
- `user-service` calls `auth-service` for invite flows
- `project-service` calls `notification-service`
- `submission-service` calls:
  - `project-service`
  - `media-service`
  - `notification-service`
- `report-service` calls:
  - `project-service`
  - `media-service`
- `billing-service` calls:
  - `project-service`
  - `notification-service`
- `ai-service` calls `media-service`
- `auth-service`, `user-service`, and `notification-service` include RabbitMQ-related code

This is a genuine service-oriented architecture rather than a single API split into folders.

## Shared Packages

The `packages/` workspace contains:

1. `shared-api-contracts`
2. `shared-config`
3. `shared-constants`
4. `shared-events`
5. `shared-middleware`
6. `shared-types`
7. `shared-utils`

### What is implemented today

#### `shared-constants`

Contains reusable constants:

- roles
- service names

#### `shared-events`

Contains event vocabulary:

- exchange names
- event names
- routing keys

This aligns with the RabbitMQ usage in auth/user/notification flows.

#### `shared-utils`

Contains:

- async handler
- response helpers

### What is still mostly scaffolded

These packages currently have `src/` folders but no populated source files were found during the scan:

- `shared-api-contracts`
- `shared-config`
- `shared-middleware`
- `shared-types`

So the shared package strategy is present, but only partly realized.

## Docs

The repo contains documentation topic folders:

- `docs/api-contracts`
- `docs/architecture`
- `docs/database`
- `docs/event-contracts`
- `docs/sprint-plans`
- `docs/ui-notes`

During this scan, no files were found under those directories. At the moment, `docs/` is acting more like prepared structure than active documentation content.

## Data, Upload, and Generated Folders

Some runtime-related folders are checked into the workspace:

- `apps/api-gateway/temp-uploads/`
- `apps/services/media-service/uploads/`
- `apps/mobile/.expo/`

These are useful to note because they can make repository scans noisy and may represent local state rather than durable source code.

## What Feels Most Mature

The strongest implementation areas appear to be:

- multi-role admin web UI
- mobile vendor workflow UI
- API gateway route coverage
- user/team/vendor management
- project and assignment flows
- media upload and AI verification chain
- notifications/support/tickets
- reporting, billing, and submissions

This repo already has broad product surface area implemented across frontend and backend.

## What Looks Partially Complete or In Progress

- several `docs/` areas are scaffolded but empty
- several shared packages are scaffolded but empty
- utility code is still duplicated across services
- checked-in upload/temp folders suggest local runtime artifacts are mixed into the repo
- a few config naming inconsistencies exist, such as `Media_SERVICE_URL`

## Bottom-Line Understanding

`fieldwork-cam` is a monorepo for a field operations platform with:

- one admin/vendor web frontend
- one mobile field app
- one API gateway
- nine backend domain services
- MongoDB-backed service persistence
- RabbitMQ-based event plumbing in selected services
- early shared-package and docs scaffolding

Functionally, the platform appears to support:

- authentication and invitation
- vendor onboarding
- team/staff management
- project setup and assignment
- field photo capture and upload
- AI-assisted media verification
- submission review
- reports and performance tracking
- invoices/earnings
- notifications and support tickets

In short: this is a fairly complete product skeleton with many implemented features, plus some unfinished standardization/documentation work around shared packages and formal docs.
