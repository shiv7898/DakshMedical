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
    Animated,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../styles/theme';
import { useData } from '../../context/DataContext';
import { clearAllData } from '../../api/database';
import { ENDPOINTS } from '../../api/apiConfig';

const DistributorProfile = ({ navigation }) => {
    const { userData, setUserData, token } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userData) {
            setProfileData({
                ...userData,
                companyName: userData.companyName || userData.company_name || '',
                businessType: userData.businessType || userData.business_type || '',
                distributorType: userData.distributorType || userData.distributor_type || '',
                licenseNumber: userData.licenseNumber || userData.license_number || '',
                homeAddress: userData.homeAddress || userData.home_address || '',
            });
        }
    }, [userData, isEditing]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const toNumericOrString = (val) => {
                if (val === null || val === undefined || val === '') return val;
                const str = String(val).trim();
                if (!str) return '';
                if (/^\d+$/.test(str)) {
                    return parseInt(str, 10);
                }
                if (/^\d*\.\d+$/.test(str)) {
                    return parseFloat(str);
                }
                return val;
            };

            const cleanPayload = {
                name: profileData.name || "",
                email: profileData.email || "",
                password: profileData.password || "",
                role: profileData.role || "distributor",
                phone: toNumericOrString(profileData.phone),
                gender: (profileData.gender || "").toLowerCase(),
                age: toNumericOrString(profileData.age) || 0,
                dob: profileData.dob || "",
                homeAddress: profileData.homeAddress || profileData.home_address || "",
                area: profileData.area || "",
                district: profileData.district || "",
                state: profileData.state || "",
                pincode: toNumericOrString(profileData.pincode),
                companyName: profileData.companyName || "",
                businessType: profileData.businessType || "",
                distributorType: profileData.distributorType || "",
                licenseNumber: toNumericOrString(profileData.licenseNumber),
            };

            const response = await fetch(ENDPOINTS.PROFILE, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cleanPayload),
            });

            const result = await response.json();
            if (response.ok) {
                const updatedUser = {
                    ...profileData,
                    ...cleanPayload,
                    company_name: cleanPayload.companyName,
                    business_type: cleanPayload.businessType,
                    distributor_type: cleanPayload.distributorType,
                    license_number: cleanPayload.licenseNumber,
                    home_address: cleanPayload.homeAddress,
                };
                setUserData(updatedUser);
                setProfileData(updatedUser);
                setIsEditing(false);
                Alert.alert('Success', 'Business profile updated.');
            } else {
                Alert.alert('Error', result.detail || 'Failed to update profile.');
            }
        } catch (error) {
            console.error('Save Profile Error:', error);
            Alert.alert('Error', 'Could not save profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Exit distributor portal?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout', style: 'destructive', onPress: async () => {
                    await clearAllData();
                    navigation.replace('Login');
                }
            }
        ]);
    };

    const Field = ({ label, icon, value, field, editable = true }) => (
        <View style={styles.fieldRow}>
            <View style={styles.iconBox}><Icon name={icon} size={20} color={Colors.primary} /></View>
            <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.labelText}>{label}</Text>
                {isEditing && editable ? (
                    <TextInput
                        style={styles.input}
                        value={profileData[field]}
                        onChangeText={t => setProfileData({ ...profileData, [field]: t })}
                    />
                ) : (
                    <Text style={styles.valueText}>{value || 'Not provided'}</Text>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.headerBtn}>
                    <Icon name="menu" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Business Profile</Text>
                <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.headerBtn}>
                    <Icon name={isEditing ? "close" : "pencil"} size={22} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileHero}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{profileData.name?.[0] || 'D'}</Text>
                    </View>
                    <Text style={styles.profileName}>{profileData.name || 'Authorized Distributor'}</Text>
                    <View style={styles.roleBadge}><Text style={styles.roleText}>Enterprise Partner</Text></View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Business Identity</Text>
                    <View style={styles.card}>
                        <Field label="Company Name" icon="office-building" value={profileData.company_name} field="companyName" />
                        <Field label="Business Type" icon="tag-outline" value={profileData.business_type} field="businessType" />
                        <Field label="Partner Level" icon="star-circle-outline" value={profileData.distributor_type} field="distributorType" />
                        <Field label="License Number" icon="card-account-details-outline" value={profileData.license_number} field="licenseNumber" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Owner Details</Text>
                    <View style={styles.card}>
                        <Field label="Contact Person" icon="account-tie" value={profileData.name} field="name" />
                        <Field label="Gender" icon="gender-male-female" value={profileData.gender} field="gender" />
                        <Field label="Date of Birth" icon="calendar-account" value={profileData.dob} field="dob" />
                        <Field label="Age" icon="numeric" value={profileData.age} field="age" />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact & Location</Text>
                    <View style={styles.card}>
                        <Field label="Email Address" icon="email-outline" value={profileData.email} field="email" />
                        <Field label="Phone Number" icon="phone-outline" value={profileData.phone} field="phone" />
                        <Field label="House Number/Name" icon="home-map-marker" value={profileData.home_address} field="homeAddress" />
                        <Field label="Area / Locality" icon="map-marker-radius" value={profileData.area} field="area" />
                        <Field label="District" icon="map-marker-outline" value={profileData.district} field="district" />
                        <Field label="State" icon="map-legend" value={profileData.state} field="state" />
                        <Field label="Pincode" icon="numeric-pos-1" value={profileData.pincode} field="pincode" />
                    </View>
                </View>

                {isEditing && (
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Update Profile</Text>}
                    </TouchableOpacity>
                )}


            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 15 },
    headerBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#FFF' },
    scrollContent: { padding: 20, paddingBottom: 150 },
    profileHero: { alignItems: 'center', marginBottom: 25 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 5 },
    avatarText: { fontSize: 40, fontWeight: 'bold', color: '#FFF' },
    profileName: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginTop: 15 },
    roleBadge: { backgroundColor: 'rgba(81, 130, 118, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
    roleText: { color: Colors.primary, fontSize: 12, fontWeight: 'bold' },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    card: { backgroundColor: '#FFF', borderRadius: 20, padding: 10, elevation: 2 },
    fieldRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
    labelText: { fontSize: 11, color: '#94A3B8', fontWeight: 'bold' },
    valueText: { fontSize: 15, color: '#1E293B', fontWeight: '600', marginTop: 2 },
    input: { fontSize: 15, color: '#1E293B', fontWeight: '600', padding: 0, marginTop: 2 },
    saveBtn: { backgroundColor: Colors.primary, borderRadius: 15, height: 52, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 20, marginTop: 10 },
    logoutText: { color: Colors.error, fontSize: 15, fontWeight: 'bold', marginLeft: 10 },
});

export default DistributorProfile;
