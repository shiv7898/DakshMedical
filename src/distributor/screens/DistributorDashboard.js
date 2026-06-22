import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    RefreshControl,
    Dimensions,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Colors, Spacing } from '../../styles/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useData } from '../../context/DataContext';
import { ENDPOINTS } from '../../api/apiConfig';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.m * 3) / 2;

const DistributorDashboard = ({ navigation }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const { userData, token } = useData();
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);

    const fetchSummary = useCallback(async () => {
        try {
            console.log('📡 Fetching Distributor Summary...');
            const response = await fetch(ENDPOINTS.DISTRIBUTOR_SUMMARY, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const result = await response.json();
            if (response.ok) setSummary(result);
        } catch (error) {
            console.error('❌ Error fetching summary:', error);
        }
    }, [token]);

    const fetchTransactions = useCallback(async () => {
        try {
            console.log('📡 Fetching Distributor Transactions...');
            const response = await fetch(ENDPOINTS.DISTRIBUTOR_TRANSACTIONS, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const result = await response.json();
            if (response.ok) setTransactions(result);
        } catch (error) {
            console.error('❌ Error fetching transactions:', error);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            Promise.all([fetchSummary(), fetchTransactions()]).finally(() => setLoading(false));
        }, [fetchSummary, fetchTransactions])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([fetchSummary(), fetchTransactions()]).finally(() => setRefreshing(false));
    }, [fetchSummary, fetchTransactions]);

    const SummaryCard = ({ title, value, unit, icon, color, subtitle }) => (
        <View style={styles.modernCard}>
            <View style={[styles.bgShapeLarge, { backgroundColor: color }]} />
            <View style={[styles.bgShapeSmall, { backgroundColor: color }]} />

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
                    {unit ? <Text style={styles.modernUnit}>{unit}</Text> : null}
                </View>
            </View>
            <View style={[styles.accentLine, { backgroundColor: color }]} />
        </View>
    );

    const defaultSummary = {
        machines: { title: "Total Machine Sell", value: "0", unit: "units", subtitle: "Purchased by you", icon: "cube-outline", color: "#0ea5e9" },
        profit: { title: "Net Profit", value: "₹0", subtitle: "Estimated", icon: "trending-up", color: "#10B981" },
        orders: { title: "Total Orders", value: "0", unit: "orders", subtitle: "Pending: 0", icon: "package-variant", color: "#8B5CF6" },
        queries: { title: "Queries", value: "00", unit: "pending", subtitle: "Support", icon: "message-alert-outline", color: "#F59E0B" }
    };

    const data = summary || defaultSummary;

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            <View style={styles.brandHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => navigation.openDrawer()}
                        activeOpacity={0.7}
                        style={styles.profileBtn}
                    >
                        <Icon name="menu" size={26} color="#FFF" />
                    </TouchableOpacity>
                    <View style={{ marginLeft: 15 }}>
                        <Text style={styles.brandGreeting}>Distributor Dashboard</Text>
                        <Text style={styles.brandName}>{userData?.name || 'Partner'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.profileBtn}>
                    <Icon name="bell-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.modernSectionTitle}>Business Overview</Text>
                        <Text style={styles.dateText}>Today, {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</Text>
                    </View>

                    <View style={styles.modernMetricsGrid}>
                        <SummaryCard key="machines-card" {...data.machines} />
                        <SummaryCard key="profit-card" {...data.profit} />
                        <SummaryCard key="orders-card" {...data.orders} />
                        <SummaryCard key="queries-card" {...data.queries} />
                    </View>

                    {/* Report Shortcut Banner */}
                    <TouchableOpacity
                        style={styles.premiumBanner}
                        onPress={() => navigation.navigate('DistributorReports')}
                    >
                        <View style={styles.premiumContent}>
                            <View style={styles.premiumIcon}>
                                <Icon name="chart-box-outline" size={22} color="#FFF" />
                            </View>
                            <View style={{ marginLeft: 12 }}>
                                <Text style={styles.premiumTitle}>Sales Analytics</Text>
                                <Text style={styles.premiumSubText}>View detailed performance reports</Text>
                            </View>
                        </View>
                        <Icon name="chevron-right" size={24} color="#FFF" />
                    </TouchableOpacity>

                    {/* <View style={styles.recentHeader}>
                    <Text style={styles.modernSectionTitle}>Recent Orders</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('DistributorOrders')}>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View> */}

                    {/* {transactions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="package-variant" size={40} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No recent orders</Text>
                    </View>
                ) : (
                    transactions.map((item, index) => (
                        <View key={`trans-${item.order_id || index}`} style={styles.transactionCard}>
                            <View style={styles.transIconBox}>
                                <Icon name="cart-check" size={24} color={Colors.primary} />
                            </View>
                            <View style={styles.transDetails}>
                                <Text style={styles.transTitle}>{item.product_name}</Text>
                                <Text style={styles.transUser}>From: {item.customer_name}</Text>
                                <Text style={styles.transDate}>
                                    {item.order_date ? new Date(item.order_date).toLocaleDateString() : 'Recent'}
                                </Text>
                            </View>
                            <Text style={[styles.transAmount, { color: '#10B981' }]}>
                                ₹{(item.final_amount !== undefined && item.final_amount !== null
                                    ? item.final_amount
                                    : item.total_amount
                                ).toLocaleString()}
                            </Text>
                        </View>
                    ))
                )} */}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeContainer: { flex: 1, backgroundColor: '#FFFFFF' },
    brandHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.m,
        paddingBottom: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        backgroundColor: Colors.primary,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        elevation: 8,
    },
    brandGreeting: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' },
    brandName: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
    profileBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: Spacing.m, paddingTop: 20, paddingBottom: 120 },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modernSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    dateText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    modernMetricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    modernCard: {
        backgroundColor: '#FFF',
        width: CARD_WIDTH,
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitleArea: { flex: 1 },
    modernLabel: { fontSize: 13, color: '#475569', fontWeight: 'bold' },
    modernSub: { fontSize: 9, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
    modernIconCircle: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    modernValueRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 15 },
    modernValue: { fontSize: 24, fontWeight: '900' },
    modernUnit: { fontSize: 12, marginLeft: 4, color: '#64748B', fontWeight: '600' },
    bgShapeLarge: { position: 'absolute', width: 100, height: 100, borderRadius: 50, top: -30, right: -30, opacity: 0.05 },
    bgShapeSmall: { position: 'absolute', width: 60, height: 60, borderRadius: 30, bottom: -20, left: -20, opacity: 0.05 },
    accentLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 4 },
    premiumBanner: {
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        elevation: 6,
    },
    premiumContent: { flexDirection: 'row', alignItems: 'center' },
    premiumIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    premiumTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
    premiumSubText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 25, marginBottom: 15 },
    viewAllText: { fontSize: 12, fontWeight: 'bold', color: Colors.primary },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    transIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    transDetails: { flex: 1 },
    transTitle: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
    transUser: { fontSize: 11, color: '#64748B', marginTop: 1 },
    transDate: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
    transAmount: { fontSize: 15, fontWeight: '900' },
    emptyContainer: { padding: 40, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 14, color: '#94A3B8', marginTop: 10, fontWeight: '500' },
});

export default DistributorDashboard;
