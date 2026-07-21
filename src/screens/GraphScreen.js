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
import { useData } from '../context/DataContext';

const { width } = Dimensions.get('window');

const GraphScreen = ({ navigation }) => {
    const [logs, setLogs] = useState([]);
    const { selectedRange } = useData(); // Kept for consistency if needed elsewhere, but logic will use 7 weeks/days
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

    const formatHoursToHHMM = (decimalHours) => {
        const val = parseFloat(decimalHours);
        if (isNaN(val)) return '00:00';
        const totalMinutes = Math.round(val * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    useFocusEffect(
        React.useCallback(() => {
            console.log('Fetching Graph Data...');
            getLogs().then(setLogs);
        }, [selectedRange])
    );

    const chartConfig = {
        backgroundColor: "#FFFFFF",
        backgroundGradientFrom: "#FFFFFF",
        backgroundGradientTo: "#FFFFFF",
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
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
            return `${parts[2]}`;
        }
        return l.date;
    });

    const reversedLogsAll = [...logs].slice(0, selectedRange || logs.length).reverse();
    const datesAll = reversedLogsAll.map(l => {
        if (!l.date) return '';
        const parts = l.date.split('-');
        if (parts.length >= 3) {
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
                <Text style={styles.infoText}>Detailed metrics for the selected therapy sessions.</Text>

                {/* 1. Daily Usage Hours Chart */}
                <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                        <Icon name="clock-time-four-outline" size={18} color={Colors.primary} />
                        <Text style={styles.chartLabel}>Daily Usage (Hours)</Text>
                    </View>
                    <View style={{ position: 'relative' }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <LineChart
                                data={{
                                    labels: datesAll,
                                    datasets: [{
                                        data: reversedLogsAll.map(l => parseFloat(l.usage_hours) || 0),
                                    }]
                                }}
                                width={Math.max(width - Spacing.m * 4, datesAll.length * 25)}
                                height={200}
                                chartConfig={chartConfig}
                                formatYLabel={(value) => Number(value).toFixed(1)}
                                bezier={datesAll.length > 1}
                                style={styles.chart}
                                withInnerLines={true}
                                onDataPointClick={(data) => handleDataPointClick(data, 3)} // Index 3 for tooltip
                                renderDotContent={({ x, y, index, indexData }) => {
                                    const isLow = indexData < 4;
                                    const isNearTop = y < 30;
                                    return (
                                        <View key={index} style={{ position: 'absolute', top: y, left: x, zIndex: 100 }}>
                                            <Text style={{ 
                                                position: 'absolute', 
                                                top: isNearTop ? 8 : -20, 
                                                left: -15, 
                                                width: 30, 
                                                textAlign: 'center',
                                                fontSize: 9, 
                                                color: isLow ? '#EF4444' : '#10B981', 
                                                fontWeight: 'bold' 
                                            }}>
                                                ({Number(indexData).toFixed(1)})
                                            </Text>
                                            {isLow && (
                                                <View style={{
                                                    position: 'absolute',
                                                    top: -5,
                                                    left: -5,
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 5,
                                                    backgroundColor: '#EF4444',
                                                    borderWidth: 1.5,
                                                    borderColor: '#FFF'
                                                }} />
                                            )}
                                        </View>
                                    );
                                }}
                            />
                        </ScrollView>
                        {tooltipPos.visible && tooltipPos.chartIndex === 3 && (
                            <View style={[styles.tooltipOverlay, { left: tooltipPos.x - 20, top: tooltipPos.y - 35 }]}>
                                <Text style={styles.tooltipText}>
                                    {Number(tooltipPos.value).toFixed(1)}h
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 1. Pressure vs Time Chart */}
                {/* <View style={styles.chartCard}>
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
                </View> */}

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
                            withShadow={false}
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
                        <Text style={styles.chartLabel}>Last 7 Days (Apnea, Leak)</Text>
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
                                withShadow={false}
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
                    {/* <View style={styles.miniGraphSection}>
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
                    </View> */}
                </View>

                <View style={{ height: 20 }} />

                {/* ─── SECTION: Pressure Profiles ─── */}
                {false && (() => {
                    // 9 days graphs are always shown regardless of selection
                    const filteredLogs = [...logs].slice(0, 9);
                    const rangeLabel = "9-Day Profile";


                    return (
                        <>
                            <View style={styles.sectionHeader}>
                                <Icon name="chart-timeline-variant" size={20} color={Colors.primary} />
                                <Text style={styles.sectionTitle}>
                                    Pressure Profiles — {rangeLabel} ({filteredLogs.length} day{filteredLogs.length !== 1 ? 's' : ''})
                                </Text>
                            </View>
                            <Text style={styles.sectionSubtitle}>
                                CPAP: Set Pressure ramp  |  APAP: Min/Max range  |  Mixed: Both in one
                            </Text>

                            {filteredLogs.length === 0 ? (
                                <View style={[styles.pressureCard, styles.pressureCardEmpty]}>
                                    <Icon name="chart-line-variant" size={36} color="#CBD5E1" />
                                    <Text style={styles.emptyDayText}>No data in last {rangeLabel}</Text>
                                    <Text style={styles.emptyDaySubText}>Import therapy data to view graphs</Text>
                                </View>
                            ) : (
                                filteredLogs.map((log, i) => {
                                    const usageH = parseFloat(log.usage_hours) || 0;
                                    const usageLabel = formatHoursToHHMM(usageH);

                                    // Build time labels: 00:00 → usage end
                                    const totalMins = usageH * 60;

                                    const setPres = parseFloat(log.avg_set_pressure || log.pressure_avg) || 0.1;
                                    const minP = parseFloat(log.pressure_min) || 4;
                                    const maxP = parseFloat(log.pressure_max) || setPres;

                                    const therapyStr = (log.therapy_type || '').toLowerCase();
                                    const isCPAPMode = !therapyStr.includes('apap') && !therapyStr.includes('mixed');
                                    const isAPAPMode = therapyStr.includes('apap') && !therapyStr.includes('mixed');
                                    const isMixedMode = therapyStr.includes('mixed');

                                    // X-axis: 5 evenly-distributed time labels
                                    const endLabel = totalMins > 0
                                        ? `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(Math.floor(totalMins % 60)).padStart(2, '0')}`
                                        : '00:00';
                                    const midMins = totalMins / 4;
                                    const xLabels = [0, 1, 2, 3, 4].map(s => {
                                        const m = s * midMins;
                                        return s === 0 ? '00:00'
                                            : s === 4 ? endLabel
                                                : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
                                    });

                                    let chartData;
                                    let chartCfg;

                                    if (isCPAPMode) {
                                        const rampStart = parseFloat(log.ramp_start_pressure) || setPres * 0.55;
                                        const p0 = rampStart > 0 ? rampStart : 0.1;
                                        const pts = [
                                            p0,
                                            parseFloat((p0 + (setPres - p0) * 0.2).toFixed(2)),
                                            parseFloat((p0 + (setPres - p0) * 0.55).toFixed(2)),
                                            parseFloat((p0 + (setPres - p0) * 0.85).toFixed(2)),
                                            setPres,
                                        ];
                                        chartData = {
                                            labels: xLabels,
                                            datasets: [{ data: pts, strokeWidth: 1.5, color: (op = 1) => `rgba(15,70,180,${op})` }] // Darker Blue
                                        };
                                        chartCfg = {
                                            backgroundColor: '#FFFFFF',
                                            backgroundGradientFrom: '#FFFFFF',
                                            backgroundGradientTo: '#FFFFFF',
                                            backgroundGradientFromOpacity: 1,
                                            backgroundGradientToOpacity: 1,
                                            decimalPlaces: 1,
                                            color: (op = 1) => `rgba(14,133,230,${op})`,
                                            labelColor: (op = 1) => `rgba(71,85,105,${op})`,
                                            style: { borderRadius: 16 },
                                            fillShadowGradientFromOpacity: 0,
                                            fillShadowGradientToOpacity: 0,
                                            propsForDots: { r: '2', strokeWidth: '4', stroke: '#1E88E5', fill: '#fff' },
                                            propsForBackgroundLines: {
                                                propsForBackgroundLines: {
                                                    stroke: '#E5E7EB' // simple line
                                                }
                                            },
                                            propsForLabels: { fontSize: 9, fontWeight: '600' },
                                        };

                                    } else if (isAPAPMode) {
                                        const yMin = Math.max(0, Math.min(minP, 4) - 1);
                                        chartData = {
                                            labels: xLabels,
                                            datasets: [
                                                { data: Array(5).fill(maxP), color: (op = 1) => `rgba(185,28,28,${op})`, strokeWidth: 1.5 }, // Darker Red
                                                { data: Array(5).fill(minP), color: (op = 1) => `rgba(30,64,175,${op})`, strokeWidth: 1.5 }, // Darker Blue
                                                { data: Array(5).fill(yMin), color: () => 'transparent', strokeWidth: 0, withDots: false },
                                            ],
                                            legend: [] // Removed default legend
                                        };
                                        chartCfg = {
                                            backgroundColor: '#FFFFFF',
                                            backgroundGradientFrom: '#FFFFFF',
                                            backgroundGradientTo: '#FFFFFF',
                                            backgroundGradientFromOpacity: 1,
                                            backgroundGradientToOpacity: 1,
                                            decimalPlaces: 1,
                                            color: (op = 1) => `rgba(109,40,217,${op})`,
                                            labelColor: (op = 1) => `rgba(71,85,105,${op})`,
                                            style: { borderRadius: 16 },
                                            fillShadowGradientFromOpacity: 0,
                                            fillShadowGradientToOpacity: 0,
                                            propsForDots: { r: '4', strokeWidth: '1', stroke: '#fff' },
                                            propsForBackgroundLines: { stroke: 'rgba(109,40,217,0.1)', strokeDasharray: '4,4' },
                                            propsForLabels: { fontSize: 9, fontWeight: '600' },
                                        };
                                    } else {
                                        // MIXED: CPAP ramp + APAP min/max
                                        const rampStart = parseFloat(log.ramp_start_pressure) || setPres * 0.55;
                                        const p0 = rampStart > 0 ? rampStart : 0.1;
                                        const cpapPts = [
                                            p0,
                                            parseFloat((p0 + (setPres - p0) * 0.25).toFixed(2)),
                                            parseFloat((p0 + (setPres - p0) * 0.55).toFixed(2)),
                                            parseFloat((p0 + (setPres - p0) * 0.80).toFixed(2)),
                                            setPres,
                                        ];
                                        const yAnchor = Math.max(0, Math.min(minP, 4) - 1);
                                        chartData = {
                                            labels: xLabels,
                                            datasets: [
                                                { data: cpapPts, color: (op = 1) => `rgba(15,70,180,${op})`, strokeWidth: 1.5 },
                                                { data: Array(5).fill(maxP), color: (op = 1) => `rgba(185,28,28,${op})`, strokeWidth: 1.5 },
                                                { data: Array(5).fill(minP), color: (op = 1) => `rgba(15,118,110,${op})`, strokeWidth: 1.5 },
                                                { data: Array(5).fill(yAnchor), color: () => 'transparent', strokeWidth: 0, withDots: false },
                                            ],
                                            legend: [] // Removed default legend
                                        };
                                        chartCfg = {
                                            backgroundColor: '#FFFFFF',
                                            backgroundGradientFrom: '#FFFFFF',
                                            backgroundGradientTo: '#FFFFFF',
                                            backgroundGradientFromOpacity: 1,
                                            backgroundGradientToOpacity: 1,
                                            decimalPlaces: 1,
                                            color: (op = 1) => `rgba(30,136,229,${op})`,
                                            labelColor: (op = 1) => `rgba(71,85,105,${op})`,
                                            style: { borderRadius: 16 },
                                            fillShadowGradientFromOpacity: 0,
                                            fillShadowGradientToOpacity: 0,
                                            propsForDots: { r: '5', strokeWidth: '2', stroke: '#fff' },
                                            propsForBackgroundLines: { stroke: 'rgba(30,136,229,0.1)', strokeDasharray: '4,4' },
                                            propsForLabels: { fontSize: 9, fontWeight: '600' },
                                        };
                                    }

                                    const badgeBg = isCPAPMode ? '#E0F2FE' : isAPAPMode ? '#F5F3FF' : '#FFF7ED';
                                    const badgeColor = isCPAPMode ? '#0284C7' : isAPAPMode ? '#7C3AED' : '#EA580C';
                                    const stripeColor = isCPAPMode ? '#1E88E5' : isAPAPMode ? '#7C3AED' : '#14B8A6';
                                    const badgeIcon = isCPAPMode ? 'lungs' : isAPAPMode ? 'wave' : 'swap-horizontal';
                                    const badgeLabel = isCPAPMode ? 'CPAP' : isAPAPMode ? 'APAP' : 'MIXED';

                                    return (
                                        <View key={i} style={styles.pressureCard}>
                                            <View style={styles.pressureCardHeader}>
                                                <View>
                                                    <Text style={styles.pressureCardDate}>{log.date || `Day ${i + 1}`}</Text>
                                                    <Text style={styles.pressureCardUsage}>Usage: {usageLabel}</Text>
                                                </View>
                                                <View style={[styles.modeBadge, { backgroundColor: badgeBg }]}>
                                                    <Icon name={badgeIcon} size={12} color={badgeColor} />
                                                    <Text style={[styles.modeBadgeText, { color: badgeColor }]}>
                                                        {badgeLabel}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={[styles.accentStripe, { backgroundColor: stripeColor }]} />

                                            {/* Custom Legend Section */}
                                            {isAPAPMode && (
                                                <View style={styles.customLegendContainer}>
                                                    <View style={styles.legendItem}>
                                                        <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                                                        <Text style={styles.legendText}>Max (APAP)</Text>
                                                    </View>
                                                    <View style={[styles.legendItem, { marginLeft: 15 }]}>
                                                        <View style={[styles.legendDot, { backgroundColor: '#64C8FF' }]} />
                                                        <Text style={styles.legendText}>Min (APAP)</Text>
                                                    </View>
                                                </View>
                                            )}

                                            {isMixedMode && (
                                                <View style={styles.customLegendContainer}>
                                                    <View style={styles.legendItem}>
                                                        <View style={[styles.legendDot, { backgroundColor: '#1E88E5' }]} />
                                                        <Text style={styles.legendText}>Set (CPAP)</Text>
                                                    </View>
                                                    <View style={[styles.legendItem, { marginLeft: 15 }]}>
                                                        <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                                                        <Text style={styles.legendText}>Max (APAP)</Text>
                                                    </View>
                                                    <View style={[styles.legendItem, { marginLeft: 15 }]}>
                                                        <View style={[styles.legendDot, { backgroundColor: '#14B8A6' }]} />
                                                        <Text style={styles.legendText}>Min (APAP)</Text>
                                                    </View>
                                                </View>
                                            )}

                                            <View style={{ position: 'relative' }}>
                                                <LineChart
                                                    data={chartData}

                                                    width={width - Spacing.m * 4}
                                                    height={180}
                                                    chartConfig={chartCfg}
                                                    bezier
                                                    withInnerLines={true}
                                                    withOuterLines={false}
                                                    withDots={true}
                                                    style={[styles.chart, { borderRadius: 14 }]}
                                                    formatYLabel={(v) => Number(v) > 0 ? Number(v).toFixed(1) : ''}
                                                    onDataPointClick={(data) => handleDataPointClick(data, 100 + i)}
                                                />
                                                {tooltipPos.visible && tooltipPos.chartIndex === 100 + i && (
                                                    <View style={[styles.tooltipOverlay, { left: tooltipPos.x - 20, top: tooltipPos.y - 40 }]}>
                                                        <Text style={styles.tooltipText}>{Number(tooltipPos.value).toFixed(1)} cmH₂O</Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View style={styles.pressureSummaryRow}>
                                                {isCPAPMode ? (
                                                    <View style={styles.pressureSummaryItem}>
                                                        <Text style={styles.pressureSummaryVal}>
                                                            {parseFloat(setPres || 0).toFixed(1)}
                                                        </Text>
                                                        <Text style={styles.pressureSummaryLbl}>Set Press (cmH₂O)</Text>
                                                    </View>
                                                ) : isAPAPMode ? (
                                                    <>
                                                        <View style={styles.pressureSummaryItem}>
                                                            <Text style={[styles.pressureSummaryVal, { color: '#1E88E5' }]}>
                                                                {parseFloat(minP || 0).toFixed(1)}
                                                            </Text>
                                                            <Text style={styles.pressureSummaryLbl}>Min (cmH₂O)</Text>
                                                        </View>
                                                        <View style={[styles.pressureSummaryItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E2E8F0' }]}>
                                                            <Text style={[styles.pressureSummaryVal, { color: '#EF5350' }]}>
                                                                {parseFloat(maxP || 0).toFixed(1)}
                                                            </Text>
                                                            <Text style={styles.pressureSummaryLbl}>Max (cmH₂O)</Text>
                                                        </View>
                                                    </>
                                                ) : (
                                                    <>
                                                        <View style={styles.pressureSummaryItem}>
                                                            <Text style={[styles.pressureSummaryVal, { color: '#1E88E5' }]}>
                                                                {parseFloat(setPres).toFixed(1)}
                                                            </Text>
                                                            <Text style={styles.pressureSummaryLbl}>Set (cmH₂O)</Text>
                                                        </View>
                                                        <View style={[styles.pressureSummaryItem, { borderLeftWidth: 1, borderColor: '#E2E8F0' }]}>
                                                            <Text style={[styles.pressureSummaryVal, { color: '#14B8A6' }]}>
                                                                {parseFloat(minP).toFixed(1)}
                                                            </Text>
                                                            <Text style={styles.pressureSummaryLbl}>Min (cmH₂O)</Text>
                                                        </View>
                                                        <View style={[styles.pressureSummaryItem, { borderLeftWidth: 1, borderColor: '#E2E8F0' }]}>
                                                            <Text style={[styles.pressureSummaryVal, { color: '#EF4444' }]}>
                                                                {parseFloat(maxP).toFixed(1)}
                                                            </Text>
                                                            <Text style={styles.pressureSummaryLbl}>Max (cmH₂O)</Text>
                                                        </View>
                                                    </>
                                                )}
                                                <View style={styles.pressureSummaryItem}>
                                                    <Text style={styles.pressureSummaryVal}>{usageLabel}</Text>
                                                    <Text style={styles.pressureSummaryLbl}>Usage Time</Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </>
                    );
                })()}

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
        marginBottom: 15,
    },
    chartLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.text,
        marginLeft: 6,
    },
    chart: {
        marginVertical: 15,
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
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        marginTop: 10,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginLeft: 8,
    },
    sectionSubtitle: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginBottom: 15,
        paddingHorizontal: 4,
        fontStyle: 'italic',
    },
    pressureCard: {
        backgroundColor: '#FAFCFF',
        borderRadius: 22,
        padding: Spacing.m,
        marginBottom: 18,
        elevation: 5,
        shadowColor: '#1E88E5',
        shadowOpacity: 0.10,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        borderWidth: 1,
        borderColor: '#E8F0FE',
        overflow: 'hidden',
    },
    accentStripe: {
        height: 4,
        borderRadius: 4,
        marginBottom: 12,
        marginHorizontal: -Spacing.m,
    },
    pressureCardEmpty: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 140,
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
    },
    pressureCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    pressureCardDate: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    pressureCardUsage: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    modeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    modeBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    pressureSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    pressureSummaryItem: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    pressureSummaryVal: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.primary,
    },
    pressureSummaryLbl: {
        fontSize: 9,
        color: Colors.textSecondary,
        textAlign: 'center',
        fontWeight: '600',
        marginTop: 2,
    },
    emptyDayText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#94A3B8',
        marginTop: 10,
    },
    emptyDaySubText: {
        fontSize: 11,
        color: '#CBD5E1',
        marginTop: 4,
    },
    customLegendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    legendText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#64748B',
    },
});

export default GraphScreen;
