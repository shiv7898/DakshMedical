import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Platform,
    LayoutAnimation,
    RefreshControl,
    UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SummaryCard from '../components/SummaryCard';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial staggered entry animation effect
        setTimeout(() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setLoading(false);
        }, 500);
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Dynamic Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>CPAP Therapy Dashboard</Text>
                    <Text style={styles.doctorName}>Good Morning, Shiv</Text>
                </View>
                <TouchableOpacity style={styles.refreshButton}>
                    <Icon name="more-vert" size={24} color="#1A1C1E" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066FF" />}
            >
                {/* Live Status Badge */}
                {!loading && (
                    <View style={styles.statusSection}>
                        <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
                            <View style={[styles.indicator, { backgroundColor: '#4CAF50' }]} />
                            <Text style={[styles.statusText, { color: '#2E7D32' }]}>Therapy Active</Text>
                        </View>
                        <View style={styles.liveBadge}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.liveText}>LIVE DATA</Text>
                        </View>
                    </View>
                )}

                {/* 2x2 Grid Summary Cards */}
                <View style={styles.grid}>
                    <SummaryCard
                        title="AHI"
                        value="2.3"
                        unit="Events per hour"
                        status="Normal"
                        icon="air"
                        color="#0066FF"
                    />
                    <SummaryCard
                        title="Usage Time"
                        value="7h 45m"
                        unit="Compliance: 92%"
                        icon="access-time"
                        color="#009688"
                    >
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: refreshing ? '40%' : '92%', backgroundColor: '#009688' }]} />
                        </View>
                    </SummaryCard>
                    <SummaryCard
                        title="Pressure"
                        value="10.5"
                        unit="cmH2O (Auto)"
                        icon="compress"
                        color="#9C27B0"
                    >
                        <View style={styles.sparkline}>
                            {[20, 45, 30, 65, 40, 50, 45].map((h, i) => (
                                <View key={i} style={[styles.bar, { height: h * 0.4, backgroundColor: '#9C27B050' }]} />
                            ))}
                        </View>
                    </SummaryCard>
                    <SummaryCard
                        title="Mask Seal"
                        value="98%"
                        unit="Excellent Quality"
                        icon="verified-user"
                        color="#FF9800"
                    />
                </View>

                {/* Weekly Overview Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Weekly Overview</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewMore}>Analysis {'>'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.overviewCard}>
                    <View style={styles.scoreHeader}>
                        <View style={styles.scoreCircle}>
                            <Text style={styles.scoreValue}>88</Text>
                            <Text style={styles.scoreLabel}>Score</Text>
                        </View>
                        <View style={styles.scoreContent}>
                            <Text style={styles.scoreTitle}>Great Sleep Quality</Text>
                            <Text style={styles.scoreSubtitle}>Your condition is stable. Therapy has improved your breathing by 15% this week.</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statsRow}>
                        <MiniStat label="Avg Time" value="48.5h" />
                        <MiniStat label="Avg Leaks" value="12 L/m" />
                        <MiniStat label="Best Score" value="94/100" />
                    </View>
                </View>

                {/* Reports Section Chart Placeholder */}
                <View style={styles.chartPlaceholder}>
                    <View style={styles.chartTitleRow}>
                        <Text style={styles.chartTitle}>Usage Trend (7 Days)</Text>
                        <Icon name="query-stats" size={18} color="#ACB8C4" />
                    </View>
                    <View style={styles.chartContainer}>
                        {[60, 80, 45, 90, 70, 85, 95].map((h, i) => (
                            <View key={i} style={styles.barColumn}>
                                <View style={[styles.chartBar, { height: h, backgroundColor: i === 6 ? '#0066FF' : '#F0F2F5' }]} />
                                <Text style={styles.barLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Alerts Section */}
                <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 15 }]}>Recent Alerts</Text>

                <AlertCard
                    icon="error-outline"
                    title="High Leak Detected"
                    time="2:14 AM"
                    color="#EF5350"
                />
                <AlertCard
                    icon="warning"
                    title="Therapy Interrupted"
                    time="3:05 AM"
                    color="#FF9800"
                />

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const MiniStat = ({ label, value }) => (
    <View style={styles.miniStat}>
        <Text style={styles.miniLabel}>{label}</Text>
        <Text style={styles.miniValue}>{value}</Text>
    </View>
);

const AlertCard = ({ icon, title, time, color }) => (
    <TouchableOpacity style={styles.alertCard}>
        <View style={[styles.alertIcon, { backgroundColor: `${color}15` }]}>
            <Icon name={icon} size={20} color={color} />
        </View>
        <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>{title}</Text>
            <Text style={styles.alertTime}>{time}</Text>
        </View>
        <Icon name="chevron-right" size={24} color="#ACB8C4" />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
    },
    headerTitle: {
        fontSize: 14,
        color: '#7B8D9E',
        fontWeight: '500',
    },
    doctorName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A1C1E',
        marginTop: 2,
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F0F2F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    statusSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1C1E',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    pulseDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#EF5350',
        marginRight: 4,
    },
    liveText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#F0F2F5',
        borderRadius: 2,
        marginTop: 12,
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
    },
    sparkline: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 30,
        marginTop: 10,
    },
    bar: {
        width: 4,
        borderRadius: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1C1E',
    },
    viewMore: {
        fontSize: 14,
        color: '#0066FF',
        fontWeight: '600',
    },
    overviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        marginBottom: 20,
    },
    scoreHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scoreCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#0066FF',
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0066FF',
    },
    scoreLabel: {
        fontSize: 8,
        color: '#0066FF',
        fontWeight: '700',
        marginTop: -2,
    },
    scoreContent: {
        flex: 1,
        marginLeft: 15,
    },
    scoreTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1A1C1E',
    },
    scoreSubtitle: {
        fontSize: 11,
        color: '#7B8D9E',
        marginTop: 2,
        lineHeight: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F2F5',
        marginVertical: 15,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    miniStat: {
        alignItems: 'center',
    },
    miniLabel: {
        fontSize: 10,
        color: '#7B8D9E',
        fontWeight: '600',
    },
    miniValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1A1C1E',
        marginTop: 2,
    },
    chartPlaceholder: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 25,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    chartTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1C1E',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
        paddingHorizontal: 10,
    },
    barColumn: {
        alignItems: 'center',
    },
    chartBar: {
        width: 6,
        borderRadius: 3,
    },
    barLabel: {
        fontSize: 10,
        color: '#ACB8C4',
        marginTop: 10,
        fontWeight: '600',
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
    },
    alertIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertInfo: {
        flex: 1,
        marginLeft: 15,
    },
    alertTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1C1E',
    },
    alertTime: {
        fontSize: 12,
        color: '#7B8D9E',
        marginTop: 2,
    },
});

export default HomeScreen;
