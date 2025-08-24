-- Skapa tabeller för dashboard-funktionalitet

-- 1. Customers tabell
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  initials TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_year INTEGER NOT NULL,
  start_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Efforts tabell (insatser)
CREATE TABLE IF NOT EXISTS efforts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Cases tabell (ärenden)
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  handler_id INTEGER REFERENCES handlers(id) ON DELETE CASCADE,
  effort_id INTEGER REFERENCES efforts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Aktiv',
  start_date DATE NOT NULL,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Shifts tabell (tidsregistreringar)
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
  handler_id INTEGER REFERENCES handlers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC(4,2) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Visits tabell (besök)
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC(4,2),
  status TEXT NOT NULL DEFAULT 'Utförd',
  created_at TIMESTAMP DEFAULT now(),
  active BOOLEAN DEFAULT true
);

-- 6. Invites tabell (redan skapad men lägger till här för kompletthet)
-- CREATE TABLE IF NOT EXISTS invites (redan finns)

-- Lägg till exempeldata för att testa dashboard
INSERT INTO customers (initials, gender, birth_year, start_date, active) VALUES 
('AB', 'Kvinna', 1985, '2025-01-15', true),
('CD', 'Man', 1978, '2025-02-20', true),
('EF', 'Kvinna', 1992, '2025-03-10', true)
ON CONFLICT DO NOTHING;

INSERT INTO efforts (name, description, active) VALUES 
('Personlig assistans', 'Hjälp med vardagsliv', true),
('Stöd och samtal', 'Psykiskt stöd', true),
('Praktisk hjälp', 'Hjälp med hem och trädgård', true)
ON CONFLICT DO NOTHING;

INSERT INTO cases (customer_id, handler_id, effort_id, status, start_date, active) VALUES 
(1, 1, 1, 'Aktiv', '2025-01-20', true),
(2, 1, 2, 'Aktiv', '2025-02-25', true),
(3, 1, 3, 'Aktiv', '2025-03-15', true)
ON CONFLICT DO NOTHING;

INSERT INTO shifts (case_id, handler_id, date, hours, description, active) VALUES 
(1, 1, '2025-08-01', 4.5, 'Personlig assistans', true),
(1, 1, '2025-08-02', 3.0, 'Personlig assistans', true),
(2, 1, '2025-08-01', 2.0, 'Stöd och samtal', true),
(3, 1, '2025-08-01', 1.5, 'Praktisk hjälp', true)
ON CONFLICT DO NOTHING;

INSERT INTO visits (case_id, date, hours, status, active) VALUES 
(1, '2025-08-01', 4.5, 'Utförd', true),
(1, '2025-08-02', 3.0, 'Utförd', true),
(2, '2025-08-01', 2.0, 'Utförd', true),
(3, '2025-08-01', 1.5, 'Utförd', true)
ON CONFLICT DO NOTHING;

-- Skapa index för snabbare sökningar
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(active);
CREATE INDEX IF NOT EXISTS idx_cases_active ON cases(active);
CREATE INDEX IF NOT EXISTS idx_cases_customer ON cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_cases_handler ON cases(handler_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
CREATE INDEX IF NOT EXISTS idx_shifts_case ON shifts(case_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(date);
CREATE INDEX IF NOT EXISTS idx_visits_case ON visits(case_id);
