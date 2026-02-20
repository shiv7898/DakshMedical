import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity>
                    <Icon name="settings" size={24} color="#1A1C1E" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Icon name="person" size={50} color="#0066FF" />
                        </View>
                        <View style={styles.badge}>
                            <Icon name="verified" size={16} color="#FFFFFF" />
                        </View>
                    </View>
                    <Text style={styles.name}>Shiv Kumar</Text>
                    <Text style={styles.patientId}>ID: CPAP-2026-9901</Text>
                    <View style={styles.tagGrid}>
                        <View style={styles.tag}><Text style={styles.tagText}>28 / Male</Text></View>
                        <View style={[styles.tag, { backgroundColor: '#E0F2F1' }]}><Text style={[styles.tagText, { color: '#00796B' }]}>Auto CPAP</Text></View>
                    </View>
                </View>

                {/* Info Sections */}
                <Section title="Health Information" icon="medical-services">
                    <InfoItem label="Height" value="178 cm" />
                    <InfoItem label="Weight" value="82 kg" />
                    <InfoItem label="BMI" value="25.9 (Normal)" />
                    <InfoItem label="Diagnosis" value="Moderate OSA" />
                    <InfoItem label="Pressure Range" value="4.0 - 12.0 cmH2O" />
                </Section>

                <Section title="Device Information" icon="devices">
                    <InfoItem label="Model" value="AirSense 11 Auto" />
                    <InfoItem label="Serial No" value="AS11-9238-120" />
                    <InfoItem label="Bluetooth" value="Connected" color="#4CAF50" />
                    <InfoItem label="Last Sync" value="Today, 7:15 AM" />
                </Section>

                <TouchableOpacity style={styles.logoutBtn}>
                    <Icon name="logout" size={20} color="#EF5350" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const Section = ({ title, icon, children }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Icon name={icon} size={20} color="#0066FF" />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {children}
    </View>
);

const InfoItem = ({ label, value, color = '#1A1C1E' }) => (
    <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, { color }]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A1C1E',
    },
    scrollContent: {
        padding: 20,
    },
    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#0066FF',
        padding: 4,
        borderRadius: 10,
    },
    name: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A1C1E',
    },
    patientId: {
        fontSize: 14,
        color: '#7B8D9E',
        marginTop: 4,
    },
    tagGrid: {
        flexDirection: 'row',
        marginTop: 15,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F0F2F5',
        marginHorizontal: 4,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1A1C1E',
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1A1C1E',
        marginLeft: 10,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
    },
    infoLabel: {
        fontSize: 14,
        color: '#7B8D9E',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        marginTop: 10,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#EF5350',
        marginLeft: 10,
    }
});

export default ProfileScreen;
