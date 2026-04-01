import React from 'react';
import { View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../styles/theme';

import LoginScreen from '../screens/LoginScreen';
import MachineSelectionScreen from '../screens/MachineSelectionScreen';
import ImportLogScreen from '../screens/ImportLogScreen';
import DashboardScreen from '../screens/DashboardScreen';
import GraphScreen from '../screens/GraphScreen';
import ReportPreviewScreen from '../screens/ReportPreviewScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SplashScreen from '../screens/SplaceScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MainTabs = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: Colors.background,
                    borderTopWidth: 1,
                    borderTopColor: Colors.border,
                    height: 65 + insets.bottom, // Dynamic height based on safe area
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                    paddingTop: 8,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                tabBarLabelStyle: {
                    fontWeight: '700',
                    fontSize: 11,
                    marginBottom: insets.bottom > 0 ? 0 : 5,
                }
            }}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="home-variant" size={28} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Logs"
                component={HistoryScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="clipboard-text-clock" size={26} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Reports"
                component={ReportPreviewScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="file-chart" size={26} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="account-circle" size={26} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const MainNavigation = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="MachineSelection" component={MachineSelectionScreen} />
            <Stack.Screen name="ImportLog" component={ImportLogScreen} />
            <Stack.Screen name="Graphs" component={GraphScreen} />
        </Stack.Navigator>
    );
};

export default MainNavigation;
