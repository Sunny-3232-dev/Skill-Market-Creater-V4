// 「この画面の使い方」の項目から、その段へ飛んで枠を一瞬光らせる（.section-flash は index.css）
export const jumpToSection = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  el.classList.remove('section-flash');
  // 同じ段を続けて押しても光るよう、いったん外してから付け直す
  window.setTimeout(() => el.classList.add('section-flash'), 0);
  window.setTimeout(() => el.classList.remove('section-flash'), 1900);
};
