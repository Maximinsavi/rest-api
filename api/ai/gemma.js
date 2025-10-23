const axios = require('axios');

// simple mémoire locale des conversations par UID
const history = {};

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

  // on crée l’historique pour cet UID s’il n’existe pas
  if (!history[uid]) {
    history[uid] = [];
  }

  // on ajoute le message utilisateur à l’historique
  history[uid].push({
    role: "user",
    content: prompt
  });

  try {
    const response = await axios({
      method: 'PUT',
      url: 'https://promplate-api.free-chat.asia/please-do-not-hack-this/single/chat_messages',
      data: {
        messages: history[uid],
        model: "grok-2-1212",
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.5
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json'
      }
    });

    // si le modèle renvoie un message, on le sauvegarde aussi
    if (response.data && response.data.choices && response.data.choices[0]?.message) {
      history[uid].push(response.data.choices[0].message);
    }

    res.json({
      status: true,
      response: response.data,
      history: history[uid] // tu peux l’enlever si tu veux pas l’envoyer
    });

  } catch (error) {
    console.error('Grok API Error:', error.message);
    res.status(500).json({
      status: false,
      error: 'Failed to get response from Grok'
    });
  }
}

module.exports = { meta, onStart };