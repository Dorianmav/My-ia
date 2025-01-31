import React, { useState } from 'react';
import PropTypes from 'prop-types';

const CopyButton = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        position: 'absolute',
        right: '10px',
        top: '10px',
        padding: '5px 10px',
        background: '#f0f0f0',
        border: '1px solid #ddd',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

CopyButton.propTypes = {
  code: PropTypes.string.isRequired
};

export default CopyButton;
