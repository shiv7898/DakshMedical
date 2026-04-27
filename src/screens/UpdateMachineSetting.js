import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Dimensions,
    Switch,
    TextInput,
    Modal,
    FlatList,
    Animated, // Import legacy Animated for the picker logic
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Reanimated, {
    FadeInRight,
    FadeInDown,
    Layout,
    SlideInRight,
    FadeIn
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Spacing } from '../styles/theme';
import LottieView from 'lottie-react-native';

const { width, height: screenHeight } = Dimensions.get('window');

// Picker Constants (Defined globally to be accessible by styles)
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const UpdateMachineSetting = ({ navigation }) => {
    const [currentStep, setCurrentStep] = useState('main');

    // State for Settings
    const [settings, setSettings] = useState({
        therapyMode: 'Auto CPAP',
        // Therapy Auto
        minPressure: '4.0',
        maxPressure: '15.0',
        startPressure: '4.0',
        rampDuration: '20',
        pressureOff: '2.0',
        // Therapy CPAP
        cpapPressure: '10.0',
        // Alerts
        leakAlert: true,
        lowPressureAlarm: '5.0',
        highRateAlarm: '30',
        lowRateAlarm: '10',
        memoryCardError: true,
        autoOn: true,
        autoOff: true,
        // Display
        brightness: '5',
        preheatTray: true,
        sdTray: true,
        wifiTray: true,
        serviceTray: false,
        currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
        timeFormat: '24h',
        // Common
        preheatTime: '30',
        humidifierLevel: '3',
        maskSize: 'Small',
        maskType: 'Nasal',
        beep: true,
        serviceReminder: true,
    });

    const [pickerConfig, setPickerConfig] = useState({ visible: false, title: '', key: '', options: [] });

    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            const dateStr = now.toLocaleDateString('en-GB'); // DD/MM/YYYY

            setSettings(prev => ({
                ...prev,
                currentTime: time,
                date: dateStr
            }));
        };

        updateDateTime();
    }, []);

    const updateValue = (key, val) => {
        setSettings(prev => ({ ...prev, [key]: val }));
    };

    const navigateTo = (step) => {
        setCurrentStep(step);
    };

    const goBack = () => {
        if (currentStep === 'main') {
            navigation.goBack();
        } else if (['therapy', 'alert', 'display', 'common'].includes(currentStep)) {
            setCurrentStep('setup');
        } else if (currentStep === 'setup' || currentStep === 'no-data') {
            setCurrentStep('main');
        } else {
            setCurrentStep('main');
        }
    };

    const handleSave = () => {
        // Collect all data from Setup section (Therapy, Alert, Display, Common)
        const setupData = {
            therapy: {
                therapyMode: settings.therapyMode,
                minPressure: settings.minPressure,
                maxPressure: settings.maxPressure,
                startPressure: settings.startPressure,
                rampDuration: settings.rampDuration,
                pressureOff: settings.pressureOff,
                cpapPressure: settings.cpapPressure,
            },
            alert: {
                leakAlert: settings.leakAlert,
                lowPressureAlarm: settings.lowPressureAlarm,
                highRateAlarm: settings.highRateAlarm,
                lowRateAlarm: settings.lowRateAlarm,
                memoryCardError: settings.memoryCardError,
                autoOn: settings.autoOn,
                autoOff: settings.autoOff,
            },
            display: {
                brightness: settings.brightness,
                preheatTray: settings.preheatTray,
                sdTray: settings.sdTray,
                wifiTray: settings.wifiTray,
                serviceTray: settings.serviceTray,
                currentTime: settings.currentTime,
                date: settings.date,
                timeFormat: settings.timeFormat,
            },
            common: {
                preheatTime: settings.preheatTime,
                humidifierLevel: settings.humidifierLevel,
                maskSize: settings.maskSize,
                maskType: settings.maskType,
                beep: settings.beep,
                serviceReminder: settings.serviceReminder,
            }
        };

        console.log('--- SETUP DATA CONSOLE ---');
        console.log('Therapy Data:', setupData.therapy);
        console.log('Alert Data:', setupData.alert);
        console.log('Display Data:', setupData.display);
        console.log('Common Data:', setupData.common);
        console.log('Complete Post Payload:', setupData);
        console.log('--------------------------');

        // This data is now ready to be posted to an API
        // Example: api.post('/machine/settings', setupData)
    };

    const generateOptions = (min, max, step = 0.5) => {
        const options = [];
        for (let i = min; i <= max; i = parseFloat((i + step).toFixed(2))) {
            options.push(i.toString());
        }
        return options;
    };

    const openPicker = (title, key, min, max, step, customOptions, iconColor, yPos) => {
        const options = customOptions || generateOptions(min, max, step);
        const popupHeight = 240; // Matching style height
        // If popup would go off bottom, show it above the click
        const adjustedY = yPos + popupHeight > screenHeight - 20
            ? yPos - popupHeight + 10
            : yPos + 10;
        setPickerConfig({ visible: true, title, key, options, iconColor, yPos: adjustedY });
    };

    const Header = ({ title, onBack, onSave }) => (
        <View style={styles.header}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <Icon name="arrow-left" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>

            {onSave ? (
                <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
            ) : (
                <View style={{ width: 40 }} />
            )}
        </View>
    );

    const MainMenu = ({ onNavigate }) => (
        <Reanimated.View style={styles.menuContainer}>
            {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <View style={[styles.iconBox, { marginRight: 12 }]}>
                    <Icon name={"cog"} size={24} color={"#0D9488"} />
                </View>
                <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>Machine Settings</Text>
            </View> */}
            <View style={styles.grid}>
                {[
                    {
                        id: 'preheat',
                        label: 'Preheat',
                        icon: 'fire',
                        color: '#FEEBE5',   // thoda clean + consistent
                        animation: require('../assets/animations/Thermometer Hot.json')
                    },
                    {
                        id: 'service',
                        label: 'Service',
                        icon: 'wrench',
                        color: '#D8F6FF',
                        animation: require('../assets/animations/Man and robot with computers sitting together in workplace.json')
                    },
                    {
                        id: 'repeat',
                        label: 'Repeat',
                        icon: 'sync',
                        color: '#E3FFEB',
                        animation: require('../assets/animations/retry.json')
                    },
                    {
                        id: 'setup',
                        label: 'Setup',
                        icon: 'cog-outline',
                        color: '#ECD4CD',
                        animation: require('../assets/animations/Configuration.json'),
                        backgroundColor: "#ffffffff"
                    }
                ].map((item) => {
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.gridItem,
                                item.id === 'setup' && { backgroundColor: '#FFFFFF' }
                            ]}
                            onPress={() => onNavigate(item.id === 'setup' ? 'setup' : 'no-data')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={[item.color, item.color + '99']}
                                style={styles.iconContainer}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {/* <Icon name={item.icon} size={32} color="#FFFFFF" /> */}
                                <LottieView
                                    source={item.animation}
                                    autoPlay={item.id === 'setup'}
                                    loop
                                    style={{ width: 100, height: 100 }}

                                />
                            </LinearGradient>
                            <Text style={styles.gridLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Reanimated.View>
    );

    const FormSelect = ({ label, icon, iconColor, valueKey, settings, onOpenPicker, range, unit, min, max, step, options, disabled = false }) => (
        <TouchableOpacity
            style={[styles.selectItem, disabled && { opacity: 0.7 }]}
            onPress={(e) => !disabled && onOpenPicker(label, valueKey, min, max, step, options, iconColor, e.nativeEvent.pageY)}
            disabled={disabled}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                <View style={[styles.fieldIconBox, { backgroundColor: (iconColor || '#0D9488') + '15' }]}>
                    <Icon name={icon || "cog"} size={18} color={iconColor || "#0D9488"} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel} numberOfLines={1}>{label}</Text>
                    {range && <Text style={styles.rangeText}>{range}</Text>}
                </View>
            </View>

            <View style={[styles.valueBadge, disabled && { backgroundColor: '#F1F5F9' }]}>
                <Text style={[styles.valueBadgeText, disabled && { color: '#64748B' }]}>{settings[valueKey]}</Text>
                {unit && <Text style={[styles.valueBadgeUnit, disabled && { color: '#64748B' }]}>{unit}</Text>}
                {!disabled && <Icon name="chevron-down" size={18} color="#0D9488" style={{ marginLeft: 6 }} />}
            </View>
        </TouchableOpacity>
    );

    const FormInput = ({ label, icon, iconColor, valueKey, settings, onUpdate, editable = true }) => (
        <View style={styles.selectItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                <View style={[styles.fieldIconBox, { backgroundColor: (iconColor || '#0D9488') + '15' }]}>
                    <Icon name={icon || "cog"} size={18} color={iconColor || "#0D9488"} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel} numberOfLines={1}>{label}</Text>
                </View>
            </View>

            <View style={[styles.valueBadge, !editable && { backgroundColor: '#F1F5F9' }]}>
                <TextInput
                    style={[styles.valueBadgeText, { padding: 0, minWidth: 40, textAlign: 'center' }, !editable && { color: '#64748B' }]}
                    value={settings[valueKey]}
                    onChangeText={(val) => onUpdate(valueKey, val)}
                    placeholder="Value"
                    placeholderTextColor="#94A3B8"
                    editable={editable}
                />
            </View>
        </View>
    );

    const FormSwitch = ({ label, icon, iconColor, valueKey, settings, onUpdate }) => (
        <View style={styles.switchItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.fieldIconBox, { backgroundColor: (iconColor || '#0D9488') + '15' }]}>
                    <Icon name={icon || "cog"} size={18} color={iconColor || "#0D9488"} />
                </View>
                <Text style={styles.listLabel}>{label}</Text>
            </View>
            <Switch
                value={settings[valueKey]}
                onValueChange={(val) => onUpdate(valueKey, val)}
                trackColor={{ false: '#CBD5E1', true: '#518276DD' }}
                thumbColor="#FFF"
            />
        </View>
    );

    const TherapySettings = ({ settings, onUpdate, onOpenPicker }) => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <Reanimated.View style={styles.formSection}>
                <FormSelect icon="medical-bag" iconColor="#EF4444" label="Therapy Mode" valueKey="therapyMode" settings={settings} onOpenPicker={onOpenPicker} options={['CPAP', 'Auto CPAP']} />

                {settings.therapyMode === 'Auto CPAP' ? (
                    <>
                        <FormSelect icon="arrow-down-bold-hexagon-outline" iconColor="#EF4444" label="Minimum Pressure" valueKey="minPressure" settings={settings} onOpenPicker={onOpenPicker} range="2.0-15.5" unit="cmH2O" min={2.0} max={15.5} />
                        <FormSelect icon="arrow-up-bold-hexagon-outline" iconColor="#EF4444" label="Maximum Pressure" valueKey="maxPressure" settings={settings} onOpenPicker={onOpenPicker} range="13.0-20.0" unit="cmH2O" min={13.0} max={20.0} />
                        <FormSelect icon="motion-play-outline" iconColor="#EF4444" label="Start Pressure" valueKey="startPressure" settings={settings} onOpenPicker={onOpenPicker} range="2.0-13.5" unit="cmH2O" min={2.0} max={13.5} />
                        <FormSelect icon="timer-sand" iconColor="#EF4444" label="Ramp Duration" valueKey="rampDuration" settings={settings} onOpenPicker={onOpenPicker} range="0-45" unit="min" min={0} max={45} step={1} />
                        <FormSelect icon="power-plug-off" iconColor="#EF4444" label="Pressure Off" valueKey="pressureOff" settings={settings} onOpenPicker={onOpenPicker} range="1.0-4.0" unit="cmH2O" min={1.0} max={4.0} />
                    </>
                ) : (
                    <>
                        <FormSelect icon="gauge" iconColor="#EF4444" label="CPAP Pressure" valueKey="cpapPressure" settings={settings} onOpenPicker={onOpenPicker} range="5.0-20.0" unit="cmH2O" min={5.0} max={20.0} />
                        <FormSelect icon="motion-play-outline" iconColor="#EF4444" label="Start Pressure" valueKey="startPressure" settings={settings} onOpenPicker={onOpenPicker} range="1.0-18.5" unit="cmH2O" min={1.0} max={18.5} />
                        <FormSelect icon="timer-sand" iconColor="#EF4444" label="Ramp Duration" valueKey="rampDuration" settings={settings} onOpenPicker={onOpenPicker} range="0-45" unit="min" min={0} max={45} step={1} />
                        <FormSelect icon="power-plug-off" iconColor="#EF4444" label="Pressure Off" valueKey="pressureOff" settings={settings} onOpenPicker={onOpenPicker} range="0.0-4.0" unit="cmH2O" min={0.0} max={4.0} />
                    </>
                )}
            </Reanimated.View>
        </ScrollView>
    );

    const AlertSettings = ({ settings, onUpdate, onOpenPicker }) => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <Reanimated.View style={styles.formSection}>
                <FormSwitch icon="weather-windy" iconColor="#F59E0B" label="Leak Alert" valueKey="leakAlert" settings={settings} onUpdate={onUpdate} />
                <FormSelect icon="bell-alert-outline" iconColor="#F59E0B" label="Low Pressure Alarm" valueKey="lowPressureAlarm" settings={settings} onOpenPicker={onOpenPicker} range="2.0-15.0" unit="cmH2O" min={2.0} max={15.0} />
                <FormSelect icon="trending-up" iconColor="#F59E0B" label="High Rate Alarm" valueKey="highRateAlarm" settings={settings} onOpenPicker={onOpenPicker} range="15-50" unit="BPM" min={15} max={50} step={1} />
                <FormSelect icon="trending-down" iconColor="#F59E0B" label="Low Rate Alarm" valueKey="lowRateAlarm" settings={settings} onOpenPicker={onOpenPicker} range="5-15" unit="BPM" min={5} max={15} step={1} />
                <FormSwitch icon="sd" iconColor="#F59E0B" label="Show Memory Card Error" valueKey="memoryCardError" settings={settings} onUpdate={onUpdate} />
                <FormSwitch icon="flash" iconColor="#F59E0B" label="Auto On" valueKey="autoOn" settings={settings} onUpdate={onUpdate} />
                <FormSwitch icon="flash-off" iconColor="#F59E0B" label="Auto Off" valueKey="autoOff" settings={settings} onUpdate={onUpdate} />
            </Reanimated.View>
        </ScrollView>
    );

    const DisplaySettings = ({ settings, onUpdate, onOpenPicker }) => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <Reanimated.View style={styles.formSection}>
                <FormSelect icon="brightness-6" iconColor="#0EA5E9" label="Brightness" valueKey="brightness" settings={settings} onOpenPicker={onOpenPicker} range="1-10" min={1} max={10} step={1} />
                <FormSwitch icon="fire" iconColor="#0EA5E9" label="Preheat Tray Icon" valueKey="preheatTray" settings={settings} onUpdate={onUpdate} />
                <FormSwitch icon="sd" iconColor="#0EA5E9" label="SD Tray Icon" valueKey="sdTray" settings={settings} onUpdate={onUpdate} />
                <FormSwitch icon="wifi" iconColor="#0EA5E9" label="Wifi Tray Icon" valueKey="wifiTray" settings={settings} onUpdate={onUpdate} />
                <FormSwitch icon="wrench-cog" iconColor="#0EA5E9" label="Service Tray Icon" valueKey="serviceTray" settings={settings} onUpdate={onUpdate} />
                <FormInput icon="clock-outline" iconColor="#0EA5E9" label="Current Time" valueKey="currentTime" settings={settings} onUpdate={onUpdate} editable={false} />
                <FormInput icon="calendar-month-outline" iconColor="#0EA5E9" label="Date" valueKey="date" settings={settings} onUpdate={onUpdate} editable={false} />
                <FormSelect icon="clock-time-four-outline" iconColor="#0EA5E9" label="Time Format" valueKey="timeFormat" settings={settings} onOpenPicker={onOpenPicker} unit="Format" min={12} max={24} step={12} />
            </Reanimated.View>
        </ScrollView>
    );

    const CommonSettings = ({ settings, onUpdate, onOpenPicker }) => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <Reanimated.View style={styles.formSection}>
                <FormSelect icon="timer-outline" iconColor="#10B981" label="Preheat Time" valueKey="preheatTime" settings={settings} onOpenPicker={onOpenPicker} range="0-60" unit="min" min={0} max={60} step={5} />
                <FormSelect icon="water" iconColor="#10B981" label="Humidifier Level" valueKey="humidifierLevel" settings={settings} onOpenPicker={onOpenPicker} range="0-5" min={0} max={5} step={1} />
                <FormSelect icon="face-mask-outline" iconColor="#10B981" label="Mask Size" valueKey="maskSize" settings={settings} onOpenPicker={onOpenPicker} options={['Small', 'Medium', 'Large']} />
                <FormSelect icon="face-man-outline" iconColor="#10B981" label="Mask Type" valueKey="maskType" settings={settings} onOpenPicker={onOpenPicker} options={['Nasal', 'Pillow', 'Full Face']} />
                <FormSwitch icon="volume-high" iconColor="#10B981" label="Beep" valueKey="beep" settings={settings} onUpdate={onUpdate} />
                <FormSwitch icon="bell-badge-outline" iconColor="#10B981" label="Service Reminder" valueKey="serviceReminder" settings={settings} onUpdate={onUpdate} />
            </Reanimated.View>
        </ScrollView>
    );

    const PickerPopup = () => {
        const scrollY = React.useRef(new Animated.Value(0)).current;

        // Find initial scroll index
        const initialIndex = pickerConfig.options.indexOf(settings[pickerConfig.key]);
        const flatListRef = React.useRef(null);

        useEffect(() => {
            if (pickerConfig.visible && initialIndex !== -1) {
                setTimeout(() => {
                    flatListRef.current?.scrollToOffset({
                        offset: initialIndex * ITEM_HEIGHT,
                        animated: false,
                    });
                }, 100);
            }
        }, [pickerConfig.visible]);

        return (
            <Modal
                visible={pickerConfig.visible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPickerConfig({ ...pickerConfig, visible: false })}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setPickerConfig({ ...pickerConfig, visible: false })}
                >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
                    <Reanimated.View
                        entering={FadeInDown.springify()}
                        style={[
                            styles.pickerContainer,
                            {
                                shadowColor: pickerConfig.iconColor || '#0D9488',
                                top: pickerConfig.yPos || 100,
                            }
                        ]}
                    >
                        {/* Minimalist Selection Indicator (Lens) */}
                        <View style={styles.pickerLens} pointerEvents="none" />

                        <View style={{ height: PICKER_HEIGHT, overflow: 'hidden' }}>
                            <Animated.FlatList
                                ref={flatListRef}
                                data={pickerConfig.options}
                                keyExtractor={(item) => item}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={ITEM_HEIGHT}
                                decelerationRate="fast"
                                contentContainerStyle={{
                                    paddingVertical: (PICKER_HEIGHT - ITEM_HEIGHT) / 2
                                }}
                                scrollEventThrottle={16}
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                                    { useNativeDriver: true }
                                )}
                                renderItem={({ item, index }) => {
                                    const inputRange = [
                                        (index - 2) * ITEM_HEIGHT,
                                        (index - 1) * ITEM_HEIGHT,
                                        index * ITEM_HEIGHT,
                                        (index + 1) * ITEM_HEIGHT,
                                        (index + 2) * ITEM_HEIGHT,
                                    ];

                                    const scale = scrollY.interpolate({
                                        inputRange,
                                        outputRange: [0.7, 0.9, 1.2, 0.9, 0.7],
                                        extrapolate: 'clamp',
                                    });

                                    const opacity = scrollY.interpolate({
                                        inputRange,
                                        outputRange: [0.3, 0.6, 1, 0.6, 0.3],
                                        extrapolate: 'clamp',
                                    });

                                    const rotateX = scrollY.interpolate({
                                        inputRange,
                                        outputRange: ['45deg', '25deg', '0deg', '-25deg', '-45deg'],
                                        extrapolate: 'clamp',
                                    });

                                    const isSelected = settings[pickerConfig.key] === item;
                                    const activeColor = pickerConfig.iconColor || '#0D9488';

                                    return (
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                updateValue(pickerConfig.key, item);
                                                setPickerConfig({ ...pickerConfig, visible: false });
                                            }}
                                            style={{
                                                height: ITEM_HEIGHT,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                borderBottomWidth: 1,
                                                borderBottomColor: 'rgba(16, 185, 129, 0.1)', // Light green line
                                                width: '100%',
                                            }}
                                        >
                                            <Animated.View style={{
                                                transform: [{ scale }, { rotateX }],
                                                opacity,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '100%',
                                            }}>
                                                <Text style={[
                                                    styles.pickerItemText,
                                                    isSelected && { color: activeColor, fontWeight: '900' }
                                                ]}>
                                                    {item}
                                                </Text>
                                            </Animated.View>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                            {/* Gradient Overlays for Fade Effect */}
                            <LinearGradient
                                colors={['#FFFFFF', 'rgba(255,255,255,0)']}
                                style={styles.pickerFadeTop}
                                pointerEvents="none"
                            />
                            <LinearGradient
                                colors={['rgba(255,255,255,0)', '#FFFFFF']}
                                style={styles.pickerFadeBottom}
                                pointerEvents="none"
                            />
                        </View>
                    </Reanimated.View>
                </TouchableOpacity>
            </Modal>
        );
    };

    const SetupMenu = ({ onNavigate }) => (
        <Reanimated.View entering={SlideInRight} style={styles.listContainer}>
            {[
                { id: 'therapy', label: 'Therapy', icon: 'heart-pulse', color: '#FF5F6D', animation: require('../assets/animations/Heart.json') },
                { id: 'alert', label: 'Alert', icon: 'bell-outline', color: '#FFC371', animation: require('../assets/animations/Alert Warning Informtion.json') },
                { id: 'display', label: 'Display', icon: 'monitor-dashboard', color: '#2193b0', animation: require('../assets/animations/Computer Editing.json') },
                { id: 'common', label: 'Common', icon: 'tune', color: '#6dd5ed', animation: require('../assets/animations/Gears Lottie Animation.json') },
            ].map((item) => (
                <TouchableOpacity
                    key={item.id}
                    style={styles.listItem}
                    onPress={() => onNavigate(item.id)}
                >
                    <View style={[styles.listIcon, { backgroundColor: item.color + '20' }]}>
                        {/* <Icon name={item.icon} size={24} color={item.color} /> */}
                        <LottieView
                            source={item.animation}
                            autoPlay
                            loop
                            style={{ width: 40, height: 40 }}
                        />
                    </View>
                    <Text style={styles.listLabel}>{item.label}</Text>
                    <Icon name="chevron-right" size={24} color="#CBD5E1" />

                </TouchableOpacity>
            ))}
        </Reanimated.View>
    );

    const NoDataScreen = ({ onNavigate }) => (
        <Reanimated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
            <Icon name="database-off" size={80} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptySub}>This section is currently empty or under maintenance.</Text>
            <TouchableOpacity style={styles.returnBtn} onPress={() => onNavigate('main')}>
                <Text style={styles.returnBtnText}>Go Back</Text>
            </TouchableOpacity>
        </Reanimated.View>
    );

    const getTitle = () => {
        switch (currentStep) {
            case 'main': return 'Machine Settings';
            case 'setup': return 'Machine Setup';
            case 'therapy': return 'Therapy Settings';
            case 'alert': return 'Alert Settings';
            case 'display': return 'Display Settings';
            case 'common': return 'Common Settings';
            case 'no-data': return 'Information';
            default: return 'Settings';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#518276" />
            <Header
                title={getTitle()}
                onBack={goBack}
                onSave={['setup', 'therapy', 'alert', 'display', 'common'].includes(currentStep) ? handleSave : null}
            />
            <View style={styles.content}>
                {currentStep === 'main' ? <MainMenu onNavigate={navigateTo} /> :
                    currentStep === 'setup' ? <SetupMenu onNavigate={navigateTo} /> :
                        currentStep === 'therapy' ? <TherapySettings settings={settings} onUpdate={updateValue} onOpenPicker={openPicker} /> :
                            currentStep === 'alert' ? <AlertSettings settings={settings} onUpdate={updateValue} onOpenPicker={openPicker} /> :
                                currentStep === 'display' ? <DisplaySettings settings={settings} onUpdate={updateValue} onOpenPicker={openPicker} /> :
                                    currentStep === 'common' ? <CommonSettings settings={settings} onUpdate={updateValue} onOpenPicker={openPicker} /> :
                                        <NoDataScreen onNavigate={navigateTo} />}
            </View>
            <PickerPopup />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffffff', // Matching splash screen soft green
    },
    header: {
        backgroundColor: '#518276', // Premium dark teal
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        elevation: 12,
        shadowColor: '#0F766E', // colored shadow
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,

    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        marginTop: 20
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
        marginTop: 20
    },
    saveBtn: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginTop: 20
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '900',
        color: '#0D9488', // Emerald/Teal
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 20,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F0FDFA', // Premium light teal tint
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(13, 148, 136, 0.15)',
    },
    fieldIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',

    },
    gridItem: {
        width: (width - 60) / 2,
        backgroundColor: '#bdbcbcff',
        borderRadius: 10,
        paddingVertical: 25,
        paddingHorizontal: 15,
        alignItems: 'center',
        marginBottom: 25,
        // Premium shadow
        elevation: 8,
        shadowColor: '#305146ff',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        // Optional subtle border
        borderColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 1,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: 'transparent',
    },
    gridLabel: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F766E',
        letterSpacing: 0.5,
    },
    listContainer: {
        flex: 1,
    },
    listItem: {
        flexDirection: 'row',
        backgroundColor: '#ffffffff',
        padding: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 16,
        elevation: 6,
        shadowColor: '#1e503fff',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 1,
    },
    listIcon: {
        width: 55,
        height: 55,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    listLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: 0.3,
    },
    formSection: {
        paddingBottom: 40,
    },
    subHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 15,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: '#E2E8F0',
        borderRadius: 12,
        padding: 4,
        marginBottom: 25,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeModeBtn: {
        backgroundColor: '#FFF',
        elevation: 2,
    },
    modeBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    activeModeBtnText: {
        color: '#518276',
    },
    selectItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: 0.3,
    },
    rangeText: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
        fontWeight: '500',
    },
    valueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDFA',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(13, 148, 136, 0.15)',
    },
    valueBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0F766E',
    },
    valueBadgeUnit: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0D9488',
        marginLeft: 4,
    },
    switchItem: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 20,
        paddingHorizontal: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 20,
    },
    emptySub: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 40,
    },
    returnBtn: {
        marginTop: 30,
        paddingHorizontal: 30,
        paddingVertical: 12,
        backgroundColor: '#518276',
        borderRadius: 25,
    },
    returnBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'transparent', // Fully transparent overlay for context feel
    },
    pickerContainer: {
        backgroundColor: '#FFFFFF',
        width: 140,
        position: 'absolute',
        right: 20,
        borderRadius: 25,
        paddingVertical: 10,
        elevation: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
    },
    pickerLens: {
        position: 'absolute',
        top: ITEM_HEIGHT * 2, // Center of 5 items
        marginTop: 10,
        left: 10,
        right: 10,
        height: ITEM_HEIGHT,
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderRadius: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        zIndex: 0,
    },
    pickerItemText: {
        fontSize: 18,
        color: '#10B981', // Green color for values
        fontWeight: '600',
        textAlign: 'center',
    },
    pickerFadeTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        zIndex: 10,
    },
    pickerFadeBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        zIndex: 10,
    },
});

export default UpdateMachineSetting;
