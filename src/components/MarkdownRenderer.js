import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkEmoji from 'remark-emoji';

const CopyButton = ({ code }) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert('Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy code:', err);
      alert('Failed to copy code');
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        position: 'absolute',
        right: '10px',
        top: '10px',
        padding: '4px 8px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
      }}
    >
      Copy
    </button>
  );
};

const MarkdownRenderer = ({ content }) => {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#f4f4f4',
        lineColor: '#555',
        textColor: '#333',
      },
      flowchart: {
        curve: 'basis',
        htmlLabels: true,
        useMaxWidth: false,
      }
    });
    
    try {
      mermaid.contentLoaded();
    } catch (error) {
      console.error('Mermaid rendering error:', error);
    }
  }, [content]);

  return (
    <div className="markdown-content" style={{ textAlign: 'left' }}>
      <ReactMarkdown 
        remarkPlugins={[remarkEmoji]} 
        components={{
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const code = String(children).replace(/\n$/, '');

            if (match && match[1] === 'mermaid') {
              return (
                <div style={{ margin: '20px 0' }}>
                  <div style={{ 
                    position: 'relative',
                    backgroundColor: '#f5f5f5', 
                    padding: '10px', 
                    borderRadius: '4px',
                    marginBottom: '10px',
                  }}>
                    <CopyButton code={code} />
                    <pre style={{ 
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      textAlign: 'left',
                      margin: '0',
                      paddingRight: '50px'
                    }}>
                      {code}
                    </pre>
                  </div>
                  <div className="mermaid" style={{ 
                    background: '#fff', 
                    padding: '10px',
                    textAlign: 'left' 
                  }}>
                    {code}
                  </div>
                </div>
              );
            }

            return !inline && match ? (
              <div style={{ position: 'relative' }}>
                <CopyButton code={code} />
                <SyntaxHighlighter
                  language={match[1]}
                  style={vs}
                  customStyle={{
                    padding: '15px',
                    paddingRight: '50px',
                    borderRadius: '4px',
                    margin: '10px 0',
                    textAlign: 'left'
                  }}
                  {...props}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
