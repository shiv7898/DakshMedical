import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../styles/theme';

const CoachingScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mentors & Coaching</Text>
            </View>
            <View style={styles.content}>
                <View style={styles.coachCard}>
                    <View style={styles.avatarPlaceholder} />
                    <View style={styles.coachInfo}>
                        <Text style={styles.coachName}>Dr. James Wilson</Text>
                        <Text style={styles.coachSpecialty}>Surgical Specialist</Text>
                        <TouchableOpacity style={styles.messageButton}>
                            <Text style={styles.messageText}>Book Session</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.coachCard}>
                    <View style={styles.avatarPlaceholder} />
                    <View style={styles.coachInfo}>
                        <Text style={styles.coachName}>Dr. Emily Chen</Text>
                        <Text style={styles.coachSpecialty}>Pediatrician</Text>
                        <TouchableOpacity style={styles.messageButton}>
                            <Text style={styles.messageText}>Book Session</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 14,
        paddingBottom: 14,
        backgroundColor: '#1565C0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    content: {
        padding: 20,
    },
    coachCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#D1D9E6',
        marginRight: 15,
    },
    coachInfo: {
        flex: 1,
    },
    coachName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1C1E',
    },
    coachSpecialty: {
        fontSize: 14,
        color: '#7B8D9E',
        marginBottom: 10,
    },
    messageButton: {
        backgroundColor: '#0066FF',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    messageText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    }
});

export default CoachingScreen;
