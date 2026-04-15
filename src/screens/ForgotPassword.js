import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
} from 'react-native';
import { Colors } from '../styles/theme';
import { Mail, ArrowLeft, SendHorizontal, AlertCircle } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ForgotPassword = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [focusField, setFocusField] = useState(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const headerFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(headerFade, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleResetPassword = () => {
        if (!email) {
            Alert.alert('Missing Field', 'Please provide your registered medical email.');
            return;
        }

        Alert.alert(
            'Request Sent',
            'If this email is associated with a medical account, you will receive reset instructions shortly.',
            [{ text: 'Return to Login', onPress: () => navigation.goBack() }]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            {/* 🔒 Secure Header - Matched to Dashboard Theme */}
            <Animated.View style={[styles.brandHeader, { opacity: headerFade }]}>
                <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleUnit}>
                    <Text style={styles.headerTitle}>RECOVERY</Text>
                    <Text style={styles.headerSubtitle}>Password Reset</Text>
                </View>
                <View style={{ width: 40 }} />
            </Animated.View>

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        <Animated.View style={[styles.introSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.subtitle}>Secure recovery instructions will be sent to your verified medical email address.</Text>
                        </Animated.View>

                        {/* Reset Card */}
                        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

                            <View style={styles.infoBox}>
                                <AlertCircle size={20} color={Colors.primary} />
                                <Text style={styles.infoText}>A secure link will be sent shortly</Text>
                            </View>

                            <View style={styles.form}>
                                <View style={[styles.inputContainer, focusField === 'email' && styles.inputFocused]}>
                                    <View style={styles.inputIcon}>
                                        <Mail size={20} color={focusField === 'email' ? Colors.primary : '#94A3B8'} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter Medical Email"
                                        placeholderTextColor="#94A3B8"
                                        value={email}
                                        onChangeText={setEmail}
                                        onFocus={() => setFocusField('email')}
                                        onBlur={() => setFocusField(null)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <TouchableOpacity style={styles.submitBtn} onPress={handleResetPassword} activeOpacity={0.8}>
                                    <Text style={styles.submitText}>SEND RECOVERY LINK</Text>
                                    <SendHorizontal size={18} color="#FFF" style={{ marginLeft: 10 }} />
                                </TouchableOpacity>

                            </View>
                        </Animated.View>

                        {/* Additional Info */}
                        <View style={styles.footerContainer}>
                            <Text style={styles.footerText}>Need urgent assistance?</Text>
                            <TouchableOpacity>
                                <Text style={styles.linkText}>Contact Medical Support</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    brandHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : 20,
        backgroundColor: Colors.primary,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    headerBackBtn: {
        width: 40,
        height: 30,
        borderRadius: 20,
        // backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleUnit: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        flex: 1,
    },
    introSection: {
        marginBottom: 25,
        marginTop: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
        lineHeight: 20,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        elevation: 10,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        padding: 14,
        borderRadius: 12,
        marginBottom: 20,
    },
    infoText: {
        fontSize: 12,
        color: Colors.primary,
        marginLeft: 10,
        fontWeight: '700',
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        height: 56,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    inputFocused: {
        borderColor: Colors.primary,
        backgroundColor: '#FFF',
    },
    inputIcon: {
        width: 24,
        marginRight: 12,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    submitBtn: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 4,
    },
    submitText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 1,
    },
    footerContainer: {
        alignItems: 'center',
        marginTop: 25,
    },
    footerText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
    },
    linkText: {
        color: Colors.primary,
        fontWeight: '800',
        marginTop: 5,
        textDecorationLine: 'underline',
    }
});

export default ForgotPassword;
