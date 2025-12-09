const axios = require('axios');
const fs = require('fs');

// Mémoire des traductions par UID
const memory = {};

function saveMemory(uid) {
  try {
    fs.writeFileSync(`./memory_tradu_${uid}.json`, JSON.stringify(memory[uid], null, 2), 'utf8');
  } catch (e) {
    console.error('Erreur sauvegarde mémoire:', e.message);
  }
}

function loadMemory(uid) {
  try {
    const file = `./memory_tradu_${uid}.json`;
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.error('Erreur chargement mémoire:', e.message);
  }
  return null;
}

// Endpoint /traduire
async function onTraduire({ req, res }) {
  const { text, lang, uid } = req.query;

  if (!text || !lang || !uid) {
    return res.status(400).json({
      error: "Les paramètres 'text', 'lang' et 'uid' sont requis",
      example: "/traduire?text=Bonjour&lang=en&uid=123"
    });
  }

  // Initialisation mémoire pour cet UID
  if (!memory[uid]) {
    const saved = loadMemory(uid);
    memory[uid] = saved || [];
  }

  // Ajout du texte original à la mémoire
  memory[uid].push({ role: 'user', content: text });

  try {
    // Appel réel à LibreTranslate
    const response = await axios.post('https://libretranslate.de/translate', {
      q: text,
      source: 'auto', // détecte automatiquement la langue
      target: lang,
      format: 'text'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const traduction = response.data.translatedText;

    // Ajout de la traduction dans la mémoire
    memory[uid].push({ role: 'assistant', content: traduction });
    saveMemory(uid);

    // Retour au client
    res.json({
      status: true,
      translation: traduction
    });

  } catch (err) {
    console.error("Erreur traduction:", err.message);
    res.status(500).json({ status: false, error: err.message });
  }
}

module.exports = { onTraduire };