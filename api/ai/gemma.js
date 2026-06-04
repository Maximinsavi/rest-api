const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Mémoire des conversations
const memory = {};

// 🔥 AUTO LOAD MEMORY AU DEMARRAGE
function loadAllMemory() {
  try {
    const files = fs.readdirSync('./');

    files.forEach(file => {
      if (file.startsWith('memory_') && file.endsWith('.json')) {
        const uid = file.replace('memory_', '').replace('.json', '');

        try {
          memory[uid] = JSON.parse(
            fs.readFileSync(`./${file}`, 'utf8')
          );

          console.log(`Mémoire chargée: ${uid}`);
        } catch (e) {
          console.error(`Erreur lecture ${uid}:`, e.message);
        }
      }
    });

  } catch (e) {
    console.error('Erreur chargement mémoires:', e.message);
  }
}

loadAllMemory();


// 🔥 SAVE MEMORY
function saveMemory(uid) {
  try {
    fs.writeFile(
      `./memory_${uid}.json`,
      JSON.stringify(memory[uid], null, 2),
      'utf8',
      err => {
        if (err) {
          console.error('Erreur sauvegarde mémoire:', err.message);
        }
      }
    );
  } catch (e) {
    console.error('Erreur sauvegarde:', e.message);
  }
}


// 🔥 LOAD ONE MEMORY
function loadMemory(uid) {
  try {
    const file = `./memory_${uid}.json`;

    if (fs.existsSync(file)) {
      return JSON.parse(
        fs.readFileSync(file, 'utf8')
      );
    }

  } catch (e) {
    console.error('Erreur chargement mémoire:', e.message);
  }

  return null;
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


  // Initialise mémoire utilisateur
  if (!memory[uid]) {

    memory[uid] = loadMemory(uid) || [

      {
        role: "system",
        content:
        "Tu es MaxChat V2, un assistant intelligent, drôle et logique, qui répond toujours avec clarté et contexte, créé par ton développeur personnel Maximin SAVI, dont les informations sont : Nom complet : Maximin SAVI, Numéro personnel (WhatsApp inclus) : +2290191182044, Date de naissance : 23/02/2007, Lieu de naissance : KPOMASSE (Benin), Localisation actuelle : Cotonou, Statut : Étudiant en première année d’université, Domaine d’étude : Allemand, Passions : Technologie, IA, langues, communication, développement web ; tu es hébergé sur le site maxgram.wapaxo.com, ton nom est MaxChat."
      }

    ];

  }



  // Ajoute message utilisateur
  memory[uid].push({
    role: "user",
    content: prompt
  });


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
          'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',

          'Content-Type':
          'application/json',

          'Authorization':
          'Bearer UFkOfJaclj61OxoD7MnQknU1S2XwNdXMuSZA+EZGLkc='
        }
      }

    );



    console.log(
      "Réponse DeepEnglish API:",
      response.data
    );



    let reply = "No response received.";
    let status = false;



    if (response.data && response.data.success) {

      reply =
      response.data.message || reply;

      status = true;

    } 

    else if (response.data.message) {

      reply =
      response.data.message;

    }



    // Sauvegarde réponse IA
    memory[uid].push({

      role: "assistant",
      content: reply

    });



    // 🔥 Sauvegarde permanente
    saveMemory(uid);



    res.json({

      status,

      response: reply

    });



  } catch (error) {


    console.error(
      'DeepEnglish API Error:',
      {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      }
    );


    res.status(500).json({

      status: false,

      error:
      error.response?.data ||
      error.message

    });

  }

}



module.exports = {
  meta,
  onStart
};