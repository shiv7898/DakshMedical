import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ScrollView,
    SafeAreaView,
    Platform,
    StatusBar,
    Dimensions,
    Linking,
} from 'react-native';
import { Colors, Spacing, Typography } from '../styles/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { generatePDF as createPDF } from 'react-native-html-to-pdf';
import ViewShot from 'react-native-view-shot';
import { LineChart, BarChart } from 'react-native-chart-kit';
import RNFS from 'react-native-fs';
import { getLogs, getPatientInfo } from '../api/database';

const { width } = Dimensions.get('window');

const ReportPreviewScreen = () => {
    const [logs, setLogs] = useState([]);
    const [patient, setPatient] = useState(null);
    const [generating, setGenerating] = useState(false);
    const ahiChartRef = useRef(null);
    const usageChartRef = useRef(null);
    const leakChartRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const logData = await getLogs();
        const patientData = await getPatientInfo();
        setLogs(logData);
        setPatient(patientData || { name: 'Daksh Singh', age: 32, machine_serial: 'AIR-9922-G3' });
    };

    const calculateSummary = () => {
        if (logs.length === 0) return null;

        const totalDays = logs.length;
        const validLogs = logs.filter(l => l !== null);

        const compliantDays = validLogs.filter(l => (l.usage_hours || 0) >= 4).length;
        const compliancePct = ((compliantDays / totalDays) * 100).toFixed(1);

        const avgUsage = (validLogs.reduce((acc, curr) => acc + (parseFloat(curr.usage_hours) || 0), 0) / totalDays).toFixed(1);
        const avgAHI = (validLogs.reduce((acc, curr) => acc + (parseFloat(curr.ahi) || 0), 0) / totalDays).toFixed(1);
        const avgP95 = (validLogs.reduce((acc, curr) => acc + (parseFloat(curr.pressure_95th) || 0), 0) / totalDays).toFixed(1);

        return { totalDays, compliantDays, compliancePct, avgUsage, avgAHI, avgP95 };
    };

    // Capture a single chart ref safely
    const captureChart = async (ref) => {
        try {
            if (ref.current) {
                return await ref.current.capture();
            }
        } catch (e) {
            console.log("Error capturing chart:", e);
        }
        return '';
    };

    const handleGeneratePDF = async () => {
        if (!logs || logs.length === 0 || (logs.length === 1 && logs[0].id === 9999)) {
            Alert.alert('No Clinical Data', 'Please import therapy logs from the machine selection screen first.');
            return;
        }

        setGenerating(true);
        try {
            // Capture each graph separately
            const ahiImg = await captureChart(ahiChartRef);
            const usageImg = await captureChart(usageChartRef);
            const leakImg = await captureChart(leakChartRef);

            const summary = calculateSummary();
            const dateStr = new Date().toLocaleDateString('en-IN');

            const tableRows = logs.map(log => {
                const ahiVal = log.ahi !== null && log.ahi !== undefined ? log.ahi : '--';
                const usageVal = log.usage_hours !== null && log.usage_hours !== undefined ? log.usage_hours : '--';
                const pAvg = log.pressure_avg !== null && log.pressure_avg !== undefined ? log.pressure_avg : '--';
                const p95 = log.pressure_95th !== null && log.pressure_95th !== undefined ? log.pressure_95th : '--';
                const ahiColor = log.ahi > 5 ? '#D32F2F' : '#2E7D32';

                return `
                    <tr style="border-bottom: 1px solid #E3F2FD;">
                        <td style="padding: 8px 10px;">${log.date || '--'}</td>
                        <td style="padding: 8px 10px; font-weight: bold;">${usageVal}${usageVal !== '--' ? 'h' : ''}</td>
                        <td style="padding: 8px 10px; color: ${ahiColor}; font-weight: bold;">${ahiVal}</td>
                        <td style="padding: 8px 10px;">${pAvg}</td>
                        <td style="padding: 8px 10px; color: #1E88E5;">${p95}</td>
                    </tr>
                `;
            }).join('');

            // Build graph sections - each with page-break-inside avoid
            const graphSection = (title, imgBase64) => {
                if (!imgBase64) return '';
                return `
                    <div style="page-break-inside: avoid; margin-bottom: 20px;">
                        <h4 style="color: #1E88E5; margin: 10px 0 5px 0;">${title}</h4>
                        <div style="text-align: center;">
                            <img src="data:image/jpeg;base64,${imgBase64}" style="width: 100%; max-width: 520px; border-radius: 8px;" />
                        </div>
                    </div>
                `;
            };

            const hasGraphs = ahiImg || usageImg || leakImg;

            const htmlContent = `
<html>
<head>
<style>
    body {
        font-family: Arial, sans-serif;
        padding: 40px;
        color: #000;
        font-size: 12px;
    }

    h1 {
        text-align: center;
        font-size: 20px;
        margin-bottom: 30px;
    }

    .section {
        margin-bottom: 20px;
    }

    .divider {
        border-bottom: 1px solid #ccc;
        margin: 10px 0 20px 0;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
    }

    td {
        padding: 4px 6px;
        vertical-align: top;
    }

    .label {
        font-weight: bold;
        width: 150px;
    }

    .stat-table td {
        padding: 6px;
    }

    .stat-title {
        font-weight: bold;
        margin-top: 20px;
        margin-bottom: 10px;
    }

    .center-text {
        text-align: center;
    }

    .border-table {
        width: 100%;
        border: 1px solid #000;
        border-collapse: collapse;
        margin-top: 10px;
    }

    .border-table th,
    .border-table td {
        border: 1px solid #000;
        padding: 6px;
        text-align: center;
    }

</style>
</head>

<body>

<h1>Patient Report</h1>

<div class="section">
    <table>
        <tr>
            <td class="label">Patient Name:</td>
            <td>${patient?.name || '-'}</td>
            <td class="label">Patient ID:</td>
            <td>${patient?.id || '-'}</td>
        </tr>
        <tr>
            <td class="label">Gender:</td>
            <td>${patient?.gender || '-'}</td>
            <td class="label">Phone:</td>
            <td>${patient?.phone || '-'}</td>
        </tr>
        <tr>
            <td class="label">Birthday:</td>
            <td>${patient?.dob || '-'}</td>
            <td class="label">Email:</td>
            <td>${patient?.email || '-'}</td>
        </tr>
        <tr>
            <td class="label">Device Model:</td>
            <td>${patient?.device_model || '-'}</td>
            <td class="label">Device SN:</td>
            <td>${patient?.machine_serial || '-'}</td>
         
        </tr>
        <tr>
            <td class="label">Doctor Name:</td>
            <td>${'-'}</td>
            <td class="label">Doctor Phone:</td>
            <td>${'-'}</td>
        </tr>
    </table>
</div>

<div class="divider"></div>

<div class="section">
    <div class="stat-title">Statistical Information</div>

    <table class="stat-table">
        <tr>
            <td class="label">Selected Days:</td>
            <td>${summary?.totalDays || 0} Days</td>
            <td class="label">Total Usage:</td>
            <td>${summary?.avgUsage || 0} Hours</td>
        </tr>
        <tr>
            <td class="label">Compliance:</td>
            <td>${summary?.compliancePct || 0}%</td>
            <td class="label">Avg AHI:</td>
            <td>${summary?.avgAHI || 0}</td>
        </tr>
        <tr>
            <td class="label">Avg P95 Pressure:</td>
            <td>${summary?.avgP95 || 0}</td>
            <td></td>
            <td></td>
        </tr>
    </table>
</div>

<div class="divider"></div>

<div class="section">
    <div class="stat-title">Daily Usage Log</div>

    <table class="border-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Usage (h)</th>
                <th>AHI</th>
                <th>Avg Pressure</th>
                <th>95% Pressure</th>
            </tr>
        </thead>
        <tbody>
            ${logs.map(log => `
                <tr>
                    <td>${log.date || '-'}</td>
                    <td>${log.usage_hours || 0}</td>
                    <td>${log.ahi || 0}</td>
                    <td>${log.pressure_avg || 0}</td>
                    <td>${log.pressure_95th || 0}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

                    ${hasGraphs ? `
                    <div class="graphs-section">
                        <h3>Clinical Trends</h3>
                        ${graphSection('Pressure vs Time (cmH₂O)', ahiImg)}
                        ${graphSection('Flow vs Time (Usage)', usageImg)}
                        ${graphSection('Last 7 Days (Mask Off, Apnea, High Leak)', leakImg)}
                    </div>
                    ` : ''}
                </body>
                </html>
            `;

            const results = await createPDF({
                html: htmlContent,
                fileName: `Airsine_Report_${Date.now()}`,
                directory: 'Documents',
                base64: false,
            });

            console.log('PDF Result:', JSON.stringify(results));

            if (!results || !results.filePath) {
                Alert.alert('Error', 'PDF file could not be created.');
                setGenerating(false);
                return;
            }

            // Copy to Downloads folder for easy access
            const fileName = `Airsine_Report_${Date.now()}.pdf`;
            const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

            try {
                await RNFS.copyFile(results.filePath, downloadPath);
                // Open PDF for preview after saving
                Alert.alert(
                    '✅ Report Downloaded!',
                    `PDF saved to Downloads folder:\n${fileName}`,
                    [
                        { text: 'OK' },
                        {
                            text: 'Open PDF',
                            onPress: () => {
                                Linking.openURL('file://' + downloadPath).catch(() => {
                                    // Try content URI if file URI fails
                                    Linking.openURL('content://' + downloadPath).catch(() => { });
                                });
                            }
                        }
                    ]
                );
            } catch (copyErr) {
                // If copy to Downloads fails, still show success with original path
                Alert.alert(
                    '✅ Report Generated!',
                    `PDF saved at:\n${results.filePath}`,
                    [{ text: 'OK' }]
                );
            }

            setGenerating(false);

        } catch (error) {
            setGenerating(false);
            Alert.alert('Error', 'PDF generation failed');
            console.log('Error generating PDF:', error);
        }
    };

    const reversedLogs = useMemo(() => [...logs].slice(0, 7).reverse(), [logs]);
    const dates = useMemo(() => reversedLogs.map(l => l.date ? l.date.split('-')[2] : ''), [reversedLogs]);
    const summary = useMemo(() => calculateSummary(), [logs]);

    const chartConfig = useMemo(() => ({
        backgroundColor: "#FFFFFF",
        backgroundGradientFrom: "#FFFFFF",
        backgroundGradientTo: "#FFFFFF",
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(96, 125, 139, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: { r: "5", strokeWidth: "3", stroke: "#FFF" },
        barPercentage: 0.5,
        propsForLabels: { fontSize: 10 },
    }), []);

    const flowChartConfig = useMemo(() => ({
        ...chartConfig,
        color: (opacity = 1) => `rgba(0, 188, 212, ${opacity})`,
    }), [chartConfig]);

    const multiLineChartConfig = useMemo(() => ({
        ...chartConfig,
        color: (opacity = 1) => `rgba(158, 158, 158, ${opacity})`,
    }), [chartConfig]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Hidden off-screen: 3 separate ViewShots for each chart */}
            <View style={styles.hiddenChartContainer} collapsable={false}>
                {/* 1. Pressure vs Time */}
                <ViewShot ref={ahiChartRef} options={{ format: "jpg", quality: 0.9, result: "base64" }} collapsable={false}>
                    <View style={styles.hiddenChartView}>
                        {dates.length > 0 && <LineChart
                            data={{
                                labels: dates,
                                datasets: [{
                                    data: reversedLogs.map(l => l.pressure_95th || 0),
                                    strokeDashArray: [5, 5]
                                }]
                            }}
                            width={width - 30}
                            height={200}
                            chartConfig={{ ...chartConfig, propsForBackgroundLines: { strokeDasharray: "5,5" } }}
                            bezier
                            withInnerLines={true}
                        />}
                    </View>
                </ViewShot>

                {/* 2. Flow vs Time */}
                <ViewShot ref={usageChartRef} options={{ format: "jpg", quality: 0.9, result: "base64" }} collapsable={false}>
                    <View style={styles.hiddenChartView}>
                        {dates.length > 0 && <LineChart
                            data={{ labels: dates, datasets: [{ data: reversedLogs.map(l => l.usage_hours || 0) }] }}
                            width={width - 30}
                            height={180}
                            chartConfig={flowChartConfig}
                            bezier
                            withInnerLines={false}
                        />}
                    </View>
                </ViewShot>

                {/* 3. Last 7 Days (Mask Off, Apnea, High Leak) */}
                <ViewShot ref={leakChartRef} options={{ format: "jpg", quality: 0.9, result: "base64" }} collapsable={false}>
                    <View style={styles.hiddenChartView}>
                        {dates.length > 0 && <LineChart
                            data={{
                                labels: dates,
                                legend: ['Apnea (AHI)', 'High Leak', 'Mask Off'],
                                datasets: [
                                    { data: reversedLogs.map(l => l.ahi || 0), color: (opacity = 1) => `rgba(239, 83, 80, ${opacity})` },
                                    { data: reversedLogs.map(l => l.leak_rate || 0), color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})` },
                                    { data: reversedLogs.map(l => l.cai || 0), color: (opacity = 1) => `rgba(66, 165, 245, ${opacity})` }
                                ]
                            }}
                            width={width - 30}
                            height={200}
                            chartConfig={multiLineChartConfig}
                            bezier
                            withInnerLines={true}
                        />}
                    </View>
                </ViewShot>
            </View>

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Therapy Report</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.previewCard}>
                    <View style={styles.pdfIcon}>
                        <Icon name="file-pdf-box" size={80} color={Colors.primary} />
                    </View>
                    <Text style={styles.previewTitle}>Download Your Clinical Data</Text>
                    <Text style={styles.previewSub}>
                        Generate a professional PDF report containing your therapy trends, compliance score, and detailed session logs.
                    </Text>

                    <TouchableOpacity style={styles.downloadBtn} onPress={handleGeneratePDF} disabled={generating}>
                        {generating ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Icon name="download" size={20} color="#FFF" />
                                <Text style={styles.btnText}>GENERATE REPORT</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.shareRow}>
                    <TouchableOpacity style={styles.shareOption}>
                        <Icon name="share-variant" size={24} color={Colors.primary} />
                        <Text style={styles.shareLabel}>Share PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shareOption}>
                        <Icon name="email-outline" size={24} color={Colors.primary} />
                        <Text style={styles.shareLabel}>Email Doctor</Text>
                    </TouchableOpacity>
                </View>

                {/* Patient Summary Mini-Card */}
                <View style={styles.summaryBox}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryVal}>{logs.length}</Text>
                        <Text style={styles.summaryLbl}>Days Loaded</Text>
                    </View>
                    <View style={[styles.summaryItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DDD' }]}>
                        <Text style={styles.summaryVal}>{summary?.compliancePct || 0}%</Text>
                        <Text style={styles.summaryLbl}>Compliance</Text>
                    </View>
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
    hiddenChartContainer: {
        position: 'absolute',
        top: -10000,
        left: 0,
        opacity: 0,
    },
    hiddenChartView: {
        width: width,
        backgroundColor: '#FFF',
        padding: 10,
    },
    header: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
        paddingBottom: Spacing.m,
        backgroundColor: '#FFF',
    },
    headerTitle: {
        ...Typography.subheader,
        fontSize: 20,
    },
    content: {
        padding: Spacing.xl,
    },
    previewCard: {
        backgroundColor: '#F8FBFF',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E3F2FD',
        elevation: 4,
        shadowColor: Colors.primary,
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    pdfIcon: {
        backgroundColor: '#FFF',
        width: 140,
        height: 180,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
    },
    previewSub: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20,
    },
    downloadBtn: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 30,
        marginTop: 30,
        alignItems: 'center',
        elevation: 5,
        shadowColor: Colors.primary,
        shadowOpacity: 0.3,
    },
    btnText: {
        color: '#FFF',
        fontWeight: 'bold',
        marginLeft: 10,
        letterSpacing: 1,
    },
    shareRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 30,
    },
    shareOption: {
        alignItems: 'center',
        padding: 10,
    },
    shareLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 5,
    },
    summaryBox: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginTop: 30,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#F0F4F8',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryVal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    summaryLbl: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 4,
    },
});

export default ReportPreviewScreen;
