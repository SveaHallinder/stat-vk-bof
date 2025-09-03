# Miljövariabler - Setup Guide

## Krävda miljövariabler

För att applikationen ska fungera korrekt behöver du skapa en `.env`-fil i projektets rot med följande variabler:

```bash
# API URL för backend
VITE_API_URL=http://localhost:4000/api

# Applikationsnamn
VITE_APP_NAME=Vallentuna Kommun
```

## Hur du skapar .env-filen

1. Skapa en ny fil som heter `.env` i projektets rot (samma nivå som package.json)
2. Lägg till innehållet ovan
3. Starta om utvecklingsservern

## Felsökning

Om du får felmeddelande om saknade miljövariabler:

1. Kontrollera att `.env`-filen finns i rätt mapp
2. Kontrollera att variablerna är korrekt namngivna (VITE_ prefix krävs)
3. Starta om utvecklingsservern
4. Kontrollera att det inte finns mellanslag runt `=`-tecknet

## Exempel för olika miljöer

### Utveckling
```bash
VITE_API_URL=http://localhost:4000/api
VITE_APP_NAME=Vallentuna Kommun (Dev)
```

### Staging
```bash
VITE_API_URL=https://staging-api.vallentuna.se/api
VITE_APP_NAME=Vallentuna Kommun (Staging)
```

### Produktion
```bash
VITE_API_URL=https://api.vallentuna.se/api
VITE_APP_NAME=Vallentuna Kommun
```
