const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Dossier pour stocker les mémoires
const MEMORY_DIR = path.join(__dirname, 'user_memory');

// Crée le dossier s'il n'existe pas
if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR);

function getMemoryFile(uid) {
  return path.join(MEMORY_DIR, `${uid}.json`);
}

// Charge la mémoire pour un utilisateur
function loadMemory(uid) {
  const file = getMemoryFile(uid);
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (err) {
      console.error(`Erreur chargement mémoire UID ${uid}:`, err);
    }
  }
  // Si pas de fichier, retourne mémoire initiale
  return [
    {
      role: "system",
      content: "Tu es MaxChat V2, un assistant intelligent, drôle et logique..."
    }
  ];
}

// Sauvegarde la mémoire pour un utilisateur
function saveMemory(uid, memory) {
  try {
    fs.writeFileSync(getMemoryFile(uid), JSON.stringify(memory, null, 2), 'utf8');
  } catch (err) {
    console.error(`Erreur sauvegarde mémoire UID ${uid}:`, err);
  }
}

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

  // Charge la mémoire existante ou initialise
  let memory = loadMemory(uid);

  // Ajoute le message utilisateur
  memory.push({ role: "user", content: prompt });

  try {
    const response = await axios.post(
      'https://api.deepenglish.com/api/gpt_open_ai/chatnew',
      {
        messages: memory,
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

    let reply = response.data?.success ? response.data.message : response.data?.message || "No response received.";
    let status = !!response.data?.success;

    // Ajoute la réponse de l'assistant dans la mémoire
    memory.push({ role: "assistant", content: reply });

    // Sauvegarde persistante
    saveMemory(uid, memory);

    res.json({ status, response: reply });

  } catch (error) {
    console.error('DeepEnglish API Error:', error.message);
    res.status(500).json({ status: false, error: error.message });
  }
}

module.exports = { meta, onStart };