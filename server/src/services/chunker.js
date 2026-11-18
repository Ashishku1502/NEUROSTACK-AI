// Splits text into ~size character chunks on paragraph/sentence boundaries, with overlap.
function tail(s, n) {
  if (!s || n <= 0) return '';
  const t = s.slice(-n);
  const i = t.indexOf(' ');
  return (i > 0 ? t.slice(i + 1) : t) + ' ';
}

function chunkText(text, { size = 900, overlap = 150 } = {}) {
  const clean = String(text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!clean) return [];

  const chunks = [];
  let cur = '';
  const flush = () => {
    if (cur.trim()) chunks.push(cur.trim());
  };

  for (const para of clean.split(/\n\n+/)) {
    if (para.length > size) {
      const sentences = para.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) || [para];
      for (const s of sentences) {
        if ((cur + s).length > size) {
          flush();
          cur = tail(cur, overlap) + s;
        } else {
          cur += s;
        }
        while (cur.length > size * 1.5) {
          chunks.push(cur.slice(0, size).trim());
          cur = cur.slice(size - overlap);
        }
      }
    } else if (cur && (cur + '\n\n' + para).length > size) {
      flush();
      cur = tail(cur, overlap) + para;
    } else {
      cur = cur ? cur + '\n\n' + para : para;
    }
  }
  flush();
  return chunks;
}

module.exports = { chunkText };
