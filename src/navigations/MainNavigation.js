import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../styles/theme';

import LoginScreen from '../screens/LoginScreen';
import MachineSelectionScreen from '../screens/MachineSelectionScreen';
import ImportLogScreen from '../screens/ImportLogScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProductCatalogScreen from '../screens/ProductCatalogScreen';
import GraphScreen from '../screens/GraphScreen';
import ReportPreviewScreen from '../screens/ReportPreviewScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SplashScreen from '../screens/SplaceScreen';
import CreateUser from '../screens/CreateUser';
import ForgotPassword from '../screens/ForgotPassword';
import UpdateMachineSetting from '../screens/UpdateMachineSetting';
import AddMachineScreen from '../screens/AddMachineScreen';
import SideDrawer from '../components/SideDrawer';
import SupportQueryScreen from '../screens/SupportQueryScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

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
                    height: 65 + insets.bottom,
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
                name="Upload"
                component={MachineSelectionScreen}
                options={{
                    tabBarButton: (props) => (
                        <TouchableOpacity
                            {...props}
                            style={{
                                top: -25,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={{
                                width: 68,
                                height: 68,
                                backgroundColor: Colors.primary,
                                borderRadius: 34,
                                justifyContent: 'center',
                                alignItems: 'center',
                                elevation: 8,
                                shadowColor: Colors.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.4,
                                shadowRadius: 8,
                                borderWidth: 4,
                                borderColor: '#FFFFFF',
                            }}>
                                <Icon name="file-pdf-box" size={26} color="#FFF" style={{ marginBottom: -2 }} />
                                <Text style={{ 
                                    color: '#FFF', 
                                    fontWeight: '900', 
                                    fontSize: 9, 
                                    letterSpacing: 0.5,
                                    textTransform: 'uppercase'
                                }}>Upload</Text>
                            </View>
                        </TouchableOpacity>
                    ),
                    tabBarLabel: '',
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

const DrawerNavigation = () => {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <SideDrawer {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    width: '80%',
                    backgroundColor: 'transparent',
                },
                drawerType: 'front',
            }}
        >
            <Drawer.Screen name="MainTabs" component={MainTabs} />
            <Drawer.Screen name="ProductCatalog" component={ProductCatalogScreen} />
            <Drawer.Screen name="SupportQuery" component={SupportQueryScreen} />
            <Drawer.Screen name="MyOrders" component={MyOrdersScreen} />
        </Drawer.Navigator>
    );
};

const MainNavigation = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="CreateUser" component={CreateUser} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            <Stack.Screen name="ProfileSetup" component={ProfileScreen} />
            <Stack.Screen name="MainTabs" component={DrawerNavigation} />
            <Stack.Screen name="ProductCatalog" component={ProductCatalogScreen} />

            <Stack.Screen name="MachineSelection" component={MachineSelectionScreen} />
            <Stack.Screen name="ImportLog" component={ImportLogScreen} />
            <Stack.Screen name="Graphs" component={GraphScreen} />
            <Stack.Screen name="UpdateMachineSetting" component={UpdateMachineSetting} />
            <Stack.Screen name="AddMachine" component={AddMachineScreen} />
            <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
        </Stack.Navigator>
    );
};

export default MainNavigation;

