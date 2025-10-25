const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Dossier de stockage des historiques
const chatHistoryDir = 'groqllama70b';

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

  // Cas "clear" → efface la mémoire
  if (prompt.toLowerCase() === 'clear') {
    clearChatHistory(uid);
    return res.json({ status: true, message: "Chat history cleared!" });
  }

  // Charger l'historique
  const chatHistory = loadChatHistory(uid);

  // Ajouter le message utilisateur
  const userMessage = { role: "user", content: prompt };
  const systemPrompt = { 
    role: "system", 
    content: "Tu es Grok, un assistant logique, clair et un peu drôle. Réponds toujours avec précision." 
  };

  // Construire les messages pour l'API
  const messages = [systemPrompt, ...chatHistory, userMessage];

  try {
    // Appel à l’API DeepEnglish
    const response = await axios.post(
      'https://api.deepenglish.com/api/gpt_open_ai/chatnew',
      {
        messages,
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

    // Debug complet (dans ta console serveur)
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

    // Sauvegarder dans le fichier (mémoire persistante)
    appendToChatHistory(uid, [userMessage, { role: "assistant", content: reply }]);

    // Recharger après mise à jour pour afficher l’historique récent
    const updatedHistory = loadChatHistory(uid);
    const pairs = [];

    for (let i = 0; i < updatedHistory.length; i += 2) {
      const userMsg = updatedHistory[i];
      const botMsg = updatedHistory[i + 1];
      if (userMsg && botMsg && userMsg.role === "user" && botMsg.role === "assistant") {
        pairs.push({ question: userMsg.content, reponse: botMsg.content });
      }
    }

    const lastTen = pairs.slice(-10);
    const historyObject = {};
    for (let i = 0; i < lastTen.length; i++) {
      const num = i + 1;
      historyObject[`question${num}`] = lastTen[i].question;
      historyObject[`reponse${num}`] = lastTen[i].reponse;
    }

    // Réponse finale au client
    res.json({
      status,
      reply,
      author: "Maximin",
      history: [historyObject]
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

// ======== GESTION DE LA MÉMOIRE ========

function loadChatHistory(uid) {
  const file = path.join(chatHistoryDir, `memory_${uid}.json`);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(e);
    return [];
  }
}

function appendToChatHistory(uid, newEntries) {
  if (!fs.existsSync(chatHistoryDir)) fs.mkdirSync(chatHistoryDir);
  const file = path.join(chatHistoryDir, `memory_${uid}.json`);
  const history = loadChatHistory(uid);
  const updated = [...history, ...newEntries];

  // Limiter à 100 messages max
  const maxMessages = 100;
  const trimmed = updated.slice(-maxMessages);
  fs.writeFileSync(file, JSON.stringify(trimmed, null, 2));
}

function clearChatHistory(uid) {
  const file = path.join(chatHistoryDir, `memory_${uid}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

module.exports = { meta, onStart };