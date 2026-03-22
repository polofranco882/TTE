-- Landing section multi-language content translations
CREATE TABLE IF NOT EXISTS landing_section_translations (
    id SERIAL PRIMARY KEY,
    landing_page_id INT NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
    section_key VARCHAR(50) NOT NULL,
    language_code VARCHAR(10) NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    field_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(landing_page_id, section_key, language_code, field_key)
);

CREATE INDEX IF NOT EXISTS idx_landing_trans_lang ON landing_section_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_landing_trans_section ON landing_section_translations(section_key, language_code);
