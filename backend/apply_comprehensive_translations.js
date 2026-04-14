const { Pool } = require('pg');
require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const DATA = {
    // Dictionary (i18n_labels)
    dictionary: {
        "admin.cmstitle": { en: "Landing Page CMS", es: "CMS de Página Web", pt: "CMS da Página", zh: "着陆页 CMS", ja: "ランディングページ CMS", fr: "CMS Page d'accueil", it: "CMS Pagina di destinazione", ht: "CMS Paj Akey" },
        "admin.i18ntitle": { en: "Translation Editor", es: "Editor de Idiomas", pt: "Editor de Idiomas", zh: "翻译编辑器", ja: "翻訳エディタ", fr: "Éditeur de traduction", it: "Editor di traduzione", ht: "Editè Tradiksyon" },
        "books.nobooks": { en: "No books found", es: "No se encontraron libros", pt: "Nenhum livro encontrado", zh: "未找到书籍", ja: "書籍が見つかりませんでした", fr: "Aucun livre trouvé", it: "Nessun libro trovato", ht: "Pa jwenn okenn liv" },
        "books.readbtn": { en: "Read Book", es: "Leer Libro", pt: "Ler Livro", zh: "阅读书籍", ja: "本を読む", fr: "Lire le livre", it: "Leggi il libro", ht: "Li Liv la" },
        "books.title": { en: "Digital Library", es: "Biblioteca Digital", pt: "Biblioteca Digital", zh: "数字图书馆", ja: "デジタルライブラリ", fr: "Bibliothèque numérique", it: "Biblioteca digitale", ht: "Bibliyotèk Dijital" },
        "common.active": { en: "Active", es: "Activo", pt: "Ativo", zh: "激活", ja: "アクティブ", fr: "Actif", it: "Attivo", ht: "Aktif" },
        "common.back": { en: "Back", es: "Volver", pt: "Voltar", zh: "返回", ja: "戻る", fr: "Retour", it: "Indietro", ht: "Retou" },
        "common.cancel": { en: "Cancel", es: "Cancelar", pt: "Cancelar", zh: "取消", ja: "キャンセル", fr: "Annuler", it: "Annulla", ht: "Anile" },
        "common.delete": { en: "Delete", es: "Eliminar", pt: "Excluir", zh: "删除", ja: "削除", fr: "Supprimer", it: "Elimina", ht: "Efase" },
        "common.edit": { en: "Edit", es: "Editar", pt: "Editar", zh: "编辑", ja: "編集", fr: "Modifier", it: "Modifica", ht: "Modifye" },
        "common.inactive": { en: "Inactive", es: "Inactivo", pt: "Inativo", zh: "未激活", ja: "非アクティブ", fr: "Inactif", it: "Inattivo", ht: "Inaktif" },
        "common.loading": { en: "Loading...", es: "Cargando...", pt: "Carregando...", zh: "正在加载...", ja: "読み込み中...", fr: "Chargement...", it: "Caricamento...", ht: "Chaje..." },
        "common.save": { en: "Save", es: "Guardar", pt: "Salvar", zh: "保存", ja: "保存", fr: "Enregistrer", it: "Salva", ht: "Sove" },
        "common.search": { en: "Search...", es: "Buscar...", pt: "Buscar...", zh: "搜索...", ja: "検索...", fr: "Rechercher...", it: "Cerca...", ht: "Chèche..." },
        "common.status": { en: "Status", es: "Estado", pt: "Status", zh: "状态", ja: "ステータス", fr: "Statut", it: "Stato", ht: "Estati" },
        "nav.admin_books": { en: "Book Admin", es: "Adm. Libros", pt: "Adm. de Livros", zh: "书籍管理", ja: "書籍管理", fr: "Gestion des livres", it: "Gestione libri", ht: "Jesyon Liv" },
        "nav.dashboard": { en: "Dashboard", es: "Dashboard", pt: "Dashboard", zh: "仪表板", ja: "ダッシュボード", fr: "Tableau de bord", it: "Dashboard", ht: "Dachbo" },
        "nav.landing": { en: "Landing CMS", es: "CMS Landing", pt: "CMS Landing", zh: "页面 CMS", ja: "ページ CMS", fr: "CMS Landing", it: "CMS Landing", ht: "CMS Landing" },
        "nav.languages": { en: "Dictionary", es: "Diccionario", pt: "Dicionário", zh: "字典", ja: "辞書", fr: "Dictionnaire", it: "Dizionario", ht: "Diksyonè" },
        "nav.logout": { en: "Logout", es: "Cerrar Sesión", pt: "Sair", zh: "登出", ja: "ログアウト", fr: "Déconnexion", it: "Logout", ht: "Dekonekte" },
        "nav.settings": { en: "Settings", es: "Configuración", pt: "Configurações", zh: "设置", ja: "設定", fr: "Paramètres", it: "Impostazioni", ht: "Anviwònman" },
        "nav.users": { en: "Users", es: "Usuarios", pt: "Usuários", zh: "用户", ja: "ユーザー", fr: "Utilisateurs", it: "Utenti", ht: "Itilizatè" },
        "nav.welcome": { en: "Welcome", es: "Bienvenido", pt: "Bem-vindo", zh: "欢迎", ja: "ようこそ", fr: "Bienvenue", it: "Benvenuto", ht: "Byenvini" }
    },
    // Landing Sections (Common fields across headers/hero)
    sections: {
        "header": {
            "institutionName": { zh: "TTESOL 英语学院", ja: "TTESOL 英語アカデミー", fr: "Académie d'anglais TTESOL", it: "Accademia di inglese TTESOL", ht: "TTESOL Akademi Anglè" },
            "nav_about": { zh: "关于我们", ja: "私たちについて", fr: "À propos", it: "Chi siamo", ht: "Sou nou" },
            "nav_gallery": { zh: "图库", ja: "ギャラリー", fr: "Galerie", it: "Galleria", ht: "Galeri" },
            "nav_videos": { zh: "视频", ja: "ビデオ", fr: "Vidéos", it: "Video", ht: "Videyo" },
            "nav_courses": { zh: "课程", ja: "コース", fr: "Cours", it: "Corsi", ht: "Kou" },
            "nav_testimonials": { zh: "证言", ja: "お客様の声", fr: "Témoignages", it: "Testimonianze", ht: "Temwayaj" },
            "ctaText": { zh: "平台登录", ja: "プラットフォーム ログイン", fr: "Connexion plateforme", it: "Login piattaforma", ht: "Konekte sou Platfòm lan" }
        },
        "hero": {
            "badgeText": { zh: "卓越的英语教育", ja: "卓越した英語教育", fr: "L'excellence en éducation de l'anglais", it: "Eccellenza nell'educazione dell'inglese", ht: "Ekselans nan Edikasyon Anglè" },
            "title": { zh: "掌握语言，塑造您的未来。", ja: "言語をマスターし、未来を形作る。", fr: "Maîtrisez la langue, façonnez votre avenir.", it: "Masterizza la lingua, plasma il tuo futuro.", ht: "Mèt lang lan, fòme avni ou." },
            "subtitle": { zh: "优质的互动学习体验，旨在加速您的专业成长。", ja: "流暢さとプロフェッショナルな成長を加速させるためのプレミアムな学習体験。", fr: "Expérience d'apprentissage premium conçue pour accélérer votre croissance.", it: "Esperienza di apprendimento premium progettata per accelerare la tua crescita.", ht: "Eksperyans aprantisaj prim ki fèt pou akselere kwasans ou." },
            "primaryCta": { zh: "访问平台", ja: "プラットフォームにアクセス", fr: "Accéder à la plateforme", it: "Accedi alla piattaforma", ht: "Antre nan platfòm lan" },
            "secondaryCta": { zh: "观看视频", ja: "ビデオを見る", fr: "Voir la vidéo", it: "Guarda il video", ht: "Gade videyo a" }
        },
        "about": {
            "sectionTitle": { zh: "关于我们", ja: "私たちについて", fr: "À propos de nous", it: "Chi siamo", ht: "Sou nou" },
            "sectionSubtitle": { zh: "我们的学院", ja: "私たちのアカデミー", fr: "Notre Académie", it: "La nostra Accademia", ht: "Akademi nou an" },
            "stat1Label": { zh: "活跃学生", ja: "アクティブな学生", fr: "Étudiants actifs", it: "Studenti attivi", ht: "Elèv Aktif" },
            "stat2Label": { zh: "优质课程", ja: "プレミアムコース", fr: "Cours Premium", it: "Corsi Premium", ht: "Kou Premium" },
            "stat3Label": { zh: "成功率", ja: "成功率", fr: "Taux de réussite", it: "Tasso di successo", ht: "Pousantaj Siksè" },
            "stat4Label": { zh: "平均评分", ja: "平均評価", fr: "Note moyenne", it: "Valutazione media", ht: "Evalyasyon Mwayèn" }
        },
        "courses": {
            "sectionTitle": { zh: "精选项目", ja: "注目のプログラム", fr: "Programmes en vedette", it: "Programmi in primo piano", ht: "Pwogram ki prezante yo" },
            "sectionSubtitle": { zh: "我们的课程", ja: "私たちのカリキュラム", fr: "Notre curriculum", it: "Il nostro curriculum", ht: "Kourikoulòm nou an" },
            "course1Title": { zh: "商务英语精英", ja: "ビジネス英語エリート", fr: "Anglais des affaires Élite", it: "Business English Elite", ht: "Biznis Angle Elit" },
            "course1Level": { zh: "高级", ja: "上級", fr: "Avancé", it: "Avanzato", ht: "Avanse" },
            "course2Title": { zh: "雅思准备", ja: "IELTS 対策", fr: "Préparation à l'IELTS", it: "Preparazione IELTS", ht: "Preparasyon IELTS" },
            "course2Level": { zh: "中级", ja: "中級", fr: "Intermédiaire", it: "Intermedio", ht: "Entèmedyè" },
            "course3Title": { zh: "对话精通", ja: "日常英会話マスター", fr: "Maîtrise de la conversation", it: "Conversazione avanzata", ht: "Mèt konvèsasyon" },
            "course3Level": { zh: "所有级别", ja: "全レベル", fr: "Tous les niveaux", it: "Tutti i livelli", ht: "Tout Nivo" },
            "learnMore": { zh: "了解更多", ja: "詳しく見る", fr: "En savoir plus", it: "Scopri di più", ht: "Aprann plis" },
            "viewAll": { zh: "查看完整目录", ja: "全カタログを表示", fr: "Voir tout le catalogue", it: "Visualizza il catalogo completo", ht: "Gade tout katalòg la" }
        },
        "footer": {
            "desc": { zh: "在全球范围内助力专业人士掌握英语卓越性。", ja: "世界中のプロフェッショナルが英語の卓越性を習得できるよう支援します。", fr: "Permettant aux professionnels du monde entier de maîtriser l'excellence en anglais.", it: "Consentendo ai professionisti globali di padroneggiare l'eccellenza in inglese.", ht: "Otorize pwofesyonèl mondyal yo pou yo mèt ekselans nan lang anglè." },
            "quickLinks": { zh: "快速链接", ja: "クイックリンク", fr: "Liens rapides", it: "Link veloci", ht: "Lyen rapid" },
            "contact": { zh: "联系我们", ja: "お問い合わせ", fr: "Contactez-nous", it: "Contattaci", ht: "Kontakte nou" },
            "rights": { zh: "保留所有权利。", ja: "全著作権所有。", fr: "Tous droits réservés.", it: "Tutti i diritti riservati.", ht: "Tout dwa rezève." }
        }
    }
};

async function applyComprehensiveTranslations() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const langCodes = ['zh', 'ja', 'fr', 'it', 'ht'];

        // 1. Update i18n_labels
        console.log('Updating i18n_labels dictionary...');
        for (const [key, langs] of Object.entries(DATA.dictionary)) {
            for (const lang of langCodes) {
                if (langs[lang]) {
                    await client.query(`UPDATE i18n_labels SET "${lang}" = $1 WHERE key = $2`, [langs[lang], key]);
                }
            }
        }

        // 2. Update landing_section_translations
        console.log('Updating landing_section_translations...');
        const pageIdRes = await client.query("SELECT id FROM landing_pages WHERE slug = 'home'");
        if (pageIdRes.rows.length > 0) {
            const pageId = pageIdRes.rows[0].id;
            for (const [sectionKey, fields] of Object.entries(DATA.sections)) {
                for (const [fieldKey, langVals] of Object.entries(fields)) {
                    for (const lang of langCodes) {
                        if (langVals[lang]) {
                            await client.query(`
                                INSERT INTO landing_section_translations (landing_page_id, section_key, language_code, field_key, field_value, updated_at)
                                VALUES ($1, $2, $3, $4, $5, NOW())
                                ON CONFLICT (landing_page_id, section_key, language_code, field_key)
                                DO UPDATE SET field_value = EXCLUDED.field_value, updated_at = NOW()
                            `, [pageId, sectionKey, lang, fieldKey, langVals[lang]]);
                        }
                    }
                }
            }
        }

        // 3. Update Banner Translations (Generic seeding for first banner)
        console.log('Updating module translations (Banners/Videos)...');
        const bannerRes = await client.query('SELECT id FROM landing_banners LIMIT 3');
        for (const [idx, b] of bannerRes.rows.entries()) {
            for (const lang of langCodes) {
                const title = DATA.sections.courses[`course${idx+1}Title`]?.[lang] || "TTESOL Special Program";
                const desc = DATA.sections.courses[`course${idx+1}Desc`]?.[lang] || "Join our community today.";
                await client.query(`
                    INSERT INTO landing_banner_translations (banner_id, language_code, title, subtitle, description, cta_text)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (banner_id, language_code)
                    DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description
                `, [b.id, lang, title, "Premium Experience", desc, "Start Now"]);
            }
        }

        await client.query('COMMIT');
        console.log('Comprehensive translations applied successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Translation update failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

applyComprehensiveTranslations();
