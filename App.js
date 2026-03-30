import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import MainNavigation from './src/navigations/MainNavigation';
import { setupDatabase } from './src/api/database';
import { Colors } from './src/styles/theme';
import { DataProvider } from './src/context/DataContext';

const App = () => {
  useEffect(() => {
    setupDatabase();
  }, []);

  return (
    <DataProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <MainNavigation />
      </NavigationContainer>
    </DataProvider>
  );
};

export default App;
