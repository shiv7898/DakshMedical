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
    Modal,
    KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Typography } from '../styles/theme';
import { getPatientInfo, savePatientInfo, clearPatientInfo } from '../api/database';

const InfoCard = ({ label, value, icon, editable, keyboardType = 'default', placeholder, isEditing, onChangeText, onActionPress, type }) => (
    <View style={styles.infoCard}>
        <View style={styles.infoIconBox}>
            <Icon name={icon} size={20} color={Colors.primary} />
        </View>
        <View style={styles.infoBody}>
            <Text style={styles.infoLabel}>{label}</Text>
            {isEditing && editable ? (
                type === 'select' || type === 'date' ? (
                    <TouchableOpacity onPress={() => onActionPress(editable, type, value)} style={styles.infoInputBtn}>
                        <Text style={[styles.infoInput, !value && { color: Colors.textSecondary }]}>
                            {value || placeholder || `Select ${label}`}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TextInput
                        style={styles.infoInput}
                        value={String(value || '')}
                        onChangeText={(text) => onChangeText(editable, text)}
                        placeholder={placeholder || `Enter ${label}`}
                        placeholderTextColor={Colors.textSecondary}
                        keyboardType={keyboardType}
                    />
                )
            ) : (
                <Text style={styles.infoValue}>{value || 'Not Set'}</Text>
            )}
        </View>
    </View>
);

const ProfileScreen = ({ navigation, route }) => {
    const isSetup = route?.params?.isSetup || false;
    const [isEditing, setIsEditing] = useState(isSetup);
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState({});

    // Picker States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showSelectModal, setShowSelectModal] = useState(false);
    const [currentSelectField, setCurrentSelectField] = useState('');
    const [currentSelectOptions, setCurrentSelectOptions] = useState([]);
    
    const genderOptions = ['Male', 'Female', 'Other'];
    const deviceModelOptions = ['AirSense 11 AutoSet', 'AirSense 10', 'AirCurve 10 VAuto', 'DreamStation 2'];

    useEffect(() => {
        loadPatientData();
    }, []);

    const loadPatientData = async () => {
        setLoading(true);
        try {
            const data = await getPatientInfo();
            if (data) {
                setPatient(data);
            } else if (isSetup) {
                setIsEditing(true);
            }
        } catch (error) {
            console.error('Failed to load patient data:', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await savePatientInfo(patient);
            if (isSetup) {
                navigation.replace('MainTabs');
            } else {
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Failed to save patient data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, text) => {
        setPatient(prev => ({ ...prev, [field]: text }));
    };

    const handleActionPress = (field, type) => {
        if (type === 'date') {
            setShowDatePicker(true);
        } else if (type === 'select') {
            setCurrentSelectField(field);
            if (field === 'gender') setCurrentSelectOptions(genderOptions);
            if (field === 'device_model') setCurrentSelectOptions(deviceModelOptions);
            setShowSelectModal(true);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const d = selectedDate.getDate().toString().padStart(2, '0');
            const m = months[selectedDate.getMonth()];
            const y = selectedDate.getFullYear();
            handleInputChange('dob', `${d}-${m}-${y}`);
        }
    };

    const handleOptionSelect = (option) => {
        handleInputChange(currentSelectField, option);
        setShowSelectModal(false);
    };

    const handleLogout = async () => {
        try {
            await clearPatientInfo();
            navigation.replace('Login');
        } catch (error) {
            console.error('Logout error:', error);
            navigation.replace('Login');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Patient Profile</Text>
                    {!isSetup && (
                        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                            <Text style={styles.editAction}>{isEditing ? 'Cancel' : 'Update Info'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                <InfoCard label="Patient Name" value={patient?.name} icon="account-details" editable="name" placeholder="e.g. Shiv Dhakad" isEditing={isEditing} onChangeText={handleInputChange} />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <InfoCard label="Age" value={patient?.age} icon="calendar-account" editable="age" keyboardType="numeric" placeholder="e.g. 32" isEditing={isEditing} onChangeText={handleInputChange} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <InfoCard label="Gender" value={patient?.gender} icon="gender-male-female" editable="gender" placeholder="e.g. Male" isEditing={isEditing} onChangeText={handleInputChange} type="select" onActionPress={handleActionPress} />
                    </View>
                </View>

                <InfoCard label="DOB" value={patient?.dob} icon="calendar-outline" editable="dob" placeholder="e.g. 12-Aug-1992" isEditing={isEditing} onChangeText={handleInputChange} type="date" onActionPress={handleActionPress} />
                <InfoCard label="Phone Number" value={patient?.phone} icon="phone-outline" editable="phone" keyboardType="phone-pad" placeholder="e.g. +91 9876543210" isEditing={isEditing} onChangeText={handleInputChange} />
                <InfoCard label="Email Address" value={patient?.email} icon="email-outline" editable="email" keyboardType="email-address" placeholder="e.g. daksh.singh@example.com" isEditing={isEditing} onChangeText={handleInputChange} />
                <InfoCard label="Residential Address" value={patient?.address} icon="map-marker-outline" editable="address" placeholder="e.g. 102, Medical Enclave, New Delhi" isEditing={isEditing} onChangeText={handleInputChange} />

                <Text style={styles.sectionHeader}>Device Monitoring</Text>
                <InfoCard label="Device Model" value={patient?.device_model} icon="nasal-cannula" editable="device_model" placeholder="e.g. AirSense 11 AutoSet" isEditing={isEditing} onChangeText={handleInputChange} type="select" onActionPress={handleActionPress} />
                <InfoCard label="Device Serial No (SN)" value={patient?.machine_serial} icon="barcode-scan" editable="machine_serial" placeholder="e.g. AS11-9238-120" isEditing={isEditing} onChangeText={handleInputChange} />

                {isEditing && (
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>SAVE PROFILE</Text>
                    </TouchableOpacity>
                )}

                {!isSetup && (
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Icon name="logout-variant" size={20} color={Colors.error} />
                        <Text style={styles.logoutText}>Logout Account</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 300 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* DatePicker Wrapper */}
            {showDatePicker && (
                <DateTimePicker
                    value={
                        (patient?.dob && !isNaN(Date.parse(patient.dob.replace(/-/g, ' ')))) 
                        ? new Date(patient.dob.replace(/-/g, ' ')) 
                        : new Date(1990, 0, 1) // default to 1990 for easier DOB select
                    }
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={handleDateChange}
                />
            )}

            {/* Select Options Modal */}
            <Modal visible={showSelectModal} transparent={true} animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSelectModal(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select an Option</Text>
                        {currentSelectOptions.map((opt, index) => (
                            <TouchableOpacity key={index} style={styles.modalOption} onPress={() => handleOptionSelect(opt)}>
                                <Text style={styles.modalOptionText}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={styles.modalCancel} onPress={() => setShowSelectModal(false)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
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
        fontWeight: 'light',
        color: "gray",
        padding: 0,
        marginTop: 1,
    },
    infoInputBtn: {
        justifyContent: 'center',
        paddingVertical: 2,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    modalOption: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F4F8',
        alignItems: 'center',
    },
    modalOptionText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '600',
    },
    modalCancel: {
        marginTop: 16,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: '#F8FBFF',
        borderRadius: 12,
    },
    modalCancelText: {
        fontSize: 16,
        color: Colors.error,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
