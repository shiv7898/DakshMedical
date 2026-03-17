import React, { useEffect, useState, useMemo } from 'react';
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
    const dates = reversedLogs.map(l => {
        if (!l.date) return '';
        const parts = l.date.split('-');
        if (parts.length >= 3) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIdx = parseInt(parts[1], 10) - 1;
            const month = (monthIdx >= 0 && monthIdx < 12) ? months[monthIdx] : parts[1];
            return `${parts[2]}`;
        }
        return l.date;
    });

    const isBezier = reversedLogs.length > 1;

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
                                    data: reversedLogs.map(l => l.pressure_avg || 0),
                                }]
                            }}
                            width={width - Spacing.m * 4}
                            height={200}
                            chartConfig={chartConfig}
                            formatYLabel={(value) => Number(value).toFixed(2)}
                            bezier={isBezier}
                            style={styles.chart}
                            withInnerLines={true}
                            onDataPointClick={(data) => handleDataPointClick(data, 0)}
                        />
                        {tooltipPos.visible && tooltipPos.chartIndex === 0 && (
                            <View style={[styles.tooltipOverlay, { left: tooltipPos.x - 20, top: tooltipPos.y - 35 }]}>
                                <Text style={styles.tooltipText}>
                                    {Number(tooltipPos.value).toFixed(2)}
                                </Text>
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
                                datasets: [{ data: reversedLogs.map(l => l.avg_flow || 0) }]
                            }}
                            width={width - Spacing.m * 4}
                            height={180}

                            chartConfig={{
                                ...chartConfig,
                                color: (opacity = 1) => `rgba(0, 188, 212, ${opacity})`,
                                strokeWidth: 1   // 👈 stroke thickness
                            }}

                            formatYLabel={(value) => Number(value).toFixed(2)}   // 👈 Y-axis 2 decimal

                            style={styles.chart}
                            bezier={isBezier}
                            withInnerLines={true}

                            onDataPointClick={(data) => handleDataPointClick(data, 1)}
                        />

                        {tooltipPos.visible && tooltipPos.chartIndex === 1 && (
                            <View style={[styles.tooltipOverlay, { left: tooltipPos.x - 20, top: tooltipPos.y - 35 }]}>
                                <Text style={styles.tooltipText}>
                                    {Number(tooltipPos.value).toFixed(2)}   {/* tooltip bhi 2 decimal */}
                                </Text>
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
                    {/* 1. Apnea Index Wave */}
                    <View style={styles.miniGraphSection}>
                        <View style={styles.miniGraphHeader}>
                            <View style={[styles.miniLegendDot, { backgroundColor: '#EF5350' }]} />
                            <Text style={styles.miniGraphTitle}>Apnea (AHI)</Text>
                        </View>
                        <View style={{ position: 'relative' }}>
                            <LineChart
                                data={{ labels: dates, datasets: [{ data: reversedLogs.map(l => l.ahi || 0) }] }}
                                // width={width - 40}
                                width={width - Spacing.m * 4}
                                height={170}
                                chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(239, 83, 80, ${opacity})` }}
                                bezier={isBezier}
                                withDots={true}
                                withInnerLines={true}
                                onDataPointClick={(data) => handleDataPointClick(data, 2)}
                                style={styles.miniChartStyle}
                            />
                            {tooltipPos.visible && tooltipPos.chartIndex === 2 && (
                                <View style={[styles.tooltipOverlay, { left: tooltipPos.x - 20, top: tooltipPos.y - 35 }]}>
                                    <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* 2. Leak Rate Wave */}
                    <View style={styles.miniGraphSection}>
                        <View style={styles.miniGraphHeader}>
                            <View style={[styles.miniLegendDot, { backgroundColor: '#FFA726' }]} />
                            <Text style={styles.miniGraphTitle}>Leak Rate (L/min)</Text>
                        </View>
                        <View style={{ position: 'relative' }}>
                            <LineChart
                                data={{ labels: dates, datasets: [{ data: reversedLogs.map(l => l.leak_rate || 0) }] }}
                                // width={width - 40}
                                width={width - Spacing.m * 4}
                                height={170}
                                chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})` }}
                                bezier={isBezier}
                                withDots={true}
                                withInnerLines={true}
                                onDataPointClick={(data) => handleDataPointClick(data, 3)}
                                style={styles.miniChartStyle}
                            />
                            {tooltipPos.visible && tooltipPos.chartIndex === 3 && (
                                <View style={[styles.tooltipOverlay, { left: tooltipPos.x - 20, top: tooltipPos.y - 35 }]}>
                                    <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* 3. Mask Off Wave */}
                    <View style={styles.miniGraphSection}>
                        <View style={styles.miniGraphHeader}>
                            <View style={[styles.miniLegendDot, { backgroundColor: '#42A5F5' }]} />
                            <Text style={styles.miniGraphTitle}>Mask Off Count</Text>
                        </View>
                        <View style={{ position: 'relative' }}>
                            <LineChart
                                data={{ labels: dates, datasets: [{ data: reversedLogs.map(l => l.mask_off_count || 0) }] }}
                                // width={width - 40}
                                width={width - Spacing.m * 4}
                                height={170}
                                chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(66, 165, 245, ${opacity})` }}
                                bezier={isBezier}
                                withDots={true}
                                withInnerLines={true}
                                onDataPointClick={(data) => handleDataPointClick(data, 4)}
                                style={styles.miniChartStyle}
                            />
                            {tooltipPos.visible && tooltipPos.chartIndex === 4 && (
                                <View style={[styles.tooltipOverlay, { left: tooltipPos.x - 20, top: tooltipPos.y - 35 }]}>
                                    <Text style={styles.tooltipText}>{tooltipPos.value}</Text>
                                </View>
                            )}
                        </View>
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
    miniGraphSection: {
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F4F8',
    },
    miniGraphHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
        marginLeft: 10,
    },
    miniLegendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    miniGraphTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#607D8B',
    },
    miniChartStyle: {
        marginVertical: 0,
        borderRadius: 0,
        marginLeft: -15,
    },
});

export default GraphScreen;
