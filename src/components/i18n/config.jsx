import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        home: "Home",
        gyms: "Gyms",
        notifications: "Notifications",
        profile: "Profile"
      },
      plus: {
        title: "Upgrade to Retention Pro",
        subtitle: "Unlock advanced analytics and insights to grow your gym",
        currentPlan: "Current Plan",
        yourPlan: "Your Plan",
        subscribeNow: "Subscribe Now",
        startFreeTrial: "Start Free Trial",
        monthlyPrice: "£49.99/month",
        iframeWarning: "Checkout only works from the published app. Open in a new tab to subscribe.",
        basic: {
          title: "Basic",
          price: "Free",
          features: [
            "Community feed",
            "Member check-ins",
            "Basic challenges",
            "Events management",
            "Rewards system"
          ]
        },
        pro: {
          title: "Retention Pro",
          features: [
            "Advanced member analytics",
            "Churn prediction insights",
            "Revenue tracking",
            "Custom reports & dashboards",
            "Email automation",
            "Priority support"
          ],
          trial: {
            title: "Try Pro Free",
            duration: "14-day free trial",
            noCard: "No credit card required",
            cancelAnytime: "Cancel anytime"
          }
        }
      },
      onboarding: {
        welcome: "Welcome to GymConnect",
        subtitle: "The ultimate fitness community platform",
        getStarted: "Get Started",
        memberSignup: "I'm a Member",
        gymSignup: "I'm a Gym Owner"
      },
      profile: {
        settings: "Settings",
        language: "Language",
        selectLanguage: "Select Language",
        logout: "Logout"
      },
      common: {
        loading: "Loading...",
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        close: "Close",
        create: "Create",
        manage: "Manage"
      }
    }
  },
  es: {
    translation: {
      nav: {
        home: "Inicio",
        gyms: "Gimnasios",
        notifications: "Notificaciones",
        profile: "Perfil"
      },
      plus: {
        title: "Actualiza a Retention Pro",
        subtitle: "Desbloquea análisis avanzados e información para hacer crecer tu gimnasio",
        currentPlan: "Plan Actual",
        yourPlan: "Tu Plan",
        subscribeNow: "Suscribirse Ahora",
        startFreeTrial: "Comenzar Prueba Gratuita",
        monthlyPrice: "£49.99/mes",
        iframeWarning: "El pago solo funciona desde la aplicación publicada. Abre en una nueva pestaña para suscribirte.",
        basic: {
          title: "Básico",
          price: "Gratis",
          features: [
            "Feed comunitario",
            "Registros de miembros",
            "Desafíos básicos",
            "Gestión de eventos",
            "Sistema de recompensas"
          ]
        },
        pro: {
          title: "Retention Pro",
          features: [
            "Análisis avanzado de miembros",
            "Información de predicción de abandono",
            "Seguimiento de ingresos",
            "Informes y paneles personalizados",
            "Automatización de correo electrónico",
            "Soporte prioritario"
          ],
          trial: {
            title: "Prueba Pro Gratis",
            duration: "Prueba gratuita de 14 días",
            noCard: "No se requiere tarjeta de crédito",
            cancelAnytime: "Cancela en cualquier momento"
          }
        }
      },
      onboarding: {
        welcome: "Bienvenido a GymConnect",
        subtitle: "La plataforma de comunidad fitness definitiva",
        getStarted: "Comenzar",
        memberSignup: "Soy Miembro",
        gymSignup: "Soy Propietario de Gimnasio"
      },
      profile: {
        settings: "Configuración",
        language: "Idioma",
        selectLanguage: "Seleccionar Idioma",
        logout: "Cerrar Sesión"
      },
      common: {
        loading: "Cargando...",
        save: "Guardar",
        cancel: "Cancelar",
        delete: "Eliminar",
        edit: "Editar",
        close: "Cerrar",
        create: "Crear",
        manage: "Gestionar"
      }
    }
  }
};

const storedLanguage = typeof window !== 'undefined' ? localStorage.getItem('language') : null;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLanguage || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;