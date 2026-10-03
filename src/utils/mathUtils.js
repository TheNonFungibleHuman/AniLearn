import katex from 'katex';

/**
 * Sanitizes math text by fixing common LLM quirks:
 * - Unwraps pseudo-math percentages: "$100%$" -> "100%"
 * - Fixes unescaped % inside LaTeX math mode: "$P = 100%$" -> "$P = 100\%$"
 * - Auto-wraps raw LaTeX formulas (with \frac, \cdot, exponents) in $...$ if missing delimiters
 */
export function sanitizeMathText(text) {
  if (!text || typeof text !== 'string') return '';

  // 1. Unwrap pure numbers or percentages inside dollar signs:
  // e.g. "$100%$" -> "100%", "$99.9%$" -> "99.9%"
  let cleaned = text.replace(/\$\s*([0-9]+(?:\.[0-9]+)?%)\s*\$/g, '$1');

  // 2. Fix unclosed or lone $ before a percentage like "$100%."
  cleaned = cleaned.replace(/\$([0-9]+(?:\.[0-9]+)?%)(?!\$)/g, '$1');

  // 3. Escape any unescaped % inside math expressions ($...$ or $$...$$) so KaTeX doesn't treat % as comment
  cleaned = cleaned.replace(/(\$\$?[\s\S]+?\$\$?)/g, (match) => {
    return match.replace(/(?<!\\)%/g, '\\%');
  });

  // 4. If a formula or text snippet contains raw LaTeX macros (\frac, \cdot, \lambda, \theta)
  // or math subscript/superscript without delimiters, wrap in $...$
  if (!cleaned.includes('$')) {
    const hasLatexMacro = /\\[a-zA-Z]+/.test(cleaned);
    const hasMathScript = /(\^[0-9a-zA-Z+_-]+|[a-zA-Z]_[0-9a-zA-Z])/.test(cleaned);
    if ((hasLatexMacro || hasMathScript) && cleaned.length < 160 && !cleaned.includes('\n')) {
      cleaned = `$${cleaned}$`;
    }
  }

  return cleaned;
}

/**
 * Renders a single formula string to HTML using KaTeX.
 * Safe fallback to plain text if invalid syntax.
 */
export function formatFormulaForDisplay(formula) {
  if (!formula || typeof formula !== 'string') return '';
  let cleaned = sanitizeMathText(formula.trim());

  // Strip math delimiters if present for direct katex rendering
  if (cleaned.startsWith('$$') && cleaned.endsWith('$$')) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('$') && cleaned.endsWith('$')) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  try {
    return katex.renderToString(cleaned, {
      displayMode: false,
      throwOnError: false,
      strict: false
    });
  } catch (err) {
    console.warn('KaTeX rendering fallback:', err);
    return formula;
  }
}
