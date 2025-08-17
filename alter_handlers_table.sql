-- Lägg till password_hash och role kolumner i handlers-tabellen
ALTER TABLE handlers 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'handler';

-- Uppdatera befintliga handlers till 'handler' roll
UPDATE handlers SET role = 'handler' WHERE role IS NULL;

-- Skapa en admin-användare (lösenord: admin123)
-- OBS: Detta är bara för utveckling, ändra i produktion!
INSERT INTO handlers (name, email, password_hash, role, active) 
VALUES (
  'System Admin', 
  'admin@vallentuna.se', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 'admin123'
  'admin', 
  true
) ON CONFLICT (email) DO NOTHING;

-- Skapa en test-användare (lösenord: test123)
INSERT INTO handlers (name, email, password_hash, role, active) 
VALUES (
  'Test Handläggare', 
  'test@vallentuna.se', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 'test123'
  'handler', 
  true
) ON CONFLICT (email) DO NOTHING;
