const axios = require('axios');
const fs = require('fs');

const memory = {};

const meta = {
  name: 'MaxChat',
  path: '/maxchat?prompt=&uid=',
  method: 'get',
  category: 'ai'
};


function saveMemory(uid) {

  fs.writeFileSync(
    `./memory_${uid}.json`,
    JSON.stringify(memory[uid], null, 2),
    'utf8'
  );

}


function loadMemory(uid) {

  try {

    return JSON.parse(
      fs.readFileSync(`./memory_${uid}.json`, 'utf8')
    );

  } catch(e) {

    return null;

  }

}



async function onStart({ req, res }) {


  const { prompt, uid } = req.query;


  if (!prompt || !uid) {

    return res.status(400).json({
      error:"prompt et uid obligatoires"
    });

  }



  if (!memory[uid]) {

    memory[uid] = loadMemory(uid) || [

      {
        role:"system",
        content:
        "Tu es MaxChat. Tu aides l'utilisateur."
      }

    ];

  }




  const lower = prompt.toLowerCase();



  const imageRequest =
  lower.includes("image") ||
  lower.includes("dessine") ||
  lower.includes("crée") ||
  lower.includes("cree") ||
  lower.includes("génère") ||
  lower.includes("genere");




  if (imageRequest) {


    try {


      const imageUrl =
      "https://image.pollinations.ai/prompt/" +
      encodeURIComponent(prompt);



      return res.json({

        status:true,

        type:"image",

        image:imageUrl

      });



    } catch(e) {


      return res.json({

        status:false,

        error:"Image error"

      });

    }


  }





  memory[uid].push({

    role:"user",
    content:prompt

  });




  try {


    const response = await axios.post(

      'https://api.deepenglish.com/api/gpt_open_ai/chatnew',

      {

        messages:memory[uid],

        projectName:"wordpress",

        temperature:0.9

      },

      {

        headers:{

          'Content-Type':'application/json',

          'Authorization':
          'Bearer UFkOfJaclj61OxoD7MnQknU1S2XwNdXMuSZA+EZGLkc='

        }

      }

    );




    let reply =
    response.data.message ||
    "Pas de réponse";




    memory[uid].push({

      role:"assistant",
      content:reply

    });



    saveMemory(uid);




    res.json({

      status:true,

      type:"text",

      response:reply

    });



  } catch(e) {


    res.status(500).json({

      status:false,

      error:"AI error"

    });


  }


}



module.exports = {
meta,
onStart
};