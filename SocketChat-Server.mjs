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
    console.warn('❌ listen() 이후에는 모드를 변경할 수 없습니다.');
    return;
  }
  multiChannel = false;
  console.log('✅ 단일 채널 모드로 설정됨');
}

export function setMultiChannel(count) {
    if (modeLocked) {
      console.warn('❌ listen() 이후에는 모드를 변경할 수 없습니다.');
      return;
    }
    if (!Number.isInteger(count) || count <= 0) {
      throw new Error('채널 수는 1 이상의 정수여야 합니다.');
    }
    CHANNEL_COUNT = count;
    multiChannel = true;
    console.log(`✅ 멀티 채널 모드 (${CHANNEL_COUNT}채널)로 설정됨`);
  }

export function listen(port = 3000, key) {
  if (!port || typeof port !== 'number') {
    throw new Error('포트 번호가 필요하며 숫자여야 합니다.');
  }
  if (!key || typeof key !== 'string') {
    throw new Error('base64 키가 필요합니다.');
  }
  if (wss) return;

  storedKey = key;
  modeLocked = true;
  serverActive = true;

  lastMessages = Array(CHANNEL_COUNT).fill(null);
  channels = Array.from({ length: CHANNEL_COUNT }, () => new Set());

  wss = new WebSocketServer({ port });

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
          msg: '서버가 현재 요청을 처리하지 않습니다.'
        }));
      }
  
      let parsed;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        return ws.send(JSON.stringify({
          typ: 'err',
          code: '100/2',
          msg: '올바르지 않은 JSON 형식입니다.'
        }));
      }
  
      const { typ, key: clientKey, cot, als } = parsed;
  
      if (!clientKey || !cot || !als) {
        return ws.send(JSON.stringify({
          typ: 'err',
          code: '100/2',
          msg: '요청 필드가 누락되었습니다.'
        }));
      }
  
      if (typ !== 'sed') {
        return ws.send(JSON.stringify({
          typ: 'err',
          code: '100/3',
          msg: '지원하지 않는 요청 타입입니다.'
        }));
      }
  
      if (clientKey !== storedKey) {
        return ws.send(JSON.stringify({
          typ: 'err',
          code: '100/1',
          msg: '인증 키가 일치하지 않습니다.'
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
          msg: '서버 내부 처리 중 오류가 발생했습니다.'
        }));
      }
    });
  
    ws.on('close', () => {
      for (const group of channels) {
        group.delete(ws);
      }
    });
  });  

  console.log(`🟢 서버 실행됨: ws://localhost:${port} [${multiChannel ? '멀티 채널' : '단일 채널'}]`);
}

export function stop() {
  serverActive = false;
  console.log('⏸️ 서버 정지 상태. 연결은 유지되나 요청은 무시됨.');
}

export function start() {
  serverActive = true;
  console.log('▶️ 서버가 다시 요청을 수락합니다.');
}

export function getMessage(channel = 1) {
  const index = multiChannel ? (channel - 1) : 0;
  if (index < 0 || index >= CHANNEL_COUNT) return null;
  return lastMessages[index];
}

export function sendMessage(channel = 1, alias, content) {
  const index = multiChannel ? (channel - 1) : 0;
  if (index < 0 || index >= CHANNEL_COUNT) throw new Error('잘못된 채널 번호');

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
