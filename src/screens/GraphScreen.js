import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    StatusBar,
} from 'react-native';
import { Colors, Spacing, Typography } from '../styles/theme';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { getLogs } from '../api/database';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const GraphScreen = ({ navigation }) => {
    const [logs, setLogs] = useState([]);

    useFocusEffect(
        React.useCallback(() => {
            console.log('Fetching Graph Data...');
            getLogs().then(setLogs);
        }, [])
    );

    const chartConfig = {
        backgroundColor: "#FFFFFF",
        backgroundGradientFrom: "#FFFFFF",
        backgroundGradientTo: "#FFFFFF",
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(96, 125, 139, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: { r: "5", strokeWidth: "3", stroke: "#FFF" },
        barPercentage: 0.5,
        propsForLabels: {
            fontSize: 10,
        },
    };

    if (logs.length === 0) {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <Icon name="chart-line-variant" size={60} color={Colors.accent} />
                <Text style={styles.emptyText}>No therapy data available for graphing</Text>
                <TouchableOpacity style={styles.backBtnEmpty} onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const reversedLogs = [...logs].slice(0, 7).reverse();
    const dates = reversedLogs.map(l => l.date.split('-')[2]);

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Clinical Trends</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.infoText}>Detailed metrics for the last 7 therapy sessions.</Text>

                {/* 1. Pressure vs Time Chart */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Icon name="gauge" size={18} color={Colors.primary} />
                        <Text style={styles.chartLabel}>Pressure vs Time</Text>
                    </View>
                    <LineChart
                        data={{
                            labels: dates,
                            datasets: [{
                                data: reversedLogs.map(l => l.pressure_95th || 0),
                                strokeDashArray: [5, 5] // "-- wala stroke"
                            }]
                        }}
                        width={width - Spacing.m * 4}
                        height={200}
                        chartConfig={{
                            ...chartConfig,
                            propsForBackgroundLines: { strokeDasharray: "5,5" }
                        }}
                        bezier
                        style={styles.chart}
                        withInnerLines={true}
                    />
                </View>

                {/* 2. Flow vs Time Chart */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Icon name="water-outline" size={18} color={Colors.secondary} />
                        <Text style={styles.chartLabel}>Flow vs Time</Text>
                    </View>
                    <LineChart
                        data={{
                            labels: dates,
                            datasets: [{ data: reversedLogs.map(l => l.usage_hours || 0) }]
                        }}
                        width={width - Spacing.m * 4}
                        height={180}
                        chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(0, 188, 212, ${opacity})` }}
                        style={styles.chart}
                        bezier
                        withInnerLines={false}
                    />
                </View>

                {/* 3. Last 7 Days (Mask Off, Apnea, High Leak) */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Icon name="alert-circle-outline" size={18} color="#FFA726" />
                        <Text style={styles.chartLabel}>Last 7 Days (Apnea, Leak, Mask)</Text>
                    </View>
                    <LineChart
                        data={{
                            labels: dates,
                            legend: ['Apnea (AHI)', 'High Leak', 'Mask Off'],
                            datasets: [
                                { data: reversedLogs.map(l => l.ahi || 0), color: (opacity = 1) => `rgba(239, 83, 80, ${opacity})` }, // Red - Apnea
                                { data: reversedLogs.map(l => l.leak_rate || 0), color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})` }, // Orange - High Leak
                                { data: reversedLogs.map(l => l.cai || 0), color: (opacity = 1) => `rgba(66, 165, 245, ${opacity})` }  // Blue - Mask Off
                            ]
                        }}
                        width={width - Spacing.m * 4}
                        height={220}
                        chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(158, 158, 158, ${opacity})` }}
                        style={styles.chart}
                        bezier
                        withInnerLines={true}
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.m,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
        paddingBottom: 10,
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        ...Typography.subheader,
        fontSize: 18,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.m,
    },
    infoText: {
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.m,
        fontStyle: 'italic',
    },
    chartCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: '#F0F6FF',
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    chartLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.text,
        marginLeft: 6,
    },
    chart: {
        marginVertical: 5,
        borderRadius: 12,
        marginLeft: -15,
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 15,
        color: Colors.textSecondary,
        fontSize: 14,
        textAlign: 'center',
    },
    backBtnEmpty: {
        marginTop: 30,
        padding: 12,
        backgroundColor: Colors.primary,
        borderRadius: 10,
    },
    backBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
    }
});

export default GraphScreen;
