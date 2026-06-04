
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
    `./maxchat_${uid}.json`,
    JSON.stringify(memory[uid], null, 2),
    'utf8'
  );

}



function loadMemory(uid) {

  try {

    return JSON.parse(
      fs.readFileSync(`./maxchat_${uid}.json`, 'utf8')
    );

  } catch(e) {

    return null;

  }

}



async function createImage(prompt, res) {

  try {

    const image = await axios.get(

      'https://image.pollinations.ai/prompt/' +
      encodeURIComponent(prompt),

      {
        responseType:'arraybuffer'
      }

    );


    res.set(
      'Content-Type',
      'image/png'
    );


    return res.send(image.data);


  } catch(e) {

    return res.json({

      status:false,

      error:"Image failed"

    });

  }

}




async function onStart({req,res}) {


const {prompt, uid} = req.query;



if (!prompt || !uid) {

return res.status(400).json({

error:"prompt and uid required"

});

}




if (!memory[uid]) {

memory[uid] = loadMemory(uid) || [

{
role:"system",
content:
"Tu es MaxChat, un assistant intelligent. Si l'utilisateur demande une image, réponds IMAGE_REQUEST."
}

];

}




// Détection image

const imageWords = [

"crée une image",
"génère une image",
"fais moi une image",
"dessine",
"image de",
"photo de"

];


const wantsImage = imageWords.some(word =>

prompt.toLowerCase().includes(word)

);



if (wantsImage) {

return createImage(prompt, res);

}




memory[uid].push({

role:"user",
content:prompt

});




try {


const response = await axios.post(

'https://api.deepenglish.com/api/gpt_open_ai/chatnew',

{

messages: memory[uid],

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