// wsClient.js
import WebSocket from 'ws';

class WSClient {
  constructor() {
    this.ws = null;
    this.isMulti = false;
    this.lastMessages = {};
    this.connected = false;
    this.key = null;
  }

  connect(url, isMulti, key) {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        console.warn('⚠️ 이미 연결되어 있습니다. 중복 연결을 방지하세요.');
        return reject(new Error('이미 연결되어 있습니다.'));
      }

      this.ws = new WebSocket(url);
      this.isMulti = isMulti === 1;
      this.key = key;

      this.ws.on('open', () => {
        console.log(`🔌 연결됨: ${url}`);
        this.connected = true;
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.typ === 'rev') {
            const channel = this.isMulti ? (message.als.length % 25) : 0;
            this.lastMessages[channel] = message;
            console.log(`[RECV] (${channel}) ${message.als}: ${message.cot}`);
          } else if (message.typ === 'err') {
            console.warn(`[서버 에러 ${message.code}] ${message.msg}`);
          }
        } catch (err) {
          console.warn('⚠️ 메시지 파싱 오류:', err.message);
        }
      });

      this.ws.on('close', () => {
        console.log('🔌 연결 종료됨');
        this.connected = false;
      });

      this.ws.on('error', (err) => {
        console.warn('⚠️ WebSocket 오류:', err.message);
        reject(err);
      });
    });
  }

  disconnect() {
    if (!this.connected || !this.ws) {
      console.warn('⚠️ 연결되어 있지 않아 해제할 수 없습니다.');
      return;
    }
    this.ws.close();
    this.connected = false;
  }

  getMessage(channel = null) {
    if (!this.connected) {
      console.warn('⚠️ 서버에 연결되어 있지 않습니다.');
      return null;
    }
  
    const index = this.isMulti ? ((channel ?? 1) - 1) : 0;
    if (index < 0 || index >= 25) {
      console.warn('⚠️ 잘못된 채널 번호입니다.');
      return null;
    }
  
    const message = this.lastMessages[index];
    if (!message) return null;
  
    return {
      als: message.als,
      msg: message.cot
    };
  }
  

  sendMessage(content, alias, channel = null) {
    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ 메시지를 보내기 전에 WebSocket 연결을 확인하세요.');
      return;
    }

    if (!alias || !content) {
      console.warn('⚠️ 별명과 내용은 필수입니다.');
      return;
    }

    const message = {
      typ: 'sed',
      key: this.key,
      cot: content,
      als: alias
    };

    this.ws.send(JSON.stringify(message));
    const channelIndex = this.isMulti ? (alias.length % 25) : 0;
    console.log(`[SEND] (${channelIndex}) ${alias}: ${content}`);
  }
}

export default new WSClient();
