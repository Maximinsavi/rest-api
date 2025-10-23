const axios = require('axios');

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

  try {
    const response = await axios({
      method: 'PUT',
      url: 'https://promplate-api.free-chat.asia/please-do-not-hack-this/single/chat_messages',
      data: {
        messages: [{
          role: "user",
          content: prompt
        }],
        model: "grok-2-1212", // 🔥 seule ligne modifiée
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.5
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json'
      }
    });

    res.json({
      status: true,
      response: response.data
    });

  } catch (error) {
    console.error('Gemma API Error:', error.message);
    res.status(500).json({
      status: false,
      error: 'Failed to get response from Grok' // juste le message
    });
  }
}

module.exports = { meta, onStart };