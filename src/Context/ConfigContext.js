import React, { createContext, useContext, useState } from 'react';

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
    const [config, setConfig] = useState({
        // apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3189', // Development URL
        apiUrl: process.env.REACT_APP_API_URL || 'https://studio-api.ipshopy.com', // Production URL
    });

    return (
        <ConfigContext.Provider value={{ config, setConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};

