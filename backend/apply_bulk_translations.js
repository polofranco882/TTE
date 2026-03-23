const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const TRANSLATIONS = {
    "zh": {
        "login.title": "登录",
        "login.subtitle": "您的门户，迈向卓越英语",
        "login.email": "电子邮件地址",
        "login.password": "密码",
        "login.button": "进入平台",
        "nav.welcome": "欢迎",
        "nav.books": "书籍",
        "nav.dashboard": "仪表板",
        "nav.users": "用户",
        "nav.landing": "登录页面 CMS",
        "nav.languages": "翻译",
        "nav.admin_books": "图书管理",
        "nav.settings": "设置",
        "common.loading": "正在加载应用...",
        "common.save": "保存",
        "common.cancel": "取消",
        "common.delete": "删除",
        "common.edit": "编辑",
        "common.search": "搜索...",
        "hero.badge": "卓越的英语教育",
        "hero.title": "掌握语言，<br/>塑造您的未来。",
        "hero.subtitle": "TTESOL 学院提供优质的互动学习体验，旨在加速您的流利程度和职业成长。",
        "hero.cta": "进入平台",
        "about.stat1": "1万+",
        "about.label1": "活跃学生",
        "about.stat2": "50+",
        "about.label2": "优质课程",
        "about.stat3": "98%",
        "about.label3": "成功率"
    },
    "ja": {
        "login.title": "ログイン",
        "login.subtitle": "英語の卓越性へのポータル",
        "login.email": "メールアドレス",
        "login.password": "パスワード",
        "login.button": "プラットフォームに入る",
        "nav.welcome": "ようこそ",
        "nav.books": "書籍",
        "nav.dashboard": "ダッシュボード",
        "nav.users": "ユーザー",
        "nav.landing": "ランディングページ CMS",
        "nav.languages": "翻訳",
        "nav.admin_books": "書籍管理",
        "nav.settings": "設定",
        "common.loading": "アプリケーションを読み込んでいます...",
        "common.save": "保存",
        "common.cancel": "キャンセル",
        "common.delete": "削除",
        "common.edit": "編集",
        "common.search": "検索...",
        "hero.badge": "卓越した英語教育",
        "hero.title": "言語をマスターし、<br/>未来を形作る。",
        "hero.subtitle": "TTESOL アカデミーは、流暢さとプロフェッショナルな成長を加速させるために設計された、プレミアムでインタラクティブな学習体験を提供します。",
        "hero.cta": "プラットフォームに入る",
        "about.stat1": "1万+",
        "about.label1": "アクティブな学生",
        "about.stat2": "50+",
        "about.label2": "プレミアムコース",
        "about.stat3": "98%",
        "about.label3": "成功率"
    },
    "fr": {
        "login.title": "Connexion",
        "login.subtitle": "Votre portail vers l'excellence en anglais",
        "login.email": "Adresse e-mail",
        "login.password": "Mot de passe",
        "login.button": "Entrer dans la plateforme",
        "nav.welcome": "Bienvenue",
        "nav.books": "Livres",
        "nav.dashboard": "Tableau de bord",
        "nav.users": "Utilisateurs",
        "nav.landing": "CMS Landing Page",
        "nav.languages": "Traductions",
        "nav.admin_books": "Gestion des livres",
        "nav.settings": "Paramètres",
        "common.loading": "Chargement de l'application...",
        "common.save": "Enregistrer",
        "common.cancel": "Annuler",
        "common.delete": "Supprimer",
        "common.edit": "Modifier",
        "common.search": "Rechercher...",
        "hero.badge": "L'excellence dans l'éducation de l'anglais",
        "hero.title": "Maîtrisez la langue, <br/>façonnez votre avenir.",
        "hero.subtitle": "L'Académie TTESOL offre une expérience d'apprentissage interactive et premium conçue pour accélérer votre fluidité et votre croissance professionnelle.",
        "hero.cta": "Accéder à la plateforme",
        "about.stat1": "10k+",
        "about.label1": "Étudiants actifs",
        "about.stat2": "50+",
        "about.label2": "Cours Premium",
        "about.stat3": "98%",
        "about.label3": "Taux de réussite"
    },
    "it": {
        "login.title": "Accedi",
        "login.subtitle": "Il tuo portale per l'eccellenza in inglese",
        "login.email": "Indirizzo e-mail",
        "login.password": "Password",
        "login.button": "Entra nella piattaforma",
        "nav.welcome": "Benvenuto",
        "nav.books": "Libri",
        "nav.dashboard": "Dashboard",
        "nav.users": "Utenti",
        "nav.landing": "CMS Landing Page",
        "nav.languages": "Traduzioni",
        "nav.admin_books": "Gestione Libri",
        "nav.settings": "Impostazioni",
        "common.loading": "Caricamento dell'applicazione...",
        "common.save": "Salva",
        "common.cancel": "Annulla",
        "common.delete": "Elimina",
        "common.edit": "Modifica",
        "common.search": "Cerca...",
        "hero.badge": "Eccellenza nell'educazione dell'inglese",
        "hero.title": "Masterizza la lingua, <br/>plasma il tuo futuro.",
        "hero.subtitle": "L'Accademia TTESOL offre un'esperienza di apprendimento interattiva e premium progettata per accelerare la tua fluidità e crescita professionale.",
        "hero.cta": "Accedi alla piattaforma",
        "about.stat1": "10k+",
        "about.label1": "Studenti attivi",
        "about.stat2": "50+",
        "about.label2": "Corsi Premium",
        "about.stat3": "98%",
        "about.label3": "Tasso di successo"
    },
    "ht": {
        "login.title": "Konekte",
        "login.subtitle": "Portal ou pou ekselans nan lang anglè",
        "login.email": "Adrès imèl",
        "login.password": "Modpas",
        "login.button": "Antre nan platfòm lan",
        "nav.welcome": "Byenvini",
        "nav.books": "Liv",
        "nav.dashboard": "Dachbo",
        "nav.users": "Itilizatè",
        "nav.landing": "CMS Landing Page",
        "nav.languages": "Tradiksyon",
        "nav.admin_books": "Jesyon Liv",
        "nav.settings": "Anviwònman",
        "common.loading": "Chaje aplikasyon an...",
        "common.save": "Sove",
        "common.cancel": "Anile",
        "common.delete": "Efase",
        "common.edit": "Modifye",
        "common.search": "Chèche...",
        "hero.badge": "Ekselans nan Edikasyon Anglè",
        "hero.title": "Mèt lang lan, <br/>fòme avni ou.",
        "hero.subtitle": "Akademik TTESOL ofri yon eksperyans aprantisaj entèaktif ak prim ki fèt pou akselere konpetans ou ak kwasans pwofesyonèl ou.",
        "hero.cta": "Antre nan platfòm lan",
        "about.stat1": "10k+",
        "about.label1": "Elèv Aktif",
        "about.stat2": "50+",
        "about.label2": "Kou Premium",
        "about.stat3": "98%",
        "about.label3": "Pousantaj Siksè"
    }
};

async function applyTranslations() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Update i18n_labels
        for (const [lang, keys] of Object.entries(TRANSLATIONS)) {
            for (const [key, val] of Object.entries(keys)) {
                // We use dynamic column update
                await client.query(`UPDATE i18n_labels SET "${lang}" = $1 WHERE key = $2`, [val, key]);
            }
        }

        // 2. Initial Seeding for Landing Sections (simplified for demo)
        // We'll update common header/hero trans if they exist
        const sections = [
            { key: 'header', fields: { 'institutionName': 'TTESOL', 'ctaText': 'Access Platform', 'nav_about': 'About Us', 'nav_courses': 'Courses' } },
            { key: 'hero', fields: { 'badgeText': 'Excellence in English Education', 'title': 'Master the Language, Shape Your Future.', 'subtitle': 'Interactive learning experience designed to accelerate your growth.', 'primaryCta': 'Access Platform' } }
        ];

        const pageIdRes = await client.query("SELECT id FROM landing_pages WHERE slug = 'home'");
        if (pageIdRes.rows.length > 0) {
            const pageId = pageIdRes.rows[0].id;
            for (const lang of Object.keys(TRANSLATIONS)) {
                for (const section of sections) {
                    for (const [fieldKey, fieldVal] of Object.entries(section.fields)) {
                        // Translate fieldVal to target lang via TRANSLATIONS if mapped, or simple copy for now
                        // For a real app, I'd have a full map. For this task I'll translate the core landing content.
                        let translatedVal = fieldVal;
                        if (section.key === 'hero' && fieldKey === 'title') translatedVal = TRANSLATIONS[lang]["hero.title"]?.replace('<br/>', '') || fieldVal;
                        if (section.key === 'hero' && fieldKey === 'subtitle') translatedVal = TRANSLATIONS[lang]["hero.subtitle"] || fieldVal;
                        if (section.key === 'hero' && fieldKey === 'primaryCta') translatedVal = TRANSLATIONS[lang]["hero.cta"] || fieldVal;
                        if (section.key === 'header' && fieldKey === 'ctaText') translatedVal = TRANSLATIONS[lang]["login.button"] || fieldVal;

                        await client.query(`
                            INSERT INTO landing_section_translations (landing_page_id, section_key, language_code, field_key, field_value, updated_at)
                            VALUES ($1, $2, $3, $4, $5, NOW())
                            ON CONFLICT (landing_page_id, section_key, language_code, field_key)
                            DO UPDATE SET field_value = EXCLUDED.field_value, updated_at = NOW()
                        `, [pageId, section.key, lang, fieldKey, translatedVal]);
                    }
                }
            }
        }

        await client.query('COMMIT');
        console.log('Translations applied successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Translation update failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

applyTranslations();
