# Vallentuna Kommun - Tidsregistreringssystem

Ett modernt webbbaserat system för hantering av kunder, ärenden och tidsregistreringar för Vallentuna kommun.
# Statistik Vallentuna

## Funktioner

- **Kundhantering**: Registrera och hantera kunder
- **Ärendesystem**: Skapa och spåra ärenden med olika insatser
- **Tidsregistrering**: Registrera arbetstid för olika ärenden
- **Statistik**: Översikt och analys av aktiviteter
- **Användarhantering**: Rollbaserad åtkomst (admin/behandlare)
- **Responsiv design**: Fungerar på alla enheter

## Teknisk stack

### Frontend
- React 18 + TypeScript
- Vite (byggverktyg)
- Tailwind CSS (styling)
- Radix UI (komponenter)
- React Router (navigering)

### Backend
- Node.js + Express
- PostgreSQL (databas)
- JWT-autentisering
- Rate limiting & säkerhet

## Förutsättningar

- [Node.js](https://nodejs.org/) (version 18 eller senare)
- [npm](https://www.npmjs.com/) eller [yarn](https://yarnpkg.com/)
- PostgreSQL-databas

## Kom igång

### 1. Installera beroenden

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### 2. Konfigurera miljövariabler

Skapa en `.env`-fil i projektets rot (se [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)):

```bash
VITE_API_URL=http://localhost:4000/api
VITE_APP_NAME=Vallentuna Kommun
```

### 3. Starta utvecklingsservern

```bash
# Frontend (port 5173)
npm run dev

# Backend (port 4000)
cd backend
npm run dev
```

### 4. Öppna applikationen

Gå till [http://localhost:5173](http://localhost:5173) i din webbläsare.

## Projektstruktur

```
src/
├── components/          # Återanvändbara UI-komponenter
├── contexts/           # React contexts (Auth, etc.)
├── lib/               # API-klienter och utilities
├── routes/            # Routning och navigation
├── screens/           # Huvudsidor och vyer
└── types/             # TypeScript-typer
```

## Skript

```bash
# Utveckling
npm run dev

# Bygg för produktion
npm run build

# Backend utveckling
cd backend && npm run dev
```

## Dokumentation

- [Miljövariabler](./ENVIRONMENT_SETUP.md)
- [Admin-manual](./docs/ADMIN_MANUAL.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Onboarding](./docs/ONBOARDING_GUIDE.md)
 - [Retention/Gallring](./docs/RETENTION_POLICY.md)

## Snabbguide: Migration i produktion

Om backend svarar 500 p.g.a. saknade tabeller/kolumner, kör den inbyggda, idempotenta migrationen i backend:

- Filer:
  - `backend/create_base_schema.sql` – skapar alla nödvändiga tabeller om de saknas
  - `backend/scripts/migrate.sh` – kör bas‑schema först och sedan övriga uppgraderingar

Steg för drift (på servern):

1) Uppdatera kod och bygg backend

```
cd /srv/vallentuna/backend
git pull
npm ci
npm run build
```

2) Sätt `DATABASE_URL` (eller ladda `.env.production`)

```
export DATABASE_URL='postgresql://USER:PASS@HOST:5432/DB'
# eller
set -a; source .env.production; set +a
```

3) Kör migrationerna

```
npm run migrate
# → ska sluta med "Migration OK"
```

4) Starta om backend

```
pm2 reload vallentuna-backend
```

5) Verifiera

```
GET /api/healthz            → 200
GET /api/customers?all=true → 200
GET /api/cases              → 200
GET /api/shifts             → 200
GET /api/stats/summary      → 200
```

Om databasen är helt ny: skapa en första admin‑användare (exempel) genom att generera en bcrypt‑hash (t.ex. för `admin123`) och köra en `INSERT` i `handlers`.

## Retention (kort)

- Auditloggar gallras efter 5 år via funktionen `cleanup_old_audit_logs()` (se `create_audit_log_table.sql`).
- Schemalägg gallring via cron/pg_cron eller anropa `/api/audit/cleanup` från ett serverjobb.
- Verksamhetsdata (kunder/ärenden/tider/insatser/behandlare) hård‑raderas inte: avaktivera i stället. Kundinitialer anonymiseras vid avaktivering.

## Bidrag

1. Forka projektet
2. Skapa en feature branch
3. Committa dina ändringar
4. Pusha till branchen
5. Öppna en Pull Request

## Licens

Detta projekt är utvecklat för Vallentuna kommun.
