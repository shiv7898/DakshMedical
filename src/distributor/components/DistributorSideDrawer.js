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
    Clipboard,
    Modal,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
} from 'react-native-reanimated';
import { useData } from '../../context/DataContext';
import { clearAllData } from '../../api/database';
import { Colors } from '../../styles/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const DistributorSideDrawer = (props) => {
    const { userData, setToken, setUserData, setUserRole } = useData();
    const insets = useSafeAreaInsets();
    const [logoutVisible, setLogoutVisible] = useState(false);

    const handleLogout = () => {
        setLogoutVisible(true);
    };

    const getActiveRouteName = (state) => {
        const route = state.routes[state.index];
        if (route.state) return getActiveRouteName(route.state);
        return route.name;
    };
    const currentScreen = getActiveRouteName(props.state);

    const referralCode = userData?.referral_code || '—';

    const handleCopyReferral = () => {
        if (referralCode === '—') return;
        Clipboard.setString(referralCode);
        Alert.alert('✅ Copied!', `Referral code "${referralCode}" copied to clipboard.`);
    };

    const menuItems = [
        { label: 'Dashboard', icon: 'view-dashboard-outline', screen: 'DistributorHome', color: '#10B981' },
        { label: 'Business Reports', icon: 'chart-bar', screen: 'DistributorReports', color: '#F59E0B' },
        { label: 'Stock Orders', icon: 'package-variant-closed', screen: 'DistributorOrders', color: '#6366F1' },
        { label: 'Partner Support', icon: 'help-circle-outline', screen: 'DistributorSupport', color: '#3B82F6' },
        { label: 'Business Profile', icon: 'account-tie-outline', screen: 'DistributorProfile', color: '#EC4899' },
    ];

    return (
        <View style={styles.container}>
            {/* High-End Vector Background Pattern Mockup */}
            <View style={styles.bakedBackground}>
                <View style={[styles.orb, { top: -50, left: -50, backgroundColor: '#51827633' }]} />
                <View style={[styles.orb, { bottom: -100, right: -50, backgroundColor: '#47776a22' }]} />
            </View>

            {/* Profile Header */}
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
                        borderTopLeftRadius: 18, borderTopRightRadius: 18,
                        backgroundColor: 'rgba(255,255,255,0.06)',
                    }} />

                    {/* Decorative circles */}
                    <View style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.05)' }} />
                    <View style={{ position: 'absolute', bottom: -30, left: -10, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.04)' }} />

                    {/* Role Badge — top-right corner */}
                    <View style={[styles.roleBadgeCorner, { backgroundColor: 'rgba(245,158,11,0.18)', borderColor: '#F59E0B55' }]}>
                        <Icon name="store-outline" size={10} color={'#FFFFFF'} />
                        <Text style={[styles.roleText, { color: '#FFFFFF' }]}>Distributor</Text>
                    </View>

                    {/* Avatar + Name + Email (compact single block) */}
                    <View style={styles.profileContainer}>
                        <View style={styles.avatarGlow}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={require('../../assets/img/logo1.png')}
                                    style={styles.avatar}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>

                        <View style={styles.headerInfo}>
                            {/* Name */}
                            <Text style={styles.userName} numberOfLines={1}>
                                {userData?.name || 'Authorized Partner'}
                            </Text>

                            {/* Email inline with Gmail icon */}
                            <View style={styles.emailInlineRow}>
                                <View style={styles.gmailIconWrap}>
                                    <Icon name="gmail" size={10} color="#EA4335" />
                                </View>
                                <Text style={styles.userEmail} numberOfLines={1}>
                                    {userData?.email || 'id not found'}
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

            <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.menuTitleContainer}>
                    <Text style={styles.menuSectionTitle}>DISTRIBUTOR CONSOLE</Text>
                </View>
                {menuItems.map((item, index) => (
                    <ModernMenuItem
                        key={index}
                        item={item}
                        index={index}
                        isActive={currentScreen === item.screen}
                        onPress={() => props.navigation.navigate(item.screen)}
                    />
                ))}
            </DrawerContentScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Icon name="power" size={20} color="#E11D48" />
                    <Text style={styles.logoutLabel}>Logout Portal</Text>
                </TouchableOpacity>
                <Text style={styles.versionText}>v2.4.0 • Partner Edition</Text>
            </View>

            {/* Premium Logout Modal */}
            <Modal visible={logoutVisible} transparent animationType="fade">
                <View style={styles.logoutModalOverlay}>
                    <View style={styles.logoutModalCard}>
                        <LottieView
                            source={require('../../assets/animations/Alert Warning Informtion.json')}
                            autoPlay
                            loop
                            style={{ width: 120, height: 120, marginBottom: 10 }}
                        />
                        <Text style={styles.logoutModalTitle}>Logout Portal</Text>
                        <Text style={styles.logoutModalText}>Are you sure you want to exit the distributor console?</Text>
                        
                        <View style={styles.logoutModalActionRow}>
                            <TouchableOpacity style={styles.logoutModalCancelBtn} onPress={() => setLogoutVisible(false)}>
                                <Text style={styles.logoutModalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.logoutModalConfirmBtn} onPress={async () => {
                                setLogoutVisible(false);
                                try {
                                    await clearAllData();
                                    setToken(null);
                                    setUserData(null);
                                    setUserRole('patient');
                                    
                                    props.navigation.reset({
                                        index: 0,
                                        routes: [{ name: 'Login' }],
                                    });
                                } catch (error) {
                                    console.error("Logout Error:", error);
                                }
                            }}>
                                <Text style={styles.logoutModalConfirmText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const ModernMenuItem = ({ item, index, isActive, onPress }) => {
    const opacity = useSharedValue(0);
    const translateX = useSharedValue(-20);

    useEffect(() => {
        opacity.value = withDelay(index * 50, withSpring(1));
        translateX.value = withDelay(index * 50, withSpring(0));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <Animated.View style={[styles.menuItemWrapper, animatedStyle]}>
            <TouchableOpacity onPress={onPress} style={[styles.menuItem, isActive && styles.activeMenuItem]}>
                <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                    <Icon name={item.icon} size={22} color={isActive ? Colors.primary : item.color} />
                </View>
                <Text style={[styles.menuLabel, isActive && styles.activeMenuLabel]}>{item.label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    bakedBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F8FAFC', overflow: 'hidden' },
    orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.15 },
    headerWrapper: { paddingTop: Platform.OS === 'ios' ? 44 : 20, paddingHorizontal: 12, paddingBottom: 0 },
    headerCard: { borderRadius: 18, padding: 12, elevation: 12, shadowColor: '#2D5049', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, overflow: 'hidden', marginTop: 10 },
    profileContainer: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
    avatarGlow: { padding: 3, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 35, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
    avatarContainer: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#f6f4f4ff', justifyContent: 'center', alignItems: 'center', elevation: 8 },
    avatar: { width: 32, height: 32, borderRadius: 50 },
    headerInfo: { marginLeft: 12, flex: 1 },
    userName: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
    roleBadgeCorner: { position: 'absolute', top: 8, right: 10, flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, paddingHorizontal: 3, paddingVertical: 2, gap: 4, zIndex: 10 },
    roleText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
    emailInlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 },
    gmailIconWrap: { width: 16, height: 16, borderRadius: 4, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
    userEmail: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '500', flex: 1 },
    referralRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginTop: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    referralLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    referralLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
    referralCodeWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(16,185,129,0.35)' },
    referralCode: { color: '#10B981', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    scrollContent: { paddingHorizontal: 12, paddingTop: 0 },
    menuTitleContainer: { marginTop: 10, marginBottom: 6, paddingLeft: 4 },
    menuSectionTitle: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
    menuItemWrapper: { marginBottom: 4 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 12, backgroundColor: 'transparent' },
    activeMenuItem: { backgroundColor: 'rgba(81, 130, 118, 0.1)', borderWidth: 0.5, borderColor: 'rgba(81, 130, 118, 0.2)' },
    iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    menuLabel: { fontSize: 14, fontWeight: '600', color: '#475569', flex: 1 },
    activeMenuLabel: { color: Colors.primary, fontWeight: 'bold' },
    footer: { paddingHorizontal: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#FFF1F2', borderRadius: 15, borderWidth: 1, borderColor: '#FFE4E6' },
    logoutLabel: { fontSize: 14, fontWeight: 'bold', color: '#E11D48', marginLeft: 10 },
    versionText: { textAlign: 'center', fontSize: 10, color: '#94A3B8', marginTop: 15, fontWeight: '700' },
    // Logout Modal Styles
    logoutModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    logoutModalCard: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20 },
    logoutModalTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B', marginBottom: 8, textAlign: 'center', letterSpacing: 0.5 },
    logoutModalText: { fontSize: 14, fontWeight: '500', color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    logoutModalActionRow: { flexDirection: 'row', gap: 12, width: '100%' },
    logoutModalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center' },
    logoutModalCancelText: { fontSize: 15, fontWeight: '800', color: '#64748B' },
    logoutModalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#E11D48', alignItems: 'center', shadowColor: '#E11D48', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    logoutModalConfirmText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});

export default DistributorSideDrawer;
