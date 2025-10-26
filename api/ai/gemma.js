const axios = require('axios');

// Mémoire des conversations (temporaire, par UID)
const memory = {};

// 🔥 AUTO-SAVE START (ajout minimal)
const fs = require('fs');
function saveMemory(uid) {
  try {
    fs.writeFileSync(`./memory_${uid}.json`, JSON.stringify(memory[uid], null, 2), 'utf8');
  } catch (e) {
    console.error('Erreur sauvegarde mémoire:', e.message);
  }
}
function loadMemory(uid) {
  try {
    const file = `./memory_${uid}.json`;
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.error('Erreur chargement mémoire:', e.message);
  }
  return null;
}
// 🔥 AUTO-SAVE END

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
    const saved = loadMemory(uid); // 🔥 charge ancienne mémoire
    memory[uid] = saved || [
      {
        role: "system",
        content: "Tu es MaxChat V2, un assistant intelligent, drôle et logique, qui répond toujours avec clarté et contexte, créé par ton développeur personnel Maximin SAVI, dont les informations sont : Nom complet : Maximin SAVI, Numéro personnel (WhatsApp inclus) : +2290193665754, Date de naissance : 23/02/2007, Lieu de naissance : KPOMASSÉ (Bénin), Localisation actuelle : Abomey-Calavi, Statut : Étudiant en première année d’université, Domaine d’étude : Droit et allemand, Passions : Technologie, IA, langues, communication, développement web ; tu es hébergé sur le site Maxgram.wapaxo.com, un espace de chat et de partage, ton nom d’utilisateur est MaxChat, ton profil public est MaxGram.wapaxo.com/page-profile.html?to-user=MaxChat, le profil de ton administrateur est MaxGram.wapaxo.com/page-profile.html?to-user=maximin, et tu as été créé le 25 novembre 2025 à 10h45, représentant fièrement ton créateur."
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

    // 🔥 Sauvegarde persistante par UID
    saveMemory(uid);

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