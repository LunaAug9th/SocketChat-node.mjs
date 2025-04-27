# 📡 WebSocket Channel Chat System Documentation

This system consists of a WebSocket-based server (`SocketChat-Server.mjs`) and client (`SocketChat-Client.mjs`), supporting both single-channel and multi-channel modes, and provides authentication-based message transmission and reception.

---

## 📁 File Structure

- `SocketChat-Server.mjs` – WebSocket server module (manages channels, authentication, and message broadcasting)
- `SocketChat-Client.mjs` – Client module (handles server connection, message sending/receiving)

---

## 🖥️ `SocketChat-Server.mjs` Manual

### 📦 Module Overview

This module builds a chat server using WebSocket and provides the following features:

- Selectable single-channel or multi-channel mode
- Channel-specific message broadcasting
- Last message storage functionality
- Message handling based on authentication key

---

### ⚙️ Exported Functions

#### `setSingle()`

- Sets the server to single-channel mode.
- Cannot be changed after calling `listen()`.

#### `setMultiChannel(count: number)`

- Sets the server to multi-channel mode.
- `count` must be an integer greater than or equal to 1.

#### `listen(port: number, key: string)`

- Runs the server on the given port and sets the authentication key.
- Clients must include this key in their requests.

#### `stop()`

- The server keeps running but ignores client requests.

#### `start()`

- The server resumes accepting client requests.

#### `getMessage(channel?: number): { als, msg } | null`

- Returns the last message of the specified channel.
- In single-channel mode, omit the `channel` parameter or pass `null`.

```json
{
  "als": "Alias",
  "msg": "Message Content"
}
```

#### `sendMessage(channel: number, alias: string, content: string): boolean`

- Sends a message directly to a specific channel from the server.

---

### 📥 Client Message Format

```json
{
  "typ": "sed",
  "key": "Authentication Key",
  "cot": "Message Content",
  "als": "Alias"
}
```

---

### ❗ Server Error Response Format

```json
{
  "typ": "err",
  "code": "Error Code",
  "msg": "Error Message"
}
```

| Code | Description |
|------|-------------|
| `100/1` | Authentication key mismatch |
| `100/2` | JSON parsing failure or missing fields |
| `100/3` | Unsupported request type |
| `110/1` | Server not processing requests |
| `110/2` | Internal server error |

---

### ✅ Feature Summary

- Selectable single or multi-channel mode
- Stores and delivers the last message
- Filters messages based on authentication
- Channel distribution based on alias (in multi-channel mode)

---

## 🤖 `SocketChat-Client.mjs` Manual

### 📦 Module Overview

This module provides an interface for easy WebSocket communication with the server.

---

### 📥 How to Set Up the Client

```js
connect("ws://localhost:3000", 1); // Multi-channel
connect("ws://localhost:3000", 0); // Single-channel
```

---

### 📡 Exported Functions

#### `connect(url: string, mode: number): void`

- Connects to the server based on the server URL and mode (multi=1, single=0).

> ⚠️ Validation is guided via `console.warn()` to prevent mistakes.

#### `disconnect(): void`

- Disconnects the WebSocket connection with the server.

#### `getMessage(channel: number | null): { als, msg } | null`

- Returns the last message from the specified channel.
- In single-channel mode, pass `null`.

#### `sendMessage(msg: string, alias: string, channel: number | null): void`

- Sends a message to the server.
- In single-channel mode, pass `null` to the `channel` parameter.

```json
{
  "als": "Alias",
  "msg": "Sent Message"
}
```

---

### ❗ Important Notes

- The client must know the authentication key (`base64`) provided by the server.
- Channel numbers are only used in multi-channel mode.
- Attempting to send a message before establishing a server connection will trigger a warning.

---

## 🧪 Example CLI Execution Flow

```bash
? Server Address? → ws://localhost:3000  
? Mode? → Multi-Channel  
? Number of Channels? → 5  
? Your Alias? → Henry  
? Server Key? → base64examplekey
```

---

## 📤 Communication Example

### 1. Client Sends a Message

```json
{
  "typ": "sed",
  "key": "base64examplekey",
  "cot": "Hello!",
  "als": "Henry"
}
```

### 2. Server Broadcasts to Clients

```json
{
  "typ": "rev",
  "key": "base64examplekey",
  "cot": "Hello!",
  "als": "Henry"
}
```

---

## 🧾 Dependencies

- `ws` – WebSocket server/client communication
- `readline`, `inquirer` – CLI-based input handling (user setup)

---

## ✅ Full Summary

| Item | Description |
|------|-------------|
| Authentication | Server authentication using a base64 string |
| Channels | Supports single and multi-channel modes |
| Message Handling | Stores last messages, real-time broadcasting |
| Usability | Easy communication via the client module |
| Customization | Free setting of channel number and alias |

Made by Henry and AI

