// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// import HomeScreen from '../screens/HomeScreen';
// import ReportsScreen from '../screens/ReportsScreen';
// import HistoryScreen from '../screens/HistoryScreen';
// import ProfileScreen from '../screens/ProfileScreen';
// import Icon from 'react-native-vector-icons/MaterialIcons';

// const Tab = createBottomTabNavigator();

// const ButtonTab = () => {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         headerShown: false,
//         tabBarActiveTintColor: '#0066FF',
//         tabBarInactiveTintColor: '#7B8D9E',
//         tabBarStyle: {
//           backgroundColor: '#FFFFFF',
//           borderTopWidth: 1,
//           borderTopColor: '#F0F2F5',
//           height: 95,
//           paddingBottom: 10,
//         },
//       }}
//     >
//       <Tab.Screen
//         name="Home"
//         component={HomeScreen}
//         options={{
//           tabBarIcon: ({ color, size }) => (
//             <Icon name="dashboard" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Reports"
//         component={ReportsScreen}
//         options={{
//           tabBarIcon: ({ color, size }) => (
//             <Icon name="insert-chart" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="History"
//         component={HistoryScreen}
//         options={{
//           tabBarIcon: ({ color, size }) => (
//             <Icon name="history" size={size} color={color} />
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Profile"
//         component={ProfileScreen}
//         options={{
//           tabBarIcon: ({ color, size }) => (
//             <Icon name="person" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tab.Navigator>
//   );
// };

// export default ButtonTab;
