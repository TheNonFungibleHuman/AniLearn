import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { sanitizeMathText } from '../utils/mathUtils';

export default function MathRenderer({
  content,
  className = '',
  inline = false,
  components = {}
}) {
  if (!content) return null;

  const sanitized = sanitizeMathText(String(content));

  const defaultComponents = {
    p: ({ node, ...props }) => {
      if (inline) {
        return <span className={props.className} {...props} />;
      }
      return <p className={`leading-relaxed ${props.className || ''}`} {...props} />;
    },
    ...components
  };

  return (
    <div className={`math-renderer ${inline ? 'inline' : ''} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }]]}
        components={defaultComponents}
      >
        {sanitized}
      </ReactMarkdown>
    </div>
  );
}
