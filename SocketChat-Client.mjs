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
        console.warn('⚠️ Already connected. Avoid duplicate connections.');
        return reject(new Error('Already connected.'));
      }

      this.ws = new WebSocket(url);
      this.isMulti = isMulti === 1;
      this.key = key;

      this.ws.on('open', () => {
        console.log(`🔌 Connected: ${url}`);
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
            console.warn(`[Server Error ${message.code}] ${message.msg}`);
          }
        } catch (err) {
          console.warn('⚠️ Message parsing error:', err.message);
        }
      });

      this.ws.on('close', () => {
        console.log('🔌 Connection closed.');
        this.connected = false;
      });

      this.ws.on('error', (err) => {
        console.warn('⚠️ WebSocket error:', err.message);
        reject(err);
      });
    });
  }

  disconnect() {
    if (!this.connected || !this.ws) {
      console.warn('⚠️ Cannot disconnect because there is no active connection.');
      return;
    }
    this.ws.close();
    this.connected = false;
  }

  getMessage(channel = null) {
    if (!this.connected) {
      console.warn('⚠️ Not connected to the server.');
      return null;
    }
  
    const index = this.isMulti ? ((channel ?? 1) - 1) : 0;
    if (index < 0 || index >= 25) {
      console.warn('⚠️ Invalid channel number.');
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
      console.warn('⚠️ Check the WebSocket connection before sending a message.');
      return;
    }

    if (!alias || !content) {
      console.warn('⚠️ Alias and content are required.');
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
