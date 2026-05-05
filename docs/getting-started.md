# はじめに / Getting Started

[インストーラー版 (BOOTH)](#booth-ja) | [開発者向け](#dev-ja) | [English (Installer)](#booth-en) | [English (Dev)](#dev-en)

---

<a id="booth-ja"></a>

## インストーラー版セットアップガイド

> BOOTH からダウンロードした方はこちらをご覧ください。

### 必要なもの

| 必要なもの | 入手先 | 備考 |
|---|---|---|
| **Node.js 18 以上** | [nodejs.org](https://nodejs.org/ja/) | 「LTS」版を選んでください |
| **VOICEVOX 互換 TTS エンジン** | 下記参照 | キャラクターの声に使います |
| **VRM モデルファイル**（`.vrm`） | [VRoid Hub](https://hub.vroid.com/) / [BOOTH](https://booth.pm/) | 3D キャラクターファイルです |
| **MCP 対応 AI ツール** | [Claude Desktop](https://claude.ai/download) など | AI とキャラクターをつなぎます |

**VOICEVOX 互換エンジンの選び方:**

このアプリは VOICEVOX 互換 API に対応しています。以下のエンジンが使用できます。

| エンジン | ダウンロード | ポート | 対応OS |
|---|---|---|---|
| **VOICEVOX**（定番） | [voicevox.hiroshiba.jp](https://voicevox.hiroshiba.jp/) | 50021 | Win / Mac / Linux |
| COEIROINK | [coeiroink.com](https://coeiroink.com/) | 50031 | Windows |
| AivisSpeech | [aivis-project.com](https://aivis-project.com/) | 10101 | Windows のみ |

> どれを選べばいいかわからない場合は **VOICEVOX** をおすすめします。

---

### ステップ 1: Node.js をインストールする

[nodejs.org](https://nodejs.org/ja/) にアクセスし、**LTS** と書かれたバージョンをダウンロードしてインストールします。

インストール後、コマンドプロンプトで確認:

```
node --version
```

`v18.x.x` 以上と表示されれば OK です。

---

### ステップ 2: Desktop Mascot を展開する

ダウンロードした zip ファイルを任意の場所に展開します。

> 例: `C:\DesktopMascot\`

展開後のフォルダ構成:

```
DesktopMascot\
├── Desktop Mascot.exe   ← これがアプリ本体
├── resources\
│   ├── app\             ← アプリのファイル
│   └── mcp\             ← MCP サーバー（AI 連携用）
└── ...
```

---

### ステップ 3: VRM モデルを配置する

VRM ファイル（例: `MyCharacter.vrm`）を以下のフォルダにコピーします:

```
resources\app\dist\renderer\assets\models\
```

フォルダが存在しない場合は手動で作成してください。

---

### ステップ 4: 設定ファイルを作る

`resources\app\dist\renderer\` フォルダを開きます。

`config.json` というファイルを新規作成し、以下の内容を入力します:

```json
{
  "vrm": {
    "modelPath": "./assets/models/MyCharacter.vrm"
  }
}
```

> `MyCharacter.vrm` の部分をステップ 3 で配置したファイル名に変更してください。

---

### ステップ 5: TTS エンジンを起動する

選んだ TTS エンジンを起動しておきます。

起動確認（コマンドプロンプトで実行）:

```
# VOICEVOX の場合
curl http://127.0.0.1:50021/speakers

# AivisSpeech の場合
curl http://127.0.0.1:10101/speakers
```

話者の一覧（JSON）が表示されれば OK です。

---

### ステップ 6: AI ツールに MCP サーバーを登録する

**Claude Desktop の場合:**

以下のファイルをテキストエディタで開きます（ファイルがなければ新規作成）:

```
%APPDATA%\Claude\claude_desktop_config.json
```

> `Win + R` を押して `%APPDATA%\Claude\` と入力するとフォルダが開きます。

以下の内容を入力します（**パスは実際の展開先に合わせてください**）:

```json
{
  "mcpServers": {
    "desktop-mascot": {
      "command": "node",
      "args": ["C:/DesktopMascot/resources/mcp/index.js"],
      "env": {
        "VOICEVOX_BASE_URL": "http://127.0.0.1:50021",
        "VOICEVOX_SPEAKER_ID": "3"
      }
    }
  }
}
```

> **ポイント:**
> - パスの区切りには `\` ではなく `/` を使ってください
> - `VOICEVOX_BASE_URL` は使用するエンジンのポートに合わせて変更してください
> - `VOICEVOX_SPEAKER_ID` は使いたい話者の ID に変更してください

**話者 ID の確認方法:**

ブラウザで `http://127.0.0.1:50021/speakers` にアクセスすると話者一覧が表示されます。`"id"` の値を `VOICEVOX_SPEAKER_ID` に設定してください。

保存後、**Claude Desktop を完全に終了して再起動**します。

---

### ステップ 7: Desktop Mascot を起動する

`Desktop Mascot.exe` をダブルクリックして起動します。

透過ウィンドウにキャラクターが表示されれば成功です 🎉

> **ウィンドウ操作:**
> - ウィンドウ端をドラッグ: ウィンドウ移動
> - キャラクター上をドラッグ: カメラ回転
> - スクロール: ズーム
> - `Ctrl+,`: 設定モード（リサイズ・移動しやすいモード）

---

### ステップ 8: 動作確認

1. Desktop Mascot が起動していることを確認
2. TTS エンジンが起動していることを確認
3. Claude Desktop を開いて Claude に話しかける

Claude が返答するとき、キャラクターが喋って表情が変われば完成です！

> **ヒント:** Claude が speak ツールを確実に使うようにシステムプロンプトを設定すると安定します:
> ```
> 返答するときは必ず speak ツールを呼び出してください。
> text に返答内容、emotion に感情（neutral/happy/sad/angry/surprised/relaxed）を設定してください。
> ```

---

### うまくいかない場合

| 症状 | 確認ポイント |
|---|---|
| キャラクターが表示されない | `config.json` の `modelPath` のファイル名が正しいか / VRM ファイルの配置場所が正しいか |
| 「node が見つからない」エラー | Node.js がインストールされているか（ステップ 1） |
| 音が出ない | TTS エンジンが起動しているか / `VOICEVOX_BASE_URL` のポート番号が合っているか |
| MCP サーバーが認識されない | `claude_desktop_config.json` のパスに誤字がないか / スラッシュ `/` を使っているか / Claude Desktop を再起動したか |

---

<a id="dev-ja"></a>

## 開発者向けセットアップ

> ソースコードから動かしたい方・開発に参加したい方はこちら。

### ステップ0: 必要なものを揃える

- [ ] **VRM モデルファイル**（`.vrm`）— 無料モデルの入手先: [VRoid Hub](https://hub.vroid.com/) / [BOOTH](https://booth.pm/)
- [ ] **VOICEVOX 互換 TTS エンジン**（以下のいずれか）
  - [VOICEVOX](https://voicevox.hiroshiba.jp/) — ポート: `50021`（クロスプラットフォーム）
  - [AivisSpeech](https://aivis-project.com/) — ポート: `10101`（Windows のみ）
  - [COEIROINK](https://coeiroink.com/) — ポート: `50031`
- [ ] **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- [ ] **Claude Desktop**（または MCP 対応 AI ツール）

---

### ステップ1: リポジトリをセットアップする

```bash
git clone https://github.com/rennosuke-haresu/desktop-mascot-mcp.git
cd desktop-mascot-mcp
npm install
```

`config.example.json` をコピーして `config.json` を作成し、VRM モデルのパスを設定します。

```bash
cp config.example.json config.json
```

`config.json` を編集してモデルパスを変更します：

```json
{
  "vrm": {
    "modelPath": "./assets/models/YourModel.vrm"
  }
}
```

VRM ファイルを `assets/models/` フォルダに置いてください。

ビルドを実行します：

```bash
npm run build:electron
```

---

### ステップ2: TTS エンジンを起動して確認する

TTS エンジンを起動したあと、以下のコマンドで動作を確認します：

```bash
# VOICEVOX の場合
curl http://127.0.0.1:50021/speakers

# AivisSpeech の場合
curl http://127.0.0.1:10101/speakers
```

---

### ステップ3: デスクトップマスコットを起動する

```bash
npm run start:electron
```

---

### ステップ4: Claude Desktop に登録する

`%APPDATA%\Claude\claude_desktop_config.json` を開いて `mcpServers` に追加します：

```json
{
  "mcpServers": {
    "desktop-mascot-mcp": {
      "command": "node",
      "args": ["C:/Users/yourname/desktop-mascot-mcp/dist/index.js"],
      "env": {
        "VOICEVOX_BASE_URL": "http://127.0.0.1:50021",
        "VOICEVOX_SPEAKER_ID": "3"
      }
    }
  }
}
```

保存後、**Claude Desktop を完全に再起動**します。

---

### うまくいかない場合

| 症状 | 確認点 |
|---|---|
| キャラクターが表示されない | `config.json` の `modelPath` が正しいか / `npm run start:electron` が動いているか |
| 音が出ない | TTS エンジンが起動しているか / `VOICEVOX_SPEAKER_ID` がエンジンで有効な値か |
| MCP サーバーが認識されない | `dist/index.js` が存在するか（`npm run build:electron` を再実行） / JSON 構文エラー（末尾カンマに注意） |

詳細なトラブルシューティングは [README](../README.md) を参照してください。

---

<a id="booth-en"></a>

## Installer Setup Guide (BOOTH)

> For users who downloaded the zip from BOOTH.

### Requirements

| Item | Where to get it | Notes |
|---|---|---|
| **Node.js 18+** | [nodejs.org](https://nodejs.org/) | Choose the "LTS" version |
| **VOICEVOX-compatible TTS engine** | See below | Used for character voice |
| **VRM model file** (`.vrm`) | [VRoid Hub](https://hub.vroid.com/) / [BOOTH](https://booth.pm/) | Your 3D character |
| **MCP-compatible AI tool** | [Claude Desktop](https://claude.ai/download) etc. | Connects AI to the character |

**VOICEVOX-compatible engines:**

This app works with any VOICEVOX-compatible API.

| Engine | Download | Port | OS |
|---|---|---|---|
| **VOICEVOX** (recommended) | [voicevox.hiroshiba.jp](https://voicevox.hiroshiba.jp/) | 50021 | Win / Mac / Linux |
| COEIROINK | [coeiroink.com](https://coeiroink.com/) | 50031 | Windows |
| AivisSpeech | [aivis-project.com](https://aivis-project.com/) | 10101 | Windows only |

---

### Step 1: Install Node.js

Go to [nodejs.org](https://nodejs.org/) and download the **LTS** version.

Verify in a command prompt:

```
node --version
```

You should see `v18.x.x` or higher.

---

### Step 2: Extract Desktop Mascot

Extract the downloaded zip to any location (e.g., `C:\DesktopMascot\`).

---

### Step 3: Place your VRM model

Copy your `.vrm` file into:

```
resources\app\dist\renderer\assets\models\
```

Create the folder if it doesn't exist.

---

### Step 4: Create config.json

Open `resources\app\dist\renderer\` and create `config.json`:

```json
{
  "vrm": {
    "modelPath": "./assets/models/MyCharacter.vrm"
  }
}
```

Replace `MyCharacter.vrm` with your actual filename.

---

### Step 5: Start your TTS engine

Verify it's running:

```
# For VOICEVOX
curl http://127.0.0.1:50021/speakers
```

A JSON list of speakers means it's working.

---

### Step 6: Register the MCP server

Open or create `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "desktop-mascot": {
      "command": "node",
      "args": ["C:/DesktopMascot/resources/mcp/index.js"],
      "env": {
        "VOICEVOX_BASE_URL": "http://127.0.0.1:50021",
        "VOICEVOX_SPEAKER_ID": "3"
      }
    }
  }
}
```

> Use forward slashes `/` in the path. Adjust `VOICEVOX_BASE_URL` to match your engine's port.

Save and **fully restart Claude Desktop**.

---

### Step 7: Launch the mascot

Double-click `Desktop Mascot.exe`. Your character should appear in a transparent window.

---

### Step 8: Verify

1. Desktop Mascot is running
2. TTS engine is running
3. Send a message to Claude Desktop

If the character speaks and changes expression — you're done! 🎉

---

### Troubleshooting

| Symptom | What to check |
|---|---|
| Character not showing | Check `modelPath` in `config.json` / verify VRM file location |
| "node not found" error | Make sure Node.js is installed (Step 1) |
| No audio | Check TTS engine is running / verify port in `VOICEVOX_BASE_URL` |
| MCP server not recognized | Check path in config for typos / use `/` not `\` / restart Claude Desktop |

---

<a id="dev-en"></a>

## Developer Setup

> For those building from source or contributing.

### Step 0: Gather what you need

- [ ] **A VRM model file** (`.vrm`) — Free models: [VRoid Hub](https://hub.vroid.com/) / [BOOTH](https://booth.pm/)
- [ ] **A VOICEVOX-compatible TTS engine** (choose one):
  - [VOICEVOX](https://voicevox.hiroshiba.jp/) — Port: `50021` (cross-platform)
  - [AivisSpeech](https://aivis-project.com/) — Port: `10101` (Windows only)
  - [COEIROINK](https://coeiroink.com/) — Port: `50031`
- [ ] **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- [ ] **Claude Desktop** (or another MCP-compatible AI tool)

---

### Step 1: Set up the repository

```bash
git clone https://github.com/rennosuke-haresu/desktop-mascot-mcp.git
cd desktop-mascot-mcp
npm install
cp config.example.json config.json
```

Edit `config.json` with your VRM model path, then build:

```bash
npm run build:electron
```

---

### Step 2: Start your TTS engine and verify

```bash
# For VOICEVOX
curl http://127.0.0.1:50021/speakers
```

---

### Step 3: Launch the mascot

```bash
npm run start:electron
```

---

### Step 4: Register with Claude Desktop

Add to `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "desktop-mascot-mcp": {
      "command": "node",
      "args": ["C:/Users/yourname/desktop-mascot-mcp/dist/index.js"],
      "env": {
        "VOICEVOX_BASE_URL": "http://127.0.0.1:50021",
        "VOICEVOX_SPEAKER_ID": "3"
      }
    }
  }
}
```

Save and fully restart Claude Desktop.

---

### Troubleshooting

| Symptom | What to check |
|---|---|
| Character not showing | Verify `modelPath` in `config.json` / confirm `npm run start:electron` is running |
| No audio | Verify TTS engine is running / confirm `VOICEVOX_SPEAKER_ID` is valid |
| MCP server not recognized | Verify `dist/index.js` exists / check JSON syntax (trailing commas) |

For more, see [README](../README.md).
