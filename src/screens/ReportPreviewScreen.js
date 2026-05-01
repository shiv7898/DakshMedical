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
    PermissionsAndroid,
    Modal,
    TextInput
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, Typography } from '../styles/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { generatePDF as createPDF } from 'react-native-html-to-pdf';
import { useFocusEffect } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import { LineChart, BarChart, StackedBarChart } from 'react-native-chart-kit';
import RNFS from 'react-native-fs';
import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import { getLogs, getPatientInfo, getDoctorInfo } from '../api/database';
import { useData } from '../context/DataContext';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const ReportPreviewScreen = () => {
    const [logs, setLogs] = useState([]);
    const [graphLogs9, setGraphLogs9] = useState([]);
    const [graphLogs7, setGraphLogs7] = useState([]);
    const [patient, setPatient] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewPatientData, setPreviewPatientData] = useState(null);
    const [capturedImages, setCapturedImages] = useState({
        pressureGridImg: '',
        flowImg: '',
        ahiImg: '',
        leakImg: ''
    });
    const { selectedRange, userRole } = useData();
    const pressureGridRef = useRef(null);
    const flowChartRef = useRef(null);
    const ahiMiniChartRef = useRef(null);
    const leakMiniChartRef = useRef(null);

    // Doctor/Patient info-form state
    const [showDoctorModal, setShowDoctorModal] = useState(false);
    const [tempPatientInfo, setTempPatientInfo] = useState({
        patient_custom_id: '',
        name: '',
        age: '',
        gender: 'Male',
        dob: '',
        phone: '',
        email: '',
        device_model: '',
        machine_serial: ''
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showGenderModal, setShowGenderModal] = useState(false);

    const calculateAge = (dobString) => {
        if (!dobString) return '';
        let birthDate;
        if (dobString.includes('-')) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const parts = dobString.split('-');
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = months.indexOf(parts[1]);
                const year = parseInt(parts[2], 10);
                birthDate = new Date(year, month, day);
            } else {
                birthDate = new Date(dobString);
            }
        } else {
            birthDate = new Date(dobString);
        }

        if (isNaN(birthDate.getTime())) return '';
        
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age.toString();
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const d = selectedDate.getDate().toString().padStart(2, '0');
            const m = months[selectedDate.getMonth()];
            const y = selectedDate.getFullYear();
            const dobStr = `${d}-${m}-${y}`;
            const newAge = calculateAge(dobStr);
            setTempPatientInfo({ ...tempPatientInfo, dob: dobStr, age: newAge });
        }
    };

    // 🔔 Foreground event handler — open PDF when notification is tapped while app is open
    useEffect(() => {
        const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
            if (type === EventType.PRESS) {
                const filePath = detail.notification?.data?.filePath;
                if (filePath) {
                    Share.open({
                        url: filePath.startsWith('file://') ? filePath : 'file://' + filePath,
                        type: 'application/pdf',
                        title: 'Open Airsine Report',
                    }).catch(err => console.log('Foreground notification open PDF error:', err));
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchData = React.useCallback(async () => {
        try {
            console.log('⚡ Optimized Fetch: Report Data (Range:', selectedRange, ')');
            const [logData, patientData, doctorData] = await Promise.all([getLogs(), getPatientInfo(), getDoctorInfo()]);

            const tableLogs = (logData || []).slice(0, selectedRange);
            const reportGraphLogs9 = (logData || []).slice(0, 9);
            const reportGraphLogs7 = (logData || []).slice(0, 7);

            setLogs(tableLogs);
            setGraphLogs9(reportGraphLogs9);
            setGraphLogs7(reportGraphLogs7);
            setPatient(patientData || { name: '', age: "", machine_serial: '' });
            setDoctor(doctorData || { name: '', phone: '' });
        } catch (error) {
            console.error('Error fetching data for report:', error);
            setLogs([]);
        }
    }, [selectedRange]);

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const calculateSummary = () => {
        if (logs.length === 0) return null;

        const totalDays = logs.length;
        const validLogs = logs.filter(l => l !== null);

        const compliantDays = validLogs.filter(l => (l.usage_hours || 0) >= 4).length;
        const compliancePct = ((compliantDays / totalDays) * 100).toFixed(1);

        const avgUsage = (validLogs.reduce((acc, curr) => acc + (parseFloat(curr.usage_hours) || 0), 0) / totalDays).toFixed(1);
        const avgAHI = (validLogs.reduce((acc, curr) => acc + (parseFloat(curr.ahi) || 0), 0) / totalDays).toFixed(1);
        const avgPressure = (validLogs.reduce((acc, curr) => acc + (parseFloat(curr.pressure_avg) || 0), 0) / totalDays).toFixed(1);

        const validLeakLogs = validLogs.filter(l => (parseFloat(l.leak_rate) || 0) < 200);
        const avgLeak = validLeakLogs.length > 0
            ? (validLeakLogs.reduce((acc, curr) => acc + (parseFloat(curr.leak_rate) || 0), 0) / validLeakLogs.length).toFixed(1)
            : '0.0';

        return { totalDays, compliantDays, compliancePct, avgUsage, avgAHI, avgPressure, avgLeak };
    };

    const formatHoursToHHMM = (decimalHours) => {
        const val = parseFloat(decimalHours);
        if (isNaN(val)) return '00:00';
        const totalMinutes = Math.round(val * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

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

    const requestNotificationPermission = async () => {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
    };

    const requestStoragePermission = async () => {
        if (Platform.OS === 'android') {
            try {
                if (Platform.Version < 33) {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                        {
                            title: 'Storage Permission',
                            message: 'Airsine needs access to your storage to save the PDF report.',
                            buttonNeutral: 'Ask Me Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        }
                    );
                    return granted === PermissionsAndroid.RESULTS.GRANTED;
                }
                return true;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const showDownloadNotification = async (fileName, filePath) => {
        try {
            const hasPermission = await requestNotificationPermission();
            if (!hasPermission) {
                console.warn('Notification permission denied');
                return;
            }
            const channelId = await notifee.createChannel({
                id: 'pdf_downloads',
                name: 'PDF Downloads',
                description: 'Notifications for downloaded PDF reports',
                importance: AndroidImportance.HIGH,
                sound: 'default',
                vibration: true,
            });

            await notifee.displayNotification({
                title: '✅ Report Downloaded Successfully',
                body: `📄 ${fileName}\nSaved to Downloads folder. Tap to open.`,
                data: {
                    filePath: filePath,
                },
                android: {
                    channelId,
                    smallIcon: 'ic_launcher',
                    importance: AndroidImportance.HIGH,
                    pressAction: {
                        id: 'open_pdf',
                        launchActivity: 'default',
                    },
                    style: {
                        type: AndroidStyle.BIGTEXT,
                        text: `📄 ${fileName}\n\nYour Airsine therapy report has been downloaded and saved to the Downloads folder. Tap this notification to open or share the PDF.`,
                    },
                    timestamp: Date.now(),
                    showTimestamp: true,
                    autoCancel: true,
                },
                ios: {
                    sound: 'default',
                },
            });
            console.log('✅ Download notification shown for:', fileName);
        } catch (notifError) {
            console.log('Notification error (non-critical):', notifError);
        }
    };

    const buildReportHTML = (patientDataToUse, images) => {
        const summary = calculateSummary();
        const dateStr = new Date().toLocaleDateString('en-IN');

        const apneaLabel = (log) => {
            const parts = [];
            if ((log.obstructive_count || 0) > 0) parts.push(`OA:${log.obstructive_count}`);
            if ((log.central_count || 0) > 0) parts.push(`CA:${log.central_count}`);
            if ((log.hypopnea_count || 0) > 0) parts.push(`H:${log.hypopnea_count}`);
            return parts.length > 0 ? parts.join(' / ') : '0';
        };

        const compliantDayCount = logs.filter(l => (l.usage_hours || 0) >= 4).length;
        const nonCompliantDayCount = logs.length - compliantDayCount;

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

            let detailsStr = "";
            if (log.therapy_type === 'CPAP') {
                detailsStr = `
                    <div style="text-align:left; font-size:7.5px; line-height:1.3; font-weight:normal; padding:2px;">
                      Avg Ramp Start Press: ${Number(log.ramp_start_pressure || 0).toFixed(1)}<br/>
                      Set Pressure: ${Number(log.avg_set_pressure || 0).toFixed(1)}<br/>
                      Pressure Off: ${Number(log.pressure_off || 0)}<br/>
                      Avg Ramp Duration: ${log.ramp_duration || 0}
                    </div>
                `;
            } else if (log.therapy_type === 'APAP') {
                detailsStr = `
                    <div style="text-align:left; font-size:7.5px; line-height:1.3; font-weight:normal; padding:2px;">
                      Avg Ramp Start Press: ${Number(log.ramp_start_pressure || 0).toFixed(1)}<br/>
                      Min: ${Number(log.pressure_min || 0).toFixed(1)} / Max: ${Number(log.pressure_max || 0).toFixed(1)}<br/>
                      Pressure Off: ${Number(log.pressure_off || 0)}<br/>
                      Avg Ramp Duration: ${log.ramp_duration || 0}
                    </div>
                `;
            } else if (log.therapy_type === 'Mixed') {
                detailsStr = `
                    <div style="text-align:left; font-size:7.5px; line-height:1.3; font-weight:normal; padding:2px;">
                      Avg Ramp Start Press: ${Number(log.ramp_start_pressure || 0).toFixed(1)}<br/>
                      Set (CPAP): ${Number(log.avg_set_pressure || 0).toFixed(1)}<br/>
                      Min (APAP): ${Number(log.pressure_min || 0).toFixed(1)} / Max: ${Number(log.pressure_max || 0).toFixed(1)}<br/>
                      Pressure Off: ${Number(log.pressure_off || 0)}<br/>
                      Avg Ramp Duration: ${log.ramp_duration || 0}
                    </div>
                `;
            } else {
                detailsStr = `
                    <div style="text-align:left; font-size:7.5px; line-height:1.3; font-weight:normal; padding:2px;">
                      <b style="color:#065F46;">${log.therapy_type}</b><br/>
                      Avg Pressure: ${Number(log.pressure_avg || 0).toFixed(1)}
                    </div>
                `;
            }

            return `
                <tr style="background:${rowBg};">
                    <td>${log.date || '--'}</td>
                    <td>${formatHoursToHHMM(log.usage_hours)} ${usageBadge}</td>
                    <td>${log.therapy_type || 'CPAP'}</td>
                    <td>${detailsStr}</td>
                    <td>${(log.pressure_avg || 0)}</td>
                    <td>${(log.avg_flow || 0)}</td>
                    <td>${(log.leak_rate || 0)}</td>
                    <td>${(log.avg_resp_rate || 0)}</td>
                    <td style="color:${ahiColor};font-weight:bold;">
                        ${(log.ahi || 0)}<br/>
                        <span style="font-size:7px;color:#607D8B;font-weight:normal;">${apneaStr}</span>
                    </td>
                    <td>${log.mask_fault_count || 0}</td>
                    <td>${log.low_pressure_count || 0}</td>
                </tr>
            `;
        }).join('');

        const graphSection = (title, imgBase64) => {
            if (!imgBase64) return '';
            return `
                <div style="page-break-inside:avoid; margin-bottom:26px; background:#fff; border:1px solid #D1FAE5; border-radius:12px; padding:15px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                    <div style="font-size:13px; font-weight:bold; color:#064E3B; border-left:4px solid #10B981; padding-left:10px; margin-bottom:12px;">${title}</div>
                    <div style="text-align:center;">
                        <img src="data:image/jpeg;base64,${imgBase64}" style="width:100%; max-width:420px; border-radius:6px;" />
                    </div>
                </div>
            `;
        };

        const hasGraphs = images.pressureGridImg || images.flowImg || images.ahiImg || images.leakImg;

        return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1a1a2e;background:#fff;}
.page1{padding:34px 38px 28px 38px;page-break-after:always;}
.page2{padding:34px 38px 28px 38px;page-break-after:always;}
.page3{padding:34px 38px 28px 38px; height: 1040px; position: relative;}
.hdr-banner{
    background:#ffffff;border:2px solid #065F46;
    color:#065F46;padding:16px 22px;border-radius:10px;margin-bottom:18px;
    display:flex;align-items:center;justify-content:space-between;
}
.hdr-banner h1{font-size:20px;font-weight:bold;letter-spacing:1px;}
.hdr-banner .hdr-sub{font-size:10px;margin-top:3px;color:#065F46;}
.hdr-right{text-align:right;font-size:10px;color:#065F46;line-height:1.7;}
.sec{margin-top:14px;}
.sec-title{
    font-size:12px;font-weight:bold;color:#065F46;
    border-left:4px solid #10B981;padding-left:8px;margin-bottom:9px;
}
.ig{width:100%;border-collapse:collapse;}
.ig td{padding:4px 7px;font-size:11px;vertical-align:middle;}
.lbl{color:#374151;font-weight:bold;width:130px;white-space:nowrap;}
.val{color:#1a1a2e;}
.hr-blue{border:none;border-top:2px solid #10B981;margin:14px 0;}
.hr-dash{border:none;border-top:1.5px dashed #34D399;margin:12px 0;}
.hr-light{border:none;border-top:1px solid #D1FAE5;margin:10px 0;}
.stats-row{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;}
.sc{
    flex:1;min-width:78px;background:#ffffff;
    border:1px solid #D1FAE5;border-radius:8px;padding:9px 6px;text-align:center;
}
.sc-v{font-size:17px;font-weight:bold;color:#10B981;line-height:1.15;}
.sc-l{font-size:9px;color:#4B5563;margin-top:3px;line-height:1.3;}
.comp-box{display:flex;gap:10px;margin-bottom:14px;}
.ci{flex:1;border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:10px;}
.ci.green{background:#ffffff;border:1px solid #10B981;}
.ci.orange{background:#ffffff;border:1px solid #F59E0B;}
.ci-num{font-size:24px;font-weight:bold;}
.ci.green .ci-num{color:#059669;}
.ci.orange .ci-num{color:#D97706;}
.ci-desc{font-size:10px;color:#444;line-height:1.45;}
.dt{width:100%;border-collapse:collapse;font-size:9.5px;margin-top:6px;}
.dt th{
    background:#065F46;color:#fff;padding:5px 3px;
    text-align:center;font-size:9px;border:1px solid #065F46;white-space:nowrap;
}
.dt td{border:1px solid #D1FAE5;padding:5px 3px;text-align:center;vertical-align:middle;}
.p2hdr{
    background:#F0FDF4;border:1px solid #D1FAE5;border-radius:8px;
    padding:12px 18px;margin-bottom:18px;
    display:flex;align-items:center;justify-content:space-between;
}
.p2hdr h2{font-size:15px;color:#065F46;}
.p2hdr span{font-size:10px;color:#374151;}
.patient-line { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 8px; border-bottom: 2px solid #10B981; margin-bottom: 8px; }
.patient-info { display: flex; gap: 25px; }
.doctor-line { display: flex; gap: 20px; align-items: center; padding: 10px 15px; background: #F0FDF4; border-radius: 8px; margin-bottom: 15px; border: 1px dashed #D1FAE5; }
.header-item { font-size: 11px; color: #444; }
.sig-area{
    position:absolute; bottom:65px; left:38px; right:38px;
    display:flex;justify-content:space-between;align-items:flex-end;
}
.sig-blk{text-align:center;}
.sig-line{border-top:1px solid #333;width:170px;margin:0 auto 5px auto;}
.sig-lbl{font-size:10px;color:#333;font-weight:bold;}
.sig-sub{font-size:9px;color:#90A4AE;margin-top:2px;}
.footer{
    position:absolute; bottom:20px; left:38px; right:38px;
    text-align:center;font-size:9px;color:#90A4AE;
    border-top:1px solid #E3F2FD;padding-top:8px;
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
        <div><b>Device:</b> ${patientDataToUse?.machine_serial || '-'}</div>
    </div>
</div>

<!-- Patient Info Header -->

<!-- Patient Info (Detailed) -->
<div class="sec">
    <div class="sec-title">Patient Details</div>
    <table class="ig">
        <tr>
            <td class="lbl">Patient ID:</td><td class="val">P-${patientDataToUse?.patient_custom_id || patientDataToUse?.id || '-'}</td>
            <td class="lbl">Full Name:</td><td class="val">${patientDataToUse?.name || 'N/A'}</td>
        </tr>
        <tr>
            <td class="lbl">Gender:</td><td class="val">${patientDataToUse?.gender || '-'}</td>
            <td class="lbl">Date of Birth:</td><td class="val">${patientDataToUse?.dob || '-'}</td>
        </tr>
        <tr>
            <td class="lbl">Phone:</td><td class="val">${patientDataToUse?.phone || '-'}</td>
            <td class="lbl">Email:</td><td class="val">${patientDataToUse?.email || '-'}</td>
        </tr>
        <tr>
            <td class="lbl">Device Model:</td><td class="val">${patientDataToUse?.device_model || '-'}</td>
            <td class="lbl">Device Serial No:</td><td class="val">${patientDataToUse?.machine_serial || '-'}</td>
        </tr>
    </table>
</div>

<!-- Doctor section — separated by dashed line -->
<hr class="hr-dash"/>
<div class="sec">
    <div class="sec-title">Referring Physician</div>
    <table class="ig">
        <tr>
            <td class="lbl">Doctor Name:</td><td class="val">${userRole === 'doctor' ? (doctor?.name || '-') : (patientDataToUse?.doctor_name || '-')}</td>
            <td class="lbl">Doctor Phone:</td><td class="val">${userRole === 'doctor' ? (doctor?.phone || '-') : (patientDataToUse?.doctor_phone || '-')}</td>
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
            <div class="sc-v">${summary?.avgLeak || 0}</div>
            <div class="sc-l">Avg Leak<br/>(L/min)</div>
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
                <th>Usage (H:M)</th>
                <th>Mode</th>
                <th>Therapy<br/>Details</th>
                <th>Pressure<br/>(cmH&#8322;O)</th>
                <th>Flow<br/>(L/min)</th>
                <th>Leak<br/>(L/min)</th>
                <th>Resp<br/>Rate</th>
                <th>AHI</th>
                <th>Count Of Open Mask</th>
                <th>Count Of Low Pressure</th>
            </tr>
        </thead>
        <tbody>${tableRows}</tbody>
    </table>
</div>

</div>
<!-- ══════════════ END PAGE 1 ══════════════ -->

<!-- ══════════════ PAGE 2 — Summary Trends (Last 7 Days) ══════════════ -->
<div class="page2">
    <div class="p2hdr">
        <h2>&#x1F4C8; Respiratory Trends Summary</h2>
        <span>Patient: ${patientDataToUse?.name || '-'} &nbsp;|&nbsp; ${dateStr}</span>
    </div>

    <div style="margin-top:20px;">
        <div style="font-size:8px; color:#64748b; margin-bottom:8px; text-align:right;">
             <span style="color:#00BCD4">●</span> Flow Rate &nbsp;&nbsp; 
             <span style="color:#EF5350">●</span> Events (AHI) &nbsp;&nbsp; 
             <span style="color:#FFA726">●</span> Leak (L/m)
        </div>
        ${graphSection('Average Flow Rate (L/min)', images.flowImg)}
        ${graphSection('Apnea Events (AHI Index / hr)', images.ahiImg)}
        ${graphSection('Leak Rate (L/min)', images.leakImg)}
    </div>
</div>

<!-- ══════════════ PAGE 3 — 9-Day Clinical Pressure Analysis ══════════════ -->
<div class="page3" style="height:1040px; position:relative;">
    <div class="p2hdr">
        <h2>&#x1F4C8; 9-Day Clinical Pressure Analysis</h2>
        <span>Patient: ${patientDataToUse?.name || '-'} &nbsp;|&nbsp; ${dateStr}</span>
    </div>

    <div style="margin-top:10px; background:#fff; border:1px solid #edf2f7; border-radius:12px; padding:15px; text-align:center;">
        <div style="font-size:11px; font-weight:bold; color:#1e293b; border-left:4px solid #3b82f6; padding-left:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <div style="text-align:left;">Daily Pressure Waveforms & Profiles</div>
            <div style="font-size:8px; font-weight:normal; color:#64748b;">
                <span style="color:#1E88E5">●</span> Set Pressure &nbsp; 
                <span style="color:#EF4444">●</span> Max &nbsp;
                <span style="color:#14B8A6">●</span> Min
            </div>
        </div>
        ${images.pressureGridImg ? `<img src="data:image/jpeg;base64,${images.pressureGridImg}" style="width:100%; max-width:100%; border-radius:6px;" />` : ''}
    </div>

    <!-- Doctor Signature — POSITIVELY AT THE END -->
    <div class="sig-area">
        <div class="sig-blk">
            <div class="sig-line"></div>
            <div class="sig-lbl">Authorised Physician</div>
            <div class="sig-sub">${userRole === 'doctor' ? (doctor?.name || 'Doctor Name') : (patientDataToUse?.doctor_name || 'Doctor Name')}</div>
            <div class="sig-sub">${userRole === 'doctor' ? (doctor?.phone || '') : (patientDataToUse?.doctor_phone || '')}</div>
        </div>
        <div class="sig-blk">
            <div class="sig-line"></div>
            <div class="sig-lbl">Date &amp; Stamp</div>
            <div class="sig-sub">${dateStr}</div>
        </div>
        <div class="sig-blk">
            <div class="sig-line"></div>
            <div class="sig-lbl">Patient Signature</div>
            <div class="sig-sub">${patientDataToUse?.name || '-'}</div>
        </div>
    </div>

    <div class="footer">
        Airsine CPAP Therapy Management System &nbsp;|&nbsp; Confidential – Medical Use Only
        &nbsp;|&nbsp; Device SN: ${patientDataToUse?.machine_serial || '-'} &nbsp;|&nbsp; ${dateStr}
    </div>
</div>

</body>
</html>`;
    };

    const captureAllCharts = async () => {
        // Small delay to ensure charts are fully rendered
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const pressureGridImg = await captureChart(pressureGridRef);
        const flowImg = await captureChart(flowChartRef);
        const ahiImg = await captureChart(ahiMiniChartRef);
        const leakImg = await captureChart(leakMiniChartRef);
        
        return { pressureGridImg, flowImg, ahiImg, leakImg };
    };

    const handleGenerateClick = () => {
        if (!logs || logs.length === 0 || (logs.length === 1 && logs[0].id === 9999)) {
            Alert.alert('No Clinical Data', 'Please import therapy logs from the machine selection screen first.');
            return;
        }

        setTempPatientInfo({
            patient_custom_id: patient?.patient_custom_id || '',
            name: patient?.name || '',
            age: patient?.age?.toString() || '',
            gender: patient?.gender || 'Male',
            dob: patient?.dob || '',
            phone: patient?.phone || '',
            email: patient?.email || '',
            device_model: patient?.device_model || '',
            machine_serial: patient?.machine_serial || ''
        });

        setShowDoctorModal(true);
    };

    const handleDoctorFormSubmit = async () => {
        if (!tempPatientInfo.name) {
            Alert.alert('Required', 'Please enter at least the patient name.');
            return;
        }
        setShowDoctorModal(false);
        
        // Start capturing charts for preview
        setIsCapturing(true);
        try {
            const images = await captureAllCharts();
            setCapturedImages(images);
            setPreviewPatientData({ ...tempPatientInfo });
            setShowPreviewModal(true);
        } catch (error) {
            console.error('Error capturing charts for preview:', error);
            Alert.alert('Preview Error', 'Could not generate report preview. Please try again.');
        } finally {
            setIsCapturing(false);
        }
    };

    const handleDownloadFromPreview = async () => {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission && Platform.OS === 'android' && Platform.Version < 30) {
            Alert.alert('Permission Denied', 'Cannot save PDF without storage permissions.');
            return;
        }

        setShowPreviewModal(false);
        setGenerating(true);
        
        try {
            const images = await captureAllCharts();
            const htmlContent = buildReportHTML(previewPatientData, images);
            
            console.log('🚀 Starting PDF Generation...');
            const results = await createPDF({
                html: htmlContent,
                fileName: `Airsine_Report_${Date.now()}`,
                directory: 'Documents',
                base64: false,
            });

            if (!results || !results.filePath) {
                throw new Error('PDF creation returned no file path.');
            }

            console.log('✅ PDF Created at:', results.filePath);

            let sourcePath = results.filePath;
            if (Platform.OS === 'android' && !sourcePath.startsWith('file://')) {
                sourcePath = 'file://' + sourcePath;
            }

            const fileName = `Airsine_Report_${Date.now()}.pdf`;
            const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

            try {
                const exists = await RNFS.exists(RNFS.DownloadDirectoryPath);
                if (!exists) {
                    await RNFS.mkdir(RNFS.DownloadDirectoryPath);
                }

                await RNFS.copyFile(results.filePath, downloadPath);
                await showDownloadNotification(fileName, downloadPath);

                Alert.alert(
                    '✅ Report Saved!',
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
                                }
                            }
                        }
                    ]
                );
            } catch (copyErr) {
                console.log('Copy to Downloads failed:', copyErr);
                // If direct copy fails (common on Android 11+), we offer sharing the internal file
                await showDownloadNotification(fileName, results.filePath);
                Alert.alert(
                    '✅ Report Ready',
                    `Saved to internal storage (Direct download failed). Would you like to share or open it?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Share/Open',
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
        } catch (error) {
            Alert.alert('Download Failed', 'Could not generate the report. Please ensure you have enough storage space.');
            console.error('CRITICAL PDF ERROR:', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleShareFromPreview = async () => {
        setIsCapturing(true);
        try {
            const images = await captureAllCharts();
            const htmlContent = buildReportHTML(previewPatientData, images);
            
            const results = await createPDF({
                html: htmlContent,
                fileName: `Airsine_Report_Share_${Date.now()}`,
                directory: 'Documents',
                base64: false,
            });

            if (results && results.filePath) {
                let path = results.filePath;
                if (Platform.OS === 'android' && !path.startsWith('file://')) path = 'file://' + path;
                
                await Share.open({
                    url: path,
                    type: 'application/pdf',
                    title: 'Airsine Report',
                });
            }
        } catch (err) {
            console.log('Share Error:', err);
            Alert.alert('Share Error', 'Could not generate report for sharing.');
        } finally {
            setIsCapturing(false);
        }
    };

    const reversedLogs9 = useMemo(() => [...graphLogs9].reverse(), [graphLogs9]);
    const reversedLogs7 = useMemo(() => [...graphLogs7].reverse(), [graphLogs7]);

    const dates9 = useMemo(() => reversedLogs9.map(l => l.date ? l.date.split('-')[2] : ''), [reversedLogs9]);
    const dates7 = useMemo(() => reversedLogs7.map(l => l.date ? l.date.split('-')[2] : ''), [reversedLogs7]);

    const summary = useMemo(() => calculateSummary(), [logs]);

    const chartConfig = useMemo(() => ({
        backgroundColor: "#FFFFFF",
        backgroundGradientFrom: "#FFFFFF",
        backgroundGradientTo: "#FFFFFF",
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: { r: "5", strokeWidth: "3", stroke: "#FFF" },
        propsForLabels: { fontSize: 10 },
        fillShadowGradientFrom: "#10B981",
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
        fillShadowGradientOpacity: 0,
    }), [chartConfig]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Hidden charts container - visible only when capturing */}
            {(isCapturing || generating) && (
                <View style={styles.hiddenChartContainer} collapsable={false}>
                    {/* 1. 9-Day Pressure Profile Grid */}
                    <ViewShot ref={pressureGridRef} options={{ format: "png", quality: 0.7, result: "base64" }} collapsable={false}>
                        <View style={[styles.gridContainer, { backgroundColor: '#FFFFFF' }]}>
                            {reversedLogs9.map((log, i) => {
                                const usageH = parseFloat(log.usage_hours) || 0;
                                const setPres = parseFloat(log.avg_set_pressure || log.pressure_avg) || 0.1;
                                const minP = parseFloat(log.pressure_min) || 4;
                                const maxP = parseFloat(log.pressure_max) || setPres;

                                const therapyStr = (log.therapy_type || '').toLowerCase();
                                const isCPAP = !therapyStr.includes('apap') && !therapyStr.includes('mixed');
                                const isAPAP = therapyStr.includes('apap') && !therapyStr.includes('mixed');
                                const isMixed = therapyStr.includes('mixed');

                                const badgeIcon = isCPAP ? 'lungs' : isAPAP ? 'wave' : 'swap-horizontal';
                                const stripeColor = isCPAP ? '#1E88E5' : isAPAP ? '#7C3AED' : '#14B8A6';

                                const totalMins = usageH * 60;
                                const endLabel = totalMins > 0
                                    ? `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(Math.floor(totalMins % 60)).padStart(2, '0')}`
                                    : '00:00';
                                const midMins = totalMins / 4;
                                const xLabels = [0, 1, 2, 3, 4].map(s => {
                                    const m = s * midMins;
                                    return s === 0 ? '00:00'
                                        : s === 4 ? endLabel
                                            : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
                                });

                                const bCol = isCPAP ? '#0284C7' : isAPAP ? '#7C3AED' : '#EA580C';
                                const bBg = isCPAP ? '#E0F2FE' : isAPAP ? '#F5F3FF' : '#FFF7ED';
                                const bLab = isCPAP ? 'CPAP' : isAPAP ? 'APAP' : 'MIXED';

                                let cData;
                                if (isCPAP) {
                                    const r0 = (parseFloat(log.ramp_start_pressure) || setPres * 0.55);
                                    cData = { labels: xLabels, datasets: [{ data: [r0, r0 + (setPres - r0) * 0.2, r0 + (setPres - r0) * 0.55, r0 + (setPres - r0) * 0.85, setPres], color: (op = 1) => `rgba(15,70,180,${op})`, strokeWidth: 1.5 }] };
                                } else if (isAPAP) {
                                    const yMin = Math.max(0, Math.min(minP, 4) - 1);
                                    cData = { labels: xLabels, datasets: [{ data: Array(5).fill(maxP), color: (op = 1) => `rgba(185,28,28,${op})`, strokeWidth: 1.5 }, { data: Array(5).fill(minP), color: (op = 1) => `rgba(30,64,175,${op})`, strokeWidth: 1.5 }, { data: Array(5).fill(yMin), color: () => 'transparent', strokeWidth: 0, withDots: false }] };
                                } else {
                                    const r0 = (parseFloat(log.ramp_start_pressure) || setPres * 0.55);
                                    const yAnchor = Math.max(0, Math.min(minP, 4) - 1);
                                    cData = { labels: xLabels, datasets: [{ data: [r0, r0 + (setPres - r0) * 0.25, r0 + (setPres - r0) * 0.55, r0 + (setPres - r0) * 0.8, setPres], color: (op = 1) => `rgba(15,70,180,${op})`, strokeWidth: 1.5 }, { data: Array(5).fill(maxP), color: (op = 1) => `rgba(185,28,28,${op})`, strokeWidth: 1.5 }, { data: Array(5).fill(minP), color: (op = 1) => `rgba(15,118,110,${op})`, strokeWidth: 1.5 }, { data: Array(5).fill(yAnchor), color: () => 'transparent', strokeWidth: 0, withDots: false }] };
                                }

                                return (
                                    <View key={i} style={styles.miniGridCard}>
                                        <View style={styles.gridCardHeader}>
                                            <View>
                                                <Text style={styles.gridDate}>{log.date}</Text>
                                                <Text style={styles.gridUsage}>Usage: {formatHoursToHHMM(usageH)}</Text>
                                            </View>
                                            <View style={[styles.miniBadge, { backgroundColor: bBg, flexDirection: 'row', alignItems: 'center', gap: 2 }]}>
                                                <Icon name={badgeIcon} size={8} color={bCol} />
                                                <Text style={[styles.miniBadgeText, { color: bCol }]}>{bLab}</Text>
                                            </View>
                                        </View>

                                        <View style={[styles.miniAccentStripe, { backgroundColor: stripeColor }]} />

                                        <View style={{ height: 110, paddingLeft: 10 }}>
                                            <LineChart
                                                data={cData}
                                                width={170} height={105}
                                                chartConfig={{
                                                    ...chartConfig,
                                                    backgroundGradientFrom: "#FFF",
                                                    backgroundGradientTo: "#FFF",
                                                    decimalPlaces: 1,
                                                    fillShadowGradientFromOpacity: 0,
                                                    fillShadowGradientToOpacity: 0,
                                                    propsForLabels: { fontSize: 7, fontWeight: '600' },
                                                    propsForBackgroundLines: { stroke: '#f1f5f9' },
                                                    propsForDots: { r: '2', strokeWidth: '1.5', stroke: '#fff' }
                                                }}
                                                withInnerLines={true}
                                                bezier={!isAPAP}
                                                withDots={true}
                                                formatYLabel={(v) => Number(v) > 0 ? Number(v).toFixed(1) : ''}
                                                style={{ marginVertical: 4, marginLeft: -15 }}
                                            />
                                        </View>

                                        <View style={styles.gridLabelsRow}>
                                            <Text style={styles.gridLabelsText}>cmH₂O</Text>
                                            <Text style={styles.gridLabelsText}>Time →</Text>
                                        </View>

                                        <View style={styles.miniPressureSummaryRow}>
                                            {isCPAP ? (
                                                <View style={styles.miniPressureSummaryItem}>
                                                    <Text style={styles.miniPressureSummaryVal}>{setPres.toFixed(1)}</Text>
                                                    <Text style={styles.miniPressureSummaryLbl}>Set Press</Text>
                                                </View>
                                            ) : isAPAP ? (
                                                <>
                                                    <View style={styles.miniPressureSummaryItem}>
                                                        <Text style={[styles.miniPressureSummaryVal, { color: '#1E88E5' }]}>{minP.toFixed(1)}</Text>
                                                        <Text style={styles.miniPressureSummaryLbl}>Min</Text>
                                                    </View>
                                                    <View style={[styles.miniPressureSummaryItem, { borderLeftWidth: 1, borderColor: '#F1F5F9' }]}>
                                                        <Text style={[styles.miniPressureSummaryVal, { color: '#EF5350' }]}>{maxP.toFixed(1)}</Text>
                                                        <Text style={styles.miniPressureSummaryLbl}>Max</Text>
                                                    </View>
                                                </>
                                            ) : (
                                                <>
                                                    <View style={styles.miniPressureSummaryItem}>
                                                        <Text style={[styles.miniPressureSummaryVal, { color: '#1E88E5' }]}>{setPres.toFixed(1)}</Text>
                                                        <Text style={styles.miniPressureSummaryLbl}>Set</Text>
                                                    </View>
                                                    <View style={[styles.miniPressureSummaryItem, { borderLeftWidth: 1, borderColor: '#F1F5F9' }]}>
                                                        <Text style={[styles.miniPressureSummaryVal, { color: '#14B8A6' }]}>{minP.toFixed(1)}</Text>
                                                        <Text style={styles.miniPressureSummaryLbl}>Min</Text>
                                                    </View>
                                                    <View style={[styles.miniPressureSummaryItem, { borderLeftWidth: 1, borderColor: '#F1F5F9' }]}>
                                                        <Text style={[styles.miniPressureSummaryVal, { color: '#EF4444' }]}>{maxP.toFixed(1)}</Text>
                                                        <Text style={styles.miniPressureSummaryLbl}>Max</Text>
                                                    </View>
                                                </>
                                            )}
                                        </View>

                                        <View style={styles.gridLegendRow}>
                                            {!isCPAP && <View style={styles.miniLegendItem}><View style={[styles.miniLegendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.miniLegendTxt}>Max</Text></View>}
                                            {!isCPAP && <View style={styles.miniLegendItem}><View style={[styles.miniLegendDot, { backgroundColor: isAPAP ? '#64C8FF' : '#14B8A6' }]} /><Text style={styles.miniLegendTxt}>Min</Text></View>}
                                            {isCPAP && <View style={styles.miniLegendItem}><View style={[styles.miniLegendDot, { backgroundColor: '#1E88E5' }]} /><Text style={styles.miniLegendTxt}>Set Pressure</Text></View>}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </ViewShot>

                    {/* 2. Flow Rate (7 Days) */}
                    <ViewShot ref={flowChartRef} options={{ format: "png", quality: 0.8, result: "base64" }} collapsable={false}>
                        <View style={styles.hiddenChartView}>
                            {dates7.length > 0 && <LineChart
                                data={{ labels: dates7, datasets: [{ data: reversedLogs7.map(l => l.avg_flow || 0) }] }}
                                width={360} height={180}
                                chartConfig={{ ...flowChartConfig, strokeWidth: 1, fillShadowGradientFromOpacity: 0, fillShadowGradientToOpacity: 0 }}
                                formatYLabel={(v) => Number(v).toFixed(2)}
                                bezier={reversedLogs7.length > 1}
                                withInnerLines={true}
                            />}
                        </View>
                    </ViewShot>

                    {/* 3. AHI Mini (7 Days) */}
                    <ViewShot ref={ahiMiniChartRef} options={{ format: "png", quality: 0.8, result: "base64" }} collapsable={false}>
                        <View style={styles.hiddenChartView}>
                            {dates7.length > 0 && <LineChart
                                data={{ labels: dates7, datasets: [{ data: reversedLogs7.map(l => l.ahi || 0) }] }}
                                width={360} height={170}
                                chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(239, 83, 80, ${opacity})` }}
                                bezier={reversedLogs7.length > 1}
                                withInnerLines={true}
                                withDots={true}
                            />}
                        </View>
                    </ViewShot>

                    <ViewShot ref={leakMiniChartRef} options={{ format: "png", quality: 0.8, result: "base64" }} collapsable={false}>
                        <View style={styles.hiddenChartView}>
                            {dates7.length > 0 && <LineChart
                                data={{ labels: dates7, datasets: [{ data: reversedLogs7.map(l => l.leak_rate || 0) }] }}
                                width={360} height={170}
                                chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})` }}
                                bezier={reversedLogs7.length > 1}
                                withInnerLines={true}
                                withDots={true}
                            />}
                        </View>
                    </ViewShot>
                </View>
            )}

            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Therapy Report</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.previewCard}>
                    <View style={styles.pdfIcon}>
                        <Icon name="file-pdf-box" size={60} color={Colors.primary} />
                    </View>
                    <Text style={styles.previewTitle}>Download Your Clinical Data</Text>
                    <Text style={styles.previewSub}>
                        Generate a professional PDF report containing your therapy trends, compliance score, and detailed session logs.
                    </Text>

                    <TouchableOpacity style={styles.downloadBtn} onPress={handleGenerateClick} disabled={generating || isCapturing}>
                        {(generating || isCapturing) ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Icon name="download" size={20} color="#FFF" />
                                <Text style={styles.btnText}>GENERATE REPORT</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

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

            {/* Preview Modal */}
            <Modal visible={showPreviewModal} animationType="slide" onRequestClose={() => setShowPreviewModal(false)}>
                <SafeAreaView style={styles.previewModalContainer}>
                    <View style={styles.previewModalHeader}>
                        <Text style={styles.previewModalTitle}>Report Preview</Text>
                        <TouchableOpacity onPress={() => setShowPreviewModal(false)}>
                            <Icon name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.webviewContainer}>
                        {previewPatientData && (
                            <WebView
                                source={{ html: buildReportHTML(previewPatientData, capturedImages) }}
                                style={styles.webview}
                                scalesPageToFit={true}
                                startInLoadingState={true}
                                renderLoading={() => (
                                    <View style={styles.webviewLoader}>
                                        <ActivityIndicator size="large" color={Colors.primary} />
                                    </View>
                                )}
                            />
                        )}
                    </View>
                    <View style={styles.previewModalFooter}>
                        <TouchableOpacity style={styles.previewCancelBtn} onPress={() => setShowPreviewModal(false)}>
                            <Text style={styles.previewCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.previewDownloadBtn, { backgroundColor: '#64748B' }]} 
                            onPress={handleShareFromPreview}
                        >
                            <Icon name="share-variant" size={18} color="#FFF" />
                            <Text style={styles.previewDownloadText}>Share</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.previewDownloadBtn} onPress={handleDownloadFromPreview}>
                            <Icon name="download" size={18} color="#FFF" />
                            <Text style={styles.previewDownloadText}>Download</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Doctor Form Modal */}
            <Modal visible={showDoctorModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Icon name="account-edit-outline" size={24} color={Colors.primary} />
                            <Text style={styles.modalTitle}>Patient Information</Text>
                        </View>
                        <Text style={styles.modalSub}>
                            Please enter the patient's details before generating the report.
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
                            <Text style={styles.inputLabel}>Patient Name *</Text>
                            <TextInput
                                style={styles.inputField}
                                placeholder="Enter Patient Name"
                                value={tempPatientInfo.name}
                                onChangeText={text => setTempPatientInfo({ ...tempPatientInfo, name: text })}
                            />

                            <View style={styles.inputRow}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.inputLabel}>Age</Text>
                                    <TextInput
                                        style={styles.inputField}
                                        placeholder="e.g. 45"
                                        keyboardType="numeric"
                                        value={tempPatientInfo.age}
                                        onChangeText={text => setTempPatientInfo({ ...tempPatientInfo, age: text })}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Gender</Text>
                                    <TouchableOpacity 
                                        style={styles.dropdownField}
                                        onPress={() => setShowGenderModal(true)}
                                    >
                                        <Text style={[styles.dropdownText, !tempPatientInfo.gender && { color: '#999' }]}>
                                            {tempPatientInfo.gender || 'Select Gender'}
                                        </Text>
                                        <Icon name="chevron-down" size={20} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputRow}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.inputLabel}>Date of Birth</Text>
                                    <TouchableOpacity 
                                        style={styles.dropdownField}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Text style={[styles.dropdownText, !tempPatientInfo.dob && { color: '#999' }]}>
                                            {tempPatientInfo.dob || 'Select DOB'}
                                        </Text>
                                        <Icon name="calendar-month-outline" size={20} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Patient ID</Text>
                                    <TextInput
                                        style={styles.inputField}
                                        placeholder="e.g. P-001"
                                        value={tempPatientInfo.patient_custom_id}
                                        onChangeText={text => setTempPatientInfo({ ...tempPatientInfo, patient_custom_id: text })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputRow}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.inputLabel}>Phone Number</Text>
                                    <TextInput
                                        style={styles.inputField}
                                        placeholder="e.g. +91 9876..."
                                        keyboardType="phone-pad"
                                        value={tempPatientInfo.phone}
                                        onChangeText={text => setTempPatientInfo({ ...tempPatientInfo, phone: text })}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>Email Address</Text>
                                    <TextInput
                                        style={styles.inputField}
                                        placeholder="e.g. patient@mail.com"
                                        keyboardType="email-address"
                                        value={tempPatientInfo.email}
                                        onChangeText={text => setTempPatientInfo({ ...tempPatientInfo, email: text })}
                                    />
                                </View>
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowDoctorModal(false)}>
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleDoctorFormSubmit}>
                                    <Text style={styles.modalSubmitText}>Preview Report</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Date Picker */}
            {showDatePicker && (
                <DateTimePicker
                    value={tempPatientInfo.dob ? new Date(tempPatientInfo.dob.split('-').reverse().join('-')) : new Date(1990, 0, 1)}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={handleDateChange}
                />
            )}

            {/* Gender Picker Modal */}
            <Modal visible={showGenderModal} transparent animationType="fade">
                <TouchableOpacity 
                    style={styles.genderModalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowGenderModal(false)}
                >
                    <View style={styles.genderPickerCard}>
                        <Text style={styles.genderTitle}>Select Gender</Text>
                        {['Male', 'Female', 'Other'].map((item) => (
                            <TouchableOpacity 
                                key={item} 
                                style={styles.genderOption} 
                                onPress={() => {
                                    setTempPatientInfo({ ...tempPatientInfo, gender: item });
                                    setShowGenderModal(false);
                                }}
                            >
                                <Text style={styles.genderOptionText}>{item}</Text>
                                {tempPatientInfo.gender === item && <Icon name="check-circle" size={20} color={Colors.primary} />}
                            </TouchableOpacity>
                        ))}
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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : 20,
        paddingBottom: 10,
        backgroundColor: Colors.primary,
        elevation: 8,
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
        width: 110,
        height: 80,
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
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 630,
        backgroundColor: '#FFFFFF',
        padding: 15,
        justifyContent: 'space-between',
    },
    miniGridCard: {
        width: 195,
        marginBottom: 12,
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    gridCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 4,
    },
    gridDate: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    gridUsage: {
        fontSize: 7,
        color: '#94A3B8',
        fontWeight: '600',
    },
    miniBadge: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 6,
    },
    miniBadgeText: {
        fontSize: 7,
        fontWeight: 'bold',
    },
    gridLabelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        marginTop: -5,
    },
    gridLabelsText: {
        fontSize: 6,
        color: '#94A3B8',
        fontWeight: 'bold',
    },
    gridLegendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: 6,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    miniLegendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    miniLegendDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    miniLegendTxt: {
        fontSize: 6,
        fontWeight: '700',
        color: '#475569',
    },
    miniAccentStripe: {
        height: 3,
        borderRadius: 3,
        marginBottom: 6,
        marginHorizontal: -10,
    },
    miniPressureSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    miniPressureSummaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    miniPressureSummaryVal: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.primary,
    },
    miniPressureSummaryLbl: {
        fontSize: 5,
        color: '#94A3B8',
        textAlign: 'center',
        fontWeight: '600',
        marginTop: 1,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    modalSub: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 20,
    },
    modalForm: {
        marginBottom: 10,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    inputField: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 14,
        height: 48,
        fontSize: 14,
        color: Colors.text,
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 12,
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    modalCancelText: {
        color: Colors.text,
        fontWeight: '700',
        fontSize: 14,
    },
    modalSubmitBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 12,
    },
    modalSubmitText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    dropdownField: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 14,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    dropdownText: {
        fontSize: 14,
        color: Colors.text,
    },
    genderModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    genderPickerCard: {
        backgroundColor: '#FFF',
        width: '80%',
        borderRadius: 20,
        padding: 20,
        elevation: 10,
    },
    genderTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 15,
        textAlign: 'center',
    },
    genderOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    genderOptionText: {
        fontSize: 15,
        color: Colors.text,
    },
    previewModalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    previewModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFF',
    },
    previewModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    webviewContainer: {
        flex: 1,
    },
    webview: {
        flex: 1,
    },
    webviewLoader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    previewModalFooter: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 12,
    },
    previewCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
    },
    previewCancelText: {
        color: Colors.text,
        fontWeight: '600',
        fontSize: 14,
    },
    previewDownloadBtn: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 10,
        gap: 8,
    },
    previewDownloadText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default ReportPreviewScreen;





// import React, { useState, useEffect, useRef, useMemo } from 'react';
// import {
//     View,
//     Text,
//     TouchableOpacity,
//     StyleSheet,
//     ActivityIndicator,
//     Alert,
//     ScrollView,
//     SafeAreaView,
//     Platform,
//     StatusBar,
//     Dimensions,
//     Linking,
//     PermissionsAndroid,
//     Modal,
//     TextInput
// } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { Colors, Spacing, Typography } from '../styles/theme';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { generatePDF as createPDF } from 'react-native-html-to-pdf';
// import { useFocusEffect } from '@react-navigation/native';
// import ViewShot from 'react-native-view-shot';
// import Share from 'react-native-share';
// import { LineChart, BarChart, StackedBarChart } from 'react-native-chart-kit';
// import RNFS from 'react-native-fs';
// import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
// import { getLogs, getPatientInfo, getDoctorInfo } from '../api/database';
// import { useData } from '../context/DataContext';


// const { width } = Dimensions.get('window');

// // 🔔 Background event handler for notification tap (must be at module level)
// // notifee.onBackgroundEvent(async ({ type, detail }) => {
// //     if (type === EventType.PRESS) {
// //         const filePath = detail.notification?.data?.filePath;
// //         if (filePath) {
// //             try {
// //                 await Share.open({
// //                     url: filePath.startsWith('file://') ? filePath : 'file://' + filePath,
// //                     type: 'application/pdf',
// //                     title: 'Open Airsine Report',
// //                 });
// //             } catch (err) {
// //                 console.log('Background notification open PDF error:', err);
// //             }
// //         }
// //     }
// // });

// const ReportPreviewScreen = () => {
//     const [logs, setLogs] = useState([]);
//     const [graphLogs9, setGraphLogs9] = useState([]);
//     const [graphLogs7, setGraphLogs7] = useState([]);
//     const [patient, setPatient] = useState(null);
//     const [doctor, setDoctor] = useState(null);
//     const [generating, setGenerating] = useState(false);
//     const { selectedRange, userRole } = useData();
//     const pressureGridRef = useRef(null);
//     const flowChartRef = useRef(null);
//     const ahiMiniChartRef = useRef(null);
//     const leakMiniChartRef = useRef(null);

//     // Doctor/Patient info-form state
//     const [showDoctorModal, setShowDoctorModal] = useState(false);
//     const [tempPatientInfo, setTempPatientInfo] = useState({
//         patient_custom_id: '',
//         name: '',
//         age: '',
//         gender: 'Male',
//         dob: '',
//         phone: '',
//         email: '',
//         device_model: '',
//         machine_serial: ''
//     });
//     const [showDatePicker, setShowDatePicker] = useState(false);
//     const [showGenderModal, setShowGenderModal] = useState(false);

//     const calculateAge = (dobString) => {
//         if (!dobString) return '';
//         // Handle dd-MMM-yyyy or ISO
//         let birthDate;
//         if (dobString.includes('-')) {
//             const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//             const parts = dobString.split('-');
//             if (parts.length === 3) {
//                 const day = parseInt(parts[0], 10);
//                 const month = months.indexOf(parts[1]);
//                 const year = parseInt(parts[2], 10);
//                 birthDate = new Date(year, month, day);
//             } else {
//                 birthDate = new Date(dobString);
//             }
//         } else {
//             birthDate = new Date(dobString);
//         }

//         if (isNaN(birthDate.getTime())) return '';
        
//         const today = new Date();
//         let age = today.getFullYear() - birthDate.getFullYear();
//         const m = today.getMonth() - birthDate.getMonth();
//         if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
//             age--;
//         }
//         return age.toString();
//     };

//     const handleDateChange = (event, selectedDate) => {
//         setShowDatePicker(false);
//         if (selectedDate) {
//             const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
//             const d = selectedDate.getDate().toString().padStart(2, '0');
//             const m = months[selectedDate.getMonth()];
//             const y = selectedDate.getFullYear();
//             const dobStr = `${d}-${m}-${y}`;
//             const newAge = calculateAge(dobStr);
//             setTempPatientInfo({ ...tempPatientInfo, dob: dobStr, age: newAge });
//         }
//     };

//     // 🔔 Foreground event handler — open PDF when notification is tapped while app is open
//     useEffect(() => {
//         const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
//             if (type === EventType.PRESS) {
//                 const filePath = detail.notification?.data?.filePath;
//                 if (filePath) {
//                     Share.open({
//                         url: filePath.startsWith('file://') ? filePath : 'file://' + filePath,
//                         type: 'application/pdf',
//                         title: 'Open Airsine Report',
//                     }).catch(err => console.log('Foreground notification open PDF error:', err));
//                 }
//             }
//         });
//         return () => unsubscribe();
//     }, []);

//     const fetchData = React.useCallback(async () => {
//         try {
//             console.log('⚡ Optimized Fetch: Report Data (Range:', selectedRange, ')');
//             const [logData, patientData, doctorData] = await Promise.all([getLogs(), getPatientInfo(), getDoctorInfo()]);

//             const tableLogs = (logData || []).slice(0, selectedRange);
//             const reportGraphLogs9 = (logData || []).slice(0, 9);
//             const reportGraphLogs7 = (logData || []).slice(0, 7);

//             // Consolidate updates to reduce re-renders
//             setLogs(tableLogs);
//             setGraphLogs9(reportGraphLogs9);
//             setGraphLogs7(reportGraphLogs7);
//             setPatient(patientData || { name: 'Enter name', age: "age", machine_serial: 'AIR-9922-G3' });
//             setDoctor(doctorData || { name: '', phone: '' });
//         } catch (error) {
//             console.error('Error fetching data for report:', error);
//             setLogs([]);
//         }
//     }, [selectedRange]);

//     useFocusEffect(
//         React.useCallback(() => {
//             fetchData();
//         }, [fetchData])
//     );

//     const calculateSummary = () => {
//         if (logs.length === 0) return null;

//         const totalDays = logs.length;
//         const validLogs = logs.filter(l => l !== null);

//         const compliantDays = validLogs.filter(l => (l.usage_hours || 0) >= 4).length;
//         const compliancePct = ((compliantDays / totalDays) * 100).toFixed(1);

//         const avgUsage = (validLogs.reduce((acc, curr) => acc + (parseFloat(curr.usage_hours) || 0), 0) / totalDays).toFixed(1);
//         const avgAHI = (validLogs.reduce((acc, curr) => acc + (parseFloat(curr.ahi) || 0), 0) / totalDays).toFixed(1);
//         const avgPressure = (validLogs.reduce((acc, curr) => acc + (parseFloat(curr.pressure_avg) || 0), 0) / totalDays).toFixed(1);

//         // Filter out extreme leak days (>200) from the average
//         const validLeakLogs = validLogs.filter(l => (parseFloat(l.leak_rate) || 0) < 200);
//         const avgLeak = validLeakLogs.length > 0
//             ? (validLeakLogs.reduce((acc, curr) => acc + (parseFloat(curr.leak_rate) || 0), 0) / validLeakLogs.length).toFixed(1)
//             : '0.0';

//         return { totalDays, compliantDays, compliancePct, avgUsage, avgAHI, avgPressure, avgLeak };
//     };

//     const formatHoursToHHMM = (decimalHours) => {
//         const val = parseFloat(decimalHours);
//         if (isNaN(val)) return '00:00';
//         const totalMinutes = Math.round(val * 60);
//         const h = Math.floor(totalMinutes / 60);
//         const m = totalMinutes % 60;
//         return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
//     };

//     // Capture a single chart ref safely
//     const captureChart = async (ref) => {
//         try {
//             if (ref.current) {
//                 return await ref.current.capture();
//             }
//         } catch (e) {
//             console.log("Error capturing chart:", e);
//         }
//         return '';
//     };


//     const requestNotificationPermission = async () => {
//         if (Platform.OS === 'android' && Platform.Version >= 33) {
//             const granted = await PermissionsAndroid.request(
//                 PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
//             );

//             return granted === PermissionsAndroid.RESULTS.GRANTED;
//         }
//         return true;
//     };
//     // 🔔 Modern native notification for PDF download
//     const showDownloadNotification = async (fileName, filePath) => {
//         try {
//             const hasPermission = await requestNotificationPermission();
//             if (!hasPermission) {
//                 console.warn('Notification permission denied');
//                 return;
//             }
//             // Create a notification channel (required for Android 8+)
//             const channelId = await notifee.createChannel({
//                 id: 'pdf_downloads',
//                 name: 'PDF Downloads',
//                 description: 'Notifications for downloaded PDF reports',
//                 importance: AndroidImportance.HIGH,
//                 sound: 'default',
//                 vibration: true,
//             });

//             // Display the notification with filePath in data for tap-to-open
//             await notifee.displayNotification({
//                 title: '✅ Report Downloaded Successfully',
//                 body: `📄 ${fileName}\nSaved to Downloads folder. Tap to open.`,
//                 data: {
//                     filePath: filePath,
//                 },
//                 android: {
//                     channelId,
//                     smallIcon: 'ic_launcher',
//                     importance: AndroidImportance.HIGH,
//                     pressAction: {
//                         id: 'open_pdf',
//                         launchActivity: 'default',
//                     },
//                     style: {
//                         type: AndroidStyle.BIGTEXT,
//                         text: `📄 ${fileName}\n\nYour Airsine therapy report has been downloaded and saved to the Downloads folder. Tap this notification to open or share the PDF.`,
//                     },
//                     timestamp: Date.now(),
//                     showTimestamp: true,
//                     autoCancel: true,
//                 },
//                 ios: {
//                     sound: 'default',
//                 },
//             });

//             console.log('✅ Download notification shown for:', fileName);
//         } catch (notifError) {
//             console.log('Notification error (non-critical):', notifError);
//             // Non-critical — PDF is already saved, notification is just a bonus
//         }
//     };

//     const handleGenerateClick = () => {
//         if (!logs || logs.length === 0 || (logs.length === 1 && logs[0].id === 9999)) {
//             Alert.alert('No Clinical Data', 'Please import therapy logs from the machine selection screen first.');
//             return;
//         }

//         // Initialize form with current patient data if available
//         setTempPatientInfo({
//             patient_custom_id: patient?.patient_custom_id || '',
//             name: patient?.name || '',
//             age: patient?.age?.toString() || '',
//             gender: patient?.gender || 'Male',
//             dob: patient?.dob || '',
//             phone: patient?.phone || '',
//             email: patient?.email || '',
//             device_model: patient?.device_model || '',
//             machine_serial: patient?.machine_serial || ''
//         });

//         setShowDoctorModal(true);
//     };

//     const handleDoctorFormSubmit = () => {
//         if (!tempPatientInfo.name) {
//             Alert.alert('Required', 'Please enter at least the patient name.');
//             return;
//         }
//         setShowDoctorModal(false);
//         handleGeneratePDF(tempPatientInfo);
//     };

//     const handleGeneratePDF = async (patientDataToUse) => {
//         setGenerating(true);
//         try {
//             // Small delay to ensure charts are fully rendered in their hidden container before capture
//             await new Promise(resolve => setTimeout(resolve, 500));

//             // Capture each graph separately
//             const pressureGridImg = await captureChart(pressureGridRef);
//             const flowImg = await captureChart(flowChartRef);
//             const ahiImg = await captureChart(ahiMiniChartRef);
//             const leakImg = await captureChart(leakMiniChartRef);

//             const summary = calculateSummary();
//             const dateStr = new Date().toLocaleDateString('en-IN');

//             // Helper: apnea type label
//             const apneaLabel = (log) => {
//                 const parts = [];
//                 if ((log.obstructive_count || 0) > 0) parts.push(`OA:${log.obstructive_count}`);
//                 if ((log.central_count || 0) > 0) parts.push(`CA:${log.central_count}`);
//                 if ((log.hypopnea_count || 0) > 0) parts.push(`H:${log.hypopnea_count}`);
//                 return parts.length > 0 ? parts.join(' / ') : '0';
//             };

//             // Compliance breakdown
//             const compliantDayCount = logs.filter(l => (l.usage_hours || 0) >= 4).length;
//             const nonCompliantDayCount = logs.length - compliantDayCount;

//             // Build therapy table rows
//             const tableRows = logs.map((log, idx) => {
//                 const ahiColor = (log.ahi || 0) > 5 ? '#D32F2F' : '#1E7E34';
//                 const isCompliant = (log.usage_hours || 0) >= 4;
//                 const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F3F8FF';
//                 const usageBadge = isCompliant
//                     ? `<span style="background:#E8F5E9;color:#2E7D32;padding:2px 5px;border-radius:3px;font-size:9px;font-weight:bold;">&ge;4h &#10003;</span>`
//                     : `<span style="background:#FFF3E0;color:#E65100;padding:2px 5px;border-radius:3px;font-size:9px;font-weight:bold;">&lt;4h</span>`;
//                 const maskOff = (log.mask_off_count || 0);
//                 const maskColor = maskOff > 0 ? '#D32F2F' : '#555';
//                 const apneaStr = apneaLabel(log);

//                 let detailsStr = "";
//                 if (log.therapy_type === 'CPAP') {
//                     detailsStr = `
//                         <div style="text-align:left; font-size:7.5px; line-height:1.3; font-weight:normal; padding:2px;">
                        
//                           Avg Ramp Start Press: ${Number(log.ramp_start_pressure || 0).toFixed(1)}<br/>
//                           Set Pressure: ${Number(log.avg_set_pressure || 0).toFixed(1)}<br/>
//                           Pressure Off: ${Number(log.pressure_off || 0)}<br/>
//                           Avg Ramp Duration: ${log.ramp_duration || 0}
//                         </div>
//                     `;
//                 } else if (log.therapy_type === 'APAP') {
//                     detailsStr = `
//                         <div style="text-align:left; font-size:7.5px; line-height:1.3; font-weight:normal; padding:2px;">
                          
//                           Avg Ramp Start Press: ${Number(log.ramp_start_pressure || 0).toFixed(1)}<br/>
//                           Min: ${Number(log.pressure_min || 0).toFixed(1)} / Max: ${Number(log.pressure_max || 0).toFixed(1)}<br/>
//                           Pressure Off: ${Number(log.pressure_off || 0)}<br/>
//                           Avg Ramp Duration: ${log.ramp_duration || 0}
//                         </div>
//                     `;
//                 } else if (log.therapy_type === 'Mixed') {
//                     detailsStr = `
//                         <div style="text-align:left; font-size:7.5px; line-height:1.3; font-weight:normal; padding:2px;">
                          
//                           Avg Ramp Start Press: ${Number(log.ramp_start_pressure || 0).toFixed(1)}<br/>
//                           Set (CPAP): ${Number(log.avg_set_pressure || 0).toFixed(1)}<br/>
//                           Min (APAP): ${Number(log.pressure_min || 0).toFixed(1)} / Max: ${Number(log.pressure_max || 0).toFixed(1)}<br/>
//                           Pressure Off: ${Number(log.pressure_off || 0)}<br/>
//                           Avg Ramp Duration: ${log.ramp_duration || 0}
//                         </div>
//                     `;
//                 } else {
//                     detailsStr = `
//                         <div style="text-align:left; font-size:7.5px; line-height:1.3; font-weight:normal; padding:2px;">
//                           <b style="color:#065F46;">${log.therapy_type}</b><br/>
//                           Avg Pressure: ${Number(log.pressure_avg || 0).toFixed(1)}
//                         </div>
//                     `;
//                 }

//                 return `
//                     <tr style="background:${rowBg};">
//                         <td>${log.date || '--'}</td>
//                         <td>${formatHoursToHHMM(log.usage_hours)} ${usageBadge}</td>
//                         <td>${log.therapy_type || 'CPAP'}</td>
//                         <td>${detailsStr}</td>
//                         <td>${(log.pressure_avg || 0)}</td>
//                         <td>${(log.avg_flow || 0)}</td>
//                         <td>${(log.leak_rate || 0)}</td>
//                         <td>${(log.avg_resp_rate || 0)}</td>
//                         <td style="color:${ahiColor};font-weight:bold;">
//                             ${(log.ahi || 0)}<br/>
//                             <span style="font-size:7px;color:#607D8B;font-weight:normal;">${apneaStr}</span>
//                         </td>
//                         <td>${log.mask_fault_count || 0}</td>
//                         <td>${log.low_pressure_count || 0}</td>
//                     </tr>
//                 `;
//             }).join('');

//             // Build graph section helper
//             const graphSection = (title, imgBase64) => {
//                 if (!imgBase64) return '';
//                 return `
//                     <div style="page-break-inside:avoid; margin-bottom:26px; background:#fff; border:1px solid #D1FAE5; border-radius:12px; padding:15px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
//                         <div style="font-size:13px; font-weight:bold; color:#064E3B; border-left:4px solid #10B981; padding-left:10px; margin-bottom:12px;">${title}</div>
//                         <div style="text-align:center;">
//                             <img src="data:image/jpeg;base64,${imgBase64}" style="width:100%; max-width:420px; border-radius:6px;" />
//                         </div>
//                     </div>
//                 `;
//             };

//             const hasGraphs = pressureGridImg || flowImg || ahiImg || leakImg;

//             const htmlContent = `<!DOCTYPE html>
// <html>
// <head>
// <meta charset="UTF-8">
// <style>
// *{box-sizing:border-box;margin:0;padding:0;}
// body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1a1a2e;background:#fff;}
// .page1{padding:34px 38px 28px 38px;page-break-after:always;}
// .page2{padding:34px 38px 28px 38px;page-break-after:always;}
// .page3{padding:34px 38px 28px 38px; height: 1040px; position: relative;}
// .hdr-banner{
//     background:#ffffff;border:2px solid #065F46;
//     color:#065F46;padding:16px 22px;border-radius:10px;margin-bottom:18px;
//     display:flex;align-items:center;justify-content:space-between;
// }
// .hdr-banner h1{font-size:20px;font-weight:bold;letter-spacing:1px;}
// .hdr-banner .hdr-sub{font-size:10px;margin-top:3px;color:#065F46;}
// .hdr-right{text-align:right;font-size:10px;color:#065F46;line-height:1.7;}
// .sec{margin-top:14px;}
// .sec-title{
//     font-size:12px;font-weight:bold;color:#065F46;
//     border-left:4px solid #10B981;padding-left:8px;margin-bottom:9px;
// }
// .ig{width:100%;border-collapse:collapse;}
// .ig td{padding:4px 7px;font-size:11px;vertical-align:middle;}
// .lbl{color:#374151;font-weight:bold;width:130px;white-space:nowrap;}
// .val{color:#1a1a2e;}
// .hr-blue{border:none;border-top:2px solid #10B981;margin:14px 0;}
// .hr-dash{border:none;border-top:1.5px dashed #34D399;margin:12px 0;}
// .hr-light{border:none;border-top:1px solid #D1FAE5;margin:10px 0;}
// .stats-row{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;}
// .sc{
//     flex:1;min-width:78px;background:#ffffff;
//     border:1px solid #D1FAE5;border-radius:8px;padding:9px 6px;text-align:center;
// }
// .sc-v{font-size:17px;font-weight:bold;color:#10B981;line-height:1.15;}
// .sc-l{font-size:9px;color:#4B5563;margin-top:3px;line-height:1.3;}
// .comp-box{display:flex;gap:10px;margin-bottom:14px;}
// .ci{flex:1;border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:10px;}
// .ci.green{background:#ffffff;border:1px solid #10B981;}
// .ci.orange{background:#ffffff;border:1px solid #F59E0B;}
// .ci-num{font-size:24px;font-weight:bold;}
// .ci.green .ci-num{color:#059669;}
// .ci.orange .ci-num{color:#D97706;}
// .ci-desc{font-size:10px;color:#444;line-height:1.45;}
// .dt{width:100%;border-collapse:collapse;font-size:9.5px;margin-top:6px;}
// .dt th{
//     background:#065F46;color:#fff;padding:5px 3px;
//     text-align:center;font-size:9px;border:1px solid #065F46;white-space:nowrap;
// }
// .dt td{border:1px solid #D1FAE5;padding:5px 3px;text-align:center;vertical-align:middle;}
// .p2hdr{
//     background:#F0FDF4;border:1px solid #D1FAE5;border-radius:8px;
//     padding:12px 18px;margin-bottom:18px;
//     display:flex;align-items:center;justify-content:space-between;
// }
// .p2hdr h2{font-size:15px;color:#065F46;}
// .p2hdr span{font-size:10px;color:#374151;}
// .patient-line { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 8px; border-bottom: 2px solid #10B981; margin-bottom: 8px; }
// .patient-info { display: flex; gap: 25px; }
// .doctor-line { display: flex; gap: 20px; align-items: center; padding: 10px 15px; background: #F0FDF4; border-radius: 8px; margin-bottom: 15px; border: 1px dashed #D1FAE5; }
// .header-item { font-size: 11px; color: #444; }
// .sig-area{
//     position:absolute; bottom:65px; left:38px; right:38px;
//     display:flex;justify-content:space-between;align-items:flex-end;
// }
// .sig-blk{text-align:center;}
// .sig-line{border-top:1px solid #333;width:170px;margin:0 auto 5px auto;}
// .sig-lbl{font-size:10px;color:#333;font-weight:bold;}
// .sig-sub{font-size:9px;color:#90A4AE;margin-top:2px;}
// .footer{
//     position:absolute; bottom:20px; left:38px; right:38px;
//     text-align:center;font-size:9px;color:#90A4AE;
//     border-top:1px solid #E3F2FD;padding-top:8px;
// }
// </style>
// </head>
// <body>

// <!-- ══════════════ PAGE 1 ══════════════ -->
// <div class="page1">

// <div class="hdr-banner">
//     <div>
//         <h1>&#x1F4CB; Therapy Report</h1>
//         <div class="hdr-sub">Airsine CPAP Clinical Summary</div>
//     </div>
//     <div class="hdr-right">
//         <div><b>Report Date:</b> ${dateStr}</div>
//         <div><b>Total Days:</b> ${logs.length}</div>
//         <div><b>Device:</b> ${patientDataToUse?.machine_serial || '-'}</div>
//     </div>
// </div>

// <!-- Patient Info Header -->

// <!-- Patient Info (Detailed) -->
// <div class="sec">
//     <div class="sec-title">Patient Details</div>
//     <table class="ig">
//         <tr>
//             <td class="lbl">Patient ID:</td><td class="val">P-${patientDataToUse?.patient_custom_id || patientDataToUse?.id || '-'}</td>
//             <td class="lbl">Full Name:</td><td class="val">${patientDataToUse?.name || 'N/A'}</td>
//         </tr>
//         <tr>
//             <td class="lbl">Gender:</td><td class="val">${patientDataToUse?.gender || '-'}</td>
//             <td class="lbl">Date of Birth:</td><td class="val">${patientDataToUse?.dob || '-'}</td>
//         </tr>
//         <tr>
//             <td class="lbl">Phone:</td><td class="val">${patientDataToUse?.phone || '-'}</td>
//             <td class="lbl">Email:</td><td class="val">${patientDataToUse?.email || '-'}</td>
//         </tr>
//         <tr>
//             <td class="lbl">Device Model:</td><td class="val">${patientDataToUse?.device_model || '-'}</td>
//             <td class="lbl">Device Serial No:</td><td class="val">${patientDataToUse?.machine_serial || '-'}</td>
//         </tr>
//     </table>
// </div>

// <!-- Doctor section — separated by dashed line -->
// <hr class="hr-dash"/>
// <div class="sec">
//     <div class="sec-title">Referring Physician</div>
//     <table class="ig">
//         <tr>
//             <td class="lbl">Doctor Name:</td><td class="val">${userRole === 'doctor' ? (doctor?.name || '-') : (patientDataToUse?.doctor_name || '-')}</td>
//             <td class="lbl">Doctor Phone:</td><td class="val">${userRole === 'doctor' ? (doctor?.phone || '-') : (patientDataToUse?.doctor_phone || '-')}</td>
//         </tr>
//     </table>
// </div>

// <hr class="hr-blue"/>

// <!-- Therapy Summary Cards -->
// <div class="sec">
//     <div class="sec-title">Therapy Summary</div>
//     <div class="stats-row">
//         <div class="sc">
//             <div class="sc-v">${summary?.avgUsage || 0}h</div>
//             <div class="sc-l">Avg Daily Usage</div>
//         </div>
//         <div class="sc">
//             <div class="sc-v">${summary?.compliancePct || 0}%</div>
//             <div class="sc-l">Compliance Rate</div>
//         </div>
//         <div class="sc">
//             <div class="sc-v">${summary?.avgAHI || 0}</div>
//             <div class="sc-l">Avg AHI<br/>(events/hr)</div>
//         </div>
//         <div class="sc">
//             <div class="sc-v">${summary?.avgPressure || 0}</div>
//             <div class="sc-l">Avg Pressure<br/>(cmH&#8322;O)</div>
//         </div>
//         <div class="sc">
//             <div class="sc-v">${summary?.avgLeak || 0}</div>
//             <div class="sc-l">Avg Leak<br/>(L/min)</div>
//         </div>
//         <div class="sc">
//             <div class="sc-v">${logs.length}</div>
//             <div class="sc-l">Days Recorded</div>
//         </div>
//     </div>
// </div>

// <!-- Compliance Breakdown -->
// <div class="sec">
//     <div class="sec-title">Usage Compliance Breakdown</div>
//     <div class="comp-box">
//         <div class="ci green">
//             <div style="font-size:22px;">&#10003;</div>
//             <div>
//                 <div class="ci-num">${compliantDayCount}</div>
//                 <div class="ci-desc"><b>Days &ge; 4 Hours</b><br/>Compliant (Medicare standard)</div>
//             </div>
//         </div>
//         <div class="ci orange">
//             <div style="font-size:22px;">&#9888;</div>
//             <div>
//                 <div class="ci-num">${nonCompliantDayCount}</div>
//                 <div class="ci-desc"><b>Days &lt; 4 Hours</b><br/>Non-compliant (below threshold)</div>
//             </div>
//         </div>
//     </div>
// </div>

// <hr class="hr-light"/>

// <!-- Daily Therapy Log Table -->
// <div class="sec">
//     <div class="sec-title">Daily Therapy Log</div>
//     <table class="dt">
//         <thead>
//             <tr>
//                 <th>Date</th>
//                 <th>Usage (H:M)</th>
//                 <th>Mode</th>
//                 <th>Therapy<br/>Details</th>
//                 <th>Pressure<br/>(cmH&#8322;O)</th>
//                 <th>Flow<br/>(L/min)</th>
//                 <th>Leak<br/>(L/min)</th>
//                 <th>Resp<br/>Rate</th>
//                 <th>AHI</th>
//                 <th>Count Of Open Mask</th>
//                 <th>Count Of Low Pressure</th>
//             </tr>
//         </thead>
//         <tbody>${tableRows}</tbody>
//     </table>
// </div>

// </div>
// <!-- ══════════════ END PAGE 1 ══════════════ -->

// <!-- ══════════════ PAGE 2 — Summary Trends (Last 7 Days) ══════════════ -->
// <div class="page2">
//     <div class="p2hdr">
//         <h2>&#x1F4C8; Respiratory Trends Summary</h2>
//         <span>Patient: ${patientDataToUse?.name || '-'} &nbsp;|&nbsp; ${dateStr}</span>
//     </div>

//     <div style="margin-top:20px;">
//         <div style="font-size:8px; color:#64748b; margin-bottom:8px; text-align:right;">
//              <span style="color:#00BCD4">●</span> Flow Rate &nbsp;&nbsp; 
//              <span style="color:#EF5350">●</span> Events (AHI) &nbsp;&nbsp; 
//              <span style="color:#FFA726">●</span> Leak (L/m)
//         </div>
//         ${graphSection('Average Flow Rate (L/min)', flowImg)}
//         ${graphSection('Apnea Events (AHI Index / hr)', ahiImg)}
//         ${graphSection('Leak Rate (L/min)', leakImg)}
//     </div>
// </div>

// <!-- ══════════════ PAGE 3 — 9-Day Clinical Pressure Analysis ══════════════ -->
// <div class="page3" style="height:1040px; position:relative;">
//     <div class="p2hdr">
//         <h2>&#x1F4C8; 9-Day Clinical Pressure Analysis</h2>
//         <span>Patient: ${patientDataToUse?.name || '-'} &nbsp;|&nbsp; ${dateStr}</span>
//     </div>

//     <div style="margin-top:10px; background:#fff; border:1px solid #edf2f7; border-radius:12px; padding:15px; text-align:center;">
//         <div style="font-size:11px; font-weight:bold; color:#1e293b; border-left:4px solid #3b82f6; padding-left:10px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
//             <div style="text-align:left;">Daily Pressure Waveforms & Profiles</div>
//             <div style="font-size:8px; font-weight:normal; color:#64748b;">
//                 <span style="color:#1E88E5">●</span> Set Pressure &nbsp; 
//                 <span style="color:#EF4444">●</span> Max &nbsp;
//                 <span style="color:#14B8A6">●</span> Min
//             </div>
//         </div>
//         ${pressureGridImg ? `<img src="data:image/jpeg;base64,${pressureGridImg}" style="width:100%; max-width:100%; border-radius:6px;" />` : ''}
//     </div>

//     <!-- Doctor Signature — POSITIVELY AT THE END -->
//     <div class="sig-area">
//         <div class="sig-blk">
//             <div class="sig-line"></div>
//             <div class="sig-lbl">Authorised Physician</div>
//             <div class="sig-sub">${userRole === 'doctor' ? (doctor?.name || 'Doctor Name') : (patientDataToUse?.doctor_name || 'Doctor Name')}</div>
//             <div class="sig-sub">${userRole === 'doctor' ? (doctor?.phone || '') : (patientDataToUse?.doctor_phone || '')}</div>
//         </div>
//         <div class="sig-blk">
//             <div class="sig-line"></div>
//             <div class="sig-lbl">Date &amp; Stamp</div>
//             <div class="sig-sub">${dateStr}</div>
//         </div>
//         <div class="sig-blk">
//             <div class="sig-line"></div>
//             <div class="sig-lbl">Patient Signature</div>
//             <div class="sig-sub">${patientDataToUse?.name || '-'}</div>
//         </div>
//     </div>

//     <div class="footer">
//         Airsine CPAP Therapy Management System &nbsp;|&nbsp; Confidential – Medical Use Only
//         &nbsp;|&nbsp; Device SN: ${patientDataToUse?.machine_serial || '-'} &nbsp;|&nbsp; ${dateStr}
//     </div>
// </div>

// </body>
// </html>`;

//             const results = await createPDF({
//                 html: htmlContent,
//                 fileName: `Airsine_Report_${Date.now()}`,
//                 directory: 'Documents',
//                 base64: false,
//             });

//             if (!results || !results.filePath) {
//                 throw new Error('PDF file could not be created internally.');
//             }

//             // Path Sanitization for Android
//             let sourcePath = results.filePath;
//             if (Platform.OS === 'android' && !sourcePath.startsWith('file://')) {
//                 sourcePath = 'file://' + sourcePath;
//             }

//             const fileName = `Airsine_Report_${Date.now()}.pdf`;
//             const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

//             try {
//                 // Check if Downloads directory is accessible
//                 const exists = await RNFS.exists(RNFS.DownloadDirectoryPath);
//                 if (!exists) {
//                     await RNFS.mkdir(RNFS.DownloadDirectoryPath);
//                 }

//                 await RNFS.copyFile(results.filePath, downloadPath);

//                 // 🔔 Show native notification in notification tray
//                 await showDownloadNotification(fileName, downloadPath);

//                 Alert.alert(
//                     '✅ Report Downloaded!',
//                     `PDF saved to Downloads folder:\n${fileName}`,
//                     [
//                         { text: 'OK' },
//                         {
//                             text: 'Open PDF',
//                             onPress: async () => {
//                                 try {
//                                     await Share.open({
//                                         url: 'file://' + downloadPath,
//                                         type: 'application/pdf',
//                                         title: 'Airsine Report',
//                                     });
//                                 } catch (err) {
//                                     console.log('Share Error:', err);
//                                     // User might have cancelled or no app to open
//                                 }
//                             }
//                         }
//                     ]
//                 );
//             } catch (copyErr) {
//                 console.log('Copy to Downloads failed, opening internal path:', copyErr);

//                 // 🔔 Still show notification for fallback path
//                 await showDownloadNotification(fileName, results.filePath);

//                 Alert.alert(
//                     '✅ Report Generated!',
//                     `Saved to app storage. Click open to view.`,
//                     [
//                         { text: 'OK' },
//                         {
//                             text: 'Open PDF',
//                             onPress: async () => {
//                                 try {
//                                     await Share.open({
//                                         url: sourcePath,
//                                         type: 'application/pdf',
//                                         title: 'Airsine Report',
//                                     });
//                                 } catch (err) {
//                                     console.log('Share Error:', err);
//                                 }
//                             }
//                         }
//                     ]
//                 );
//             }

//             setGenerating(false);

//         } catch (error) {
//             setGenerating(false);
//             Alert.alert('Download Failed', 'Could not generate or save the report. Please check storage permissions.');
//             console.error('Error generating PDF:', error);
//         }
//     };

//     const reversedLogs9 = useMemo(() => [...graphLogs9].reverse(), [graphLogs9]);
//     const reversedLogs7 = useMemo(() => [...graphLogs7].reverse(), [graphLogs7]);

//     const dates9 = useMemo(() => reversedLogs9.map(l => l.date ? l.date.split('-')[2] : ''), [reversedLogs9]);
//     const dates7 = useMemo(() => reversedLogs7.map(l => l.date ? l.date.split('-')[2] : ''), [reversedLogs7]);

//     const summary = useMemo(() => calculateSummary(), [logs]);

//     const chartConfig = useMemo(() => ({
//         backgroundColor: "#FFFFFF",
//         backgroundGradientFrom: "#FFFFFF",
//         backgroundGradientTo: "#FFFFFF",
//         decimalPlaces: 1,
//         color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
//         labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
//         style: { borderRadius: 16 },
//         propsForDots: { r: "5", strokeWidth: "3", stroke: "#FFF" },
//         propsForLabels: { fontSize: 10 },
//         fillShadowGradientFrom: "#10B981",
//         fillShadowGradientTo: "#FFFFFF",
//         fillShadowGradientOpacity: 0.1,
//     }), []);

//     const flowChartConfig = useMemo(() => ({
//         ...chartConfig,
//         color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
//         fillShadowGradientFrom: "#0D9488",
//     }), [chartConfig]);

//     const multiLineChartConfig = useMemo(() => ({
//         ...chartConfig,
//         color: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
//         fillShadowGradientOpacity: 0, // No fill for multi-line
//     }), [chartConfig]);

//     return (
//         <SafeAreaView style={styles.container}>
//             {/* ⚡ Performance Tweak: Only render off-screen charts when actually generating PDF */}
//             {generating && (
//                 <View style={styles.hiddenChartContainer} collapsable={false}>
//                     {/* 1. 9-Day Pressure Profile Grid (Matching App UI) */}
//                     <ViewShot ref={pressureGridRef} options={{ format: "png", quality: 0.7, result: "base64" }} collapsable={false}>
//                         <View style={[styles.gridContainer, { backgroundColor: '#FFFFFF' }]}>
//                             {reversedLogs9.map((log, i) => {
//                                 const usageH = parseFloat(log.usage_hours) || 0;
//                                 const setPres = parseFloat(log.avg_set_pressure || log.pressure_avg) || 0.1;
//                                 const minP = parseFloat(log.pressure_min) || 4;
//                                 const maxP = parseFloat(log.pressure_max) || setPres;

//                                 const therapyStr = (log.therapy_type || '').toLowerCase();
//                                 const isCPAP = !therapyStr.includes('apap') && !therapyStr.includes('mixed');
//                                 const isAPAP = therapyStr.includes('apap') && !therapyStr.includes('mixed');
//                                 const isMixed = therapyStr.includes('mixed');

//                                 const badgeIcon = isCPAP ? 'lungs' : isAPAP ? 'wave' : 'swap-horizontal';
//                                 const stripeColor = isCPAP ? '#1E88E5' : isAPAP ? '#7C3AED' : '#14B8A6';

//                                 const totalMins = usageH * 60;
//                                 const endLabel = totalMins > 0
//                                     ? `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(Math.floor(totalMins % 60)).padStart(2, '0')}`
//                                     : '00:00';
//                                 const midMins = totalMins / 4;
//                                 const xLabels = [0, 1, 2, 3, 4].map(s => {
//                                     const m = s * midMins;
//                                     return s === 0 ? '00:00'
//                                         : s === 4 ? endLabel
//                                             : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
//                                 });

//                                 const bCol = isCPAP ? '#0284C7' : isAPAP ? '#7C3AED' : '#EA580C';
//                                 const bBg = isCPAP ? '#E0F2FE' : isAPAP ? '#F5F3FF' : '#FFF7ED';
//                                 const bLab = isCPAP ? 'CPAP' : isAPAP ? 'APAP' : 'MIXED';

//                                 let cData;
//                                 if (isCPAP) {
//                                     const r0 = (parseFloat(log.ramp_start_pressure) || setPres * 0.55);
//                                     cData = { labels: xLabels, datasets: [{ data: [r0, r0 + (setPres - r0) * 0.2, r0 + (setPres - r0) * 0.55, r0 + (setPres - r0) * 0.85, setPres], color: (op = 1) => `rgba(15,70,180,${op})`, strokeWidth: 1.5 }] };
//                                 } else if (isAPAP) {
//                                     const yMin = Math.max(0, Math.min(minP, 4) - 1);
//                                     cData = { labels: xLabels, datasets: [{ data: Array(5).fill(maxP), color: (op = 1) => `rgba(185,28,28,${op})`, strokeWidth: 1.5 }, { data: Array(5).fill(minP), color: (op = 1) => `rgba(30,64,175,${op})`, strokeWidth: 1.5 }, { data: Array(5).fill(yMin), color: () => 'transparent', strokeWidth: 0, withDots: false }] };
//                                 } else {
//                                     const r0 = (parseFloat(log.ramp_start_pressure) || setPres * 0.55);
//                                     const yAnchor = Math.max(0, Math.min(minP, 4) - 1);
//                                     cData = { labels: xLabels, datasets: [{ data: [r0, r0 + (setPres - r0) * 0.25, r0 + (setPres - r0) * 0.55, r0 + (setPres - r0) * 0.8, setPres], color: (op = 1) => `rgba(15,70,180,${op})`, strokeWidth: 1.5 }, { data: Array(5).fill(maxP), color: (op = 1) => `rgba(185,28,28,${op})`, strokeWidth: 1.5 }, { data: Array(5).fill(minP), color: (op = 1) => `rgba(15,118,110,${op})`, strokeWidth: 1.5 }, { data: Array(5).fill(yAnchor), color: () => 'transparent', strokeWidth: 0, withDots: false }] };
//                                 }

//                                 return (
//                                     <View key={i} style={styles.miniGridCard}>
//                                         <View style={styles.gridCardHeader}>
//                                             <View>
//                                                 <Text style={styles.gridDate}>{log.date}</Text>
//                                                 <Text style={styles.gridUsage}>Usage: {formatHoursToHHMM(usageH)}</Text>
//                                             </View>
//                                             <View style={[styles.miniBadge, { backgroundColor: bBg, flexDirection: 'row', alignItems: 'center', gap: 2 }]}>
//                                                 <Icon name={badgeIcon} size={8} color={bCol} />
//                                                 <Text style={[styles.miniBadgeText, { color: bCol }]}>{bLab}</Text>
//                                             </View>
//                                         </View>

//                                         <View style={[styles.miniAccentStripe, { backgroundColor: stripeColor }]} />

//                                         <View style={{ height: 110, paddingLeft: 10 }}>
//                                             <LineChart
//                                                 data={cData}
//                                                 width={170} height={105}
//                                                 chartConfig={{
//                                                     ...chartConfig,
//                                                     backgroundGradientFrom: "#FFF",
//                                                     backgroundGradientTo: "#FFF",
//                                                     decimalPlaces: 1,
//                                                     fillShadowGradientFromOpacity: 0,
//                                                     fillShadowGradientToOpacity: 0,
//                                                     propsForLabels: { fontSize: 7, fontWeight: '600' },
//                                                     propsForBackgroundLines: { stroke: '#f1f5f9' },
//                                                     propsForDots: { r: '2', strokeWidth: '1.5', stroke: '#fff' }
//                                                 }}
//                                                 withInnerLines={true}
//                                                 bezier={!isAPAP}
//                                                 withDots={true}
//                                                 formatYLabel={(v) => Number(v) > 0 ? Number(v).toFixed(1) : ''}
//                                                 style={{ marginVertical: 4, marginLeft: -15 }}
//                                             />
//                                         </View>

//                                         <View style={styles.gridLabelsRow}>
//                                             <Text style={styles.gridLabelsText}>cmH₂O</Text>
//                                             <Text style={styles.gridLabelsText}>Time →</Text>
//                                         </View>

//                                         <View style={styles.miniPressureSummaryRow}>
//                                             {isCPAP ? (
//                                                 <View style={styles.miniPressureSummaryItem}>
//                                                     <Text style={styles.miniPressureSummaryVal}>{setPres.toFixed(1)}</Text>
//                                                     <Text style={styles.miniPressureSummaryLbl}>Set Press</Text>
//                                                 </View>
//                                             ) : isAPAP ? (
//                                                 <>
//                                                     <View style={styles.miniPressureSummaryItem}>
//                                                         <Text style={[styles.miniPressureSummaryVal, { color: '#1E88E5' }]}>{minP.toFixed(1)}</Text>
//                                                         <Text style={styles.miniPressureSummaryLbl}>Min</Text>
//                                                     </View>
//                                                     <View style={[styles.miniPressureSummaryItem, { borderLeftWidth: 1, borderColor: '#F1F5F9' }]}>
//                                                         <Text style={[styles.miniPressureSummaryVal, { color: '#EF5350' }]}>{maxP.toFixed(1)}</Text>
//                                                         <Text style={styles.miniPressureSummaryLbl}>Max</Text>
//                                                     </View>
//                                                 </>
//                                             ) : (
//                                                 <>
//                                                     <View style={styles.miniPressureSummaryItem}>
//                                                         <Text style={[styles.miniPressureSummaryVal, { color: '#1E88E5' }]}>{setPres.toFixed(1)}</Text>
//                                                         <Text style={styles.miniPressureSummaryLbl}>Set</Text>
//                                                     </View>
//                                                     <View style={[styles.miniPressureSummaryItem, { borderLeftWidth: 1, borderColor: '#F1F5F9' }]}>
//                                                         <Text style={[styles.miniPressureSummaryVal, { color: '#14B8A6' }]}>{minP.toFixed(1)}</Text>
//                                                         <Text style={styles.miniPressureSummaryLbl}>Min</Text>
//                                                     </View>
//                                                     <View style={[styles.miniPressureSummaryItem, { borderLeftWidth: 1, borderColor: '#F1F5F9' }]}>
//                                                         <Text style={[styles.miniPressureSummaryVal, { color: '#EF4444' }]}>{maxP.toFixed(1)}</Text>
//                                                         <Text style={styles.miniPressureSummaryLbl}>Max</Text>
//                                                     </View>
//                                                 </>
//                                             )}
//                                         </View>

//                                         <View style={styles.gridLegendRow}>
//                                             {!isCPAP && <View style={styles.miniLegendItem}><View style={[styles.miniLegendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.miniLegendTxt}>Max</Text></View>}
//                                             {!isCPAP && <View style={styles.miniLegendItem}><View style={[styles.miniLegendDot, { backgroundColor: isAPAP ? '#64C8FF' : '#14B8A6' }]} /><Text style={styles.miniLegendTxt}>Min</Text></View>}
//                                             {isCPAP && <View style={styles.miniLegendItem}><View style={[styles.miniLegendDot, { backgroundColor: '#1E88E5' }]} /><Text style={styles.miniLegendTxt}>Set Pressure</Text></View>}
//                                         </View>
//                                     </View>
//                                 );
//                             })}
//                         </View>
//                     </ViewShot>

//                     {/* 2. Flow Rate (7 Days) */}
//                     <ViewShot ref={flowChartRef} options={{ format: "png", quality: 0.8, result: "base64" }} collapsable={false}>
//                         <View style={styles.hiddenChartView}>
//                             {dates7.length > 0 && <LineChart
//                                 data={{ labels: dates7, datasets: [{ data: reversedLogs7.map(l => l.avg_flow || 0) }] }}
//                                 width={360} height={180}
//                                 chartConfig={{ ...flowChartConfig, strokeWidth: 1, fillShadowGradientFromOpacity: 0, fillShadowGradientToOpacity: 0 }}
//                                 formatYLabel={(v) => Number(v).toFixed(2)}
//                                 bezier={reversedLogs7.length > 1}
//                                 withInnerLines={true}
//                             />}
//                         </View>
//                     </ViewShot>

//                     {/* 3. AHI Mini (7 Days) */}
//                     <ViewShot ref={ahiMiniChartRef} options={{ format: "png", quality: 0.8, result: "base64" }} collapsable={false}>
//                         <View style={styles.hiddenChartView}>
//                             {dates7.length > 0 && <LineChart
//                                 data={{ labels: dates7, datasets: [{ data: reversedLogs7.map(l => l.ahi || 0) }] }}
//                                 width={360} height={170}
//                                 chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(239, 83, 80, ${opacity})` }}
//                                 bezier={reversedLogs7.length > 1}
//                                 withInnerLines={true}
//                                 withDots={true}
//                             />}
//                         </View>
//                     </ViewShot>

//                     <ViewShot ref={leakMiniChartRef} options={{ format: "png", quality: 0.8, result: "base64" }} collapsable={false}>
//                         <View style={styles.hiddenChartView}>
//                             {dates7.length > 0 && <LineChart
//                                 data={{ labels: dates7, datasets: [{ data: reversedLogs7.map(l => l.leak_rate || 0) }] }}
//                                 width={360} height={170}
//                                 chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})` }}
//                                 bezier={reversedLogs7.length > 1}
//                                 withInnerLines={true}
//                                 withDots={true}
//                             />}
//                         </View>
//                     </ViewShot>
//                 </View>
//             )}

//             <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
//             <View style={styles.header}>
//                 <Text style={styles.headerTitle}>Therapy Report</Text>
//             </View>

//             <ScrollView contentContainerStyle={styles.content}>
//                 <View style={styles.previewCard}>
//                     <View style={styles.pdfIcon}>
//                         <Icon name="file-pdf-box" size={60} color={Colors.primary} />
//                     </View>
//                     <Text style={styles.previewTitle}>Download Your Clinical Data</Text>
//                     <Text style={styles.previewSub}>
//                         Generate a professional PDF report containing your therapy trends, compliance score, and detailed session logs.
//                     </Text>

//                     <TouchableOpacity style={styles.downloadBtn} onPress={handleGenerateClick} disabled={generating}>
//                         {generating ? (
//                             <ActivityIndicator color="#FFF" />
//                         ) : (
//                             <>
//                                 <Icon name="download" size={20} color="#FFF" />
//                                 <Text style={styles.btnText}>GENERATE REPORT</Text>
//                             </>
//                         )}
//                     </TouchableOpacity>
//                 </View>

//                 {/* Patient Summary Mini-Card */}
//                 <View style={styles.summaryBox}>
//                     <View style={styles.summaryItem}>
//                         <Text style={styles.summaryVal}>{logs.length}</Text>
//                         <Text style={styles.summaryLbl}>Days Loaded</Text>
//                     </View>
//                     <View style={[styles.summaryItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#DDD' }]}>
//                         <Text style={styles.summaryVal}>{summary?.compliancePct || 0}%</Text>
//                         <Text style={styles.summaryLbl}>Compliance</Text>
//                     </View>
//                 </View>

//                 {/* Modern Dashboard Graphs */}

//             </ScrollView>

//             {/* Doctor Form Modal */}
//             <Modal visible={showDoctorModal} transparent animationType="slide">
//                 <View style={styles.modalOverlay}>
//                     <View style={styles.modalContent}>
//                         <View style={styles.modalHeader}>
//                             <Icon name="account-edit-outline" size={24} color={Colors.primary} />
//                             <Text style={styles.modalTitle}>Patient Information</Text>
//                         </View>
//                         <Text style={styles.modalSub}>
//                             Please enter the patient's details before generating the report.
//                         </Text>

//                         <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
//                             <Text style={styles.inputLabel}>Patient Name *</Text>
//                             <TextInput
//                                 style={styles.inputField}
//                                 placeholder="Enter Patient Name"
//                                 value={tempPatientInfo.name}
//                                 onChangeText={text => setTempPatientInfo({ ...tempPatientInfo, name: text })}
//                             />

//                             <View style={styles.inputRow}>
//                                 <View style={{ flex: 1, marginRight: 10 }}>
//                                     <Text style={styles.inputLabel}>Age</Text>
//                                     <TextInput
//                                         style={styles.inputField}
//                                         placeholder="e.g. 45"
//                                         keyboardType="numeric"
//                                         value={tempPatientInfo.age}
//                                         onChangeText={text => setTempPatientInfo({ ...tempPatientInfo, age: text })}
//                                     />
//                                 </View>
//                                 <View style={{ flex: 1 }}>
//                                     <Text style={styles.inputLabel}>Gender</Text>
//                                     <TouchableOpacity 
//                                         style={styles.dropdownField}
//                                         onPress={() => setShowGenderModal(true)}
//                                     >
//                                         <Text style={[styles.dropdownText, !tempPatientInfo.gender && { color: '#999' }]}>
//                                             {tempPatientInfo.gender || 'Select Gender'}
//                                         </Text>
//                                         <Icon name="chevron-down" size={20} color={Colors.textSecondary} />
//                                     </TouchableOpacity>
//                                 </View>
//                             </View>

//                             <View style={styles.inputRow}>
//                                 <View style={{ flex: 1, marginRight: 10 }}>
//                                     <Text style={styles.inputLabel}>Date of Birth</Text>
//                                     <TouchableOpacity 
//                                         style={styles.dropdownField}
//                                         onPress={() => setShowDatePicker(true)}
//                                     >
//                                         <Text style={[styles.dropdownText, !tempPatientInfo.dob && { color: '#999' }]}>
//                                             {tempPatientInfo.dob || 'Select DOB'}
//                                         </Text>
//                                         <Icon name="calendar-month-outline" size={20} color={Colors.textSecondary} />
//                                     </TouchableOpacity>
//                                 </View>
//                                 <View style={{ flex: 1 }}>
//                                     <Text style={styles.inputLabel}>Patient ID</Text>
//                                     <TextInput
//                                         style={styles.inputField}
//                                         placeholder="e.g. P-001"
//                                         value={tempPatientInfo.patient_custom_id}
//                                         onChangeText={text => setTempPatientInfo({ ...tempPatientInfo, patient_custom_id: text })}
//                                     />
//                                 </View>
//                             </View>

//                             <View style={styles.inputRow}>
//                                 <View style={{ flex: 1, marginRight: 10 }}>
//                                     <Text style={styles.inputLabel}>Phone Number</Text>
//                                     <TextInput
//                                         style={styles.inputField}
//                                         placeholder="e.g. +91 9876..."
//                                         keyboardType="phone-pad"
//                                         value={tempPatientInfo.phone}
//                                         onChangeText={text => setTempPatientInfo({ ...tempPatientInfo, phone: text })}
//                                     />
//                                 </View>
//                                 <View style={{ flex: 1 }}>
//                                     <Text style={styles.inputLabel}>Email Address</Text>
//                                     <TextInput
//                                         style={styles.inputField}
//                                         placeholder="e.g. patient@mail.com"
//                                         keyboardType="email-address"
//                                         value={tempPatientInfo.email}
//                                         onChangeText={text => setTempPatientInfo({ ...tempPatientInfo, email: text })}
//                                     />
//                                 </View>
//                             </View>

//                             {/* <Text style={styles.inputLabel}>Device Model</Text>
//                             <TextInput
//                                 style={styles.inputField}
//                                 placeholder="e.g. Airsine 11 AutoSet"
//                                 value={tempPatientInfo.device_model}
//                                 onChangeText={text => setTempPatientInfo({ ...tempPatientInfo, device_model: text })}
//                             />

//                             <Text style={styles.inputLabel}>Device Serial No</Text>
//                             <TextInput
//                                 style={styles.inputField}
//                                 placeholder="e.g. AS11-1234"
//                                 value={tempPatientInfo.machine_serial}
//                                 onChangeText={text => setTempPatientInfo({ ...tempPatientInfo, machine_serial: text })}
//                             /> */}

//                             <View style={styles.modalActions}>
//                                 <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowDoctorModal(false)}>
//                                     <Text style={styles.modalCancelText}>Cancel</Text>
//                                 </TouchableOpacity>
//                                 <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleDoctorFormSubmit}>
//                                     <Text style={styles.modalSubmitText}>Generate</Text>
//                                 </TouchableOpacity>
//                             </View>
//                         </ScrollView>
//                     </View>
//                 </View>
//             </Modal>

//             {/* Date Picker */}
//             {showDatePicker && (
//                 <DateTimePicker
//                     value={tempPatientInfo.dob ? new Date(tempPatientInfo.dob.split('-').reverse().join('-')) : new Date(1990, 0, 1)}
//                     mode="date"
//                     display="default"
//                     maximumDate={new Date()}
//                     onChange={handleDateChange}
//                 />
//             )}

//             {/* Gender Picker Modal */}
//             <Modal visible={showGenderModal} transparent animationType="fade">
//                 <TouchableOpacity 
//                     style={styles.genderModalOverlay} 
//                     activeOpacity={1} 
//                     onPress={() => setShowGenderModal(false)}
//                 >
//                     <View style={styles.genderPickerCard}>
//                         <Text style={styles.genderTitle}>Select Gender</Text>
//                         {['Male', 'Female', 'Other'].map((item) => (
//                             <TouchableOpacity 
//                                 key={item} 
//                                 style={styles.genderOption} 
//                                 onPress={() => {
//                                     setTempPatientInfo({ ...tempPatientInfo, gender: item });
//                                     setShowGenderModal(false);
//                                 }}
//                             >
//                                 <Text style={styles.genderOptionText}>{item}</Text>
//                                 {tempPatientInfo.gender === item && <Icon name="check-circle" size={20} color={Colors.primary} />}
//                             </TouchableOpacity>
//                         ))}
//                     </View>
//                 </TouchableOpacity>
//             </Modal>
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#FFFFFF',
//     },
//     hiddenChartContainer: {
//         position: 'absolute',
//         top: -10000,
//         left: 0,
//         opacity: 0,
//     },
//     hiddenChartView: {
//         width: 400,
//         backgroundColor: '#FFF',
//         paddingVertical: 10,
//         paddingHorizontal: 10,
//     },
//     header: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingHorizontal: Spacing.xl,
//         paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : 20,
//         paddingBottom: 10,
//         backgroundColor: Colors.primary,
//         elevation: 8,
//     },
//     headerTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: '#FFFFFF',
//     },
//     content: {
//         padding: Spacing.xl,
//     },
//     previewCard: {
//         backgroundColor: '#F8FBFF',
//         borderRadius: 24,
//         padding: 30,
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#E3F2FD',
//         elevation: 4,
//         shadowColor: Colors.primary,
//         shadowOpacity: 0.05,
//         shadowRadius: 10,
//     },
//     pdfIcon: {
//         backgroundColor: '#FFF',
//         width: 110,
//         height: 80,
//         borderRadius: 12,
//         justifyContent: 'center',
//         alignItems: 'center',
//         marginBottom: 20,
//         elevation: 10,
//         shadowColor: '#000',
//         shadowOpacity: 0.1,
//         shadowRadius: 10,
//     },
//     previewTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: Colors.text,
//         textAlign: 'center',
//     },
//     previewSub: {
//         fontSize: 13,
//         color: Colors.textSecondary,
//         textAlign: 'center',
//         marginTop: 10,
//         lineHeight: 20,
//     },
//     downloadBtn: {
//         backgroundColor: Colors.primary,
//         flexDirection: 'row',
//         paddingHorizontal: 30,
//         paddingVertical: 15,
//         borderRadius: 30,
//         marginTop: 30,
//         alignItems: 'center',
//         elevation: 5,
//         shadowColor: Colors.primary,
//         shadowOpacity: 0.3,
//     },
//     btnText: {
//         color: '#FFF',
//         fontWeight: 'bold',
//         marginLeft: 10,
//         letterSpacing: 1,
//     },
//     shareRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-around',
//         marginTop: 30,
//     },
//     shareOption: {
//         alignItems: 'center',
//         padding: 10,
//     },
//     shareLabel: {
//         fontSize: 12,
//         color: Colors.textSecondary,
//         marginTop: 5,
//     },
//     summaryBox: {
//         backgroundColor: '#FFF',
//         borderRadius: 16,
//         padding: 20,
//         marginTop: 30,
//         flexDirection: 'row',
//         borderWidth: 1,
//         borderColor: '#F0F4F8',
//     },
//     summaryItem: {
//         flex: 1,
//         alignItems: 'center',
//     },
//     summaryVal: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: Colors.primary,
//     },
//     summaryLbl: {
//         fontSize: 10,
//         color: Colors.textSecondary,
//         marginTop: 4,
//     },
//     dashboardSection: {
//         marginTop: 20,
//     },
//     gridContainer: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         width: 630,
//         backgroundColor: '#FFFFFF',
//         padding: 15,
//         justifyContent: 'space-between',
//     },
//     miniGridCard: {
//         width: 195,
//         marginBottom: 12,
//         padding: 10,
//         backgroundColor: '#FFFFFF',
//         borderRadius: 14,
//         borderWidth: 1,
//         borderColor: '#E2E8F0',
//     },
//     gridCardHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: 4,
//         borderBottomWidth: 1,
//         borderBottomColor: '#F1F5F9',
//         paddingBottom: 4,
//     },
//     gridDate: {
//         fontSize: 8,
//         fontWeight: 'bold',
//         color: '#1E293B',
//     },
//     gridUsage: {
//         fontSize: 7,
//         color: '#94A3B8',
//         fontWeight: '600',
//     },
//     miniBadge: {
//         paddingHorizontal: 5,
//         paddingVertical: 1,
//         borderRadius: 6,
//     },
//     miniBadgeText: {
//         fontSize: 7,
//         fontWeight: 'bold',
//     },
//     gridLabelsRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         paddingHorizontal: 4,
//         marginTop: -5,
//     },
//     gridLabelsText: {
//         fontSize: 6,
//         color: '#94A3B8',
//         fontWeight: 'bold',
//     },
//     gridLegendRow: {
//         flexDirection: 'row',
//         justifyContent: 'center',
//         gap: 8,
//         marginTop: 6,
//         paddingTop: 4,
//         borderTopWidth: 1,
//         borderTopColor: '#F1F5F9',
//     },
//     miniLegendItem: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: 3,
//     },
//     miniLegendDot: {
//         width: 5,
//         height: 5,
//         borderRadius: 2.5,
//     },
//     miniLegendTxt: {
//         fontSize: 6,
//         fontWeight: '700',
//         color: '#475569',
//     },
//     miniAccentStripe: {
//         height: 3,
//         borderRadius: 3,
//         marginBottom: 6,
//         marginHorizontal: -10,
//     },
//     miniPressureSummaryRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-around',
//         marginTop: 6,
//         paddingTop: 6,
//         borderTopWidth: 1,
//         borderTopColor: '#F1F5F9',
//     },
//     miniPressureSummaryItem: {
//         flex: 1,
//         alignItems: 'center',
//     },
//     miniPressureSummaryVal: {
//         fontSize: 10,
//         fontWeight: '800',
//         color: Colors.primary,
//     },
//     miniPressureSummaryLbl: {
//         fontSize: 5,
//         color: '#94A3B8',
//         textAlign: 'center',
//         fontWeight: '600',
//         marginTop: 1,
//     },
//     graphCard: {
//         backgroundColor: '#FFFFFF',
//         borderRadius: 20,
//         padding: 15,
//         marginBottom: 20,
//         borderWidth: 1,
//         borderColor: '#F1F5F9',
//         elevation: 2,
//         shadowColor: '#000',
//         shadowOpacity: 0.03,
//         shadowRadius: 10,
//         overflow: 'hidden',
//     },
//     cardHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 15,
//         gap: 8,
//     },
//     cardTitle: {
//         fontSize: 13,
//         fontWeight: '700',
//         color: '#1E293B',
//     },
//     legendOverlay: {
//         paddingTop: 10,
//         alignItems: 'center',
//     },
//     legendNote: {
//         fontSize: 9,
//         color: '#94A3B8',
//         fontStyle: 'italic',
//     },
//     modalOverlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0,0,0,0.5)',
//         justifyContent: 'flex-end',
//     },
//     modalContent: {
//         backgroundColor: '#FFFFFF',
//         borderTopLeftRadius: 24,
//         borderTopRightRadius: 24,
//         padding: 24,
//         maxHeight: '85%',
//     },
//     modalHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 8,
//         gap: 10,
//     },
//     modalTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: Colors.text,
//     },
//     modalSub: {
//         fontSize: 13,
//         color: Colors.textSecondary,
//         marginBottom: 20,
//     },
//     modalForm: {
//         marginBottom: 10,
//     },
//     inputLabel: {
//         fontSize: 12,
//         fontWeight: '700',
//         color: Colors.textSecondary,
//         marginBottom: 6,
//     },
//     inputField: {
//         backgroundColor: '#F8FAFC',
//         borderWidth: 1,
//         borderColor: '#E2E8F0',
//         borderRadius: 10,
//         paddingHorizontal: 14,
//         height: 48,
//         fontSize: 14,
//         color: Colors.text,
//         marginBottom: 16,
//     },
//     inputRow: {
//         flexDirection: 'row',
//     },
//     modalActions: {
//         flexDirection: 'row',
//         marginTop: 10,
//         gap: 12,
//     },
//     modalCancelBtn: {
//         flex: 1,
//         paddingVertical: 14,
//         alignItems: 'center',
//         backgroundColor: '#F1F5F9',
//         borderRadius: 12,
//     },
//     modalCancelText: {
//         color: Colors.text,
//         fontWeight: '700',
//         fontSize: 14,
//     },
//     modalSubmitBtn: {
//         flex: 1,
//         paddingVertical: 14,
//         alignItems: 'center',
//         backgroundColor: Colors.primary,
//         borderRadius: 12,
//     },
//     modalSubmitText: {
//         color: '#FFFFFF',
//         fontWeight: '700',
//         fontSize: 14,
//     },
//     dropdownField: {
//         backgroundColor: '#F8FAFC',
//         borderWidth: 1,
//         borderColor: '#E2E8F0',
//         borderRadius: 10,
//         paddingHorizontal: 14,
//         height: 48,
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         marginBottom: 16,
//     },
//     dropdownText: {
//         fontSize: 14,
//         color: Colors.text,
//     },
//     genderModalOverlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0,0,0,0.4)',
//         justifyContent: 'center',
//         alignItems: 'center',
//         padding: 20,
//     },
//     genderPickerCard: {
//         backgroundColor: '#FFF',
//         width: '80%',
//         borderRadius: 20,
//         padding: 20,
//         elevation: 10,
//     },
//     genderTitle: {
//         fontSize: 16,
//         fontWeight: 'bold',
//         color: Colors.text,
//         marginBottom: 15,
//         textAlign: 'center',
//     },
//     genderOption: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingVertical: 14,
//         borderBottomWidth: 1,
//         borderBottomColor: '#F1F5F9',
//     },
//     genderOptionText: {
//         fontSize: 15,
//         color: Colors.text,
//     },
// });

// export default ReportPreviewScreen;
