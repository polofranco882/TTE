-- add_marketing_role.sql
-- Asegurar que el rol marketing existe en el esquema 'app' (o public si no hay esquema)

INSERT INTO app.roles (name) 
VALUES ('marketing') 
ON CONFLICT (name) DO NOTHING;
