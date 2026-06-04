const axios = require('axios');
const fs = require('fs');
const path = require('path');

const memory = {};

const meta = {
  name: 'ai',
  path: '/ai?prompt=&uid=',
  method: 'get',
  category: 'ai'
};


function saveMemory(uid) {

  fs.writeFileSync(
    `./memory_ai_${uid}.json`,
    JSON.stringify(memory[uid], null, 2),
    'utf8'
  );

}


function loadMemory(uid) {

  try {

    return JSON.parse(
      fs.readFileSync(
        `./memory_ai_${uid}.json`,
        'utf8'
      )
    );

  } catch(e) {

    return [
      {
        role:"system",
        content:"Tu es MaxChat, une IA intelligente."
      }
    ];

  }

}



async function onStart({req,res}) {


const {prompt,uid}=req.query;



if(!prompt || !uid){

return res.status(400).json({

error:"prompt et uid obligatoires"

});

}



if(!memory[uid]) {

memory[uid]=loadMemory(uid);

}



memory[uid].push({

role:"user",

content:prompt

});



try {


const response = await axios.post(


"https://api.groq.com/openai/v1/chat/completions",


{

model:"llama-3.3-70b-versatile",

messages:memory[uid],

temperature:0.9

},


{

headers:{

"Authorization":
"Bearer MET_TA_CLE_GROQ_ICI",

"Content-Type":
"application/json"

}

}


);



const reply =
response.data.choices[0].message.content;




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


console.log(
e.response?.data || e.message
);


res.status(500).json({

status:false,

error:e.message

});


}


}



module.exports={
meta,
onStart
};