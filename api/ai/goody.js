const axios = require('axios');

const meta = {
  name: 'Translate',
  path: '/goody?text=Bonjour&lang=en',
  method: 'get',
  category: 'translation'
};

async function onStart({ req, res }) {
  const { text, lang } = req.query;

  if (!text || !lang) {
    return res.status(400).json({
      error: 'The "text" and "lang" params are required',
      example: '/goody?text=Bonjour&lang=en'
    });
  }

  try {
    const response = await axios({
      method: 'POST',
      url: 'https://libretranslate.de/translate',
      headers: { 'Content-Type': 'application/json' },
      data: { q: text, source: 'auto', target: lang, format: 'text' }
    });

    console.log('LibreTranslate response:', response.data); // pour debug

    res.json({
      status: true,
      tans: response.data.translatedText || '',
      operator: 'Maximin'
    });

  } catch (error) {
    console.error('Translation API Error:', error.message);
    res.status(500).json({
      status: false,
      error: 'Failed to get translation.'
    });
  }
}

module.exports = { meta, onStart };