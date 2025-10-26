const axios = require('axios');

// Mémoire des conversations (temporaire, par UID)
const memory = {};

// Sauvegarde et chargement mémoire via le module fs interne (sans autre const)
import('fs').then(fs => {

  // Fonction de chargement
  function loadMemory(uid) {
    try {
      const file = `./memory_${uid}.json`;
      if (fs.existsSyncSync(file)) {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
      }
    } catch (e) { console.error("Erreur chargement mémoire:", e.message); }
    return [
      {
        role: "system",
        content: "Tu es MaxChat V2, un assistant intelligent, drôle et logique, créé par Maximin SAVI..."
      }
    ];
  }

  // Fonction de sauvegarde
  function saveMemory(uid) {
    try {
      fs.writeFileSync(`./memory_${uid}.json`, JSON.stringify(memory[uid], null, 2), 'utf8');
    } catch (e) { console.error("Erreur sauvegarde mémoire:", e.message); }
  }

  const meta = {
    name: 'gemma 2 9B it',
    path: '/gemma?prompt=&uid=',
    method: 'get',
    category: 'ai'
  };

  async function onStart({ req, res }) {
    const { prompt, uid } = req.query;

    if (!prompt || !uid) {
      return res.status(400).json({
        error: 'Both prompt and uid parameters are required',
        example: '/gemma?prompt=hello&uid=123'
      });
    }

    // Charge la mémoire depuis fichier si absente
    if (!memory[uid]) memory[uid] = loadMemory(uid);

    // Ajoute le message utilisateur
    memory[uid].push({ role: "user", content: prompt });

    try {
      const response = await axios.post(
        'https://api.deepenglish.com/api/gpt_open_ai/chatnew',
        {
          messages: memory[uid],
          projectName: "wordpress",
          temperature: 0.9
        },
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer UFkOfJaclj61OxoD7MnQknU1S2XwNdXMuSZA+EZGLkc='
          }
        }
      );

      let reply = "No response received.";
      let status = false;

      if (response.data && response.data.success) {
        reply = response.data.message || reply;
        status = true;
      } else if (response.data.message) {
        reply = response.data.message;
        status = false;
      }

      // Ajoute la réponse dans la mémoire
      memory[uid].push({ role: "assistant", content: reply });

      // Sauvegarde pour toujours (par UID)
      saveMemory(uid);

      // Réponse finale
      res.json({ status, response: reply });

    } catch (error) {
      console.error('DeepEnglish API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      res.status(500).json({
        status: false,
        error: error.response?.data || error.message
      });
    }
  }

  module.exports = { meta, onStart };
});