const translate = require('@vitalets/google-translate-api');

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
    // Traduction via Google Translate gratuit
    const result = await translate(text, { to: lang });

    res.json({
      status: true,
      tans: result.text,   // le texte traduit
      operator: 'Maximin'
    });

  } catch (error) {
    console.error('Translation Error:', error.message);
    res.status(500).json({
      status: false,
      error: 'Failed to get translation.'
    });
  }
}

module.exports = { meta, onStart };