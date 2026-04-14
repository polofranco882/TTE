-- migration_v2.sql
-- Rediseño del módulo de usuarios y dependencias educativas

-- 1. Crear tablas maestras
CREATE TABLE IF NOT EXISTS app.academic_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS app.modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 2. Crear tabla intermedia para Profesores y Módulos (Relación N:M)
CREATE TABLE IF NOT EXISTS app.user_modules (
    user_id INTEGER REFERENCES app.users(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES app.modules(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, module_id)
);

-- 3. Modificar tabla de usuarios para incluir nivel académico
-- Se permite NULL inicialmente para usuarios administrativos o migración suave
ALTER TABLE app.users ADD COLUMN IF NOT EXISTS level_id INTEGER REFERENCES app.academic_levels(id) ON DELETE SET NULL;

-- 4. Datos iniciales básicos
INSERT INTO app.academic_levels (name) VALUES 
('1ero EGB'), ('2do EGB'), ('3ero EGB'), ('4to EGB'), ('5to EGB'), 
('6to EGB'), ('7mo EGB'), ('8vo EGB'), ('9no EGB'), ('10mo EGB'),
('1ero BGU'), ('2do BGU'), ('3ero BGU'), ('No Aplicable')
ON CONFLICT (name) DO NOTHING;

INSERT INTO app.modules (name) VALUES 
('Matemáticas'), ('Lengua y Literatura'), ('Ciencias Naturales'), 
('Estudios Sociales'), ('Inglés'), ('Educación Física'), ('Arte')
ON CONFLICT (name) DO NOTHING;

-- 5. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_users_level_id ON app.users(level_id);
CREATE INDEX IF NOT EXISTS idx_user_modules_user_id ON app.user_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON app.users(email);
