import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StatusBar,
    Dimensions,
    Platform,
    Alert,
    KeyboardAvoidingView,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
    FadeInUp,
    FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../styles/theme';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AddMachineScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [mode, setMode] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [serialNumber, setSerialNumber] = useState('');
    const [deviceModel, setDeviceModel] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
    const [isLoading, setIsLoading] = useState(false);
    const [addedDevices, setAddedDevices] = useState([]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleString());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleAddMachine = () => {
        if (!serialNumber || !deviceModel) {
            Alert.alert('Details Required', 'Please provide both serial number and device model to proceed.');
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            const newDevice = {
                id: Date.now().toString(),
                serialNumber,
                deviceModel,
                addedAt: new Date().toLocaleString()
            };
            setAddedDevices([...addedDevices, newDevice]);
            setIsLoading(false);
            setSerialNumber('');
            setDeviceModel('');
            setIsModalVisible(false);
            setMode(null);
            Alert.alert('Machine Linked', 'Device successfully integrated with your profile.');
        }, 1200);
    };

    const openAddModal = (selectedMode) => {
        setMode(selectedMode);
        setIsModalVisible(true);
    };

    const closeModal = () => {
        setIsModalVisible(false);
        setMode(null);
    };

    const renderEmptyState = () => (
        <Animated.View
            entering={FadeInUp.delay(200).duration(600)}
            style={styles.emptyContainer}
        >
            <View style={styles.emptyIconWrapper}>
                <Icon name="layers-off-outline" size={80} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>No Device Connected</Text>
            <Text style={styles.emptySub}>Your connected devices will appear here. Start by adding a machine using the options above.</Text>
        </Animated.View>
    );

    const renderDeviceItem = (item) => (
        <Animated.View
            key={item.id}
            entering={FadeInDown.duration(400)}
            style={styles.deviceCard}
        >
            <View style={styles.deviceIconBox}>
                <Icon name="robot-outline" size={24} color={Colors.primary} />
            </View>
            <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.deviceModel}</Text>
                <Text style={styles.deviceSerial}>SN: {item.serialNumber}</Text>
            </View>
            <View style={styles.deviceStatus}>
                <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active</Text>
                </View>
                <Text style={styles.deviceTime}>{item.addedAt.split(',')[0]}</Text>
            </View>
        </Animated.View>
    );

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

                {/* Premium Header */}
                <LinearGradient
                    colors={[Colors.primary, '#3d6d63']}
                    style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 10) }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                            <Icon name="arrow-left" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Add Machine</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, mode === 'manual' && styles.activeTab]}
                            onPress={() => openAddModal('manual')}
                        >
                            <Icon name="pencil-outline" size={18} color={mode === 'manual' ? Colors.primary : '#FFF'} />
                            <Text style={[styles.tabText, mode === 'manual' && styles.activeTabText]}>Manual</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, mode === 'qr' && styles.activeTab]}
                            onPress={() => openAddModal('qr')}
                        >
                            <Icon name="qrcode-scan" size={18} color={mode === 'qr' ? Colors.primary : '#FFF'} />
                            <Text style={[styles.tabText, mode === 'qr' && styles.activeTabText]}>QR Scan</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                <View style={styles.contentArea}>
                    <ScrollView
                        contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 20 }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Connected Devices</Text>
                            <Text style={styles.sectionCount}>{addedDevices.length} Total</Text>
                        </View>

                        {addedDevices.length === 0 ? renderEmptyState() : (
                            addedDevices.map(renderDeviceItem)
                        )}
                    </ScrollView>
                </View>

                {/* Add Device Modal */}
                {isModalVisible && (
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                                <Animated.View entering={FadeInUp} style={styles.modalContent}>
                                    <View style={styles.modalHeader}>
                                        <Text style={styles.modalTitle}>
                                            {mode === 'manual' ? 'Add Manually' : 'Scan QR Code'}
                                        </Text>
                                        <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                                            <Icon name="close" size={24} color="#64748B" />
                                        </TouchableOpacity>
                                    </View>

                                    {mode === 'manual' ? (

                                        <View style={styles.formContent}>
                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Serial Number</Text>
                                                <View style={styles.inputField}>
                                                    <Icon name="numeric" size={20} color={Colors.primary} />
                                                    <TextInput
                                                        style={styles.textInput}
                                                        placeholder="e.g. SN2024-8899"
                                                        placeholderTextColor="#94A3B8"
                                                        value={serialNumber}
                                                        onChangeText={setSerialNumber}
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.inputGroup}>
                                                <Text style={styles.inputLabel}>Device Model</Text>
                                                <View style={styles.inputField}>
                                                    <Icon name="robot-outline" size={20} color={Colors.primary} />
                                                    <TextInput
                                                        style={styles.textInput}
                                                        placeholder="e.g. AirSense 10"
                                                        placeholderTextColor="#94A3B8"
                                                        value={deviceModel}
                                                        onChangeText={setDeviceModel}
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.metaBox}>
                                                <Icon name="clock-outline" size={16} color="#64748B" />
                                                <Text style={styles.metaValue}>{currentTime}</Text>
                                            </View>

                                            <TouchableOpacity
                                                style={styles.submitBtn}
                                                onPress={handleAddMachine}
                                                activeOpacity={0.8}
                                                disabled={isLoading}
                                            >
                                                <LinearGradient
                                                    colors={['#518276', '#3b665c']}
                                                    style={styles.btnGradient}
                                                >
                                                    <Text style={styles.btnText}>{isLoading ? 'Linking...' : 'Connect Machine'}</Text>
                                                    <Icon name="check-circle" size={18} color="#FFF" style={{ marginLeft: 8 }} />
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <View style={styles.qrContent}>
                                            <View style={styles.scannerHero}>
                                                <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
                                                <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
                                                <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
                                                <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />

                                                <Icon name="qrcode" size={100} color="rgba(81, 130, 118, 0.1)" />
                                                <View style={styles.scanningLine} />
                                            </View>
                                            <Text style={styles.qrSub}>Position the QR code within the frame to scan automatically.</Text>
                                            <TouchableOpacity style={styles.cameraBtn}>
                                                <LinearGradient
                                                    colors={['#10B981', '#059669']}
                                                    style={styles.cameraBtnGradient}
                                                >
                                                    <Icon name="camera" size={20} color="#FFF" />
                                                    <Text style={styles.cameraBtnText}>Open Camera</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </Animated.View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                )}
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.15)',
        padding: 5,
        borderRadius: 16,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#FFF',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.8)',
        marginLeft: 8,
    },
    activeTabText: {
        color: Colors.primary,
    },
    contentArea: {
        flex: 1,
    },
    scrollBody: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    sectionCount: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
        backgroundColor: 'rgba(81, 130, 118, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyIconWrapper: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 10,
    },
    emptySub: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
    },
    deviceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    deviceIconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: 'rgba(81, 130, 118, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deviceInfo: {
        flex: 1,
        marginLeft: 15,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    deviceSerial: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    deviceStatus: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 5,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#059669',
    },
    deviceTime: {
        fontSize: 11,
        color: '#94A3B8',
    },
    modalOverlay: {
        position: 'absolute',
        top: -150,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: SCREEN_HEIGHT * 0.8,
        elevation: 20,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 15,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    closeBtn: {
        padding: 4,
    },
    formContent: {
        paddingBottom: 10,
    },
    inputGroup: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 6,
        marginLeft: 4,
    },
    inputField: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        height: 50,
    },
    textInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '600',
    },
    metaBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        padding: 10,
        borderRadius: 10,
        marginBottom: 16,
    },
    metaValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginLeft: 6,
    },
    submitBtn: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    btnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    btnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '800',
    },
    qrContent: {
        alignItems: 'center',
        paddingBottom: 10,
    },
    scannerHero: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        marginBottom: 16,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderColor: Colors.primary,
        borderRadius: 5,
    },
    scanningLine: {
        position: 'absolute',
        width: '80%',
        height: 2,
        backgroundColor: Colors.primary,
        opacity: 0.6,
    },
    qrSub: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    cameraBtn: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
    },
    cameraBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    cameraBtnText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 8,
    },
});

export default AddMachineScreen;
