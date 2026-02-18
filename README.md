# Desktop Mascot MCP

MCP（Model Context Protocol）対応の AI ツールと連携して、3D キャラクターがデスクトップに常駐するマスコットアプリです。

AI が返答すると、キャラクターが**音声・リップシンク・表情・ジェスチャー**でリアクションします。

---

## これは何？

**MCP サーバー**とは、AI ツール（Claude Desktop、Cursor など）に機能を追加するプログラムです。このプロジェクトを導入すると、AI ツールから `speak` というコマンドを呼び出せるようになり、3D キャラクターが喋りながら動きます。

```
あなた → AI ツール → speak コマンド → キャラクターが音声・アニメーションで返答
```

> MCP についての詳細: [Model Context Protocol](https://modelcontextprotocol.io/)

---

## ✨ 機能

- **音声合成**: VOICEVOX 互換 API（VOICEVOX / AivisSpeech / COEIROINK など）による音声再生
- **リップシンク**: 音声に合わせた自然な口の動き
- **表情**: 6 種類の感情表現（neutral / happy / sad / angry / surprised / relaxed）
- **ジェスチャー**: VRMA 形式のアニメーション（wave / nod / shake / think など）
- **アイドル**: 放置中にランダムなアニメーションを自動再生
- **透過ウィンドウ**: デスクトップに溶け込む常時最前面ウィンドウ
- **状態の記憶**: カメラ位置・ウィンドウ位置を自動保存

---

## 📋 必要なもの

| 必要なもの | 入手先 |
|---|---|
| Node.js 18 以上 | [nodejs.org](https://nodejs.org/) |
| Git | [git-scm.com](https://git-scm.com/) |
| MCP 対応 AI ツール | [Claude Desktop](https://claude.ai/download) など |
| VOICEVOX 互換 音声合成エンジン | [VOICEVOX](https://voicevox.hiroshiba.jp/) / [AivisSpeech](https://aivis-project.com/) など |
| VRM モデルファイル（.vrm） | 下記参照 |

### VRM モデルの入手

本リポジトリには VRM モデルは含まれていません。お好みの VRM モデルを別途ご用意ください。

無料モデルの例：
- [ニコニ立体ちゃん「アリシア・ソリッド」](https://3d.nicovideo.jp/alicia/) - 商用利用可
- [VRoid Hub](https://hub.vroid.com/) - 配布条件はモデルごとに確認

---

## 🚀 セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/your-username/desktop-mascot-mcp.git
cd desktop-mascot-mcp
npm install
```

### 2. VRM モデルを配置

ダウンロードした `.vrm` ファイルを `assets/models/` に置きます。

```
desktop-mascot-mcp/
└── assets/
    └── models/
        └── YourModel.vrm   ← ここに置く
```

### 3. 設定ファイルを作成

`config.example.json` をコピーして `config.json` を作成します。

```bash
cp config.example.json config.json
```

`config.json` を開き、VRM モデルのパスを書き換えます。

```json
{
  "vrm": {
    "modelPath": "./assets/models/YourModel.vrm"
  }
}
```

その他の設定はそのままでも動きます。[設定の詳細](#設定)を参照してください。

### 4. ビルド

```bash
npm run build:electron
```

### 5. 音声合成エンジンを起動

VOICEVOX 互換の音声合成エンジンを起動しておきます。起動確認：

```bash
# VOICEVOX の場合（デフォルト: 50021番ポート）
curl http://127.0.0.1:50021/version

# AivisSpeech の場合（デフォルト: 10101番ポート）
curl http://127.0.0.1:10101/version
```

### 6. VRM ウィンドウを起動

```bash
npm run start:electron
```

透過ウィンドウが表示され、キャラクターが画面に現れます。

### 7. MCP クライアントに登録

AI ツールの設定ファイルに以下を追加します。

**Claude Desktop の場合**
設定ファイルの場所:
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "desktop-mascot-mcp": {
      "command": "node",
      "args": ["/path/to/desktop-mascot-mcp/dist/index.js"],
      "env": {
        "VOICEVOX_SPEAKER_ID": "888753760",
        "VOICEVOX_BASE_URL": "http://127.0.0.1:10101"
      }
    }
  }
}
```

`/path/to/desktop-mascot-mcp/` を実際のパスに変更してください。
Windows の例: `C:/Users/yourname/desktop-mascot-mcp/dist/index.js`

**Cursor / その他の MCP 対応ツール**

各ツールの MCP サーバー設定に同じ `command` / `args` / `env` を指定してください。

### 8. AI ツールを再起動

設定を反映するため AI ツールを再起動します。MCP サーバーが自動的に起動します。

---

## 💬 使い方

### キャラクターに喋らせる

AI ツールのチャットで会話すると、カスタム命令の設定次第でキャラクターが自動的に反応します。

**カスタム命令の設定例（Claude Desktop のプロジェクト設定など）**

```
ユーザーに返答した後、必ず speak ツールを呼び出してください。
- text: 返答内容（日本語）
- emotion: 感情（neutral / happy / sad / angry / surprised / relaxed）
- animation: ジェスチャー（wave / nod / shake / think / clap など）
```

### `speak` ツールのパラメータ

| パラメータ | 必須 | 説明 |
|---|---|---|
| `text` | ✅ | 読み上げるテキスト |
| `emotion` | - | 表情（neutral / happy / sad / angry / surprised / relaxed） |
| `animation` | - | アニメーション名（animations.json で定義したもの） |

### ウィンドウ操作

| 操作 | 動作 |
|---|---|
| マウスドラッグ | カメラ回転 |
| マウスホイール | ズーム |
| ウィンドウドラッグ | ウィンドウ移動 |

カメラ位置・ウィンドウ位置は自動保存され、次回起動時に復元されます。

---

<a id="設定"></a>

## ⚙️ 設定

`config.json` で各種設定を変更できます。変更後は `npm run build:electron` でビルドしてください。

```json
{
  "vrm": {
    "modelPath": "./assets/models/YourModel.vrm"
  },
  "animations": {
    "configPath": "./assets/animations/animations.json"
  },
  "camera": {
    "position": { "x": 0, "y": 1.3, "z": -1.5 },
    "lookAt":   { "x": 0, "y": 1.2, "z": 0 },
    "fov": 45
  },
  "window": {
    "storagePrefix": "desktop-mascot"
  }
}
```

**カメラ設定のヒント**: `camera.lookAt.y` をモデルの顔の高さに合わせると、顔がウィンドウ中央に映ります。

### 環境変数

| 変数名 | デフォルト | 説明 |
|---|---|---|
| `VOICEVOX_BASE_URL` | `http://127.0.0.1:10101` | 音声合成 API の URL |
| `VOICEVOX_SPEAKER_ID` | `888753760` | 話者 ID（エンジンごとに異なります） |

話者 ID は使用する音声合成エンジンの UI や API で確認してください。

**各エンジンのデフォルト URL**:
| エンジン | URL |
|---|---|
| VOICEVOX | `http://127.0.0.1:50021` |
| AivisSpeech | `http://127.0.0.1:10101` |
| COEIROINK | `http://127.0.0.1:50031` |

### アニメーションの追加

アニメーションは **VRMA 形式**（`.vrma`）を使用します。

#### VRMA ファイルの入手方法

**方法 1: VRMA ファイルを直接ダウンロード（最も手軽）**

[BOOTH](https://booth.pm/) では VRMA ファイルが多数配布・販売されています。

- [VRoid 公式による無料配布](https://vroid.booth.pm/items/5512385)（挨拶・ポーズ等 7 種類）
- その他クリエイターによる配布作品も多数あり

**方法 2: FBX から変換（Mixamo など）**

[Mixamo](https://www.mixamo.com/)（Adobe アカウントがあれば無料）などの FBX アニメーションを VRMA に変換できます。

*方法 2a: CLI ツールで変換（Blender 不要）*

[fbx2vrma-converter](https://github.com/tk256ailab/fbx2vrma-converter) を使うと Node.js だけで変換できます。

```bash
node fbx2vrma-converter.js -i input.fbx -o output.vrma
```

Mixamo からダウンロードする際は:
- Format: **FBX**
- Skin: **Without Skin**（スケルトンのみ）

*方法 2b: Blender で変換*

[Blender](https://www.blender.org/) + [VRM Add-on for Blender](https://vrm-addon-for-blender.info/) を使う方法です。

1. Blender に VRM Add-on をインストール・有効化（`編集` → `プリファレンス` → `アドオン`）
2. `ファイル` → `インポート` → `FBX (.fbx)` で読み込む
3. `ファイル` → `エクスポート` → `VRM Animation (.vrma)` で書き出す

**方法 3: 自分でアニメーションを作成**

- [Blender](https://www.blender.org/) + [VRM Add-on for Blender](https://vrm-addon-for-blender.info/): 無料
- [VRM Posing Desktop](https://store.steampowered.com/app/1895630/VRM_Posing_Desktop/)（Steam）: 有料、操作が簡単

---

#### animations.json に登録

> **アニメーションなしの場合**: アニメーションファイルを用意しない場合、または `idle` アニメーションが登録されていない場合、キャラクターは腕を少し下ろした自然なポーズで表示されます。

VRMA ファイルを `assets/animations/` に置いたら `animations.json` に登録します。

```json
{
  "animations": [
    {
      "name": "wave",
      "file": "wave.vrma",
      "loop": false,
      "fadeTime": 0.3,
      "returnToIdle": true,
      "category": "gesture",
      "description": "手を振る"
    }
  ]
}
```

| フィールド | 説明 |
|---|---|
| `name` | アニメーション名（`speak` ツールの `animation` パラメータで指定する名前） |
| `file` | VRMA ファイル名（`assets/animations/` からの相対パス） |
| `loop` | ループ再生するか |
| `fadeTime` | 次のアニメーションへのフェード時間（秒） |
| `returnToIdle` | 再生後にアイドルアニメーションに戻るか |
| `category` | `gesture` / `idle` のいずれか |

---

## ⚠️ トラブルシューティング

### 音声が再生されない

- 音声合成エンジンが起動しているか確認（ポートはエンジンにより異なります）
- `VOICEVOX_SPEAKER_ID` がエンジンで有効な ID か確認
- MCP サーバーのログを確認:
  - Windows: `%APPDATA%\Claude\logs\mcp-server-desktop-mascot-mcp.log`
  - macOS: `~/Library/Logs/Claude/mcp-server-desktop-mascot-mcp.log`

### キャラクターが表示されない

- `npm run start:electron` で VRM ウィンドウを起動しているか確認
- `config.json` の `vrm.modelPath` が正しいか確認
- ウィンドウの DevTools でエラーを確認（`Ctrl+Shift+I`）

### MCP サーバーが認識されない

- `dist/index.js` が存在するか確認（`npm run build:electron` を実行）
- 設定ファイルの JSON が正しいか確認（末尾カンマなどに注意）
- AI ツールを完全に再起動

### アニメーションが動かない

- VRMA ファイルが `assets/animations/` に存在するか確認
- `animations.json` のファイル名と実ファイル名が一致しているか確認
- DevTools コンソールで `[desktop-mascot-mcp] Found N animation configs` のログを確認

---

## 📄 ライセンス

ソースコードは **MIT License** で提供されます。詳細は [LICENSE.md](LICENSE.md) を参照してください。

> **アセットについて**: VRM モデルやアニメーションファイルはリポジトリに含まれていません。
> ご自身でご用意のファイルは、それぞれの配布ライセンスに従ってご利用ください。

---

## 🙏 謝辞

- [VOICEVOX](https://voicevox.hiroshiba.jp/) / [AivisSpeech](https://aivis-project.com/) - 音声合成エンジン
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP SDK
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) - VRM 実装
- [Three.js](https://threejs.org/) - 3D レンダリング
- [Mixamo](https://www.mixamo.com/) - アニメーションデータ
