-- ============================================================
-- Landing Modules: Banners, Gallery, Videos, Testimonials
-- ============================================================

-- Promotional Banners
CREATE TABLE IF NOT EXISTS landing_banners (
    id            SERIAL PRIMARY KEY,
    landing_page_id INT NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    title         VARCHAR(200),
    subtitle      VARCHAR(300),
    description   TEXT,
    cta_text      VARCHAR(100),
    cta_url       VARCHAR(500),
    image_url     TEXT,
    bg_color      VARCHAR(50) DEFAULT '#09194F',
    display_order INT DEFAULT 0,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

-- Banner multi-language translations
CREATE TABLE IF NOT EXISTS landing_banner_translations (
    id            SERIAL PRIMARY KEY,
    banner_id     INT NOT NULL REFERENCES landing_banners(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    title         VARCHAR(200),
    subtitle      VARCHAR(300),
    description   TEXT,
    cta_text      VARCHAR(100),
    UNIQUE(banner_id, language_code)
);

-- Gallery images
CREATE TABLE IF NOT EXISTS landing_gallery_images (
    id            SERIAL PRIMARY KEY,
    landing_page_id INT NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    image_url     TEXT NOT NULL,
    caption       VARCHAR(300),
    alt_text      VARCHAR(200),
    album         VARCHAR(100) DEFAULT 'General',
    display_order INT DEFAULT 0,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Gallery album translations
CREATE TABLE IF NOT EXISTS landing_gallery_translations (
    id            SERIAL PRIMARY KEY,
    landing_page_id INT NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    section_title VARCHAR(200),
    section_desc  TEXT,
    UNIQUE(landing_page_id, language_code)
);

-- Featured Videos
CREATE TABLE IF NOT EXISTS landing_videos (
    id            SERIAL PRIMARY KEY,
    landing_page_id INT NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    title         VARCHAR(200),
    description   TEXT,
    video_url     TEXT NOT NULL,
    thumbnail_url TEXT,
    display_order INT DEFAULT 0,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

-- Video translations
CREATE TABLE IF NOT EXISTS landing_video_translations (
    id            SERIAL PRIMARY KEY,
    video_id      INT NOT NULL REFERENCES landing_videos(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    title         VARCHAR(200),
    description   TEXT,
    UNIQUE(video_id, language_code)
);

-- Testimonials
CREATE TABLE IF NOT EXISTS landing_testimonials (
    id            SERIAL PRIMARY KEY,
    landing_page_id INT NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    author_name   VARCHAR(150) NOT NULL,
    author_role   VARCHAR(150),
    author_avatar TEXT,
    rating        SMALLINT DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    display_order INT DEFAULT 0,
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

-- Testimonial text translations
CREATE TABLE IF NOT EXISTS landing_testimonial_translations (
    id            SERIAL PRIMARY KEY,
    testimonial_id INT NOT NULL REFERENCES landing_testimonials(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,
    quote         TEXT NOT NULL,
    author_role   VARCHAR(150),
    UNIQUE(testimonial_id, language_code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_banners_page      ON landing_banners(landing_page_id, is_active);
CREATE INDEX IF NOT EXISTS idx_gallery_page      ON landing_gallery_images(landing_page_id, is_active);
CREATE INDEX IF NOT EXISTS idx_videos_page       ON landing_videos(landing_page_id, is_active);
CREATE INDEX IF NOT EXISTS idx_testimonials_page ON landing_testimonials(landing_page_id, is_active);
