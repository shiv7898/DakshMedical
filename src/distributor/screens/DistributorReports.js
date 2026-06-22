import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Dimensions,
    SafeAreaView,
    TouchableOpacity,
    Platform,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Colors, Spacing } from '../../styles/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useData } from '../../context/DataContext';
import { ENDPOINTS } from '../../api/apiConfig';

const { width } = Dimensions.get('window');

const DistributorReports = ({ navigation }) => {
    const { token } = useData();
    const [loading, setLoading] = useState(true);
    const [reportsData, setReportsData] = useState(null);

    const fetchReportsData = useCallback(async () => {
        try {
            setLoading(true);
            console.log('📡 Fetching Distributor Reports Data...');
            const response = await fetch(ENDPOINTS.DISTRIBUTOR_REPORTS, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const result = await response.json();
            if (response.ok) {
                setReportsData(result);
            }
        } catch (error) {
            console.error('❌ Error fetching reports data:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchReportsData();
    }, [fetchReportsData]);

    const chartConfig = {
        backgroundGradientFrom: '#FFFFFF',
        backgroundGradientTo: '#FFFFFF',
        color: (opacity = 1) => `rgba(81, 130, 118, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
    };

    // Default Fallbacks
    const defaultDiscountData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            data: [0, 0, 0, 0, 0, 0],
            color: (opacity = 1) => `rgba(81, 130, 118, ${opacity})`,
            strokeWidth: 3
        }]
    };

    const defaultWeeklyPurchasesData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            data: [0, 0, 0, 0, 0, 0, 0]
        }]
    };

    // Prepare real data or fallbacks
    const discountData = reportsData?.discount_chart ? {
        labels: reportsData.discount_chart.labels,
        datasets: [{
            data: reportsData.discount_chart.values.map(v => v || 0),
            color: (opacity = 1) => `rgba(81, 130, 118, ${opacity})`,
            strokeWidth: 3
        }]
    } : defaultDiscountData;

    const weeklyPurchasesData = reportsData?.weekly_purchases_chart ? {
        labels: reportsData.weekly_purchases_chart.labels,
        datasets: [{
            data: reportsData.weekly_purchases_chart.values.map(v => v || 0)
        }]
    } : defaultWeeklyPurchasesData;

    const dailyPurchasesText = reportsData?.daily_purchases?.value || '0 Units';
    const dailyPurchasesTrendText = reportsData?.daily_purchases?.trend || '0% vs yesterday';

    const monthlyPurchasesText = reportsData?.monthly_purchases?.value || '0 Units';
    const monthlyPurchasesTrendText = reportsData?.monthly_purchases?.trend || '0% vs last month';

    const topProductsList = reportsData?.top_products || [
        { name: "No orders placed yet", sales: "0 Units", growth: "0%" }
    ];

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Business Analytics</Text>
                <TouchableOpacity style={styles.headerBtn} onPress={fetchReportsData}>
                    <Icon name="refresh" size={22} color="#FFF" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                    {/* Stats Summary */}
                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Daily Purchases</Text>
                            <Text style={styles.statValue}>{dailyPurchasesText}</Text>
                            <View style={styles.trendRow}>
                                <Icon name="chart-timeline-variant" size={14} color="#64748B" />
                                <Text style={[styles.trendText, { color: '#64748B' }]}>{dailyPurchasesTrendText}</Text>
                            </View>
                        </View>
                        <View style={[styles.statBox, { borderColor: '#E2E8F0' }]}>
                            <Text style={styles.statLabel}>Monthly Purchases</Text>
                            <Text style={styles.statValue}>{monthlyPurchasesText}</Text>
                            <View style={styles.trendRow}>
                                <Icon name="chart-timeline-variant" size={14} color="#64748B" />
                                <Text style={[styles.trendText, { color: '#64748B' }]}>{monthlyPurchasesTrendText}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Profit Chart */}
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Monthly Discount Trend (INR)</Text>
                        <LineChart
                            data={discountData}
                            width={width - 64}
                            height={200}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
                        />
                    </View>

                    {/* Sales Activity */}
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Weekly Product Purchases</Text>
                        <BarChart
                            data={weeklyPurchasesData}
                            width={width - 64}
                            height={200}
                            chartConfig={chartConfig}
                            style={styles.chart}
                            verticalLabelRotation={0}
                        />
                    </View>

                    {/* Top Products */}
                    {/* <View style={styles.topProductsCard}>
                        <Text style={styles.chartTitle}>Top Performing Products</Text>
                        {topProductsList.map((item, index) => (
                            <View key={index} style={styles.productItem}>
                                <View style={styles.productIcon}>
                                    <Icon name="package-variant-closed" size={20} color={Colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.productName}>{item.name}</Text>
                                    <Text style={styles.productSales}>{item.sales}</Text>
                                </View>
                                <Text style={styles.productGrowth}>{item.growth}</Text>
                            </View>
                        ))}
                    </View> */}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeContainer: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 15,
    },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 150 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statBox: {
        width: (width - 60) / 2,
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 2,
    },
    statLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginVertical: 4 },
    trendRow: { flexDirection: 'row', alignItems: 'center' },
    trendText: { fontSize: 11, color: '#10B981', fontWeight: 'bold', marginLeft: 4 },
    chartCard: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 3,
    },
    chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
    chart: { borderRadius: 16, marginVertical: 8 },
    topProductsCard: {
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 3,
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    productIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    productName: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
    productSales: { fontSize: 12, color: '#64748B' },
    productGrowth: { fontSize: 13, fontWeight: 'bold', color: '#10B981' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default DistributorReports;
