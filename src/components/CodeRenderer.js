import React from 'react';
import PropTypes from 'prop-types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import MermaidDiagram from './MermaidDiagram';
import CopyButton from './CopyButton';

const CodeRenderer = ({ node, inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const code = String(children).replace(/\n$/, '');

  if (match && match[1] === 'mermaid') {
    return <MermaidDiagram code={code} />;
  }

  return !inline && match ? (
    <div style={{ position: 'relative' }}>
      <CopyButton code={code} />
      <SyntaxHighlighter
        {...props}
        style={vs}
        language={match[1]}
        PreTag="div"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code {...props} className={className}>
      {children}
    </code>
  );
};

CodeRenderer.propTypes = {
  node: PropTypes.object,
  inline: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

export default CodeRenderer;
