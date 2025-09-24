-- Tabla de canchas
CREATE TABLE IF NOT EXISTS courts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  has_lights BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de precios
CREATE TABLE IF NOT EXISTS pricing (
  id SERIAL PRIMARY KEY,
  singles_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  doubles_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  admin_email VARCHAR(255) DEFAULT 'admin@belgranotennis.com',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id INTEGER REFERENCES courts(id),
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  game_type VARCHAR(20) NOT NULL CHECK (game_type IN ('singles', 'doubles')),
  player_names TEXT[] NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  contact_info VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar las 5 canchas
INSERT INTO courts (name, has_lights) VALUES 
  ('Cancha 1', FALSE),
  ('Cancha 2', FALSE),
  ('Cancha 3', FALSE),
  ('Cancha 4', TRUE),
  ('Cancha 5', TRUE)
ON CONFLICT DO NOTHING;

-- Insertar precios iniciales
INSERT INTO pricing (singles_price, doubles_price, admin_email) VALUES (5000, 3000, 'admin@belgranotennis.com')
ON CONFLICT DO NOTHING;

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_reservations_date_court ON reservations(reservation_date, court_id);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON reservations(start_time, end_time);
