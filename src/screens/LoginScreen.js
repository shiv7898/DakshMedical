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
    ScrollView,
    SafeAreaView,
    StatusBar,
    Keyboard,
    Animated,
    Image,
    useWindowDimensions,
} from 'react-native';
import { Colors } from '../styles/theme';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LoginScreen = ({ navigation }) => {
    const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { setUserRole } = require('../context/DataContext').useData();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [focusField, setFocusField] = useState(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const cardScale = useRef(new Animated.Value(0.95)).current;
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoFloat = useRef(new Animated.Value(0)).current;
    const glowPulse = useRef(new Animated.Value(1)).current;
    const titleFade = useRef(new Animated.Value(0)).current;
    const titleSlide = useRef(new Animated.Value(20)).current;
    const scrollRef = useRef(null);

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
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 5,
                tension: 40,
                delay: 300,
                useNativeDriver: true,
            }),
            Animated.timing(titleFade, {
                toValue: 1,
                duration: 1000,
                delay: 600,
                useNativeDriver: true,
            }),
            Animated.timing(titleSlide, {
                toValue: 0,
                duration: 1000,
                delay: 600,
                useNativeDriver: true,
            })
        ]).start();

        // Glow Pulsing Animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowPulse, {
                    toValue: 1.2,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(glowPulse, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                })
            ])
        ).start();

        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardVisible(false);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
        });

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

        if (username.toLowerCase() === 'p' && password === 'p') {
            setUserRole('patient');
            navigation.replace('MainTabs');
        } else if (username.toLowerCase() === 'd' && password === 'd') {
            setUserRole('doctor');
            navigation.replace('MainTabs');
        } else if (username.toLowerCase() === 'a' && password === 'A') {
            setUserRole('patient');
            navigation.replace('MainTabs');
        } else {
            Alert.alert('Access Denied', 'Please check your monitoring credentials and try again. Use p/p for Patient or d/d for Doctor.');
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
                        ref={scrollRef}
                        contentContainerStyle={[
                            styles.scrollContent,
                            {
                                paddingTop: insets.top + (isKeyboardVisible ? 20 : 0),
                                minHeight: SCREEN_HEIGHT
                            }
                        ]}
                        scrollEnabled={isKeyboardVisible}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        bounces={false}
                    >
                        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <View style={styles.logoContainer}>
                                <Animated.View style={[
                                    styles.glowEffect,
                                    {
                                        transform: [{ scale: glowPulse }],
                                        opacity: glowPulse.interpolate({ inputRange: [1, 1.2], outputRange: [0.15, 0.05] })
                                    }
                                ]} />
                                <View style={styles.logoCircle}>
                                    <Image
                                        source={require('../assets/img/logo1.png')}
                                        style={styles.logoImage}
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>
                            <Animated.Text style={[
                                styles.brandName,
                                {
                                    opacity: titleFade,
                                    transform: [{ translateY: titleSlide }, { scale: titleFade.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }]
                                }
                            ]}>AIRSINE</Animated.Text>
                            <Animated.Text style={[styles.brandTagline, { opacity: titleFade }]}>VITAL MONITORING SYSTEMS</Animated.Text>
                        </Animated.View>

                        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: cardScale }] }]}>
                            <View style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <ShieldCheck size={20} color={Colors.primary} />
                                    <Text style={styles.cardTitle}>Medical Login</Text>
                                </View>

                                <Text style={styles.cardSubtitle}>Enter your secure credentials to access patient dashboards</Text>

                                <View style={styles.form}>
                                    <View style={[styles.inputContainer, focusField === 'user' && styles.inputFocused]}>
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

                                    <View style={[styles.inputContainer, focusField === 'pass' && styles.inputFocused]}>
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
                                        style={styles.forgotPassBtn}
                                        onPress={() => navigation.navigate('ForgotPassword')}
                                    >

                                        <Text style={styles.forgotPassText}>Forgot Password?</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
                                        <Text style={styles.loginButtonText}>AUTHENTICATE</Text>
                                        <View style={styles.buttonIcon}>
                                            <ArrowRight size={18} color="#FFF" />
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {/* <View style={styles.divider}>
                                    <View style={styles.line} />
                                    <Text style={styles.dividerText}>SECURE TERMINAL</Text>
                                    <View style={styles.line} />
                                </View> */}

                                <TouchableOpacity
                                    style={styles.createUserBtn}
                                    onPress={() => navigation.navigate('CreateUser')}
                                >
                                    <Text style={styles.createUserText}>New to Airsine? <Text style={styles.linkText}>Create User</Text></Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
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
        backgroundColor: Colors.secondary,
    },
    bgCircle: {
        position: 'absolute',
        borderRadius: 1000,
    },
    circle1: {
        top: -170,
        right: -100,
        backgroundColor: Colors.primary,
        opacity: 0.14,
    },
    circle2: {
        bottom: -60,
        left: -60,
        backgroundColor: Colors.primary,
        opacity: 0.08,
    },
    circle3: {
        top: '30%',
        left: -50,
        backgroundColor: Colors.accent,
        opacity: 0.05,
    },
    scrollContent: {
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 10,
    },
    logoContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        elevation: 4,
    },
    logoImage: {
        width: 80,
        height: 80,
    },
    glowEffect: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 65,
        backgroundColor: Colors.primary,
        zIndex: 1,
    },
    brandName: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 6,
        textAlign: 'center',
    },
    brandTagline: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(15, 93, 86, 0.5)',
        letterSpacing: 3,
        marginTop: 6,
        textTransform: 'uppercase',
    },
    content: {
        width: '100%',
        zIndex: 10,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        borderRadius: 32,
        padding: 30,
        elevation: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.6)',
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
        color: '#345e4dff',
        marginLeft: 8,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 10,
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
    forgotPassBtn: {
        alignSelf: 'flex-end',
        marginTop: -2,
    },
    forgotPassText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '700',
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
    createUserBtn: {
        alignItems: 'center',
        marginTop: 5,
    },
    createUserText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    linkText: {
        color: Colors.primary,
        fontWeight: '800',
    },
    footer: {
        alignItems: 'center',
        marginTop: 15,
        paddingBottom: 30,
    },
    footerText: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(15, 93, 86, 0.5)',
        letterSpacing: 1,
    },
    versionText: {
        fontSize: 9,
        fontWeight: '600',
        color: 'rgba(15, 93, 86, 0.5)',
        letterSpacing: 2,
        marginTop: 4,
    },
});

export default LoginScreen;
