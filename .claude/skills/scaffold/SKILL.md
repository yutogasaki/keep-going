# /scaffold - コンポーネント/ページ雛形生成

プロジェクト規約に沿った雛形を生成する。

## 引数パターン

- `/scaffold page ページ名` → 新ページコンポーネント生成
- `/scaffold component コンポーネント名` → 共有コンポーネント生成
- `/scaffold modal モーダル名` → createPortalモーダル生成

## プロジェクト規約（自動適用）

- インラインstyle中心（`style={{ }}` で記述）
- フォント: `fontFamily: "'Noto Sans JP', sans-serif"`
- カラーパレット: `#2D3436`(テキスト), `#2BBAA0`(プライマリ), `#E17055`(危険), `#8B5CF6`(紫), `#8395A7`(グレー)
- borderRadius: 10〜20px
- TypeScript + React FC（interface でprops定義）
- アニメーション: `framer-motion` の `motion.div`
- アイコン: `lucide-react` から個別import
- モーダル: `createPortal(jsx, document.body)`
- `AnimatePresence` でフェード

## 手順

1. 引数からタイプと名前を取得
2. 対応するテンプレートで雛形を生成
3. 適切なディレクトリに配置:
   - page → `src/pages/`
   - component → `src/components/`
   - modal → `src/components/`
4. 生成したファイルを報告
