// cli-chat.js

import readline from 'readline';
import * as client from './wsClient.js'; // wsClient.js 모듈에서 connect/sendMessage/getMessage 사용

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
  console.log('💬 CLI 채팅 클라이언트 설정');

  serverUrl = await ask('🟢 서버 주소 (예: ws://localhost:3000): ');
  const mode = await ask('📡 채널 모드 (0 = 단일, 1 = 멀티): ');
  isMulti = mode === '1';

  if (isMulti) {
    const ch = await ask('📺 사용할 채널 번호 (1 이상): ');
    channel = parseInt(ch);
    if (isNaN(channel) || channel < 1) {
      console.warn('⚠️ 잘못된 채널 번호입니다. 기본값 1로 설정합니다.');
      channel = 1;
    }
  }

  alias = await ask('🧑 별명을 입력하세요: ');
  key = await ask('🔑 서버 키 (base64 문자열): ');

  // 서버 연결 시도
  try {
    client.connect(serverUrl, isMulti ? 1 : 0, key);
    console.log(`\n✅ 서버에 연결됨: ${serverUrl} [${isMulti ? `채널 ${channel}` : '단일 채널'}]`);
  } catch (err) {
    console.error('❌ 서버 연결 실패:', err.message);
    rl.close();
    return;
  }

  console.log('💬 메시지를 입력하세요. 종료하려면 Ctrl+C');

  // 주기적으로 메시지 수신 확인
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
    console.log('\n👋 채팅 종료');
    client.disconnect();
    rl.close();
  });

  rl.prompt();
}

main();
