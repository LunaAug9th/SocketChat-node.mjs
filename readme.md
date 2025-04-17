# 📡 WebSocket 채널 채팅 시스템 문서

이 시스템은 WebSocket 기반의 서버(`SocketChat-Server.mjs`)와 클라이언트(`SocketChat-Client.mjs`)로 구성되어 있으며, 단일 채널 또는 멀티 채널 모드를 지원하며 인증 기반 메시지 송수신을 제공합니다.

---

## 📁 파일 구성

- `SocketChat-Server.mjs` – WebSocket 서버 모듈 (채널, 인증, 메시지 브로드캐스트 관리)
- `SocketChat-Client.mjs` – 클라이언트 모듈 (서버 연결, 메시지 수신/전송 처리)

---

## 🖥️ `SocketChat-Server.mjs` 설명서

### 📦 모듈 개요

이 모듈은 WebSocket을 통해 채팅 서버를 구축하며 다음 기능을 제공합니다:

- 단일 / 멀티 채널 모드 선택 가능
- 채널별 메시지 브로드캐스트
- 마지막 메시지 저장 기능
- 인증 키 기반 메시지 처리

---

### ⚙️ 내보내는 함수

#### `setSingle()`

- 단일 채널 모드로 설정합니다.
- `listen()` 이후에는 변경할 수 없습니다.

#### `setMultiChannel(count: number)`

- 멀티 채널 모드로 설정합니다.
- `count`는 1 이상의 정수여야 합니다.

#### `listen(port: number, key: string)`

- 서버를 주어진 포트에서 실행하며, 인증 키를 설정합니다.
- 클라이언트는 이 키를 요청에 포함해야 합니다.

#### `stop()`

- 서버는 동작 중이나 클라이언트 요청은 무시합니다.

#### `start()`

- 서버가 다시 클라이언트 요청을 수락합니다.

#### `getMessage(channel?: number): { als, msg } | null`

- 특정 채널의 마지막 메시지를 반환합니다.
- 단일 채널 모드에서는 `channel` 인자를 생략하거나 `null`로 전달합니다.

```json
{
  "als": "별명",
  "msg": "메시지 내용"
}
```

#### `sendMessage(channel: number, alias: string, content: string): boolean`

- 서버가 특정 채널에 직접 메시지를 전송합니다.

---

### 📥 클라이언트 메시지 형식

```json
{
  "typ": "sed",
  "key": "인증키",
  "cot": "메시지내용",
  "als": "별명"
}
```

---

### ❗ 서버 에러 응답 형식

```json
{
  "typ": "err",
  "code": "에러코드",
  "msg": "에러 메시지"
}
```

| 코드 | 설명 |
|------|------|
| `100/1` | 인증 키 불일치 |
| `100/2` | JSON 파싱 실패 또는 필드 누락 |
| `100/3` | 지원하지 않는 요청 타입 |
| `110/1` | 서버가 요청을 처리하지 않음 |
| `110/2` | 내부 서버 오류 |

---

### ✅ 특징 요약

- 단일 또는 멀티 채널 모드 선택 가능
- 마지막 메시지 저장 및 전달
- 인증 기반 메시지 필터링
- alias 기반 채널 분배 (멀티 채널 시)

---

## 🤖 `SocketChat-Client.mjs` 설명서

### 📦 모듈 개요

이 모듈은 서버와의 WebSocket 통신을 쉽게 사용할 수 있도록 인터페이스를 제공합니다.

---

### 📥 클라이언트 설정 방법

```js
connect("ws://localhost:3000", 1); // 멀티 채널
connect("ws://localhost:3000", 0); // 싱글 채널
```

---

### 📡 내보내는 함수

#### `connect(url: string, mode: number): void`

- 서버 주소와 모드(멀티=1, 싱글=0)를 기반으로 서버에 연결합니다.

> ⚠️ 실수 방지를 위해 유효성 검사는 `console.warn()`으로 안내됩니다.

#### `disconnect(): void`

- 서버와의 WebSocket 연결을 종료합니다.

#### `getMessage(channel: number | null): { als, msg } | null`

- 해당 채널의 마지막 메시지를 반환합니다.
- 단일 채널 모드에서는 `null` 전달

#### `sendMessage(msg: string, alias: string, channel: number | null): void`

- 메시지를 서버로 전송합니다.
- 단일 채널 모드에서는 `channel`에 `null` 전달

```json
{
  "als": "별명",
  "msg": "보낸 메시지"
}
```

---

### ❗ 주의사항

- 클라이언트는 서버에서 제공된 인증 키(`base64`)를 알아야 합니다.
- 채널 번호는 멀티 채널 모드에서만 사용됩니다.
- 서버 연결 이전에 메시지를 전송하려 하면 경고가 출력됩니다.

---

## 🧪 CLI 기반 실행 흐름 예시

```bash
? 서버 주소는? → ws://localhost:3000  
? 모드? → 멀티 채널  
? 채널 수는? → 5  
? 내 별명은? → Henry  
? 서버 키는? → base64examplekey
```

---

## 📤 통신 예시

### 1. 클라이언트가 메시지 전송

```json
{
  "typ": "sed",
  "key": "base64examplekey",
  "cot": "안녕하세요!",
  "als": "Henry"
}
```

### 2. 서버가 클라이언트에게 브로드캐스트

```json
{
  "typ": "rev",
  "key": "base64examplekey",
  "cot": "안녕하세요!",
  "als": "Henry"
}
```

---

## 🧾 의존 모듈

- `ws` – WebSocket 서버/클라이언트 통신
- `readline`, `inquirer` – CLI 기반 입력 처리 (사용자 정보 설정)

---

## ✅ 전체 요약

| 항목 | 설명 |
|------|------|
| 인증 | base64 문자열을 기반으로 서버 인증 수행 |
| 채널 | 단일 / 멀티 채널 모드 지원 |
| 메시지 처리 | 마지막 메시지 저장, 실시간 브로드캐스트 |
| 사용성 | 클라이언트 모듈로 쉽게 통신 가능 |
| 커스터마이징 | 채널 수 및 별명 자유 설정 |

Made by Henry and AI