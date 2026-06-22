import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Platform,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../styles/theme';
import { useData } from '../../context/DataContext';
import { ENDPOINTS } from '../../api/apiConfig';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const DistributorOrders = ({ navigation }) => {
    const { token } = useData();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            console.log('📡 Fetching Received Orders from:', ENDPOINTS.DISTRIBUTOR_ORDERS);
            const response = await fetch(ENDPOINTS.DISTRIBUTOR_ORDERS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            console.log('📦 Received Orders API Result:', result);

            if (response.ok) {
                setOrders(Array.isArray(result) ? result : []);
            }
        } catch (error) {
            console.error('❌ Error fetching received orders:', error);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING': return { bg: '#FFF7ED', text: '#EA580C', icon: 'sync' };
            case 'APPROVED': return { bg: '#EFF6FF', text: '#3B82F6', icon: 'check-circle' };
            case 'DELIVERED': return { bg: '#ECFDF5', text: '#10B981', icon: 'truck-check' };
            default: return { bg: '#F1F5F9', text: '#64748B', icon: 'help' };
        }
    };

    const renderOrderItem = ({ item }) => {
        const status = getStatusStyle(item.status);
        return (
            <TouchableOpacity style={styles.orderCard}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.orderIdLabel}>Order ID</Text>
                        <Text style={styles.orderIdValue}>#{item.order_id}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Icon name={status.icon} size={14} color={status.text} />
                        <Text style={[styles.statusText, { color: status.text }]}>{item.status}</Text>
                    </View>
                </View>
                <View style={styles.cardBody}>
                    <View style={styles.productIconBox}>
                        <Icon name="package-variant" size={30} color={Colors.primary} />
                    </View>
                    <View style={styles.productDetails}>
                        <Text style={styles.productName}>{item.product_name}</Text>
                        <Text style={styles.productMeta}>{item.product_type} • Qty: {item.quantity}</Text>
                        {item.customer && (
                            <Text style={styles.customerName}>Cust: {item.customer.name}</Text>
                        )}
                    </View>
                    <View style={styles.priceDetails}>
                        <Text style={styles.priceLabel}>Total Amount</Text>
                        <Text style={styles.priceValue}>
                            ₹{(item.final_amount !== undefined && item.final_amount !== null
                                ? item.final_amount
                                : item.total_amount
                            ).toLocaleString()}
                        </Text>
                        {item.discount_amount > 0 ? (
                            <View style={styles.discountBadgeMini}>
                                <Icon name="tag" size={10} color="#10B981" />
                                <Text style={styles.discountBadgeMiniText}>
                                    Saved ₹{item.discount_amount.toLocaleString()}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>
                <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>
                        {item.order_date ? new Date(item.order_date).toLocaleDateString() : 'N/A'}
                    </Text>
                    <TouchableOpacity style={styles.detailsBtn}>
                        <Text style={styles.detailsBtnText}>Details</Text>
                        <Icon name="chevron-right" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
                <View style={styles.emptyIconGlow} />
                <View style={styles.emptyIconBg}>
                    <Icon name="package-variant" size={42} color={Colors.primary} />
                </View>
            </View>
            <Text style={styles.emptyTitle}>No Stock Orders Found</Text>
            <Text style={styles.emptySubtitle}>
                You don't have any stock orders at the moment. When orders are assigned or received, they will appear here.
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchOrders} activeOpacity={0.85}>
                <Icon name="refresh" size={16} color="#FFF" style={styles.refreshIcon} />
                <Text style={styles.refreshButtonText}>Refresh List</Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.headerBtn}>
                    <Icon name="menu" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Stock Orders</Text>
                <View style={{ width: 44 }} />
            </View>
            <FlatList
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={item => item.order_id?.toString() || item.id?.toString()}
                contentContainerStyle={[
                    styles.listContainer,
                    orders.length === 0 && { flexGrow: 1, justifyContent: 'center' }
                ]}
                ListEmptyComponent={renderEmptyState}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 15, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 15 },
    headerBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#FFF' },
    listContainer: { padding: 15, paddingBottom: 150 },
    orderCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 15, marginBottom: 15, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 10, marginBottom: 15 },
    orderIdLabel: { fontSize: 10, color: '#94A3B8', fontWeight: 'bold' },
    orderIdValue: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    statusText: { fontSize: 11, fontWeight: 'bold', marginLeft: 5 },
    cardBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    productIconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
    productDetails: { flex: 1, marginLeft: 15 },
    productName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
    productMeta: { fontSize: 12, color: '#64748B' },
    priceDetails: { alignItems: 'flex-end' },
    priceLabel: { fontSize: 10, color: '#94A3B8' },
    priceValue: { fontSize: 15, fontWeight: 'bold', color: Colors.primary },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 },
    dateText: { fontSize: 12, color: '#94A3B8' },
    detailsBtn: { flexDirection: 'row', alignItems: 'center' },
    detailsBtnText: { fontSize: 12, fontWeight: 'bold', color: Colors.primary, marginRight: 5 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
    customerName: { fontSize: 11, color: '#64748B', marginTop: 2, fontStyle: 'italic' },
    discountBadgeMini: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
        borderWidth: 0.5,
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 1,
        marginTop: 3,
        alignSelf: 'flex-end',
        gap: 3,
    },
    discountBadgeMiniText: {
        color: '#059669',
        fontSize: 9,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingVertical: 40,
    },
    emptyIconWrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyIconGlow: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(81, 130, 118, 0.08)',
        transform: [{ scale: 1.2 }],
    },
    emptyIconBg: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#518276',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        elevation: 2,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    refreshIcon: {
        marginRight: 6,
    },
    refreshButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default DistributorOrders;
