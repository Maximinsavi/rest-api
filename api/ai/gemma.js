const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const memory = {};
const SAVE_PATH = path.join(__dirname, 'saved');
if (!fs.existsSync(SAVE_PATH)) fs.mkdirSync(SAVE_PATH);

function encrypt(text, pass) {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(pass).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}
function decrypt(text, pass) {
  const [ivHex, data] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const key = crypto.createHash('sha256').update(pass).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
function save(uid, pass, data) {
  const file = path.join(SAVE_PATH, uid + '.dat');
  const enc = encrypt(JSON.stringify(data), pass);
  fs.writeFileSync(file, enc);
}
function load(uid, pass) {
  const file = path.join(SAVE_PATH, uid + '.dat');
  if (!fs.existsSync(file)) return null;
  try {
    const content = fs.readFileSync(file, 'utf8');
    return JSON.parse(decrypt(content, pass));
  } catch {
    return null;
  }
}

const meta = {
  name: 'gemma 2 9B it',
  path: '/gemma?prompt=&uid=&pass=',
  method: 'get',
  category: 'ai'
};

async function onStart({ req, res }) {
  const { prompt, uid, pass } = req.query;

  if (!prompt || !uid || !pass) {
    return res.status(400).json({
      error: 'prompt, uid et pass sont requis',
      example: '/gemma?prompt=hello&uid=123&pass=tonpass'
    });
  }

  if (!memory[uid]) {
    const loaded = load(uid, pass);
    memory[uid] = loaded || [
      {
        role: "system",
        content: "Tu es Grok, un assistant intelligent, drôle et logique. Réponds toujours avec clarté et contexte."
      }
    ];
  }

  memory[uid].push({
    role: "user",
    content: prompt
  });

  try {
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

    const reply = response.data?.choices?.[0]?.message;
    if (reply) memory[uid].push(reply);
    save(uid, pass, memory[uid]);

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