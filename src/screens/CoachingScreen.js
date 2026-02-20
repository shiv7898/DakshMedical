import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';

const CoachingScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Coaching & Mentors</Text>

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
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1C1E',
        marginBottom: 20,
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
