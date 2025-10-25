const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Dossier mémoire persistante
const chatHistoryDir = 'groqllama70b';

// Mémoire temporaire en RAM (si besoin en plus du fichier)
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

  // Si "clear" → on efface tout
  if (prompt.toLowerCase() === 'clear') {
    clearChatHistory(uid);
    return res.json({ status: true, message: "Chat history cleared!" });
  }

  // Charger la mémoire persistante
  const chatHistory = loadChatHistory(uid);

  // Initialise la mémoire RAM si elle n’existe pas
  if (!memory[uid]) {
    memory[uid] = chatHistory.length ? chatHistory : [
      {
        role: "system",
        content: "Tu es Grok, un assistant intelligent, drôle et logique. Réponds toujours avec clarté et contexte."
      }
    ];
  }

  // Ajouter le message utilisateur
  const userMessage = { role: "user", content: prompt };
  memory[uid].push(userMessage);

  try {
    // ======== 🔥 Requête vers le bon site =========
    const response = await axios.post(
      'https://api.deepenglish.com/api/gpt_open_ai/chatnew',
      {
        messages: memory[uid],
        projectName: "wordpress",
        temperature: 0.9
      },
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Content-Type': 'application/json',
          'Authorization': 'Bearer UFkOfJaclj61OxoD7MnQknU1S2XwNdXMuSZA+EZGLkc='
        }
      }
    );
    // =============================================

    console.log("Réponse DeepEnglish API:", response.data);

    let reply = "No response received.";
    let status = false;

    if (response.data && response.data.success) {
      reply = response.data.message || reply;
      status = true;
    } else if (response.data.message) {
      reply = response.data.message;
      status = false;
    }

    // Ajouter la réponse dans la mémoire
    const botMessage = { role: "assistant", content: reply };
    memory[uid].push(botMessage);

    // Sauvegarder dans le fichier (persistant)
    appendToChatHistory(uid, [userMessage, botMessage]);

    // Réponse au client
    res.json({
      status,
      response: reply
    });

  } catch (error) {
    console.error('DeepEnglish API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    res.status(500).json({
      status: false,
      error: error.response?.data || error.message
    });
  }
}

// ======== 🔒 MÉMOIRE PERSISTANTE ========

function loadChatHistory(uid) {
  const file = path.join(chatHistoryDir, `memory_${uid}.json`);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function appendToChatHistory(uid, newEntries) {
  if (!fs.existsSync(chatHistoryDir)) fs.mkdirSync(chatHistoryDir);
  const file = path.join(chatHistoryDir, `memory_${uid}.json`);
  const history = loadChatHistory(uid);
  const updated = [...history, ...newEntries];
  const trimmed = updated.slice(-100); // limite à 100 messages
  fs.writeFileSync(file, JSON.stringify(trimmed, null, 2));
}

function clearChatHistory(uid) {
  const file = path.join(chatHistoryDir, `memory_${uid}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

module.exports = { meta, onStart };