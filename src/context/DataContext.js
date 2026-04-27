import React, { createContext, useState, useContext } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [selectedRange, setSelectedRange] = useState(7);
    const [userRole, setUserRole] = useState('patient'); // 'patient', 'doctor', or 'distributor'

    return (
        <DataContext.Provider value={{ selectedRange, setSelectedRange, userRole, setUserRole }}>
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
