const fs = require('fs');
const path = require('path');
const axios = require('axios');


const chatHistoryDir = 'groqllama70b';


if (!fs.existsSync(chatHistoryDir)) {
  fs.mkdirSync(chatHistoryDir);
}



exports.config = {

  name: "ai",

  version: "2.0.0",

  author: "Maximin",

  description:
  "MaxChat AI with permanent memory",

  method: 'get',

  link: [
    `/ai?q=Hello&id=12`
  ],

  category: "ai"

};





exports.initialize = async function({ req, res, font }) {



const query = req.query.q;

const userId = req.query.id;



if (!userId) {

return res.status(400).json({

status:false,

error:"Missing required parameter: id"

});

}



if (!query) {

return res.status(400).json({

status:false,

error:"No prompt provided"

});

}




if (query.toLowerCase() === "clear") {

clearChatHistory(userId);

return res.json({

status:true,

message:"Chat history cleared!"

});

}





const history = loadChatHistory(userId);



const messages = [


{

role:"system",

content:
`Your name is MaxChat. 
You are an intelligent assistant created by Maximin SAVI.
Answer clearly and naturally.`

},


...history,


{

role:"user",

content:query

}

];






try {



const response = await axios.post(


"https://api.deepenglish.com/api/gpt_open_ai/chatnew",


{


messages,


projectName:"wordpress",


temperature:0.9


},



{


headers:{


"User-Agent":
"Mozilla/5.0",


"Content-Type":
"application/json",


"Authorization":
"Bearer MET_TA_CLE_ICI"


}


}



);






let answer =
"No response received.";




if(response.data?.success){

answer =
response.data.message || answer;

}


else if(response.data?.message){

answer =
response.data.message;

}







// éviter doublon

const oldHistory =
loadChatHistory(userId);



const last =
oldHistory[oldHistory.length - 2];



if(!last || last.content !== query){



appendToChatHistory(

userId,


[


{

role:"user",

content:query

},


{

role:"assistant",

content:answer

}


]


);


}







res.json({

status:true,


reply:
font
?
answer.replace(
/\*\*(.*?)\*\*/g,
(_,t)=>font.bold(t)
)
:
answer,


author:
exports.config.author

});





} catch(error){



console.log(

"AI ERROR:",

error.response?.data ||
error.message

);




res.status(500).json({

status:false,

error:"Failed to fetch AI response."

});



}



};








function loadChatHistory(uid){


try{


const file =
path.join(
chatHistoryDir,
`memory_${uid}.json`
);



if(fs.existsSync(file)){


return JSON.parse(

fs.readFileSync(
file,
"utf8"
)

);


}



}catch(e){

console.log(e.message);

}



return [];

}








function appendToChatHistory(uid,newEntries){



const file =
path.join(
chatHistoryDir,
`memory_${uid}.json`
);



const old =
loadChatHistory(uid);



const updated =
[

...old,

...newEntries

];



// garde 100 messages

const limit =
updated.slice(-100);



fs.writeFileSync(

file,

JSON.stringify(
limit,
null,
2
),

"utf8"

);



}








function clearChatHistory(uid){



const file =
path.join(
chatHistoryDir,
`memory_${uid}.json`
);



if(fs.existsSync(file)){

fs.unlinkSync(file);

}



}