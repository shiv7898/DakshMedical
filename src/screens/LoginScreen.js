import React, { useState } from 'react';
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
} from 'react-native';
import { Colors, Spacing, Typography } from '../styles/theme';
import db from '../api/database';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [focusField, setFocusField] = useState(null);

    const handleLogin = () => {
        if (!username || !password) {
            Alert.alert('Error', 'Please enter username and password');
            return;
        }

        db.transaction(tx => {
            tx.executeSql(
                'SELECT * FROM users WHERE username = ? AND password = ?',
                [username, password],
                (_, results) => {
                    if (results.rows.length > 0) {
                        navigation.replace('MainTabs');
                    } else {
                        Alert.alert('Invalid credentials', 'Please check your username and password');
                    }
                },
                (_, error) => {
                    console.error(error);
                    Alert.alert('Error', 'An error occurred during login');
                }
            );
        });
    };

    // Standard container
    const Content = (
        <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <View style={styles.logoCircle}>
                    <Icon name="pulse" size={40} color={Colors.primary} />
                </View>
                <Text style={styles.appName}>Airsine</Text>
                <Text style={styles.appSubtitle}>Professional CPAP Monitor</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.welcomeText}>Medical Account Login</Text>

                    <View style={[styles.inputWrapper, focusField === 'user' && styles.inputFocus]}>
                        <Icon name="account-circle-outline" size={20} color={focusField === 'user' ? Colors.primary : Colors.textSecondary} />
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor={Colors.textSecondary}
                            value={username}
                            onChangeText={setUsername}
                            onFocus={() => setFocusField('user')}
                            onBlur={() => setFocusField(null)}
                            autoCapitalize="none"
                            underlineColorAndroid="transparent"
                        />
                    </View>

                    <View style={[styles.inputWrapper, focusField === 'pass' && styles.inputFocus]}>
                        <Icon name="lock-outline" size={20} color={focusField === 'pass' ? Colors.primary : Colors.textSecondary} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor={Colors.textSecondary}
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
                        <Text style={styles.buttonText}>LOGIN</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotBtn}>
                        <Text style={styles.forgotText}>Forgot Credentials?</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Secure Hospital Link v1.0.5</Text>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            {Platform.OS === 'ios' ? (
                <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                    {Content}
                </KeyboardAvoidingView>
            ) : (
                /* On Android, adjustResize in AndroidManifest handles it best with ScrollView */
                <View style={{ flex: 1 }}>
                    {Content}
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        height: SCREEN_HEIGHT * 0.28,
        minHeight: 180,
        backgroundColor: '#F8FBFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        elevation: 3,
        shadowColor: Colors.primary,
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    appName: {
        ...Typography.header,
        fontSize: 24,
        color: Colors.primary,
    },
    appSubtitle: {
        ...Typography.caption,
        fontSize: 10,
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 25,
        marginTop: -40,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
    },
    welcomeText: {
        ...Typography.subheader,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: Colors.text,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFF',
        borderRadius: 14,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#EDF2F7',
        height: 54,
    },
    inputFocus: {
        borderColor: Colors.primary,
        borderWidth: 1.5,
        backgroundColor: '#FFFFFF',
    },
    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 12,
        color: Colors.text,
        fontSize: 16,
    },
    loginButton: {
        backgroundColor: Colors.primary,
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    forgotBtn: {
        marginTop: 20,
        alignItems: 'center',
    },
    forgotText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    footer: {
        marginTop: 'auto',
        paddingVertical: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 10,
        color: '#BDC3C7',
    },
});

export default LoginScreen;
