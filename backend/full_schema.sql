-- FULL SCHEMA FOR DigitalOcean "app" SCHEMA

-- Drop existing tables to ensure clean state
DROP TABLE IF EXISTS app.book_contents CASCADE;
DROP TABLE IF EXISTS app.ai_config CASCADE;
DROP TABLE IF EXISTS app.activity_log CASCADE;
DROP TABLE IF EXISTS app.sessions CASCADE;
DROP TABLE IF EXISTS app.user_books CASCADE;
DROP TABLE IF EXISTS app.user_roles CASCADE;
DROP TABLE IF EXISTS app.books CASCADE;
DROP TABLE IF EXISTS app.roles CASCADE;
DROP TABLE IF EXISTS app.users CASCADE;

-- Users
CREATE TABLE app.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles
CREATE TABLE app.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- User Roles
CREATE TABLE app.user_roles (
    user_id INTEGER REFERENCES app.users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES app.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Books
CREATE TABLE app.books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    cover_image TEXT,
    description TEXT,
    details TEXT,
    rating VARCHAR(20),
    reading_time VARCHAR(50),
    publisher VARCHAR(200),
    isbn VARCHAR(50),
    publication_date VARCHAR(50),
    sort_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Books
CREATE TABLE app.user_books (
    user_id INTEGER REFERENCES app.users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES app.books(id) ON DELETE CASCADE,
    assignment_status VARCHAR(20) DEFAULT 'assigned',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, book_id)
);

-- Book Contents
CREATE TABLE app.book_contents (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES app.books(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'topic',
    content TEXT,
    page_number VARCHAR(10),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    parent_id INTEGER REFERENCES app.book_contents(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Log
CREATE TABLE app.activity_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES app.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50),
    book_id INTEGER REFERENCES app.books(id) ON DELETE SET NULL,
    details TEXT,
    ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Config
CREATE TABLE app.ai_config (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(20) NOT NULL DEFAULT 'openai',
    api_key TEXT NOT NULL DEFAULT '',
    model VARCHAR(100) DEFAULT 'gpt-image-1',
    allow_image BOOLEAN DEFAULT TRUE,
    allow_video BOOLEAN DEFAULT TRUE,
    max_seconds INTEGER DEFAULT 15,
    max_resolution VARCHAR(20) DEFAULT '1024x1024',
    max_size_mb INTEGER DEFAULT 10,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions
CREATE TABLE app.sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
