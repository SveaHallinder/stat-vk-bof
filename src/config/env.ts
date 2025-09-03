// Environment validation för att säkerställa att alla nödvändiga variabler finns
export const validateEnv = (): void => {
  const requiredVars = [
    'VITE_API_URL',
    'VITE_APP_NAME'
  ];

  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!import.meta.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = `Saknade miljövariabler: ${missingVars.join(', ')}. 
    Kontrollera att du har en .env-fil med rätt konfiguration.`;
    
    console.warn('Miljövariabler saknas:', missingVars);
    
    // I utvecklingsläge, visa en varning men låt appen starta
    if (import.meta.env.DEV) {
      console.warn('Appen startar med standardvärden för utveckling');
      console.warn('Skapa en .env-fil för att undvika denna varning');
      return; // Låt appen starta ändå
    }
    
    // I produktion, kasta fel
    throw new Error(errorMessage);
  }
};

// Exportera validerade miljövariabler med fallbacks för utveckling
export const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Vallentuna Kommun (Dev)',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD
};
