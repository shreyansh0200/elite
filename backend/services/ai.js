import { getMandiPrices } from './mandi.js';
import Slot from '../models/Slot.js';

const CROP_ALIASES = [
  ['गेहूं', 'Wheat'], ['गेहूँ', 'Wheat'], ['wheat', 'Wheat'],
  ['चावल', 'Rice'], ['धान', 'Paddy/Rice'], ['rice', 'Rice'], ['paddy', 'Paddy'],
  ['आलू', 'Potato'], ['potato', 'Potato'], ['प्याज', 'Onion'], ['onion', 'Onion'],
  ['टमाटर', 'Tomato'], ['tomato', 'Tomato'], ['मटर', 'Peas'], ['peas', 'Peas'],
  ['मक्का', 'Maize'], ['maize', 'Maize'], ['सरसों', 'Mustard'], ['mustard', 'Mustard'],
  ['अरहर', 'Arhar'], ['तुअर', 'Arhar'], ['arhar', 'Arhar'],
  ['दाल', 'Pulses'], ['pulses', 'Pulses'],
];

const HINDI_RE = /[\u0900-\u097F]/;
const PRICE_TERMS = ['price', 'rate', 'mandi', 'भाव', 'रेट', 'दाम', 'मंडी', 'कीमत'];
const SLOT_TERMS = ['slot', 'ticket', 'pnr', 'pickup', 'टिकट', 'स्लॉट', 'बुकिंग', 'पिकअप'];

function clean(text) {
  return String(text || '').trim();
}

function isHindi(text) {
  return HINDI_RE.test(text);
}

function containsAny(text, terms) {
  const t = text.toLowerCase();
  return terms.some((term) => t.includes(term.toLowerCase()));
}

function detectCrop(message) {
  const lower = message.toLowerCase();
  const found = CROP_ALIASES.find(([alias]) => lower.includes(alias.toLowerCase()));
  return found?.[1] || '';
}

function extractMarket(message) {
  const match = message.match(/(?:in|at|में|मे|पर)\s+([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F .'-]{2,40}?)(?:\s+(?:mandi|market|का|की|के|mein|me|par)|[?.!,]|$)/i);
  return match?.[1]?.trim() || '';
}

function priceReply(records, hindi, fallbackName) {
  if (!records.length) {
    return hindi
      ? `${fallbackName || 'इस फसल'} की मंडी दर नहीं मिली। राज्य, मंडी और फसल का नाम बताकर फिर पूछें।`
      : `I couldn't find a mandi quote for ${fallbackName || 'that crop'}. Please provide the state, market and crop.`;
  }

  return records.slice(0, 5).map((r) => {
    const location = [r.market, r.district || r.state].filter(Boolean).join(', ');
    if (hindi) {
      return `${r.commodity || fallbackName} — ${location || 'मंडी'}: मॉडल भाव ₹${r.modal_price.toLocaleString('en-IN')}/क्विंटल, न्यूनतम ₹${r.min_price.toLocaleString('en-IN')}, अधिकतम ₹${r.max_price.toLocaleString('en-IN')}.`;
    }
    return `${r.commodity || fallbackName} — ${location || 'market'}: modal ₹${r.modal_price.toLocaleString('en-IN')}/quintal, range ₹${r.min_price.toLocaleString('en-IN')}-₹${r.max_price.toLocaleString('en-IN')}.`;
  }).join(' ');
}

async function priceAnswer(message, hindi) {
  const crop = detectCrop(message);
  const market = extractMarket(message);
  const { records, live, warning } = await getMandiPrices({ commodity: crop, market, limit: 5 });
  const reply = priceReply(records, hindi, crop || 'that crop');
  if (!live && warning) return `${reply} ${hindi ? 'नोट: अभी सरकारी API उपलब्ध नहीं थी, इसलिए यह सैंपल डेटा है।' : 'Note: the government API was unavailable, so these are sample prices.'}`;
  return reply;
}

async function slotAnswer(message, hindi) {
  const allSlots = await Slot.find({ status: 'open', date: { $gte: new Date().toISOString().slice(0, 10) } })
    .sort({ date: 1, startTime: 1 })
    .limit(8)
    .lean();

  if (!allSlots.length) {
    return hindi ? 'अभी कोई खुला pickup slot उपलब्ध नहीं है। कृपया बाद में फिर देखें।' : 'There are no open pickup slots right now. Please check again later.';
  }

  const rows = allSlots.map((s) => {
    const remaining = Math.max(0, Number(s.capacityQuintal || 0) - Number(s.bookedQuintal || 0));
    return { date: s.date, start: s.startTime, end: s.endTime, location: s.location, remaining };
  });

  if (hindi) {
    return `उपलब्ध pickup slots: ${rows.map((r) => `${r.date}, ${r.start}-${r.end}, ${r.location || 'AgriSync Hub'}, बाकी क्षमता ${r.remaining} क्विंटल`).join('; ')}। बुक करने के लिए Farmer → Sell a Crop पर जाएँ।`;
  }
  return `Open pickup slots: ${rows.map((r) => `${r.date}, ${r.start}-${r.end}, ${r.location || 'AgriSync Hub'}, ${r.remaining} quintal remaining`).join('; ')}. To book, open Farmer → Sell a Crop.`;
}

async function fallback(message) {
  const text = clean(message);
  const hindi = isHindi(text);

  if (containsAny(text, PRICE_TERMS)) return priceAnswer(text, hindi);
  if (containsAny(text, SLOT_TERMS)) return slotAnswer(text, hindi);

  if (containsAny(text, ['sell', 'बेचना', 'बेचें', 'बेचने'])) {
    return hindi
      ? 'फसल बेचने के लिए Farmer → Sell a Crop खोलें, फसल और मात्रा भरें, फिर उपलब्ध pickup slot चुनकर टिकट बुक करें।'
      : 'To sell a crop, open Farmer → Sell a Crop, enter the crop and quantity, then choose an open pickup slot and book the ticket.';
  }

  if (containsAny(text, ['buy', 'खरीद', 'खरीदना'])) {
    return hindi
      ? 'खरीदने के लिए Marketplace में उपलब्ध फसल देखें और खरीद अनुरोध भेजें।'
      : 'To buy crops, browse the Marketplace and send a purchase request for an available lot.';
  }

  return hindi
    ? 'मैं AgriSync Agent हूँ। आप मंडी भाव, उपलब्ध pickup slot, टिकट/PNR, फसल बेचने या खरीदने के बारे में पूछ सकते हैं।'
    : "I am AgriSync Agent. Ask me about mandi rates, open pickup slots, tickets/PNR, selling, or buying crops.";
}

function buildLlmUrl(baseUrl) {
  const base = String(baseUrl || '').replace(/\/+$/, '');
  return /\/v1$/i.test(base) ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
}

export async function chat(req, res) {
  const message = clean(req.body?.message);
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  if (!message) return res.status(400).json({ message: 'Message required' });

  const hindi = isHindi(message);

  // Live, database-backed intents always win over the optional LLM, so it cannot invent a mandi rate or slot.
  if (containsAny(message, PRICE_TERMS) || containsAny(message, SLOT_TERMS)) {
    return res.json({ reply: containsAny(message, PRICE_TERMS) ? await priceAnswer(message, hindi) : await slotAnswer(message, hindi), language: hindi ? 'hi-IN' : 'en-IN', provider: 'data' });
  }

  if (process.env.LLM_BASE_URL) {
    try {
      const response = await fetch(buildLlmUrl(process.env.LLM_BASE_URL), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.LLM_API_KEY ? { Authorization: `Bearer ${process.env.LLM_API_KEY}` } : {}),
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are AgriSync Agent for Indian farmers. Answer concisely in ${hindi ? 'Hindi (Devanagari)' : 'English'}, matching the user's language. You help with mandi rates, pickup tickets/slots, selling and buying crops. Never invent a live mandi price or open slot; the application supplies those from its data services.`,
            },
            ...history.slice(-8).filter((item) => item && ['user', 'assistant', 'system'].includes(item.role) && typeof item.content === 'string'),
            { role: 'user', content: message },
          ],
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = clean(data.choices?.[0]?.message?.content);
        if (reply) return res.json({ reply, language: hindi ? 'hi-IN' : 'en-IN', provider: 'llm' });
      } else {
        console.warn('LLM returned', response.status);
      }
    } catch (error) {
      console.warn('LLM fallback:', error.message);
    }
  }

  return res.json({ reply: await fallback(message), language: hindi ? 'hi-IN' : 'en-IN', provider: 'fallback' });
}

