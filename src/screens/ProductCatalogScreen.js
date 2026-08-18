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
import { Colors } from '../styles/theme';
import LottieView from 'lottie-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useData } from '../context/DataContext';
import { BASE_URL, ENDPOINTS } from '../api/apiConfig';

const CATEGORIES = ['ALL', 'CPAP', 'APAP', 'BPAP'];
const SEARCH_BAR_HEIGHT = 56;

// ─── Memoized Product Card ───────────────────────────────────────────────────
const ProductCard = memo(({ item, index, onPress }) => (
  <Animated.View layout={Layout.springify()} style={styles.productCard}>
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

        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: 140, height: 140, resizeMode: 'contain' }}
          />
        ) : (
          <View style={styles.noImagePlaceholder}>
            <Icon name="image-off-outline" size={40} color="#CBD5E1" />
            <Text style={styles.noImageText}>No Image</Text>
          </View>
        )}

        <View style={styles.brandTag}>
          <Text style={styles.brandTagText}>AIRSINE Choice</Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={styles.productTypeTag}>{item.type}</Text>
          <Text style={{fontSize: 10, color: '#64748B', fontWeight: 'bold'}}>{item.model_name}</Text>
        </View>
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
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);
  const [isOrderLoading, setIsOrderLoading] = useState(false);

  const { token, userData } = useData();

  const [referralInput, setReferralInput] = useState('');
  const [appliedReferral, setAppliedReferral] = useState(null);
  const [referralDiscountPercent, setReferralDiscountPercent] = useState(0);
  const [isVerifyingReferral, setIsVerifyingReferral] = useState(false);
  const [referralStatus, setReferralStatus] = useState({ success: null, error: null });

  const searchVisible = useSharedValue(1);
  const lastScrollY = useRef(0);

  const fetchProducts = async () => {
    try {
      setIsInitialLoading(true);
      const response = await fetch(`${ENDPOINTS.PRODUCTS}?page=1&limit=20`);
      const result = await response.json();

      console.log('📦 API Data Received:', result);

      if (result && result.data) {
        const transformed = result.data.map(p => {
          let imageUrl = null;
          const rawImage = p.product_image || p.image_url;

          if (rawImage) {
            if (rawImage.startsWith('http')) {
              // Extract the path after the domain/port (e.g., /uploads/products/img.png)
              const pathPart = rawImage.split(':8000')[1] || rawImage.split('/').slice(3).join('/');
              const cleanPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
              imageUrl = `${BASE_URL}${cleanPath}`;
            } else {
              // If it's just a filename or relative path
              const cleanFileName = rawImage.startsWith('/') ? rawImage.slice(1) : rawImage;
              // Check if it already includes the directory structure
              if (cleanFileName.includes('uploads/')) {
                imageUrl = `${BASE_URL}/${cleanFileName}`;
              } else {
                imageUrl = `${BASE_URL}/uploads/products/${cleanFileName}`;
              }
            }
          }

          console.log(`🔗 Resolved Image URL for ${p.product_name}:`, imageUrl);

          return {
            id: p.id.toString(),
            name: p.product_name,
            type: p.product_type,
            price: p.selling_price || p.unit_price,
            mrp: p.unit_mrp || p.unit_price,
            discount: `${p.discount}% OFF`,
            isNew: false,
            image: imageUrl,
            model_name: p.model_name || 'Generic',
            referral_discount: p.referral_discount || 0,
            tax_gst: p.tax_gst || 0,
          };
        });

        setProducts(transformed);
        setFilteredProducts(transformed);
      }
    } catch (error) {
      console.error('❌ Fetch Error:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, []),
  );

  useEffect(() => {
    const q = search.toLowerCase();
    const result = products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(q) || p.type.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === 'ALL' || p.type === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredProducts(result);
  }, [search, selectedCategory, products]);

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

      const response = await fetch(`${ENDPOINTS.VERIFY_REFERRAL}${referralInput.trim()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setAppliedReferral(referralInput.trim());
        setReferralDiscountPercent(selectedProduct?.referral_discount || 10);
        setReferralStatus({ success: `Applied! Discount active 🎉`, error: null });
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

    try {
      setIsOrderLoading(true);

      const orderPayload = {
        product_id: parseInt(selectedProduct.id),
        quantity: orderQuantity,
        referral_code: appliedReferral || undefined,
        customer_name: userData?.full_name || userData?.name || 'N/A',
        customer_phone: userData?.phone || 'N/A',
        building: userData?.home_address || userData?.homeAddress || 'N/A',
        locality: userData?.area || 'N/A',
        district: userData?.district || 'N/A',
        state: userData?.state || 'N/A',
        pincode: userData?.pincode || 'N/A',
      };

      console.log('🚀 Sending Buy Machine Request:', orderPayload);

      const response = await fetch(ENDPOINTS.BUY_MACHINE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const contentType = response.headers.get('content-type');
      let result;
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        console.error('❌ Non-JSON Response:', text);
        throw new Error(`Server returned ${response.status}: ${text}`);
      }

      console.log('✅ Buy Machine Response:', result);

      if (response.ok) {
        closeOrderModal();
        setIsSuccessVisible(true);

        setTimeout(() => {
          setIsSuccessVisible(false);
          navigation.navigate('MyOrders');
        }, 3000);
      } else {
        Alert.alert(
          'Order Failed',
          result.detail || result.error?.message || 'Something went wrong while placing your order.',
        );
      }
    } catch (error) {
      console.error('❌ Buy Machine Error:', error);
      Alert.alert(
        'Order Error',
        error.message || 'Could not connect to the server. Please check your internet.',
      );
    } finally {
      setIsOrderLoading(false);
    }
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

  const subtotal = selectedProduct ? selectedProduct.price * orderQuantity : 0;
  const referralDiscountAmount = subtotal * (referralDiscountPercent / 100);
  const amountBeforeTax = subtotal - referralDiscountAmount;
  const gstAmount = selectedProduct ? amountBeforeTax * (selectedProduct.tax_gst / 100) : 0;
  const totalPayable = amountBeforeTax + gstAmount;

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
            placeholder="Search CPAP, APAP, BPAP..."
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
                    <View style={[styles.modalProductImage, styles.noImagePlaceholder]}>
                      <Icon name="image-off-outline" size={28} color="#94A3B8" />
                    </View>
                  )}
                  <View style={styles.modalProductDetails}>
                    <Text style={styles.modalProductType}>{selectedProduct.type} • {selectedProduct.model_name}</Text>
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
                        {userData?.full_name || userData?.name || 'Authorized User'}
                      </Text>
                      <View style={styles.tagDivider} />
                      <Icon name="phone-outline" size={14} color="#64748B" />
                      <Text style={styles.customerPhone}>
                        {userData?.phone || '+91 9876543210'}
                      </Text>
                    </View>
                    <View style={styles.addressBody}>
                      <Text style={styles.addressText} numberOfLines={1}>
                        {userData?.home_address || userData?.homeAddress || 'Airesine Heights, Flat 402'}
                      </Text>
                      <Text style={styles.addressText} numberOfLines={1}>
                        {userData?.area || 'Tech Park Area, Sector 62'}
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
                    <Text style={styles.summaryLabel}>GST ({selectedProduct?.tax_gst || 0}%)</Text>
                    <Text style={styles.summaryValue}>
                      {'\u20B9'}{gstAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </Text>
                  </View>

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
                        Place Order
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
              source={require('../assets/animations/Success.json')}
              autoPlay
              loop={false}
              style={styles.successLottie}
            />
            <Text style={styles.thankYouText}>Thank You!</Text>
            <Text style={styles.successTitle}>Order Placed Successfully</Text>
            <Text style={styles.successMessage}>
              Your medical supplies are being prepared and will be shipped soon.
            </Text>

            <View style={styles.redirectBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.redirectText}>
                Redirecting to My Orders...
              </Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F1F5F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingTop:
      // Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 20 : 20,
      Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 1 : 20,

    paddingBottom: 10,
    elevation: 8,
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
  filterBar: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
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
  mainGrid: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 40 },
  columnWrapper: { justifyContent: 'space-between' },
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
  noImagePlaceholder: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  noImageText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
  },
  productNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
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
  emptyCatalog: { marginTop: 60, alignItems: 'center' },
  emptyCatalogText: {
    marginTop: 12,
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },
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
    backgroundColor: '#ECFDF5', // Soft, luxurious light brand green backdrop
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#D1FAE5', // Accent border line
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
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
    color: '#047857', // Accent label color
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#064E3B', // Rich deep title green
    marginBottom: 4,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  modalProductPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#047857',
  },
  deliverySection: { marginBottom: 2 },
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deliveryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginLeft: 6,
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
  dividerSmall: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
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
});

export default ProductCatalogScreen;
