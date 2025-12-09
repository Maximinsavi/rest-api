const axios = require('axios');
const fs = require('fs');

const memory = {};

// 🔥 Auto-save functions
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

// Meta pour référence
const meta = {
  name: 'traduction',
  path: '/goody?text=&lang=&uid=',
  method: 'get',
  category: 'translation'
};

async function onTraduire({ req, res }) {
  const { text, lang, uid } = req.query;

  if (!text || !lang || !uid) {
    return res.status(400).json({
      error: "Les paramètres 'text', 'lang' et 'uid' sont requis",
      example: "/traduire?text=Bonjour&lang=en&uid=123"
    });
  }

  // Initialisation mémoire
  if (!memory[uid]) {
    const saved = loadMemory(uid);
    memory[uid] = saved || [];
  }

  // Ajout du texte utilisateur
  memory[uid].push({ role: 'user', content: text });

  try {
    // Appel réel à l'API LibreTranslate
    const response = await axios({
      method: 'post',
      url: 'https://libretranslate.de/translate',
      headers: { 'Content-Type': 'application/json' },
      data: {
        q: text,
        source: 'auto',
        target: lang,
        format: 'text'
      }
    });

    let traduction = "No response";
    if (response.data && response.data.translatedText) {
      traduction = response.data.translatedText;
    }

    // Ajout de la traduction à la mémoire
    memory[uid].push({ role: 'assistant', content: traduction });
    saveMemory(uid);

    // Réponse au client
    res.json({ status: true, translation: traduction });

  } catch (err) {
    console.error("Erreur traduction :", err.message);
    res.status(500).json({ status: false, error: err.message });
  }
}

module.exports = { meta, onTraduire };