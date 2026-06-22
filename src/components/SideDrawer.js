import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Alert,
    Platform,
    StatusBar,
    Clipboard,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
import { getPatientInfo, getDoctorInfo, clearAllData } from '../api/database';
import { useData } from '../context/DataContext';
import { Colors } from '../styles/theme';


const { width, height } = Dimensions.get('window');

const SideDrawer = (props) => {
    const { userData, userRole } = useData();
    const [patient, setPatient] = useState(null);
    const activeRouteIndex = props.state.index;
    const activeRouteName = props.state.routeNames[activeRouteIndex];

    useEffect(() => {
        const fetchUserData = async () => {
            let data = null;
            if (userData) {
                data = userData;
            } else {
                if (userRole === 'doctor') {
                    data = await getDoctorInfo();
                } else {
                    data = await getPatientInfo();
                }
            }
            setPatient(data);
        };
        fetchUserData();
    }, [userData, userRole]);

    const getMenuItems = () => {
        if (userRole === 'distributor') {
            return [
                { label: 'Dashboard', icon: 'view-dashboard-outline', screen: 'DistributorHome', color: '#10B981' },
                { label: 'Product Catalog', icon: 'shopping-outline', screen: 'ProductCatalog', color: '#8B5CF6' },
                { label: 'Business Reports', icon: 'chart-bar', screen: 'DistributorReports', color: '#F59E0B' },
                { label: 'Help & Support', icon: 'help-circle-outline', screen: 'SupportQuery', color: '#3B82F6' },
                { label: 'Stock Orders', icon: 'package-variant-closed', screen: 'MyOrders', color: '#6366F1' },
            ];
        }
        return [
            { label: 'Product Catalog', icon: 'shopping-outline', screen: 'ProductCatalog', color: '#8B5CF6' },
            { label: 'Add Machine', icon: 'plus-circle-outline', screen: 'AddMachine', color: '#EC4899' },
            { label: 'Cloud Analysis', icon: 'chart-box-outline', screen: 'Graphs', color: '#10B981' },
            { label: 'Machine Settings', icon: 'cog-outline', screen: 'UpdateMachineSetting', color: '#F59E0B' },
            { label: 'Help & Support', icon: 'help-circle-outline', screen: 'SupportQuery', color: '#3B82F6' },
            { label: 'My Orders', icon: 'package-variant-closed', screen: 'MyOrders', color: '#6366F1' },
            { label: 'Download PDF', icon: 'file-download-outline', screen: 'DownloadPdf', color: '#EF4444' },
        ];
    };

    const menuItems = getMenuItems();


    const handleLogout = () => {
        Alert.alert(
            "Terminate Session",
            "Are you sure you want to exit the AirSine ecosystem?",
            [
                { text: "STAY", style: "cancel" },
                {
                    text: "LOGOUT",
                    onPress: async () => {
                        try {
                            await clearAllData();
                            props.navigation.replace('Login');
                        } catch (err) {
                            props.navigation.replace('Login');
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    // Use actual referral_code from profile data
    const referralCode = userData?.referral_code || patient?.referral_code || '—';

    const handleCopyReferral = () => {
        if (referralCode === '—') return;
        Clipboard.setString(referralCode);
        Alert.alert('✅ Copied!', `Referral code "${referralCode}" copied to clipboard.`);
    };

    // Role label & color
    const getRoleInfo = () => {
        switch (userRole) {
            case 'doctor': return { label: 'Doctor', color: '#3B82F6', bg: 'rgba(59,130,246,0.18)', icon: 'stethoscope' };
            case 'distributor': return { label: 'Distributor', color: '#F59E0B', bg: 'rgba(245,158,11,0.18)', icon: 'store-outline' };
            default: return { label: 'Patient', color: '#10B981', bg: 'rgba(16,185,129,0.18)', icon: 'account-heart-outline' };
        }
    };
    const roleInfo = getRoleInfo();

    return (
        <View style={styles.container}>
            {/* High-End Vector Background Pattern Mockup using Gradients */}
            <View style={styles.bakedBackground}>
                <View style={[styles.orb, { top: -50, left: -50, backgroundColor: '#51827633' }]} />
                <View style={[styles.orb, { bottom: -100, right: -50, backgroundColor: '#47776a22' }]} />
            </View>

            {/* ── Modern Profile Header ── */}
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={['#2D5049', '#518276', '#47776a']}
                    style={styles.headerCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1.2 }}
                >
                    {/* Top-left shimmer */}
                    <View style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
                        borderTopLeftRadius: 20, borderTopRightRadius: 20,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                    }} />

                    {/* Decorative circles */}
                    <View style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                    <View style={{ position: 'absolute', bottom: -30, left: -10, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.04)' }} />

                    {/* Role Badge — top-right corner */}
                    <View style={[styles.roleBadgeCorner, { backgroundColor: roleInfo.bg, borderColor: roleInfo.color + '55' }]}>
                        <Icon name={roleInfo.icon} size={10} color={'#FFFFFF'} />
                        <Text style={[styles.roleText, { color: '#FFFFFF' }]}>{roleInfo.label}</Text>
                    </View>

                    {/* Avatar + Name + Email (compact single block) */}
                    <View style={styles.profileContainer}>
                        <View style={styles.avatarGlow}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={require('../assets/img/logo1.png')}
                                    style={styles.avatar}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>

                        <View style={styles.headerInfo}>
                            {/* Name */}
                            <Text style={styles.userName} numberOfLines={1}>
                                {(userData?.name || patient?.name) || 'Authorized User'}
                            </Text>

                            {/* Email inline with Gmail icon */}
                            <View style={styles.emailInlineRow}>
                                <View style={styles.gmailIconWrap}>
                                    <Icon name="gmail" size={10} color="#EA4335" />
                                </View>
                                <Text style={styles.userEmail} numberOfLines={1}>
                                    {(userData?.email || patient?.email) || 'id not found'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Referral Code */}
                    <TouchableOpacity
                        style={styles.referralRow}
                        onPress={handleCopyReferral}
                        activeOpacity={0.75}
                    >
                        <View style={styles.referralLeft}>
                            <Icon name="ticket-percent-outline" size={13} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.referralLabel}>Ref. Code</Text>
                        </View>
                        <View style={styles.referralCodeWrap}>
                            <Text style={styles.referralCode}>{referralCode}</Text>
                            <Icon name="content-copy" size={12} color="#10B981" style={{ marginLeft: 5 }} />
                        </View>
                    </TouchableOpacity>
                </LinearGradient>
            </View>

            {/* Menu Navigation */}
            <DrawerContentScrollView
                {...props}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.menuTitleContainer}>
                    <Text style={styles.menuSectionTitle}>MAIN NAVIGATION</Text>
                </View>

                {menuItems.map((item, index) => (
                    <ModernMenuItem
                        key={index}
                        item={item}
                        index={index}
                        isActive={activeRouteName === item.screen} // Logical highlighting
                        onPress={() => props.navigation.navigate(item.screen)}
                    />
                ))}

                {/* Promotional Card */}
                <TouchableOpacity style={styles.promoCard} activeOpacity={0.9}>
                    <LinearGradient
                        colors={['rgba(81, 130, 118, 0.1)', 'rgba(71, 119, 106, 0.05)']}
                        style={styles.promoGradient}
                    >
                        <Icon name="rocket-launch-outline" size={24} color="#518276" />
                        <View style={styles.promoTextContainer}>
                            <Text style={styles.promoTitle}>Cloud Sync Active</Text>
                            <Text style={styles.promoSub}>Your data is synchronized</Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </DrawerContentScrollView>

            {/* Premium Logout Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <View style={styles.logoutContent}>
                        <View style={styles.logoutIconBg}>
                            <Icon name="power-settings" size={20} color="#E11D48" />
                        </View>
                        <Text style={styles.logoutLabel}>End Session</Text>
                    </View>
                    <Icon name="chevron-right" size={22} color="#E11D48" style={styles.logoutChevron} />
                </TouchableOpacity>
                <Text style={styles.versionText}>v2.4.0 • Enterprise Edition</Text>
            </View>
        </View>
    );
};

const ModernMenuItem = ({ item, index, isActive, onPress }) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(-20);

    useEffect(() => {
        opacity.value = withDelay(index * 80 + 200, withSpring(1));
        translateX.value = withDelay(index * 80 + 200, withSpring(0, { damping: 12 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateX: translateX.value }, { scale: scale.value }],
    }));

    return (
        <Animated.View style={[styles.menuItemWrapper, animatedStyle]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={() => (scale.value = withSpring(0.97))}
                onPressOut={() => (scale.value = withSpring(1))}
                activeOpacity={1}
                style={[
                    styles.menuItem,
                    isActive && styles.activeMenuItem
                ]}
            >
                <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                    <Icon name={item.icon} size={22} color={isActive ? '#FFFFFF' : item.color} />
                </View>
                <Text style={[styles.menuLabel, isActive && styles.activeMenuLabel]}>
                    {item.label}
                </Text>
                {isActive && (
                    <View style={styles.activeIndicator} />
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    bakedBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
    },
    orb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.15,
    },
    headerWrapper: {
        paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24) + 10,
        paddingHorizontal: 12,
        paddingBottom: 0,
    },
    headerCard: {
        borderRadius: 18,
        padding: 12,
        elevation: 12,
        shadowColor: '#2D5049',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        overflow: 'hidden',
        
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    avatarGlow: {
        padding: 3,
        backgroundColor: 'rgba(255,255,255,0.25)',
        borderRadius: 35,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#f6f4f4ff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 50,
    },
    headerInfo: {
        marginLeft: 12,
        flex: 1,
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
    roleBadgeCorner: {
        position: 'absolute',
        top: 4,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 7,
        paddingVertical: 3,
        gap: 4,
        zIndex: 10,
    },
    roleText: {
        fontSize: 7,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    emailInlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 3,
        gap: 4,
    },
    gmailIconWrap: {
        width: 16,
        height: 16,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userEmail: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '500',
        flex: 1,
    },
    referralRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.18)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    referralLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    referralLabel: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    referralCodeWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16,185,129,0.15)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.35)',
    },
    referralCode: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },


    scrollContent: {
        paddingHorizontal: 12,
        paddingTop: 0,
    },
    menuTitleContainer: {
        marginTop: 10,
        marginBottom: 6,
        paddingLeft: 4,
    },
    menuSectionTitle: {
        fontSize: 9,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1,
    },
    menuItemWrapper: {
        marginBottom: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'transparent', // Cleaner look
    },
    activeMenuItem: {
        backgroundColor: 'rgba(81, 130, 118, 0.1)', // Light tint instead of solid green for less visual weight
        borderWidth: 0.5,
        borderColor: 'rgba(81, 130, 118, 0.2)',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    menuLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        flex: 1,
    },
    activeMenuLabel: {
        color: '#518276',
        fontWeight: '800',
    },
    activeIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#518276',
    },
    promoCard: {
        marginTop: 15,
        borderRadius: 16,
        overflow: 'hidden',
    },
    promoGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(241, 130, 118, 0.05)',
    },
    promoTextContainer: {
        marginLeft: 10,
    },
    promoTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#518276',
    },
    promoSub: {
        fontSize: 9,
        color: '#94A3B8',
    },
    footer: {
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 35, // Balanced height
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFF1F2', // Soft Rose tint
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFE4E6',
        elevation: 2,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    logoutContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    logoutIconBg: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    logoutLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#E11D48', // Deep Rose for premium feel
        letterSpacing: 0.3,
    },
    logoutChevron: {
        opacity: 0.4,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 15, // Space between button and text
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default SideDrawer;
