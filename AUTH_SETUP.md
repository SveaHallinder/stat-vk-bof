# 🔐 Autentisering Setup Guide

## Backend Setup

### 1. Installera dependencies
```bash
cd backend
npm install jsonwebtoken bcryptjs
npm install --save-dev @types/jsonwebtoken @types/bcryptjs
```

### 2. Skapa .env fil
Skapa en `.env` fil i backend-mappen med följande innehåll:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/your_database

# JWT
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Server
PORT=4000
CORS_ORIGIN=http://localhost:5173

# Environment
NODE_ENV=development
```

### 3. Uppdatera databasen
Kör SQL-filen `alter_handlers_table.sql` för att lägga till auth-kolumner:
```bash
psql -d your_database -f alter_handlers_table.sql
```

### 4. Starta backend
```bash
cd backend
npm run dev
```

## Frontend Setup

### 1. Starta frontend
```bash
npm run dev
```

### 2. Testa inloggning
Gå till `/login` och använd följande test-konton:

**Admin-konto:**
- Email: `admin@vallentuna.se`
- Lösenord: `admin123`

**Test-konto:**
- Email: `test@vallentuna.se`
- Lösenord: `test123`

## Säkerhetsfunktioner

✅ **JWT-baserad autentisering**
✅ **Lösenord hashade med bcrypt**
✅ **Rollbaserad åtkomstkontroll (RBAC)**
✅ **Skyddade routes**
✅ **Automatisk token-validering**
✅ **Logout-funktionalitet**

## Roller

- **`admin`**: Full åtkomst till alla funktioner
- **`handler`**: Standard-användare med begränsad åtkomst
- **`supervisor`**: Kan läggas till senare för mellannivå-behörigheter

## Nästa steg

1. **Rate limiting** - Lägg till begränsning av API-anrop
2. **CSRF-skydd** - Skydda mot cross-site request forgery
3. **Audit logging** - Logga alla användaråtgärder
4. **Lösenordspolicy** - Implementera starka lösenordskrav
5. **2FA** - Tvåfaktorsautentisering

## Felsökning

### Vanliga problem:

**"Cannot find module 'jsonwebtoken'"**
- Kör `npm install` i backend-mappen

**"JWT_SECRET is not defined"**
- Kontrollera att `.env` filen finns och innehåller JWT_SECRET

**"Database connection failed"**
- Kontrollera DATABASE_URL i `.env` filen
- Starta PostgreSQL-tjänsten

**"Invalid token"**
- Logga ut och logga in igen
- Kontrollera att JWT_SECRET är samma i backend och frontend
