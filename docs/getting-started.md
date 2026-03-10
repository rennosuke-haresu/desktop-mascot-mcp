# はじめに / Getting Started

[日本語](#ja) | [English](#en)

---

<a id="ja"></a>

## はじめに

このガイドでは、Desktop Mascot MCP を初めてセットアップする手順を説明します。
詳細な設定オプションについては [README](../README.md) を参照してください。

### ステップ0: 必要なものを揃える

始める前に以下を用意してください。

- [ ] **VRM モデルファイル**（`.vrm`）— 無料モデルの入手先: [VRoid Hub](https://hub.vroid.com/) / [BOOTH](https://booth.pm/)
- [ ] **TTS エンジン**（以下のいずれか）
  - [AivisSpeech](https://aivis-project.com/) — ポート: `10101`（Windows のみ）
  - [VOICEVOX](https://voicevox.hiroshiba.jp/) — ポート: `50021`（クロスプラットフォーム）
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
# AivisSpeech の場合
curl http://127.0.0.1:10101/speakers

# VOICEVOX の場合
curl http://127.0.0.1:50021/speakers
```

話者の一覧（JSON）が表示されれば OK です。

> 話者 ID（`VOICEVOX_SPEAKER_ID`）は、後のステップで使用します。
> 各エンジンで有効な ID が異なるので注意してください。

---

### ステップ3: デスクトップマスコットを起動する

```bash
npm run start:electron
```

透過ウィンドウにキャラクターが表示されれば成功です。

> **ウィンドウ操作**
> - ドラッグ：ウィンドウ移動
> - ドラッグ（キャラクター上）：カメラ回転
> - スクロール：ズーム
> - `Ctrl+,`：設定モード切り替え（リサイズ可能なウィンドウに切り替わります）

---

### ステップ4: Claude Desktop に登録する

Claude Desktop の設定ファイルを開きます：

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

`mcpServers` に以下を追加します（パスは実際の場所に変更してください）：

```json
{
  "mcpServers": {
    "desktop-mascot-mcp": {
      "command": "node",
      "args": ["C:/Users/yourname/desktop-mascot-mcp/dist/index.js"],
      "env": {
        "VOICEVOX_BASE_URL": "http://127.0.0.1:10101",
        "VOICEVOX_SPEAKER_ID": "888753760"
      }
    }
  }
}
```

> **Windows のパス注意**: スラッシュ `/` またはエスケープ済みバックスラッシュ `\\` を使ってください。

保存後、**Claude Desktop を完全に再起動**します。

---

### ステップ5: 動作確認

1. `npm run start:electron` でマスコットが起動していることを確認
2. TTS エンジンが起動していることを確認
3. Claude Desktop を開き、Claude に話しかける

Claude が返答するとき、キャラクターが喋り・表情が変われば完成です。

> Claude がスピーク機能を使うよう、以下のようなシステムプロンプトを設定すると良いでしょう：
>
> ```
> 返答するとき、必ず speak ツールを呼び出してください。
> text に返答内容、emotion に感情（neutral/happy/sad/angry/surprised/relaxed）を設定してください。
> ```

---

### うまくいかない場合

| 症状 | 確認点 |
|---|---|
| キャラクターが表示されない | `config.json` の `modelPath` が正しいか確認。`npm run start:electron` が動いているか確認 |
| 音が出ない | TTS エンジンが起動しているか確認（ステップ2のcurlコマンド）。`VOICEVOX_SPEAKER_ID` がエンジンで有効な値か確認 |
| MCP サーバーが認識されない | `dist/index.js` が存在するか確認（`npm run build:electron` を再実行）。JSON の構文エラーがないか確認（末尾カンマに注意） |

詳細なトラブルシューティングは [README](../README.md) を参照してください。

---

<a id="en"></a>

## Getting Started

This guide walks you through setting up Desktop Mascot MCP for the first time.
For detailed configuration options, see the [README](../README.md).

### Step 0: Gather what you need

Before starting, prepare the following:

- [ ] **A VRM model file** (`.vrm`) — Free models: [VRoid Hub](https://hub.vroid.com/) / [BOOTH](https://booth.pm/)
- [ ] **A TTS engine** (choose one):
  - [AivisSpeech](https://aivis-project.com/) — Port: `10101` (Windows only)
  - [VOICEVOX](https://voicevox.hiroshiba.jp/) — Port: `50021` (cross-platform)
  - [COEIROINK](https://coeiroink.com/) — Port: `50031`
- [ ] **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- [ ] **Claude Desktop** (or another MCP-compatible AI tool)

---

### Step 1: Set up the repository

```bash
git clone https://github.com/rennosuke-haresu/desktop-mascot-mcp.git
cd desktop-mascot-mcp
npm install
```

Copy `config.example.json` to `config.json` and set your VRM model path:

```bash
cp config.example.json config.json
```

Edit `config.json` to set your model path:

```json
{
  "vrm": {
    "modelPath": "./assets/models/YourModel.vrm"
  }
}
```

Place your VRM file in the `assets/models/` folder, then build:

```bash
npm run build:electron
```

---

### Step 2: Start and verify your TTS engine

After starting your TTS engine, verify it's running:

```bash
# For AivisSpeech
curl http://127.0.0.1:10101/speakers

# For VOICEVOX
curl http://127.0.0.1:50021/speakers
```

If you see a JSON list of speakers, you're good to go.

> The speaker ID (`VOICEVOX_SPEAKER_ID`) used in the next step must be valid for your chosen engine.

---

### Step 3: Launch the desktop mascot

```bash
npm run start:electron
```

You should see your character in a transparent always-on-top window.

> **Window controls**
> - Drag the window border: move window
> - Drag on the character: rotate camera
> - Scroll: zoom
> - `Ctrl+,`: toggle settings mode (resizable window)

---

### Step 4: Register with Claude Desktop

Open the Claude Desktop config file:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the following to `mcpServers` (replace the path with your actual location):

```json
{
  "mcpServers": {
    "desktop-mascot-mcp": {
      "command": "node",
      "args": ["C:/Users/yourname/desktop-mascot-mcp/dist/index.js"],
      "env": {
        "VOICEVOX_BASE_URL": "http://127.0.0.1:10101",
        "VOICEVOX_SPEAKER_ID": "888753760"
      }
    }
  }
}
```

> **Windows path note**: Use forward slashes `/` or escaped backslashes `\\`.

Save the file and **fully restart Claude Desktop**.

---

### Step 5: Verify it works

1. Confirm the mascot is running (`npm run start:electron`)
2. Confirm your TTS engine is running
3. Open Claude Desktop and send a message

When Claude responds, if the character speaks and changes expression — you're done!

> To ensure Claude uses the speak tool automatically, add a system prompt like:
>
> ```
> When responding, always call the speak tool.
> Set text to your response, and emotion to match the mood (neutral/happy/sad/angry/surprised/relaxed).
> ```

---

### Troubleshooting

| Symptom | What to check |
|---|---|
| Character not showing | Verify `modelPath` in `config.json`. Confirm `npm run start:electron` is running |
| No audio | Verify TTS engine is running (Step 2 curl command). Confirm `VOICEVOX_SPEAKER_ID` is valid for your engine |
| MCP server not recognized | Verify `dist/index.js` exists (re-run `npm run build:electron`). Check JSON syntax (watch for trailing commas) |

For more detailed troubleshooting, see the [README](../README.md).
