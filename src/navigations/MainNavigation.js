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
import DownloadPdfScreen from '../screens/DownloadPdfScreen';

// Distributor Isolated Module
import DistributorDashboard from '../distributor/screens/DistributorDashboard';
import DistributorReports from '../distributor/screens/DistributorReports';
import DistributorProductCatalog from '../distributor/screens/DistributorProductCatalog';
import DistributorSupportQuery from '../distributor/screens/DistributorSupportQuery';
import DistributorOrders from '../distributor/screens/DistributorOrders';
import DistributorProfile from '../distributor/screens/DistributorProfile';
import DistributorSideDrawer from '../distributor/components/DistributorSideDrawer';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../context/DataContext';


const DistributorTabs = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: Colors.background,
                    borderRadius: 20,
                    left: 16,
                    right: 16,
                    bottom: insets.bottom > 0 ? insets.bottom + 16 : 24,
                    height: 65,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    borderTopWidth: 1,
                    borderTopColor: Colors.border,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontWeight: '700',
                    fontSize: 10,
                }
            }}
        >
            <Tab.Screen
                name="DistributorHome"
                component={DistributorDashboard}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color }) => (
                        <Icon name="home-variant" size={28} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="DistributorCatalog"
                component={DistributorProductCatalog}
                options={{
                    tabBarLabel: 'Catalog',
                    tabBarIcon: ({ color }) => (
                        <Icon name="shopping" size={26} color={color} />
                    ),
                }}
            />
            {/* <Tab.Screen
                name="QuickStock"
                component={DistributorOrders}
                options={{
                    tabBarButton: (props) => (
                        <TouchableOpacity
                            {...props}
                            style={{
                                top: -22,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={{
                                width: 64,
                                height: 64,
                                backgroundColor: '#10B981',
                                borderRadius: 32,
                                justifyContent: 'center',
                                alignItems: 'center',
                                elevation: 8,
                                shadowColor: '#10B981',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.4,
                                shadowRadius: 8,
                                borderWidth: 4,
                                borderColor: '#FFFFFF',
                            }}>
                                <Icon name="package-variant-plus" size={26} color="#FFF" style={{ marginBottom: -2 }} />
                                <Text style={{ 
                                    color: '#FFF', 
                                    fontWeight: '900', 
                                    fontSize: 8, 
                                    letterSpacing: 0.3,
                                    textTransform: 'uppercase'
                                }}>Stock In</Text>
                            </View>
                        </TouchableOpacity>
                    ),
                    tabBarLabel: '',
                }}
            /> */}
            <Tab.Screen
                name="DistributorReports"
                component={DistributorReports}
                options={{
                    tabBarLabel: 'Reports',
                    tabBarIcon: ({ color }) => (
                        <Icon name="chart-bar" size={26} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="DistributorProfile"
                component={DistributorProfile}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color }) => (
                        <Icon name="account-circle" size={26} color={color} />
                    ),
                }}
            />
            {/* Hidden screens inside Tabs to maintain Bottom Navigation visibility without occupying space */}
            <Tab.Screen
                name="DistributorOrders"
                component={DistributorOrders}
                options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
            />
            <Tab.Screen
                name="DistributorSupport"
                component={DistributorSupportQuery}
                options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
            />
        </Tab.Navigator>
    );
};

const MainTabs = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: Colors.background,
                    borderRadius: 20,
                    left: 16,
                    right: 16,
                    bottom: insets.bottom > 0 ? insets.bottom + 16 : 24,
                    height: 65,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    borderTopWidth: 1,
                    borderTopColor: Colors.border,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    paddingBottom: 8,
                    paddingTop: 8,
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

const DistributorDrawer = () => {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <DistributorSideDrawer {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: { width: '80%', backgroundColor: 'transparent' },
                drawerType: 'front',
            }}
        >
            {/* Dashboard routes to the Tab Navigator's Home screen */}
            <Drawer.Screen name="DistributorHome" component={DistributorTabs} initialParams={{ screen: 'DistributorHome' }} />
            <Drawer.Screen name="DistributorCatalog" component={DistributorTabs} initialParams={{ screen: 'DistributorCatalog' }} />
            <Drawer.Screen name="DistributorReports" component={DistributorTabs} initialParams={{ screen: 'DistributorReports' }} />
            <Drawer.Screen name="DistributorOrders" component={DistributorTabs} initialParams={{ screen: 'DistributorOrders' }} />
            <Drawer.Screen name="DistributorSupport" component={DistributorTabs} initialParams={{ screen: 'DistributorSupport' }} />
            <Drawer.Screen name="DistributorProfile" component={DistributorTabs} initialParams={{ screen: 'DistributorProfile' }} />
        </Drawer.Navigator>
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
            <Drawer.Screen name="DownloadPdf" component={DownloadPdfScreen} />
        </Drawer.Navigator>
    );
};

const AppNavigator = () => {
    const { userRole } = useData();
    return userRole === 'distributor' ? <DistributorDrawer /> : <DrawerNavigation />;
};

const MainNavigation = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="CreateUser" component={CreateUser} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            <Stack.Screen name="ProfileSetup" component={ProfileScreen} />
            <Stack.Screen name="MainTabs" component={AppNavigator} />
            <Stack.Screen name="ProductCatalog" component={ProductCatalogScreen} />

            <Stack.Screen name="MachineSelection" component={MachineSelectionScreen} />
            <Stack.Screen name="ImportLog" component={ImportLogScreen} />
            <Stack.Screen name="Graphs" component={GraphScreen} />
            <Stack.Screen name="UpdateMachineSetting" component={UpdateMachineSetting} />
            <Stack.Screen name="AddMachine" component={AddMachineScreen} />
            <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
            <Stack.Screen name="DistributorReports" component={DistributorReports} />
            <Stack.Screen name="ReportPreviewScreen" component={ReportPreviewScreen} />
        </Stack.Navigator>
    );
};


export default MainNavigation;

