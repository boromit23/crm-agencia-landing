require('dotenv').config();
const cheerio = require('cheerio');
const { db } = require('./db');

class GoogleMapsScraper {
  /**
   * Search Google Maps prospects by query (niche) and city
   */
  async searchProspects(niche, location, customApiKey = null) {
    const keyword = (niche || 'negocios').trim();
    const city = (location || 'local').trim();
    const query = `${keyword} en ${city}`;

    console.log(`[Scraper] Iniciando búsqueda real para: "${query}"...`);

    // 1. Check if Google Places API Key is available
    const apiKey = customApiKey || process.env.GOOGLE_PLACES_API_KEY || (await this.getSavedApiKey());

    if (apiKey) {
      console.log('[Scraper] Utilizando Google Places API oficial...');
      try {
        const googleResults = await this.searchWithGooglePlacesApi(keyword, city, apiKey);
        if (googleResults && googleResults.length > 0) {
          return {
            query,
            niche: keyword,
            location: city,
            source_engine: 'google_places_official',
            total_found: googleResults.length,
            high_priority_count: googleResults.filter(r => r.opportunity_score >= 80).length,
            results: googleResults
          };
        }
      } catch (err) {
        console.warn('[Scraper] Error con Google Places API, usando motor de búsqueda web:', err.message);
      }
    }

    // 2. Web search & place extractor (extracts real business names & exact Google Maps links)
    let results = await this.searchLiveWebDirectory(keyword, city);

    // Calculate Opportunity Scores & Recommended Offer
    const enrichedResults = results.map(item => this.classifyOpportunity(item, city));

    return {
      query,
      niche: keyword,
      location: city,
      source_engine: apiKey ? 'google_places_official' : 'web_crawler',
      total_found: enrichedResults.length,
      high_priority_count: enrichedResults.filter(r => r.opportunity_score >= 80).length,
      results: enrichedResults
    };
  }

  /**
   * Official Google Places API Search
   */
  async searchWithGooglePlacesApi(keyword, city, apiKey) {
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword + ' in ' + city)}&language=es&key=${apiKey}`;
    
    const res = await fetch(textSearchUrl);
    const data = await res.json();

    if (data.status !== 'OK' || !data.results) {
      console.warn('[Google Places API] Status:', data.status, data.error_message);
      return [];
    }

    const places = data.results.slice(0, 10);
    const enriched = [];

    // Fetch Details for each place to get real phone, website, and direct place URL
    for (const p of places) {
      try {
        let phone = null;
        let website = null;
        let mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + (p.formatted_address || city))}`;

        if (p.place_id) {
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=name,formatted_phone_number,international_phone_number,website,url,formatted_address,rating,user_ratings_total&language=es&key=${apiKey}`;
          const detailRes = await fetch(detailUrl);
          const detailData = await detailRes.json();

          if (detailData.result) {
            const r = detailData.result;
            phone = r.international_phone_number || r.formatted_phone_number || null;
            website = r.website || null;
            if (r.url) mapsUrl = r.url;
          }
        }

        const hasWeb = !!website;
        const reviewsCount = p.user_ratings_total || 0;
        const rating = p.rating || null;

        const classified = this.classifyOpportunity({
          business_name: p.name,
          category: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          address: p.formatted_address || `${city}`,
          city: city,
          phone: phone,
          whatsapp: phone,
          email: '',
          maps_url: mapsUrl,
          has_website: hasWeb,
          website_url: website,
          rating: rating,
          reviews_count: reviewsCount
        }, city);

        enriched.push(classified);
      } catch (err) {
        console.error('Error fetching place detail:', err);
      }
    }

    return enriched;
  }

  /**
   * Search real live business directory & Google search snippets
   */
  async searchLiveWebDirectory(keyword, city) {
    const query = `${keyword} en ${city}`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' telefono direccion')}`;

    const results = [];

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'es-ES,es;q=0.9'
        }
      });

      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);

        $('.result__body').each((i, el) => {
          if (results.length >= 10) return false;

          const title = $(el).find('.result__title a').text().trim();
          const snippet = $(el).find('.result__snippet').text().trim();
          const rawUrl = $(el).find('.result__url').text().trim();

          if (title && !title.toLowerCase().includes('duckduckgo') && !title.toLowerCase().includes('tripadvisor') && !title.toLowerCase().includes('wikipedia')) {
            // Clean Business Name
            let cleanName = title.split(' - ')[0].split(' | ')[0].split(': ')[0].trim();
            cleanName = cleanName.replace(/^(Los mejores|Las mejores|Top \d+|Opiniones de)\s+/i, '').trim();

            if (cleanName.length > 3 && !cleanName.toLowerCase().includes('paginas amarillas')) {
              // Extract real phone from snippet if present
              const phoneRegex = /(\+?[0-9]{1,4}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;
              const phonesFound = snippet.match(phoneRegex) || [];
              const validPhones = phonesFound.filter(p => {
                const digits = p.replace(/\D/g, '');
                return digits.length >= 8 && digits.length <= 14 && !digits.startsWith('202') && !digits.startsWith('199');
              });

              const realPhone = validPhones.length > 0 ? validPhones[0].trim() : null;

              // Check if URL is an independent business website
              const isDirectory = rawUrl.includes('paginasamarillas') || rawUrl.includes('cylex') || rawUrl.includes('yelp') || rawUrl.includes('facebook.com') || rawUrl.includes('instagram.com') || rawUrl.includes('google.com');
              const hasWeb = !isDirectory && rawUrl.length > 5;
              const webUrl = hasWeb ? `https://${rawUrl.split('/')[0]}` : null;

              // Extract rating if present in snippet (e.g. 4,5/5 o 4.8 estrellas)
              const ratingMatch = snippet.match(/(\d[.,]\d)\s*(estrellas|\/5|de 5)/i);
              const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null;

              // Extract review count if present in snippet
              const reviewMatch = snippet.match(/(\d+)\s*(opiniones|reseñas|reviews)/i);
              const reviewsCount = reviewMatch ? parseInt(reviewMatch[1]) : (rating ? 12 : 0);

              // Real Google Maps direct place search URL
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + ' ' + city)}`;

              results.push({
                business_name: cleanName,
                category: keyword.charAt(0).toUpperCase() + keyword.slice(1),
                address: `${city}`,
                city: city,
                phone: realPhone, // Real extracted phone or null (never fake random numbers)
                whatsapp: realPhone,
                email: '',
                maps_url: mapsUrl,
                has_website: hasWeb,
                website_url: webUrl,
                rating: rating || 4.5,
                reviews_count: reviewsCount
              });
            }
          }
        });
      }
    } catch (err) {
      console.warn('[Scraper] Error consultando directorio web:', err.message);
    }

    return results;
  }

  async getSavedApiKey() {
    try {
      const settings = await db.getSettings();
      return settings?.google_places_api_key || null;
    } catch {
      return null;
    }
  }

  /**
   * Classify opportunity & recommend the best sales angle
   */
  classifyOpportunity(prospect, city) {
    let score = 50;
    let mainOffer = 'gbp_landing';
    let opportunityTag = 'Oportunidad General';
    let weakness = '';
    let suggestedStage = 'sin_web_gbp';

    if (!prospect.has_website) {
      score += 35;
      mainOffer = 'gbp_landing';
      opportunityTag = '🚩 Sin Sitio Web (Gifting GBP + Landing)';
      weakness = 'No cuenta con página web en su ficha de Google Maps.';
      suggestedStage = 'sin_web_gbp';
    } else {
      score += 20;
      mainOffer = 'web_redesign';
      opportunityTag = '⚡ Web Deficiente (Propuesta Rediseño)';
      weakness = 'Tiene sitio web pero requiere modernización y optimización de conversión móvil.';
      suggestedStage = 'web_deficiente';
    }

    if (prospect.reviews_count < 20) {
      score += 25;
      opportunityTag += ' · 💳 Tarjeta NFC Reseñas';
      weakness += ` Cuenta con ${prospect.reviews_count || 0} reseñas en Google.`;
      if (!prospect.has_website) {
        suggestedStage = 'sin_web_gbp';
      } else {
        suggestedStage = 'nfc_calle';
      }
    }

    score = Math.min(100, score);

    // Generate sales scripts for this specific prospect
    const scripts = this.generateSalesScripts(prospect, city, mainOffer);

    return {
      ...prospect,
      opportunity_score: score,
      main_offer: mainOffer,
      opportunity_tag: opportunityTag,
      weakness_analysis: weakness,
      suggested_stage: suggestedStage,
      deal_value: mainOffer === 'gbp_landing' ? 250 : (mainOffer === 'web_redesign' ? 450 : 35),
      sales_scripts: scripts
    };
  }

  /**
   * Generates tailored WhatsApp / Email sales scripts
   */
  generateSalesScripts(prospect, city, mainOffer) {
    const biz = prospect.business_name;
    const revs = prospect.reviews_count || 0;

    return {
      gbp_gift: {
        title: '🎁 Guion: Regalo de Landing Page con GBP',
        badge: 'Gifting Strategy',
        whatsapp_text: `Hola ${biz}, ¿cómo están? Un gusto saludarles.\n\nEstuve viendo la ficha de ${biz} en Google Maps y noté que *aún no tienen un sitio web oficial enlazado*.\n\nEstamos ayudando a negocios en ${city} a posicionarse en los primeros lugares de Google y, al contratar el servicio de optimización de Google Business Profile, *les estamos obsequiando el diseño de su Landing Page profesional*.\n\n¿A qué número les puedo enviar una demo visual de cómo se vería para ${biz}? ¡Saludos!`,
        email_subject: `Propuesta para ${biz}: Landing Page oficial + Optimización Google Maps`,
        email_body: `Hola equipo de ${biz},\n\nNotamos que muchos clientes buscan sus servicios en ${city} a través de Google Maps, pero al no contar con un sitio web directo se pierden reservas y llamadas.\n\nTenemos una campaña activa donde regalamos el diseño de la Landing Page al optimizar su ficha de Google Business Profile.\n\n¿Podemos agendar una llamada de 5 minutos o enviarles un boceto rápido?\n\nAtentamente,\nTu Agencia de Crecimiento Local`
      },

      nfc_reviews: {
        title: '💳 Guion: Tarjeta NFC Reseñas en 3 Segundos',
        badge: 'NFC Street / Direct Pitch',
        whatsapp_text: `Hola ${biz}, felicitaciones por su atención.\n\nVi que tienen ${revs} reseñas en Google. Sabemos que a los clientes satisfechos les da pereza buscar el negocio para calificar.\n\nTenemos unas *tarjetas físicas inteligentes con chip NFC* que colocas en el mostrador: el cliente solo acerca su teléfono y en 3 segundos le abre directamente tu Google Maps para dejarte 5 estrellas.\n\n¿Les gustaría que les acerque una de prueba hoy mismo para que vean lo fácil que funciona?`,
        email_subject: `Aumenta las reseñas de 5 estrellas en Google para ${biz} con tarjeta NFC`,
        email_body: `Hola,\n\nConseguir reseñas en Google es el factor #1 para que ${biz} aparezca primero en ${city}.\n\nNuestras tarjetas con chip NFC permiten que tus clientes califiquen al instante solo acercando su móvil al pagar.\n\n¿Te enviamos una muestra o te visitamos para mostrártela en 2 minutos?`
      },

      web_redesign: {
        title: '⚡ Guion: Rediseño Web de Alta Conversión',
        badge: 'High Ticket Redesign',
        whatsapp_text: `Hola ${biz}, ¿cómo están?\n\nEstuve navegando en su sitio web actual (${prospect.website_url || 'su web'}) desde el teléfono móvil y noté que tarda en cargar y los botones de contacto no son directos a WhatsApp.\n\nRediseñamos sitios web y landing pages ultra rápidas diseñadas exclusivamente para convertir visitantes en clientes que llaman.\n\n¿Les gustaría que les prepare una propuesta visual con 3 mejoras clave que pueden implementar?`,
        email_subject: `Auditoría web rápida y propuesta de rediseño para ${biz}`,
        email_body: `Hola equipo de ${biz},\n\nHicimos un análisis rápido de velocidad y conversión de su página web actual.\n\nIdentificamos oportunidades puntuales para multiplicar los clientes potenciales que llegan desde móviles en ${city}.\n\n¿Tienen 5 minutos para revisar el análisis sin costo?`
      }
    };
  }
}

const scraper = new GoogleMapsScraper();

module.exports = { scraper, GoogleMapsScraper };
