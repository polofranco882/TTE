const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const DATA = {
    // Correct case dictionary (i18n_labels)
    dictionary: {
        "admin.cmsTitle": { zh: "着陆页 CMS", ja: "ランディングページ CMS", fr: "CMS Page d'accueil", it: "CMS Pagina di destinazione", ht: "CMS Paj Akey" },
        "admin.i18nTitle": { zh: "翻译编辑器", ja: "翻訳エディタ", fr: "Éditeur de traduction", it: "Editor di traduzione", ht: "Editè Tradiksyon" },
        "books.noBooks": { zh: "未找到书籍", ja: "書籍が見つかりませんでした", fr: "Aucun livre trouvé", it: "Nessun libro trovato", ht: "Pa jwenn okenn liv" },
        "books.readBtn": { zh: "阅读书籍", ja: "本を読む", fr: "Lire le livre", it: "Leggi il libro", ht: "Li Liv la" },
        "books.title": { zh: "数字图书馆", ja: "デジタルライブラリ", fr: "Bibliothèque numérique", it: "Biblioteca digitale", ht: "Bibliyotèk Dijital" },
        "common.active": { zh: "激活", ja: "アクティブ", fr: "Actif", it: "Attivo", ht: "Aktif" },
        "common.back": { zh: "返回", ja: "戻る", fr: "Retour", it: "Indietro", ht: "Retou" },
        "common.cancel": { zh: "取消", ja: "キャンセル", fr: "Annuler", it: "Annulla", ht: "Anile" },
        "common.delete": { zh: "删除", ja: "削除", fr: "Supprimer", it: "Elimina", ht: "Efase" },
        "common.edit": { zh: "编辑", ja: "編集", fr: "Modifier", it: "Modifica", ht: "Modifye" },
        "common.inactive": { zh: "未激活", ja: "非アクティブ", fr: "Inactif", it: "Inattivo", ht: "Inaktif" },
        "common.loading": { zh: "正在加载...", ja: "読み込み中...", fr: "Chargement...", it: "Caricamento...", ht: "Chaje..." },
        "common.save": { zh: "保存", ja: "保存", fr: "Enregistrer", it: "Salva", ht: "Sove" },
        "common.search": { zh: "搜索...", ja: "検索...", fr: "Rechercher...", it: "Cerca...", ht: "Chèche..." },
        "common.status": { zh: "状态", ja: "ステータス", fr: "Statut", it: "Stato", ht: "Estati" },
        "login.title": { zh: "登录", ja: "ログイン", fr: "Connexion", it: "Accedi", ht: "Konekte" },
        "login.subtitle": { zh: "您的门户，迈向卓越英语", ja: "英語の卓越性へのポータル", fr: "Votre portail vers l'excellence en anglais", it: "Il tuo portale per l'eccellenza in inglese", ht: "Portal ou pou ekselans nan lang anglè" },
        "login.email": { zh: "电子邮件", ja: "メール", fr: "E-mail", it: "E-mail", ht: "Imèl" },
        "login.password": { zh: "密码", ja: "パスワード", fr: "Mot de passe", it: "Password", ht: "Modpas" },
        "login.button": { zh: "进入", ja: "入る", fr: "Entrer", it: "Entra", ht: "Antre" },
        "nav.admin_books": { zh: "图书管理", ja: "書籍管理", fr: "Gestion des livres", it: "Gestione libri", ht: "Jesyon Liv" },
        "nav.dashboard": { zh: "仪表板", ja: "ダッシュボード", fr: "Tableau de bord", it: "Dashboard", ht: "Dachbo" },
        "nav.landing": { zh: "页面 CMS", ja: "ページ CMS", fr: "CMS Landing", it: "CMS Landing", ht: "CMS Landing" },
        "nav.languages": { zh: "字典", ja: "辞書", fr: "Dictionnaire", it: "Dizionario", ht: "Diksyonè" },
        "nav.logout": { zh: "登出", ja: "ログアウト", fr: "Déconnexion", it: "Logout", ht: "Dekonekte" },
        "nav.settings": { zh: "设置", ja: "設定", fr: "Paramètres", it: "Impostazioni", ht: "Anviwònman" },
        "nav.users": { zh: "用户", ja: "ユーザー", fr: "Utilisateurs", it: "Utenti", ht: "Itilizatè" },
        "nav.welcome": { zh: "欢迎", ja: "ようこそ", fr: "Bienvenue", it: "Benvenuto", ht: "Byenvini" }
    }
};

async function fixKeys() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const langCodes = ['zh', 'ja', 'fr', 'it', 'ht'];

        for (const [key, langs] of Object.entries(DATA.dictionary)) {
            for (const lang of langCodes) {
                if (langs[lang]) {
                    await client.query(`UPDATE i18n_labels SET "${lang}" = $1 WHERE key = $2`, [langs[lang], key]);
                }
            }
        }

        await client.query('COMMIT');
        console.log('Keys fixed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

fixKeys();
