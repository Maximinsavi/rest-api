const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');


const memory = {};
const folder = './groq_ai';


if (!fs.existsSync(folder)) {
  fs.mkdirSync(folder);
}


const groq = new Groq({
  apiKey: 'MET_TA_CLE_GROQ_ICI'
});


const meta = {
  name: 'ai',
  path: '/ai?prompt=&uid=',
  method: 'get',
  category: 'ai'
};



function loadMemory(uid) {

  try {

    const file = path.join(
      folder,
      `memory_${uid}.json`
    );

    if (fs.existsSync(file)) {

      return JSON.parse(
        fs.readFileSync(file, 'utf8')
      );

    }

  } catch(e) {}

  return [
    {
      role:"system",
      content:"Tu es MaxChat, un assistant intelligent."
    }
  ];

}



function saveMemory(uid) {

  fs.writeFileSync(

    path.join(
      folder,
      `memory_${uid}.json`
    ),

    JSON.stringify(
      memory[uid],
      null,
      2
    )

  );

}



async function onStart({req,res}) {


  const { prompt, uid } = req.query;


  if (!prompt || !uid) {

    return res.status(400).json({
      error:"prompt et uid obligatoires"
    });

  }



  if (!memory[uid]) {

    memory[uid] = loadMemory(uid);

  }



  memory[uid].push({

    role:"user",
    content:prompt

  });



  try {


    const result =
    await groq.chat.completions.create({

      model:
      "llama-3.3-70b-versatile",

      messages:
      memory[uid],

      temperature:0.7

    });



    const reply =
    result.choices[0].message.content;



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

      error:e.message

    });


  }


}



module.exports = {
  meta,
  onStart
};