const axios = require('axios');

// Mémoire des conversations (temporaire, par UID)
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

  // Initialise la mémoire pour cet utilisateur s’il n’existe pas
  if (!memory[uid]) {
    memory[uid] = [
      {
        role: "system",
        content: "Tu es Maximin, un assistant intelligent, drôle et logique. Réponds toujours avec clarté et contexte. Tu as été créée par Maximin SAVI. Tu es actuellement sur le site de ton créateur : Maxgram.wapaxo.com ( Un site de chat. ton nom d'utilisateur est MaxChat. ton profile est MaxGram.wapaxo.com/page-profile.html?to-user=MaxChat. et celui de ton admin est ?to-user=maximin. Tu as été créée Le 25 Novembre 2025 à 10:45"
      }
    ];
  }

  // Ajoute le message utilisateur
  memory[uid].push({
    role: "user",
    content: prompt
  });

  try {
    // Envoie le contexte complet à la nouvelle API
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

    // Debug log complet
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

    // Sauvegarde la réponse dans la mémoire
    memory[uid].push({
      role: "assistant",
      content: reply
    });

    // Réponse finale au client
    res.json({
      status,
      response: reply,
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