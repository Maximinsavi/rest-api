// gemma-server.js
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// fichier où on stocke les infos utilisateurs (hash de pass)
// structure: { "<uid>": { passHash: "<bcrypt-hash>" } }
const USERS_FILE = path.join(DATA_DIR, 'users.json');
function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '{}'); }
  catch { return {}; }
}
function writeUsers(obj) { fs.writeFileSync(USERS_FILE, JSON.stringify(obj, null, 2)); }

// --- crypto helpers (AES-256-GCM) ---
function deriveKey(pass, salt) {
  // returns a 32-byte key buffer derived with pbkdf2
  return crypto.pbkdf2Sync(pass, salt, 200000, 32, 'sha512');
}
function encryptJSON(obj, pass) {
  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
  const salt = crypto.randomBytes(16); // for key derivation
  const iv = crypto.randomBytes(12);   // GCM recommended 12 bytes
  const key = deriveKey(pass, salt);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // store salt, iv, tag, ciphertext (base64)
  return Buffer.from(JSON.stringify({
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: ciphertext.toString('base64')
  }), 'utf8');
}
function decryptJSON(buffer, pass) {
  const envelope = JSON.parse(buffer.toString('utf8'));
  const salt = Buffer.from(envelope.salt, 'base64');
  const iv = Buffer.from(envelope.iv, 'base64');
  const tag = Buffer.from(envelope.tag, 'base64');
  const data = Buffer.from(envelope.data, 'base64');
  const key = deriveKey(pass, salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(plain.toString('utf8'));
}

// --- persistence helpers ---
function storagePathForUID(uid) {
  return path.join(DATA_DIR, `${encodeURIComponent(uid)}.json.enc`);
}
function saveMemoryEncrypted(uid, memoryObj, pass) {
  const enc = encryptJSON(memoryObj, pass);
  fs.writeFileSync(storagePathForUID(uid), enc);
}
function loadMemoryEncrypted(uid, pass) {
  const p = storagePathForUID(uid);
  if (!fs.existsSync(p)) return null;
  const buffer = fs.readFileSync(p);
  return decryptJSON(buffer, pass);
}

// --- API meta (comme tu avais) ---
const meta = {
  name: 'gemma 2 9B it',
  path: '/gemma?prompt=&uid=&pass=',
  method: 'get',
  category: 'ai'
};

// Endpoints
app.get('/gemma/create_pass', async (req, res) => {
  // Crée / définit la passphrase pour un uid.
  // usage: /gemma/create_pass?uid=123&pass=monSecret
  const { uid, pass } = req.query;
  if (!uid || !pass) return res.status(400).json({ error: 'uid and pass required' });

  const users = readUsers();
  if (users[uid] && users[uid].passHash) {
    return res.status(400).json({ error: 'Pass already set for this uid' });
  }
  const passHash = await bcrypt.hash(pass, 12);
  users[uid] = { passHash };
  writeUsers(users);

  // If there is an existing plain-memory file (non chiffré), we can encrypt it now
  // (optional) — here on crée un fichier chiffré vide si rien n'existe.
  const initial = [
    {
      role: "system",
      content: "Tu es Grok, un assistant intelligent, drôle et logique. Réponds toujours avec clarté et contexte."
    }
  ];
  saveMemoryEncrypted(uid, initial, pass);

  res.json({ status: true, message: 'Pass created and storage initialized (encrypted).' });
});

app.get('/gemma', async (req, res) => {
  // usage: /gemma?prompt=hello&uid=123&pass=monSecret
  const { prompt, uid, pass } = req.query;
  if (!prompt || !uid) return res.status(400).json({
    error: 'Both prompt and uid parameters are required',
    example: '/gemma?prompt=hello&uid=123&pass=OPTIONAL'
  });

  // charge users file, vérifie si un pass est requis
  const users = readUsers();
  const userEntry = users[uid];

  let memory;
  if (userEntry && userEntry.passHash) {
    // pass must be provided and valid
    if (!pass) return res.status(401).json({ error: 'Pass required for this uid' });
    const ok = await bcrypt.compare(pass, userEntry.passHash);
    if (!ok) return res.status(403).json({ error: 'Invalid pass' });

    // load encrypted memory; if none exist, init
    try {
      const loaded = loadMemoryEncrypted(uid, pass);
      memory = loaded || [
        { role: "system", content: "Tu es Grok, un assistant intelligent, drôle et logique. Réponds toujours avec clarté et contexte." }
      ];
    } catch (e) {
      console.error('Decrypt error', e);
      return res.status(500).json({ status: false, error: 'Failed to decrypt memory. Wrong pass or corrupted storage.' });
    }
  } else {
    // pas de pass défini : on utilise un fichier plain JSON non chiffré pour compatibilité
    const p = storagePathForUID(uid);
    if (fs.existsSync(p)) {
      // si fichier chiffré existe mais pas d'entrée user => on refuse (sécurité)
      return res.status(500).json({ error: 'No pass configured but encrypted file exists. Create pass first.' });
    }
    // fallback en mémoire (non chiffré) : stocker dans users simple JSON
    const plainPath = path.join(DATA_DIR, `${encodeURIComponent(uid)}.json`);
    if (fs.existsSync(plainPath)) {
      memory = JSON.parse(fs.readFileSync(plainPath, 'utf8'));
    } else {
      memory = [
        { role: "system", content: "Tu es Grok, un assistant intelligent, drôle et logique. Réponds toujours avec clarté et contexte." }
      ];
    }
  }

  // push user message
  memory.push({ role: 'user', content: prompt });

  try {
    // send to external API (comme avant)
    const response = await axios({
      method: 'PUT',
      url: 'https://promplate-api.free-chat.asia/please-do-not-hack-this/single/chat_messages',
      data: {
        messages: memory,
        model: "grok-2-1212",
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.5
      },
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/json'
      }
    });

    const reply = response.data?.choices?.[0]?.message;
    if (reply) {
      memory.push(reply);
    }

    // sauvegarde persistante
    if (userEntry && userEntry.passHash) {
      // encrypted save (requiert pass)
      saveMemoryEncrypted(uid, memory, pass);
    } else {
      // sauvegarde plain JSON si pas de pass (compatibilité)
      const plainPath = path.join(DATA_DIR, `${encodeURIComponent(uid)}.json`);
      fs.writeFileSync(plainPath, JSON.stringify(memory, null, 2));
    }

    res.json({ status: true, response: reply || response.data });
  } catch (error) {
    console.error('Grok API Error:', error?.message || error);
    res.status(500).json({ status: false, error: 'Failed to get response from Grok' });
  }
});

// (optionnel) endpoint pour vérifier si uid a pass configuré
app.get('/gemma/has_pass', (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: 'uid required' });
  const users = readUsers();
  res.json({ uid, hasPass: !!(users[uid] && users[uid].passHash) });
});

// démarrage
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Gemma server listening on ${PORT}`));

module.exports = { meta };