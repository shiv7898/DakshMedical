import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Platform,
    StatusBar,
    Image,
} from 'react-native';
import { Colors, Spacing, Typography } from '../styles/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { getLogs } from '../api/database';
import { useData } from '../context/DataContext';

const HistoryScreen = () => {
    const [logs, setLogs] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const { selectedRange } = useData();

    const fetchLogs = React.useCallback(async () => {
        const data = await getLogs();
        // Slice logs based on the global selectedRange
        setLogs(data.slice(0, selectedRange));
        console.log("selectedRange", selectedRange);
    }, [selectedRange]);

    useFocusEffect(
        React.useCallback(() => {
            fetchLogs();
        }, [fetchLogs])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchLogs().then(() => setRefreshing(false));
    };

    // const handleDelete = (id) => {
    //     Alert.alert('Delete Log', 'Are you sure you want to remove this therapy record?', [
    //         { text: 'Cancel', style: 'cancel' },
    //         {
    //             text: 'Delete', style: 'destructive', onPress: () => {
    //                 setLogs(logs.filter(l => l.id !== id));
    //             }
    //         }
    //     ]);
    // };

    const MetricItem = ({ label, value, unit, color }) => (
        <View style={styles.miniMetric}>
            <Text style={styles.miniLabel}>{label}</Text>
            <View style={styles.miniValueRow}>
                <Text style={[styles.miniValue, { color: color || Colors.text }]}>{value}</Text>
                <Text style={styles.miniUnit}>{unit}</Text>
            </View>
        </View>
    );

    const formatHoursToHHMM = (decimalHours) => {
        const val = parseFloat(decimalHours);
        if (isNaN(val)) return '00:00';
        // Handle rounding edge case (e.g. 1.999 * 60 = 120 mins)
        const totalMinutes = Math.round(val * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const renderItem = ({ item }) => {
        const isCompliant = parseFloat(item.usage_hours) >= 4;
        const statusColor = isCompliant ? Colors.success : Colors.error;
        const accentColor = isCompliant ? '#10B981' : '#EF4444';

        return (
            <View style={styles.logCard}>
                {/* Left Accent Bar */}
                <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

                {/* Background Wave Watermark */}
                {/* <Image
                    source={require('../assets/img/heart_wave.png')}
                    style={styles.cardBgWave}
                    resizeMode="contain"
                /> */}

                <View style={styles.cardHeader}>
                    <View style={styles.dateInfo}>
                        <View style={[styles.dateIconCircle, { backgroundColor: isCompliant ? '#F0FDF4' : '#FEF2F2' }]}>
                            <Icon name="calendar-month" size={16} color={accentColor} />
                        </View>
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.logDateStr}>{item.date}</Text>
                            <Text style={styles.therapyTypeLabel}>{item.therapy_type} Therapy</Text>
                        </View>
                    </View>
                    <View style={[styles.machineBadge, { backgroundColor: '#F8FAFC' }]}>
                        <Text style={styles.machineText}>{item.machine_type}</Text>
                    </View>
                </View>

                <View style={styles.mainContent}>
                    <View style={[styles.usageCircle, { borderColor: accentColor }]}>
                        <Text style={[styles.usageMain, { color: accentColor }]}>{formatHoursToHHMM(item.usage_hours)}</Text>
                        <Text style={styles.usageSub}>HOURS</Text>
                    </View>

                    <View style={styles.metricsWrapper}>
                        <View style={styles.metricsRow}>
                            <MetricItem label="AHI Index" value={item.ahi} unit="/h" color={parseFloat(item.ahi) > 5 ? Colors.error : Colors.primary} />
                            <MetricItem label="Leak Rate" value={item.leak_rate} unit="L/m" color="#d97706" />
                        </View>
                        <View style={styles.metricsRow}>
                            <MetricItem label="Avg Press" value={item.pressure_avg} unit="cm" color={Colors.text} />
                            <MetricItem label="Resp Rate" value={item.avg_resp_rate || '--'} unit="/m" color={Colors.text} />
                        </View>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={[styles.footerStatusBadge, { backgroundColor: isCompliant ? '#ECFDF5' : '#FFF1F2' }]}>
                        <Icon
                            name={isCompliant ? "shield-check" : "alert-rhombus"}
                            size={12}
                            color={accentColor}
                        />
                        <Text style={[styles.statusTxt, { color: accentColor }]}>
                            {isCompliant ? "COMPLIANCE MET" : "BELOW TARGET"}
                        </Text>
                    </View>
                    {/* <View style={styles.footerDetailRow}>
                        <Text style={styles.footerDetailText}>P: ${item.pressure_min}-${item.pressure_max}</Text>
                    </View> */}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Therapy Logs</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                    <Icon name="refresh" size={22} color="#FFF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={logs}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Icon name="clipboard-text-outline" size={60} color="#E1E8EE" />
                        <Text style={styles.emptyText}>No clinical logs available</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
        marginLeft: 12,
    },
    refreshBtn: {
        padding: 5,
    },
    listContent: {
        padding: Spacing.m,
        paddingBottom: 40,
    },
    logCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        paddingLeft: 22, // space for accent bar
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 6,
        shadowColor: 'rgba(0, 0, 0, 0.08)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
        position: 'relative',
        overflow: 'hidden',
    },
    accentBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 6,
    },
    cardBgWave: {
        position: 'absolute',
        right: -20,
        bottom: 20,
        width: 250,
        height: 120,
        opacity: 0.1,
        tintColor: Colors.primary,
    },
    cardHeader: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingBottom: 10,
    },
    dateInfo: {

        flexDirection: 'row',
        alignItems: 'center',
    },
    dateIconCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logDateStr: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
    },
    therapyTypeLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        marginTop: 1,
    },
    machineBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    machineText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.primary,
        textTransform: 'uppercase',
    },
    mainContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    usageCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FDFDFD',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    usageMain: {
        fontSize: 20,
        fontWeight: '900',
    },
    usageSub: {
        fontSize: 7,
        fontWeight: '900',
        color: '#94A3B8',
        marginTop: -1,
    },
    metricsWrapper: {
        flex: 1,
        marginLeft: 20,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    miniMetric: {
        flex: 1,
    },
    miniLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    miniValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 2,
    },
    miniValue: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    miniUnit: {
        fontSize: 9,
        color: Colors.textSecondary,
        marginLeft: 2,
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e2e8eeff',
    },
    footerStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 5,
    },
    statusTxt: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    footerDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerDetailText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
    },
    empty: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    }
});

export default HistoryScreen;
