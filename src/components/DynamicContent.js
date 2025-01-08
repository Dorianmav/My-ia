import React, { useState, useEffect } from 'react';
import * as Babel from '@babel/standalone';
import './DynamicContent.css';

// Helper function to extract imports and their components
const extractImports = (code) => {
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
    const imports = {};
    let match;

    while ((match = importRegex.exec(code)) !== null) {
        const components = match[1].split(',').map(comp => comp.trim());
        const path = match[2];
        
        if (!imports[path]) {
            imports[path] = new Set();
        }
        
        components.forEach(comp => imports[path].add(comp));
    }

    // Convert to flat array of unique component names
    const componentNames = Array.from(
        new Set(
            Object.values(imports)
                .flatMap(set => Array.from(set))
        )
    );

    return {
        componentNames,
        importPaths: imports
    };
};

// Mock database content with imports
const mockDatabase = {
    'counter': `
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const Counter = () => {
    const [count, setCount] = useState(0);

    const handleIncrement = () => {
        setCount(count + 1);
    };

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-center text-2xl">Compteur</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <div className="text-4xl font-bold">{count}</div>
                <Button 
                    onClick={handleIncrement}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    Ajouter
                </Button>
            </CardContent>
        </Card>
    );
};
`,
    'welcome': `
    import React from 'react';
import './GeneratedComponent.css';

const Welcome = () => {
    return (
        <div className="generated-component">
            <div class="welcome">
                <h1>Welcome to our site!</h1>
                <p>This is a custom welcome message.</p>
            </div>
        </div>
    );
};
`,
    'userTable': `
    import React, { useState } from 'react';
import './UserTable.css';

const initialUsers = [
  { id: 1, name: 'Smith', firstname: 'John' },
  { id: 2, name: 'Johnson', firstname: 'Emma' },
  { id: 3, name: 'Williams', firstname: 'Michael' },
  { id: 4, name: 'Brown', firstname: 'Olivia' },
  { id: 5, name: 'Jones', firstname: 'William' },
  { id: 6, name: 'Garcia', firstname: 'Sofia' },
  { id: 7, name: 'Miller', firstname: 'James' },
  { id: 8, name: 'Davis', firstname: 'Isabella' },
  { id: 9, name: 'Rodriguez', firstname: 'Alexander' },
  { id: 10, name: 'Martinez', firstname: 'Mia' }
];

const UserTable = () => {
  const [users, setUsers] = useState(initialUsers);
  const [newUser, setNewUser] = useState({
    firstname: '',
    name: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newUser.firstname && newUser.name) {
      const newUserId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
      setUsers(prev => [...prev, { ...newUser, id: newUserId }]);
      setNewUser({ firstname: '', name: '' }); // Reset form
    }
  };

  return (
    <div className="user-table-container">
      <h2>User List</h2>
      
      <form className="user-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="firstname"
          placeholder="First Name"
          value={newUser.firstname}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="name"
          placeholder="Last Name"
          value={newUser.name}
          onChange={handleInputChange}
          required
        />
        <button type="submit">Add User</button>
      </form>

      <table className="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>First Name</th>
            <th>Last Name</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.firstname}</td>
              <td>{user.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
`
};

// Mock UI components (in a real app, these would be imported)
const mockComponents = {
    Button: ({ children, onClick, className }) => (
        <button onClick={onClick} className={className}>{children}</button>
    ),
    Card: ({ children, className }) => (
        <div className={`card ${className}`}>{children}</div>
    ),
    CardHeader: ({ children }) => (
        <div className="card-header">{children}</div>
    ),
    CardTitle: ({ children, className }) => (
        <h2 className={className}>{children}</h2>
    ),
    CardContent: ({ children, className }) => (
        <div className={`card-content ${className}`}>{children}</div>
    )
};

const DynamicContent = ({ componentKey }) => {
    const [Component, setComponent] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadComponent = async () => {
            try {
                const componentCode = mockDatabase[componentKey];
                
                if (!componentCode) {
                    throw new Error(`Component '${componentKey}' not found in database`);
                }

                // Extract imports from the component code
                const { componentNames } = extractImports(componentCode);
                console.log('Extracted components:', componentNames);

                // Remove import statements from the code
                const codeWithoutImports = componentCode.replace(/import\s+.*?;/g, '');

                // Transform the code using Babel
                const transformedCode = Babel.transform(codeWithoutImports, {
                    presets: ['react'],
                    filename: 'dynamic.js'
                }).code;

                // Create the component function with all necessary dependencies
                const createComponent = new Function(
                    'React',
                    'useState',
                    ...componentNames,
                    `${transformedCode}; return ${componentKey.charAt(0).toUpperCase() + componentKey.slice(1)};`
                );

                // Get the mock components that were imported
                const importedComponents = componentNames.map(name => mockComponents[name]);

                // Create the component by passing required dependencies
                const DynamicComponent = createComponent(
                    React,
                    useState,
                    ...importedComponents
                );

                setComponent(() => DynamicComponent);
                setError(null);
            } catch (err) {
                console.error('Error loading component:', err);
                setError(`Error loading component: ${err.message}`);
            }
        };

        loadComponent();
    }, [componentKey]);

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!Component) {
        return <div className="loading-message">Loading component...</div>;
    }

    return (
        <div className="dynamic-content">
            <Component />
        </div>
    );
};

export default DynamicContent;
