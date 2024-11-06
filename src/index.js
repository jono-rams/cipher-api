import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/serve-static';

const app = new Hono();
app.use(logger());

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type']
}));

const alphabetLC = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
const alphabetUC = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

function atbash(text, mode) {
  if (mode === 'decrypt') {
    return text.split('').map((char) => caeser(char, 1)).join('');
  } else {
    return text.split('').map((char) => caeser(char, 25)).join('');
  }
}

function caeser(char, shift) {
  if (alphabetLC.includes(char)) {
    return alphabetLC[(alphabetLC.indexOf(char) + shift) % 26];
  } else if (alphabetUC.includes(char)) {
    return alphabetUC[(alphabetUC.indexOf(char) + shift) % 26];
  }
}

function vigenere(text, key, mode) {
  let result = '';
  const textArray = text.split('');
  const keyArray = key.split('').map((char) => alphabetLC.indexOf(char));

  if (mode === 'decrypt') {
    keyArray = keyArray.map((char) => 26 - char);
  }

  const keySize = keyArray.length;
  let keyIndex = 0;

  result = textArray.map((char) => {
    const res = caeser(char, keyArray[keyIndex]);
    keyIndex = (keyIndex + 1) % keySize;
    return res;
  });

  return result.join('');
}

app.post('/api/caeser', async (c) => {
  const { text, shift, mode } = await c.req.json();

  // input validation
  if (!text || !shift || !mode) {
    return c.status(400).json({ error: 'Missing required fields: text, shift, and mode' });
  }

  if (mode !== 'encrypt' && mode !== 'decrypt') {
    return c.status(400).json({ error: 'Invalid mode (valid values: encrypt, decrypt)' });
  }

  if (typeof text !== 'string' || !/^[a-zA-Z]+$/.test(text)) {
    return c.status(400).json({ error: 'Invalid text input' });
  }

  if (typeof shift !== 'number' || shift < 1 || shift > 25) {
    return c.status(400).json({ error: 'Invalid shift input (valid values: 1-25)' });
  }

  if (mode === 'decrypt') {
    shift = 26 - shift;
  }

  const encryptedText = text.split('').map((char) => caeser(char, shift)).join('');

  return c.json({ encryptedText });
});

app.post('/api/vigenere', async (c) => {
  const { text, key, mode } = await c.req.json();

  // input validation
  if (!text || !key || !mode) {
    return c.status(400).json({ error: 'Missing required fields: text, key, and mode' });
  }

  if (mode !== 'encrypt' && mode !== 'decrypt') {
    return c.status(400).json({ error: 'Invalid mode (valid values: encrypt, decrypt)' });
  }

  if (typeof text !== 'string' || !/^[a-zA-Z]+$/.test(text)) {
    return c.status(400).json({ error: 'Invalid text input' });
  }

  if (typeof key !== 'string' || !/^[a-zA-Z]+$/.test(key)) {
    return c.status(400).json({ error: 'Invalid key input' });
  }

  const encryptedText = vigenere(text, key.toLowerCase(), mode);

  return c.json({ encryptedText });
});

app.post('/api/atbash', async (c) => {
  const { text, mode } = await c.req.json();

  // input validation
  if (!text || !mode) {
    return c.status(400).json({ error: 'Missing required fields: text and mode' });
  }

  if (mode !== 'encrypt' && mode !== 'decrypt') {
    return c.status(400).json({ error: 'Invalid mode (valid values: encrypt, decrypt)' });
  }

  if (typeof text !== 'string' || !/^[a-zA-Z]+$/.test(text)) {
    return c.status(400).json({ error: 'Invalid text input' });
  }

  const encryptedText = atbash(text);

  return c.json({ encryptedText });
});

app.get('*', async (c, next) => {
  try {
    await serveStatic({ path: './index.html' });
  } catch (err) {
    console.error('Error serving static file:', err);
    return c.status(500).text('Internal Server Error');
  }
})

export default app;
