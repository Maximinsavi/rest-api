const axios = require('axios');

// Mémoire en RAM (par UID)
const memory = {};

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

  // Efface la mémoire RAM si "clear"
  if (prompt.toLowerCase() === 'clear') {
    delete memory[uid];
    return res.json({ status: true, message: "Chat memory cleared!" });
  }

  // Initialise la mémoire si nécessaire
  if (!memory[uid]) {
    memory[uid] = [
      {
        role: "system",
        content: "Tu es Grok, un assistant intelligent, drôle et logique. Réponds toujours avec clarté et contexte."
      }
    ];
  }

  // Ajoute le message utilisateur
  const userMessage = { role: "user", content: prompt };
  memory[uid].push(userMessage);

  try {
    // 🔥 Envoi à DeepEnglish
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

    console.log("Réponse DeepEnglish API:", response.data);

    let reply = "No response received.";
    let status = false;

    if (response.data && response.data.success) {
      reply = response.data.message || reply;
      status = true;
    } else if (response.data.message) {
      reply = response.data.message;
      status = false;
    }

    // Sauvegarde la réponse dans la mémoire RAM
    memory[uid].push({ role: "assistant", content: reply });

    // Réponse finale
    res.json({
      status,
      response: reply
    });

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