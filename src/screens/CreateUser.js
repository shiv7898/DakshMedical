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
import { User, Lock, Mail, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CreateUser = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [focusField, setFocusField] = useState(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
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

    const handleCreateAccount = () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Incomplete Data', 'Please provide all details for medical registration.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Security Error', 'Passwords do confirm. Please check your entries.');
            return;
        }

        Alert.alert(
            'Success',
            'Account creation request submitted. Awaiting administrative approval.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            {/* 🏷️ Premium Header - Matched to Dashboard Theme */}
            <Animated.View style={[styles.brandHeader, { opacity: headerFade }]}>
                <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={26} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleUnit}>
                    <Text style={styles.headerTitle}>REGISTRATION</Text>
                    <Text style={styles.headerSubtitle}>Medical Profile</Text>
                </View>
                <View style={{ width: 40 }} />
            </Animated.View>

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                        <Animated.View style={[styles.introSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.subtitle}>Create your AIRSINE medical profile for secure vital monitoring and analytics.</Text>
                        </Animated.View>

                        {/* Form Card */}
                        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <View style={styles.form}>

                                <View style={[styles.inputContainer, focusField === 'name' && styles.inputFocused]}>
                                    <View style={styles.inputIcon}>
                                        <User size={20} color={focusField === 'name' ? Colors.primary : '#94A3B8'} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Full Name"
                                        placeholderTextColor="#94A3B8"
                                        value={name}
                                        onChangeText={setName}
                                        onFocus={() => setFocusField('name')}
                                        onBlur={() => setFocusField(null)}
                                    />
                                </View>

                                <View style={[styles.inputContainer, focusField === 'email' && styles.inputFocused]}>
                                    <View style={styles.inputIcon}>
                                        <Mail size={20} color={focusField === 'email' ? Colors.primary : '#94A3B8'} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Medical Email Address"
                                        placeholderTextColor="#94A3B8"
                                        value={email}
                                        onChangeText={setEmail}
                                        onFocus={() => setFocusField('email')}
                                        onBlur={() => setFocusField(null)}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View style={[styles.inputContainer, focusField === 'pass' && styles.inputFocused]}>
                                    <View style={styles.inputIcon}>
                                        <Lock size={20} color={focusField === 'pass' ? Colors.primary : '#94A3B8'} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Access Password"
                                        placeholderTextColor="#94A3B8"
                                        value={password}
                                        onChangeText={setPassword}
                                        onFocus={() => setFocusField('pass')}
                                        onBlur={() => setFocusField(null)}
                                        secureTextEntry
                                    />
                                </View>

                                <View style={[styles.inputContainer, focusField === 'confirm' && styles.inputFocused]}>
                                    <View style={styles.inputIcon}>
                                        <ShieldCheck size={20} color={focusField === 'confirm' ? Colors.primary : '#94A3B8'} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#94A3B8"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        onFocus={() => setFocusField('confirm')}
                                        onBlur={() => setFocusField(null)}
                                        secureTextEntry
                                    />
                                </View>

                                <TouchableOpacity style={styles.submitBtn} onPress={handleCreateAccount} activeOpacity={0.8}>
                                    <Text style={styles.submitText}>CREATE ACCOUNT</Text>
                                    <CheckCircle2 size={18} color="#FFF" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>

                            </View>
                        </Animated.View>

                        <Text style={styles.footerText}>Secure Medical Infrastructure • Version 1.0.5</Text>
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
        height: 40,
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
        paddingTop: 20,
        paddingBottom: 40,
    },
    introSection: {
        marginBottom: 25,
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
    footerText: {
        textAlign: 'center',
        marginTop: 30,
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
        letterSpacing: 1,
    }
});

export default CreateUser;
