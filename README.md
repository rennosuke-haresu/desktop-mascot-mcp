# Desktop Mascot MCP

<p align="center">
  <img src="docs/images/screenshot.png" alt="Desktop Mascot MCP screenshot" width="320">
</p>

English | **[日本語](README.ja.md)**

A desktop mascot app that displays a 3D character on your desktop, reacting to your AI tool's responses with **voice, lip-sync, expressions, and gestures** via MCP (Model Context Protocol).

---

## What is this?

An **MCP server** is a program that extends AI tools (Claude Desktop, Cursor, etc.) with new capabilities. By integrating this project, your AI tool can call the `speak` command to make a 3D character talk and animate in response.

```
You → AI tool → speak command → Character responds with voice & animation
```

> Learn more about MCP: [Model Context Protocol](https://modelcontextprotocol.io/)

---

## ✨ Features

- **Voice synthesis**: Playback via VOICEVOX-compatible APIs (VOICEVOX / AivisSpeech / COEIROINK, etc.)
- **Lip-sync**: Natural mouth movement synchronized with speech
- **Expressions**: 6 emotion types (neutral / happy / sad / angry / surprised / relaxed)
- **Gestures**: VRMA animation support (wave / nod / shake / think, etc.)
- **Idle animations**: Randomly plays animations when idle
- **Transparent window**: Always-on-top window that blends into your desktop
- **State persistence**: Camera and window positions are saved automatically

---

## 📋 Requirements

| Requirement | Where to get |
|---|---|
| Node.js 18+ | [nodejs.org](https://nodejs.org/) |
| Git | [git-scm.com](https://git-scm.com/) |
| MCP-compatible AI tool | [Claude Desktop](https://claude.ai/download), etc. |
| VOICEVOX-compatible TTS engine | [VOICEVOX](https://voicevox.hiroshiba.jp/) / [AivisSpeech](https://aivis-project.com/), etc. |
| VRM model file (.vrm) | See below |

### Getting a VRM model

No VRM model is included in this repository. Please prepare your own.

Free model examples:
- [Niconi Solid "Alicia Solid"](https://3d.nicovideo.jp/alicia/) - commercially usable
- [VRoid Hub](https://hub.vroid.com/) - check each model's license

---

## 🚀 Setup

### 1. Clone the repository

```bash
git clone https://github.com/rennosuke-haresu/desktop-mascot-mcp.git
cd desktop-mascot-mcp
npm install
```

### 2. Place your VRM model

Put your `.vrm` file in `assets/models/`.

```
desktop-mascot-mcp/
└── assets/
    └── models/
        └── YourModel.vrm   ← place here
```

### 3. Create the config file

Copy `config.example.json` to `config.json`.

```bash
cp config.example.json config.json
```

Open `config.json` and set your VRM model path.

```json
{
  "vrm": {
    "modelPath": "./assets/models/YourModel.vrm"
  }
}
```

Other settings work out of the box. See [Configuration](#configuration) for details.

### 4. Build

```bash
npm run build:electron
```

### 5. Start the TTS engine

Start your VOICEVOX-compatible TTS engine. Verify it's running:

```bash
# VOICEVOX (default port: 50021)
curl http://127.0.0.1:50021/version

# AivisSpeech (default port: 10101)
curl http://127.0.0.1:10101/version
```

### 6. Launch the VRM window

```bash
npm run start:electron
```

A transparent window will appear with your character on screen.

### 7. Register as an MCP server

Add the following to your AI tool's config file.

**Claude Desktop**

Config file location:
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

Replace `/path/to/desktop-mascot-mcp/` with the actual path.
Windows example: `C:/Users/yourname/desktop-mascot-mcp/dist/index.js`

**Cursor / Other MCP-compatible tools**

Use the same `command` / `args` / `env` in each tool's MCP server settings.

### 8. Restart your AI tool

Restart your AI tool to apply the settings. The MCP server will start automatically.

---

## 💬 Usage

### Making the character speak

When you chat with your AI tool, the character will react automatically depending on your custom instructions.

**Example custom instruction (e.g. Claude Desktop project settings)**

```
After responding to the user, always call the speak tool with:
- text: your response text
- emotion: emotion type (neutral / happy / sad / angry / surprised / relaxed)
- animation: gesture name (wave / nod / shake / think / clap, etc.)
```

### `speak` tool parameters

| Parameter | Required | Description |
|---|---|---|
| `text` | ✅ | Text to speak aloud |
| `emotion` | - | Expression (neutral / happy / sad / angry / surprised / relaxed) |
| `animation` | - | Animation name (as defined in animations.json) |

### Window controls

| Action | Effect |
|---|---|
| Mouse drag | Rotate camera |
| Mouse wheel | Zoom |
| Window drag | Move window |

Camera and window positions are saved automatically and restored on next launch.

---

<a id="configuration"></a>

## ⚙️ Configuration

Edit `config.json` to customize settings. Rebuild with `npm run build:electron` after changes.

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

**Camera tip**: Set `camera.lookAt.y` to the height of your model's face to center it in the window.

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `VOICEVOX_BASE_URL` | `http://127.0.0.1:10101` | TTS API URL |
| `VOICEVOX_SPEAKER_ID` | `888753760` | Speaker ID (varies by engine) |

Check your TTS engine's UI or API to find the correct speaker ID.

**Default URLs by engine**:
| Engine | URL |
|---|---|
| VOICEVOX | `http://127.0.0.1:50021` |
| AivisSpeech | `http://127.0.0.1:10101` |
| COEIROINK | `http://127.0.0.1:50031` |

### Adding animations

Animations use the **VRMA format** (`.vrma`).

#### Getting VRMA files

**Option 1: Download VRMA files directly (easiest)**

[BOOTH](https://booth.pm/) has many VRMA files available for free or purchase.

- [Official VRoid free pack](https://vroid.booth.pm/items/5512385) (greetings, poses, 7 types)
- Many other creator packs available

**Option 2: Convert from FBX (e.g. Mixamo)**

You can convert FBX animations from [Mixamo](https://www.mixamo.com/) (free with an Adobe account) to VRMA.

*Option 2a: Convert via CLI (no Blender needed)*

Use [fbx2vrma-converter](https://github.com/tk256ailab/fbx2vrma-converter) with Node.js only.

```bash
node fbx2vrma-converter.js -i input.fbx -o output.vrma
```

When downloading from Mixamo:
- Format: **FBX**
- Skin: **Without Skin** (skeleton only)

*Option 2b: Convert via Blender*

Use [Blender](https://www.blender.org/) + [VRM Add-on for Blender](https://vrm-addon-for-blender.info/).

1. Install and enable the VRM Add-on in Blender (`Edit` → `Preferences` → `Add-ons`)
2. Import via `File` → `Import` → `FBX (.fbx)`
3. Export via `File` → `Export` → `VRM Animation (.vrma)`

**Option 3: Create your own animations**

- [Blender](https://www.blender.org/) + [VRM Add-on for Blender](https://vrm-addon-for-blender.info/): free
- [VRM Posing Desktop](https://store.steampowered.com/app/1895630/VRM_Posing_Desktop/) (Steam): paid, easier to use

---

#### Register in animations.json

> **No animations?** If no animation files are provided, or if no `idle` animation is registered, the character will stand in a natural resting pose.

Place VRMA files in `assets/animations/` and register them in `animations.json`.

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
      "description": "Wave hand"
    }
  ]
}
```

| Field | Description |
|---|---|
| `name` | Animation name (used as the `animation` parameter in the `speak` tool) |
| `file` | VRMA filename (relative to `assets/animations/`) |
| `loop` | Whether to loop the animation |
| `fadeTime` | Fade duration to the next animation (seconds) |
| `returnToIdle` | Whether to return to idle animation after playback |
| `category` | `gesture` or `idle` |

---

## ⚠️ Troubleshooting

### No audio playback

- Confirm your TTS engine is running (port varies by engine)
- Verify `VOICEVOX_SPEAKER_ID` is valid for your engine
- Check the MCP server log:
  - Windows: `%APPDATA%\Claude\logs\mcp-server-desktop-mascot-mcp.log`
  - macOS: `~/Library/Logs/Claude/mcp-server-desktop-mascot-mcp.log`

### Character not showing

- Confirm the VRM window is running with `npm run start:electron`
- Verify `vrm.modelPath` in `config.json` is correct
- Check for errors in the window's DevTools (`Ctrl+Shift+I`)

### MCP server not recognized

- Confirm `dist/index.js` exists (run `npm run build:electron`)
- Validate your config JSON (watch for trailing commas)
- Fully restart your AI tool

### Animations not playing

- Confirm VRMA files exist in `assets/animations/`
- Check that filenames in `animations.json` match the actual files
- Look for `[desktop-mascot-mcp] Found N animation configs` in the DevTools console

---

## 📄 License

Source code is provided under the **MIT License**. See [LICENSE.md](LICENSE.md) for details.

> **About assets**: VRM models and animation files are not included in this repository.
> Files you provide yourself are subject to their respective distribution licenses.

---

## 🙏 Credits

- [VOICEVOX](https://voicevox.hiroshiba.jp/) / [AivisSpeech](https://aivis-project.com/) - TTS engines
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP SDK
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) - VRM implementation
- [Three.js](https://threejs.org/) - 3D rendering
- [Mixamo](https://www.mixamo.com/) - Animation data
