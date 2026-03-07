import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import MainNavigation from './src/navigations/MainNavigation';
import { setupDatabase } from './src/api/database';
import { Colors } from './src/styles/theme';

const App = () => {
  useEffect(() => {
    setupDatabase();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <MainNavigation />
    </NavigationContainer>
  );
};

export default App;
