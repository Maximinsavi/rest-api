const axios = require('axios');

// Mémoire des conversations (temporaire, par UID)
const memory = {};

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
memory[uid] = [
{
role: "system",
content: "Tu es Grok, un assistant intelligent, drôle et logique. Réponds toujours avec clarté et contexte."
}
];
}

// Ajoute le message utilisateur
memory[uid].push({
role: "user",
content: prompt
});

try {
// Envoie TOUT le contexte à l’API
const response = await axios({
method: 'PUT',
url: 'https://promplate-api.free-chat.asia/please-do-not-hack-this/single/chat_messages',
data: {
messages: memory[uid],
model: "grok-2-1212",
temperature: 0.7,
presence_penalty: 0.6,
frequency_penalty: 0.5
},
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
'Content-Type': 'application/json'
}
});

// Récupère la réponse du modèle  
const reply = response.data?.choices?.[0]?.message;  

// Si Grok a répondu, on sauvegarde sa réponse aussi  
if (reply) {  
  memory[uid].push(reply);  
}  

// Réponse finale au client  
res.json({  
  status: true,  
  response: reply || response.data,  
});

} catch (error) {
console.error('Grok API Error:', error.message);
res.status(500).json({
status: false,
error: 'Failed to get response from Grok'
});
}
}

module.exports = { meta, onStart };