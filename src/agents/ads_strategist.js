// AI Ads Strategist Agent - Facebook & Instagram Ads for Local Agency

class AdsStrategistAgent {
  /**
   * Generates a complete Meta Ads campaign plan tailored to niche, city, and offer
   */
  generateCampaign(params = {}) {
    const niche = (params.niche || 'Negocios Locales').trim();
    const city = (params.city || 'Valencia, Venezuela').trim();
    const budget = parseFloat(params.budget_daily) || 10;
    const angle = params.angle || 'gbp_landing_gift'; // 'gbp_landing_gift' | 'nfc_reviews' | 'web_redesign'

    const cityNameOnly = city.split(',')[0].trim();

    // Strategy Configurations based on Offer Angle
    const strategies = {
      gbp_landing_gift: {
        campaign_name: `[LEADS] Landing Gratis + GBP - ${niche} - ${cityNameOnly} 2026`,
        objective: 'GENERACIÓN DE CLIENTES POTENCIALES (Lead Ads)',
        ad_format: 'Imagen Única / Video Corto (Reel)',
        hook_angle: 'Obsequio de Landing Page profesional al optimizar la ficha de Google Business Profile',
        estimated_leads_daily: Math.max(3, Math.round(budget / 1.8)),
        cost_per_lead: '$1.20 - $2.50 USD',

        // Ad Set Settings
        targeting: {
          location: `${city} (+15 km a la redonda)`,
          age: '24 - 58 años',
          genders: 'Todos (Hombres y Mujeres)',
          detailed_targeting: [
            'Administradores de páginas de negocios en Facebook',
            'Dueños de pequeñas empresas',
            'Google Mi Negocio / Google Business Profile',
            'Comercio local y pymes',
            `${niche} (Interés de industria)`
          ],
          placements: 'Ubicaciones Advantage+ (Feed de Instagram, Feed de Facebook, Stories y Reels)'
        },

        // Copywriting Variants
        copies: [
          {
            type: 'AIDA (Atención, Interés, Deseo, Acción)',
            tag: '⭐ Más recomendado para volumen',
            headline: `🎁 ¿Tienes un negocio en ${cityNameOnly}? Te regalamos tu Landing Page`,
            primary_text: `🚨 ATENCIÓN DUEÑOS DE NEGOCIOS EN ${cityNameOnly.toUpperCase()}:\n\nSi tus clientes te buscan en Google Maps y no encuentran una página web donde ver tus servicios, precios y tu botón directo de WhatsApp... estás perdiendo ventas todos los días frente a tu competencia.\n\nPor tiempo limitado, estamos lanzando una iniciativa especial para negocios de ${niche}:\n\n👉 Al activar nuestro servicio de posicionamiento y optimización en Google Maps (Google Business Profile), ¡TE OBSEQUIAMOS el diseño completo de tu Landing Page profesional y rápida para móviles!\n\n✅ Ficha de Google optimizada para salir de primero en las búsquedas locales.\n✅ Landing Page moderna con botón directo a tu WhatsApp.\n✅ Configuración lista en 48 horas sin enredos técnicos.\n\nToca el botón de abajo, déjanos tu número de WhatsApp y te enviaremos un boceto visual de cómo se vería para tu negocio sin ningún compromiso 👇`,
            cta_button: 'Más información',
            media_suggestion: 'Imagen de alta calidad con captura de pantalla de Google Maps mostrando 5 estrellas y un teléfono móvil al lado con la landing page cargando.'
          },
          {
            type: 'Caso Real / Antes y Después',
            tag: '💡 Ideal para generar confianza',
            headline: `Cómo este negocio en ${cityNameOnly} multiplicó sus llamadas de clientes`,
            primary_text: `El 82% de las personas en ${cityNameOnly} buscan "${niche}" en Google desde su celular antes de ir o llamar.\n\nEl problema es que la mayoría de negocios locales tienen su ficha descuidada o ni siquiera tienen un sitio web oficial enlazado.\n\nNosotros cambiamos eso:\n1️⃣ Maximizamos tu presencia en Google Maps.\n2️⃣ Te regalamos el diseño de tu Landing Page adaptada a teléfonos.\n3️⃣ Recibes mensajes directos de clientes listos para comprar.\n\nCompleta el formulario en 15 segundos para reservar tu diseño gratuito este mes.`,
            cta_button: 'Registrarse',
            media_suggestion: 'Video corto de 15 segundos mostrando la búsqueda en Google y cómo un cliente toca el botón de WhatsApp en la landing page.'
          },
          {
            type: 'Oferta Directa y Urgencia',
            tag: '🔥 Conversión rápida',
            headline: `Solo 10 cupos: Landing Page de regalo para ${niche} en ${cityNameOnly}`,
            primary_text: `¿Quieres que tu negocio aparezca en los primeros lugares de Google cuando alguien busque tus servicios en ${cityNameOnly}?\n\nEste mes estamos regalando 10 diseños de Landing Pages para negocios que optimicen su perfil de Google con nosotros.\n\nSin costos ocultos. Toca abajo y solicita tu demostración en WhatsApp hoy mismo.`,
            cta_button: 'Enviar mensaje',
            media_suggestion: 'Gráfico con mockup de smartphone en fondo oscuro con etiqueta de "10 Cupos Disponibles".'
          }
        ],

        // Lead Form Structure
        lead_form: {
          form_name: `Formulario Express - Landing Gratis ${cityNameOnly}`,
          intro_headline: `Obtén tu Landing Page de Regalo para tu Negocio en ${cityNameOnly}`,
          intro_body: 'Completa estos datos rápidos para que nuestro equipo te prepare una demo personalizada.',
          questions: [
            { id: 'business_name', label: 'Nombre de tu negocio o local', type: 'text' },
            { id: 'phone', label: 'Tu número de WhatsApp directo', type: 'phone' },
            { id: 'has_website', label: '¿Cuentas actualmente con página web oficial?', options: ['No, no tengo web (Quiero mi landing de regalo)', 'Sí tengo web, pero es lenta o antigua'] }
          ],
          completion_headline: '¡Todo listo! Recibimos tu solicitud',
          completion_body: 'Te escribiremos por WhatsApp en breve con tu boceto. Si deseas atención inmediata, toca el botón de abajo:',
          completion_button_text: '💬 Abrir WhatsApp con un Asesor'
        }
      },

      nfc_reviews: {
        campaign_name: `[LEADS] Tarjetas NFC Reseñas Google - ${niche} - ${cityNameOnly}`,
        objective: 'GENERACIÓN DE CLIENTES POTENCIALES / MENSAJES WHATSAPP',
        ad_format: 'Video demostración de 10 a 20 segundos (Acercando el teléfono)',
        hook_angle: 'Tarjeta física inteligente NFC para colocar en mostrador y conseguir reseñas 5 estrellas en 3 segundos',
        estimated_leads_daily: Math.max(4, Math.round(budget / 1.5)),
        cost_per_lead: '$0.90 - $1.80 USD',

        targeting: {
          location: `${city} (+10 km)`,
          age: '22 - 60 años',
          genders: 'Todos',
          detailed_targeting: [
            'Dueños de negocios gastronómicos, clínicas, salones y talleres',
            'Comercio minorista y puntos de venta',
            'Administradores de páginas de Facebook'
          ],
          placements: 'Feeds de Instagram, Reels y TikTok/Facebook'
        },

        copies: [
          {
            type: 'Demostración de Impacto en Vivo',
            tag: '⭐ Ganador en ventas en frío y anuncios',
            headline: `💳 Tus clientes te dejarán 5 estrellas en Google en solo 3 segundos`,
            primary_text: `¿Sabías que a los clientes satisfechos les da pereza buscar tu negocio en Google para dejarte una reseña?\n\nCon nuestras *Tarjetas Inteligentes con Chip NFC*, tus clientes solo tienen que acercar su teléfono en el mostrador o mesa al pagar... ¡y automáticamente se les abre tu Google Maps para calificarte con 5 estrellas!\n\n🚀 Aumenta tu reputación en ${cityNameOnly}.\n📈 Sube a los primeros puestos de Google.\n⚡ Sin aplicaciones ni baterías, funciona de por vida.\n\nPrecio de lanzamiento: Solo $35 USD con entrega directa en ${cityNameOnly}.\n\nToca abajo y pide la tuya hoy con demostración presencial 👇`,
            cta_button: 'Enviar mensaje',
            media_suggestion: 'Video demostración en vertical donde una persona paga y acerca su móvil a la tarjeta NFC colocada en un soporte elegante.'
          },
          {
            type: 'Problema vs Solución',
            tag: '🎯 Directo al dolor del dueño',
            headline: `El secreto de los negocios más visitados en Google de ${cityNameOnly}`,
            primary_text: `Los negocios que más clientes reciben en Google Maps no son necesariamente los más grandes, sino los que tienen MÁS RESEÑAS de 5 estrellas.\n\nDeja de pedir favores y facilita que califiquen tu servicio en 3 segundos con nuestra Tarjeta Inteligente NFC.\n\nEntrega inmediata en ${cityNameOnly}. Toca abajo para ver un video de cómo funciona.`,
            cta_button: 'Más información',
            media_suggestion: 'Foto comparativa: Negocio con 8 reseñas vs Negocio con 150 reseñas usando la tarjeta NFC.'
          }
        ],

        lead_form: {
          form_name: `Solicitud de Tarjeta NFC - ${cityNameOnly}`,
          intro_headline: 'Pide tu Tarjeta Inteligente de Reseñas Google',
          intro_body: 'Ingresa tu WhatsApp para coordinar la entrega o enviarte el video demostrativo.',
          questions: [
            { id: 'business_name', label: 'Nombre de tu local / negocio', type: 'text' },
            { id: 'phone', label: 'Número de WhatsApp para contacto', type: 'phone' },
            { id: 'quantity', label: '¿Cuántas tarjetas necesitas para tu local?', options: ['1 Tarjeta ($35)', 'Pack 2 Tarjetas ($60)', 'Pack 5 Tarjetas para sucursales'] }
          ],
          completion_headline: '¡Solicitud Recibida!',
          completion_body: 'Un asesor te escribirá en minutos para coordinar la entrega de tu tarjeta NFC.',
          completion_button_text: '💬 Hablar por WhatsApp Ahora'
        }
      },

      web_redesign: {
        campaign_name: `[LEADS] Rediseño Web Alta Conversión - ${niche} - ${cityNameOnly}`,
        objective: 'GENERACIÓN DE CLIENTES POTENCIALES (Lead Ads B2B)',
        ad_format: 'Carrusel o Video Auditoría',
        hook_angle: 'Rediseño de sitios web obsoletos para multiplicar llamadas y reservas desde teléfonos móviles',
        estimated_leads_daily: Math.max(2, Math.round(budget / 3.0)),
        cost_per_lead: '$2.50 - $5.00 USD (High Ticket $450)',

        targeting: {
          location: `${city}`,
          age: '28 - 62 años',
          genders: 'Todos',
          detailed_targeting: [
            'Empresarios y directores de empresas',
            'Comercio electrónico y servicios profesionales',
            'Usuarios que administran páginas comerciales'
          ],
          placements: 'Feed de Facebook y Feed de Instagram'
        },

        copies: [
          {
            type: 'Auditoría y Conversión Móvil',
            tag: '💼 Enfoque B2B / Ticket Alto',
            headline: `¿Tu sitio web actual te está trayendo clientes reales o es un gasto inútil?`,
            primary_text: `El 85% de las visitas a tu página web llegan desde teléfonos celulares. Si tu web actual tarda más de 3 segundos en cargar o es difícil de navegar, tus prospectos se van inmediatamente a la competencia.\n\nEn nuestra agencia rediseñamos sitios web y landing pages ultra rápidas creadas exclusivamente para convertir visitas en llamadas y mensajes de WhatsApp.\n\nSolicita una auditoría visual gratuita de tu sitio web actual en ${cityNameOnly}. Toca abajo 👇`,
            cta_button: 'Más información',
            media_suggestion: 'Mockup en laptop y smartphone mostrando un rediseño limpio con métricas de velocidad en verde.'
          }
        ],

        lead_form: {
          form_name: `Auditoría Web Gratuita - ${cityNameOnly}`,
          intro_headline: 'Solicita tu Análisis y Auditoría Web Sin Costo',
          intro_body: 'Revisaremos tu web actual y te diremos exactamente 3 mejoras para duplicar tus clientes.',
          questions: [
            { id: 'business_name', label: 'Nombre de tu negocio o empresa', type: 'text' },
            { id: 'website_url', label: 'URL de tu página web actual', type: 'text' },
            { id: 'phone', label: 'WhatsApp de contacto', type: 'phone' }
          ],
          completion_headline: '¡Auditoría en proceso!',
          completion_body: 'En menos de 24 horas te enviaremos un informe con video explicativo a tu WhatsApp.',
          completion_button_text: '💬 Agendar llamada directa'
        }
      }
    };

    const selectedStrategy = strategies[angle] || strategies.gbp_landing_gift;

    return {
      success: true,
      niche,
      city,
      budget_daily: budget,
      budget_monthly_projected: budget * 30,
      angle,
      campaign_data: selectedStrategy,
      setup_instructions: [
        '1. Entra a Meta Ads Manager (adsmanager.facebook.com) y pulsa en "+ Crear Campaña".',
        '2. Selecciona el objetivo "Clientes Potenciales (Leads)" y presupuesto diario indicado.',
        '3. En el Conjunto de Anuncios, copia la segmentación de ciudad y los intereses recomendados.',
        '4. En el Anuncio, copia el Texto Principal (Copy), el Título y pega las preguntas del Formulario Instantáneo.',
        '5. Conecta el Webhook del CRM para que cada lead que llene el formulario caiga en tu Pipeline al instante.'
      ]
    };
  }
}

const adsStrategist = new AdsStrategistAgent();

module.exports = { adsStrategist, AdsStrategistAgent };
