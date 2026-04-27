import React, { useState, useEffect, useRef } from 'react';
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
    Animated,
    Alert,
    Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors, Spacing, Typography } from '../styles/theme';
import { getPatientInfo, savePatientInfo, clearPatientInfo, clearLogs, getDoctorInfo, saveDoctorInfo, clearDoctorInfo, clearAllData } from '../api/database';
import { useData } from '../context/DataContext';

// ─── Colours & tokens ────────────────────────────────────────────────────────
const PRIMARY = Colors.primary;
const PRIMARY_LIGHT = Colors.accent;
const PRIMARY_BG = Colors.surface;
const BORDER = Colors.border;
const TEXT = Colors.text;
const TEXT_SEC = Colors.textSecondary;
const CARD_BG = '#FFFFFF';
const INPUT_BG = Colors.surface;
const ERROR = Colors.error;

// ─── Single field row ─────────────────────────────────────────────────────────
const FieldRow = ({
    label, icon, value, editable, keyboardType = 'default',
    placeholder, isEditing, onChangeText, onPress, type, last = false,
}) => {
    const isAction = type === 'select' || type === 'date';
    return (
        <View style={[fStyles.row, last && { borderBottomWidth: 0 }]}>
            <View style={fStyles.iconWrap}>
                <Icon name={icon} size={18} color={PRIMARY_LIGHT} />
            </View>
            <View style={fStyles.body}>
                <Text style={fStyles.label}>{label}</Text>
                {isEditing && editable ? (
                    isAction ? (
                        <TouchableOpacity onPress={onPress}>
                            <Text style={[fStyles.value, !value && fStyles.placeholder]}>
                                {value || placeholder || `Select ${label}`}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TextInput
                            style={fStyles.input}
                            value={String(value || '')}
                            onChangeText={text => onChangeText(editable, text)}
                            placeholder={placeholder || `Enter ${label}`}
                            placeholderTextColor="#AAB8C8"
                            keyboardType={keyboardType}
                        />
                    )
                ) : (
                    <Text style={[fStyles.value, !value && fStyles.notSet]}>
                        {value || 'Not set'}
                    </Text>
                )}
            </View>
            {isEditing && isAction && (
                <Icon name="chevron-right" size={18} color={TEXT_SEC} style={{ alignSelf: 'center' }} />
            )}
        </View>
    );
};

const fStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: PRIMARY_BG,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    body: { flex: 1 },
    label: { fontSize: 10, fontWeight: '700', color: TEXT_SEC, letterSpacing: 0.4, marginBottom: 2 },
    value: { fontSize: 14, fontWeight: '600', color: TEXT },
    notSet: { color: '#CBD5E1', fontStyle: 'italic' },
    placeholder: { color: '#AAB8C8' },
    input: { fontSize: 14, color: TEXT, padding: 0, fontWeight: '500' },
});

// ─── Section card wrapper ────────────────────────────────────────────────────
const SectionCard = ({ title, iconName, children }) => (
    <View style={scStyles.card}>
        <View style={scStyles.titleRow}>
            <View style={scStyles.titleIcon}>
                <Icon name={iconName} size={16} color={PRIMARY_LIGHT} />
            </View>
            <Text style={scStyles.titleText}>{title}</Text>
        </View>
        {children}
    </View>
);

const scStyles = StyleSheet.create({
    card: {
        backgroundColor: CARD_BG,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: 'hidden',
        shadowColor: PRIMARY,
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEF4FF',
        backgroundColor: '#F5F9FF',
    },
    titleIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    titleText: {
        fontSize: 12,
        fontWeight: '800',
        color: PRIMARY,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ProfileScreen = ({ navigation, route }) => {
    const { setSelectedRange, userRole } = useData();
    const isSetup = route?.params?.isSetup || false;
    const [isEditing, setIsEditing] = useState(isSetup);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState({});
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const scrollRef = useRef(null);

    // Picker states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showSelectModal, setShowSelectModal] = useState(false);
    const [currentSelectField, setCurrentSelectField] = useState('');
    const [currentSelectOptions, setCurrentSelectOptions] = useState([]);

    const genderOptions = ['Male', 'Female', 'Other'];
    const deviceModelOptions = [
        'Airsine 11 AutoSet',
        'Airsine 10 AutoSet',
        'Airsine 10 CPAP',
        'Airsine 10 VAuto',
        'DreamStation 2 Auto CPAP',
        'DreamStation CPAP',
        'Other',
    ];

    // Avatar initials animation
    const avatarScale = useRef(new Animated.Value(1)).current;
    const pulseAvatar = () => {
        Animated.sequence([
            Animated.spring(avatarScale, { toValue: 1.08, useNativeDriver: true }),
            Animated.spring(avatarScale, { toValue: 1, useNativeDriver: true }),
        ]).start();
    };

    useEffect(() => {
        loadProfileData();

        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow',
            () => {
                setKeyboardVisible(true);
                // Force a small delay to ensure layout has updated before scrolling
                setTimeout(() => {
                    if (isEditing) {
                        scrollRef.current?.scrollToEnd({ animated: true });
                    }
                }, 100);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, [isEditing]);

    const loadProfileData = async () => {
        setLoading(true);
        try {
            if (userRole === 'doctor') {
                const data = await getDoctorInfo();
                if (data) setProfileData(data);
                else if (isSetup) setIsEditing(true);
            } else {
                const data = await getPatientInfo();
                if (data) setProfileData(data);
                else if (isSetup) setIsEditing(true);
            }
        } catch (e) {
            console.error('Failed to load profile data:', e);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!profileData.name?.trim()) {
            Alert.alert('Required', 'Please enter the name before saving.');
            return;
        }
        try {
            setSaving(true);
            if (userRole === 'doctor') {
                await saveDoctorInfo(profileData);
            } else {
                await savePatientInfo(profileData);
            }
            if (isSetup) {
                navigation.replace('MainTabs');
            } else {
                setIsEditing(false);
                Alert.alert('✅ Saved', 'Profile updated successfully.');
            }
        } catch (e) {
            console.error('Failed to save profile data:', e);
            Alert.alert('Error', 'Could not save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field, text) => {
        setProfileData(prev => ({ ...prev, [field]: text }));
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
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout', style: 'destructive',
                    onPress: async () => {
                        try {
                            // 1. Reset context range
                            setSelectedRange(7);
                            
                            // 2. Clear ENTIRE Database (Patients, Doctors, and Logs)
                            await clearAllData();
                            
                            console.log("Database cleared successfully.");
                            navigation.replace('Login');
                        } catch (e) {
                            setSelectedRange(7);
                            navigation.replace('Login');
                        }
                    }
                }
            ]
        );
    };

    const initials = (profileData?.name || (userRole === 'doctor' ? 'D' : 'P'))
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    // ── common field props helper
    const fp = (field) => ({
        editable: field,
        isEditing,
        value: profileData?.[field],
        onChangeText: handleInputChange,
    });
    const fpAction = (field, type) => ({
        ...fp(field),
        type,
        onPress: () => handleActionPress(field, type),
    });

    if (loading) {
        return (
            <View style={styles.loadingCont}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading profile…</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

            {/* ── Top Header ── */}
            <View style={styles.topBar}>
                {!isSetup && (
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={22} color="#fff" />
                    </TouchableOpacity>
                )}
                <Text style={styles.topTitle}>{userRole === 'doctor' ? 'Doctor Profile' : 'Patient Profile'}</Text>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => {
                        if (isEditing) {
                            setIsEditing(false);
                            loadProfileData(); // reset unsaved changes
                        } else {
                            setIsEditing(true);
                        }
                    }}
                >
                    <Icon name={isEditing ? 'close' : 'pencil-outline'} size={18} color="#fff" />
                    <Text style={styles.editBtnText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={[
                        styles.scroll,
                        isKeyboardVisible && { paddingBottom: 20 } // Large padding to ensure everything can be scrolled up
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Avatar Hero Card ── */}
                    <View style={styles.heroCard}>
                        <TouchableOpacity activeOpacity={0.85} onPress={pulseAvatar}>
                            <Animated.View style={[styles.avatar, { transform: [{ scale: avatarScale }] }]}>
                                <Text style={styles.avatarText}>{initials}</Text>
                            </Animated.View>
                        </TouchableOpacity>
                        <Text style={styles.heroName}>
                            {profileData?.name || (isSetup ? `New ${userRole === 'doctor' ? 'Doctor' : 'Patient'}` : 'Your Name')}
                        </Text>
                        <View style={styles.idBadge}>
                            <Text style={styles.idBadgeText}>
                                ID: {userRole === 'doctor' ? 'D' : 'P'}-{profileData?.patient_custom_id || profileData?.id || 'Not Assigned'}
                            </Text>
                        </View>
                        {profileData?.gender && userRole !== 'doctor' ? (
                            <Text style={styles.heroBio}>
                                {profileData.gender}{profileData?.age ? `  ·  ${profileData.age} yrs` : ''}{profileData?.dob ? `  ·  ${profileData.dob}` : ''}
                            </Text>
                        ) : null}
                    </View>

                    {/* ── Role Specific / Doctor Information ── */}
                    {userRole === 'doctor' && (
                        <SectionCard title="Doctor Information" iconName="doctor">
                            <FieldRow
                                label="Full Name"
                                icon="account-details-outline"
                                placeholder="e.g. Dr. Anil Kumar"
                                {...fp('name')}
                            />
                            <FieldRow
                                label="Hospital / Clinic Name"
                                icon="hospital-building"
                                placeholder="e.g. Apollo Hospital"
                                {...fp('hospital')}
                            />
                            <FieldRow
                                label="Specialisation"
                                icon="stethoscope"
                                placeholder="e.g. Pulmonologist"
                                {...fp('specialization')}
                            />
                            <FieldRow
                                label="Qualification"
                                icon="school-outline"
                                placeholder="e.g. MBBS, MD"
                                {...fp('qualification')}
                            />
                            <FieldRow
                                label="Experience"
                                icon="briefcase-outline"
                                placeholder="e.g. 15 Years"
                                {...fp('experience')}
                            />
                        </SectionCard>
                    )}

                    {/* ── Personal Information (Visible to both Patient & Doctor) ── */}
                    <SectionCard title="Personal Information" iconName="account-outline">
                        {userRole === 'patient' && (
                            <FieldRow
                                label="Patient ID"
                                icon="identifier"
                                placeholder="e.g. 01"
                                keyboardType="default"
                                {...fp('patient_custom_id')}
                            />
                        )}
                        <FieldRow
                            label={userRole === 'doctor' ? "Contact Name" : "Full Name"}
                            icon="account-details-outline"
                            placeholder="e.g. user name"
                            {...fp('name')}
                        />
                        <FieldRow
                            label="Age"
                            icon="calendar-account-outline"
                            placeholder="e.g. 32"
                            keyboardType="numeric"
                            {...fp('age')}
                        />
                        <FieldRow
                            label="Gender"
                            icon="gender-male-female"
                            placeholder="Select gender"
                            {...fpAction('gender', 'select')}
                        />
                        <FieldRow
                            label="Date of Birth"
                            icon="cake-variant-outline"
                            placeholder="e.g. 12-Aug-1992"
                            {...fpAction('dob', 'date')}
                        />
                        <FieldRow
                            label="Phone Number"
                            icon="phone-outline"
                            placeholder="e.g. +91 9876543210"
                            keyboardType="phone-pad"
                            {...fp('phone')}
                        />
                        <FieldRow
                            label="Email Address"
                            icon="email-outline"
                            placeholder="e.g. name@example.com"
                            keyboardType="email-address"
                            {...fp('email')}
                        />
                        <FieldRow
                            label="Home No. / Building"
                            icon="home-outline"
                            placeholder="e.g. 102, Medical Enclave"
                            {...fp('homeAddress')}
                        />
                        <FieldRow
                            label="Area / Locality"
                            icon="map-outline"
                            placeholder="e.g. Rohini Sector 7"
                            {...fp('area')}
                        />
                        <FieldRow
                            label="District"
                            icon="map-marker-radius-outline"
                            placeholder="e.g. New Delhi"
                            {...fp('district')}
                        />
                        <FieldRow
                            label="State"
                            icon="map-marker-outline"
                            placeholder="e.g. Delhi"
                            {...fp('state')}
                        />
                        <FieldRow
                            label="Pincode"
                            icon="numeric"
                            placeholder="e.g. 110085"
                            keyboardType="numeric"
                            last={true}
                            {...fp('pincode')}
                        />
                    </SectionCard>

                    {/* ── CPAP Device (Patient Only) ── */}
                    {userRole === 'patient' && (
                        <SectionCard title="CPAP Device" iconName="medical-bag">
                            <FieldRow
                                label="Device Model"
                                icon="cpu-64-bit"
                                placeholder="Select device model"
                                {...fpAction('device_model', 'select')}
                            />
                            <FieldRow
                                label="Device Serial No (SN)"
                                icon="barcode-scan"
                                placeholder="e.g. AS11-9238-120"
                                last={true}
                                {...fp('machine_serial')}
                            />
                        </SectionCard>
                    )}

                    {/* ── Referring Physician ── */}
                    {/* <SectionCard title="Referring Physician" iconName="doctor">
                        <FieldRow
                            label="Doctor Name"
                            icon="stethoscope"
                            placeholder="e.g. Dr. Anil Kumar"
                            {...fp('doctor_name')}
                        />
                        <FieldRow
                            label="Doctor Phone"
                            icon="phone-plus-outline"
                            placeholder="e.g. +91 9876543210"
                            keyboardType="phone-pad"
                            last={true}
                            {...fp('doctor_phone')}
                        />
                    </SectionCard> */}

                    {/* ── Save Button ── */}
                    {isEditing && (
                        <TouchableOpacity
                            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                            onPress={handleSave}
                            disabled={saving}
                            activeOpacity={0.85}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Icon name="content-save-outline" size={20} color="#fff" />
                                    <Text style={styles.saveBtnText}>SAVE PROFILE</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    {/* ── Logout ── */}
                    {!isSetup && (
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
                            <Icon name="logout-variant" size={18} color={ERROR} />
                            <Text style={styles.logoutText}>Logout Account</Text>
                        </TouchableOpacity>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── DatePicker ── */}
            {showDatePicker && (
                <DateTimePicker
                    value={
                        (profileData?.dob && !isNaN(Date.parse(profileData.dob.replace(/-/g, ' '))))
                            ? new Date(profileData.dob.replace(/-/g, ' '))
                            : new Date(1990, 0, 1)
                    }
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={handleDateChange}
                />
            )}

            {/* ── Bottom Sheet Select Modal ── */}
            <Modal visible={showSelectModal} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSelectModal(false)}
                >
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>
                            {currentSelectField === 'gender' ? 'Select Gender' : 'Select Device Model'}
                        </Text>
                        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                            {currentSelectOptions.map((opt, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[
                                        styles.modalOpt,
                                        profileData?.[currentSelectField] === opt && styles.modalOptActive,
                                        i === currentSelectOptions.length - 1 && { borderBottomWidth: 0 },
                                    ]}
                                    onPress={() => handleOptionSelect(opt)}
                                >
                                    <Text style={[
                                        styles.modalOptText,
                                        profileData?.[currentSelectField] === opt && { color: PRIMARY, fontWeight: 'bold' },
                                    ]}>
                                        {opt}
                                    </Text>
                                    {profileData?.[currentSelectField] === opt && (
                                        <Icon name="check-circle" size={18} color={PRIMARY_LIGHT} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.modalCancel} onPress={() => setShowSelectModal(false)}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

// ─── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F0F6FF' },
    loadingCont: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F6FF' },
    loadingText: { marginTop: 12, fontSize: 13, color: TEXT_SEC },

    // Header
    topBar: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 14,
        paddingBottom: 14,
    },
    backBtn: { marginRight: 10, padding: 2 },
    topTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#fff', letterSpacing: 0.4 },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 5,
    },
    editBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    // Scroll
    scroll: { padding: 16 },

    // Hero card
    heroCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        alignItems: 'center',
        padding: 24,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: BORDER,
        shadowColor: PRIMARY,
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    avatar: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        shadowColor: PRIMARY,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    avatarText: { fontSize: 30, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
    heroName: { fontSize: 20, fontWeight: 'bold', color: TEXT, marginBottom: 6 },
    idBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: PRIMARY_BG,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: BORDER,
        gap: 4,
    },
    idBadgeText: { fontSize: 12, color: PRIMARY_LIGHT, fontWeight: '700' },
    heroBio: { fontSize: 12, color: TEXT_SEC, marginTop: 2 },

    // Save
    saveBtn: {
        backgroundColor: PRIMARY,
        flexDirection: 'row',
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
        elevation: 4,
        shadowColor: PRIMARY,
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 1.2 },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    logoutText: { color: ERROR, fontWeight: 'bold', fontSize: 14 },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(10,20,60,0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        maxHeight: '75%',
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: '#CBD5E1',
        alignSelf: 'center', marginBottom: 16,
    },
    modalTitle: {
        fontSize: 17, fontWeight: 'bold', color: TEXT,
        textAlign: 'center', marginBottom: 12,
    },
    modalOpt: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EFF3F8',
    },
    modalOptActive: { backgroundColor: '#F0F7FF' },
    modalOptText: { fontSize: 15, color: TEXT },
    modalCancel: {
        marginTop: 14,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
    },
    modalCancelText: { fontSize: 15, color: ERROR, fontWeight: 'bold' },
});

export default ProfileScreen;
