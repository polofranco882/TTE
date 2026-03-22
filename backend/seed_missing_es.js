const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/APP_WEB/TTE/backend/.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const translations = [
    { key: 'menu.welcome', module: 'menu', en: 'Welcome', es: 'Bienvenido', pt: 'Bem-vindo' },
    { key: 'menu.dashboard', module: 'menu', en: 'Dashboard', es: 'Panel', pt: 'Painel' },
    { key: 'menu.landing', module: 'menu', en: 'Landing Page', es: 'Página Web', pt: 'Página Web' },
    { key: 'menu.books', module: 'menu', en: 'Library', es: 'Librería Interactiva', pt: 'Livraria Interativa' },
    { key: 'menu.adminBooks', module: 'menu', en: 'Manage Books', es: 'Gestionar Libros', pt: 'Gerenciar Livros' },
    { key: 'menu.reports', module: 'menu', en: 'Reports', es: 'Reportes', pt: 'Relatórios' },
    { key: 'menu.languages', module: 'menu', en: 'Translations', es: 'Traducciones', pt: 'Traduções' },
    { key: 'menu.settings', module: 'menu', en: 'Settings', es: 'Configuraciones', pt: 'Configurações' },
    { key: 'menu.logout', module: 'menu', en: 'Log Out', es: 'Cerrar Sesión', pt: 'Sair' },
    
    // Landing Nav & Hero
    { key: 'landing.nav.about', module: 'landing', en: 'About Us', es: 'Nosotros', pt: 'Sobre Nós' },
    { key: 'landing.nav.courses', module: 'landing', en: 'Courses', es: 'Cursos', pt: 'Cursos' },
    { key: 'landing.nav.testimonials', module: 'landing', en: 'Testimonials', es: 'Testimonios', pt: 'Depoimentos' },
    { key: 'landing.nav.login', module: 'landing', en: 'Platform Login', es: 'Entrar a Plataforma', pt: 'Acesso à Plataforma' },
    { key: 'landing.hero.badge', module: 'landing', en: 'Excellence in English Education', es: 'Excelencia en Educación de Inglés', pt: 'Excelência em Ensino de Inglês' },
    { key: 'landing.hero.subtitle', module: 'landing', en: 'TTESOL Academy offers a premium...', es: 'TTESOL Academy ofrece una experiencia...', pt: 'TTESOL Academy oferece uma experi...' },
    { key: 'landing.hero.primaryCta', module: 'landing', en: 'Access Platform', es: 'Acceder a Plataforma', pt: 'Acessar Plataforma' },
    { key: 'landing.hero.secondaryCta', module: 'landing', en: 'Watch Video', es: 'Ver Video', pt: 'Assistir Vídeo' },
    
    // Landing Stats
    { key: 'landing.stats.activeStudents', module: 'landing', en: 'Active Students', es: 'Estudiantes Activos', pt: 'Alunos Ativos' },
    { key: 'landing.stats.premiumCourses', module: 'landing', en: 'Premium Courses', es: 'Cursos Premium', pt: 'Cursos Premium' },
    { key: 'landing.stats.successRate', module: 'landing', en: 'Success Rate', es: 'Tasa de Éxito', pt: 'Taxa de Sucesso' },
    { key: 'landing.stats.avgRating', module: 'landing', en: 'Average Rating', es: 'Calificación Promedio', pt: 'Avaliação Média' },
    
    // Landing Courses
    { key: 'landing.courses.subtitle', module: 'landing', en: 'Our Curriculum', es: 'Nuestro Plan de Estudios', pt: 'Nosso Currículo' },
    { key: 'landing.courses.title', module: 'landing', en: 'Featured Programs', es: 'Programas Destacados', pt: 'Programas em Destaque' },
    { key: 'landing.courses.learnMore', module: 'landing', en: 'Learn More', es: 'Saber Más', pt: 'Saiba Mais' },
    { key: 'landing.courses.viewAll', module: 'landing', en: 'View Full Catalog', es: 'Ver Catálogo Completo', pt: 'Ver Catálogo Completo' },
    
    // Landing Footer
    { key: 'landing.footer.description', module: 'landing', en: 'Transforming lives through language.', es: 'Transformando vidas a través del lenguaje.', pt: 'Transformando vidas através do idioma.' },
    { key: 'landing.footer.platform', module: 'landing', en: 'Platform', es: 'Plataforma', pt: 'Plataforma' },
    { key: 'landing.footer.library', module: 'landing', en: 'Library', es: 'Biblioteca', pt: 'Biblioteca' },
    { key: 'landing.footer.certification', module: 'landing', en: 'Certifications', es: 'Certificaciones', pt: 'Certificações' },
    { key: 'landing.footer.support', module: 'landing', en: 'Support', es: 'Soporte', pt: 'Suporte' },
    { key: 'landing.footer.legal', module: 'landing', en: 'Legal', es: 'Legal', pt: 'Legal' },
    { key: 'landing.footer.privacy', module: 'landing', en: 'Privacy Policy', es: 'Política de Privacidad', pt: 'Política de Privacidade' },
    { key: 'landing.footer.terms', module: 'landing', en: 'Terms of Service', es: 'Términos de Servicio', pt: 'Termos de Serviço' }
];

async function seed() {
    for (const t of translations) {
        await pool.query(`
            INSERT INTO i18n_labels (key, module, en, es, pt) 
            VALUES ($1, $2, $3, $4, $5) 
            ON CONFLICT (key) DO UPDATE 
            SET es = EXCLUDED.es, pt = EXCLUDED.pt, module = EXCLUDED.module
        `, [t.key, t.module, t.en, t.es, t.pt]);
    }
    console.log('Missing translations seeded successfully.');
    pool.end();
}

seed().catch(err => {
    console.error(err);
    pool.end();
});
