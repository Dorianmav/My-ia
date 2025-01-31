import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import remarkEmoji from 'remark-emoji';
import CodeRenderer from './CodeRenderer';

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-content" style={{ textAlign: 'left' }}>
      <ReactMarkdown 
        remarkPlugins={[remarkEmoji]} 
        components={{
          code: CodeRenderer
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

MarkdownRenderer.propTypes = {
  content: PropTypes.string.isRequired
};

export default MarkdownRenderer;
