# Deployment

## Environment
- Backend: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`
- Frontend: `VITE_API_URL`

## Migration
```bash
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
psql "$DATABASE_URL" -f backend/create_invites_table.sql
```

## Start
```bash
cd backend && npm run build && npm start
cd frontend && npm run build && npm run preview
```

## Healthcheck and CORS test
```bash
curl -i http://localhost:4000/api/healthz
curl -i -H "Origin: http://localhost:5173" -X OPTIONS http://localhost:4000/api/handlers
```

## Common issues
- **401/403**: Check JWT token and user role.
- **CORS mismatch**: Ensure `CORS_ORIGIN` matches the request origin.
- **429**: Too many invite accept attempts; wait before retrying.
