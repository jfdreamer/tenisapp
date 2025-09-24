-- Agregar campo para email de notificaciones
ALTER TABLE pricing ADD COLUMN IF NOT EXISTS admin_email VARCHAR(255) DEFAULT 'admin@belgranotennis.com';

-- Actualizar con un email por defecto
UPDATE pricing SET admin_email = 'admin@belgranotennis.com' WHERE admin_email IS NULL;
