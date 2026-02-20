import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ButtonTab from './src/navigations/ButtonTab';

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <ButtonTab />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;
