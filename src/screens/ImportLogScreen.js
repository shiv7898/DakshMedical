import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    Dimensions,
    Platform,
    StatusBar,
    Switch,
    Modal,
} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as DocumentPicker from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import { Colors, Spacing, Typography } from '../styles/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { parseCSV } from '../utils/csvParser';
// import { insertLog } from '../api/database';
import { recreateLogsTableWithData } from '../api/database';
import { useData } from '../context/DataContext';



const ImportLogScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [availableModes, setAvailableModes] = useState([]);
    const { selectedModes, setSelectedModes } = useData();
    const [showModesModal, setShowModesModal] = useState(false);
    const [parsedDataState, setParsedDataState] = useState([]);
    const [importSummaryText, setImportSummaryText] = useState('');

    const handleSkip = () => {
        navigation.navigate('Home');
    };

    const handlePickFile = async () => {
        try {
            // Small delay to ensure the activity is fully ready and focused
            // This prevents "Current activity is null" errors on some Android versions
            if (Platform.OS === 'android') {
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            const res = await DocumentPicker.pick({
                // Using only csv and all files for maximum compatibility
                type: [DocumentPicker.types.allFiles, 'text/csv'],
                copyTo: 'cachesDirectory',
            });

            if (!res || res.length === 0) return;

            console.log('Picked File:', res[0]);
            setLoading(true);
            const pickedFile = res[0];
            let readablePath = pickedFile.fileCopyUri || pickedFile.uri;

            if (readablePath.startsWith('file://')) {
                readablePath = Platform.OS === 'android' ? decodeURIComponent(readablePath.replace('file://', '')) : readablePath;
            }

            const fileContent = await RNFS.readFile(readablePath, 'utf8');
            const parsedData = await parseCSV(fileContent);
            console.log('Parsed Data Count:', parsedData?.length);

            if (!parsedData || parsedData.length === 0 || parsedData[0] === null) {
                throw new Error('No clinical therapy data found in the file.');
            }

            const formattedData = parsedData.map(item => ({
                ...item,
                patient_id: 1,
            }));

            await recreateLogsTableWithData(formattedData);

            setParsedDataState(parsedData);
            const importCount = parsedData.length;
            const summaryMsg = importCount > 1
                ? `${importCount} days of clinical therapy data processed.\n\nDate Range: ${parsedData[importCount - 1].date} to ${parsedData[0].date}`
                : `Clinical data for ${parsedData[0].date} has been processed.\n\nUsage: ${parsedData[0].usage_hours} hrs\nAHI: ${parsedData[0].ahi}`;
            setImportSummaryText(summaryMsg);

            // Determine unique therapy modes present in the logs, excluding 'MIXED'
            const modesSet = new Set();
            parsedData.forEach(item => {
                if (item.modes_used_today && item.modes_used_today.length > 0) {
                    item.modes_used_today.forEach(m => {
                        const mode = m.trim().toUpperCase();
                        if (mode !== 'MIXED') modesSet.add(mode);
                    });
                } else if (item.therapy_type) {
                    const mode = item.therapy_type.trim().toUpperCase();
                    if (mode !== 'MIXED') {
                        modesSet.add(mode);
                    }
                }
            });
            const modesArray = Array.from(modesSet);
            setAvailableModes(modesArray);
            setSelectedModes(modesArray); // pre-select all available modes
            setLoading(false);
            setShowModesModal(true); // Open the custom selection modal instead of simple Alert.alert
        } catch (err) {
            setLoading(false);

            // Correct way to check for cancellation in @react-native-documents/picker
            const isCancel =
                (DocumentPicker.isErrorWithCode(err) && err.code === DocumentPicker.errorCodes.OPERATION_CANCELED) ||
                err?.code === 'OPERATION_CANCELED' ||
                err?.code === 'DOCUMENT_PICKER_CANCELED' ||
                err?.message?.includes('cancel');

            if (isCancel) {
                console.log('File picker cancelled by user');
                return;
            }

            console.error('CRITICAL IMPORT ERROR:', err);
            const errorMsg = err?.message || (typeof err === 'string' ? err : 'Internal Access Error');

            // Specific handling for "Activity is null" - often a race condition
            // In this library, it might appear as NULL_PRESENTER
            if (errorMsg.includes('activity is null') || err?.code === 'NULL_PRESENTER' || err?.code === DocumentPicker.errorCodes.NULL_PRESENTER) {
                Alert.alert(
                    'Picker Busy',
                    'The system file picker is currently busy. Please wait a moment and click "Select File" again.',
                    [{ text: 'Retry', onPress: () => setTimeout(handlePickFile, 500) }, { text: 'OK' }]
                );
                return;
            }

            Alert.alert(
                'Import Failed',
                `Database Error: ${errorMsg}\n\nPlease ensure your SD card or file is accessible.`,
                [{ text: 'OK' }]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Import Log</Text>
                <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                    <Text style={styles.skipText}>SKIP</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <View style={styles.iconCircle}>
                        <Icon name="cloud-upload-outline" size={60} color={Colors.primary} />
                    </View>

                    <Text style={styles.title}>Clinical Data Import</Text>
                    <Text style={styles.subtitle}>
                        Upload the clinical log file from your SD card.
                    </Text>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={[Typography.caption, { marginTop: 10 }]}>Processing therapy logs...</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.importButton} onPress={handlePickFile} activeOpacity={0.8}>
                            <Icon name="file-upload" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.buttonText}>SELECT FILE</Text>
                        </TouchableOpacity>
                    )}



                    <TouchableOpacity style={styles.helpLink}>
                        <Text style={styles.helpText}>Need help finding your log file?</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Therapy Modes Selection Overlay */}
            <Modal
                visible={showModesModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowModesModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Batch Import Successful</Text>
                        <Text style={styles.modalSubtitle}>{importSummaryText}</Text>
                        <Text style={styles.selectHeader}>Select Therapy Modes to Include in PDF Summary:</Text>
                        <ScrollView style={{ maxHeight: 200, marginBottom: 15 }}>
                            {availableModes.map((mode, idx) => (
                                <View key={idx} style={styles.modeItem}>
                                    <Text style={styles.modeLabel}>{mode}</Text>
                                    <Switch
                                        value={selectedModes.includes(mode)}
                                        onValueChange={() => {
                                            setSelectedModes(prev =>
                                                prev.includes(mode)
                                                    ? prev.filter(m => m !== mode)
                                                    : [...prev, mode]
                                            );
                                        }}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                        <TouchableOpacity 
                            style={styles.confirmButton} 
                            onPress={async () => {
                                try {
                                    console.log('Selected modes to save:', selectedModes);
                                    setShowModesModal(false);
                                    navigation.navigate('Home');
                                } catch (err) {
                                    console.error('Error in saving selected modes:', err);
                                    setShowModesModal(false);
                                    navigation.navigate('Home');
                                }
                            }}
                        >
                            <Text style={styles.confirmButtonText}>Save & Go to Dashboard</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 14,
        paddingBottom: 14,
        backgroundColor: Colors.primary,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
        marginLeft: 10,
    },
    backButton: {
        padding: 4,
    },
    skipButton: {
        paddingVertical: 6,
        paddingHorizontal: 15,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    skipText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.l,
        marginBottom: Spacing.l,
    },
    iconCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: Colors.surface, // Green tint
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: 'dashed',
    },
    title: {
        ...Typography.header,
        fontSize: 22,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.body,
        textAlign: 'center',
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
        lineHeight: 20,
        fontSize: 14,
    },
    importButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        paddingVertical: 14,
        paddingHorizontal: 35,
        borderRadius: 12,
        elevation: 4,
        shadowColor: Colors.primary,
        shadowOpacity: 0.2,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 15,
        letterSpacing: 1,
    },
    loadingContainer: {
        alignItems: 'center',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        padding: Spacing.m,
        borderRadius: 12,
        marginTop: 40,
        borderWidth: 1,
        borderColor: Colors.border,
        width: '100%',
    },
    infoTitle: {
        color: Colors.text,
        fontSize: 13,
        fontWeight: 'bold',
    },
    infoText: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
        lineHeight: 18,
    },
    helpLink: {
        marginTop: 25,
        padding: 10,
    },
    helpText: {
        color: Colors.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
        textAlign: 'center',
        lineHeight: 20,
    },
    selectHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 12,
    },
    modeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF2F7',
    },
    modeLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.text,
    },
    confirmButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ImportLogScreen;
