# Vallentuna Kommun - Tidsregistreringssystem

Ett modernt webbbaserat system för hantering av kunder, ärenden och tidsregistreringar för Vallentuna kommun.

## 🚀 Funktioner

- **Kundhantering**: Registrera och hantera kunder
- **Ärendesystem**: Skapa och spåra ärenden med olika insatser
- **Tidsregistrering**: Registrera arbetstid för olika ärenden
- **Statistik**: Översikt och analys av aktiviteter
- **Användarhantering**: Rollbaserad åtkomst (admin/behandlare)
- **Responsiv design**: Fungerar på alla enheter

## 🛠️ Teknisk stack

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

## 📋 Förutsättningar

- [Node.js](https://nodejs.org/) (version 18 eller senare)
- [npm](https://www.npmjs.com/) eller [yarn](https://yarnpkg.com/)
- PostgreSQL-databas

## 🚀 Kom igång

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

## 📁 Projektstruktur

```
src/
├── components/          # Återanvändbara UI-komponenter
├── contexts/           # React contexts (Auth, etc.)
├── lib/               # API-klienter och utilities
├── routes/            # Routning och navigation
├── screens/           # Huvudsidor och vyer
└── types/             # TypeScript-typer
```

## 🔧 Skript

```bash
# Utveckling
npm run dev

# Bygg för produktion
npm run build

# Backend utveckling
cd backend && npm run dev
```

## 📚 Dokumentation

- [Miljövariabler](./ENVIRONMENT_SETUP.md)
- [Admin-manual](./docs/ADMIN_MANUAL.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Onboarding](./docs/ONBOARDING_GUIDE.md)

## 🤝 Bidrag

1. Forka projektet
2. Skapa en feature branch
3. Committa dina ändringar
4. Pusha till branchen
5. Öppna en Pull Request

## 📄 Licens

Detta projekt är utvecklat för Vallentuna kommun.
