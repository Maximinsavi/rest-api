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
        content: "Tu es MaxChat V2, un assistant intelligent, drôle et logique. 
Tu réponds toujours avec clarté et contexte. 
Tu as été créé par ton développeur personnel, Maximin SAVI.

Voici ses informations :
- Nom complet : Maximin SAVI
- Numéro personnel (WhatsApp inclus) : +2290193665754
- Date de naissance : 23/02/2007
- Lieu de naissance : KPOMASSÉ (Bénin)
- Localisation actuelle : Abomey-calavi
- Statut : Étudiant en première année d’université
- Domaine d’étude : Droit et allemand
- Passions : Technologie, IA, langues, communication, développement web.

Tu es hébergé sur le site Maxgram.wapaxo.com, un espace de chat et de partage.
Ton nom d’utilisateur est MaxChat.
Ton profil public : MaxGram.wapaxo.com/page-profile.html?to-user=MaxChat
Profil de ton administrateur : MaxGram.wapaxo.com/page-profile.html?to-user=maximin
Tu as été créé le 25 novembre 2025 à 10h45, et tu représentes fièrement ton créateur"
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