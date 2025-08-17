# CORS och API Setup - Vallentuna Biståndshandläggare

## Översikt
Detta dokument beskriver hur CORS och API-konfigurationen har satts upp för att säkerställa korrekt kommunikation mellan frontend (port 5173) och backend (port 4000).

## Problem som löstes
1. **CORS-fel vid login**: Backend skickade `Access-Control-Allow-Origin: http://localhost:5174` men frontend körde på 5173
2. **API-endpoints**: Frontend kunde inte nå `/customers` och `/efforts` eftersom backend kör på `/api/*`
3. **Inkonsekvent API-anrop**: Vissa endpoints hade `/api` prefix, andra inte

## Lösningar implementerade

### 1. Frontend Environment Variables
**Fil**: `.env`
```bash
VITE_API_URL=http://localhost:4000/api
```
- Uppdaterad från `http://localhost:4000` till `http://localhost:4000/api`
- Detta säkerställer att alla API-anrop går till rätt endpoint

### 2. Backend CORS-konfiguration
**Fil**: `backend/src/index.ts`

```typescript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173', 
    'http://localhost:5174',
    'http://127.0.0.1:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight handling
```

**Funktioner**:
- Tillåter frontend-origins (5173, 5174) för utveckling
- Stödjer credentials för JWT-autentisering
- Hanterar alla HTTP-metoder
- Preflight-hantering för OPTIONS-requests

### 3. API Endpoint-struktur
**Backend routes** (alla under `/api/*`):
- `/api/customers` - Kundhantering
- `/api/efforts` - Insatser/efforts
- `/api/handlers` - Behandlare
- `/api/cases` - Ärenden
- `/api/stats` - Statistik
- `/api/shifts` - Tidsregistreringar
- `/api/users` - Användarhantering

### 4. Frontend API-anrop
**Uppdaterade filer**:
- `src/lib/api.ts` - Alla API-funktioner
- `src/contexts/AuthContext.tsx` - Login/autentisering
- `src/screens/AdminPage/AdminPage.tsx` - Admin-funktioner

**Exempel på korrekt användning**:
```typescript
// Före (fel):
fetch(`${API_URL}/api/customers`)

// Efter (korrekt):
fetch(`${API_URL}/customers`)
```

## Säkerhet och Produktion

### Utvecklingsmiljö
- CORS tillåter localhost:5173 och localhost:5174
- Credentials tillåtna för JWT-autentisering
- Helmet.js för säkerhetsheaders

### Produktionsmiljö
- Uppdatera `corsOptions.origin` med riktiga domäner
- Använd miljövariabler för CORS-origins
- Aktivera HTTPS och säkerhetsheaders

## Testning

### Backend API-endpoints
```bash
# Testa customers
curl http://localhost:4000/api/customers

# Testa efforts  
curl http://localhost:4000/api/efforts

# Testa CORS från frontend
curl -H "Origin: http://localhost:5173" http://localhost:4000/api/customers
```

### Frontend
- Starta frontend: `npm run dev` (port 5173)
- Starta backend: `cd backend && npm run dev` (port 4000)
- Testa login och datahämtning

## Loggning
Backend loggar nu alla requests med:
- Timestamp
- HTTP-metod och path
- Origin-header
- CORS-status

## Felsökning

### Vanliga problem
1. **CORS-fel**: Kontrollera att backend kör på port 4000 och frontend på 5173
2. **404 på API-endpoints**: Säkerställ att backend routes använder `/api/*` prefix
3. **Autentiseringsfel**: Kontrollera JWT-token och Authorization-header

### Debug-kommandon
```bash
# Kontrollera backend-status
curl -v http://localhost:4000/api/customers

# Testa CORS
curl -H "Origin: http://localhost:5173" -v http://localhost:4000/api/customers

# Kontrollera miljövariabler
echo $VITE_API_URL
cat .env
```

## Nästa steg
1. Testa alla frontend-sidor med backend
2. Verifiera att login fungerar utan CORS-fel
3. Kontrollera att all data hämtas korrekt
4. Uppdatera CORS-origins för produktion
5. Implementera rate limiting och säkerhetsåtgärder
