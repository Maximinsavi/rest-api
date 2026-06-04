const Groq = require('groq-sdk');
const fs = require('fs');

const memory = {};


// 🔥 AUTO LOAD MEMORY
function loadAllMemory() {

  try {

    const files = fs.readdirSync('./');

    files.forEach(file => {

      if (file.startsWith('memory_ai_') && file.endsWith('.json')) {

        const uid =
        file.replace('memory_ai_', '')
        .replace('.json','');


        memory[uid] =
        JSON.parse(
          fs.readFileSync(`./${file}`, 'utf8')
        );


        console.log(`Mémoire chargée: ${uid}`);

      }

    });


  } catch(e) {

    console.log(e.message);

  }

}


loadAllMemory();




// 🔥 SAVE MEMORY
function saveMemory(uid) {

  fs.writeFile(

    `./memory_ai_${uid}.json`,

    JSON.stringify(
      memory[uid],
      null,
      2
    ),

    'utf8',

    err => {

      if(err)
      console.log(err.message);

    }

  );

}



function loadMemory(uid) {


  try {


    const file =
    `./memory_ai_${uid}.json`;


    if(fs.existsSync(file)) {

      return JSON.parse(
        fs.readFileSync(file,'utf8')
      );

    }


  } catch(e){}


  return null;

}




const meta = {

name:'ai',

path:'/ai?prompt=&uid=',

method:'get',

category:'ai'

};




async function onStart({req,res}) {


const {prompt,uid}=req.query;



if(!prompt || !uid){

return res.status(400).json({

error:'Both prompt and uid parameters are required'

});

}




if(!memory[uid]){


memory[uid]=
loadMemory(uid) || [

{

role:"system",

content:
"Tu es MaxChat, une IA intelligente, drôle et logique."

}

];


}




memory[uid].push({

role:"user",

content:prompt

});





try {



const groq =
new Groq({

apiKey:
"MET_TA_CLE_GROQ_ICI"

});





const response =
await groq.chat.completions.create({


messages:memory[uid],


model:
"llama-3.3-70b-versatile",


temperature:0.9


});





let reply =
response.choices[0].message.content;





memory[uid].push({

role:"assistant",

content:reply

});





saveMemory(uid);





res.json({

status:true,

response:reply

});




} catch(error){



console.log(
"Groq Error:",
error.message
);



res.status(500).json({

status:false,

error:error.message

});


}



}




module.exports={
meta,
onStart
};