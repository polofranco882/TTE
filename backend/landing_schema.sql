-- Media Assets Table (Optimized Base64 storage)
CREATE TABLE IF NOT EXISTS media_assets (
    id SERIAL PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    extension VARCHAR(10),
    base64_content TEXT NOT NULL,
    optimized_size INTEGER NOT NULL,
    original_size INTEGER,
    width INTEGER,
    height INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Landing Pages Table
CREATE TABLE IF NOT EXISTS landing_pages (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    meta_title JSONB,
    meta_description JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Landing Sections Table (Dynamic blocks)
CREATE TABLE IF NOT EXISTS landing_sections (
    id SERIAL PRIMARY KEY,
    landing_page_id INTEGER REFERENCES landing_pages(id) ON DELETE CASCADE,
    section_key VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER NOT NULL,
    content_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(landing_page_id, section_key)
);

-- Banners Table
CREATE TABLE IF NOT EXISTS landing_banners (
    id SERIAL PRIMARY KEY,
    landing_page_id INTEGER REFERENCES landing_pages(id) ON DELETE CASCADE,
    media_asset_id INTEGER REFERENCES media_assets(id) ON DELETE SET NULL,
    title JSONB,
    subtitle JSONB,
    cta_text JSONB,
    cta_url VARCHAR(255),
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true
);

-- Gallery Images Table
CREATE TABLE IF NOT EXISTS landing_gallery_images (
    id SERIAL PRIMARY KEY,
    landing_page_id INTEGER REFERENCES landing_pages(id) ON DELETE CASCADE,
    media_asset_id INTEGER REFERENCES media_assets(id) ON DELETE SET NULL,
    caption JSONB,
    category VARCHAR(50),
    display_order INTEGER,
    is_active BOOLEAN DEFAULT true
);
