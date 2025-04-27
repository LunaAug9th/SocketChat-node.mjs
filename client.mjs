import readline from 'readline';
import * as client from './SocketChat-Client.mjs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let serverUrl = '';
let isMulti = true;
let channel = 1;
let alias = '';
let key = '';

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function main() {
  console.log('💬 CLI Chat Client Setup');

  serverUrl = await ask('🟢 Server URL (e.g., ws://localhost:3000): ');
  const mode = await ask('📡 Channel Mode (0 = Single, 1 = Multi): ');
  isMulti = mode === '1';

  if (isMulti) {
    const ch = await ask('📺 Channel number to use (1 or greater): ');
    channel = parseInt(ch);
    if (isNaN(channel) || channel < 1) {
      console.warn('⚠️ Invalid channel number. Setting to default value 1.');
      channel = 1;
    }
  }

  alias = await ask('🧑 Enter your alias: ');
  key = await ask('🔑 Server key (base64 string): ');

  // Attempt to connect to the server
  try {
    client.connect(serverUrl, isMulti ? 1 : 0, key);
    console.log(`\n✅ Connected to server: ${serverUrl} [${isMulti ? `Channel ${channel}` : 'Single Channel'}]`);
  } catch (err) {
    console.error('❌ Failed to connect to server:', err.message);
    rl.close();
    return;
  }

  console.log('💬 Type your message. Press Ctrl+C to exit.');

  // Check for received messages periodically
  setInterval(() => {
    const msg = client.getMessage(isMulti ? channel : null);
    if (msg) {
      console.log(`\n📨 [${msg.als}]: ${msg.msg}`);
      rl.prompt(true);
    }
  }, 500);

  rl.on('line', (line) => {
    if (line.trim() !== '') {
      client.sendMessage(line.trim(), alias, isMulti ? channel : null);
    }
    rl.prompt();
  });

  rl.on('SIGINT', () => {
    console.log('\n👋 Exiting chat');
    client.disconnect();
    rl.close();
  });

  rl.prompt();
}

main();
