const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');


const chatHistoryDir = 'groqai';


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


const systemPrompt = `
Tu es ClarenceAi, un assistant intelligent.
Tu aides les utilisateurs avec leurs questions et tâches.
`;



exports.config = {

  name:'ai',

  author:'Clarence',

  method:'get',

  category:'ai',

  description:'AI with Llama 70B memory',

  link:['/ai?prompt=hi&id=12']

};



exports.initialize = async function({req,res}) {


try {


const prompt = req.query.prompt;
const userId = req.query.id;



if (!userId) {

return res.status(400).json({
error:"id required"
});

}



if (!prompt) {

return res.status(400).json({
error:"prompt required"
});

}



if (prompt === "clear") {

clearChatHistory(userId);

return res.json({
response:"History cleared"
});

}



const history = loadChatHistory(userId);



const messages = [

{
role:"system",
content:systemPrompt
},

...history,

{
role:"user",
content:prompt
}

];



const completion = await groq.chat.completions.create({

model:"llama-3.3-70b-versatile",

messages,

temperature:0.7,

max_tokens:8192

});



const answer =
completion.choices[0].message.content;



saveChatHistory(userId,[

...history,

{
role:"user",
content:prompt
},

{
role:"assistant",
content:answer
}

]);



res.json({

status:true,

response:answer

});



} catch(e) {


console.error(e);


res.status(500).json({

status:false,

error:e.message

});


}


};





function loadChatHistory(uid) {


try {


if (!fs.existsSync(chatHistoryDir)) {

fs.mkdirSync(chatHistoryDir);

}



const file =
path.join(
chatHistoryDir,
`memory_${uid}.json`
);



if (fs.existsSync(file)) {

return JSON.parse(
fs.readFileSync(file,'utf8')
);

}



return [];


} catch(e) {

return [];

}

}





function saveChatHistory(uid,data) {


const file =
path.join(
chatHistoryDir,
`memory_${uid}.json`
);



fs.writeFileSync(

file,

JSON.stringify(
data,
null,
2
),

'utf8'

);


}





function clearChatHistory(uid) {


const file =
path.join(
chatHistoryDir,
`memory_${uid}.json`
);



if (fs.existsSync(file)) {

fs.unlinkSync(file);

}


}