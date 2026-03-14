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
} from 'react-native';
import * as DocumentPicker from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import { Colors, Spacing, Typography } from '../styles/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { parseCSV } from '../utils/csvParser';
// import { insertLog } from '../api/database';
import { recreateLogsTableWithData } from '../api/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ImportLogScreen = ({ route, navigation }) => {
    const { machineType } = route.params;
    const [loading, setLoading] = useState(false);

    const handleSkip = () => {
        navigation.navigate('MainTabs');
    };

    const handlePickFile = async () => {
        try {
            const res = await DocumentPicker.pick({
                type: [DocumentPicker.types.allFiles, 'text/csv', 'application/vnd.ms-excel'],
                copyTo: 'cachesDirectory',
            });

            console.log('Picked File:', res[0]);

            setLoading(true);
            const pickedFile = res[0];
            let readablePath = pickedFile.fileCopyUri || pickedFile.uri;

            if (readablePath.startsWith('file://')) {
                readablePath = Platform.OS === 'android' ? decodeURIComponent(readablePath.replace('file://', '')) : readablePath;
            }

            const fileContent = await RNFS.readFile(readablePath, 'utf8');
            const parsedData = await parseCSV(fileContent);
            console.log('Parsed Data:', parsedData);

            if (!parsedData || parsedData.length === 0 || parsedData[0] === null) {
                throw new Error('No clinical therapy data found in the file.');
            }

            // Save to database
            // for (const item of parsedData) {
            //     if (item) {
            //         console.log('Attempting DB Insert for:', item.date);
            //         await insertLog({
            //             ...item,
            //             machine_type: machineType,
            //             patient_id: 1,
            //         });
            //         console.log('DB Insert Success for:', item.date);
            //     }
            // }
            // Prepare formatted data
            const formattedData = parsedData.map(item => ({
                ...item,
                machine_type: machineType,
                patient_id: 1,
            }));

            // 🔥 Drop + Recreate + Insert in single transaction
            await recreateLogsTableWithData(formattedData);

            setLoading(false);
            const importCount = parsedData.length;
            const summaryTitle = importCount > 1 ? 'Batch Import Successful' : 'Import Successful';
            const summaryMsg = importCount > 1
                ? `${importCount} days of clinical therapy data processed.\n\nDate Range: ${parsedData[importCount - 1].date} to ${parsedData[0].date}`
                : `Clinical data for ${parsedData[0].date} has been processed.\n\nUsage: ${parsedData[0].usage_hours} hrs\nAHI: ${parsedData[0].ahi}`;

            Alert.alert(
                summaryTitle,
                summaryMsg,
                [
                    // { text: 'View Report', onPress: () => navigation.navigate('Reports') },
                    { text: 'Dashboard', onPress: () => navigation.navigate('MainTabs') }
                ]
            );
        } catch (err) {
            setLoading(false);
            
            // Check for user cancellation in multiple ways
            const isCancelError = 
                (DocumentPicker.isCancel && DocumentPicker.isCancel(err)) ||
                err?.code === 'DOCUMENT_PICKER_CANCELED' ||
                err?.message?.toLowerCase()?.includes('cancel') ||
                err?.message?.toLowerCase()?.includes('user canceled');

            if (isCancelError) {
                console.log('User cancelled file picker');
                return; // Simply return, no error shown
            }
            
            console.error('CRITICAL IMPORT ERROR:', err);
            const errorMsg = err?.message || (typeof err === 'string' ? err : 'Internal Data Error');

            Alert.alert(
                'Import Failed',
                `Database Error: ${errorMsg}\n\nTry clicking "Setup Database" in settings if the problem persists.`,
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

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <View style={styles.iconCircle}>
                        <Icon name="cloud-upload-outline" size={SCREEN_WIDTH * 0.15} color={Colors.primary} />
                    </View>

                    <Text style={styles.title}>Clinical Data Import</Text>
                    <Text style={styles.subtitle}>
                        Device Mode: <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>{machineType}</Text>{'\n'}
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

                    <View style={styles.infoCard}>
                        <Icon name="shield-check-outline" size={22} color={Colors.primary} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.infoTitle}>Secure Analysis</Text>
                            <Text style={styles.infoText}>
                                Data is processed locally on your device for maximum privacy.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.helpLink}>
                        <Text style={styles.helpText}>Need help finding your log file?</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.l,
    },
    iconCircle: {
        width: SCREEN_WIDTH * 0.35,
        height: SCREEN_WIDTH * 0.35,
        borderRadius: (SCREEN_WIDTH * 0.35) / 2,
        backgroundColor: '#F8FBFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        borderWidth: 2,
        borderColor: '#E1E9F5',
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
        backgroundColor: '#F8FBFF',
        padding: Spacing.m,
        borderRadius: 12,
        marginTop: 40,
        borderWidth: 1,
        borderColor: '#E8F0F8',
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
});

export default ImportLogScreen;
