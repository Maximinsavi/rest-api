const axios = require('axios');

const meta = {
name: 'Grok',
path: '/grok?query=hi',
method: 'get',
category: 'ai'
};

async function onStart({ req, res }) {
const { query } = req.query;

if (!query) {
return res.status(400).json({
error: 'The "query" param is required'
});
}

try {
const response = await axios({
method: 'PUT',
url: 'https://promplate-api.free-chat.asia/please-do-not-hack-this/single/chat_messages',
data: {
messages: [{
role: "user",
content: query
}],
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

res.json({
status: true,
response: response.data
});

} catch (error) {
console.error('XGrok API Error:', error.message);
res.status(500).json({
status: false,
error: 'Failed to get response.'
});
}
}

module.exports = { meta, onStart };
