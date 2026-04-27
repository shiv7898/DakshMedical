import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeInDown,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Colors } from '../styles/theme';
import LottieView from 'lottie-react-native';

const DUMMY_PRODUCTS = [
  {
    id: '1',
    name: 'AirCurve 10 VAuto',
    type: 'BIPAP',
    price: 85000,
    mrp: 95000,
    discount: '10% OFF',
    isNew: true,
  },
  {
    id: '2',
    name: 'AirSense 10 Auto',
    type: 'APAP',
    price: 65000,
    mrp: 72000,
    discount: '8% OFF',
    isNew: true,
  },
  {
    id: '3',
    name: 'S9 Escape',
    type: 'CPAP',
    price: 45000,
    mrp: 50000,
    discount: '10% OFF',
    isNew: false,
  },
  {
    id: '4',
    name: 'DreamStation 2',
    type: 'APAP',
    price: 72000,
    mrp: 80000,
    discount: '10% OFF',
    isNew: true,
  },
  {
    id: '5',
    name: 'Lumis 150 VPAP',
    type: 'BIPAP',
    price: 120000,
    mrp: 135000,
    discount: '11% OFF',
    isNew: false,
  },
  {
    id: '6',
    name: 'AirMini Travel',
    type: 'CPAP',
    price: 55000,
    mrp: 60000,
    discount: '8% OFF',
    isNew: true,
  },
  {
    id: '7',
    name: 'BMC G3 A20',
    type: 'APAP',
    price: 38000,
    mrp: 45000,
    discount: '15% OFF',
    isNew: false,
  },
  {
    id: '9',
    name: 'Prisma 20A',
    type: 'APAP',
    price: 78000,
    mrp: 85000,
    discount: '8% OFF',
    isNew: true,
  },
  {
    id: '10',
    name: 'iBreeze Auto CPAP',
    type: 'APAP',
    price: 42000,
    mrp: 48000,
    discount: '12% OFF',
    isNew: false,
  },
  {
    id: '11',
    name: 'Fisher & Paykel SleepStyle',
    type: 'CPAP',
    price: 68000,
    mrp: 75000,
    discount: '9% OFF',
    isNew: false,
  },
  {
    id: '12',
    name: 'Yuwell YH-560',
    type: 'APAP',
    price: 32000,
    mrp: 38000,
    discount: '16% OFF',
    isNew: false,
  },
  {
    id: '13',
    name: 'AirSense 11 Auto',
    type: 'APAP',
    price: 95000,
    mrp: 105000,
    discount: '9% OFF',
    isNew: true,
  },
  {
    id: '14',
    name: 'BiPAP A40',
    type: 'BIPAP',
    price: 155000,
    mrp: 170000,
    discount: '8% OFF',
    isNew: true,
  },
  {
    id: '15',
    name: 'AirCurve 10 ST',
    type: 'BIPAP',
    price: 110000,
    mrp: 125000,
    discount: '12% OFF',
    isNew: false,
  },
  {
    id: '18',
    name: 'SomnoBalance',
    type: 'APAP',
    price: 62000,
    mrp: 70000,
    discount: '11% OFF',
    isNew: false,
  },
  {
    id: '19',
    name: 'Auto SV Ventilator',
    type: 'BIPAP',
    price: 185000,
    mrp: 210000,
    discount: '11% OFF',
    isNew: true,
  },
];

const CATEGORIES = ['ALL', 'CPAP', 'APAP', 'BIPAP'];
const SEARCH_BAR_HEIGHT = 56;

// ─── Memoized Product Card ───────────────────────────────────────────────────
const ProductCard = memo(({ item, index, onPress }) => (
  <Animated.View
    // entering={FadeInDown.delay(index * 40).springify()}
    layout={Layout.springify()}
    style={styles.productCard}
  >
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.cardInner}
      onPress={onPress}
    >
      {/* Image Section */}
      <View style={styles.imageSection}>
        {item.isNew ? (
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>NEW</Text>
          </View>
        ) : null}
        <TouchableOpacity style={styles.wishlistBtn}>
          <Icon name="heart-outline" size={16} color="#94A3B8" />
        </TouchableOpacity>
        {/* <Icon name="air-filter" size={55} color="#CBD5E1" /> */}
        <Image
          source={require('../assets/img/machine1.png')}
          style={{ width: 140, height: 140, resizeMode: 'contain' }}
        />
        <View style={styles.brandTag}>
          <Text style={styles.brandTagText}>AIRSINE Choice</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.cardInfo}>
        <Text style={styles.productTypeTag}>{item.type}</Text>
        <Text style={styles.productNameText} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.ratingRow}>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>4.8</Text>
            <Icon name="star" size={8} color="#FFF" />
          </View>
          <Text style={styles.reviewCount}>(1.2k)</Text>
        </View>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.finalPrice}>
              {'\u20B9'}
              {item.price.toLocaleString()}
            </Text>
            <View style={styles.mrpRow}>
              <Text style={styles.mrpText}>
                {'\u20B9'}
                {item.mrp.toLocaleString()}
              </Text>
              <Text style={styles.discountPercent}>{item.discount}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.buyBtn} onPress={onPress}>
            <Icon name="cart-plus" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  </Animated.View>
));

// ─── Main Screen ─────────────────────────────────────────────────────────────
const ProductCatalogScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [filteredProducts, setFilteredProducts] = useState(DUMMY_PRODUCTS);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);

  const searchVisible = useSharedValue(1);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    const result = DUMMY_PRODUCTS.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === 'ALL' || p.type === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredProducts(result);
  }, [search, selectedCategory]);

  const onScroll = useCallback(e => {
    const currentY = e.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    if (diff > 5 && currentY > 40) {
      searchVisible.value = withTiming(0, { duration: 200 });
    } else if (diff < -5) {
      searchVisible.value = withTiming(1, { duration: 200 });
    }
    lastScrollY.current = currentY;
  }, []);

  const animatedSearchStyle = useAnimatedStyle(() => ({
    height: interpolate(
      searchVisible.value,
      [0, 1],
      [0, SEARCH_BAR_HEIGHT],
      Extrapolate.CLAMP,
    ),
    opacity: interpolate(
      searchVisible.value,
      [0, 1],
      [0, 1],
      Extrapolate.CLAMP,
    ),
    overflow: 'hidden',
  }));

  const openOrderModal = useCallback(product => {
    setSelectedProduct(product);
    setOrderQuantity(1);
    setIsOrderModalVisible(true);
  }, []);

  const closeOrderModal = useCallback(() => {
    setIsOrderModalVisible(false);
    setSelectedProduct(null);
  }, []);

  const incrementQuantity = () => setOrderQuantity(prev => prev + 1);
  const decrementQuantity = () =>
    setOrderQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handlePlaceOrder = () => {
    if (!selectedProduct) return;

    // Comprehensive order data for future API POST
    const orderData = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productType: selectedProduct.type,
      quantity: orderQuantity,
      unitPrice: selectedProduct.price,
      unitMRP: selectedProduct.mrp,
      discount: selectedProduct.discount,
      totalAmount: selectedProduct.price * orderQuantity,
      currency: 'INR',
      orderDate: new Date().toISOString(),
      status: 'PENDING',
      customerDetails: {
        name: 'John Doe',
        phone: '+91 9876543210',
        address: {
          building: 'Airesine Heights, Flat 402',
          locality: 'Tech Park Area, Sector 62',
          district: 'Noida',
          state: 'Uttar Pradesh',
          pincode: '201301',
        },
      },
    };

    console.log('--- ORDER SUMMARY (READY FOR API) ---');
    console.log(JSON.stringify(orderData, null, 2));
    console.log('------------------------------------');
 
    closeOrderModal();
    
    // Show Success Animation
    setIsSuccessVisible(true);
    
    // Auto-hide after 3 seconds and navigate
    setTimeout(() => {
        setIsSuccessVisible(false);
        navigation.navigate('MyOrders');
    }, 3000);
  };

  const renderProduct = useCallback(
    ({ item, index }) => (
      <ProductCard
        item={item}
        index={index}
        onPress={() => openOrderModal(item)}
      />
    ),
    [openOrderModal],
  );

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Catalog</Text>
        <View style={{ width: 44 }} />
      </View>

      <Animated.View style={[styles.searchWrapper, animatedSearchStyle]}>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={20} color="#94A3B8" />
          <TextInput
            placeholder="Search CPAP, APAP, BIPAP..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchField}
            placeholderTextColor="#94A3B8"
          />
          {search !== '' ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close-circle" size={17} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>

      <View style={styles.filterBar}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item)}
              style={[
                styles.chip,
                selectedCategory === item && styles.activeChip,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedCategory === item && styles.activeChipText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isInitialLoading ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          numColumns={2}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.mainGrid}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          ListEmptyComponent={
            <View style={styles.emptyCatalog}>
              <Icon name="cube-scan" size={70} color="#E2E8F0" />
              <Text style={styles.emptyCatalogText}>
                No matching products found
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={isOrderModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeOrderModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeOrderModal}
          />
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.orderModalContainer}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Summary</Text>
              <TouchableOpacity onPress={closeOrderModal}>
                <Icon name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.orderProductInfo}>
                  <Image
                    source={require('../assets/img/machine1.png')}
                    style={styles.modalProductImage}
                  />
                  <View style={styles.modalProductDetails}>
                    <Text style={styles.modalProductType}>
                      {selectedProduct.type}
                    </Text>
                    <Text style={styles.modalProductName}>
                      {selectedProduct.name}
                    </Text>
                    <View style={styles.modalQtyRow}>
                      <Text style={styles.modalProductPrice}>
                        {'\u20B9'}
                        {selectedProduct.price.toLocaleString()}
                      </Text>
                      <View style={styles.quantityControlsSmall}>
                        <TouchableOpacity
                          style={styles.qtyBtnSmall}
                          onPress={decrementQuantity}
                        >
                          <Icon name="minus" size={14} color={Colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyTextSmall}>{orderQuantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtnSmall}
                          onPress={incrementQuantity}
                        >
                          <Icon name="plus" size={14} color={Colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.dividerSmall} />

                {/* Delivery Info */}
                <View style={styles.deliverySection}>
                  <View style={styles.deliveryHeader}>
                    <Icon
                      name="map-marker-radius"
                      size={20}
                      color={Colors.primary}
                    />
                    <Text style={styles.deliveryTitle}>Deliver To:</Text>
                  </View>
                  <View style={styles.addressBox}>
                    <Text style={styles.customerName}>John Doe</Text>
                    <Text style={styles.addressText}>
                      Airesine Heights, Flat 402, Sector 62
                    </Text>
                    <Text style={styles.addressText}>
                      Noida, Uttar Pradesh - 201301
                    </Text>
                  </View>
                </View>

                <View style={styles.dividerSmall} />

                <View style={styles.priceSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Unit MRP</Text>
                    <Text style={styles.summaryValueMRP}>
                      {'\u20B9'}
                      {selectedProduct.mrp.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount</Text>
                    <Text style={styles.summaryValueDiscount}>
                      -{selectedProduct.discount}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Subtotal ({orderQuantity} units)
                    </Text>
                    <Text style={styles.summaryValue}>
                      {'\u20B9'}
                      {(selectedProduct.price * orderQuantity).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Shipping</Text>
                    <Text style={styles.summaryValueFree}>FREE</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalValue}>
                      {'\u20B9'}
                      {(selectedProduct.price * orderQuantity).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.placeOrderBtn}
                  onPress={handlePlaceOrder}
                >
                  <Text style={styles.placeOrderBtnText}>Confirm Order</Text>
                  <Icon
                    name="check-circle"
                    size={20}
                    color="#FFF"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* ── Order Success Modal ── */}
      <Modal
        visible={isSuccessVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.successOverlay}>
          <Animated.View 
            entering={FadeInDown.springify()}
            style={styles.successContent}
          >
            <LottieView
              source={require('../assets/animations/Success.json')}
              autoPlay
              loop={false}
              style={styles.successLottie}
            />
            <Text style={styles.thankYouText}>Thank You!</Text>
            <Text style={styles.successTitle}>Order Placed Successfully</Text>
            <Text style={styles.successMessage}>Your medical supplies are being prepared and will be shipped soon.</Text>
            
            <View style={styles.redirectBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.redirectText}>Redirecting to My Orders...</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F1F5F9' },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : 20,
    paddingBottom: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  headerBtn: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },

  /* Search */
  searchWrapper: {
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchField: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#334155',
    padding: 0,
  },

  /* Filter Chips */
  filterBar: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterList: { paddingHorizontal: 14 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeChip: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  activeChipText: { color: '#FFF' },

  /* Grid */
  mainGrid: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between' },

  /* Product Card */
  productCard: { width: '48.5%', marginBottom: 12 },
  cardInner: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  imageSection: {
    height: 120,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    zIndex: 2,
  },
  topBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  wishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  brandTag: {
    position: 'absolute',
    bottom: 5,
    left: 6,
    backgroundColor: 'rgba(81,130,118,0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  brandTagText: { fontSize: 8, fontWeight: 'bold', color: Colors.primary },

  cardInfo: { padding: 10 },
  productTypeTag: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    marginBottom: 2,
  },
  productNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    height: 15,
  },

  ratingRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginRight: 4,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
    marginRight: 2,
  },
  reviewCount: { fontSize: 10, color: '#94A3B8' },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  finalPrice: { fontSize: 15, fontWeight: '900', color: '#1E293B' },
  mrpRow: { flexDirection: 'row', alignItems: 'center' },
  mrpText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  discountPercent: { fontSize: 11, fontWeight: 'bold', color: '#22C55E' },
  buyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Empty State */
  emptyCatalog: { marginTop: 60, alignItems: 'center' },
  emptyCatalogText: {
    marginTop: 12,
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },

  /* Order Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  orderModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  orderProductInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalProductImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  modalProductDetails: {
    flex: 1,
    marginLeft: 20,
  },
  modalProductType: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalProductName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalProductPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  qtyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginHorizontal: 20,
  },
  priceSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
  },
  summaryValueFree: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '800',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  placeOrderBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  placeOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  /* Delivery Section */
  deliverySection: {
    marginBottom: 8,
  },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginLeft: 8,
  },
  addressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    lineHeight: 18,
  },

  /* New Modern Refinements */
  dividerSmall: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  modalQtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  quantityControlsSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 2,
  },
  qtyBtnSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyTextSmall: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginHorizontal: 12,
  },
  summaryValueMRP: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  summaryValueDiscount: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  /* Success Modal */
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  successLottie: {
    width: 180,
    height: 180,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 4,
    textAlign: 'center',
  },
  thankYouText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  successMessage: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  redirectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  redirectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 10,
  },
});

export default ProductCatalogScreen;
