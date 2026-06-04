const axios = require('axios');
const fs = require('fs');

const memory = {};


// Charger toutes les mémoires au démarrage
try {

  fs.readdirSync('./').forEach(file => {

    if (file.startsWith('memory_grok_') && file.endsWith('.json')) {

      const uid = file
      .replace('memory_grok_', '')
      .replace('.json', '');

      memory[uid] = JSON.parse(
        fs.readFileSync('./' + file, 'utf8')
      );

      console.log('Mémoire Grok chargée:', uid);

    }

  });

} catch(e) {}



function saveMemory(uid) {

  try {

    fs.writeFileSync(

      `./memory_grok_${uid}.json`,

      JSON.stringify(memory[uid], null, 2),

      'utf8'

    );

  } catch(e) {

    console.log(
      "Erreur sauvegarde:",
      e.message
    );

  }

}



const meta = {

  name: 'Grok',

  path: '/grok?query=hi&uid=123',

  method: 'get',

  category: 'ai'

};



async function onStart({ req, res }) {


  const { query, uid } = req.query;



  if (!query || !uid) {

    return res.status(400).json({

      error:
      'query and uid are required'

    });

  }



  // Créer mémoire utilisateur

  if (!memory[uid]) {

    memory[uid] = [

      {

        role: "system",

        content:
        "Tu es Grok, un assistant intelligent, drôle et logique."

      }

    ];

  }



  // Ajouter message utilisateur

  memory[uid].push({

    role: "user",

    content: query

  });



  try {


    let response;



    try {


      // Première API Grok

      response = await axios({

        method: 'PUT',

        url:
        'https://promplate-api.free-chat.asia/please-do-not-hack-this/single/chat_messages',

        data: {

          messages: memory[uid],

          model: "grok-2-1212",

          temperature: 0.7

        },

        headers: {

          'Content-Type':
          'application/json',

          'User-Agent':
          'Mozilla/5.0'

        },

        timeout: 15000

      });



    } catch(e) {


      // Fallback DeepEnglish

      response = await axios.post(

        'https://api.deepenglish.com/api/gpt_open_ai/chatnew',

        {

          messages: memory[uid],

          projectName: "wordpress",

          temperature: 0.9

        },

        {

          headers: {

            'Content-Type':
            'application/json',

            'Authorization':
            'Bearer UFkOfJaclj61OxoD7MnQknU1S2XwNdXMuSZA+EZGLkc='

          }

        }

      );

    }



    let reply =

    response.data.message ||

    response.data.choices?.[0]?.message?.content ||

    response.data.response ||

    "Pas de réponse";




    // Ajouter réponse IA

    memory[uid].push({

      role: "assistant",

      content: reply

    });



    // Sauvegarde permanente

    saveMemory(uid);



    res.json({

      status: true,

      uid,

      response: reply

    });



  } catch(error) {


    console.error(

      error.response?.data ||
      error.message

    );


    res.status(500).json({

      status:false,

      error:"AI unavailable"

    });

  }


}



module.exports = {

  meta,

  onStart

};