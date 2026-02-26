import express from 'express';
import { storeChatMetadata, storeMessageDirect, getMessagesSince } from './db.js';
import { processGroupMessages } from './index.js'; 
import { ASSISTANT_NAME } from './config.js';

const app = express();
app.use(express.json());


app.post('/message', async (req, res) => {
  try {
    
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const chatJid = 'api@local';
    const now = new Date().toISOString();

    // 1️⃣ Asegurar que el chat exista
    storeChatMetadata(chatJid, now, 'API Chat', 'api', false);

    // 2️⃣ Insertar mensaje entrante
    storeMessageDirect({
      id: crypto.randomUUID(),
      chat_jid: chatJid,
      sender: 'api-user',
      sender_name: 'API User',
      content: message,
      timestamp: now,
      is_from_me: false,
      is_bot_message: false
    });

    // 3️⃣ Forzar procesamiento inmediato
    await processGroupMessages(chatJid);

    // 4️⃣ Buscar respuesta del bot
    const responses = getMessagesSince(
      chatJid,
      now,
      ASSISTANT_NAME
    ).filter(m => m.sender === ASSISTANT_NAME);

    const lastResponse = responses[responses.length - 1];

    res.json({
      response: lastResponse?.content || 'No response generated'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export function startApi() {
  app.listen(3000, () => {
    console.log('API running on http://localhost:3000');
  });
}