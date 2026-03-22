CREATE TABLE IF NOT EXISTS i18n_labels (
    key VARCHAR(255) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    en TEXT NOT NULL,
    es TEXT,
    pt TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_i18n_module ON i18n_labels(module);
