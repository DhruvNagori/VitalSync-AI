# VitalSync AI

**An AI-enabled healthcare monitoring and patient-care web application**

VitalSync AI is a web-based healthcare platform with separate patient and doctor portals. It brings together health information views, symptom tracking, medical-document management, appointment workflows, hospital discovery, and doctor–patient care interactions in one interface.

> **Safety notice:** VitalSync AI is an academic/demo software project. It is not a certified medical device, does not provide a medical diagnosis, and must not be used for emergencies or as the sole basis for medical decisions. Use synthetic or de-identified data for development and demonstrations.

---

## Contents

- [Overview](#overview)
- [Features](#features)
- [Technology stack](#technology-stack)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment configuration](#environment-configuration)
- [Run and build](#run-and-build)
- [Repository structure](#repository-structure)
- [Application workflows](#application-workflows)
- [Data storage and privacy](#data-storage-and-privacy)
- [GitHub contribution workflow](#github-contribution-workflow)
- [Troubleshooting](#troubleshooting)
- [Disclaimer](#disclaimer)

## Overview

VitalSync AI provides two role-specific interfaces.

### Patient Portal

The patient-facing interface includes a health overview, symptom recording, health-history views, medical records, appointment requests, hospital discovery, messaging, and care-plan updates.

### Doctor Portal

The doctor-facing interface includes appointment request management, patient workspaces, consent-based health information, consultation notes, care plans, messaging, doctor profile settings, and patient insights.

The current repository contains the React/Vite frontend. Some demonstration workflows use browser-side storage. A user interface should not be assumed to be connected to a production backend, database, or AI model unless that service is implemented and configured.

## Features

### Patient portal

- Patient dashboard and health overview.
- Health analytics and charts.
- Symptom recording.
- Health-history view.
- Medical-record and document management.
- AI assistant interface.
- Appointment requests and doctor selection.
- Consent selection for supported health information shared with the assigned doctor.
- Individual selection of medical documents for sharing.
- Hospital discovery and map interface using the Geoapify integration.
- Connected-devices interface.
- Patient profile.
- Appointment-linked messaging.
- Patient view of doctor-created care-plan and follow-up items.

### Doctor portal

- Doctor dashboard.
- Appointment request review and status management.
- Patient directory.
- Patient-care workspace.
- Review of information shared through the appointment's consent selection.
- Consultation notes and care-plan management.
- Appointment-linked patient messaging.
- Doctor profile and weekly availability settings.
- Consent-based patient health insights.

### Health information consent

The appointment workflow supports patient selection of available information categories, including:

- Recorded symptoms.
- The symptom-based health-history timeline.
- Individually selected medical documents.
- A patient-written health summary.

The information shared with a doctor is limited to the information selected for that appointment request. Other information should remain outside that request's shared snapshot.

Health metrics and wearable readings should only be presented as real patient data when their actual data sources are connected and implemented.

## Technology stack

| Area | Technology |
|---|---|
| Frontend framework | React 19 |
| Development/build tool | Vite 8 |
| Language | JavaScript and JSX |
| Styling | Tailwind CSS 4 and project CSS |
| Routing | React Router DOM 7 |
| HTTP client | Axios |
| Icons | Lucide React |
| Charts | Recharts |
| Maps | Leaflet and React Leaflet |
| Hospital discovery | Geoapify integration |
| Browser-side demo persistence | Local Storage and IndexedDB |

The versions above reflect the dependency declarations shown in `package.json`. `package-lock.json` is the dependency-resolution source of truth. Use the committed files rather than manually installing different versions.

## Requirements

Install:

1. **Node.js** — use an active LTS release compatible with the Vite version in `package.json`.
2. **npm** — included with Node.js.
3. **Git** — for cloning and contributing through GitHub.
4. **Code editor** — Visual Studio Code is recommended.
5. A Geoapify key only if required by the local hospital-discovery configuration.

Verify the tools:

```bash
node --version
npm --version
git --version
```

## Installation

### 1. Clone the repository

Replace the placeholders with the actual GitHub account and repository name:

```bash
git clone https://github.com/<github-username>/<repository-name>.git
cd <repository-name>
```

### 2. Install dependencies

Run this command in the project root, where `package.json` is located:

```bash
npm install
```

This installs the packages declared by the project and resolves them using `package-lock.json`.

The current frontend dependency declarations include:

- `react`
- `react-dom`
- `react-router-dom`
- `axios`
- `lucide-react`
- `recharts`
- `leaflet`
- `react-leaflet`
- `tailwindcss`
- `@tailwindcss/vite`

Development dependencies include Vite, the React Vite plugin, ESLint, and React type packages. `npm install` installs the declared dependencies; installing them individually is not necessary.

When adding or updating a dependency, use npm and commit both `package.json` and `package-lock.json`.

## Environment configuration

The repository includes a safe `.env.example` template. Environment files containing local values or credentials must not be committed.

### Create a local environment file

After cloning, create `.env.local` in the project root by copying `.env.example`.

macOS/Linux:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

The local API base URL template is:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

This points the frontend to a FastAPI backend running locally on port `8000`. The backend must be started separately for API calls to succeed. If the backend uses a different host, port, or API prefix, update this value in the local `.env.local` file.

### Geoapify configuration

The local `.env` file may contain a Geoapify API key used by the hospital-discovery service. Do not commit that file.

Before adding a Geoapify placeholder to `.env.example`, check `src/services/hospitalService.js` for the exact environment variable name used by the code. Add that variable name with a placeholder only; never copy the real key.

**Frontend key warning:** Vite variables prefixed with `VITE_` are included in the browser bundle and can be inspected by users. A Geoapify key used in frontend code is not a private secret. Restrict it through provider settings (for example, allowed domains/referrers and usage limits) where supported. Database passwords, private API keys, JWT signing secrets, OAuth client secrets, and other privileged credentials must stay on the backend.

### Environment files: what to commit

| File | Commit to GitHub? | Purpose |
|---|---:|---|
| `.env` | No | Local values; may contain the Geoapify key |
| `.env.local` | No | Machine-specific backend URL and local overrides |
| `.env.example` | Yes | Safe template with placeholder values only |

The file must be named exactly `.env.example` (without a trailing colon). Do not rename it to `.env`; the example file is intended to be safe to publish.

## Run and build

### Start the frontend development server

```bash
npm run dev
```

Open the URL printed by Vite in the terminal. The default is commonly:

```text
http://localhost:5173
```

Stop the server with `Ctrl + C`.

### Run linting

```bash
npm run lint
```

### Create a production build

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

These commands are defined in `package.json`.

### Backend URL note

The frontend environment template points to `http://localhost:8000/api/v1`. This is only a URL configuration; it does not install or start FastAPI. If no backend is running at that address, API requests that depend on it will fail. Start the backend separately when its source and setup instructions are available.

## Repository structure

```text
healthcare-website/
├── public/                         # Public static assets
├── src/
│   ├── assets/                     # Application assets
│   ├── components/
│   │   ├── appointments/           # Calendar and time-slot components
│   │   ├── common/                 # Shared UI and protected-route components
│   │   ├── doctor/                 # Doctor sidebar and topbar
│   │   ├── hospitals/              # Hospital cards
│   │   └── patient/                # Patient dashboard, health and navigation UI
│   ├── context/
│   │   └── AuthContext.jsx         # Authentication/application user context
│   ├── data/
│   │   └── patientDashboardData.js # Patient dashboard data
│   ├── layouts/
│   │   ├── AuthLayout.jsx
│   │   ├── DoctorLayout.jsx
│   │   └── PatientLayout.jsx
│   ├── pages/
│   │   ├── auth/                   # Login and registration pages
│   │   ├── doctor/                 # Doctor dashboard and care pages
│   │   ├── patient/                # Patient health and care pages
│   │   └── LandingPage.jsx
│   ├── services/
│   │   ├── api.js                  # API helper
│   │   ├── doctorService.js        # Doctor and appointment demo services
│   │   └── hospitalService.js      # Hospital discovery/location service
│   ├── styles/                     # Doctor, patient and global styles
│   ├── utils/
│   │   ├── healthHistoryStorage.js
│   │   └── medicalRecordsStorage.js
│   ├── App.jsx                     # Application routes
│   ├── index.css                   # Stylesheet entry point
│   └── main.jsx                    # React application entry point
├── .env                            # Local environment values; do not commit
├── .env.local                      # Local overrides; do not commit
├── .env.example                    # Safe configuration template
├── .gitignore                      # Git exclusion rules
├── index.html                      # Vite HTML entry point
├── package.json                    # Dependencies and npm scripts
├── package-lock.json               # Locked dependency versions
├── vite.config.js                  # Vite configuration
└── README.md                       # Project documentation
```

`node_modules/` and `dist/` may appear locally after installation or build. They are generated directories and should not be committed.

## Key application workflows

### Patient appointment and consent

1. The patient opens the appointment page.
2. The patient selects an available facility, doctor, date, and time.
3. The patient chooses which supported health-information categories to share.
4. The patient can select individual medical documents and optionally provide a written summary.
5. The appointment request stores the selected consent information.
6. The assigned doctor reviews the request and the information included in that request's consent snapshot.

### Doctor patient care

1. The doctor reviews appointment requests assigned to their account.
2. The doctor opens the patient workspace from an assigned request.
3. The doctor reviews the information shared for that appointment.
4. The doctor can add consultation notes and care-plan items.
5. The patient can view doctor-created care-plan and follow-up information in the patient portal.

### Messaging

The messaging interface supports conversations between patients and doctors connected through appointment requests. In the current browser-based demonstration, messages use browser-side storage. This is not a production real-time messaging service and must not be used for emergency communication.

## Data storage and privacy

Healthcare-related information is sensitive. Never push any of the following to a public or shared Git repository:

- `.env`, `.env.local`, or other environment files containing real values.
- API keys, access tokens, refresh tokens, passwords, or private keys.
- Database URLs, usernames/passwords, or production connection strings.
- JWT signing secrets, encryption keys, OAuth client secrets, or service-account files.
- Real patient names, phone numbers, email addresses, medical histories, prescriptions, scans, reports, or other identifiable health information.
- Real medical documents uploaded through the application.
- Database dumps, production exports, or backups containing personal data.
- Browser storage exports or IndexedDB data.
- Logs containing credentials, authorization headers, personal information, or health information.
- Private certificates and credential files.

### Browser storage limitations

Some demonstration workflows use Local Storage and IndexedDB:

- Data is stored in the browser, not automatically in a shared server database.
- Data may not appear on another device, browser profile, or deployment.
- Browser storage is not a secure authorization boundary.
- A person with access to the browser profile may inspect or modify local data.
- Local demo messaging is not a production real-time service.

Use synthetic data only. A production healthcare system requires server-side authentication and authorization, secure document storage, encrypted transport, audit logging, robust consent enforcement, backups, and review of applicable privacy and healthcare regulations.

### If a secret is accidentally committed

1. Revoke or rotate the exposed credential immediately.
2. Review provider access logs for suspicious activity.
3. Remove the secret from the repository and Git history using an appropriate history-rewrite process.
4. Coordinate history rewriting with everyone who has cloned the repository.
5. Do not assume deleting the latest file makes the credential safe; old commits and clones may still contain it.

## GitHub contribution workflow

### Clone and install

```bash
git clone https://github.com/<github-username>/<repository-name>.git
cd <repository-name>
npm install
```

Create `.env.local` from `.env.example`, configure local values, then run `npm run dev`.

### Create a feature branch

```bash
git pull origin main
git switch -c feature/short-description
```

Examples:

```text
feature/patient-profile
fix/appointment-validation
docs/setup-instructions
```

### Review, commit, and push

```bash
git status
git diff
```

Stage only the intended files:

```bash
git add <file-or-directory>
```

Commit and push:

```bash
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Open a Pull Request and explain what changed, why it changed, how it was tested, and whether configuration or migration steps are needed.

### Repository hygiene

- Use feature branches and Pull Requests.
- Pull the latest default branch before starting work.
- Avoid force-pushing shared branches.
- Do not commit `node_modules/`, `dist/`, credentials, logs, local databases, or real health data.
- Commit `package-lock.json` when dependencies change.
- Run `npm run lint` and `npm run build` before submitting a Pull Request.
- Do not include credentials or real health information in screenshots, test fixtures, issues, or Pull Request descriptions.

## Troubleshooting

### `npm: command not found`

Install Node.js, reopen the terminal, and verify:

```bash
node --version
npm --version
```

### Dependencies are missing

Run this in the directory containing `package.json`:

```bash
npm install
```

### Vite cannot resolve an import

Check that the file exists, the import path and filename capitalization match, the package is declared in `package.json`, and dependency installation completed.

### The browser displays a blank page

1. Open browser developer tools and inspect the Console.
2. Check the terminal running Vite for build/transform errors.
3. Fix the first reported error before investigating later errors.
4. Restart the development server if necessary.

### Environment changes are not reflected

Restart Vite after changing environment files. Confirm that the variable name matches the one referenced in source code.

## Disclaimer

VitalSync AI is an educational software project. It is not intended to diagnose, treat, cure, or prevent any disease, and it does not replace consultation with qualified healthcare professionals. Do not use it for emergencies or as the sole basis for medical decisions. Use synthetic or de-identified data for development and demonstrations.
