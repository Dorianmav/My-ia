import React, { useEffect, useState, useRef } from 'react';
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

const MermaidDiagram = ({ code }) => {
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState(null);
  const elementId = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        // Clean and validate the code
        const cleanCode = code.trim();
        if (!cleanCode) {
          setError('Empty diagram code');
          return;
        }

        // Reset error state
        setError(null);

        // Try to parse the diagram
        try {
          mermaid.parse(cleanCode);
        } catch (parseError) {
          console.error('Mermaid parse error:', parseError);
          setError(`Parse error: ${parseError.message}`);
          return;
        }

        // Render the diagram
        const { svg } = await mermaid.render(elementId.current, cleanCode);
        setSvgContent(svg);
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        setError(`Rendering error: ${error.message}`);
      }
    };

    // Add a small delay to ensure the DOM is ready
    const timeoutId = setTimeout(() => {
      renderDiagram();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [code]);

  if (error) {
    return (
      <div style={{ 
        margin: '20px 0',
        padding: '10px',
        border: '1px solid #dc3545',
        borderRadius: '4px',
        backgroundColor: '#f8d7da',
        color: '#721c24'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Error rendering diagram:</p>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{error}</pre>
        <div style={{ marginTop: '10px' }}>
          <details>
            <summary>Diagram Source</summary>
            <pre style={{ 
              margin: '10px 0 0 0',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px'
            }}>{code}</pre>
          </details>
        </div>
      </div>
    );
  }

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
      {svgContent && (
        <div 
          style={{ 
            background: '#fff', 
            padding: '10px',
            textAlign: 'center',
            border: '1px solid #eee',
            borderRadius: '4px'
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
};

const MarkdownRenderer = ({ content }) => {
  return (
    <div className="markdown-content" style={{ textAlign: 'left' }}>
      <ReactMarkdown 
        remarkPlugins={[remarkEmoji]} 
        components={{
          code: ({ node, inline, className, children, ...props }) => {
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
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
