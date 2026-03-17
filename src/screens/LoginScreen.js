import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Keyboard,
    Animated,
    useWindowDimensions,
} from 'react-native';
import { Colors } from '../styles/theme';
import { User, Lock, ArrowRight, ShieldCheck, Activity } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LoginScreen = ({ navigation }) => {
    const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [focusField, setFocusField] = useState(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    // Calculate the usable height excluding system bars
    const AVAILABLE_HEIGHT = SCREEN_HEIGHT - insets.top - insets.bottom;

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const cardScale = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                delay: 100,
                useNativeDriver: true,
            }),
            Animated.spring(cardScale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();

        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    const handleLogin = () => {
        if (!username || !password) {
            Alert.alert('Incomplete Credentials', 'Please enter your username and password to continue.');
            return;
        }

        // Mock login - simplified as per existing logic
        if (username.toLowerCase() === 'a' && password === 'a') {
            navigation.replace('ProfileSetup', { isSetup: true });
        } else {
            Alert.alert('Access Denied', 'Please check your monitoring credentials and try again.');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Dynamic Background Elements */}
            <View style={[styles.bgCircle, styles.circle1, { width: SCREEN_WIDTH * 0.8, height: SCREEN_WIDTH * 0.8 }]} />
            <View style={[styles.bgCircle, styles.circle2, { width: SCREEN_WIDTH * 0.6, height: SCREEN_WIDTH * 0.6 }]} />
            <View style={[styles.bgCircle, styles.circle3, { width: SCREEN_WIDTH * 0.4, height: SCREEN_WIDTH * 0.4 }]} />

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                    >
                        <Animated.View
                            style={[
                                styles.header,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                        >
                            <View style={styles.logoContainer}>
                                <View style={styles.logoPulse}>
                                    <Activity size={38} color="#FFF" strokeWidth={2.5} />
                                </View>
                                <View style={styles.glowEffect} />
                            </View>
                            <Text style={styles.brandName}>AIRSINE</Text>
                            <Text style={styles.brandTagline}>VITAL MONITORING SYSTEMS</Text>
                        </Animated.View>

                        <Animated.View
                            style={[
                                styles.content,
                                {
                                    opacity: fadeAnim,
                                    transform: [
                                        { translateY: slideAnim },
                                        { scale: cardScale }
                                    ]
                                }
                            ]}
                        >
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <ShieldCheck size={20} color={Colors.primary} />
                                    <Text style={styles.cardTitle}>Medical Login</Text>
                                </View>

                                <Text style={styles.cardSubtitle}>Enter your secure credentials to access patient dashboards</Text>

                                <View style={styles.form}>
                                    <View style={[
                                        styles.inputContainer,
                                        focusField === 'user' && styles.inputFocused
                                    ]}>
                                        <View style={styles.inputIcon}>
                                            <User size={20} color={focusField === 'user' ? Colors.primary : '#94A3B8'} />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Username"
                                            placeholderTextColor="#94A3B8"
                                            value={username}
                                            onChangeText={setUsername}
                                            onFocus={() => setFocusField('user')}
                                            onBlur={() => setFocusField(null)}
                                            autoCapitalize="none"
                                        />
                                    </View>

                                    <View style={[
                                        styles.inputContainer,
                                        focusField === 'pass' && styles.inputFocused
                                    ]}>
                                        <View style={styles.inputIcon}>
                                            <Lock size={20} color={focusField === 'pass' ? Colors.primary : '#94A3B8'} />
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Password"
                                            placeholderTextColor="#94A3B8"
                                            value={password}
                                            onChangeText={setPassword}
                                            onFocus={() => setFocusField('pass')}
                                            onBlur={() => setFocusField(null)}
                                            secureTextEntry
                                        />
                                    </View>

                                    <TouchableOpacity
                                        style={styles.loginButton}
                                        onPress={handleLogin}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.loginButtonText}>AUTHENTICATE</Text>
                                        <View style={styles.buttonIcon}>
                                            <ArrowRight size={18} color="#FFF" />
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.divider}>
                                    <View style={styles.line} />
                                    <Text style={styles.dividerText}>SECURE TERMINAL</Text>
                                    <View style={styles.line} />
                                </View>

                                {/* <View style={styles.infoRow}>
                                    <Icon name="information-variant" size={16} color="#64748B" />
                                    <Text style={styles.infoText}>Authorized medical personnel only</Text>
                                </View> */}
                            </View>
                        </Animated.View>

                        <Animated.View
                            style={[
                                styles.footer,
                                { opacity: fadeAnim }
                            ]}
                        >
                            <Text style={styles.footerText}>© 2026 AIRSINE MEDICAL TECHNOLOGY</Text>
                            <Text style={styles.versionText}>ENCRYPTED LINK • V1.0.5</Text>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050B18', // Very deep navy/black
        textAlign: 'center',
    },
    bgCircle: {
        position: 'absolute',
        borderRadius: 1000,
        opacity: 0.15,
    },
    circle1: {
        top: -100,
        right: -140,
        backgroundColor: '#1E88E5',
    },
    circle2: {
        bottom: -50,
        left: -80,
        backgroundColor: '#6366F1',
    },
    circle3: {
        top: '40%',
        right: -50,
        backgroundColor: '#0EA5E9',
        opacity: 0.1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        paddingHorizontal: 28,
        paddingTop: Platform.OS === 'ios' ? insets.top + 10 : (StatusBar.currentHeight || 24) + 10,
        // paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 10,
    },
    logoContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    logoPulse: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        elevation: 12,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    glowEffect: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(30, 136, 229, 0.2)',
        zIndex: 1,
    },
    brandName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 4,
        textAlign: 'center',
    },
    brandTagline: {
        fontSize: 9,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.4)',
        letterSpacing: 2.5,
        marginTop: 4,
        textTransform: 'uppercase',
    },
    content: {
        width: '100%',
        zIndex: 10,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 22,
        padding: 24,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',

    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginLeft: 8,
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 24,
        textAlign: 'center',
    },
    form: {
        gap: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        height: 52,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inputFocused: {
        borderColor: Colors.primary,
        backgroundColor: '#FFFFFF',
    },
    inputIcon: {
        width: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: '100%',
        marginLeft: 12,
        fontSize: 14,
        fontWeight: '600',
        color: '#0F172A',
    },
    loginButton: {
        backgroundColor: Colors.primary,
        height: 52,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 6,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    buttonIcon: {
        marginLeft: 10,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 15,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    dividerText: {
        marginHorizontal: 15,
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 1.5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoText: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 6,
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        marginTop: 25,
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.4)',
        letterSpacing: 1,
    },
    versionText: {
        fontSize: 9,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.25)',
        letterSpacing: 2,
        marginTop: 4,
    },
});

export default LoginScreen;
