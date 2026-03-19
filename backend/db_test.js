
const { Client } = require('pg');

const configs = [
    { host: 'localhost', user: 'postgresql', password: 'sa', port: 5432 },
    { host: 'localhost', user: 'postgres', password: 'sa', port: 5432 }
];

async function testConnection() {
    for (const config of configs) {
        console.log(`Testing connection with user: ${config.user}...`);
        const client = new Client(config);
        try {
            await client.connect();
            console.log(`Connected successfully with user: ${config.user}!`);

            const schemaSql = `
              DROP TABLE IF EXISTS sessions;
              DROP TABLE IF EXISTS activity_log;
              DROP TABLE IF EXISTS user_books;
              DROP TABLE IF EXISTS user_roles;
              DROP TABLE IF EXISTS books;
              DROP TABLE IF EXISTS roles;
              DROP TABLE IF EXISTS users;

              CREATE TABLE users (
                  id SERIAL PRIMARY KEY,
                  name VARCHAR(100) NOT NULL,
                  email VARCHAR(150) UNIQUE NOT NULL,
                  password_hash VARCHAR(255) NOT NULL,
                  status VARCHAR(20) DEFAULT 'active',
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              );

              CREATE TABLE roles (
                  id SERIAL PRIMARY KEY,
                  name VARCHAR(50) UNIQUE NOT NULL
              );

              CREATE TABLE user_roles (
                  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                  PRIMARY KEY (user_id, role_id)
              );

              CREATE TABLE books (
                  id SERIAL PRIMARY KEY,
                  title VARCHAR(200) NOT NULL,
                  category VARCHAR(100),
                  status VARCHAR(20) DEFAULT 'active',
                  metadata JSONB DEFAULT '{}',
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              );

              CREATE TABLE user_books (
                  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
                  assignment_status VARCHAR(20) DEFAULT 'assigned',
                  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (user_id, book_id)
              );

              CREATE TABLE activity_log (
                  id SERIAL PRIMARY KEY,
                  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                  action VARCHAR(100) NOT NULL,
                  module VARCHAR(50),
                  book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
                  details TEXT,
                  ip VARCHAR(45),
                  user_agent TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              );

              CREATE TABLE sessions (
                  sid VARCHAR NOT NULL COLLATE "default",
                  sess JSON NOT NULL,
                  expire TIMESTAMP(6) NOT NULL,
                  PRIMARY KEY ("sid")
              );

              INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('user');

              INSERT INTO users (name, email, password_hash, status) VALUES 
              ('Admin User', 'admin@tte.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'active'),
              ('Manager User', 'manager@tte.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'active'),
              ('User One', 'user1@tte.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'active'),
              ('User Two', 'user2@tte.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'active');

              INSERT INTO user_roles (user_id, role_id) VALUES 
              (1, 1), (2, 2), (3, 3), (4, 3);

              INSERT INTO books (title, category, status, metadata) VALUES 
              ('Advanced React Patterns', 'Development', 'active', '{"author": "Unknown", "pages": 250}'),
              ('PostgreSQL Optimization', 'Database', 'active', '{"author": "DB Expert", "pages": 300}'),
              ('UI/UX Design Principles', 'Design', 'active', '{"author": "Designer X", "pages": 150}'),
              ('Legacy Systems Management', 'Management', 'active', '{"author": "Old Guard", "pages": 400}'),
              ('Modern Web Security', 'Security', 'active', '{"author": "Sec Guru", "pages": 280}');

              INSERT INTO user_books (user_id, book_id) VALUES 
              (3, 1), (3, 3), (4, 2), (4, 5);
            `;

            console.log('Running Migration...');
            await client.query(schemaSql);
            console.log('Migration Success!');
            await client.end();
            return;
        } catch (err) {
            console.error(`Failed with user ${config.user}:`, err.message);
        }
    }
}

testConnection();
