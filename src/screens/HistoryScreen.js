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
} from 'react-native';
import { Colors, Spacing, Typography } from '../styles/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { getLogs } from '../api/database';

const HistoryScreen = () => {
    const [logs, setLogs] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLogs = async () => {
        const data = await getLogs();
        setLogs(data);
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchLogs();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchLogs().then(() => setRefreshing(false));
    };

    const handleDelete = (id) => {
        Alert.alert('Delete Log', 'Are you sure you want to remove this therapy record?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    setLogs(logs.filter(l => l.id !== id));
                }
            }
        ]);
    };

    const MetricItem = ({ label, value, unit, color }) => (
        <View style={styles.miniMetric}>
            <Text style={styles.miniLabel}>{label}</Text>
            <View style={styles.miniValueRow}>
                <Text style={[styles.miniValue, { color: color || Colors.text }]}>{value}</Text>
                <Text style={styles.miniUnit}>{unit}</Text>
            </View>
        </View>
    );

    const renderItem = ({ item }) => (
        <View style={styles.logCard}>
            <View style={styles.cardHeader}>
                <View style={styles.dateInfo}>
                    <Icon name="calendar-clock" size={16} color={Colors.primary} />
                    <Text style={styles.logDateStr}>{item.date}</Text>
                </View>
                <View style={styles.machineBadge}>
                    <Text style={styles.machineText}>{item.machine_type}</Text>
                </View>
            </View>

            <View style={styles.mainContent}>
                <View style={[styles.usageCircle, { borderColor: parseFloat(item.usage_hours) >= 4 ? Colors.success : Colors.error }]}>
                    <Text style={styles.usageMain}>{item.usage_hours}</Text>
                    <Text style={styles.usageSub}>HRS</Text>
                </View>

                <View style={styles.metricsWrapper}>
                    <View style={styles.metricsRow}>
                        <MetricItem label="AHI Index" value={item.ahi} unit="/hr" color={parseFloat(item.ahi) > 5 ? Colors.error : Colors.primary} />
                        <MetricItem label="Leak Rate" value={item.leak_rate} unit="L/m" color="#F57C00" />
                    </View>
                    <View style={styles.metricsRow}>
                        <MetricItem label="Avg Press" value={item.pressure_avg} unit="cm" />
                        <MetricItem label="95% Press" value={item.pressure_95th} unit="cm" color="#7B1FA2" />
                    </View>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.footerStatus}>
                    <Icon
                        name={parseFloat(item.usage_hours) >= 4 ? "check-circle" : "alert-circle"}
                        size={14}
                        color={parseFloat(item.usage_hours) >= 4 ? Colors.success : Colors.error}
                    />
                    <Text style={[styles.statusTxt, { color: parseFloat(item.usage_hours) >= 4 ? Colors.success : Colors.error }]}>
                        {parseFloat(item.usage_hours) >= 4 ? "Compliance Met" : "Low Usage"}
                    </Text>
                </View>
                {/* <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteAction}>
                    <Icon name="trash-can-outline" size={18} color={Colors.error} />
                </TouchableOpacity> */}
            </View>
        </View>
    );

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
    },
    refreshBtn: {
        padding: 5,
    },
    listContent: {
        padding: Spacing.m,
        paddingBottom: 40,
    },
    logCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 12,
        marginBottom: 12,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logDateStr: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
        marginLeft: 6,
    },
    machineBadge: {
        backgroundColor: '#F1F7FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
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
        width: 65,
        height: 65,
        borderRadius: 32.5,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FDFDFD',
    },
    usageMain: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    usageSub: {
        fontSize: 8,
        fontWeight: '800',
        color: Colors.textSecondary,
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
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    footerStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusTxt: {
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    deleteAction: {
        padding: 4,
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
