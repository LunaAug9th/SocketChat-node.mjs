import { WebSocketServer } from 'ws';

let multiChannel = true;
let modeLocked = false;
let serverActive = true;
let wss = null;
let storedKey = null;

let CHANNEL_COUNT = 25;
let lastMessages = [];
let channels = [];

export function setSingle() {
  if (modeLocked) {
    console.warn('❌ Cannot change mode after listen() has been called.');
    return;
  }
  multiChannel = false;
  console.log('✅ Set to single channel mode.');
}

export function setMultiChannel(count) {
  if (modeLocked) {
    console.warn('❌ Cannot change mode after listen() has been called.');
    return;
  }
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error('Channel count must be an integer greater than 0.');
  }
  CHANNEL_COUNT = count;
  multiChannel = true;
  console.log(`✅ Set to multi-channel mode (${CHANNEL_COUNT} channels).`);
}

export function listen(port = 3000, key) {
  if (!port || typeof port !== 'number') {
    throw new Error('A port number is required and must be a number.');
  }
  if (!key || typeof key !== 'string') {
    throw new Error('A base64 key is required.');
  }
  if (wss) return;

  storedKey = key;
  modeLocked = true;
  serverActive = true;

  lastMessages = Array(CHANNEL_COUNT).fill(null);
  channels = Array.from({ length: CHANNEL_COUNT }, () => new Set());

  wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    ws.on('message', (data) => {
      if (!serverActive) {
        return ws.send(JSON.stringify({
          typ: 'err',
          code: '110/1',
          msg: 'The server is currently not accepting requests.'
        }));
      }

      let parsed;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        return ws.send(JSON.stringify({
          typ: 'err',
          code: '100/2',
          msg: 'Invalid JSON format.'
        }));
      }

      const { typ, key: clientKey, cot, als } = parsed;

      if (!clientKey || !cot || !als) {
        return ws.send(JSON.stringify({
          typ: 'err',
          code: '100/2',
          msg: 'Missing required fields in request.'
        }));
      }

      if (typ !== 'sed') {
        return ws.send(JSON.stringify({
          typ: 'err',
          code: '100/3',
          msg: 'Unsupported request type.'
        }));
      }

      if (clientKey !== storedKey) {
        return ws.send(JSON.stringify({
          typ: 'err',
          code: '100/1',
          msg: 'Authentication key mismatch.'
        }));
      }

      try {
        const channelIndex = multiChannel
          ? Math.max(0, Math.min(CHANNEL_COUNT - 1, als.length % CHANNEL_COUNT))
          : 0;

        const message = {
          typ: 'rev',
          key: storedKey,
          cot,
          als
        };

        lastMessages[channelIndex] = message;

        for (const client of channels[channelIndex]) {
          if (client.readyState === 1) {
            client.send(JSON.stringify(message));
          }
        }

        channels[channelIndex].add(ws);
        console.log(`[SEND] (${channelIndex}) ${als}: ${cot}`);
      } catch (err) {
        console.error('[Internal Error]', err);
        return ws.send(JSON.stringify({
          typ: 'err',
          code: '110/2',
          msg: 'An error occurred during server processing.'
        }));
      }
    });

    ws.on('close', () => {
      for (const group of channels) {
        group.delete(ws);
      }
    });
  });

  console.log(`🟢 Server started: ws://localhost:${port} [${multiChannel ? 'Multi-channel' : 'Single-channel'}]`);
}

export function stop() {
  serverActive = false;
  console.log('⏸️ Server paused. Connections remain but requests are ignored.');
}

export function start() {
  serverActive = true;
  console.log('▶️ Server is accepting requests again.');
}

export function getMessage(channel = 1) {
  const index = multiChannel ? (channel - 1) : 0;
  if (index < 0 || index >= CHANNEL_COUNT) return null;

  const original = lastMessages[index];
  if (!original) return null;

  return {
    als: original.als,
    msg: original.cot
  };
}

export function sendMessage(channel = 1, alias, content) {
  const index = multiChannel ? (channel - 1) : 0;
  if (index < 0 || index >= CHANNEL_COUNT) throw new Error('Invalid channel number.');

  const message = {
    typ: 'rev',
    key: storedKey,
    cot: content,
    als: alias
  };

  lastMessages[index] = message;

  for (const client of channels[index]) {
    if (client.readyState === 1) {
      client.send(JSON.stringify(message));
    }
  }

  console.log(`[SEND] (${index}) ${alias}: ${content}`);
  return true;
}
