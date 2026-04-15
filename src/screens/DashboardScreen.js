import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    RefreshControl,
    Dimensions,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    StatusBar,
    Modal,
    Animated,
    TouchableWithoutFeedback,
    Image,
} from 'react-native';
import { Colors, Spacing, Typography } from '../styles/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { getLogs, getPatientInfo } from '../api/database';
import { useData } from '../context/DataContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.m * 3) / 2;

const DashboardScreen = ({ navigation }) => {
    const [logs, setLogs] = useState([]);
    const [patient, setPatient] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const { selectedRange, setSelectedRange } = useData();
    const [isRangeModalVisible, setIsRangeModalVisible] = useState(false);
    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: '', sub: '', icon: 'database-off', color: '#EF4444' });
    const [fadeAnim] = useState(new Animated.Value(0));

    const fetchData = async () => {
        try {
            console.log('Fetching Dashboard Data...');
            const logData = await getLogs();
            const patientData = await getPatientInfo();
            setLogs(logData);
            setPatient(patientData || {});
        } catch (error) {
            console.error(error);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData().then(() => setRefreshing(false));
    }, []);

    const getSummaryMetrics = (data) => {
        if (!data || data.length === 0) return null;
        const avgUsage = (data.reduce((acc, curr) => acc + curr.usage_hours, 0) / data.length).toFixed(1);
        const avgAHI = (data.reduce((acc, curr) => acc + curr.ahi, 0) / data.length).toFixed(1);
        const compliance = (data.filter(l => l.usage_hours >= 4).length / data.length * 100).toFixed(0);
        const avgPressure = (data.reduce((acc, curr) => acc + curr.pressure_avg, 0) / data.length).toFixed(1);

        // Filter out extreme leak days (>200) from the average
        const validLeakLogs = data.filter(l => (l.leak_rate || 0) < 200);
        const avgLeak = validLeakLogs.length > 0
            ? (validLeakLogs.reduce((acc, curr) => acc + curr.leak_rate, 0) / validLeakLogs.length).toFixed(1)
            : '0.0';

        return { avgUsage, avgAHI, compliance, avgPressure, avgLeak };
    };

    const filteredLogs = logs.slice(0, selectedRange);
    const metrics = getSummaryMetrics(filteredLogs);

    const handleRangeSelect = (days) => {
        setIsRangeModalVisible(false);
        const actualCount = logs.length;

        if (actualCount === 0) {
            setModalConfig({
                title: 'No Data Found',
                sub: "We couldn't find any therapy records in our database.",
                icon: 'database-off',
                color: '#EF4444'
            });
            showPopup();
            return;
        }

        if (actualCount < days) {
            setModalConfig({
                title: 'Partial Data Sync',
                sub: `You requested ${days} days, but only ${actualCount} days of treatment records are available.`,
                icon: 'information-variant',
                color: Colors.primary
            });
            showPopup();
        }

        setSelectedRange(days);
    };

    const showPopup = () => {
        setIsInfoModalVisible(true);
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(fadeAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();

        setTimeout(() => {
            hidePopup();
        }, 3000);
    };

    const hidePopup = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setIsInfoModalVisible(false));
    };

    const rangeOptions = [
        { label: '7 Days', value: 7, icon: 'calendar-7' },
        { label: '1 Month', value: 30, icon: 'calendar-month' },
        { label: '6 Months', value: 180, icon: 'calendar-range' },
        { label: '1 Year', value: 365, icon: 'calendar-star' },
    ];
    console.log('Metrics:', metrics);

    const SummaryCard = ({ title, value, unit, icon, color, subtitle, trend }) => (
        <View style={styles.modernCard}>
            {/* Modern Abstract Ambient Background */}
            <View style={[styles.bgShapeLarge, { backgroundColor: color }]} />
            <View style={[styles.bgShapeSmall, { backgroundColor: color }]} />
            <Image
                source={{ uri: 'https://www.transparenttextures.com/patterns/diagonal-striped-brick.png' }}
                style={styles.cardBgTexture}
                resizeMode="repeat"
            />

            <View style={styles.cardTop}>
                <View style={styles.cardTitleArea}>
                    <Text style={styles.modernLabel}>{title}</Text>
                    <Text style={styles.modernSub}>{subtitle}</Text>
                </View>
                <View style={[styles.modernIconCircle, { backgroundColor: color + '15' }]}>
                    <Icon name={icon} size={22} color={color} />
                </View>
            </View>

            <View style={styles.cardBottom}>
                <View style={styles.modernValueRow}>
                    <Text style={[styles.modernValue, { color: color }]}>{value}</Text>
                    <Text style={styles.modernUnit}>{unit}</Text>
                </View>
                {trend && (
                    <View style={styles.trendBadge}>
                        <Icon name="trending-up" size={14} color={Colors.success} />
                    </View>
                )}
            </View>
            <View style={[styles.accentLine, { backgroundColor: color }]} />
        </View>
    );

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            {/* Elegant Header - Theme Matched */}
            <View style={styles.brandHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                        width: 45,
                        height: 45,
                        marginRight: 15,
                        borderRadius: 22.5,
                        backgroundColor: '#f5f5f5ff',
                        justifyContent: 'center',
                        alignItems: 'center',
                        elevation: 2, // Slight depth
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                    }}>
                        <Image
                            source={require('../assets/img/logo1.png')}
                            style={{ width: 30, height: 30 }}
                            resizeMode="contain"
                        />
                    </View>
                    <View>
                        <Text style={styles.brandGreeting}>Patient Dashboard</Text>
                        <Text style={styles.brandName}>{patient?.name || 'User'}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.profileBtn, { zIndex: 999 }]}
                    activeOpacity={0.7}
                    onPress={() => {
                        console.log('Opening Machine Settings...');
                        navigation.navigate('UpdateMachineSetting');
                    }}
                >
                    <Icon name="cog" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.modernSectionTitle}>Therapy Overview</Text>
                    <TouchableOpacity
                        style={styles.rangeSelector}
                        onPress={() => setIsRangeModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.dateRange}>
                            {selectedRange === 7 ? '7 Days' :
                                selectedRange === 30 ? '1 Month' :
                                    selectedRange === 180 ? '6 Months' : '1 Year'}
                        </Text>
                        <Icon name="chevron-down" size={14} color={Colors.primary} style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                </View>

                {metrics ? (
                    <>
                        {/* Latest Session Highlight */}
                        {/* <View style={styles.latestHighlight}>
                            <View style={styles.latestInfo}>
                                <Text style={styles.latestLabel}>LAST TREATMENT</Text>
                                <Text style={styles.latestValue}>{logs[0]?.date}</Text>
                            </View>
                            <View style={styles.latestScore}>
                                <Text style={styles.latestScoreVal}>{logs[0]?.ahi}</Text>
                                <Text style={styles.latestScoreLbl}>AHI</Text>
                            </View>
                        </View> */}

                        <View style={styles.modernMetricsGrid}>
                            <SummaryCard
                                title="Compliance"
                                value={metrics.compliance}
                                unit="%"
                                icon="shield-check"
                                color="#43A047"
                                subtitle="Adherence"
                                trend={parseFloat(metrics.compliance) >= 70}
                            />
                            <SummaryCard
                                title="Usage Time"
                                value={metrics.avgUsage}
                                unit="hrs"
                                icon="clock-fast"
                                color={Colors.primary}
                                subtitle="Average"
                            />
                            <SummaryCard
                                title="AHI Index"
                                value={metrics.avgAHI}
                                unit="/hr"
                                icon="heart-pulse"
                                color={parseFloat(metrics.avgAHI) > 5 ? Colors.error : Colors.primary}
                                subtitle="Index"
                            />

                            <SummaryCard
                                title="Avg Pressure"
                                value={metrics.avgPressure}
                                unit="cm"
                                icon="speedometer-slow"
                                color="#00ACC1"
                                subtitle="Mean"
                            />
                            <SummaryCard
                                title="Leak Rate"
                                value={metrics.avgLeak}
                                unit="L/m"
                                icon="air-filter"
                                color="#FB8C00"
                                subtitle="Seal"
                            />
                        </View>
                    </>
                ) : (
                    <View style={styles.emptyCard}>
                        <Icon name="database-import" size={40} color={Colors.accent} />
                        <Text style={styles.emptyText}>No clinical records</Text>
                    </View>
                )}

                <View style={styles.premiumBanner}>
                    <View style={styles.premiumContent}>
                        <View style={styles.premiumIcon}>
                            <Icon name="chart-areaspline" size={20} color="#FFF" />
                        </View>
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.premiumTitle}>Clinical Analytics</Text>
                            <Text style={styles.premiumSubText}>High-FID graphs & trends</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.premiumBtn}
                        onPress={() => navigation.navigate('Graphs')}
                    >
                        <Icon name="chevron-right" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.recentHeader}>
                    <Text style={styles.modernSectionTitle}>Recent Active</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Logs')}>
                        <Text style={styles.seeAll}>SEE ALL</Text>
                    </TouchableOpacity>
                </View>

                {logs.slice(0, 7).map((log, index) => (
                    <TouchableOpacity key={index} style={styles.activityItem} activeOpacity={0.7} onPress={() => navigation.navigate('Logs')}>
                        <View style={styles.activityIcon}>
                            <Icon name="calendar-blank" size={18} color={Colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.activityDate}>{log.date}</Text>
                            <Text style={styles.activitySub}>{log.usage_hours}h session</Text>
                        </View>
                        <View style={styles.activityScore}>
                            <Text style={styles.activityScoreVal}>{log.ahi}</Text>
                            <Text style={styles.activityScoreLbl}>AHI</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <TouchableOpacity
                style={styles.modernFab}
                onPress={() => navigation.navigate('MachineSelection')}
                activeOpacity={0.9}
            >
                <Icon name="plus" size={24} color="#FFF" />
            </TouchableOpacity>

            {/* Range Selection Modal */}
            <Modal
                visible={isRangeModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsRangeModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsRangeModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <Animated.View style={styles.rangeMenu}>
                            <Text style={styles.menuTitle}>Select Duration</Text>
                            {rangeOptions.map((opt, index) => {
                                // Enable logic: 
                                // 1. First option (7 Days) is always active
                                // 2. Others are active if logs exceed previous range's threshold
                                const prevThreshold = index > 0 ? rangeOptions[index - 1].value : 0;
                                const isAvailable = index === 0 || logs.length > prevThreshold;
                                const isDisabled = !isAvailable;

                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[
                                            styles.rangeOption,
                                            selectedRange === opt.value && styles.selectedOption,
                                            isDisabled && styles.disabledOption
                                        ]}
                                        onPress={() => !isDisabled && handleRangeSelect(opt.value)}
                                        disabled={isDisabled}
                                    >
                                        <Icon
                                            name={opt.icon}
                                            size={20}
                                            color={isDisabled ? '#CBD5E1' : (selectedRange === opt.value ? Colors.primary : '#64748B')}
                                        />
                                        <Text style={[
                                            styles.rangeOptionText,
                                            selectedRange === opt.value && styles.selectedOptionText,
                                            isDisabled && styles.disabledOptionText
                                        ]}>
                                            {opt.label}
                                            {isDisabled && <Text style={styles.insufficientText}> (Need {'>'}{prevThreshold} days)</Text>}
                                        </Text>
                                        {selectedRange === opt.value && (
                                            <Icon name="check-circle" size={18} color={Colors.primary} />
                                        )}
                                        {isDisabled && (
                                            <Icon name="lock" size={16} color="#CBD5E1" />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </Animated.View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Dynamic Info Popup */}
            <Modal
                visible={isInfoModalVisible}
                transparent={true}
                animationType="none"
            >
                <View style={styles.noDataOverlay}>
                    <Animated.View style={[
                        styles.noDataPopup,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { scale: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
                                { translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }
                            ]
                        }
                    ]}>
                        <View style={[styles.noDataIconBg, { backgroundColor: modalConfig.color + '15' }]}>
                            <Icon name={modalConfig.icon} size={32} color={modalConfig.color} />
                        </View>
                        <Text style={styles.noDataTitle}>{modalConfig.title}</Text>
                        <Text style={styles.noDataSub}>{modalConfig.sub}</Text>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    brandHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
        paddingBottom: 10,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : 20,
        backgroundColor: Colors.primary, // Deep Medical Green
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        elevation: 8,
    },
    brandGreeting: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.8)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    brandName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 0,
    },
    profileBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.m,
        paddingBottom: 80,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    modernSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    dateRange: {
        fontSize: 11,
        color: Colors.primary,
        fontWeight: '700',
    },
    rangeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F7FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0EEFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rangeMenu: {
        backgroundColor: '#FFF',
        width: width * 0.8,
        borderRadius: 24,
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 15,
        textAlign: 'center',
    },
    rangeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    selectedOption: {
        borderColor: Colors.primary + '30',
        backgroundColor: Colors.primary + '08',
    },
    rangeOptionText: {
        flex: 1,
        fontSize: 15,
        color: '#475569',
        fontWeight: '600',
        marginLeft: 12,
    },
    selectedOptionText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    disabledOption: {
        backgroundColor: '#F8FAFC',
        borderColor: '#F1F5F9',
        opacity: 0.6,
    },
    disabledOptionText: {
        color: '#94A3B8',
        fontWeight: 'normal',
    },
    insufficientText: {
        fontSize: 9,
        color: '#94A3B8',
        fontStyle: 'italic',
    },
    noDataOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noDataPopup: {
        backgroundColor: '#FFF',
        width: width * 0.75,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 20,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    noDataIconBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    noDataTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
    },
    noDataSub: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
    },
    modernMetricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    modernCard: {
        backgroundColor: '#FFF',
        width: CARD_WIDTH,
        borderRadius: 20,
        padding: 16,
        paddingBottom: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 4,
        shadowColor: '#94A3B8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        overflow: 'hidden',
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    cardTitleArea: {
        flex: 1,
        paddingRight: 8,
    },
    modernIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1, // Keep above background
    },
    bgShapeLarge: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 75,
        top: -40,
        right: -50,
        opacity: 0.04,
    },
    bgShapeSmall: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        bottom: -30,
        left: -20,
        opacity: 0.04,
    },
    cardBgTexture: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.10,
        tintColor: '#94A3B8',
    },
    trendBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    cardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: 6,
    },
    modernLabel: {
        fontSize: 12,
        color: '#475569',
        fontWeight: 'bold',
        marginBottom: 3,
    },
    modernSub: {
        fontSize: 9,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    modernValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    modernValue: {
        fontSize: 26,
        fontWeight: '900',
    },
    modernUnit: {
        fontSize: 11,
        marginLeft: 4,
        color: '#64748B',
        fontWeight: '600',
    },
    modernDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 6,
    },
    accentLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
    },
    premiumBanner: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 5,
        elevation: 6,
    },
    premiumContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    premiumIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },
    premiumSubText: {
        fontSize: 10,
        color: '#D1FAE5', // Light Green text
        marginTop: 0,
    },
    premiumBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 10,
    },
    seeAll: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    activityItem: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    activityIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.surface, // Green tint
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    activityDate: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.text,
    },
    activitySub: {
        fontSize: 10,
        color: Colors.textSecondary,
    },
    activityScore: {
        alignItems: 'center',
        paddingLeft: 10,
        borderLeftWidth: 1,
        borderLeftColor: '#F1F5F9',
    },
    activityScoreVal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    activityScoreLbl: {
        fontSize: 8,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    modernFab: {
        position: 'absolute',
        bottom: 20,
        right: 15,
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
    },
    emptyCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 25,
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    emptyText: {
        marginTop: 8,
        color: Colors.textSecondary,
        fontSize: 12,
    },
    latestHighlight: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    latestInfo: {
        flex: 1,
    },
    latestLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.textSecondary,
        letterSpacing: 1,
    },
    latestValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 4,
    },
    latestScore: {
        alignItems: 'center',
        backgroundColor: '#F0F7FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
    },
    latestScoreVal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    latestScoreLbl: {
        fontSize: 8,
        fontWeight: 'bold',
        color: Colors.textSecondary,
    },
});

export default DashboardScreen;
