const { Pool } = require('pg');
require('dotenv').config({ path: 'c:/APP_WEB/TTE/backend/.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// All translatable fields per section, per language
const TRANSLATIONS = {
    header: {
        en: {
            institutionName: 'TTESOL Academy',
            ctaText: 'Platform Login',
            nav_about: 'About Us',
            nav_courses: 'Courses',
            nav_testimonials: 'Testimonials'
        },
        es: {
            institutionName: 'TTESOL Academy',
            ctaText: 'Acceso a Plataforma',
            nav_about: 'Nosotros',
            nav_courses: 'Cursos',
            nav_testimonials: 'Testimonios'
        },
        pt: {
            institutionName: 'TTESOL Academy',
            ctaText: 'Acessar Plataforma',
            nav_about: 'Sobre Nós',
            nav_courses: 'Cursos',
            nav_testimonials: 'Depoimentos'
        }
    },
    hero: {
        en: {
            badgeText: 'Excellence in English Education',
            title: 'Master the Language, Shape Your Future.',
            subtitle: 'TTESOL Academy offers a premium, interactive learning experience designed to accelerate your fluency and professional growth.',
            primaryCta: 'Access Platform',
            secondaryCta: 'Watch Video'
        },
        es: {
            badgeText: 'Excelencia en Educación de Inglés',
            title: 'Domina el Idioma, Forja tu Futuro.',
            subtitle: 'TTESOL Academy ofrece una experiencia de aprendizaje interactiva y premium diseñada para acelerar tu fluidez y crecimiento profesional.',
            primaryCta: 'Acceder a Plataforma',
            secondaryCta: 'Ver Video'
        },
        pt: {
            badgeText: 'Excelência no Ensino de Inglês',
            title: 'Domine o Idioma, Construa Seu Futuro.',
            subtitle: 'A TTESOL Academy oferece uma experiência de aprendizado interativa e premium projetada para acelerar sua fluência e crescimento profissional.',
            primaryCta: 'Acessar Plataforma',
            secondaryCta: 'Assistir Vídeo'
        }
    },
    about: {
        en: {
            title: 'About TTESOL',
            mission: 'To provide world-class English education accessible to all, empowering students to achieve their personal and professional goals through language mastery.',
            vision: 'To be the leading digital English education institution in Latin America, recognized for excellence and innovation.',
            stat1Label: 'Active Students',
            stat2Label: 'Premium Courses',
            stat3Label: 'Success Rate',
            stat4Label: 'Average Rating'
        },
        es: {
            title: 'Sobre TTESOL',
            mission: 'Proporcionar educación de inglés de clase mundial accesible para todos, empoderando a los estudiantes a lograr sus metas personales y profesionales a través del dominio del idioma.',
            vision: 'Ser la institución educativa de inglés digital líder en América Latina, reconocida por la excelencia e innovación.',
            stat1Label: 'Estudiantes Activos',
            stat2Label: 'Cursos Premium',
            stat3Label: 'Tasa de Éxito',
            stat4Label: 'Calificación Promedio'
        },
        pt: {
            title: 'Sobre a TTESOL',
            mission: 'Fornecer educação de inglês de classe mundial acessível a todos, capacitando os alunos a alcançar seus objetivos pessoais e profissionais por meio do domínio do idioma.',
            vision: 'Ser a principal instituição de educação digital de inglês na América Latina, reconhecida pela excelência e inovação.',
            stat1Label: 'Alunos Ativos',
            stat2Label: 'Cursos Premium',
            stat3Label: 'Taxa de Sucesso',
            stat4Label: 'Avaliação Média'
        }
    },
    courses: {
        en: {
            sectionSubtitle: 'Our Curriculum',
            sectionTitle: 'Featured Programs',
            learnMore: 'Learn More',
            viewAll: 'View Full Catalog',
            course1Title: 'Business English Elite',
            course1Level: 'Advanced',
            course1Desc: 'Master corporate communication and negotiation skills.',
            course2Title: 'IELTS Preparation',
            course2Level: 'Intermediate',
            course2Desc: 'Comprehensive strategies to achieve your target band score.',
            course3Title: 'Conversational Mastery',
            course3Level: 'All Levels',
            course3Desc: 'Build fluency and confidence in daily social interactions.'
        },
        es: {
            sectionSubtitle: 'Nuestro Plan de Estudios',
            sectionTitle: 'Programas Destacados',
            learnMore: 'Saber Más',
            viewAll: 'Ver Catálogo Completo',
            course1Title: 'Inglés Empresarial Elite',
            course1Level: 'Avanzado',
            course1Desc: 'Domina la comunicación corporativa y las habilidades de negociación.',
            course2Title: 'Preparación para IELTS',
            course2Level: 'Intermedio',
            course2Desc: 'Estrategias integrales para lograr tu puntaje objetivo.',
            course3Title: 'Dominio Conversacional',
            course3Level: 'Todos los Niveles',
            course3Desc: 'Construye fluidez y confianza en las interacciones sociales diarias.'
        },
        pt: {
            sectionSubtitle: 'Nosso Currículo',
            sectionTitle: 'Programas em Destaque',
            learnMore: 'Saiba Mais',
            viewAll: 'Ver Catálogo Completo',
            course1Title: 'Inglês Empresarial Elite',
            course1Level: 'Avançado',
            course1Desc: 'Domine a comunicação corporativa e as habilidades de negociação.',
            course2Title: 'Preparação para IELTS',
            course2Level: 'Intermediário',
            course2Desc: 'Estratégias abrangentes para atingir sua pontuação alvo.',
            course3Title: 'Domínio Conversacional',
            course3Level: 'Todos os Níveis',
            course3Desc: 'Construa fluência e confiança nas interações sociais diárias.'
        }
    },
    footer: {
        en: {
            description: 'Transforming lives through language. The premium academic platform for modern English learners.',
            platformTitle: 'Platform',
            legalTitle: 'Legal',
            link_courses: 'Courses',
            link_library: 'Library',
            link_certification: 'Certification',
            link_support: 'Support',
            link_privacy: 'Privacy Policy',
            link_terms: 'Terms of Service',
            copyright: `© ${new Date().getFullYear()} TTESOL Academy. All rights reserved.`
        },
        es: {
            description: 'Transformando vidas a través del lenguaje. La plataforma académica premium para estudiantes de inglés modernos.',
            platformTitle: 'Plataforma',
            legalTitle: 'Legal',
            link_courses: 'Cursos',
            link_library: 'Biblioteca',
            link_certification: 'Certificación',
            link_support: 'Soporte',
            link_privacy: 'Política de Privacidad',
            link_terms: 'Términos de Servicio',
            copyright: `© ${new Date().getFullYear()} TTESOL Academy. Todos los derechos reservados.`
        },
        pt: {
            description: 'Transformando vidas por meio do idioma. A plataforma acadêmica premium para estudantes modernos de inglês.',
            platformTitle: 'Plataforma',
            legalTitle: 'Legal',
            link_courses: 'Cursos',
            link_library: 'Biblioteca',
            link_certification: 'Certificação',
            link_support: 'Suporte',
            link_privacy: 'Política de Privacidade',
            link_terms: 'Termos de Serviço',
            copyright: `© ${new Date().getFullYear()} TTESOL Academy. Todos os direitos reservados.`
        }
    },
    seo: {
        en: {
            metaTitle: 'TTESOL Academy - Premium English Education Platform',
            metaDescription: 'Learn English online with TTESOL Academy. Premium courses, expert teachers, and a modern interactive platform to accelerate your fluency.',
            keywords: 'english, online learning, IELTS, academy, courses'
        },
        es: {
            metaTitle: 'TTESOL Academy - Plataforma Premium de Inglés',
            metaDescription: 'Aprende inglés en línea con TTESOL Academy. Cursos premium, profesores expertos y una plataforma interactiva moderna para acelerar tu fluidez.',
            keywords: 'inglés, aprendizaje en línea, IELTS, academia, cursos'
        },
        pt: {
            metaTitle: 'TTESOL Academy - Plataforma Premium de Inglês',
            metaDescription: 'Aprenda inglês online com a TTESOL Academy. Cursos premium, professores especializados e uma plataforma interativa moderna para acelerar sua fluência.',
            keywords: 'inglês, aprendizado online, IELTS, academia, cursos'
        }
    }
};

async function run() {
    const pageRes = await pool.query("SELECT id FROM landing_pages WHERE slug = 'home'");
    if (pageRes.rows.length === 0) {
        console.error('No home landing page found! Make sure landing_pages table has a "home" row.');
        return pool.end();
    }
    const pageId = pageRes.rows[0].id;
    console.log(`Found landing page id: ${pageId}`);

    let count = 0;
    for (const [sectionKey, langs] of Object.entries(TRANSLATIONS)) {
        for (const [langCode, fields] of Object.entries(langs)) {
            for (const [fieldKey, fieldValue] of Object.entries(fields)) {
                await pool.query(`
                    INSERT INTO landing_section_translations 
                        (landing_page_id, section_key, language_code, field_key, field_value, updated_at)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                    ON CONFLICT (landing_page_id, section_key, language_code, field_key)
                    DO UPDATE SET field_value = EXCLUDED.field_value, updated_at = NOW()
                `, [pageId, sectionKey, langCode, fieldKey, fieldValue]);
                count++;
            }
        }
    }
    console.log(`Seeded ${count} translation entries successfully.`);
    pool.end();
}

run().catch(err => {
    console.error('Seed failed:', err);
    pool.end();
});
