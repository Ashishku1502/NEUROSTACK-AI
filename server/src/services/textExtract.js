async function extractText(file) {
  const name = (file.originalname || '').toLowerCase();
  if (file.mimetype === 'application/pdf' || name.endsWith('.pdf')) {
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    const result = await pdfParse(file.buffer);
    return result.text;
  }
  if (/\.(txt|md|markdown|csv|json)$/.test(name) || (file.mimetype || '').startsWith('text/')) {
    return file.buffer.toString('utf8');
  }
  throw new Error('Unsupported file type. Upload a PDF, TXT, or MD file.');
}

module.exports = { extractText };
