import React from 'react';
import './DynamicContent.css';

const DynamicContent = ({ content, fileName }) => {
    return (
        <div className="dynamic-content">
            <div className="content-header">
                <h3>Content from: {fileName}</h3>
                <div className="content-metadata">
                    <span>Lines: {content.split('\n').length}</span>
                    <span>Characters: {content.length}</span>
                </div>
            </div>
            <div className="content-body">
                {content.split('\n').map((line, index) => (
                    <div key={index} className="content-line">
                        <span className="line-number">{index + 1}</span>
                        <span className="line-content">{line}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DynamicContent;
