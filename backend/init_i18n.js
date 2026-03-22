const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

const defaultLabels = [
    // COMMON
    { key: 'common.save', module: 'common', en: 'Save', es: 'Guardar', pt: 'Salvar' },
    { key: 'common.cancel', module: 'common', en: 'Cancel', es: 'Cancelar', pt: 'Cancelar' },
    { key: 'common.delete', module: 'common', en: 'Delete', es: 'Eliminar', pt: 'Excluir' },
    { key: 'common.edit', module: 'common', en: 'Edit', es: 'Editar', pt: 'Editar' },
    { key: 'common.search', module: 'common', en: 'Search...', es: 'Buscar...', pt: 'Buscar...' },
    { key: 'common.status', module: 'common', en: 'Status', es: 'Estado', pt: 'Status' },
    { key: 'common.active', module: 'common', en: 'Active', es: 'Activo', pt: 'Ativo' },
    { key: 'common.inactive', module: 'common', en: 'Inactive', es: 'Inactivo', pt: 'Inativo' },
    { key: 'common.back', module: 'common', en: 'Back', es: 'Volver', pt: 'Voltar' },
    { key: 'common.loading', module: 'common', en: 'Loading...', es: 'Cargando...', pt: 'Carregando...' },

    // MENU
    { key: 'menu.dashboard', module: 'menu', en: 'Dashboard', es: 'Panel', pt: 'Painel' },
    { key: 'menu.landing', module: 'menu', en: 'Landing Page', es: 'Página Web', pt: 'Página Inicial' },
    { key: 'menu.courses', module: 'menu', en: 'Courses', es: 'Cursos', pt: 'Cursos' },
    { key: 'menu.reports', module: 'menu', en: 'Reports', es: 'Reportes', pt: 'Relatórios' },
    { key: 'menu.gallery', module: 'menu', en: 'Gallery', es: 'Galería', pt: 'Galeria' },
    { key: 'menu.books', module: 'menu', en: 'Interactive Library', es: 'Librería Interactiva', pt: 'Biblioteca Interativa' },
    { key: 'menu.users', module: 'menu', en: 'Users', es: 'Usuarios', pt: 'Usuários' },
    { key: 'menu.settings', module: 'menu', en: 'Settings', es: 'Configuraciones', pt: 'Configurações' },
    { key: 'menu.languages', module: 'menu', en: 'Translations', es: 'Traducciones', pt: 'Traduções' },
    { key: 'menu.logout', module: 'menu', en: 'Sign Out', es: 'Cerrar Sesión', pt: 'Sair' },

    // LOGIN
    { key: 'login.title', module: 'login', en: 'Welcome Back', es: 'Bienvenido', pt: 'Bem-vindo de volta' },
    { key: 'login.subtitle', module: 'login', en: 'Sign in to your account', es: 'Ingresa a tu cuenta', pt: 'Acesse sua conta' },
    { key: 'login.email', module: 'login', en: 'Email Address', es: 'Correo Electrónico', pt: 'E-mail' },
    { key: 'login.password', module: 'login', en: 'Password', es: 'Contraseña', pt: 'Senha' },
    { key: 'login.signIn', module: 'login', en: 'Sign In', es: 'Iniciar Sesión', pt: 'Entrar' },
    { key: 'login.forgotPassword', module: 'login', en: 'Forgot password?', es: '¿Olvidaste tu contraseña?', pt: 'Esqueceu a senha?' },
    { key: 'login.returnHome', module: 'login', en: 'Return to Website', es: 'Volver al Sitio Web', pt: 'Voltar ao Site' },

    // DASHBOARD
    { key: 'dashboard.welcome', module: 'dashboard', en: 'Welcome back', es: 'Hola de nuevo', pt: 'Bem-vindo de volta' },
    { key: 'dashboard.overview', module: 'dashboard', en: 'Overview', es: 'Resumen', pt: 'Visão Geral' },
    { key: 'dashboard.totalStudents', module: 'dashboard', en: 'Total Students', es: 'Estudiantes', pt: 'Estudantes' },
    { key: 'dashboard.activeCourses', module: 'dashboard', en: 'Active Courses', es: 'Cursos Activos', pt: 'Cursos Ativos' },

    // LANDING
    { key: 'landing.nav.about', module: 'landing.nav', en: 'About Us', es: 'Nosotros', pt: 'Sobre Nós' },
    { key: 'landing.nav.courses', module: 'landing.nav', en: 'Courses', es: 'Cursos', pt: 'Cursos' },
    { key: 'landing.nav.testimonials', module: 'landing.nav', en: 'Testimonials', es: 'Testimonios', pt: 'Depoimentos' },
    { key: 'landing.nav.login', module: 'landing.nav', en: 'Platform Login', es: 'Ingresar a Plataforma', pt: 'Acesso à Plataforma' },
    
    // BOOKS / LIBRARY
    { key: 'books.title', module: 'books', en: 'Digital Library', es: 'Biblioteca Digital', pt: 'Biblioteca Digital' },
    { key: 'books.readBtn', module: 'books', en: 'Read Book', es: 'Leer Libro', pt: 'Ler Livro' },
    { key: 'books.noBooks', module: 'books', en: 'No books found.', es: 'No se encontraron libros.', pt: 'Nenhum livro encontrado.' },

    // SETTINGS / ADMIN
    { key: 'admin.cmsTitle', module: 'admin', en: 'Landing Page CMS', es: 'CMS de Pagina Web', pt: 'CMS da Página' },
    { key: 'admin.i18nTitle', module: 'admin', en: 'Translation Editor', es: 'Editor de Idiomas', pt: 'Editor de Idiomas' },
    
    // MESSAGES / VALIDATIONS
    { key: 'messages.savedSuccess', module: 'messages', en: 'Changes saved successfully!', es: '¡Cambios guardados con éxito!', pt: 'Alterações salvas com sucesso!' },
    { key: 'messages.error', module: 'messages', en: 'An error occurred.', es: 'Ocurrió un error.', pt: 'Ocorreu um erro.' },
    { key: 'validations.required', module: 'validations', en: 'This field is required', es: 'Este campo es obligatorio', pt: 'Este campo é obrigatório' },
];

async function seedTranslations() {
    try {
        await client.connect();
        console.log('Connected to DB...');
        
        const sqlPath = path.join(__dirname, 'i18n_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Applying i18n schema...');
        await client.query(sql);
        console.log('Schema applied successfully.');
        
        console.log('Seeding initial translations...');
        // Standard Upsert behavior to avoid overwriting existing modifications
        for (const loc of defaultLabels) {
            await client.query(`
                INSERT INTO i18n_labels (key, module, en, es, pt)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (key) DO NOTHING
            `, [loc.key, loc.module, loc.en, loc.es, loc.pt]);
        }
        console.log('Seeding complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

seedTranslations();
