import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Platform,
    Image,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../styles/theme';
import { useData } from '../context/DataContext';
import { useFocusEffect } from '@react-navigation/native';
import { BASE_URL, ENDPOINTS } from '../api/apiConfig';


const MOCK_ORDERS = [
    {
        id: 'ORD-7721',
        productName: 'AirCurve 10 VAuto',
        type: 'BIPAP',
        date: '2026-04-27',
        price: 85000,
        quantity: 1,
        status: 'PENDING',
    },
    {
        id: 'ORD-6542',
        productName: 'AirSense 10 Auto',
        type: 'APAP',
        date: '2026-04-20',
        price: 65000,
        quantity: 2,
        status: 'ACCEPTED',
    },
    {
        id: 'ORD-5531',
        productName: 'AirMini Travel',
        type: 'CPAP',
        date: '2026-04-15',
        price: 55000,
        quantity: 1,
        status: 'SHIPPED',
    },
];

const MyOrdersScreen = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { token } = useData();

    const fetchOrders = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true);
            
            console.log('📦 Fetching My Orders...');
            const response = await fetch(ENDPOINTS.MY_ORDERS, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            console.log('✅ My Orders Data:', result);

            if (response.ok && result.data) {
                const transformed = result.data.map(order => {
                    let imageUrl = null;
                    if (order.product_image) {
                        const cleanFileName = order.product_image.startsWith('/') ? order.product_image.slice(1) : order.product_image;
                        if (cleanFileName.includes('uploads/')) {
                            imageUrl = `${BASE_URL}/${cleanFileName}`;
                        } else {
                            imageUrl = `${BASE_URL}/uploads/products/${cleanFileName}`;
                        }
                    }

                    return {
                        id: (order.order_id || order.id || "").toString(),
                        productName: order.product_name,
                        type: order.product_type,
                        date: (order.order_date || order.created_at || "").split('T')[0],
                        price: order.unit_price,
                        quantity: order.quantity,
                        totalAmount: order.total_amount,
                        discountAmount: order.discount_amount,
                        finalAmount: order.final_amount,
                        referralCode: order.referral_code,
                        status: order.status || 'PENDING',
                        image: imageUrl,
                    };
                });

                setOrders(transformed);
            }
        } catch (error) {
            console.error('❌ Fetch Orders Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders(true);
    };


    const getStatusStyle = (status) => {
        switch (status) {
            case 'PENDING':
                return { bg: '#FFF7ED', text: '#EA580C', icon: 'clock-outline' };
            case 'ACCEPTED':
                return { bg: '#ECFDF5', text: '#10B981', icon: 'check-decagram' };
            case 'SHIPPED':
                return { bg: '#EFF6FF', text: '#3B82F6', icon: 'truck-delivery-outline' };
            case 'DELIVERED':
                return { bg: '#F5F3FF', text: '#8B5CF6', icon: 'package-variant-closed' };
            default:
                return { bg: '#F1F5F9', text: '#64748B', icon: 'help-circle-outline' };
        }
    };

    const renderOrderItem = ({ item }) => {
        const status = getStatusStyle(item.status);

        return (
            <TouchableOpacity 
                activeOpacity={0.7}
                style={styles.orderCard}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.orderIdGroup}>
                        <Text style={styles.orderIdLabel}>Order ID</Text>
                        <Text style={styles.orderIdValue}>{item.id}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <Icon name={status.icon} size={14} color={status.text} />
                        <Text style={[styles.statusText, { color: status.text }]}>{item.status}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    {item.image ? (
                        <Image
                            source={{ uri: item.image }}
                            style={styles.productImage}
                        />
                    ) : (
                        <View style={styles.productIconBox}>
                            <Icon name="air-filter" size={30} color={Colors.primary} />
                        </View>
                    )}
                    <View style={styles.productDetails}>
                        <Text style={styles.productName}>{item.productName}</Text>
                        <Text style={styles.productMeta}>{item.type} • {item.quantity} Unit{item.quantity > 1 ? 's' : ''}</Text>
                    </View>
                    <View style={styles.priceDetails}>
                        <Text style={styles.priceLabel}>Total Amount</Text>
                        <Text style={styles.priceValue}>
                            {'\u20B9'}
                            {(item.finalAmount !== undefined && item.finalAmount !== null
                                ? item.finalAmount
                                : item.price * item.quantity
                            ).toLocaleString()}
                        </Text>
                        {item.discountAmount > 0 ? (
                            <View style={styles.discountBadgeMini}>
                                <Icon name="tag" size={10} color="#10B981" />
                                <Text style={styles.discountBadgeMiniText}>
                                    Saved {'\u20B9'}{item.discountAmount.toLocaleString()}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.dateGroup}>
                        <Icon name="calendar-month-outline" size={14} color="#94A3B8" />
                        <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                    <TouchableOpacity style={styles.trackBtn}>
                        <Text style={styles.trackBtnText}>Track Order</Text>
                        <Icon name="chevron-right" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Orders</Text>
                <View style={{ width: 44 }} />
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Fetching your orders...</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Icon name="shopping-search" size={80} color="#E2E8F0" />
                            <Text style={styles.emptyTitle}>No Orders Yet</Text>
                            <Text style={styles.emptySubtitle}>Your medical supply orders will appear here.</Text>
                            <TouchableOpacity 
                                style={styles.shopBtn}
                                onPress={() => navigation.navigate('ProductCatalog')}
                            >
                                <Text style={styles.shopBtnText}>Browse Catalog</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}

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
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        // paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 1 : 20,

        paddingBottom: 16,
        elevation: 8,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '900',
        color: '#FFF',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        marginBottom: 16,
    },
    orderIdGroup: {
        flexDirection: 'column',
    },
    orderIdLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
    orderIdValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '900',
        marginLeft: 6,
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    productIconBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productImage: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        resizeMode: 'contain',
    },
    productDetails: {
        flex: 1,
        marginLeft: 14,
    },
    productName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 2,
    },
    productMeta: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    priceDetails: {
        alignItems: 'flex-end',
    },
    priceLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    priceValue: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.primary,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    dateGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        marginLeft: 6,
    },
    trackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trackBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.primary,
        marginRight: 2,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
    shopBtn: {
        marginTop: 30,
        backgroundColor: Colors.primary,
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    shopBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
    },
});


export default MyOrdersScreen;
