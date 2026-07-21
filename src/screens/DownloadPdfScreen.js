



import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Alert,
    Dimensions,
    Platform,
    Animated,
    StatusBar,
    Modal,
    PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useData } from '../context/DataContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ENDPOINTS } from '../api/apiConfig';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import notifee, { AndroidImportance, EventType, AndroidStyle } from '@notifee/react-native';
import { WebView } from 'react-native-webview';

const getPdfJsHtml = (base64Data) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>PDF Preview</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    #loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #64748B;
      font-size: 16px;
    }
    #canvas-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      gap: 16px;
    }
    canvas {
      box-shadow: 0 1px 3px rgb(0 0 0 / 0.05);
      border-radius: 8px;
      background-color: #FFFFFF;
      max-width: 100%;
      height: auto !important;
    }
    .spinner {
      border: 4px solid #F3F3F3;
      border-top: 4px solid #518276;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <div>Loading Preview...</div>
  </div>
  <div id="canvas-container"></div>

  <script>
    // Configure worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    try {
      // Decode base64
      var pdfData = atob('${base64Data}');
      
      // Convert to binary array
      var uint8Array = new Uint8Array(pdfData.length);
      for (var i = 0; i < pdfData.length; i++) {
        uint8Array[i] = pdfData.charCodeAt(i);
      }

      var loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      
      loadingTask.promise.then(function(pdf) {
        document.getElementById('loading').style.display = 'none';
        var container = document.getElementById('canvas-container');

        var renderPage = function(pageNum) {
          pdf.getPage(pageNum).then(function(page) {
            var scale = 2.0; // Higher scale for clear text rendering
            var viewport = page.getViewport({ scale: scale });

            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            canvas.style.width = '100%';
            
            container.appendChild(canvas);

            var renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };
            page.render(renderContext).promise.then(function() {
              if (pageNum < pdf.numPages) {
                renderPage(pageNum + 1);
              }
            });
          });
        };

        // Start rendering first page
        renderPage(1);

      }, function(error) {
        document.getElementById('loading').innerHTML = '<div style="color: #EF4444; font-weight: bold;">Error loading PDF: ' + error.message + '</div>';
        console.error('PDF JS Promise Error:', error);
      });
    } catch (e) {
      document.getElementById('loading').innerHTML = '<div style="color: #EF4444; font-weight: bold;">Error decoding data: ' + e.message + '</div>';
      console.error('PDF JS Init Error:', e);
    }
  </script>
</body>
</html>
`;

const { width, height } = Dimensions.get('window');

const DAY_OPTIONS = [
    { label: 'Last 7 Days', value: 7, icon: 'calendar-week' },
    { label: 'Last 15 Days', value: 15, icon: 'calendar-range' },
    { label: 'Last 30 Days', value: 30, icon: 'calendar-month' },
    { label: 'Last 60 Days', value: 60, icon: 'calendar-clock' },
    { label: 'Last 90 Days', value: 90, icon: 'calendar-check' },
];

// ── Modern Dropdown Component ─────────────────────────────────────────────────
const ModernDropdown = ({ selected, onSelect }) => {
    const [open, setOpen] = useState(false);
    const animHeight = useRef(new Animated.Value(0)).current;
    const animOpacity = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const selectedOption = DAY_OPTIONS.find(o => o.value === selected) || DAY_OPTIONS[0];

    const toggle = () => {
        if (open) {
            Animated.parallel([
                Animated.timing(animHeight, { toValue: 0, duration: 200, useNativeDriver: false }),
                Animated.timing(animOpacity, { toValue: 0, duration: 180, useNativeDriver: false }),
                Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
            ]).start(() => setOpen(false));
        } else {
            setOpen(true);
            Animated.parallel([
                Animated.timing(animHeight, { toValue: DAY_OPTIONS.length * 52, duration: 250, useNativeDriver: false }),
                Animated.timing(animOpacity, { toValue: 1, duration: 220, useNativeDriver: false }),
                Animated.timing(rotateAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
            ]).start();
        }
    };

    const handleSelect = (val) => {
        Animated.parallel([
            Animated.timing(animHeight, { toValue: 0, duration: 200, useNativeDriver: false }),
            Animated.timing(animOpacity, { toValue: 0, duration: 180, useNativeDriver: false }),
            Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
        ]).start(() => {
            setOpen(false);
            onSelect(val);
        });
    };

    const rotateInterp = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

    return (
        <View style={dd.wrapper}>
            <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={dd.trigger}>
                <View style={dd.iconCircle}>
                    <Icon name={selectedOption.icon} size={18} color="#518276" />
                </View>
                <View style={dd.triggerTextWrap}>
                    <Text style={dd.triggerLabel}>Duration</Text>
                    <Text style={dd.triggerValue}>{selectedOption.label}</Text>
                </View>
                <Animated.View style={{ transform: [{ rotate: rotateInterp }] }}>
                    <Icon name="chevron-down" size={22} color="#518276" />
                </Animated.View>
            </TouchableOpacity>

            {open && (
                <Animated.View style={[dd.dropdown, { maxHeight: animHeight, opacity: animOpacity }]}>
                    {DAY_OPTIONS.map((opt, i) => (
                        <TouchableOpacity
                            key={opt.value}
                            onPress={() => handleSelect(opt.value)}
                            activeOpacity={0.75}
                            style={[
                                dd.option,
                                opt.value === selected && dd.optionActive,
                                i === DAY_OPTIONS.length - 1 && { borderBottomWidth: 0 },
                            ]}
                        >
                            <Icon
                                name={opt.icon}
                                size={16}
                                color={opt.value === selected ? '#518276' : '#94A3B8'}
                                style={{ marginRight: 10 }}
                            />
                            <Text style={[dd.optionText, opt.value === selected && dd.optionTextActive]}>
                                {opt.label}
                            </Text>
                            {opt.value === selected && (
                                <Icon name="check-circle" size={18} color="#518276" style={{ marginLeft: 'auto' }} />
                            )}
                        </TouchableOpacity>
                    ))}
                </Animated.View>
            )}
        </View>
    );
};

const dd = StyleSheet.create({
    wrapper: { zIndex: 100 },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        elevation: 4,
        shadowColor: '#518276',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        borderWidth: 1.5,
        borderColor: 'rgba(81,130,118,0.15)',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(81,130,118,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    triggerTextWrap: { flex: 1 },
    triggerLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' },
    triggerValue: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginTop: 1 },
    dropdown: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginTop: 6,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(81,130,118,0.12)',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    optionActive: { backgroundColor: 'rgba(81,130,118,0.06)' },
    optionText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    optionTextActive: { color: '#518276', fontWeight: '800' },
});

// ── Row Card Component ────────────────────────────────────────────────────────
const RecordCard = ({ record, index, days, token, navigation, onPreview }) => {
    const [downloading, setDownloading] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;


    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
        ]).start();
    }, []);

    const patientName = record.patient_name || record.app_user_name || 'Unknown';
    const email = record.app_user_email || ' ';


    let formattedDate = 'N/A';
    if (record.created_at) {
        const d = new Date(record.created_at);
        formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const totalDays = record.total_days || 0;
    const id = record.id || index + 1;

    const handlePreview = async () => {
        setPreviewing(true);
        try {
            const downloadUrl = `${ENDPOINTS.DOWNLOAD_SYNCED_PDF}?report_id=${record.id}&days=${days}`;
            const fileName = `AirSine_Report_Preview_${record.id}.pdf`;
            const tempPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

            const res = await RNFS.downloadFile({
                fromUrl: downloadUrl,
                toFile: tempPath,
                headers: { Authorization: `Bearer ${token}` },
            }).promise;

            if (res.statusCode === 200) {
                const base64Data = await RNFS.readFile(tempPath, 'base64');
                const htmlContent = getPdfJsHtml(base64Data);
                onPreview(htmlContent, `Preview: ${patientName}`);
            } else {
                Alert.alert('Preview Failed', `Server returned status ${res.statusCode}`);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not load the preview.');
        } finally {
            setPreviewing(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const downloadUrl = `${ENDPOINTS.DOWNLOAD_SYNCED_PDF}?report_id=${record.id}&days=${days}`;
            const fileName = `AirSine_Report_${record.id}_${Date.now()}.pdf`;
            const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

            const res = await RNFS.downloadFile({
                fromUrl: downloadUrl,
                toFile: downloadPath,
                headers: { Authorization: `Bearer ${token}` },
            }).promise;

            if (res.statusCode === 200) {
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
                            },
                        },
                    ],
                );
            } else {
                Alert.alert('Download Failed', `Server returned status ${res.statusCode}`);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not download the report.');
        } finally {
            setDownloading(false);
        }
    };

    // Avatar initials
    const initials = patientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const avatarColors = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
    const avatarColor = avatarColors[id % avatarColors.length];

    return (
        <Animated.View style={[rc.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Left accent bar */}
            <View style={[rc.accentBar, { backgroundColor: avatarColor }]} />

            {/* Avatar */}
            <View style={[rc.avatar, { backgroundColor: avatarColor + '18' }]}>
                <Text style={[rc.avatarText, { color: avatarColor }]}>{initials}</Text>
            </View>

            {/* Info */}
            <View style={rc.info}>
                <Text style={rc.name} numberOfLines={1}>{patientName}</Text>
                {/* <Text style={rc.email} numberOfLines={1}></Text> */}
                <View style={rc.metaRow}>
                    <View style={rc.badge}>
                        <Icon name="calendar-outline" size={11} color="#518276" />
                        <Text style={rc.badgeText}>{formattedDate}</Text>
                    </View>
                </View>
            </View>

            {/* Top Right logs badge */}
            <View style={[rc.badge, { backgroundColor: '#EFF6FF', position: 'absolute', top: 4, right: 12 }]}>
                <Icon name="database-outline" size={11} color="#3B82F6" />
                <Text style={[rc.badgeText, { color: '#3B82F6' }]}>{totalDays} logs</Text>
            </View>

            {/* Action Buttons */}
            <View style={rc.btnGroup}>
                {/* Preview Button */}
                <TouchableOpacity
                    onPress={handlePreview}
                    activeOpacity={0.8}
                    disabled={previewing}
                    style={[rc.actionBtn, rc.previewBtn]}
                >
                    {previewing ? (
                        <ActivityIndicator size="small" color="#518276" />
                    ) : (
                        <Icon name="eye-outline" size={15} color="#518276" />
                    )}
                </TouchableOpacity>

                {/* Download Button */}
                <TouchableOpacity
                    onPress={handleDownload}
                    activeOpacity={0.8}
                    disabled={downloading}
                    style={[rc.actionBtn, rc.dlBtn, downloading && rc.dlBtnLoading]}
                >
                    {downloading ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Icon name="download" size={15} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const rc = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        overflow: 'hidden',
        paddingRight: 14,
    },
    accentBar: {
        width: 4,
        height: '100%',
        borderTopLeftRadius: 18,
        borderBottomLeftRadius: 18,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
        marginVertical: 14,
    },
    avatarText: { fontSize: 16, fontWeight: '900' },
    info: { flex: 1, marginLeft: 12, paddingVertical: 14 },
    name: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginBottom: 2 },
    email: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginBottom: 6 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap' },
    badge: {
        flexDirection: 'row',

        alignItems: 'center',
        backgroundColor: 'rgba(81,130,118,0.08)',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
    },
    badgeText: { fontSize: 10, fontWeight: '700', color: '#518276', marginLeft: 3 },
    btnGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 8,
        alignSelf: 'flex-end',
        marginBottom: 12,
    },
    actionBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewBtn: {
        backgroundColor: 'rgba(81,130,118,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(81,130,118,0.2)',
    },
    dlBtn: {
        backgroundColor: '#518276',
    },
    dlBtnLoading: { backgroundColor: '#94A3B8' },
    dlText: { fontSize: 10, fontWeight: '900', color: '#FFF', marginLeft: 3, letterSpacing: 0.3 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────

const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
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
                    text: `📄 ${fileName}\nSaved to Downloads folder. Tap to open.`,
                },
            },
        });
    } catch (error) {
        console.error('Notification Error:', error);
    }
};

const DownloadPdfScreen = ({ navigation }) => {
    const { token } = useData();
    const [loading, setLoading] = useState(false);
    const [days, setDays] = useState(7);
    const [records, setRecords] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const headerOpacity = useRef(new Animated.Value(0)).current;

    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewTitle, setPreviewTitle] = useState('Report Preview');

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
        return unsubscribe;
    }, []);

    useEffect(() => {
        Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const response = await fetch(ENDPOINTS.SYNCED_PDF_HISTORY, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setRecords(Array.isArray(data) ? data : []);
            } else {
                setRecords([]);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Network Error', 'Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [refreshKey]);

    const handleRefresh = () => setRefreshKey(k => k + 1);

    const filteredRecords = records.filter(r => {
        if (!r.created_at) return true;
        const diff = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return diff <= days;
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#3A6359" />

            {/* ── Header ── */}
            <LinearGradient
                colors={['#518276', '#3A6359', '#2D5049']}
                style={styles.headerGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView edges={['top']}>
                    <Animated.View style={[styles.headerRow, { opacity: headerOpacity }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Icon name="arrow-left" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle}>Download PDF</Text>
                            <Text style={styles.headerSub}>Patient therapy reports</Text>
                        </View>
                        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
                            <Icon name="refresh" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Stats strip */}
                    <View style={styles.statsStrip}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNum}>{records.length}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNum}>{filteredRecords.length}</Text>
                            <Text style={styles.statLabel}>Filtered</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNum}>{days}d</Text>
                            <Text style={styles.statLabel}>Range</Text>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* ── Body ── */}
            <View style={styles.body}>
                {/* Dropdown */}
                <View style={styles.dropdownSection}>
                    <ModernDropdown selected={days} onSelect={setDays} />
                </View>

                {/* Section title */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Patient Records</Text>
                    {!loading && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countBadgeText}>{filteredRecords.length}</Text>
                        </View>
                    )}
                </View>

                {/* List */}
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#518276" />
                        <Text style={styles.loadingText}>Fetching records…</Text>
                    </View>
                ) : filteredRecords.length === 0 ? (
                    <View style={styles.centered}>
                        <View style={styles.emptyIconWrap}>
                            <Icon name="folder-open-outline" size={52} color="#CBD5E1" />
                        </View>
                        <Text style={styles.emptyTitle}>No Records Found</Text>
                        <Text style={styles.emptySubtitle}>No synced data for the selected duration.</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
                            <Icon name="refresh" size={16} color="#518276" />
                            <Text style={styles.retryText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 30 }}
                    >
                        {filteredRecords.map((record, idx) => (
                            <RecordCard
                                key={record.id || idx}
                                record={record}
                                index={idx}
                                days={days}
                                token={token}
                                navigation={navigation}
                                onPreview={(htmlContent, title) => {
                                    setPreviewHtml(htmlContent);
                                    setPreviewTitle(title);
                                    setPreviewVisible(true);
                                }}
                            />
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* ── PDF Preview Modal ── */}
            <Modal
                visible={previewVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setPreviewVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => setPreviewVisible(false)}
                            style={styles.closeBtn}
                        >
                            <Icon name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle} numberOfLines={1}>
                            {previewTitle}
                        </Text>
                        <View style={{ width: 44 }} />
                    </View>

                    {previewHtml ? (
                        <WebView
                            originWhitelist={['*']}
                            source={{ html: previewHtml }}
                            style={styles.webview}
                            startInLoadingState={true}
                            renderLoading={() => (
                                <View style={styles.modalLoader}>
                                    <ActivityIndicator size="large" color="#518276" />
                                </View>
                            )}
                        />
                    ) : (
                        <View style={styles.modalLoader}>
                            <ActivityIndicator size="large" color="#518276" />
                        </View>
                    )}
                </SafeAreaView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F8' },

    // Header
    headerGrad: {
        paddingBottom: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        elevation: 12,
        shadowColor: '#3A6359',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 14 : 6,
        paddingBottom: 14,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerCenter: { flex: 1, marginHorizontal: 14 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 0.3 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: 1 },
    refreshBtn: {
        width: 40, height: 40, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    statsStrip: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.12)',
        marginHorizontal: 20,
        borderRadius: 14,
        paddingVertical: 10,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: '900', color: '#FFF' },
    statLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.65)', marginTop: 1, letterSpacing: 0.5 },
    statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

    // Body
    body: { flex: 1, paddingHorizontal: 16, paddingTop: 18 },
    dropdownSection: { marginBottom: 20, zIndex: 100 },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center',
        marginBottom: 12, marginLeft: 2,
    },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8 },
    countBadge: {
        backgroundColor: '#518276', borderRadius: 20,
        paddingHorizontal: 9, paddingVertical: 2, marginLeft: 8,
    },
    countBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },

    // States
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 60 },
    loadingText: { marginTop: 14, fontSize: 15, color: '#94A3B8', fontWeight: '600' },
    emptyIconWrap: {
        width: 96, height: 96, borderRadius: 28,
        backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center',
        elevation: 2, marginBottom: 16,
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#334155', marginBottom: 6 },
    emptySubtitle: { fontSize: 13, color: '#94A3B8', fontWeight: '500', textAlign: 'center', paddingHorizontal: 30 },
    retryBtn: {
        flexDirection: 'row', alignItems: 'center',
        marginTop: 20, backgroundColor: 'rgba(81,130,118,0.1)',
        borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
        borderWidth: 1, borderColor: 'rgba(81,130,118,0.2)',
    },
    retryText: { marginLeft: 6, fontSize: 14, fontWeight: '700', color: '#518276' },

    // Modal Preview Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#3A6359',
        paddingHorizontal: 16,
        height: 60,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 12,
    },
    webview: {
        flex: 1,
        backgroundColor: '#F1F5F9',
    },
    modalLoader: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
});

export default DownloadPdfScreen;
