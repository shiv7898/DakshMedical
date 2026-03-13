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
} from 'react-native';
import { Colors, Spacing, Typography } from '../styles/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { getLogs, getPatientInfo } from '../api/database';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.m * 3) / 2;

const DashboardScreen = ({ navigation }) => {
    const [logs, setLogs] = useState([]);
    const [patient, setPatient] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

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

    const getSummaryMetrics = () => {
        if (logs.length === 0) return null;
        const avgUsage = (logs.reduce((acc, curr) => acc + curr.usage_hours, 0) / logs.length).toFixed(1);
        const avgAHI = (logs.reduce((acc, curr) => acc + curr.ahi, 0) / logs.length).toFixed(1);
        const compliance = (logs.filter(l => l.usage_hours >= 4).length / logs.length * 100).toFixed(0);
        const avgPressure = (logs.reduce((acc, curr) => acc + curr.pressure_avg, 0) / logs.length).toFixed(1);
        const avgLeak = (logs.reduce((acc, curr) => acc + curr.leak_rate, 0) / logs.length).toFixed(1);
        const p95 = (logs.reduce((acc, curr) => acc + (curr.pressure_95th || 0), 0) / logs.length).toFixed(1);

        return { avgUsage, avgAHI, compliance, avgPressure, avgLeak, p95 };
    };

    const metrics = getSummaryMetrics();
    console.log('Metrics:', metrics);

    const SummaryCard = ({ title, value, unit, icon, color, subtitle, trend }) => (
        <View style={styles.modernCard}>
            <View style={styles.cardTop}>
                <View style={[styles.modernIconCircle, { backgroundColor: color + '10' }]}>
                    <Icon name={icon} size={20} color={color} />
                </View>
                {trend && (
                    <View style={styles.trendBadge}>
                        <Icon name="trending-up" size={10} color={Colors.success} />
                    </View>
                )}
            </View>
            <Text style={styles.modernLabel}>{title}</Text>
            <View style={styles.modernValueRow}>
                <Text style={styles.modernValue}>{value}</Text>
                <Text style={styles.modernUnit}>{unit}</Text>
            </View>
            <View style={styles.modernDivider} />
            <Text style={styles.modernSub}>{subtitle}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Elegant Header - More Compact */}
            <View style={styles.brandHeader}>
                <View>
                    <Text style={styles.brandGreeting}>Patient Dashboard</Text>
                    <Text style={styles.brandName}>{patient?.name}</Text>
                </View>
                <TouchableOpacity
                    style={styles.profileBtn}
                    onPress={() => navigation.navigate('Reports')}
                >
                    <Icon name="file-chart-outline" size={24} color={Colors.primary} />
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
                    <Text style={styles.dateRange}>{logs.length > 7 ? '7 Days' : `${logs.length} Days`}</Text>
                </View>

                {metrics ? (
                    <>
                        {/* Latest Session Highlight */}
                        <View style={styles.latestHighlight}>
                            <View style={styles.latestInfo}>
                                <Text style={styles.latestLabel}>LAST TREATMENT</Text>
                                <Text style={styles.latestValue}>{logs[0]?.date}</Text>
                            </View>
                            <View style={styles.latestScore}>
                                <Text style={styles.latestScoreVal}>{logs[0]?.ahi}</Text>
                                <Text style={styles.latestScoreLbl}>AHI</Text>
                            </View>
                        </View>

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
                                title="95th Pressure"
                                value={metrics.p95}
                                unit="cm"
                                icon="gauge"
                                color="#7E57C2"
                                subtitle="P95 Peak"
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

                {logs.slice(0, 2).map((log, index) => (
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
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
        paddingBottom: 10,
        backgroundColor: '#FFF',
    },
    brandGreeting: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    brandName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 0,
    },
    profileBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F7FF',
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
        backgroundColor: '#F0F7FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    modernMetricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    modernCard: {
        backgroundColor: '#FFF',
        width: CARD_WIDTH,
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1.2,
        borderColor: '#F1F5F9',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modernIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modernLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    modernValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 2,
    },
    modernValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    modernUnit: {
        fontSize: 10,
        marginLeft: 3,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    modernDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 6,
    },
    modernSub: {
        fontSize: 8,
        fontWeight: '800',
        color: Colors.primary,
        textTransform: 'uppercase',
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
        color: '#E3F2FD',
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
        backgroundColor: '#F0F7FF',
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
        backgroundColor: '#F8FBFF',
        borderRadius: 16,
        padding: 25,
        alignItems: 'center',
        borderStyle: 'dashed',
        borderWidth: 1.5,
        borderColor: '#D1E3F8',
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
