import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const SummaryCard = ({ icon, title, value, unit, status, color, children }) => {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                    <Icon name={icon} size={20} color={color} />
                </View>
                {status && (
                    <View style={[styles.statusTag, { backgroundColor: `${color}15` }]}>
                        <Text style={[styles.statusText, { color }]}>{status}</Text>
                    </View>
                )}
            </View>
            <View style={styles.content}>
                <Text style={styles.value}>{value}</Text>
                <Text style={styles.title}>{title}</Text>
                {unit && <Text style={styles.unit}>{unit}</Text>}
            </View>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconBox: {
        padding: 8,
        borderRadius: 12,
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    content: {
        marginTop: 4,
    },
    value: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A1C1E',
    },
    title: {
        fontSize: 12,
        color: '#7B8D9E',
        fontWeight: '600',
        marginTop: 2,
    },
    unit: {
        fontSize: 10,
        color: '#ACB8C4',
        marginTop: 2,
    },
});

export default SummaryCard;
