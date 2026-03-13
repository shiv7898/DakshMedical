import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Colors, Spacing, Typography } from '../styles/theme';
import db from '../api/database';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [focusField, setFocusField] = useState(null);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
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
            Alert.alert('Error', 'Please enter username and password');
            return;
        }

        if (username.toLowerCase() === 'a' && password === 'a') {
            navigation.replace('ProfileSetup', { isSetup: true });
        } else {
            Alert.alert('Invalid credentials', 'Please check your username and password');
        }
    };

    const MainContent = (
        <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            scrollEnabled={isKeyboardVisible}
        >
            <View style={styles.bgCircle1} pointerEvents="none" />
            <View style={styles.bgCircle2} pointerEvents="none" />

            <View style={styles.header}>
                <View style={styles.logoWrapper}>
                    <Icon name="pulse" size={45} color="#FFFFFF" />
                </View>
                <Text style={styles.appName}>Airsine</Text>
                <Text style={styles.appSubtitle}>Professional CPAP Monitor</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.welcomeText}>Welcome Back</Text>
                    <Text style={styles.instructionText}>Login with your medical account</Text>

                    <View style={[styles.inputWrapper, focusField === 'user' && styles.inputFocus]}>
                        <Icon name="account-circle-outline" size={22} color={focusField === 'user' ? Colors.primary : '#A0AEC0'} />
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor="#A0AEC0"
                            value={username}
                            onChangeText={setUsername}
                            onFocus={() => setFocusField('user')}
                            onBlur={() => setFocusField(null)}
                            autoCapitalize="none"
                            underlineColorAndroid="transparent"
                        />
                    </View>

                    <View style={[styles.inputWrapper, focusField === 'pass' && styles.inputFocus]}>
                        <Icon name="lock-outline" size={22} color={focusField === 'pass' ? Colors.primary : '#A0AEC0'} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#A0AEC0"
                            value={password}
                            onChangeText={setPassword}
                            onFocus={() => setFocusField('pass')}
                            onBlur={() => setFocusField(null)}
                            secureTextEntry
                            underlineColorAndroid="transparent"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>LOGIN SECURELY</Text>
                        <Icon name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>

                    <View style={styles.hintBox}>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Secure Hospital Link v1.0.5</Text>
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0B1B3D" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
                style={{ flex: 1 }}
            >
                {MainContent}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B1B3D', // Deep modern navy
    },
    bgCircle1: {
        position: 'absolute',
        top: -100,
        right: -80,
        width: 200,
        height: 200,
        borderRadius: 150,
        backgroundColor: 'rgba(56, 114, 255, 0.4)',
        zIndex: 0,
    },
    bgCircle2: {
        position: 'absolute',
        top: 450,
        left: -120,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(102, 51, 255, 0.25)',
        zIndex: 0,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: Platform.OS === 'ios' ? 40 : 20,
        paddingBottom: 10,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 20,
        zIndex: 1,
    },
    logoWrapper: {
        width: 70,
        height: 70,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 10,
        shadowColor: Colors.primary,
        shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    appName: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    appSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginTop: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: 15,
        zIndex: 1,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 24,
        padding: 20,
        paddingTop: 24,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    welcomeText: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A202C',
        marginBottom: 6,
    },
    instructionText: {
        textAlign: 'center',
        fontSize: 13,
        color: '#718096',
        marginBottom: 30,
        fontWeight: '500',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
        height: 52,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    inputFocus: {
        borderColor: Colors.primary,
        backgroundColor: '#FFFFFF',
    },
    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 14,
        color: '#1A202C',
        fontSize: 15,
        fontWeight: '500',
    },
    loginButton: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    hintBox: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 25,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#EDF2F7',
    },
    hintText: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginLeft: 6,
        fontWeight: '600',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        zIndex: 1,
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: '600',
        letterSpacing: 1,
    },
});

export default LoginScreen;
