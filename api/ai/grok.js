const fs = require('fs');
const path = require('path');
const axios = require('axios');

const meta = {
  name: 'Grok',
  path: '/grok?query=hi',
  method: 'get',
  category: 'ai'
};

const saveDir = path.join(__dirname, 'grok_history');

async function onStart({ req, res }) {
  const { query, uid } = req.query;

  if (!query) {
    return res.status(400).json({
      error: 'The "query" param is required'
    });
  }

  try {
    const response = await axios({
      method: 'PUT',
      url: 'https://promplate-api.free-chat.asia/please-do-not-hack-this/single/chat_messages',
      data: {
        messages: [{
          role: "user",
          content: query
        }],
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

    // --- Comportement identique : la réponse JSON reste inchangée ---
    res.json({
      status: true,
      response: response.data
    });

    // --- Sauvegarde optionnelle : uniquement si uid est fourni ---
    if (uid) {
      if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);
      const filePath = path.join(saveDir, `${uid}.json`);
      const history = fs.existsSync(filePath)
        ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        : [];

      history.push({
        query,
        response: response.data,
        date: new Date().toISOString()
      });

      fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
      // NOTE: on n'envoie rien de plus au client pour ne pas changer le format de sortie
    }

  } catch (error) {
    console.error('XGrok API Error:', error.message);
    res.status(500).json({
      status: false,
      error: 'Failed to get response.'
    });
  }
}

module.exports = { meta, onStart };