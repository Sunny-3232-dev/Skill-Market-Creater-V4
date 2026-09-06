/**
 * スキルマーケットの出品フォームは <strong>〜</strong> で囲んだ部分が太字になる。
 * 本文はプレーンテキストのまま保持し、コピーする直前にここで見出しへタグを付ける。
 *
 * 保存データにタグを含めない理由:
 * - 価格ブロックの解析・再構築（ServiceResult の splitDetailByPrice 等）が
 *   絵文字マーカーの indexOf に依存しており、タグが挟まると位置がずれる
 * - 画面表示は whitespace-pre-wrap の素のテキストなので、タグがそのまま見えてしまう
 * - STEP2 へ本文を渡したときに、各プロンプトへタグが混入する
 */

/**
 * サービス詳細の見出し行に使う記号。
 * ⚠️キャンセル時の注意事項 / 🎯出品者スキル / 📝依頼テンプレート は
 * 出品フォーム上の別項目なので、太字化の対象に含めない。
 */
const HEADING_PREFIXES = ['💭', '✅', '🌟', '📦', '💬', '💰', '🔚', '■'];

/** その行がサービス詳細の見出しか（行頭が見出し記号）。コピー時の太字化と画面プレビューで共有 */
export const isHeadingLine = (line: string): boolean => {
  const trimmed = line.trim();
  return !!trimmed && HEADING_PREFIXES.some(prefix => trimmed.startsWith(prefix));
};

/**
 * 行頭が見出し記号で始まる行を <strong> で囲む。
 * 固定文言ではなく記号で判定するので、見出しを手直ししても効き続ける。
 */
export const decorateHeadings = (text: string): string =>
  text.split('\n').map(line => {
    if (!isHeadingLine(line)) return line;
    const trimmed = line.trim();
    if (trimmed.includes('<strong>')) return line; // 二重付与を防ぐ
    return line.replace(trimmed, `<strong>${trimmed}</strong>`);
  }).join('\n');
