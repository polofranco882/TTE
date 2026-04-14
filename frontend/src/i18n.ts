import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Fallback skeleton strictly to prevent crash on boot before the API DB Request finishes
const resources = {
  en: {
    translation: {
      "common.loading": "Loading application...",
      "banner.badge": "Excelence in English Education",
      "banner.title": "MASTER ENGLISH WITH CONFIDENCE",
      "banner.subtitle": "Your Global Future Starts Here",
      "banner.description": "Learn from certified native instructors. Methodology optimized for non-native speakers. Prepare for international success.",
      "banner.cta": "Enroll Now",
      "profile.title": "My Profile",
      "profile.subtitle": "Manage your account settings and preferences.",
      "profile.tab_personal": "PERSONAL",
      "profile.tab_security": "SECURITY",
      "profile.tab_preferences": "PREFERENCES",
      "profile.change_photo": "Change Photo",
      "profile.member_since": "ROLE",
      "profile.status": "STATUS",
      "profile.academic_summary": "Academic Summary",
      "profile.personal_info": "Personal Information",
      "profile.full_name": "Full Name",
      "profile.email": "Email Address",
      "profile.phone": "Phone Number",
      "profile.birthdate": "Date of Birth",
      "profile.country": "Country",
      "profile.city": "City",
      "profile.security": "Account Security",
      "profile.security_desc": "Update your authentication credentials",
      "profile.current_password": "Current Password",
      "profile.new_password": "New Password",
      "profile.confirm_password": "Confirm New Password",
      "profile.change_password": "Update Password",
      "profile.active_sessions": "Active Sessions",
      "profile.logout_all": "LOGOUT ALL",
      "profile.preferences": "User Preferences",
      "profile.notification_settings": "Notification Settings",
      "profile.visibility": "System Visibility",
      "profile.save_preferences": "Save Preferences",
      "profile.success_update": "Profile updated successfully",
      "profile.error_update": "Error updating profile",
      "profile.success_password": "Password changed successfully",
      "profile.error_password_match": "Passwords do not match",
      "profile.error_password": "Error changing password",
      "profile.success_photo": "Photo updated successfully",
      "profile.error_photo": "Error uploading photo",
      "profile.success_preferences": "Preferences saved successfully"
    }
  },
  es: {
    translation: {
      "common.loading": "Cargando aplicación...",
      "banner.badge": "Excelencia en Educación de Inglés",
      "banner.title": "DOMINA EL INGLÉS CON CONFIANZA",
      "banner.subtitle": "Tu Futuro Global Empieza Aquí",
      "banner.description": "Aprende de instructores nativos certificados. Metodología optimizada para hispanohablantes. Prepárate para el éxito internacional.",
      "banner.cta": "Inscribirse Ahora",
      "profile.title": "Mi Perfil",
      "profile.subtitle": "Gestiona la configuración de tu cuenta y preferencias.",
      "profile.tab_personal": "PERSONAL",
      "profile.tab_security": "SEGURIDAD",
      "profile.tab_preferences": "PREFERENCIAS",
      "profile.change_photo": "Cambiar Foto",
      "profile.member_since": "ROL",
      "profile.status": "ESTADO",
      "profile.academic_summary": "Resumen Académico",
      "profile.personal_info": "Información Personal",
      "profile.full_name": "Nombre Completo",
      "profile.email": "Correo Electrónico",
      "profile.phone": "Número de Teléfono",
      "profile.birthdate": "Fecha de Nacimiento",
      "profile.country": "País",
      "profile.city": "Ciudad",
      "profile.security": "Seguridad de la Cuenta",
      "profile.security_desc": "Actualiza tus credenciales de autenticación",
      "profile.current_password": "Contraseña Actual",
      "profile.new_password": "Nueva Contraseña",
      "profile.confirm_password": "Confirmar Nueva Contraseña",
      "profile.change_password": "Actualizar Contraseña",
      "profile.active_sessions": "Sesiones Activas",
      "profile.logout_all": "CERRAR TODAS",
      "profile.preferences": "Preferencias de Usuario",
      "profile.notification_settings": "Configuración de Notificaciones",
      "profile.visibility": "Visibilidad del Sistema",
      "profile.save_preferences": "Guardar Preferencias",
      "profile.success_update": "Perfil actualizado con éxito",
      "profile.error_update": "Error al actualizar el perfil",
      "profile.success_password": "Contraseña cambiada con éxito",
      "profile.error_password_match": "Las contraseñas no coinciden",
      "profile.error_password": "Error al cambiar la contraseña",
      "profile.success_photo": "Foto actualizada con éxito",
      "profile.error_photo": "Error al subir la foto",
      "profile.success_preferences": "Preferencias guardadas con éxito"
    }
  },
  pt: {
    translation: {
      "common.loading": "Carregando aplicação...",
      "banner.badge": "Excelência no Ensino de Inglês",
      "banner.title": "DOMINE O INGLÊS COM CONFIANÇA",
      "banner.subtitle": "Seu Futuro Global Começa Aqui",
      "banner.description": "Aprenda com instrutores nativos certificados. Metodologia otimizada para falantes de português. Prepare-se para o sucesso internacional.",
      "banner.cta": "Inscreva-se Agora"
    }
  },
  zh: {
    translation: {
      "common.loading": "正在加载应用...",
      "banner.badge": "卓越的英语教育",
      "banner.title": "充满自信地掌握英语",
      "banner.subtitle": "您的全球未来从这里开始",
      "banner.description": "由认证母语教师授课。针对中文母语者优化的教学法。为国际化成功做好准备。",
      "banner.cta": "立即报名"
    }
  },
  ja: {
    translation: {
      "common.loading": "アプリケーションを読み込んでいます...",
      "banner.badge": "卓越した英語教育",
      "banner.title": "自信を持って英語をマスターする",
      "banner.subtitle": "あなたのグローバルな未来はここから始まる",
      "banner.description": "認定ネイティブ講師から学ぶ。日本語話者に最適化されたメソッド。国際的な成功に備える。",
      "banner.cta": "今すぐ登録"
    }
  },
  fr: {
    translation: {
      "common.loading": "Chargement de l'application...",
      "banner.badge": "Excellence de l'Enseignement de l'Anglais",
      "banner.title": "MAÎTRISEZ L'ANGLAIS AVEC CONFIANCE",
      "banner.subtitle": "Votre Avenir Global Commence Icí",
      "banner.description": "Apprenez avec des formateurs natifs certifiés. Méthodologie optimisée pour les francophones. Préparez-vous au succès international.",
      "banner.cta": "S'inscrire Maintenant"
    }
  },
  it: {
    translation: {
      "common.loading": "Caricamento dell'applicazione...",
      "banner.badge": "Eccellenza nell'Insegnamento dell'Inglese",
      "banner.title": "PADRONEGGIA L'INGLESE CON FIDUCIA",
      "banner.subtitle": "Il Tuo Futuro Globale Inizia Qui",
      "banner.description": "Impara da insegnanti madrelingua certificati. Metodologia ottimizzata per italiani. Preparati al successo internazionale.",
      "banner.cta": "Iscriviti Ora"
    }
  },
  ht: {
    translation: {
      "common.loading": "Chaje aplikasyon an...",
      "banner.badge": "Ekselans nan Edikasyon Anglè",
      "banner.title": "MAITRIZE ANGLE AK KONFYANS",
      "banner.subtitle": "Lavni Global Ou Kòmanse Isit la",
      "banner.description": "Aprann nan men enstriktè natif natal sètifye. Metodoloji optimisé pou moun ki pale kreyòl. Prepare pou siksè entènasyonal.",
      "banner.cta": "Enskri Kounye a"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Force English as the pre-selected language
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'pt', 'zh', 'ja', 'fr', 'it', 'ht'],
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export const loadTranslationsFromDB = async () => {
  try {
    const res = await fetch('/api/i18n/locales');
    if (res.ok) {
      const data = await res.json();
      
      // Inject database translations dynamically
      Object.keys(data).forEach((lng) => {
        i18n.addResourceBundle(lng, 'translation', data[lng].translation, true, true);
      });
      console.log('i18n: Remote DB dictionaries injected successfully.');
    }
  } catch (error) {
    console.error('i18n: Failed to fetch remote dictionaries', error);
  }
};

export default i18n;
