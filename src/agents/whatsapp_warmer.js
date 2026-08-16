// AI WhatsApp Lead Warmer Agent - Immediate Lead Response & Qualification

class WhatsAppWarmerAgent {
  /**
   * Generates initial warm-up message when a new lead enters from Facebook Ads
   */
  generateInitialWarmup(lead, campaignName = '') {
    const biz = lead.business_name || 'tu negocio';
    const contact = lead.contact_name ? lead.contact_name.split(' ')[0] : '';
    const nameGreeting = contact ? `Hola ${contact}` : `Hola, ¿cómo estás?`;

    // Detect offer context
    const campLower = (campaignName + ' ' + (lead.notes || '')).toLowerCase();

    if (campLower.includes('nfc') || campLower.includes('reseña') || campLower.includes('tarjeta')) {
      return {
        stage: 'calentamiento_nfc',
        temperature: '🔥 Caliente (Interés en Tarjeta NFC)',
        suggested_reply: `${nameGreeting}, un gusto saludarte de parte del equipo de GrowthCRM.\n\nRecibimos tu solicitud sobre las *Tarjetas Inteligentes con Chip NFC para conseguir 5 estrellas en Google* para *${biz}*.\n\n¿Te gustaría que te envíe un video corto de 10 segundos para que veas cómo los clientes acercan el móvil y califican en el mostrador? ¡Saludos!`,
        follow_up_action: 'Enviar video demo de tarjeta NFC y coordinar entrega presencial.'
      };
    }

    if (campLower.includes('rediseño') || campLower.includes('auditor')) {
      return {
        stage: 'calentamiento_rediseño',
        temperature: '🔥 Caliente (B2B Rediseño Web)',
        suggested_reply: `${nameGreeting}, mucho gusto en saludarte.\n\nRecibimos tu solicitud para la *auditoría web y propuesta de rediseño de alta conversión* para *${biz}*.\n\nYa estamos analizando los puntos clave para optimizar la velocidad y que tu web reciba más llamadas de clientes en móviles.\n\n¿A qué hora te viene mejor que te comparta el análisis rápido?`,
        follow_up_action: 'Enviar análisis de 3 puntos de mejora y agendar llamada de 5 minutos.'
      };
    }

    // Default: Gifting GBP + Landing Page
    return {
      stage: 'calentamiento_gbp_gift',
      temperature: '🔥 Caliente (Landing Gratis + GBP)',
      suggested_reply: `${nameGreeting}, un gusto saludarte. Te escribo en relación a tu solicitud en nuestro anuncio de Facebook para la *Landing Page de obsequio* para *${biz}*.\n\nQueremos preparar un boceto visual personalizado sin ningún costo para mostrarte cómo se vería tu negocio en los primeros lugares de Google.\n\n¿Actualmente atienden a sus clientes principalmente por WhatsApp o por llamadas?`,
      follow_up_action: 'Hacer pregunta de calificación abierta para enganchar la conversación.'
    };
  }

  /**
   * Processes a customer message and generates an intelligent, persuasive reply
   */
  processCustomerMessage(customerMessage, leadContext = {}) {
    const msg = (customerMessage || '').toLowerCase();
    const biz = leadContext.business_name || 'tu negocio';

    let intent = 'general';
    let reply = '';
    let leadTemperature = 65; // Warm default
    let recommendedNextStep = 'Continuar conversación y enviar demo';

    // 1. Objection: Why is it free / What is the catch?
    if (msg.includes('gratis') || msg.includes('trampa') || msg.includes('por que') || msg.includes('por qué') || msg.includes('regalan') || msg.includes('costo oculto')) {
      intent = 'objecion_gratuidad';
      leadTemperature = 75;
      reply = `Te explico con total transparencia: El diseño de la Landing Page te lo *obsequiamos* al contratar nuestro servicio de posicionamiento y optimización de tu ficha en Google Maps (Google Business Profile).\n\n¿Por qué lo hacemos? Porque cuando posicionamos tu ficha de Google, si la gente no encuentra una página web rápida y profesional donde ver tus servicios y tu botón de WhatsApp, se pierde el 50% de las ventas. Por eso nosotros nos encargamos de construirte la web sin cobrarte el diseño.\n\n¿Te gustaría ver un boceto de demostración para ${biz}?`;
      recommendedNextStep = 'Ofrecer boceto visual sin compromiso para romper la desconfianza.';
    }

    // 2. Question: How much does it cost / Pricing?
    else if (msg.includes('precio') || msg.includes('cuanto') || msg.includes('cuánto') || msg.includes('cuesta') || msg.includes('costo') || msg.includes('tarifa') || msg.includes('valen')) {
      intent = 'consulta_precios';
      leadTemperature = 85;
      reply = `Con gusto te detallo nuestras opciones:\n\n1️⃣ *Tarjetas Inteligentes NFC para Reseñas*: Solo *$35 USD* (pago único, funciona de por vida sin mensualidades).\n2️⃣ *Optimización Google Business Profile + Landing Page Profesional de Regalo*: Plan completo desde *$250 USD* con entrega en 48-72h.\n3️⃣ *Rediseño Web Premium a Medida*: *$450 USD*.\n\nPara ${biz}, ¿cuál de las opciones sientes que es tu prioridad principal en este momento?`;
      recommendedNextStep = 'Identificar qué servicio le interesa más y enviar propuesta o coordinar entrega.';
    }

    // 3. Question: How does the NFC card work?
    else if (msg.includes('nfc') || msg.includes('como funciona') || msg.includes('cómo funciona') || msg.includes('tarjeta') || msg.includes('chip')) {
      intent = 'explicacion_nfc';
      leadTemperature = 80;
      reply = `¡Es súper sencillo e innovador!\n\nLa tarjeta tiene un chip inteligente programado con el enlace directo a las 5 estrellas de tu ficha de Google Maps.\n\nLa colocas en el mostrador, recepción o mesa de ${biz}. Cuando el cliente va a pagar, simplemente le dices: *"Acerca tu móvil aquí un segundo"*. Al acercarlo, en 3 segundos se le abre la pantalla de Google para dejarte 5 estrellas sin tener que buscar tu negocio.\n\n¿Te gustaría que te acerquemos una de muestra para que la pruebes tú mismo con tu teléfono?`;
      recommendedNextStep = 'Proponer visita rápida en calle o envío inmediato con pago contra entrega.';
    }

    // 4. Affirmative / Ready for Demo ("Sí quiero", "Envíame info", "Me interesa", "Mándame el boceto")
    else if (msg.includes('si') || msg.includes('sí') || msg.includes('interesa') || msg.includes('mandame') || msg.includes('envia') || msg.includes('dale') || msg.includes('ok') || msg.includes('quiero')) {
      intent = 'interes_confirmado';
      leadTemperature = 95;
      reply = `¡Excelente! Para prepararte la demo visual exacta para ${biz}:\n\n1. ¿Tienen algún logo o color característico que usen?\n2. ¿Cuáles son los 2 o 3 servicios principales que más les interesa promocionar?\n\nCon esos dos detalles te armamos una vista previa hoy mismo 🚀`;
      recommendedNextStep = 'Crear borrador de Landing Page o preparar tarjeta NFC para entrega.';
    }

    // 5. Objection: I already have a website
    else if (msg.includes('ya tengo') || msg.includes('tengo pagina') || msg.includes('tengo web')) {
      intent = 'ya_tiene_web';
      leadTemperature = 70;
      reply = `¡Qué bueno que ya tienen presencia web! En ese caso, podemos ayudarte de dos formas muy concretas:\n\n1. **Auditoría de Conversión**: Analizar si tu web actual está optimizada para cargar rápido en celulares y si los botones de WhatsApp están generando contactos reales.\n2. **Tarjetas NFC**: Multiplicar tus reseñas en Google Maps para que más personas encuentren tu negocio antes que a la competencia.\n\n¿Cuál es el link de tu web actual para echarle un vistazo?`;
      recommendedNextStep = 'Revisar web actual y proponer rediseño o venta directa de tarjeta NFC.';
    }

    // 6. Default AI Assistant Response
    else {
      intent = 'conversacion_general';
      leadTemperature = 60;
      reply = `Entendido perfectamente. Nuestro objetivo con ${biz} es ayudarte a atraer más clientes locales calificados que busquen tus servicios en Google y que te contacten directo a WhatsApp.\n\n¿Podemos coordinar una llamada rápida de 5 minutos o prefieres que te envíe los detalles y ejemplos por aquí mismo?`;
      recommendedNextStep = 'Ofrecer llamada de 5 minutos o demostración por WhatsApp.';
    }

    return {
      success: true,
      intent,
      customer_message: customerMessage,
      lead_temperature: `${leadTemperature}%`,
      lead_status: leadTemperature >= 80 ? '🔥 Caliente / Listo para Cierre' : '⚡ Tibio / En Calentamiento',
      ai_suggested_reply: reply,
      recommended_next_step: recommendedNextStep
    };
  }
}

const whatsappWarmer = new WhatsAppWarmerAgent();

module.exports = { whatsappWarmer, WhatsAppWarmerAgent };
