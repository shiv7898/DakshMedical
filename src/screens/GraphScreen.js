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
    const [tooltipPos, setTooltipPos] = useState({
        visible: false,
        x: 0,
        y: 0,
        value: 0,
        chartIndex: -1
    });

    const handleDataPointClick = (data, chartIndex) => {
        setTooltipPos({
            visible: true,
            x: data.x,
            y: data.y,
            value: data.value,
            chartIndex
        });
        setTimeout(() => {
            setTooltipPos(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

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
    console.log('Reversed Logs:', reversedLogs);
    const dates = reversedLogs.map(l => l.date.split('-')[2]);

    return (
        <SafeAreaView style={styles.safeContainer}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color="#FFF" />
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
                    <View style={{ position: 'relative' }}>
                        <LineChart
                            data={{
                                labels: dates,
                                datasets: [{
                                    data: reversedLogs.map(l => l.pressure_95th || 0),
                                }]
                            }}
                            width={width - Spacing.m * 4}
                            height={200}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
                            withInnerLines={true}
                            onDataPointClick={(data) => handleDataPointClick(data, 0)}
                        />
                        {tooltipPos.visible && tooltipPos.chartIndex === 0 && (
                            <View style={[styles.tooltipOverlay, { left: tooltipPos.x - 20, top: tooltipPos.y - 35 }]}>
                                <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 2. Flow vs Time Chart */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Icon name="water-outline" size={18} color={Colors.secondary} />
                        <Text style={styles.chartLabel}>Flow vs Time</Text>
                    </View>
                    <View style={{ position: 'relative' }}>
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
                            onDataPointClick={(data) => handleDataPointClick(data, 1)}
                        />
                        {tooltipPos.visible && tooltipPos.chartIndex === 1 && (
                            <View style={[styles.tooltipOverlay, { left: tooltipPos.x - 20, top: tooltipPos.y - 35 }]}>
                                <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 3. Last 7 Days (Mask Off, Apnea, High Leak) */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Icon name="alert-circle-outline" size={18} color="#FFA726" />
                        <Text style={styles.chartLabel}>Last 7 Days (Apnea, Leak, Mask)</Text>
                    </View>
                    {/* Custom Legend with spacing */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8, gap: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(239, 83, 80, 1)', marginRight: 5 }} />
                            <Text style={{ fontSize: 11, color: '#555' }}>Apnea(AHI)</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255, 167, 38, 1)', marginRight: 5 }} />
                            <Text style={{ fontSize: 11, color: '#555' }}>High Leak</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(66, 165, 245, 1)', marginRight: 5 }} />
                            <Text style={{ fontSize: 11, color: '#555' }}>Mask Off</Text>
                        </View>
                    </View>
                    <View style={{ position: 'relative' }}>
                        <LineChart
                            data={{
                                labels: dates,
                                datasets: [
                                    { data: reversedLogs.map(l => l.ahi || 0), color: (opacity = 1) => `rgba(239, 83, 80, ${opacity})` },
                                    { data: reversedLogs.map(l => l.leak_rate || 0), color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})` },
                                    { data: reversedLogs.map(l => l.cai || 0), color: (opacity = 1) => `rgba(66, 165, 245, ${opacity})` }
                                ]
                            }}
                            width={width - Spacing.m * 4}
                            height={220}
                            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(158, 158, 158, ${opacity})` }}
                            style={styles.chart}
                            bezier
                            withInnerLines={true}
                            onDataPointClick={(data) => handleDataPointClick(data, 2)}
                        />
                        {tooltipPos.visible && tooltipPos.chartIndex === 2 && (
                            <View style={[styles.tooltipOverlay, { left: tooltipPos.x - 20, top: tooltipPos.y - 35 }]}>
                                <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
                            </View>
                        )}
                    </View>
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
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 14,
        paddingBottom: 14,
        backgroundColor: Colors.primary,
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
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
    },
    tooltipOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.85)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        zIndex: 100, // Ensure it floats above the chart
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    tooltipText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '900',
    },
});

export default GraphScreen;
