import React, { useState, useRef } from 'react';
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
    Animated,
    Dimensions,
    Image,
} from 'react-native';
import { pick, types } from '@react-native-documents/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    Send,
    Image as ImageIcon,
    X,
    MessageSquare,
    HelpCircle,
    Clock,
    ShieldCheck,
    ChevronRight,
    Camera
} from 'lucide-react-native';
import { Colors } from '../styles/theme';

import { useData } from '../context/DataContext';
import { ENDPOINTS } from '../api/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SupportQueryScreen = ({ navigation }) => {
    const { userData, token } = useData();
    const [formData, setFormData] = useState({
        query: '',
        category: 'General',
        attachments: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['General', 'Technical', 'Machine', 'Billing', 'Report'];

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
            data.append('platform', Platform.OS);

            if (formData.attachments && formData.attachments.length > 0) {
                formData.attachments.forEach((file, index) => {
                    data.append('images', {
                        uri: file.uri,
                        name: file.name || `image_${index}.jpg`,
                        type: file.type || 'image/jpeg',
                    });
                });
            }

            console.log('Sending Query to Backend (Patient):', data);

            const response = await fetch(ENDPOINTS.SUPPORT_QUERY, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: data,
            });

            const result = await response.json();
            console.log('API Response:', result);

            if (response.ok) {
                setFormData({
                    query: '',
                    category: 'General',
                    attachments: [],
                });
                alert(result.message || 'Query Sent Successfully! Our team will contact you soon.');
            } else {
                alert('Failed to send query. Please try again.');
            }
        } catch (error) {
            console.error('API Error:', error);
            alert('Network error. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePickImage = async () => {
        if (formData.attachments.length >= 3) {
            alert('Maximum 3 attachments allowed');
            return;
        }
        try {
            const [result] = await pick({
                type: [types.images],
                mode: 'open',
            });
            if (result) {
                const newAttachments = [
                    ...formData.attachments, 
                    { 
                        id: Date.now().toString(), 
                        uri: result.uri, 
                        name: result.name || result.fileName || `image_${Date.now()}.jpg`, 
                        type: result.type || result.mimeType || 'image/jpeg' 
                    }
                ];
                updateForm('attachments', newAttachments);
            }
        } catch (err) {
            console.log('User cancelled or error:', err);
        }
    };

    const removeAttachment = (id) => {
        const filtered = formData.attachments.filter(a => a.id !== id);
        updateForm('attachments', filtered);
    };

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                    <Icon name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <Icon name="history" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : null}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Welcome Card */}
                    <View style={styles.welcomeCard}>
                        <View style={styles.welcomeIcon}>
                            <MessageSquare size={24} color={Colors.primary} />
                        </View>
                        <View style={styles.welcomeTextContainer}>
                            <Text style={styles.welcomeTitle}>How can we help?</Text>
                            <Text style={styles.welcomeSub}>Send us your query and we'll get back to you within 24 hours.</Text>
                        </View>
                    </View>

                    {/* Category Selection */}
                    <Text style={styles.sectionLabel}>Select Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => updateForm('category', cat)}
                                style={[
                                    styles.categoryChip,
                                    formData.category === cat && styles.activeCategoryChip
                                ]}
                            >
                                <Text style={[
                                    styles.categoryText,
                                    formData.category === cat && styles.activeCategoryText
                                ]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Query Input */}
                    <View style={styles.inputCard}>
                        <Text style={styles.sectionLabel}>Describe your issue</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type your message here..."
                            placeholderTextColor="#94A3B8"
                            multiline
                            numberOfLines={6}
                            value={formData.query}
                            onChangeText={(v) => updateForm('query', v)}
                            textAlignVertical="top"
                        />

                        {/* Attachments UI */}
                        <View style={styles.attachmentSection}>
                            <Text style={styles.attachmentLabel}>Attachments (Max {3 - formData.attachments.length} remaining)</Text>
                            <View style={styles.attachmentList}>
                                {formData.attachments.map((item) => (
                                    <View key={item.id} style={styles.attachmentWrapper}>
                                        <Image source={{ uri: item.uri }} style={styles.attachmentImg} />
                                        <TouchableOpacity
                                            style={styles.removeBtn}
                                            onPress={() => removeAttachment(item.id)}
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
                                        <Text style={styles.addAttachmentText}>Pick</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Trust Badges */}
                    <View style={styles.trustRow}>
                        <View style={styles.trustItem}>
                            <ShieldCheck size={16} color="#22C55E" />
                            <Text style={styles.trustText}>Secure</Text>
                        </View>
                        <View style={styles.trustItem}>
                            <Clock size={16} color="#22C55E" />
                            <Text style={styles.trustText}>24/7 Response</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <TouchableOpacity
                        style={[styles.submitBtn, !formData.query.trim() && styles.disabledBtn]}
                        onPress={handleSendQuery}
                        disabled={!formData.query.trim() || isSubmitting}
                    >
                        <Text style={styles.submitBtnText}>
                            {isSubmitting ? 'SENDING...' : 'SUBMIT QUERY'}
                        </Text>
                        {!isSubmitting && <Send size={18} color="#FFF" style={{ marginLeft: 8 }} />}
                    </TouchableOpacity>

                    {/* FAQ Quick Link */}
                    {/* <TouchableOpacity style={styles.faqBtn}>
                        <HelpCircle size={20} color={Colors.primary} />
                        <Text style={styles.faqText}>View Frequently Asked Questions</Text>
                        <ChevronRight size={18} color="#94A3B8" />
                    </TouchableOpacity> */}

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
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
    scrollContent: {
        padding: 12,
        paddingBottom: 20,
    },
    welcomeCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 10,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        alignItems: 'center',
    },
    welcomeIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(57, 118, 91, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    welcomeTextContainer: {
        flex: 1,
    },
    welcomeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 2,
    },
    welcomeSub: {
        fontSize: 11,
        color: '#64748B',
        lineHeight: 16,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    categoryContainer: {
        marginBottom: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#FFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeCategoryChip: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    activeCategoryText: {
        color: '#FFF',
    },
    inputCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 12,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    textInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        minHeight: 100,
    },
    attachmentSection: {
        marginTop: 16,
    },
    attachmentLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 10,
    },
    attachmentList: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attachmentWrapper: {
        width: 60,
        height: 60,
        borderRadius: 10,
        marginRight: 12,
        position: 'relative',
    },
    attachmentImg: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    removeBtn: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#EF4444',
        width: 18,
        height: 18,
        borderRadius: 9,
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
        backgroundColor: 'rgba(57, 118, 91, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addAttachmentText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: Colors.primary,
        marginTop: 2,
    },
    trustRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
    },
    trustItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
    },
    trustText: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 4,
        fontWeight: '500',
    },
    submitBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 14,
        height: 48,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        marginBottom: 10,
    },
    disabledBtn: {
        backgroundColor: '#CBD5E1',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    faqBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    faqText: {
        flex: 1,
        fontSize: 14,
        color: '#475569',
        fontWeight: '600',
        marginLeft: 12,
    },
});

export default SupportQueryScreen;
