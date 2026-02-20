import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const ReportsScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.text}>Reports Screen</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    text: { fontSize: 18, color: '#7B8D9E' },
});

export default ReportsScreen;
