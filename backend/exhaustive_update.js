const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const EXTRA_DATA = {
    // Footer / Terms / Privacy
    "landing.footer.terms": { zh: "服务条款", ja: "利用規約", fr: "Conditions d'utilisation", it: "Termini di servizio", ht: "Kondisyon Itilizasyon" },
    "landing.footer.privacy": { zh: "隐私政策", ja: "プライバシーポリシー", fr: "Politique de confidentialité", it: "Informativa sulla privacy", ht: "Règleman sou Konfidansyalite" },
    "landing.footer.cookies": { zh: "Cookie 政策", ja: "クッキーポリシー", fr: "Politique de cookies", it: "Politica sui cookie", ht: "Règleman Cookie" },
    "landing.footer.copyright": { zh: "保留所有权利。", ja: "全著作権所有。", fr: "Tous droits réservés.", it: "Tutti i diritti riservati.", ht: "Tout dwa rezève." },
    "common.copyright": { zh: "保留所有权利。", ja: "全著作権所有。", fr: "Tous droits réservés.", it: "Tutti i diritti riservati.", ht: "Tout dwa rezève." },
    "footer.desc": { zh: "在全球范围内助力专业人士掌握英语卓越性。", ja: "世界中のプロフェッショナルが英語の卓越性を習得できるよう支援します。", fr: "Permettant aux professionnels du monde entier de maîtriser l'excellence en anglais.", it: "Consentendo ai professionisti globali di padroneggiare l'eccellenza in inglese.", ht: "Otorize pwofesyonèl mondyal yo pou yo mèt ekselans nan lang anglè." },
    "footer.quickLinks": { zh: "快速链接", ja: "クイックリンク", fr: "Liens rapides", it: "Link veloci", ht: "Lyen rapid" },
    "footer.office": { zh: "办公室", ja: "オフィス", fr: "Bureau", it: "Ufficio", ht: "Biwo" },
    "footer.contact": { zh: "联系我们", ja: "お問い合わせ", fr: "Contactez-nous", it: "Contattaci", ht: "Kontakte nou" },
    "hero.secondaryCta": { zh: "观看视频", ja: "ビデオを見る", fr: "Voir la vidéo", it: "Guarda il video", ht: "Gade videyo a" },
    "about.stat4Label": { zh: "平均评分", ja: "平均評価", fr: "Note moyenne", it: "Valutazione media", ht: "Evalyasyon Mwayèn" },
    "courses.viewAll": { zh: "查看所有课程", ja: "全コースを見る", fr: "Voir tous les cours", it: "Visualizza tutti i corsi", ht: "Gade tout kou yo" },
    "testimonials.sectionTitle": { zh: "成功案例", ja: "成功事例", fr: "Histoires de réussite", it: "Storie di successo", ht: "Istwa Siksè" },
    "landing.footer.legal": { zh: "法律信息", ja: "法的情報", fr: "Mentions légales", it: "Informazioni legali", ht: "Enfòmasyon Legal" },
    "landing.footer.support": { zh: "帮助与支持", ja: "ヘルプとサポート", fr: "Aide et support", it: "Aiuto e supporto", ht: "Èd ak Sipò" },
    "landing.footer.company": { zh: "公司", ja: "会社", fr: "Entreprise", it: "Azienda", ht: "Konpayi" },
    "landing.footer.resources": { zh: "资源", ja: "リソース", fr: "Ressources", it: "Risorse", ht: "Resous" }
};

async function exhaustiveUpdate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const langCodes = ['zh', 'ja', 'fr', 'it', 'ht'];

        for (const [key, langs] of Object.entries(EXTRA_DATA)) {
            for (const lang of langCodes) {
                if (langs[lang]) {
                    await client.query(`UPDATE i18n_labels SET "${lang}" = $1 WHERE key = $2`, [langs[lang], key]);
                }
            }
        }

        await client.query('COMMIT');
        console.log('Exhaustive update completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Update failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

exhaustiveUpdate();
