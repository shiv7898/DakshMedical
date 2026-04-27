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
    Modal,
    Dimensions,
    Keyboard,
    Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../styles/theme';
import {
    User,
    Lock,
    Mail,
    ShieldCheck,
    ArrowLeft,
    CheckCircle2,
    Smartphone,
    MapPin,
    Cake,
    ChevronDown,
    Calendar,
    Hash,
    Eye,
    EyeOff,
    Stethoscope,
    Building2,
    GraduationCap,
    Award,
    Store,
    Briefcase,
    FileDigit,
    BadgeCheck,
    Home,
    Map
} from 'lucide-react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { savePatientInfo, saveDoctorInfo } from '../api/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CreateUser = ({ navigation }) => {
    const insets = useSafeAreaInsets();

    // --- Form State ---
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'patient',
        age: '',
        gender: 'male',
        dob: new Date(),
        dobSelected: false,
        phone: '',
        homeAddress: '',
        area: '',
        district: '',
        state: '',
        pincode: '',
        // Doctor specific
        hospital: '',
        specialization: '',
        qualification: '',
        experience: '',
        // Distributor specific
        companyName: '',
        businessType: '',
        distributorType: 'wholesaler', // wholesaler | retailer | dealer
        licenseNumber: ''
    });

    // --- UI State ---
    const [focusField, setFocusField] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(null); // 'role' | 'gender' | 'distributorType' | null
    const [isLoading, setIsLoading] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // --- Refs ---
    const scrollRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

        const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
            setKeyboardHeight(e.endCoordinates.height);
        });
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    const updateForm = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            // Calculate age automatically
            const today = new Date();
            let age = today.getFullYear() - selectedDate.getFullYear();
            const m = today.getMonth() - selectedDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
                age--;
            }

            setFormData(prev => ({
                ...prev,
                dob: selectedDate,
                age: age >= 0 ? age.toString() : '0',
                dobSelected: true
            }));
        }
    };

    const handleCreateAccount = () => {
        const { name, email, password, confirmPassword, phone, homeAddress, area, pincode } = formData;
        if (!name || !email || !password || !phone || !homeAddress || !area || !pincode) {
            Alert.alert('Required', 'Please fill all fields.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Mismatch', 'Passwords do not match.');
            return;
        }

        setIsLoading(true);
        setTimeout(async () => {
            try {
                if (formData.role === 'doctor') {
                    await saveDoctorInfo({
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        age: formData.age,
                        gender: formData.gender,
                        dob: formData.dobSelected ? formData.dob.toLocaleDateString() : '',
                        homeAddress: formData.homeAddress,
                        area: formData.area,
                        district: formData.district,
                        state: formData.state,
                        pincode: formData.pincode,
                        hospital: formData.hospital,
                        specialisation: formData.specialization,
                        qualification: formData.qualification,
                        experience: formData.experience
                    });
                } else if (formData.role === 'patient') {
                    await savePatientInfo({
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        age: formData.age,
                        gender: formData.gender,
                        dob: formData.dobSelected ? formData.dob.toLocaleDateString() : '',
                        homeAddress: formData.homeAddress,
                        area: formData.area,
                        district: formData.district,
                        state: formData.state,
                        pincode: formData.pincode
                    });
                }
                setIsLoading(false);
                Alert.alert('Success', 'Profile created successfully!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
            } catch (error) {
                setIsLoading(false);
                Alert.alert('Error', 'Failed to save profile locally.');
                console.error(error);
            }
        }, 1200);
    };

    // --- Compact Picker Component ---
    const CustomPicker = ({ label, type, value, icon, onOpen }) => (
        <View style={styles.pickerWrapper}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TouchableOpacity
                style={[styles.inputContainer, pickerVisible === type && styles.inputFocused]}
                onPress={() => {
                    Keyboard.dismiss();
                    onOpen();
                }}
                activeOpacity={0.7}
                collapsable={false}
            >
                <View style={styles.inputIcon}>{icon}</View>
                <Text style={[styles.pickerValue, !value && { color: '#94A3B8' }]} numberOfLines={1}>
                    {value || `Select`}
                </Text>
                <ChevronDown size={16} color="#94A3B8" />
            </TouchableOpacity>
        </View>
    );

    const SelectionModal = () => (
        <Modal transparent visible={!!pickerVisible} animationType="fade">
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setPickerVisible(null)}
            >
                <View style={styles.modalContent}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalHeaderTitle}>Select {pickerVisible === 'role' ? 'Role' : 'Gender'}</Text>

                    {pickerVisible === 'role' ? (
                        <>
                            {['Patient', 'Doctor', 'Distributor'].map((role) => (
                                <TouchableOpacity
                                    key={role}
                                    style={styles.modalItem}
                                    onPress={() => { updateForm('role', role.toLowerCase()); setPickerVisible(null); }}
                                >
                                    <Text style={[styles.modalItemText, formData.role === role.toLowerCase() && styles.modalItemActive]}>{role}</Text>
                                    {formData.role === role.toLowerCase() && <CheckCircle2 size={18} color={Colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </>
                    ) : pickerVisible === 'gender' ? (
                        <>
                            {['Male', 'Female', 'Other'].map((gender) => (
                                <TouchableOpacity
                                    key={gender}
                                    style={styles.modalItem}
                                    onPress={() => { updateForm('gender', gender.toLowerCase()); setPickerVisible(null); }}
                                >
                                    <Text style={[styles.modalItemText, formData.gender === gender.toLowerCase() && styles.modalItemActive]}>{gender}</Text>
                                    {formData.gender === gender.toLowerCase() && <CheckCircle2 size={18} color={Colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </>
                    ) : (
                        <>
                            {['Wholesaler', 'Retailer', 'Dealer'].map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={styles.modalItem}
                                    onPress={() => { updateForm('distributorType', type.toLowerCase()); setPickerVisible(null); }}
                                >
                                    <Text style={[styles.modalItemText, formData.distributorType === type.toLowerCase() && styles.modalItemActive]}>{type}</Text>
                                    {formData.distributorType === type.toLowerCase() && <CheckCircle2 size={18} color={Colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
            <View style={styles.brandHeader}>
                <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={22} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>User Registration</Text>
                <View style={{ width: 36 }} />
            </View>

            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 10}
                >
                    <ScrollView
                        ref={scrollRef}
                        contentContainerStyle={[
                            styles.scrollContent,
                            { paddingBottom: keyboardHeight > 0 ? 290 : 200 }
                        ]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        alwaysBounceVertical={true}
                    >
                        <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
                            <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>

                                <Text style={styles.cardHeader}>Profile Information</Text>

                                <View style={styles.formGroup}>
                                    {/* User Role Selection - Moved to TOP */}
                                    <CustomPicker
                                        label="User Role"
                                        type="role"
                                        value={formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                                        icon={<Icon name="account-group" size={18} color={Colors.primary} />}
                                        onOpen={() => setPickerVisible('role')}
                                    />

                                    {/* Name */}
                                    <View style={[styles.inputContainer, focusField === 'name' && styles.inputFocused]} collapsable={false}>
                                        <View style={styles.inputIcon}><User size={18} color={focusField === 'name' ? Colors.primary : '#94A3B8'} /></View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Full Name"
                                            placeholderTextColor="#94A3B8"
                                            value={formData.name}
                                            onChangeText={(v) => updateForm('name', v)}
                                            onFocus={() => setFocusField('name')}
                                            onBlur={() => setFocusField(null)}
                                        />
                                    </View>

                                    {/* Doctor Specific Fields */}
                                    {formData.role === 'doctor' && (
                                        <>
                                            <View style={[styles.inputContainer, focusField === 'hospital' && styles.inputFocused]} collapsable={false}>
                                                <View style={styles.inputIcon}><Building2 size={18} color={focusField === 'hospital' ? Colors.primary : '#94A3B8'} /></View>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Hospital / Clinic Name"
                                                    value={formData.hospital}
                                                    onChangeText={(v) => updateForm('hospital', v)}
                                                    onFocus={() => setFocusField('hospital')}
                                                    onBlur={() => setFocusField(null)}
                                                />
                                            </View>
                                            <View style={styles.row}>
                                                <View style={[styles.inputContainer, { flex: 1 }, focusField === 'specialization' && styles.inputFocused]} collapsable={false}>
                                                    <View style={styles.inputIcon}><Stethoscope size={18} color={Colors.primary} /></View>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Specialization"
                                                        value={formData.specialization}
                                                        onChangeText={(v) => updateForm('specialization', v)}
                                                        onFocus={() => setFocusField('specialization')}
                                                        onBlur={() => setFocusField(null)}
                                                    />
                                                </View>
                                                <View style={[styles.inputContainer, { flex: 1 }, focusField === 'qualification' && styles.inputFocused]} collapsable={false}>
                                                    <View style={styles.inputIcon}><GraduationCap size={18} color={Colors.primary} /></View>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Qualification"
                                                        value={formData.qualification}
                                                        onChangeText={(v) => updateForm('qualification', v)}
                                                        onFocus={() => setFocusField('qualification')}
                                                        onBlur={() => setFocusField(null)}
                                                    />
                                                </View>
                                            </View>
                                            <View style={[styles.inputContainer, focusField === 'experience' && styles.inputFocused]} collapsable={false}>
                                                <View style={styles.inputIcon}><Award size={18} color={focusField === 'experience' ? Colors.primary : '#94A3B8'} /></View>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Experience (in years)"
                                                    value={formData.experience}
                                                    onChangeText={(v) => updateForm('experience', v)}
                                                    onFocus={() => setFocusField('experience')}
                                                    onBlur={() => setFocusField(null)}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                        </>
                                    )}

                                    {/* Distributor Specific Fields */}
                                    {formData.role === 'distributor' && (
                                        <>
                                            <View style={[styles.inputContainer, focusField === 'companyName' && styles.inputFocused]} collapsable={false}>
                                                <View style={styles.inputIcon}><Store size={18} color={focusField === 'companyName' ? Colors.primary : '#94A3B8'} /></View>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="Company / Shop Name"
                                                    value={formData.companyName}
                                                    onChangeText={(v) => updateForm('companyName', v)}
                                                    onFocus={() => setFocusField('companyName')}
                                                    onBlur={() => setFocusField(null)}
                                                />
                                            </View>
                                            <View style={styles.row}>
                                                <View style={[styles.inputContainer, { flex: 1 }, focusField === 'businessType' && styles.inputFocused]} collapsable={false}>
                                                    <View style={styles.inputIcon}><Briefcase size={18} color={Colors.primary} /></View>
                                                    <TextInput
                                                        style={styles.input}
                                                        placeholder="Business Type"
                                                        value={formData.businessType}
                                                        onChangeText={(v) => updateForm('businessType', v)}
                                                        onFocus={() => setFocusField('businessType')}
                                                        onBlur={() => setFocusField(null)}
                                                    />
                                                </View>
                                                {/* <View style={{ flex: 1 }}>
                                                    <CustomPicker
                                                        label="Type"
                                                        type="distributorType"
                                                        value={formData.distributorType.charAt(0).toUpperCase() + formData.distributorType.slice(1)}
                                                        icon={<BadgeCheck size={16} color={Colors.primary} />}
                                                        onOpen={() => setPickerVisible('distributorType')}
                                                    />
                                                </View> */}
                                            </View>
                                            <View style={[styles.inputContainer, focusField === 'licenseNumber' && styles.inputFocused]} collapsable={false}>
                                                <View style={styles.inputIcon}><FileDigit size={18} color={focusField === 'licenseNumber' ? Colors.primary : '#94A3B8'} /></View>
                                                <TextInput
                                                    style={styles.input}
                                                    placeholder="License Number"
                                                    value={formData.licenseNumber}
                                                    onChangeText={(v) => updateForm('licenseNumber', v)}
                                                    onFocus={() => setFocusField('licenseNumber')}
                                                    onBlur={() => setFocusField(null)}
                                                />
                                            </View>
                                        </>
                                    )}

                                    {/* Dropdowns Row - Now only Gender */}
                                    <View style={styles.row}>
                                        <View style={{ flex: 1 }}>
                                            <CustomPicker
                                                label="Gender"
                                                type="gender"
                                                value={formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1)}
                                                icon={<Icon name="gender-male-female" size={18} color={Colors.primary} />}
                                                onOpen={() => setPickerVisible('gender')}
                                            />
                                        </View>
                                    </View>

                                    {/* Contact Information */}
                                    <View style={[styles.inputContainer, focusField === 'email' && styles.inputFocused]} collapsable={false}>
                                        <View style={styles.inputIcon}><Mail size={18} color={focusField === 'email' ? Colors.primary : '#94A3B8'} /></View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Email ID"
                                            value={formData.email}
                                            onChangeText={(v) => updateForm('email', v)}
                                            onFocus={() => setFocusField('email')}
                                            onBlur={() => setFocusField(null)}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>

                                    <View style={[styles.inputContainer, focusField === 'phone' && styles.inputFocused]} collapsable={false}>
                                        <View style={styles.inputIcon}><Smartphone size={18} color={focusField === 'phone' ? Colors.primary : '#94A3B8'} /></View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Phone Number"
                                            value={formData.phone}
                                            onChangeText={(v) => updateForm('phone', v)}
                                            onFocus={() => setFocusField('phone')}
                                            onBlur={() => setFocusField(null)}
                                            keyboardType="phone-pad"
                                        />
                                    </View>

                                    {/* DOB and Age */}
                                    <View style={styles.row}>
                                        <TouchableOpacity
                                            style={[styles.inputContainer, { flex: 1.2 }]}
                                            onPress={() => {
                                                Keyboard.dismiss();
                                                setShowDatePicker(true);
                                            }}
                                            collapsable={false}
                                        >
                                            <View style={styles.inputIcon}><Calendar size={18} color={Colors.primary} /></View>
                                            <Text style={[styles.inputText, !formData.dobSelected && { color: '#94A3B8' }]}>
                                                {formData.dobSelected ? formData.dob.toLocaleDateString() : 'Date of Birth'}
                                            </Text>
                                        </TouchableOpacity>
                                        <View style={[styles.inputContainer, { flex: 0.8 }, focusField === 'age' && styles.inputFocused]} collapsable={false}>
                                            <View style={styles.inputIcon}><Hash size={16} color={Colors.primary} /></View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Age"
                                                value={formData.age}
                                                onChangeText={(v) => updateForm('age', v)}
                                                onFocus={() => setFocusField('age')}
                                                onBlur={() => setFocusField(null)}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={formData.dob}
                                            mode="date"
                                            display="default"
                                            onChange={handleDateChange}
                                        />
                                    )}

                                    {/* Granular Address Section */}


                                    <View style={styles.row}>

                                        <View style={[styles.inputContainer, { flex: 1 }, focusField === 'district' && styles.inputFocused]} collapsable={false}>
                                            <View style={styles.inputIcon}><MapPin size={18} color={focusField === 'district' ? Colors.primary : '#94A3B8'} /></View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="District"
                                                placeholderTextColor="#94A3B8"
                                                value={formData.district}
                                                onChangeText={(v) => updateForm('district', v)}
                                                onFocus={() => setFocusField('district')}
                                                onBlur={() => setFocusField(null)}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.row}>
                                        <View style={[styles.inputContainer, { flex: 1 }, focusField === 'area' && styles.inputFocused]} collapsable={false}>
                                            <View style={styles.inputIcon}><Map size={18} color={focusField === 'area' ? Colors.primary : '#94A3B8'} /></View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Area / Sector / Locality"
                                                placeholderTextColor="#94A3B8"
                                                value={formData.area}
                                                onChangeText={(v) => updateForm('area', v)}
                                                onFocus={() => setFocusField('area')}
                                                onBlur={() => setFocusField(null)}
                                            />
                                        </View>

                                    </View>
                                    <View style={[styles.inputContainer, focusField === 'home' && styles.inputFocused]} collapsable={false}>
                                        <View style={styles.inputIcon}><Home size={18} color={focusField === 'home' ? Colors.primary : '#94A3B8'} /></View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Home Number / Building Name"
                                            placeholderTextColor="#94A3B8"
                                            value={formData.homeAddress}
                                            onChangeText={(v) => updateForm('homeAddress', v)}
                                            onFocus={() => setFocusField('home')}
                                            onBlur={() => setFocusField(null)}
                                        />
                                    </View>

                                    <View style={styles.row}>
                                        <View style={[styles.inputContainer, { flex: 1.2 }, focusField === 'state' && styles.inputFocused]} collapsable={false}>
                                            <View style={styles.inputIcon}><Map size={18} color={focusField === 'state' ? Colors.primary : '#94A3B8'} /></View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="State"
                                                placeholderTextColor="#94A3B8"
                                                value={formData.state}
                                                onChangeText={(v) => updateForm('state', v)}
                                                onFocus={() => setFocusField('state')}
                                                onBlur={() => setFocusField(null)}
                                            />
                                        </View>
                                        <View style={[styles.inputContainer, { flex: 0.8 }, focusField === 'pincode' && styles.inputFocused]} collapsable={false}>
                                            <View style={styles.inputIcon}><Hash size={16} color={focusField === 'pincode' ? Colors.primary : '#94A3B8'} /></View>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Pincode"
                                                placeholderTextColor="#94A3B8"
                                                value={formData.pincode}
                                                onChangeText={(v) => updateForm('pincode', v)}
                                                onFocus={() => setFocusField('pincode')}
                                                onBlur={() => setFocusField(null)}
                                                keyboardType="numeric"
                                                maxLength={6}
                                            />
                                        </View>
                                    </View>

                                    {/* Password Section */}
                                    <View style={[styles.inputContainer, focusField === 'pass' && styles.inputFocused]} collapsable={false}>
                                        <View style={styles.inputIcon}><Lock size={18} color={focusField === 'pass' ? Colors.primary : '#94A3B8'} /></View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Password"
                                            value={formData.password}
                                            onChangeText={(v) => updateForm('password', v)}
                                            onFocus={() => {
                                                setFocusField('pass');
                                                // Small delay to let keyboard show, then scroll to end to see the button
                                                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
                                            }}
                                            onBlur={() => setFocusField(null)}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                            {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                                        </TouchableOpacity>
                                    </View>

                                    <View style={[styles.inputContainer, focusField === 'confirm' && styles.inputFocused]} collapsable={false}>
                                        <View style={styles.inputIcon}><ShieldCheck size={18} color={focusField === 'confirm' ? Colors.primary : '#94A3B8'} /></View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Confirm Password"
                                            value={formData.confirmPassword}
                                            onChangeText={(v) => updateForm('confirmPassword', v)}
                                            onFocus={() => {
                                                setFocusField('confirm');
                                                // Small delay to let keyboard show, then scroll to end to see the button
                                                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
                                            }}
                                            onBlur={() => setFocusField(null)}
                                            secureTextEntry={!showConfirmPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                                            {showConfirmPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.submitBtn}
                                        onPress={handleCreateAccount}
                                        activeOpacity={0.8}
                                        disabled={isLoading}
                                    >
                                        <Text style={styles.submitText}>{isLoading ? 'SUBMITTING...' : 'CREATE ACCOUNT'}</Text>
                                        <CheckCircle2 size={16} color="#FFF" style={{ marginLeft: 6 }} />
                                    </TouchableOpacity>

                                </View>
                            </Animated.View>
                            <Text style={styles.footerInfo}>Secure Platform • AirSine v1.0.5</Text>
                        </Pressable>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <SelectionModal />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    brandHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 10,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : 20,
        backgroundColor: Colors.primary,
        elevation: 8,
    },
    headerBackBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    scrollContent: {
        padding: 12,
    },
    formCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        marginBottom: 10,
    },
    cardHeader: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 16,
        textAlign: 'center',
    },
    formGroup: {
        gap: 10,
    },
    pickerWrapper: {
        marginBottom: 0,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        marginBottom: 4,
        marginLeft: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        height: 50,
        paddingHorizontal: 12,
        borderWidth: 1.2,
        borderColor: '#E2E8F0',
    },
    inputFocused: {
        borderColor: Colors.primary,
        backgroundColor: '#FFF',
        elevation: 2,
    },
    inputIcon: {
        width: 24,
        alignItems: 'flex-start',
    },
    eyeIcon: {
        padding: 4,
    },
    input: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
        paddingVertical: 8,
    },
    inputText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    pickerValue: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    row: {
        flexDirection: 'row',
        gap: 8,
    },
    addressBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1.2,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'flex-start',
        minHeight: 70,
    },
    addressBoxFocused: {
        borderColor: Colors.primary,
        backgroundColor: '#FFF',
    },
    addressIcon: {
        marginTop: 2,
        marginRight: 8,
    },
    addressInput: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#1E293B',
        textAlignVertical: 'top',
        paddingTop: 0,
    },
    submitBtn: {
        backgroundColor: Colors.primary,
        height: 50,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 5,
        shadowColor: Colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    submitText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: 30,
    },
    modalHandle: {
        width: 32,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 10,
        alignSelf: 'center',
        marginBottom: 16,
    },
    modalHeaderTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalItemText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    modalItemActive: {
        color: Colors.primary,
        fontWeight: '800',
    },
    footerInfo: {
        textAlign: 'center',
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '700',
        marginBottom: 10,
        marginTop: 4,
    }
});

export default CreateUser;
