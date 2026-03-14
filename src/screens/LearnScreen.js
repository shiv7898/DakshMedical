import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, StatusBar, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../styles/theme';

const LearnScreen = () => {
    const courses = [
        { id: '1', title: 'Medical Ethics 101', duration: '2h 15m' },
        { id: '2', title: 'Advanced Diagnostics', duration: '4h 30m' },
        { id: '3', title: 'Patient Communication', duration: '1h 45m' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Learning Library</Text>
            </View>
            <View style={styles.content}>
                <FlatList
                    data={courses}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.courseCard}>
                            <View style={styles.courseInfo}>
                                <Text style={styles.courseTitle}>{item.title}</Text>
                                <Text style={styles.courseDuration}>{item.duration}</Text>
                            </View>
                            <View style={styles.playButton}>
                                <Icon name="play" size={20} color="#0066FF" />
                            </View>
                        </TouchableOpacity>
                    )}
                />
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
    courseCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    courseInfo: {
        flex: 1,
    },
    courseTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1C1E',
    },
    courseDuration: {
        fontSize: 14,
        color: '#7B8D9E',
        marginTop: 4,
    },
    playButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E0EEFF',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default LearnScreen;
