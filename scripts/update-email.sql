-- Actualizar el email de notificaciones por defecto
UPDATE pricing SET admin_email = 'clubbelgranotennis@gmail.com' WHERE id = 1;

-- Verificar que se actualizó correctamente
SELECT 'Email actualizado a:' as info, admin_email FROM pricing WHERE id = 1;
