import React, { createContext, useState, useContext } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [selectedRange, setSelectedRange] = useState(7);
    const [userRole, setUserRole] = useState('patient'); // 'patient', 'doctor', or 'distributor'
    const [token, setToken] = useState(null);
    const [userData, setUserData] = useState(null);
    const [selectedModes, setSelectedModes] = useState([]);

    return (
        <DataContext.Provider value={{ 
            selectedRange, setSelectedRange, 
            userRole, setUserRole,
            token, setToken,
            userData, setUserData,
            selectedModes, setSelectedModes
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
