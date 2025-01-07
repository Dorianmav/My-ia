import React, { useState, useRef } from 'react';
import './FileReader.css';

const FileReader = ({ onComponentGenerated }) => {
    const [selectedFile, setSelectedFile] = useState('');
    const [generatedComponent, setGeneratedComponent] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file.name);
            setGeneratedComponent(null);
        }
    };

    const generateComponentFromContent = (content) => {
        // Convert content to a valid component name with uppercase first letter
        const componentName = selectedFile
            .replace('.txt', '')
            .split(/[^a-zA-Z0-9]/g) // Split on non-alphanumeric characters
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');

        // Create the component code
        const componentCode = `
import React from 'react';
import './GeneratedComponent.css';

const ${componentName} = () => {
    return (
        <div className="generated-component">
            ${content}
        </div>
    );
};

export default ${componentName};`;

        return { componentName, componentCode };
    };

    const handleValidateFile = () => {
        if (!selectedFile) {
            alert('Please select a file first');
            return;
        }

        const file = fileInputRef.current.files[0];
        const reader = new window.FileReader();

        reader.onload = (e) => {
            const content = e.target.result;
            const { componentName, componentCode } = generateComponentFromContent(content);
            
            // Create a new file for the component
            const fileName = `${componentName}.js`;
            
            // Call the callback with the generated component code and file name
            if (onComponentGenerated) {
                onComponentGenerated(fileName, componentCode);
            }
            
            setGeneratedComponent(fileName);
        };

        reader.onerror = (e) => {
            alert('Error reading file');
            console.error('File reading error:', e);
        };

        reader.readAsText(file);
    };

    const handleReset = () => {
        setSelectedFile('');
        setGeneratedComponent(null);
        fileInputRef.current.value = '';
    };

    return (
        <div className="file-reader-container">
            <div className="file-selection">
                <input 
                    type="text" 
                    value={selectedFile}
                    placeholder="No file selected"
                    readOnly
                    className="file-name-input"
                />
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".txt"
                    style={{ display: 'none' }}
                />
                <button onClick={handleFileSelect} className="select-button">
                    Choose File
                </button>
                <button 
                    onClick={handleValidateFile} 
                    className="validate-button"
                    disabled={!selectedFile}
                >
                    Generate Component
                </button>
                {generatedComponent && (
                    <button 
                        onClick={handleReset} 
                        className="reset-button"
                    >
                        Reset
                    </button>
                )}
            </div>
            {generatedComponent && (
                <div className="success-message">
                    Component generated successfully: {generatedComponent}
                </div>
            )}
        </div>
    );
};

export default FileReader;
