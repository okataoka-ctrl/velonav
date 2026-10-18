# VeloNav - Cycling GPS PWA Navigation

スマートフォン向けに最適化された、ブラウザベース（PWA）の自転車専用ナビゲーションシステム。

## 主な特徴
- **省電力・屋外視認性:** 有機EL（OLED）完全ブラックUI ＋ Screen Wake Lock制御
- **バックグラウンドGPS維持:** Web Audio Keep-Aliveにより画面スリープ時でも測位と音声ナビを維持
- **ClimbPro対抗登坂アシスト:** ルート内の登坂セグメント自動抽出、斜度別カラーバー、残り獲得標高プレビュー
- **交差点音声案内 (TBT):** 速度連動による3段階音声通知（骨伝導イヤホン最適化）
- **Web Bluetooth (BLE) 連携:** スピード/ケイデンス（CSCS）および心拍計（HRS）のリアルタイム受信
- **Garmin FIT SDK互換:** 走行データをバイナリ.fit形式でローカル保存 & Stravaダイレクトアップロード
- **ルートインポート:** Ride with GPS / Strava URLからの直接取得 & GPXファイル対応

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev -- --host
```

## GitHub Pagesへのデプロイ
`main` ブランチにプッシュすると、GitHub Actionsにより自動的にビルドおよびデプロイが行われます。
