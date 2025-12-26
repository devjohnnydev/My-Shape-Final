-- Criar tabelas necessárias para o sistema SaaS de Academia

-- Tabela de Academias
CREATE TABLE IF NOT EXISTS gyms (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  primary_color VARCHAR(7) NOT NULL,
  secondary_color VARCHAR(7) NOT NULL,
  partnership_type TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabela de Usuários (estendida com campos SaaS)
-- Assumindo que a tabela users já existe, adicionar campos se necessário:
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gym_id INTEGER REFERENCES gyms(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'partial' NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_chat_enabled BOOLEAN DEFAULT FALSE NOT NULL;

-- Tabela de Configurações de Usuários
CREATE TABLE IF NOT EXISTS user_settings (
  user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id),
  goal TEXT NOT NULL,
  time_available INTEGER NOT NULL,
  frequency INTEGER NOT NULL,
  current_location TEXT DEFAULT 'home' NOT NULL,
  subscription_status TEXT DEFAULT 'free' NOT NULL
);

-- Tabela de Treinos
CREATE TABLE IF NOT EXISTS workouts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  date TIMESTAMP DEFAULT NOW() NOT NULL,
  muscle_group TEXT NOT NULL,
  plan JSONB NOT NULL,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  feedback TEXT
);

-- Tabela de Exercícios
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  muscle_groups JSONB NOT NULL,
  difficulty TEXT DEFAULT 'intermediate' NOT NULL,
  equipment_needed JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabela de Instruções de Exercícios
CREATE TABLE IF NOT EXISTS exercise_instructions (
  id SERIAL PRIMARY KEY,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  rest_seconds INTEGER DEFAULT 60 NOT NULL,
  notes TEXT,
  gif_url TEXT,
  video_url TEXT,
  common_mistakes JSONB,
  progression_tip TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_gym_id ON users(gym_id);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);

-- Criar admin padrão se não existir
INSERT INTO users (id, email, first_name, last_name, is_admin, approval_status, access_level)
VALUES (
  'admin-default-' || gen_random_uuid(),
  'admin@myshape.com',
  'System',
  'Administrator',
  TRUE,
  'approved',
  'total'
)
ON CONFLICT (email) DO NOTHING;

-- Academias padrão
INSERT INTO gyms (name, primary_color, secondary_color, partnership_type)
VALUES 
  ('Smart Fit', '#0066FF', '#FF0000', 'Premium'),
  ('SkyFit', '#FFD700', '#000000', 'Premium'),
  ('Gaviões', '#FF0000', '#000000', 'Standard'),
  ('Academia Local', '#6366F1', '#8B5CF6', 'Basic')
ON CONFLICT (name) DO NOTHING;
