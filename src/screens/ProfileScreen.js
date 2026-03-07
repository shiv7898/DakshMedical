import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Platform,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Typography } from '../styles/theme';
import { getPatientInfo } from '../api/database';

const ProfileScreen = ({ navigation }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);

    useEffect(() => {
        loadPatientData();
    }, []);

    const loadPatientData = async () => {
        setLoading(true);
        try {
            const data = await getPatientInfo();
            setPatient(data);
        } catch (error) {
            console.error('Failed to load patient data:', error);
        }
        setLoading(false);
    };

    const InfoCard = ({ label, value, icon, editable, keyboardType = 'default' }) => (
        <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
                <Icon name={icon} size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoBody}>
                <Text style={styles.infoLabel}>{label}</Text>
                {isEditing && editable ? (
                    <TextInput
                        style={styles.infoInput}
                        value={String(value || '')}
                        onChangeText={(text) => setPatient({ ...patient, [editable]: text })}
                        placeholder={`Enter ${label}`}
                        keyboardType={keyboardType}
                    />
                ) : (
                    <Text style={styles.infoValue}>{value || 'Not Set'}</Text>
                )}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Patient Profile</Text>
                <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                    <Text style={styles.editAction}>{isEditing ? 'Cancel' : 'Update Info'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Header Card */}
                <View style={styles.profileMainCard}>
                    <View style={styles.avatarGlow}>
                        <View style={styles.avatarFull}>
                            <Icon name="account" size={50} color={Colors.primary} />
                        </View>
                    </View>
                    <Text style={styles.patientName}>{patient?.name}</Text>
                    <Text style={styles.patientSub}>ID: {patient?.id || 'P-00000'}</Text>
                </View>

                <Text style={styles.sectionHeader}>Personal Information</Text>
                <InfoCard label="Patient Name" value={patient?.name} icon="account-details" editable="name" />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <InfoCard label="Gender" value={patient?.gender} icon="gender-male-female" editable="gender" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <InfoCard label="DOB" value={patient?.dob} icon="calendar-outline" editable="dob" />
                    </View>
                </View>

                <InfoCard label="Phone Number" value={patient?.phone} icon="phone-outline" editable="phone" keyboardType="phone-pad" />
                <InfoCard label="Email Address" value={patient?.email} icon="email-outline" editable="email" keyboardType="email-address" />
                <InfoCard label="Residential Address" value={patient?.address} icon="map-marker-outline" editable="address" />

                <Text style={styles.sectionHeader}>Device Monitoring</Text>
                <InfoCard label="Device Model" value={patient?.device_model} icon="nasal-cannula" editable="device_model" />
                <InfoCard label="Device Serial No (SN)" value={patient?.machine_serial} icon="barcode-scan" editable="machine_serial" />

                {isEditing && (
                    <TouchableOpacity style={styles.saveBtn} onPress={() => setIsEditing(false)}>
                        <Text style={styles.saveBtnText}>SAVE PROFILE</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
                    <Icon name="logout-variant" size={20} color={Colors.error} />
                    <Text style={styles.logoutText}>Logout Account</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
        paddingBottom: Spacing.m,
        backgroundColor: '#FFF',
    },
    headerTitle: {
        ...Typography.subheader,
        fontSize: 18,
    },
    editAction: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
    scrollContent: {
        padding: Spacing.m,
    },
    profileMainCard: {
        backgroundColor: '#F8FBFF',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E3F2FD',
    },
    avatarGlow: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 4,
        shadowColor: Colors.primary,
        shadowOpacity: 0.15,
        shadowRadius: 5,
    },
    avatarFull: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    patientName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    patientSub: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginTop: 15,
        marginLeft: 4,
    },
    infoCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F1F4F8',
    },
    infoIconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#F3F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoBody: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 1,
    },
    infoInput: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
        padding: 0,
        marginTop: 1,
    },
    row: {
        flexDirection: 'row',
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        elevation: 4,
    },
    saveBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
    },
    logoutText: {
        color: Colors.error,
        fontWeight: 'bold',
        marginLeft: 10,
    },
});

export default ProfileScreen;
