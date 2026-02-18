# VRMA Animation License

## Adobe Mixamo Animations

このディレクトリに含まれるVRMAアニメーションファイル（`*.vrma`）は、**Adobe Mixamo**から取得し、Blenderで変換したものです。

### 元データソース

- **提供元**: Adobe Mixamo
- **公式サイト**: https://www.mixamo.com/
- **ライセンス**: Adobe Mixamo License

### 利用規約

本アニメーションの使用には、Adobe Mixamoの利用規約が適用されます:
- **規約URL**: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html

### 重要事項

#### ✅ 許可されていること
- 個人・商用プロジェクトでの利用（ロイヤリティフリー）
- プロジェクトへの組み込み（embedded in your project）
- 改変・編集
- クレジット表記不要

#### ❌ 禁止されていること
- **スタンドアロンアセットとしての再配布**（"not redistributing them as standalone assets"）
- アニメーションファイルそのものを販売すること

#### ⚠️ 注意事項
- このアニメーションファイルには**MITライセンスは適用されません**
- 利用者はAdobeと直接ライセンス契約を結ぶ形になります
- 本プロジェクトのソースコード（MITライセンス）とは別のライセンスです

### ライセンスの分離について

このプロジェクトは以下のように**ライセンスが分離**されています:

```
yuichat-mcp/
├── LICENSE.md                     # MIT License（ソースコードのみ）
└── assets/
    └── animations/
        ├── LICENSE.md             # Adobe Mixamoライセンス（このファイル）
        ├── animations.json        # MIT License（設定ファイル）
        └── *.vrma                 # ← これらのファイルに適用
```

---

## アニメーションの取得方法

### 1. Mixamoからダウンロード

1. Mixamoにアクセス: https://www.mixamo.com/
2. Adobeアカウントでログイン（無料）
3. キャラクター選択（任意 - 後で削除するため何でもOK）
4. アニメーション検索（例: "idle", "wave", "nod"）
5. ダウンロード設定:
   - Format: **FBX**
   - Skin: **Without Skin**
   - Frames per second: **30**
   - Keyframe Reduction: **None**

### 2. Blenderで VRM 対応に変換

Mixamoのアニメーション（FBX形式）は、そのままではVRMで使用できません。
Blenderを使ってVRMA形式に変換する必要があります。

#### 必要なツール
- **Blender** 4.0以降: https://www.blender.org/
- **VRM Add-on for Blender**: https://github.com/saturday06/VRM-Addon-for-Blender

#### 変換手順

1. BlenderにVRM Add-onをインストール
2. VRMモデルをインポート
3. MixamoのFBXアニメーションをインポート
4. アニメーションをVRMのボーン構造にリターゲット
5. VRMA形式でエクスポート

詳細な手順は以下を参照:
- VRM公式ドキュメント: https://vrm.dev/

### 3. animations.jsonに登録

変換したVRMAファイルを `assets/animations/` に配置し、`animations.json` に追加:

```json
{
  "animations": [
    {
      "name": "your-animation",
      "file": "your-animation.vrma",
      "loop": false,
      "fadeTime": 0.3,
      "returnToIdle": true,
      "category": "gesture",
      "description": "Your custom animation"
    }
  ]
}
```

---

## 本プロジェクトに含まれるアニメーション

以下のアニメーションはすべてMixamoから取得し、Blender経由でVRMA形式に変換したものです:

| ファイル名 | 元アニメーション | カテゴリ |
|-----------|----------------|---------|
| idle.vrma | Idle | base |
| wave.vrma | Waving | gesture |
| nod.vrma | Yes | gesture |
| shake.vrma | No | gesture |
| think.vrma | Thinking | gesture |
| clap.vrma | Clapping | gesture |
| angry.vrma | Angry Gesture | emotion |
| happy.vrma | Happy Idle | emotion |
| surprised.vrma | Surprised | emotion |
| shy.vrma | Shy | emotion |
| cheer.vrma | Victory | gesture |

---

## クレジット表記（推奨）

本プロジェクトでMixamoアニメーションを使用する場合、以下のクレジット表記を推奨します:

```
Animations: Adobe Mixamo
https://www.mixamo.com/
Converted to VRMA format via Blender
```

---

**最終更新**: 2025-02-18
**規約バージョン**: 2025年2月時点
