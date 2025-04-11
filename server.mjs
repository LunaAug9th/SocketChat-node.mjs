import * as Chat from './SocketChat-Server.mjs';

const base64Key = 'aXNiZXR0ZXIxMjM=';

Chat.setSingle()
Chat.listen(80, base64Key);
