import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  Image,
} from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Send,
  X,
  MessageSquare,
  ShieldCheck,
  Clock,
  Camera,
} from 'lucide-react-native';
import { Colors } from '../../styles/theme';
import { useData } from '../../context/DataContext';
import { ENDPOINTS } from '../../api/apiConfig';

const DistributorSupportQuery = ({ navigation }) => {
  const { userData, token } = useData();
  const [formData, setFormData] = useState({
    query: '',
    category: 'Business',
    attachments: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Business',
    'Order Status',
    'Logistics',
    'Stock Inquiry',
    'Technical',
  ];

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSendQuery = async () => {
    if (!formData.query.trim()) return;
    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append('category', formData.category);
      data.append('message', formData.query.trim());
      
      // Included as requested, though your secure backend automatically 
      // fetches these from the database using your Auth Token!
      data.append('user_name', String(userData?.name || 'Partner'));
      data.append('email', String(userData?.email || ''));
      data.append('role', 'distributor');

      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach((file, index) => {
          data.append('images', {
            uri: file.uri,
            name: file.name || `image_${index}.jpg`,
            type: file.type || 'image/jpeg',
          });
        });
      }

      console.log('Distributor Support Payload:', data);

      const apiUrl = ENDPOINTS.DISTRIBUTOR_SUPPORT_QUERY || `${ENDPOINTS.DISTRIBUTOR_PRODUCTS.replace('/my-products', '')}/support-query`;
      console.log('Sending to URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // No Content-Type header so fetch sets the multipart/form-data boundary automatically
        },
        body: data,
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (response.ok) {
        setFormData({ query: '', category: 'Business', attachments: [] });
        alert(result.message || 'Your business query has been submitted.');
      } else {
        alert(result.detail || 'Failed to submit query. Please try again.');
      }
    } catch (error) {
      console.error('API Error:', error);
      alert('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickImage = async () => {
    if (formData.attachments.length >= 3) return;
    try {
      const [result] = await pick({ type: [types.images] });
      if (result) {
        updateForm('attachments', [
          ...formData.attachments,
          { 
            id: Date.now().toString(), 
            uri: result.uri, 
            name: result.name || result.fileName || `image_${Date.now()}.jpg`, 
            type: result.type || result.mimeType || 'image/jpeg' 
          },
        ]);
      }
    } catch (err) {}
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.headerBtn}
        >
          <Icon name="menu" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Support</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.welcomeCard}>
            <MessageSquare size={24} color={Colors.primary} />
            <View style={{ marginLeft: 15 }}>
              <Text style={styles.welcomeTitle}>Distributor Assistance</Text>
              <Text style={styles.welcomeSub}>
                For stock, billing or logistics issues.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Subject Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
          >
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => updateForm('category', cat)}
                style={[
                  styles.categoryChip,
                  formData.category === cat && styles.activeCategoryChip,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    formData.category === cat && styles.activeCategoryText,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.inputCard}>
            <Text style={styles.sectionLabel}>Query Details</Text>
            <TextInput
              style={styles.textInput}
              placeholder="How can we assist your business today?"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={6}
              value={formData.query}
              onChangeText={v => updateForm('query', v)}
              textAlignVertical="top"
            />
            <View style={styles.attachmentSection}>
              <View style={styles.attachmentList}>
                {formData.attachments.map(item => (
                  <View key={item.id} style={styles.attachmentWrapper}>
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.attachmentImg}
                    />
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() =>
                        updateForm(
                          'attachments',
                          formData.attachments.filter(a => a.id !== item.id),
                        )
                      }
                    >
                      <X size={12} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {formData.attachments.length < 3 && (
                  <TouchableOpacity
                    style={styles.addAttachmentBtn}
                    onPress={handlePickImage}
                  >
                    <Camera size={20} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              !formData.query.trim() && styles.disabledBtn,
            ]}
            onPress={handleSendQuery}
            disabled={!formData.query.trim() || isSubmitting}
          >
            <Text style={styles.submitBtnText}>
              {isSubmitting ? 'PROCESSING...' : 'SEND MESSAGE'}
            </Text>
            {!isSubmitting && (
              <Send size={18} color="#FFF" style={{ marginLeft: 10 }} />
            )}
          </TouchableOpacity>

          <View style={styles.trustRow}>
            <ShieldCheck size={16} color="#10B981" />
            <Text style={styles.trustText}>Enterprise Level Support</Text>
            <Clock size={16} color="#10B981" style={{ marginLeft: 15 }} />
            <Text style={styles.trustText}>Priority Response</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  scrollContent: { padding: 15, paddingBottom: 150 },
  welcomeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    alignItems: 'center',
  },
  welcomeTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E293B' },
  welcomeSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  categoryContainer: { marginBottom: 15 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeCategoryChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  activeCategoryText: { color: '#FFF' },
  inputCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 120,
  },
  attachmentSection: { marginTop: 15 },
  attachmentList: { flexDirection: 'row' },
  attachmentWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
  },
  attachmentImg: { width: '100%', height: '100%', borderRadius: 10 },
  removeBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  addAttachmentBtn: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 15,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
  },
  disabledBtn: { backgroundColor: '#CBD5E1' },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    alignItems: 'center',
  },
  trustText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 5,
    fontWeight: 'bold',
  },
});

export default DistributorSupportQuery;
