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
import Share from 'react-native-share';
import { LineChart, BarChart, StackedBarChart } from 'react-native-chart-kit';
import RNFS from 'react-native-fs';
import { getLogs, getPatientInfo } from '../api/database';

const { width } = Dimensions.get('window');

const ReportPreviewScreen = () => {
    const [logs, setLogs] = useState([]);
    const [patient, setPatient] = useState(null);
    const [generating, setGenerating] = useState(false);
    const pressureChartRef = useRef(null);
    const flowChartRef = useRef(null);
    const ahiMiniChartRef = useRef(null);
    const leakMiniChartRef = useRef(null);
    const maskMiniChartRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const logData = await getLogs();
            const patientData = await getPatientInfo();
            setLogs(logData || []);
            setPatient(patientData || { name: 'Daksh Singh', age: 32, machine_serial: 'AIR-9922-G3' });
        } catch (error) {
            console.error('Error fetching data for report:', error);
            setLogs([]);
        }
    };

    const calculateSummary = () => {
        if (logs.length === 0) return null;

        const totalDays = logs.length;
        const validLogs = logs.filter(l => l !== null);

        const compliantDays = validLogs.filter(l => (l.usage_hours || 0) >= 4).length;
        const compliancePct = ((compliantDays / totalDays) * 100).toFixed(1);

        const avgUsage = (validLogs.reduce((acc, curr) => acc + (parseFloat(curr.usage_hours) || 0), 0) / totalDays).toFixed(1);
        const avgAHI = (validLogs.reduce((acc, curr) => acc + (parseFloat(curr.ahi) || 0), 0) / totalDays).toFixed(1);
        const avgPressure = (validLogs.reduce((acc, curr) => acc + (parseFloat(curr.pressure_avg) || 0), 0) / totalDays).toFixed(1);

        return { totalDays, compliantDays, compliancePct, avgUsage, avgAHI, avgPressure };
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
            const pressureImg = await captureChart(pressureChartRef);
            const flowImg = await captureChart(flowChartRef);
            const ahiImg = await captureChart(ahiMiniChartRef);
            const leakImg = await captureChart(leakMiniChartRef);
            const maskImg = await captureChart(maskMiniChartRef);

            const summary = calculateSummary();
            const dateStr = new Date().toLocaleDateString('en-IN');

            // Helper: apnea type label
            const apneaLabel = (log) => {
                const parts = [];
                if ((log.obstructive_count || 0) > 0) parts.push(`OA:${log.obstructive_count}`);
                if ((log.central_count || 0) > 0) parts.push(`CA:${log.central_count}`);
                if ((log.hypopnea_count || 0) > 0) parts.push(`H:${log.hypopnea_count}`);
                return parts.length > 0 ? parts.join(' / ') : '0';
            };

            // Compliance breakdown
            const compliantDayCount = logs.filter(l => (l.usage_hours || 0) >= 4).length;
            const nonCompliantDayCount = logs.length - compliantDayCount;

            // Build therapy table rows
            const tableRows = logs.map((log, idx) => {
                const ahiColor = (log.ahi || 0) > 5 ? '#D32F2F' : '#1E7E34';
                const isCompliant = (log.usage_hours || 0) >= 4;
                const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F3F8FF';
                const usageBadge = isCompliant
                    ? `<span style="background:#E8F5E9;color:#2E7D32;padding:2px 5px;border-radius:3px;font-size:9px;font-weight:bold;">&ge;4h &#10003;</span>`
                    : `<span style="background:#FFF3E0;color:#E65100;padding:2px 5px;border-radius:3px;font-size:9px;font-weight:bold;">&lt;4h</span>`;
                const maskOff = (log.mask_off_count || 0);
                const maskColor = maskOff > 0 ? '#D32F2F' : '#555';
                const apneaStr = apneaLabel(log);
                return `
                    <tr style="background:${rowBg};">
                        <td>${log.date || '--'}</td>
                        <td>${(log.usage_hours || 0)} ${usageBadge}</td>
                        <td>${log.therapy_type || 'CPAP'}</td>
                        <td>${(log.avg_set_pressure || 0)}</td>
                        <td>${(log.pressure_avg || 0)}</td>
                        <td>${(log.avg_flow || 0)}</td>
                        <td>${(log.leak_rate || 0)}</td>
                        <td>${(log.avg_resp_rate || 0)}</td>
                        <td style="color:${ahiColor};font-weight:bold;">${(log.ahi || 0)}</td>
                        <td>${apneaStr}</td>
                        <td style="color:${maskColor};font-weight:bold;">${maskOff}</td>
                    </tr>
                `;
            }).join('');

            // Build graph section helper
            const graphSection = (title, imgBase64) => {
                if (!imgBase64) return '';
                return `
                    <div style="page-break-inside:avoid; margin-bottom:26px; background:#fff; border:1px solid #edf2f7; border-radius:12px; padding:15px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                        <div style="font-size:13px; font-weight:bold; color:#1e293b; border-left:4px solid #3b82f6; padding-left:10px; margin-bottom:12px;">${title}</div>
                        <div style="text-align:center;">
                            <img src="data:image/jpeg;base64,${imgBase64}" style="width:100%; max-width:420px; border-radius:6px;" />
                        </div>
                    </div>
                `;
            };

            const hasGraphs = pressureImg || flowImg || ahiImg || leakImg || maskImg;

            const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1a1a2e;background:#fff;}
.page1{padding:34px 38px 28px 38px;page-break-after:always;}
.page2{padding:34px 38px 28px 38px;page-break-after:always;}
.page3{padding:34px 38px 28px 38px;}
.hdr-banner{
    background:linear-gradient(135deg,#1565C0 0%,#1E88E5 60%,#42A5F5 100%);
    color:#fff;padding:16px 22px;border-radius:10px;margin-bottom:18px;
    display:flex;align-items:center;justify-content:space-between;
}
.hdr-banner h1{font-size:20px;font-weight:bold;letter-spacing:1px;}
.hdr-banner .hdr-sub{font-size:10px;margin-top:3px;opacity:0.88;}
.hdr-right{text-align:right;font-size:10px;opacity:0.9;line-height:1.7;}
.sec{margin-top:14px;}
.sec-title{
    font-size:12px;font-weight:bold;color:#1565C0;
    border-left:4px solid #1E88E5;padding-left:8px;margin-bottom:9px;
}
.ig{width:100%;border-collapse:collapse;}
.ig td{padding:4px 7px;font-size:11px;vertical-align:middle;}
.lbl{color:#607D8B;font-weight:bold;width:130px;white-space:nowrap;}
.val{color:#1a1a2e;}
.hr-blue{border:none;border-top:2px solid #1E88E5;margin:14px 0;}
.hr-dash{border:none;border-top:1.5px dashed #90CAF9;margin:12px 0;}
.hr-light{border:none;border-top:1px solid #E3F2FD;margin:10px 0;}
.stats-row{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;}
.sc{
    flex:1;min-width:78px;background:#F0F7FF;
    border:1px solid #BBDEFB;border-radius:8px;padding:9px 6px;text-align:center;
}
.sc-v{font-size:17px;font-weight:bold;color:#1565C0;line-height:1.15;}
.sc-l{font-size:9px;color:#607D8B;margin-top:3px;line-height:1.3;}
.comp-box{display:flex;gap:10px;margin-bottom:14px;}
.ci{flex:1;border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:10px;}
.ci.green{background:#E8F5E9;border:1px solid #A5D6A7;}
.ci.orange{background:#FFF8E1;border:1px solid #FFE082;}
.ci-num{font-size:24px;font-weight:bold;}
.ci.green .ci-num{color:#2E7D32;}
.ci.orange .ci-num{color:#E65100;}
.ci-desc{font-size:10px;color:#444;line-height:1.45;}
.dt{width:100%;border-collapse:collapse;font-size:9.5px;margin-top:6px;}
.dt th{
    background:#1565C0;color:#fff;padding:5px 3px;
    text-align:center;font-size:9px;border:1px solid #1565C0;white-space:nowrap;
}
.dt td{border:1px solid #BBDEFB;padding:5px 3px;text-align:center;vertical-align:middle;}
.p2hdr{
    background:#F0F7FF;border:1px solid #BBDEFB;border-radius:8px;
    padding:12px 18px;margin-bottom:18px;
    display:flex;align-items:center;justify-content:space-between;
}
.p2hdr h2{font-size:15px;color:#1565C0;}
.p2hdr span{font-size:10px;color:#607D8B;}
.patient-line { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 8px; border-bottom: 2px solid #2196F3; margin-bottom: 8px; }
.patient-info { display: flex; gap: 25px; }
.doctor-line { display: flex; gap: 20px; align-items: center; padding: 10px 15px; background: #F8FBFF; border-radius: 8px; margin-bottom: 15px; border: 1px dashed #BBDEFB; }
.header-item { font-size: 11px; color: #444; }
.sig-area{
    margin-top:40px;padding-top:18px;
    border-top:2px solid #1E88E5;
    display:flex;justify-content:space-between;align-items:flex-end;
}
.sig-blk{text-align:center;}
.sig-line{border-top:1px solid #333;width:170px;margin:0 auto 5px auto;}
.sig-lbl{font-size:10px;color:#333;font-weight:bold;}
.sig-sub{font-size:9px;color:#90A4AE;margin-top:2px;}
.footer{
    text-align:center;font-size:9px;color:#90A4AE;
    margin-top:18px;border-top:1px solid #E3F2FD;padding-top:8px;
}
</style>
</head>
<body>

<!-- ══════════════ PAGE 1 ══════════════ -->
<div class="page1">

<div class="hdr-banner">
    <div>
        <h1>&#x1F4CB; Therapy Report</h1>
        <div class="hdr-sub">Airsine CPAP Clinical Summary</div>
    </div>
    <div class="hdr-right">
        <div><b>Report Date:</b> ${dateStr}</div>
        <div><b>Total Days:</b> ${logs.length}</div>
        <div><b>Device:</b> ${patient?.machine_serial || '-'}</div>
    </div>
</div>

<!-- Patient Info Header -->

<!-- Patient Info (Detailed) -->
<div class="sec">
    <div class="sec-title">Patient Details</div>
    <table class="ig">
        <tr>
            <td class="lbl">Patient ID:</td><td class="val">P-${patient?.patient_custom_id || patient?.id || '-'}</td>
            <td class="lbl">Full Name:</td><td class="val">${patient?.name || 'N/A'}</td>
        </tr>
        <tr>
            <td class="lbl">Gender:</td><td class="val">${patient?.gender || '-'}</td>
            <td class="lbl">Date of Birth:</td><td class="val">${patient?.dob || '-'}</td>
        </tr>
        <tr>
            <td class="lbl">Phone:</td><td class="val">${patient?.phone || '-'}</td>
            <td class="lbl">Email:</td><td class="val">${patient?.email || '-'}</td>
        </tr>
        <tr>
            <td class="lbl">Device Model:</td><td class="val">${patient?.device_model || '-'}</td>
            <td class="lbl">Device Serial No:</td><td class="val">${patient?.machine_serial || '-'}</td>
        </tr>
    </table>
</div>

<!-- Doctor section — separated by dashed line -->
<hr class="hr-dash"/>
<div class="sec">
    <div class="sec-title">Referring Physician</div>
    <table class="ig">
        <tr>
            <td class="lbl">Doctor Name:</td><td class="val">${patient?.doctor_name || '-'}</td>
            <td class="lbl">Doctor Phone:</td><td class="val">${patient?.doctor_phone || '-'}</td>
        </tr>
    </table>
</div>

<hr class="hr-blue"/>

<!-- Therapy Summary Cards -->
<div class="sec">
    <div class="sec-title">Therapy Summary</div>
    <div class="stats-row">
        <div class="sc">
            <div class="sc-v">${summary?.avgUsage || 0}h</div>
            <div class="sc-l">Avg Daily Usage</div>
        </div>
        <div class="sc">
            <div class="sc-v">${summary?.compliancePct || 0}%</div>
            <div class="sc-l">Compliance Rate</div>
        </div>
        <div class="sc">
            <div class="sc-v">${summary?.avgAHI || 0}</div>
            <div class="sc-l">Avg AHI<br/>(events/hr)</div>
        </div>
        <div class="sc">
            <div class="sc-v">${summary?.avgPressure || 0}</div>
            <div class="sc-l">Avg Pressure<br/>(cmH&#8322;O)</div>
        </div>
        <div class="sc">
            <div class="sc-v">${logs.length}</div>
            <div class="sc-l">Days Recorded</div>
        </div>
    </div>
</div>

<!-- Compliance Breakdown -->
<div class="sec">
    <div class="sec-title">Usage Compliance Breakdown</div>
    <div class="comp-box">
        <div class="ci green">
            <div style="font-size:22px;">&#10003;</div>
            <div>
                <div class="ci-num">${compliantDayCount}</div>
                <div class="ci-desc"><b>Days &ge; 4 Hours</b><br/>Compliant (Medicare standard)</div>
            </div>
        </div>
        <div class="ci orange">
            <div style="font-size:22px;">&#9888;</div>
            <div>
                <div class="ci-num">${nonCompliantDayCount}</div>
                <div class="ci-desc"><b>Days &lt; 4 Hours</b><br/>Non-compliant (below threshold)</div>
            </div>
        </div>
    </div>
</div>

<hr class="hr-light"/>

<!-- Daily Therapy Log Table -->
<div class="sec">
    <div class="sec-title">Daily Therapy Log</div>
    <table class="dt">
        <thead>
            <tr>
                <th>Date</th>
                <th>Usage (h)</th>
                <th>Mode</th>
                <th>Set Press<br/>(cmH&#8322;O)</th>
                <th>Meas Press<br/>(cmH&#8322;O)</th>
                <th>Flow<br/>(L/min)</th>
                <th>Leak<br/>(L/min)</th>
                <th>Resp<br/>Rate</th>
                <th>AHI</th>
                <th>Apnea<br/>(OA/CA/H)</th>
                <th>Mask<br/>Fault</th>
            </tr>
        </thead>
        <tbody>${tableRows}</tbody>
    </table>
</div>

</div>
<!-- ══════════════ END PAGE 1 ══════════════ -->

<!-- ══════════════ PAGE 2 — Pressure & Flow Trends ══════════════ -->
<div class="page2">
    <div class="p2hdr">
        <h2>&#x1F4C8; Respiratory Trends (Part 1)</h2>
        <span>Patient: ${patient?.name || '-'} &nbsp;|&nbsp; ${dateStr}</span>
    </div>

    <div style="margin-top:10px;">
        ${graphSection('Pressure avg Trend (cmH2O)', pressureImg)}
        ${graphSection('Avg Flow Rate (L/min)', flowImg)}
    </div>
</div>

<!-- ══════════════ PAGE 3 — Apnea, Leak & Mask Events ══════════════ -->
<div class="page3">
    <div class="p2hdr">
        <h2>&#x1F4C8; Respiratory Trends (Part 2)</h2>
        <span>Patient: ${patient?.name || '-'} &nbsp;|&nbsp; ${dateStr}</span>
    </div>

    <div style="margin-top:10px;">
        ${graphSection('Apnea Index (AHI)', ahiImg)}
        ${graphSection('Leak Rate (L/min)', leakImg)}
        ${graphSection('Mask Off Events Count', maskImg)}
    </div>

    <!-- Doctor Signature -->
    <div class="sig-area">
        <div class="sig-blk">
            <div class="sig-line"></div>
            <div class="sig-lbl">Authorised Physician</div>
            <div class="sig-sub">${patient?.doctor_name || 'Doctor Name'}</div>
            <div class="sig-sub">${patient?.doctor_phone || ''}</div>
        </div>
        <div class="sig-blk">
            <div class="sig-line"></div>
            <div class="sig-lbl">Date &amp; Stamp</div>
            <div class="sig-sub">${dateStr}</div>
        </div>
        <div class="sig-blk">
            <div class="sig-line"></div>
            <div class="sig-lbl">Patient / Guardian Signature</div>
            <div class="sig-sub">${patient?.name || '-'}</div>
        </div>
    </div>

    <div class="footer">
        Airsine CPAP Therapy Management System &nbsp;|&nbsp; Confidential – For Medical Use Only
        &nbsp;|&nbsp; Device SN: ${patient?.machine_serial || '-'} &nbsp;|&nbsp; ${dateStr}
    </div>
</div>

</body>
</html>`;

            const results = await createPDF({
                html: htmlContent,
                fileName: `Airsine_Report_${Date.now()}`,
                directory: 'Documents',
                base64: false,
            });

            if (!results || !results.filePath) {
                throw new Error('PDF file could not be created internally.');
            }

            // Path Sanitization for Android
            let sourcePath = results.filePath;
            if (Platform.OS === 'android' && !sourcePath.startsWith('file://')) {
                sourcePath = 'file://' + sourcePath;
            }

            const fileName = `Airsine_Report_${Date.now()}.pdf`;
            const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

            try {
                // Check if Downloads directory is accessible
                const exists = await RNFS.exists(RNFS.DownloadDirectoryPath);
                if (!exists) {
                    await RNFS.mkdir(RNFS.DownloadDirectoryPath);
                }

                await RNFS.copyFile(results.filePath, downloadPath);

                Alert.alert(
                    '✅ Report Downloaded!',
                    `PDF saved to Downloads folder:\n${fileName}`,
                    [
                        { text: 'OK' },
                        {
                            text: 'Open PDF',
                            onPress: async () => {
                                try {
                                    await Share.open({
                                        url: 'file://' + downloadPath,
                                        type: 'application/pdf',
                                        title: 'Airsine Report',
                                    });
                                } catch (err) {
                                    console.log('Share Error:', err);
                                    // User might have cancelled or no app to open
                                }
                            }
                        }
                    ]
                );
            } catch (copyErr) {
                console.log('Copy to Downloads failed, opening internal path:', copyErr);
                Alert.alert(
                    '✅ Report Generated!',
                    `Saved to app storage. Click open to view.`,
                    [
                        { text: 'OK' },
                        {
                            text: 'Open PDF',
                            onPress: async () => {
                                try {
                                    await Share.open({
                                        url: sourcePath,
                                        type: 'application/pdf',
                                        title: 'Airsine Report',
                                    });
                                } catch (err) {
                                    console.log('Share Error:', err);
                                }
                            }
                        }
                    ]
                );
            }

            setGenerating(false);

        } catch (error) {
            setGenerating(false);
            Alert.alert('Download Failed', 'Could not generate or save the report. Please check storage permissions.');
            console.error('Error generating PDF:', error);
        }
    };

    const reversedLogs = useMemo(() => [...logs].slice(0, 7).reverse(), [logs]);
    const isBezier = reversedLogs.length > 1;
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
        propsForLabels: { fontSize: 10 },
        fillShadowGradientFrom: "#3088E5",
        fillShadowGradientTo: "#FFFFFF",
        fillShadowGradientOpacity: 0.1,
    }), []);

    const flowChartConfig = useMemo(() => ({
        ...chartConfig,
        color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
        fillShadowGradientFrom: "#0D9488",
    }), [chartConfig]);

    const multiLineChartConfig = useMemo(() => ({
        ...chartConfig,
        color: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
        fillShadowGradientOpacity: 0, // No fill for multi-line
    }), [chartConfig]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Hidden off-screen: 3 separate ViewShots for each chart */}
            <View style={styles.hiddenChartContainer} collapsable={false}>
                {/* 1. Pressure Avg */}
                <ViewShot ref={pressureChartRef} options={{ format: "jpg", quality: 0.9, result: "base64" }} collapsable={false}>
                    <View style={styles.hiddenChartView}>
                        {dates.length > 0 && <LineChart
                            data={{ labels: dates, datasets: [{ data: reversedLogs.map(l => l.pressure_avg || 0) }] }}
                            width={360} height={200}
                            chartConfig={chartConfig}
                            formatYLabel={(v) => Number(v).toFixed(2)}
                            bezier={isBezier}
                            withInnerLines={true}
                        />}
                    </View>
                </ViewShot>

                {/* 2. Flow Rate */}
                <ViewShot ref={flowChartRef} options={{ format: "jpg", quality: 0.9, result: "base64" }} collapsable={false}>
                    <View style={styles.hiddenChartView}>
                        {dates.length > 0 && <LineChart
                            data={{ labels: dates, datasets: [{ data: reversedLogs.map(l => l.avg_flow || 0) }] }}
                            width={360} height={180}
                            chartConfig={{ ...flowChartConfig, strokeWidth: 1 }}
                            formatYLabel={(v) => Number(v).toFixed(2)}
                            bezier={isBezier}
                            withInnerLines={true}
                        />}
                    </View>
                </ViewShot>

                {/* 3. AHI Mini */}
                <ViewShot ref={ahiMiniChartRef} options={{ format: "jpg", quality: 0.9, result: "base64" }} collapsable={false}>
                    <View style={styles.hiddenChartView}>
                        {dates.length > 0 && <LineChart
                            data={{ labels: dates, datasets: [{ data: reversedLogs.map(l => l.ahi || 0) }] }}
                            width={360} height={170}
                            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(239, 83, 80, ${opacity})` }}
                            bezier={isBezier}
                            withInnerLines={true}
                            withDots={true}
                        />}
                    </View>
                </ViewShot>

                {/* 4. Leak Mini */}
                <ViewShot ref={leakMiniChartRef} options={{ format: "jpg", quality: 0.9, result: "base64" }} collapsable={false}>
                    <View style={styles.hiddenChartView}>
                        {dates.length > 0 && <LineChart
                            data={{ labels: dates, datasets: [{ data: reversedLogs.map(l => l.leak_rate || 0) }] }}
                            width={360} height={170}
                            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})` }}
                            bezier={isBezier}
                            withInnerLines={true}
                            withDots={true}
                        />}
                    </View>
                </ViewShot>

                {/* 5. Mask Mini */}
                <ViewShot ref={maskMiniChartRef} options={{ format: "jpg", quality: 0.9, result: "base64" }} collapsable={false}>
                    <View style={styles.hiddenChartView}>
                        {dates.length > 0 && <LineChart
                            data={{ labels: dates, datasets: [{ data: reversedLogs.map(l => l.mask_off_count || 0) }] }}
                            width={360} height={170}
                            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(66, 165, 245, ${opacity})` }}
                            bezier={isBezier}
                            withInnerLines={true}
                            withDots={true}
                        />}
                    </View>
                </ViewShot>
            </View>

            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
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

                {/* Modern Dashboard Graphs */}

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
        width: 400,
        backgroundColor: '#FFF',
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 14,
        paddingBottom: 14,
        backgroundColor: Colors.primary,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
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
    dashboardSection: {
        marginTop: 20,
    },
    sectionHeading: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 15,
        paddingLeft: 4,
    },
    graphCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 10,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 8,
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    legendOverlay: {
        paddingTop: 10,
        alignItems: 'center',
    },
    legendNote: {
        fontSize: 9,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
});

export default ReportPreviewScreen;
