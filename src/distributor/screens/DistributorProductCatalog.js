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
  Alert,
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
import { Colors } from '../../styles/theme';
import LottieView from 'lottie-react-native';
import { useData } from '../../context/DataContext';
import { BASE_URL, ENDPOINTS } from '../../api/apiConfig';
import { useFocusEffect } from '@react-navigation/native';

// const DUMMY_PRODUCTS = [
//   {
//     id: '1',
//     name: 'AirCurve 10 VAuto',
//     type: 'BIPAP',
//     price: 85000,
//     mrp: 95000,
//     discount: '10% OFF',
//     isNew: true,
//   },
//   {
//     id: '2',
//     name: 'AirSense 10 Auto',
//     type: 'APAP',
//     price: 65000,
//     mrp: 72000,
//     discount: '8% OFF',
//     isNew: true,
//   },
//   {
//     id: '3',
//     name: 'S9 Escape',
//     type: 'CPAP',
//     price: 45000,
//     mrp: 50000,
//     discount: '10% OFF',
//     isNew: false,
//   },
//   {
//     id: '4',
//     name: 'DreamStation 2',
//     type: 'APAP',
//     price: 72000,
//     mrp: 80000,
//     discount: '10% OFF',
//     isNew: true,
//   },
//   {
//     id: '5',
//     name: 'Lumis 150 VPAP',
//     type: 'BIPAP',
//     price: 120000,
//     mrp: 135000,
//     discount: '11% OFF',
//     isNew: false,
//   },
//   {
//     id: '6',
//     name: 'AirMini Travel',
//     type: 'CPAP',
//     price: 55000,
//     mrp: 60000,
//     discount: '8% OFF',
//     isNew: true,
//   },
//   {
//     id: '7',
//     name: 'BMC G3 A20',
//     type: 'APAP',
//     price: 38000,
//     mrp: 45000,
//     discount: '15% OFF',
//     isNew: false,
//   },
//   {
//     id: '9',
//     name: 'Prisma 20A',
//     type: 'APAP',
//     price: 78000,
//     mrp: 85000,
//     discount: '8% OFF',
//     isNew: true,
//   },
//   {
//     id: '10',
//     name: 'iBreeze Auto CPAP',
//     type: 'APAP',
//     price: 42000,
//     mrp: 48000,
//     discount: '12% OFF',
//     isNew: false,
//   },
//   {
//     id: '11',
//     name: 'Fisher & Paykel SleepStyle',
//     type: 'CPAP',
//     price: 68000,
//     mrp: 75000,
//     discount: '9% OFF',
//     isNew: false,
//   },
//   {
//     id: '12',
//     name: 'Yuwell YH-560',
//     type: 'APAP',
//     price: 32000,
//     mrp: 38000,
//     discount: '16% OFF',
//     isNew: false,
//   },
//   {
//     id: '13',
//     name: 'AirSense 11 Auto',
//     type: 'APAP',
//     price: 95000,
//     mrp: 105000,
//     discount: '9% OFF',
//     isNew: true,
//   },
//   {
//     id: '14',
//     name: 'BiPAP A40',
//     type: 'BIPAP',
//     price: 155000,
//     mrp: 170000,
//     discount: '8% OFF',
//     isNew: true,
//   },
//   {
//     id: '15',
//     name: 'AirCurve 10 ST',
//     type: 'BIPAP',
//     price: 110000,
//     mrp: 125000,
//     discount: '12% OFF',
//     isNew: false,
//   },
//   {
//     id: '18',
//     name: 'SomnoBalance',
//     type: 'APAP',
//     price: 62000,
//     mrp: 70000,
//     discount: '11% OFF',
//     isNew: false,
//   },
//   {
//     id: '19',
//     name: 'Auto SV Ventilator',
//     type: 'BIPAP',
//     price: 185000,
//     mrp: 210000,
//     discount: '11% OFF',
//     isNew: true,
//   },
// ];

const CATEGORIES = ['ALL', 'CPAP', 'APAP', 'BIPAP'];
const SEARCH_BAR_HEIGHT = 56;

const ProductCard = memo(({ item, index, onPress }) => (
  <Animated.View layout={Layout.springify()} style={styles.productCard}>
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.cardInner}
      onPress={onPress}
    >
      <View style={styles.imageSection}>
        {item.isNew && (
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>NEW</Text>
          </View>
        )}
        <TouchableOpacity style={styles.wishlistBtn}>
          <Icon name="heart-outline" size={16} color="#94A3B8" />
        </TouchableOpacity>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: 140, height: 140, resizeMode: 'contain' }}
          />
        ) : (
          <Image
            source={require('../../assets/img/machine1.png')}
            style={{ width: 140, height: 140, resizeMode: 'contain' }}
          />
        )}
        <View style={styles.brandTag}>
          <Text style={styles.brandTagText}>DISTRIBUTOR PORTAL</Text>
        </View>
      </View>
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
          <Text style={styles.reviewCount}>(1.2k reviews)</Text>
        </View>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.finalPrice}>
              ₹{item.price.toLocaleString()}
            </Text>
            <View style={styles.mrpRow}>
              <Text style={styles.mrpText}>₹{item.mrp.toLocaleString()}</Text>
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

const DistributorProductCatalog = ({ navigation }) => {
  const { token, userData } = useData();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isOrderLoading, setIsOrderLoading] = useState(false);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [appliedReferral, setAppliedReferral] = useState(null);
  const [referralDiscountPercent, setReferralDiscountPercent] = useState(0);
  const [isVerifyingReferral, setIsVerifyingReferral] = useState(false);
  const [referralStatus, setReferralStatus] = useState({ success: null, error: null });

  const fetchProducts = useCallback(async () => {
    try {
      console.log('📡 Fetching Distributor Products from:', `${ENDPOINTS.DISTRIBUTOR_PRODUCTS}?page=1&limit=20`);
      const response = await fetch(`${ENDPOINTS.DISTRIBUTOR_PRODUCTS}?page=1&limit=20`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('📦 API Result:', result);

      if (response.ok && result.data) {
        const mappedProducts = result.data.map(item => ({
          id: item.id.toString(),
          name: item.product_name,
          type: item.product_type,
          price: item.unit_price,
          mrp: item.unit_mrp,
          discount: `${item.discount}% OFF`,
          isNew: true, // We can refine this later
          image: item.image_url,
          description: item.description
        }));
        setAllProducts(mappedProducts);
        setFilteredProducts(mappedProducts);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const searchVisible = useSharedValue(1);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const q = search.toLowerCase();
    const result = allProducts.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === 'ALL' || p.type === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredProducts(result);
  }, [search, selectedCategory, allProducts]);

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
    setReferralInput('');
    setAppliedReferral(null);
    setReferralDiscountPercent(0);
    setReferralStatus({ success: null, error: null });
    setIsOrderModalVisible(true);
  }, []);

  const closeOrderModal = useCallback(() => {
    setIsOrderModalVisible(false);
    setSelectedProduct(null);
  }, []);

  const incrementQuantity = () => setOrderQuantity(prev => prev + 1);
  const decrementQuantity = () =>
    setOrderQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const handleApplyReferral = async () => {
    if (!referralInput.trim()) {
      setReferralStatus({ success: null, error: 'Please enter a code' });
      return;
    }

    try {
      setIsVerifyingReferral(true);
      setReferralStatus({ success: null, error: null });

      const response = await fetch(`${BASE_URL}/orders/verify-referral/${referralInput.trim()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setAppliedReferral(referralInput.trim());
        setReferralDiscountPercent(result.discount_percent);
        setReferralStatus({ success: `Applied! ${result.discount_percent}% discount active 🎉`, error: null });
      } else {
        setReferralStatus({ success: null, error: result.detail || 'Invalid referral code' });
        setAppliedReferral(null);
        setReferralDiscountPercent(0);
      }
    } catch (error) {
      console.error('❌ Verify Referral Error:', error);
      setReferralStatus({ success: null, error: 'Network error verifying code' });
    } finally {
      setIsVerifyingReferral(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedProduct) return;
    
    setIsOrderLoading(true);
    try {
      const orderPayload = {
        product_id: parseInt(selectedProduct.id),
        quantity: orderQuantity,
        referral_code: appliedReferral || undefined,
        customer_name: userData?.name || 'Distributor Order',
        customer_phone: userData?.phone || '',
        building: userData?.home_address || 'Airsine Heights, Flat 402',
        locality: userData?.area || 'Tech Park Area, Sector 62',
        district: userData?.district || 'Noida',
        state: userData?.state || 'Uttar Pradesh',
        pincode: userData?.pincode || '201301',
      };

      console.log('🚀 Sending Distributor Buy Machine Request:', orderPayload);

      const response = await fetch(ENDPOINTS.DISTRIBUTOR_BUY_MACHINE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();
      console.log('✅ Distributor Buy Machine Response:', result);

      if (response.ok) {
        closeOrderModal();
        setIsSuccessVisible(true);
        setTimeout(() => {
          setIsSuccessVisible(false);
          navigation.navigate('DistributorOrders');
        }, 3000);
      } else {
        Alert.alert('Order Failed', result.detail || 'Something went wrong.');
      }
    } catch (error) {
      console.error('❌ Distributor Buy Machine Error:', error);
      Alert.alert('Network Error', 'Could not connect to the server.');
    } finally {
      setIsOrderLoading(false);
    }
  };

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setSelectedCategory('ALL');
    fetchProducts();
  }, [fetchProducts]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <View style={styles.emptyIconGlow} />
        <View style={styles.emptyIconBg}>
          <Icon name="clipboard-search-outline" size={42} color={Colors.primary} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptySubtitle}>
        We couldn't find any products matching your search or chosen category. Try resetting your filters.
      </Text>
      <TouchableOpacity style={styles.resetButton} onPress={handleResetFilters} activeOpacity={0.85}>
        <Icon name="filter-remove-outline" size={16} color="#FFF" style={styles.resetIcon} />
        <Text style={styles.resetButtonText}>Reset Filters</Text>
      </TouchableOpacity>
    </View>
  );

  const subtotal = selectedProduct ? selectedProduct.price * orderQuantity : 0;
  const referralDiscountAmount = subtotal * (referralDiscountPercent / 100);
  const totalPayable = subtotal - referralDiscountAmount;

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2D4F44" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Product Catalog</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('DistributorOrders')}
          style={styles.headerBtn}
        >
          <Icon name="cart-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.searchWrapper, animatedSearchStyle]}>
        <View style={styles.searchBox}>
          <Icon name="magnify" size={20} color="#94A3B8" />
          <TextInput
            placeholder="Search stock products..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchField}
            placeholderTextColor="#94A3B8"
          />
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
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={({ item, index }) => (
            <ProductCard
              item={item}
              index={index}
              onPress={() => openOrderModal(item)}
            />
          )}
          numColumns={2}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.mainGrid,
            filteredProducts.length === 0 && { flexGrow: 1, justifyContent: 'center' }
          ]}
          columnWrapperStyle={filteredProducts.length > 0 ? styles.columnWrapper : null}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          ListEmptyComponent={renderEmptyState}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.premiumHeaderBadge}>
                  <Icon name="shield-check" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.modalTitle}>Secure Checkout</Text>
              </View>
              <TouchableOpacity onPress={closeOrderModal} style={styles.closeModalBtn}>
                <Icon name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                {/* 1. PRODUCT INFO PREMIUM CARD */}
                <View style={styles.premiumProductCard}>
                  {selectedProduct.image ? (
                    <Image
                      source={{ uri: selectedProduct.image }}
                      style={styles.modalProductImage}
                    />
                  ) : (
                    <Image
                      source={require('../../assets/img/machine1.png')}
                      style={styles.modalProductImage}
                    />
                  )}
                  <View style={styles.modalProductDetails}>
                    <Text style={styles.modalProductType}>{selectedProduct.type}</Text>
                    <Text style={styles.modalProductName} numberOfLines={1}>{selectedProduct.name}</Text>
                    <View style={styles.modalQtyRow}>
                      <Text style={styles.modalProductPrice}>
                        {'\u20B9'}{selectedProduct.price.toLocaleString()}
                      </Text>
                      <View style={styles.quantityControlsSmall}>
                        <TouchableOpacity style={styles.qtyBtnSmall} onPress={decrementQuantity}>
                          <Icon name="minus" size={12} color="#1E293B" />
                        </TouchableOpacity>
                        <Text style={styles.qtyTextSmall}>{orderQuantity}</Text>
                        <TouchableOpacity style={styles.qtyBtnSmall} onPress={incrementQuantity}>
                          <Icon name="plus" size={12} color="#1E293B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 2. DELIVERY ADDRESS CARD */}
                <View style={styles.premiumSectionCard}>
                  <View style={styles.premiumSectionHeader}>
                    <Icon name="map-marker-radius-outline" size={18} color={Colors.primary} />
                    <Text style={styles.premiumSectionTitle}>Delivery Address</Text>
                  </View>
                  <View style={styles.premiumAddressBox}>
                    <View style={styles.addressHeaderRow}>
                      <Icon name="account-circle-outline" size={16} color="#64748B" />
                      <Text style={styles.customerName}>
                        {userData?.name || 'Authorized Partner'}
                      </Text>
                      <View style={styles.tagDivider} />
                      <Icon name="phone-outline" size={14} color="#64748B" />
                      <Text style={styles.customerPhone}>
                        {userData?.phone || '+91 9876543210'}
                      </Text>
                    </View>
                    <View style={styles.addressBody}>
                      <Text style={styles.addressText} numberOfLines={1}>
                        {userData?.home_address || 'Airsine Heights, Flat 402'}
                      </Text>
                      <Text style={styles.addressText} numberOfLines={1}>
                        {userData?.area || 'Sector 62'}
                      </Text>
                      <Text style={styles.addressText} numberOfLines={1}>
                        {`${userData?.district || 'Noida'}, ${userData?.state || 'Uttar Pradesh'} - ${userData?.pincode || '201301'}`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 3. REFERRAL APPLY CARD */}
                <View style={styles.premiumSectionCard}>
                  <View style={styles.premiumSectionHeader}>
                    <Icon name="ticket-percent-outline" size={18} color={Colors.primary} />
                    <Text style={styles.premiumSectionTitle}>Offers & Referral</Text>
                  </View>
                  <View style={styles.referralInputWrapper}>
                    <TextInput
                      style={[
                        styles.referralTextInput,
                        appliedReferral ? styles.referralInputSuccess : null,
                        referralStatus.error ? styles.referralInputError : null,
                      ]}
                      placeholder="Enter referral code for 10% discount"
                      placeholderTextColor="#94A3B8"
                      value={referralInput}
                      onChangeText={text => {
                        setReferralInput(text);
                        if (referralStatus.error) {
                          setReferralStatus({ success: null, error: null });
                        }
                      }}
                      editable={!isVerifyingReferral && !appliedReferral}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={[
                        styles.referralApplyBtn,
                        appliedReferral ? styles.referralAppliedBtn : null,
                      ]}
                      onPress={handleApplyReferral}
                      disabled={isVerifyingReferral || !referralInput || !!appliedReferral}
                    >
                      {isVerifyingReferral ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : appliedReferral ? (
                        <Icon name="check" size={16} color="#FFF" />
                      ) : (
                        <Text style={styles.referralApplyBtnText}>Apply</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Status Messages */}
                  {referralStatus.success && (
                    <View style={styles.referralMsgSuccessBox}>
                      <Icon name="check-decagram" size={14} color="#10B981" />
                      <Text style={styles.referralMsgSuccessText}>
                        {referralStatus.success}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setAppliedReferral(null);
                          setReferralDiscountPercent(0);
                          setReferralInput('');
                          setReferralStatus({ success: null, error: null });
                        }}
                        style={styles.referralMsgCloseBtn}
                      >
                        <Icon name="close" size={14} color="#10B981" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {referralStatus.error && (
                    <View style={styles.referralMsgErrorBox}>
                      <Icon name="alert-circle-outline" size={14} color="#EF4444" />
                      <Text style={styles.referralMsgErrorText}>
                        {referralStatus.error}
                      </Text>
                    </View>
                  )}
                </View>

                {/* 4. BILL DETAILS */}
                <View style={styles.premiumBillCard}>
                  <View style={styles.billHeader}>
                    <Icon name="receipt-outline" size={16} color="#475569" />
                    <Text style={styles.billTitle}>Bill Summary</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Unit MRP</Text>
                    <Text style={styles.summaryValueMRP}>
                      {'\u20B9'}{selectedProduct.mrp.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Product Discount</Text>
                    <Text style={styles.summaryValueDiscount}>
                      -{selectedProduct.discount}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Subtotal ({orderQuantity} {orderQuantity > 1 ? 'units' : 'unit'})
                    </Text>
                    <Text style={styles.summaryValue}>
                      {'\u20B9'}{subtotal.toLocaleString()}
                    </Text>
                  </View>

                  {/* Referral Discount Row */}
                  {appliedReferral && (
                    <View style={styles.summaryRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.referralSummaryLabel}>Referral Discount</Text>
                        <View style={styles.referralTagMini}>
                          <Text style={styles.referralTagMiniText}>{appliedReferral}</Text>
                        </View>
                      </View>
                      <Text style={styles.referralSummaryValue}>
                        -{'\u20B9'}{referralDiscountAmount.toLocaleString()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Shipping & Handling</Text>
                    <Text style={styles.summaryValueFree}>FREE</Text>
                  </View>

                  <View style={styles.billDivider} />

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalValue}>
                      {'\u20B9'}{totalPayable.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* CONFIRM ACTION BUTTON */}
                <TouchableOpacity
                  style={[
                    styles.placeOrderBtn,
                    isOrderLoading && { opacity: 0.7 },
                  ]}
                  onPress={handlePlaceOrder}
                  disabled={isOrderLoading}
                >
                  {isOrderLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.placeOrderBtnText}>
                        Place Stock Order
                      </Text>
                      <Icon
                        name="arrow-right"
                        size={18}
                        color="#FFF"
                        style={{ marginLeft: 8 }}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={isSuccessVisible} transparent={true} animationType="fade">
        <View style={styles.successOverlay}>
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.successContent}
          >
            <LottieView
              source={require('../../assets/animations/Success.json')}
              autoPlay
              loop={false}
              style={styles.successLottie}
            />
            <Text style={styles.thankYouText}>Thank You!</Text>
            <Text style={styles.successTitle}>Order Placed Successfully</Text>
            <Text style={styles.successMessage}>
              Your wholesale order has been submitted to Airsine logistics.
            </Text>

            <View style={styles.redirectBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.redirectText}>
                Redirecting to Stock Orders...
              </Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D4F44',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  searchWrapper: {
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchField: { flex: 1, marginLeft: 8, fontSize: 14, color: '#334155' },
  filterBar: { backgroundColor: '#FFF', paddingVertical: 10 },
  filterList: { paddingHorizontal: 14 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeChip: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  activeChipText: { color: '#FFF' },
  mainGrid: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 150 },
  columnWrapper: { justifyContent: 'space-between' },
  productCard: { width: '48.5%', marginBottom: 12 },
  cardInner: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  imageSection: {
    height: 130,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  topBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  brandTag: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  brandTagText: { fontSize: 8, fontWeight: 'bold', color: '#10B981' },
  cardInfo: { padding: 12 },
  productTypeTag: { fontSize: 9, fontWeight: '900', color: '#94A3B8' },
  productNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    // marginTop: 2,
    height: 35,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: -20 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 2,
  },
  reviewCount: { fontSize: 10, color: '#94A3B8', marginLeft: 5 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 1,
  },
  finalPrice: { fontSize: 16, fontWeight: '900', color: '#1E293B' },
  mrpRow: { flexDirection: 'row', alignItems: 'center' },
  mrpText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountPercent: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  buyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  orderModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1E293B' },
  premiumProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  modalProductImage: {
    width: 45,
    height: 45,
    resizeMode: 'contain',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  modalProductDetails: { 
    flex: 1, 
    marginLeft: 14,
    justifyContent: 'center',
  },
  modalProductType: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#064E3B',
    marginBottom: 4,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  modalProductPrice: { 
    fontSize: 16, 
    fontWeight: '900', 
    color: Colors.primary,
  },
  premiumHeaderBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    padding: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  premiumSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  premiumSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  premiumAddressBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginLeft: 4,
  },
  tagDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 6,
  },
  customerPhone: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 2,
  },
  addressBody: {
    paddingLeft: 20,
  },
  addressText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    lineHeight: 14,
    marginBottom: 1,
  },
  referralInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  referralTextInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  referralInputSuccess: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16,185,129,0.03)',
  },
  referralInputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.03)',
  },
  referralApplyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    height: 36,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  referralAppliedBtn: {
    backgroundColor: '#10B981',
  },
  referralApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  referralMsgSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(16,185,129,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    gap: 4,
  },
  referralMsgSuccessText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
  },
  referralMsgCloseBtn: {
    padding: 2,
    marginLeft: 'auto',
  },
  referralMsgErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(239,68,68,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    gap: 4,
  },
  referralMsgErrorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#991B1B',
    flex: 1,
  },
  referralSummaryLabel: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '700',
  },
  referralTagMini: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  referralTagMiniText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: 0.5,
  },
  referralSummaryValue: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '800',
  },
  premiumBillCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
  },
  billTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  summaryValue: { fontSize: 13, color: '#1E293B', fontWeight: '700' },
  summaryValueFree: { fontSize: 13, color: '#10B981', fontWeight: '800' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  totalValue: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  placeOrderBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  placeOrderBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  modalQtyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  quantityControlsSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  qtyBtnSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyTextSmall: {
    fontSize: 12,
    fontWeight: '900',
    color: '#064E3B',
    marginHorizontal: 8,
  },
  summaryValueMRP: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  summaryValueDiscount: { fontSize: 14, color: '#22C55E', fontWeight: '800' },
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
  },
  successLottie: { width: 180, height: 180 },
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
  },
  successMessage: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    width: '100%',
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
    fontWeight: '800',
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
    paddingHorizontal: 16,
  },
  resetButton: {
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
  resetIcon: {
    marginRight: 6,
  },
  resetButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default DistributorProductCatalog;
