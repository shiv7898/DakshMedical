import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Colors, Spacing, Typography } from '../styles/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const MACHINE_TYPES = [
    { id: 'CPAP', name: 'Standard CPAP', description: 'Continuous pressure delivery' },
    { id: 'AutoCPAP', name: 'Auto CPAP', description: 'Automatic pressure adjustment' },
    { id: 'BiPAP', name: 'BiPAP / ASV', description: 'Advanced dual-pressure system' },
];

const MachineSelectionScreen = ({ navigation }) => {
    const handleSelect = (machineType) => {
        navigation.navigate('ImportLog', { machineType });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelect(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Icon name="responsive" size={30} color={Colors.primary} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.machineName}>{item.name}</Text>
                <Text style={styles.machineDesc}>{item.description}</Text>
            </View>
            <Icon name="chevron-right" size={24} color={Colors.accent} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="close" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Device</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Machine Category</Text>
                <Text style={styles.subtitle}>Please select the type of device you are using to ensure accurate data parsing.</Text>

                <FlatList
                    data={MACHINE_TYPES}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.m,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 14,
        paddingBottom: 14,
        backgroundColor: Colors.primary,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
    },
    title: {
        ...Typography.header,
        marginTop: Spacing.m,
    },
    subtitle: {
        ...Typography.body,
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
        lineHeight: 20,
    },
    list: {
        paddingVertical: Spacing.s,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: Spacing.m,
        marginBottom: Spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
        shadowColor: Colors.primary,
        shadowOpacity: 0.05,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: '#F0F7FF',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#F3F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.m,
    },
    textContainer: {
        flex: 1,
    },
    machineName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    machineDesc: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
});

export default MachineSelectionScreen;
