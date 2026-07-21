import React, { useState, useEffect, useRef } from 'react';
import {
  sendSettingsToESP32,
  syncSettingsFromESP32,
  connectToMachine,
  syncLogsFromESP32,
  disconnectFromMachine,
  registerDisconnectCallback,
  activeDevice,
  sendWifiCredentials,
  cancelBluetoothConnection,
} from '../bluetooth';
import { saveMachineSettings, getMachineSettings, recreateLogsTableWithData } from '../api/database';
import { useData } from '../context/DataContext';
import RNFS from 'react-native-fs';
import { parseCSV } from '../utils/csvParser';
import Share from 'react-native-share';
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
  Animated,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
import Reanimated, {
  FadeInDown,
  SlideInRight,
  FadeIn,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import LottieView from 'lottie-react-native';

const { width, height: screenHeight } = Dimensions.get('window');

// ─── Picker Constants ─────────────────────────────────────────────────────────
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getScreenSaverLabel = val => {
  const s = String(val);
  if (s === '0') return 'Never';
  if (s === '1') return '5 seconds';
  if (s === '2') return '15 seconds';
  if (s === '3') return '30 seconds';
  if (s === '4') return '1 minute';
  if (s === '5') return '5 minutes';
  return s;
};

// ─── Global Helper Components ─────────────────────────────────────────────────
// Defined at module level so React never treats them as "new" types on re-render.
// This prevents the unmount/remount loop (and scroll-jumping) caused by clock ticks.

const FormSelect = ({
  label,
  icon,
  iconColor,
  valueKey,
  settings,
  onOpenPicker,
  range,
  unit,
  min,
  max,
  step,
  options,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[styles.selectItem, disabled && { opacity: 0.7 }]}
    onPress={e =>
      !disabled &&
      onOpenPicker(
        label,
        valueKey,
        min,
        max,
        step,
        options,
        iconColor,
        e.nativeEvent.pageY,
      )
    }
    disabled={disabled}
  >
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 10,
      }}
    >
      <View
        style={[
          styles.fieldIconBox,
          { backgroundColor: (iconColor || '#0D9488') + '15' },
        ]}
      >
        <Icon name={icon || 'cog'} size={18} color={iconColor || '#0D9488'} />
      </View>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={styles.formLabel}>
          {label}
        </Text>
        {range && <Text style={styles.rangeText}>{range}</Text>}
      </View>
    </View>

    <View
      style={[styles.valueBadge, disabled && { backgroundColor: '#F1F5F9' }]}
    >
      <Text style={[styles.valueBadgeText, disabled && { color: '#64748B' }]}>
        {valueKey === 'screenSaver'
          ? getScreenSaverLabel(settings[valueKey])
          : settings[valueKey]}
      </Text>
      {unit && (
        <Text style={[styles.valueBadgeUnit, disabled && { color: '#64748B' }]}>
          {unit}
        </Text>
      )}
      {!disabled && (
        <Icon
          name="chevron-down"
          size={18}
          color="#0D9488"
          style={{ marginLeft: 6 }}
        />
      )}
    </View>
  </TouchableOpacity>
);

const FormInput = ({
  label,
  icon,
  iconColor,
  valueKey,
  settings,
  onUpdate,
  editable = true,
}) => (
  <View style={styles.selectItem}>
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingRight: 10,
      }}
    >
      <View
        style={[
          styles.fieldIconBox,
          { backgroundColor: (iconColor || '#0D9488') + '15' },
        ]}
      >
        <Icon name={icon || 'cog'} size={18} color={iconColor || '#0D9488'} />
      </View>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={styles.formLabel}>
          {label}
        </Text>
      </View>
    </View>

    <View
      style={[styles.valueBadge, !editable && { backgroundColor: '#F1F5F9' }]}
    >
      {editable ? (
        <TextInput
          style={[
            styles.valueBadgeText,
            { padding: 0, minWidth: 40, textAlign: 'center' },
          ]}
          value={settings[valueKey]}
          onChangeText={val => onUpdate(valueKey, val)}
          placeholder="Value"
          placeholderTextColor="#94A3B8"
          editable={editable}
        />
      ) : (
        <Text
          style={[
            styles.valueBadgeText,
            { color: '#64748B', textAlign: 'center' },
          ]}
        >
          {settings[valueKey]}
        </Text>
      )}
    </View>
  </View>
);

const FormSwitch = ({
  label,
  icon,
  iconColor,
  valueKey,
  settings,
  onUpdate,
}) => (
  <View style={styles.switchItem}>
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
      <View
        style={[
          styles.fieldIconBox,
          { backgroundColor: (iconColor || '#0D9488') + '15' },
        ]}
      >
        <Icon name={icon || 'cog'} size={18} color={iconColor || '#0D9488'} />
      </View>
      <Text style={[styles.listLabel, { flex: 1 }]} numberOfLines={2}>{label}</Text>
    </View>
    <Switch
      value={settings[valueKey]}
      onValueChange={val => onUpdate(valueKey, val)}
      trackColor={{ false: '#CBD5E1', true: '#518276DD' }}
      thumbColor="#FFF"
    />
  </View>
);

const PickerPopup = ({ pickerConfig, settings, onSelect, onClose }) => {
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const initialIndex = pickerConfig.options.indexOf(settings[pickerConfig.key]);
  const flatListRef = React.useRef(null);
  const activeColor = pickerConfig.iconColor || '#0D9488';

  useEffect(() => {
    if (pickerConfig.visible && initialIndex !== -1) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: initialIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, [pickerConfig.visible, initialIndex]);

  if (!pickerConfig.visible) return null;

  return (
    <Modal
      visible={pickerConfig.visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.pickerModalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={StyleSheet.absoluteFill} />
        <Reanimated.View
          entering={FadeInDown.springify()}
          style={[
            styles.pickerContainer,
            {
              shadowColor: activeColor,
              borderColor: activeColor + '40',
              borderWidth: 1.5,
              top: pickerConfig.yPos || 100,
            },
          ]}
        >
          <View 
            style={[
              styles.pickerLens, 
              { 
                backgroundColor: activeColor + '08', 
                borderColor: activeColor + '30',
                borderTopWidth: 1.5,
                borderBottomWidth: 1.5 
              }
            ]} 
            pointerEvents="none" 
          />

          <View style={{ height: PICKER_HEIGHT, overflow: 'hidden' }}>
            <Animated.FlatList
              ref={flatListRef}
              data={pickerConfig.options}
              keyExtractor={item => item}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              contentContainerStyle={{
                paddingVertical: (PICKER_HEIGHT - ITEM_HEIGHT) / 2,
              }}
              scrollEventThrottle={16}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true },
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
                  outputRange: [0.75, 0.9, 1.25, 0.9, 0.75],
                  extrapolate: 'clamp',
                });
                const opacity = scrollY.interpolate({
                  inputRange,
                  outputRange: [0.25, 0.55, 1, 0.55, 0.25],
                  extrapolate: 'clamp',
                });
                const rotateX = scrollY.interpolate({
                  inputRange,
                  outputRange: ['45deg', '25deg', '0deg', '-25deg', '-45deg'],
                  extrapolate: 'clamp',
                });
                const isSelected = settings[pickerConfig.key] === item;

                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelect(pickerConfig.key, item);
                      onClose();
                    }}
                    style={{
                      height: ITEM_HEIGHT,
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <Animated.View
                      style={{
                        transform: [{ scale }, { rotateX }],
                        opacity,
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: isSelected ? activeColor : '#64748B' },
                          isSelected && {
                            fontWeight: '900',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {pickerConfig.key === 'screenSaver'
                          ? getScreenSaverLabel(item)
                          : item}
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                );
              }}
            />
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

// ─── Screen Sub-components (module-level to avoid React type instability) ──────

const TherapySettings = ({ settings, onUpdate, onOpenPicker }) => (
  <ScrollView showsVerticalScrollIndicator={false}>
    <Reanimated.View style={styles.formSection}>
      <FormSelect
        icon="medical-bag"
        iconColor="#EF4444"
        label="Therapy Mode"
        valueKey="therapyMode"
        settings={settings}
        onOpenPicker={onOpenPicker}
        options={['CPAP', 'Auto CPAP', 'S', 'T', 'ST', 'VAPS']}
      />

      {settings.therapyMode === 'CPAP' && (
        <>
          <FormSelect
            icon="gauge"
            iconColor="#EF4444"
            label="CPAP Pressure"
            valueKey="cpapPressure"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="5.0-20.0"
            unit="cmH2O"
            min={5.0}
            max={20.0}
          />
          <FormSelect
            icon="motion-play-outline"
            iconColor="#EF4444"
            label="Start Pressure"
            valueKey="startPressure"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1.0-18.5"
            unit="cmH2O"
            min={1.0}
            max={18.5}
          />
          <FormSelect
            icon="timer-sand"
            iconColor="#EF4444"
            label="Ramp Duration"
            valueKey="rampDuration"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="0-45"
            unit="min"
            min={0}
            max={45}
            step={1}
          />
          <FormSelect
            icon="power-plug-off"
            iconColor="#EF4444"
            label="Pressure Off"
            valueKey="pressureOff"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="0.0-4.0"
            unit="cmH2O"
            min={0.0}
            max={4.0}
          />
        </>
      )}

      {settings.therapyMode === 'Auto CPAP' && (
        <>
          <FormSelect
            icon="arrow-down-bold-hexagon-outline"
            iconColor="#EF4444"
            label="Minimum Pressure"
            valueKey="minPressure"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="2.0-15.5"
            unit="cmH2O"
            min={2.0}
            max={15.5}
          />
          <FormSelect
            icon="arrow-up-bold-hexagon-outline"
            iconColor="#EF4444"
            label="Maximum Pressure"
            valueKey="maxPressure"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range={`${settings.minPressure}-20.0`}
            unit="cmH2O"
            min={parseFloat(settings.minPressure) || 2.0}
            max={20.0}
          />
          <FormSelect
            icon="motion-play-outline"
            iconColor="#EF4444"
            label="Start Pressure"
            valueKey="startPressure"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range={`2.0-${settings.minPressure}`}
            unit="cmH2O"
            min={2.0}
            max={parseFloat(settings.minPressure) || 15.5}
          />
          <FormSelect
            icon="timer-sand"
            iconColor="#EF4444"
            label="Ramp Duration"
            valueKey="rampDuration"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="0-45"
            unit="min"
            min={0}
            max={45}
            step={1}
          />
          <FormSelect
            icon="power-plug-off"
            iconColor="#EF4444"
            label="Pressure Off"
            valueKey="pressureOff"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1.0-4.0"
            unit="cmH2O"
            min={1.0}
            max={4.0}
          />
        </>
      )}

      {settings.therapyMode === 'S' && (
        <>
          <FormSelect
            icon="arrow-up-bold-hexagon-outline"
            iconColor="#EF4444"
            label="IPAP"
            valueKey="ipapS"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="9.0-30.0"
            unit="cmH2O"
            min={9.0}
            max={30.0}
            step={0.5}
          />
          <FormSelect
            icon="arrow-down-bold-hexagon-outline"
            iconColor="#EF4444"
            label="EPAP"
            valueKey="epapS"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="2.0-14.0"
            unit="cmH2O"
            min={2.0}
            max={14.0}
            step={0.5}
          />
          <FormSelect
            icon="ray-start"
            iconColor="#EF4444"
            label="I-Trigger"
            valueKey="iTriggerS"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1-5"
            min={1}
            max={5}
            step={1}
          />
          <FormSelect
            icon="ray-end"
            iconColor="#EF4444"
            label="E-Trigger"
            valueKey="eTriggerS"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1-5"
            min={1}
            max={5}
            step={1}
          />
          <FormSelect
            icon="trending-up"
            iconColor="#EF4444"
            label="Press-rise"
            valueKey="pressRiseS"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1-5"
            min={1}
            max={5}
            step={1}
          />
          <FormSelect
            icon="clock-fast"
            iconColor="#EF4444"
            label="ti-max"
            valueKey="tiMaxS"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1.0-5.0"
            unit="s"
            min={1.0}
            max={5.0}
            step={0.5}
          />
          <FormSelect
            icon="clock-slow"
            iconColor="#EF4444"
            label="ti-min"
            valueKey="tiMinS"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="0.5-3.0"
            unit="s"
            min={0.5}
            max={3.0}
            step={0.5}
          />
        </>
      )}

      {settings.therapyMode === 'T' && (
        <>
          <FormSelect
            icon="arrow-up-bold-hexagon-outline"
            iconColor="#EF4444"
            label="IPAP"
            valueKey="ipapT"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="6.0-30.0"
            unit="cmH2O"
            min={6.0}
            max={30.0}
            step={0.5}
          />
          <FormSelect
            icon="arrow-down-bold-hexagon-outline"
            iconColor="#EF4444"
            label="EPAP"
            valueKey="epapT"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="2.0-30.0"
            unit="cmH2O"
            min={2.0}
            max={30.0}
            step={0.5}
          />
          <FormSelect
            icon="heart-pulse"
            iconColor="#EF4444"
            label="Breath-rate"
            valueKey="breathRateT"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="4-40"
            unit="BPM"
            min={4}
            max={40}
            step={1}
          />
          <FormSelect
            icon="ratio"
            iconColor="#EF4444"
            label="I:E Ratio"
            valueKey="ieRatioT"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="0.5-3.0"
            min={0.5}
            max={3.0}
            step={0.1}
          />
          <FormSelect
            icon="trending-up"
            iconColor="#EF4444"
            label="Press-rise"
            valueKey="pressRiseT"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1-5"
            min={1}
            max={5}
            step={1}
          />
        </>
      )}

      {settings.therapyMode === 'ST' && (
        <>
          <FormSelect
            icon="arrow-up-bold-hexagon-outline"
            iconColor="#EF4444"
            label="IPAP"
            valueKey="ipapST"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="12.0-30.0"
            unit="cmH2O"
            min={12.0}
            max={30.0}
            step={0.5}
          />
          <FormSelect
            icon="arrow-down-bold-hexagon-outline"
            iconColor="#EF4444"
            label="EPAP"
            valueKey="epapST"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="2.0-20.0"
            unit="cmH2O"
            min={2.0}
            max={20.0}
            step={0.5}
          />
          <FormSelect
            icon="heart-pulse"
            iconColor="#EF4444"
            label="Breath-rate"
            valueKey="breathRateST"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="4-40"
            unit="BPM"
            min={4}
            max={40}
            step={1}
          />
          <FormSelect
            icon="ratio"
            iconColor="#EF4444"
            label="I:E Ratio"
            valueKey="ieRatioST"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="0.5-6.0"
            min={0.5}
            max={6.0}
            step={0.5}
          />
          <FormSelect
            icon="ray-start"
            iconColor="#EF4444"
            label="I-Trigger"
            valueKey="iTriggerST"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1-60"
            min={1}
            max={60}
            step={1}
          />
          <FormSelect
            icon="ray-end"
            iconColor="#EF4444"
            label="E-Trigger"
            valueKey="eTriggerST"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1-5"
            min={1}
            max={5}
            step={1}
          />
          <FormSelect
            icon="trending-up"
            iconColor="#EF4444"
            label="Press-rise"
            valueKey="pressRiseST"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1-5"
            min={1}
            max={5}
            step={1}
          />
          <FormSelect
            icon="clock-fast"
            iconColor="#EF4444"
            label="ti-max"
            valueKey="tiMaxST"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1.0-5.0"
            unit="s"
            min={1.0}
            max={5.0}
            step={0.5}
          />
          <FormSelect
            icon="clock-slow"
            iconColor="#EF4444"
            label="ti-min"
            valueKey="tiMinST"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="0.5-3.0"
            unit="s"
            min={0.5}
            max={3.0}
            step={0.5}
          />
        </>
      )}

      {settings.therapyMode === 'VAPS' && (
        <>
          <FormSelect
            icon="arrow-up-bold-hexagon-outline"
            iconColor="#EF4444"
            label="IPAP max"
            valueKey="ipapMaxVaps"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="8.0-30.0"
            unit="cmH2O"
            min={8.0}
            max={30.0}
            step={0.5}
          />
          <FormSelect
            icon="arrow-up-bold-hexagon-outline"
            iconColor="#EF4444"
            label="IPAP min"
            valueKey="ipapMinVaps"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="6.0-16.0"
            unit="cmH2O"
            min={6.0}
            max={16.0}
            step={0.5}
          />
          <FormSelect
            icon="arrow-down-bold-hexagon-outline"
            iconColor="#EF4444"
            label="EPAP"
            valueKey="epapVaps"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="2.0-6.0"
            unit="cmH2O"
            min={2.0}
            max={6.0}
            step={0.5}
          />
          <FormSelect
            icon="hydraulic-blade"
            iconColor="#EF4444"
            label="VT"
            valueKey="vtVaps"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="50-1500"
            unit="ml"
            min={50}
            max={1500}
            step={50}
          />
          <FormSelect
            icon="heart-pulse"
            iconColor="#EF4444"
            label="Breath rate"
            valueKey="breathRateVaps"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="4-48"
            unit="BPM"
            min={4}
            max={48}
            step={1}
          />
          <FormSelect
            icon="ratio"
            iconColor="#EF4444"
            label="I:E Ratio"
            valueKey="ieRatioVaps"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="0.5-1.0"
            min={0.5}
            max={1.0}
            step={0.1}
          />
          <FormSelect
            icon="ray-start"
            iconColor="#EF4444"
            label="I-Trigger"
            valueKey="iTriggerVaps"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1-5"
            min={1}
            max={5}
            step={1}
          />
          <FormSelect
            icon="ray-end"
            iconColor="#EF4444"
            label="E-Trigger"
            valueKey="eTriggerVaps"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1-5"
            min={1}
            max={5}
            step={1}
          />
          <FormSelect
            icon="trending-up"
            iconColor="#EF4444"
            label="Press-rise"
            valueKey="pressRiseVaps"
            settings={settings}
            onOpenPicker={onOpenPicker}
            range="1-5"
            min={1}
            max={5}
            step={1}
          />
        </>
      )}
    </Reanimated.View>
  </ScrollView>
);

const AlertSettings = ({ settings, onUpdate, onOpenPicker }) => (
  <ScrollView showsVerticalScrollIndicator={false}>
    <Reanimated.View style={styles.formSection}>
      <FormSwitch
        icon="weather-windy"
        iconColor="#F59E0B"
        label="Leak Alert"
        valueKey="leakAlert"
        settings={settings}
        onUpdate={onUpdate}
      />
      <FormSelect
        icon="bell-alert-outline"
        iconColor="#F59E0B"
        label="Low Pressure Alarm"
        valueKey="lowPressureAlarm"
        settings={settings}
        onOpenPicker={onOpenPicker}
        range="2.0-15.0"
        unit="cmH2O"
        min={2.0}
        max={15.0}
      />
      <FormSelect
        icon="trending-up"
        iconColor="#F59E0B"
        label="High Rate Alarm"
        valueKey="highRateAlarm"
        settings={settings}
        onOpenPicker={onOpenPicker}
        range="15-50"
        unit="BPM"
        min={15}
        max={50}
        step={1}
      />
      <FormSelect
        icon="trending-down"
        iconColor="#F59E0B"
        label="Low Rate Alarm"
        valueKey="lowRateAlarm"
        settings={settings}
        onOpenPicker={onOpenPicker}
        range="5-15"
        unit="BPM"
        min={5}
        max={15}
        step={1}
      />
      <FormSwitch
        icon="sd"
        iconColor="#F59E0B"
        label="Show Memory Card Error"
        valueKey="memoryCardError"
        settings={settings}
        onUpdate={onUpdate}
      />
      <FormSwitch
        icon="flash"
        iconColor="#F59E0B"
        label="Auto On"
        valueKey="autoOn"
        settings={settings}
        onUpdate={onUpdate}
      />
      <FormSwitch
        icon="flash-off"
        iconColor="#F59E0B"
        label="Auto Off"
        valueKey="autoOff"
        settings={settings}
        onUpdate={onUpdate}
      />
    </Reanimated.View>
  </ScrollView>
);

const TimeAndDateFields = ({ timeFormat }) => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const weekNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const monthNames = [
    '',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const dayOfWeek = dateTime.getDay();
  const weekday = dayOfWeek === 0 ? 7 : dayOfWeek;
  const dateMonth = (dateTime.getMonth() + 1).toString();
  const dateDay = dateTime.getDate().toString();
  const dateYear = (dateTime.getFullYear() % 100).toString();

  const wName = weekNames[weekday] || '';
  const mName = monthNames[parseInt(dateMonth) || 0] || '';
  const dateDisplay = `${wName}, ${dateDay} ${mName} 20${dateYear.padStart(2, '0')}`;

  const h24 = dateTime.getHours();
  const minute = dateTime.getMinutes().toString().padStart(2, '0');
  const second = dateTime.getSeconds().toString().padStart(2, '0');

  let timeDisplay;
  if (timeFormat === '12h') {
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    timeDisplay = `${h12.toString().padStart(2, '0')}:${minute}:${second} ${ampm}`;
  } else {
    timeDisplay = `${h24.toString().padStart(2, '0')}:${minute}:${second}`;
  }

  return (
    <>
      <FormInput
        icon="clock-outline"
        iconColor="#0EA5E9"
        label="Current Time"
        valueKey="currentTime"
        settings={{ currentTime: timeDisplay }}
        onUpdate={() => {}}
        editable={false}
      />
      <FormInput
        icon="calendar-month-outline"
        iconColor="#0EA5E9"
        label="Date"
        valueKey="date"
        settings={{ date: dateDisplay }}
        onUpdate={() => {}}
        editable={false}
      />
    </>
  );
};

const DisplaySettings = ({ settings, onUpdate, onOpenPicker }) => {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Reanimated.View style={styles.formSection}>
        <FormSelect
          icon="brightness-6"
          iconColor="#0EA5E9"
          label="Brightness"
          valueKey="brightness"
          settings={settings}
          onOpenPicker={onOpenPicker}
          range="1-10"
          min={1}
          max={10}
          step={1}
        />
        <FormSwitch
          icon="fire"
          iconColor="#0EA5E9"
          label="Preheat Tray Icon"
          valueKey="preheatTray"
          settings={settings}
          onUpdate={onUpdate}
        />
        <FormSwitch
          icon="sd"
          iconColor="#0EA5E9"
          label="SD Tray Icon"
          valueKey="sdTray"
          settings={settings}
          onUpdate={onUpdate}
        />
        <FormSwitch
          icon="wifi"
          iconColor="#0EA5E9"
          label="Wifi Tray Icon"
          valueKey="wifiTray"
          settings={settings}
          onUpdate={onUpdate}
        />
        <FormSwitch
          icon="wrench-cog"
          iconColor="#0EA5E9"
          label="Service Tray Icon"
          valueKey="serviceTray"
          settings={settings}
          onUpdate={onUpdate}
        />
        <FormSelect
          icon="clock-time-four-outline"
          iconColor="#0EA5E9"
          label="Time Format"
          valueKey="timeFormat"
          settings={settings}
          onOpenPicker={onOpenPicker}
          options={['12h', '24h']}
        />
        <TimeAndDateFields timeFormat={settings.timeFormat} />
        <FormSelect
          icon="monitor-screenshot"
          iconColor="#0EA5E9"
          label="Screen Saver"
          valueKey="screenSaver"
          settings={settings}
          onOpenPicker={onOpenPicker}
          range="0-5"
          min={0}
          max={5}
          step={1}
        />
      </Reanimated.View>
    </ScrollView>
  );
};

const CommonSettings = ({ settings, onUpdate, onOpenPicker }) => (
  <ScrollView showsVerticalScrollIndicator={false}>
    <Reanimated.View style={styles.formSection}>
      <FormSelect
        icon="timer-outline"
        iconColor="#10B981"
        label="Preheat Time"
        valueKey="preheatTime"
        settings={settings}
        onOpenPicker={onOpenPicker}
        range="0-60"
        unit="min"
        min={0}
        max={60}
        step={5}
      />
      <FormSwitch
        icon="volume-high"
        iconColor="#10B981"
        label="Beep"
        valueKey="beep"
        settings={settings}
        onUpdate={onUpdate}
      />
      <FormSwitch
        icon="bell-badge-outline"
        iconColor="#10B981"
        label="Service Reminder"
        valueKey="serviceReminder"
        settings={settings}
        onUpdate={onUpdate}
      />
      <FormSwitch
        icon="cloud-upload-outline"
        iconColor="#10B981"
        label="Auto Upload Log"
        valueKey="autoUploadLog"
        settings={settings}
        onUpdate={onUpdate}
      />
      <FormSelect
        icon="face-mask-outline"
        iconColor="#10B981"
        label="Mask Size"
        valueKey="maskSize"
        settings={settings}
        onOpenPicker={onOpenPicker}
        options={['Small', 'Medium', 'Large']}
      />
      <FormSelect
        icon="face-man-outline"
        iconColor="#10B981"
        label="Mask Type"
        valueKey="maskType"
        settings={settings}
        onOpenPicker={onOpenPicker}
        options={['Nasal', 'Pillow', 'Full Face']}
      />
      <FormSelect
        icon="water"
        iconColor="#10B981"
        label="Humidifier Level"
        valueKey="humidifierLevel"
        settings={settings}
        onOpenPicker={onOpenPicker}
        range="0-5"
        min={0}
        max={5}
        step={1}
      />
    </Reanimated.View>
  </ScrollView>
);

const MainMenu = ({ onNavigate }) => (
  <Reanimated.View style={styles.menuContainer}>
    <View style={styles.grid}>
      {[
        {
          id: 'preheat',
          label: 'Preheat',
          color: '#FEEBE5',
          animation: require('../assets/animations/Thermometer Hot.json'),
        },
        {
          id: 'service',
          label: 'Service',
          color: '#D8F6FF',
          animation: require('../assets/animations/Man and robot with computers sitting together in workplace.json'),
        },
        {
          id: 'report',
          label: 'Report',
          color: '#E3FFEB',
          animation: require('../assets/animations/retry.json'),
        },
        {
          id: 'setup',
          label: 'Setup',
          color: '#ECD4CD',
          animation: require('../assets/animations/Configuration.json'),
        },
      ].map(item => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.gridItem,
            item.id === 'setup' && { backgroundColor: '#FFFFFF' },
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
            <LottieView
              source={item.animation}
              autoPlay={item.id === 'setup'}
              loop
              style={{ width: 100, height: 100 }}
            />
          </LinearGradient>
          <Text style={styles.gridLabel}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </Reanimated.View>
);

const SetupMenu = ({ onNavigate }) => (
  <Reanimated.View entering={SlideInRight} style={styles.listContainer}>
    {[
      {
        id: 'therapy',
        label: 'Therapy',
        subLabel: 'Mode, Pressure, Ramp, EPAP, IPAP, Trigger, Rise Time...',
        color: '#518276',
        animation: require('../assets/animations/Heart.json'),
      },
      {
        id: 'alert',
        label: 'Alert',
        subLabel: 'Leak Alert, Low Pressure, High/Low Rate, Auto On/Off...',
        color: '#F59E0B',
        animation: require('../assets/animations/Alert Warning Informtion.json'),
      },
      {
        id: 'display',
        label: 'Display',
        subLabel: 'Brightness, Time Format, Screen Saver, Tray Icons...',
        color: '#0EA5E9',
        animation: require('../assets/animations/Computer Editing.json'),
      },
      {
        id: 'common',
        label: 'Common',
        subLabel: 'Preheat Time, Humidifier, Mask Size & Type, Beep, Reminder....',
        color: '#10B981',
        animation: require('../assets/animations/Gears Lottie Animation.json'),
      },
    ].map(item => (
      <TouchableOpacity
        key={item.id}
        style={[styles.listItem, { borderLeftColor: item.color, borderLeftWidth: 5 }]}
        onPress={() => onNavigate(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.listIcon, { backgroundColor: item.color + '12' }]}>
          <LottieView
            source={item.animation}
            autoPlay
            loop
            style={{ width: 38, height: 38 }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.listLabel}>{item.label}</Text>
          <Text style={styles.listSubLabel}>{item.subLabel}</Text>
        </View>
        <Icon name="chevron-right" size={22} color={item.color} style={{ opacity: 0.8 }} />
      </TouchableOpacity>
    ))}
  </Reanimated.View>
);

const NoDataScreen = ({ onNavigate }) => (
  <Reanimated.View
    entering={FadeIn.duration(400)}
    style={styles.emptyContainer}
  >
    <Icon name="database-off" size={80} color="#CBD5E1" />
    <Text style={styles.emptyTitle}>No Data Available</Text>
    <Text style={styles.emptySub}>
      This section is currently empty or under maintenance.
    </Text>
    <TouchableOpacity
      style={styles.returnBtn}
      onPress={() => onNavigate('main')}
    >
      <Text style={styles.returnBtnText}>Go Back</Text>
    </TouchableOpacity>
  </Reanimated.View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const UpdateMachineSetting = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState('main');
  const isCancelledRef = useRef(false);
  const { userRole, userData } = useData();
  const userPrefix = `${userRole || 'guest'}_${userData?.id || 'default'}_`;

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
    // S Mode
    ipapS: '9.0',
    epapS: '4.0',
    iTriggerS: '3',
    eTriggerS: '3',
    pressRiseS: '3',
    tiMaxS: '2.0',
    tiMinS: '1.0',
    // T Mode
    ipapT: '12.0',
    epapT: '4.0',
    breathRateT: '15',
    ieRatioT: '1.5',
    pressRiseT: '3',
    // ST Mode
    ipapST: '12.0',
    epapST: '4.0',
    breathRateST: '15',
    ieRatioST: '1.5',
    iTriggerST: '3',
    eTriggerST: '3',
    pressRiseST: '3',
    tiMaxST: '2.0',
    tiMinST: '1.0',
    // VAPS Mode
    ipapMaxVaps: '15.0',
    ipapMinVaps: '8.0',
    epapVaps: '4.0',
    vtVaps: '500',
    breathRateVaps: '15',
    ieRatioVaps: '1.0',
    iTriggerVaps: '3',
    eTriggerVaps: '3',
    pressRiseVaps: '3',
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
    serviceTray: true,
    timeFormat: '12h',
    currentTime: '00:00:00',
    timeAmPm: 'AM',
    weekday: '1',
    dateMonth: '1',
    dateDay: '1',
    dateYear: '26',
    screenSaver: '0',
    // Common
    preheatTime: '30',
    humidifierLevel: '3',
    maskSize: 'Small',
    maskType: 'Nasal',
    beep: true,
    serviceReminder: true,
    autoUploadLog: false,
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await getMachineSettings();
        if (saved) {
          setSettings(prev => ({ ...prev, ...saved }));
        }
      } catch (err) {
        console.warn('Failed to load machine settings:', err);
      }
    };
    loadSettings();

    const checkConnection = async () => {
      if (activeDevice) {
        const connected = await activeDevice.isConnected().catch(() => false);
        setIsBtConnected(connected);
      } else {
        setIsBtConnected(false);
      }
    };
    checkConnection();

    registerDisconnectCallback(() => {
      console.log('[BT DISCONNECT CALLBACK] Triggered in UpdateMachineSetting screen');
      setIsBtConnected(false);
      setIsWifiConnected(false);
    });

    return () => {
      registerDisconnectCallback(null);
    };
  }, []);

  const [pickerConfig, setPickerConfig] = useState({
    visible: false,
    title: '',
    key: '',
    options: [],
  });
const [isSendingBT, setIsSendingBT] = useState(false);
const [btStatus, setBtStatus] = useState('');
const [btProcessName, setBtProcessName] = useState('Loading...');
const [isBtConnected, setIsBtConnected] = useState(false);
const [packetModalVisible, setPacketModalVisible] = useState(false);
const [syncPacketModalVisible, setSyncPacketModalVisible] = useState(false);
const [wifiModalVisible, setWifiModalVisible] = useState(false);
const [wifiSsid, setWifiSsid] = useState('');
const [wifiPassword, setWifiPassword] = useState('');
const [isWifiConnected, setIsWifiConnected] = useState(false);
const [therapyDropdownOpen, setTherapyDropdownOpen] = useState(false);
const [syncTherapyDropdownOpen, setSyncTherapyDropdownOpen] = useState(false);
const [logDateModalVisible, setLogDateModalVisible] = useState(false);
const [logStartDate, setLogStartDate] = useState(new Date());
const [logEndDate, setLogEndDate] = useState(new Date());
const [showStartPicker, setShowStartPicker] = useState(false);
const [showEndPicker, setShowEndPicker] = useState(false);

  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
const [downloadedLogs, setDownloadedLogs] = useState([]);

const loadDownloadedLogs = async () => {
  try {
    const exists = await RNFS.exists(RNFS.DocumentDirectoryPath);
    if (!exists) return;
    const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
    const filtered = files.filter(f => f.isFile() && f.name.startsWith(userPrefix + 'logs_') && f.name.endsWith('.txt'));
    filtered.sort((a, b) => b.name.localeCompare(a.name));
    setDownloadedLogs(filtered);
  } catch (err) {
    console.warn('Failed to load downloaded logs:', err);
  }
};

useEffect(() => {
  if (logsModalVisible) {
    loadDownloadedLogs();
  }
}, [logsModalVisible]);


const [tempStartDate, setTempStartDate] = useState(new Date());
const [tempEndDate, setTempEndDate] = useState(new Date());
  

  const [selectedSyncPackets, setSelectedSyncPackets] = useState({
    all: true,
    therapy: true,
    alert: true,
    display: true,
    common: true,
    'CPAP': true,
    'Auto CPAP': true,
    'S': true,
    'T': true,
    'ST': true,
    'VAPS': true,
  });

  const toggleSyncPacket = key => {
    if (key === 'all') {
      const newValue = !selectedSyncPackets.all;
      setSelectedSyncPackets({
        all: newValue,
        therapy: newValue,
        alert: newValue,
        display: newValue,
        common: newValue,
        'CPAP': newValue,
        'Auto CPAP': newValue,
        'S': newValue,
        'T': newValue,
        'ST': newValue,
        'VAPS': newValue,
      });
      return;
    }

    if (key === 'therapy') {
      const newValue = !selectedSyncPackets.therapy;
      setSelectedSyncPackets(prev => {
        const updated = {
          ...prev,
          therapy: newValue,
          'CPAP': newValue,
          'Auto CPAP': newValue,
          'S': newValue,
          'T': newValue,
          'ST': newValue,
          'VAPS': newValue,
        };
        updated.all =
          updated.therapy && updated.alert && updated.display && updated.common;
        return updated;
      });
      return;
    }

    if (['CPAP', 'Auto CPAP', 'S', 'T', 'ST', 'VAPS'].includes(key)) {
      setSelectedSyncPackets(prev => {
        const updated = {
          ...prev,
          [key]: !prev[key],
        };
        const anyTherapy =
          updated['CPAP'] ||
          updated['Auto CPAP'] ||
          updated['S'] ||
          updated['T'] ||
          updated['ST'] ||
          updated['VAPS'];
        updated.therapy = anyTherapy;
        updated.all =
          updated.therapy && updated.alert && updated.display && updated.common;
        return updated;
      });
      return;
    }

    setSelectedSyncPackets(prev => {
      const updated = {
        ...prev,
        [key]: !prev[key],
      };
      updated.all =
        updated.therapy && updated.alert && updated.display && updated.common;
      return updated;
    });
  };

  const [selectedPackets, setSelectedPackets] = useState({
    all: true,
    therapy: true,
    alert: true,
    display: true,
    common: true,
    'CPAP': true,
    'Auto CPAP': true,
    'S': true,
    'T': true,
    'ST': true,
    'VAPS': true,
  });

  const togglePacket = key => {
    if (key === 'all') {
      const newValue = !selectedPackets.all;
      setSelectedPackets({
        all: newValue,
        therapy: newValue,
        alert: newValue,
        display: newValue,
        common: newValue,
        'CPAP': newValue,
        'Auto CPAP': newValue,
        'S': newValue,
        'T': newValue,
        'ST': newValue,
        'VAPS': newValue,
      });
      return;
    }

    if (key === 'therapy') {
      const newValue = !selectedPackets.therapy;
      setSelectedPackets(prev => {
        const updated = {
          ...prev,
          therapy: newValue,
          'CPAP': newValue,
          'Auto CPAP': newValue,
          'S': newValue,
          'T': newValue,
          'ST': newValue,
          'VAPS': newValue,
        };
        updated.all =
          updated.therapy && updated.alert && updated.display && updated.common;
        return updated;
      });
      return;
    }

    if (['CPAP', 'Auto CPAP', 'S', 'T', 'ST', 'VAPS'].includes(key)) {
      setSelectedPackets(prev => {
        const updated = {
          ...prev,
          [key]: !prev[key],
        };
        const anyTherapy =
          updated['CPAP'] ||
          updated['Auto CPAP'] ||
          updated['S'] ||
          updated['T'] ||
          updated['ST'] ||
          updated['VAPS'];
        updated.therapy = anyTherapy;
        updated.all =
          updated.therapy && updated.alert && updated.display && updated.common;
        return updated;
      });
      return;
    }

    setSelectedPackets(prev => {
      const updated = {
        ...prev,
        [key]: !prev[key],
      };
      updated.all =
        updated.therapy && updated.alert && updated.display && updated.common;
      return updated;
    });
  };



  const updateValue = (key, val) => {
    setSettings(prev => {
      let updated = { ...prev, [key]: val };
      
      if (prev.therapyMode === 'Auto CPAP') {
        if (key === 'minPressure') {
          const newMin = parseFloat(val);
          const currentMax = parseFloat(prev.maxPressure);
          const currentStart = parseFloat(prev.startPressure);
          
          if (currentMax < newMin) {
            updated.maxPressure = val;
          }
          if (currentStart > newMin) {
            updated.startPressure = val;
          }
        } else if (key === 'maxPressure') {
          const newMax = parseFloat(val);
          const currentMin = parseFloat(prev.minPressure);
          if (currentMin > newMax) {
            updated.minPressure = val;
            const currentStart = parseFloat(prev.startPressure);
            if (currentStart > newMax) {
              updated.startPressure = val;
            }
          }
        } else if (key === 'startPressure') {
          const newStart = parseFloat(val);
          const currentMin = parseFloat(prev.minPressure);
          if (newStart > currentMin) {
            updated.minPressure = val;
            const currentMax = parseFloat(prev.maxPressure);
            if (currentMax < newStart) {
              updated.maxPressure = val;
            }
          }
        }
      }
      return updated;
    });
  };

  const navigateTo = step => setCurrentStep(step);

  const goBack = () => {
    if (currentStep === 'main') {
      navigation.goBack();
    } else if (
      ['therapy', 'alert', 'display', 'common'].includes(currentStep)
    ) {
      setCurrentStep('setup');
    } else if (currentStep === 'setup' || currentStep === 'no-data') {
      setCurrentStep('main');
    } else {
      setCurrentStep('main');
    }
  };

  const generateOptions = (min, max, step = 0.5) => {
    const options = [];
    for (let i = min; i <= max; i = parseFloat((i + step).toFixed(2))) {
      options.push(i.toString());
    }
    return options;
  };

  const openPicker = (
    title,
    key,
    min,
    max,
    step,
    customOptions,
    iconColor,
    yPos,
  ) => {
    const options = customOptions || generateOptions(min, max, step);
    const popupHeight = 240;
    const adjustedY =
      yPos + popupHeight > screenHeight - 20
        ? yPos - popupHeight + 10
        : yPos + 10;
    setPickerConfig({
      visible: true,
      title,
      key,
      options,
      iconColor,
      yPos: adjustedY,
    });
  };

  const handleSave = async () => {
    if (isSendingBT) return;

    const now = new Date();
    const h24 = now.getHours();
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    const isPM = h24 >= 12;
    const dayOfWeek = now.getDay();
    const weekdayVal = dayOfWeek === 0 ? 7 : dayOfWeek;
    const monthVal = (now.getMonth() + 1).toString();
    const dateVal = now.getDate().toString();
    const yearVal = (now.getFullYear() % 100).toString();

    // Compute time in the selected format for setupData
    // ─ 12h: hour is 1–12, timeAmPm is 'AM'/'PM'
    // ─ 24h: hour is 0–23, timeAmPm is unused
    let currentTimeStr, timeAmPmStr;
    if (settings.timeFormat === '12h') {
      const h12 = h24 % 12 || 12; // 0→12, 13→1, 14→2 … 23→11
      timeAmPmStr = isPM ? 'PM' : 'AM';
      currentTimeStr = `${h12.toString().padStart(2, '0')}:${minute}:${second}`;
    } else {
      currentTimeStr = `${h24.toString().padStart(2, '0')}:${minute}:${second}`;
      timeAmPmStr = isPM ? 'PM' : 'AM';
    }

    const therapyConfigs = [];
    if (selectedPackets['CPAP']) {
      therapyConfigs.push({
        therapyMode: 'CPAP',
        cpapPressure: settings.cpapPressure,
        startPressure: settings.startPressure,
        rampDuration: settings.rampDuration,
        pressureOff: settings.pressureOff,
      });
    }
    if (selectedPackets['Auto CPAP']) {
      therapyConfigs.push({
        therapyMode: 'Auto CPAP',
        minPressure: settings.minPressure,
        maxPressure: settings.maxPressure,
        startPressure: settings.startPressure,
        rampDuration: settings.rampDuration,
        pressureOff: settings.pressureOff,
      });
    }
    if (selectedPackets['S']) {
      therapyConfigs.push({
        therapyMode: 'S',
        ipapS: settings.ipapS,
        epapS: settings.epapS,
        iTriggerS: settings.iTriggerS,
        eTriggerS: settings.eTriggerS,
        pressRiseS: settings.pressRiseS,
        tiMaxS: settings.tiMaxS,
        tiMinS: settings.tiMinS,
      });
    }
    if (selectedPackets['T']) {
      therapyConfigs.push({
        therapyMode: 'T',
        ipapT: settings.ipapT,
        epapT: settings.epapT,
        breathRateT: settings.breathRateT,
        ieRatioT: settings.ieRatioT,
        pressRiseT: settings.pressRiseT,
      });
    }
    if (selectedPackets['ST']) {
      therapyConfigs.push({
        therapyMode: 'ST',
        ipapST: settings.ipapST,
        epapST: settings.epapST,
        breathRateST: settings.breathRateST,
        ieRatioST: settings.ieRatioST,
        iTriggerST: settings.iTriggerST,
        eTriggerST: settings.eTriggerST,
        pressRiseST: settings.pressRiseST,
        tiMaxST: settings.tiMaxST,
        tiMinST: settings.tiMinST,
      });
    }
    if (selectedPackets['VAPS']) {
      therapyConfigs.push({
        therapyMode: 'VAPS',
        ipapMaxVaps: settings.ipapMaxVaps,
        ipapMinVaps: settings.ipapMinVaps,
        epapVaps: settings.epapVaps,
        vtVaps: settings.vtVaps,
        breathRateVaps: settings.breathRateVaps,
        ieRatioVaps: settings.ieRatioVaps,
        iTriggerVaps: settings.iTriggerVaps,
        eTriggerVaps: settings.eTriggerVaps,
        pressRiseVaps: settings.pressRiseVaps,
      });
    }

    const setupData = {
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
        timeFormat: settings.timeFormat,
        currentTime: currentTimeStr,
        timeAmPm: timeAmPmStr,
        weekday: weekdayVal.toString(),
        dateMonth: monthVal,
        dateDay: dateVal,
        dateYear: yearVal,
        screenSaver: settings.screenSaver,
      },
      common: {
        preheatTime: settings.preheatTime,
        beep: settings.beep,
        serviceReminder: settings.serviceReminder,
        autoUploadLog: settings.autoUploadLog,
        maskSize: settings.maskSize,
        maskType: settings.maskType,
        humidifierLevel: settings.humidifierLevel,
      },
    };

    console.log('--- SETUP DATA ---', setupData);
    const filteredSetupData = {};

    if (selectedPackets.therapy && therapyConfigs.length > 0) {
      filteredSetupData.therapy = therapyConfigs;
    }

    if (selectedPackets.alert) filteredSetupData.alert = setupData.alert;

    if (selectedPackets.display) filteredSetupData.display = setupData.display;

    if (selectedPackets.common) filteredSetupData.common = setupData.common;

    const hasAnySelection =
      (selectedPackets.therapy && therapyConfigs.length > 0) ||
      selectedPackets.alert ||
      selectedPackets.display ||
      selectedPackets.common;

    if (!hasAnySelection) {
      Alert.alert('Selection Required', 'Please select at least one packet/mode to upload.');
      return;
    }

    isCancelledRef.current = false;
    setBtProcessName('Uploading Data...');
    setIsSendingBT(true);
    setBtStatus('Starting Bluetooth…');
    try {
      const result = await sendSettingsToESP32(filteredSetupData, msg => {
        if (isCancelledRef.current) return;
        console.log('[BT]', msg);
        setBtStatus(msg);
      });
      if (isCancelledRef.current) return;
      if (result.success) {
        await saveMachineSettings(settings);
        Alert.alert(
          '✅ Settings Sent',
          result.message || 'Machine settings sent successfully!',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert(
          '❌ Bluetooth Failed',
          result.message || 'Could not send settings.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      if (isCancelledRef.current) return;
      Alert.alert(
        '❌ Bluetooth Error',
        error.message || 'An unexpected error occurred.',
        [{ text: 'OK' }],
      );
    } finally {
      if (!isCancelledRef.current) {
        setIsSendingBT(false);
        setBtStatus('');
      }
    }
  };


const handleSync = async () => {
  if (isSendingBT) return;

  const modesToSync = [];

  if (selectedSyncPackets.therapy) {
    if (selectedSyncPackets['CPAP']) modesToSync.push(0x01);
    if (selectedSyncPackets['Auto CPAP']) modesToSync.push(0x02);
    if (selectedSyncPackets['S']) modesToSync.push(0x03);
    if (selectedSyncPackets['T']) modesToSync.push(0x04);
    if (selectedSyncPackets['ST']) modesToSync.push(0x05);
    if (selectedSyncPackets['VAPS']) modesToSync.push(0x06);
  }
  if (selectedSyncPackets.alert) modesToSync.push(0x07);
  if (selectedSyncPackets.display) modesToSync.push(0x08);
  if (selectedSyncPackets.common) modesToSync.push(0x09);

  if (modesToSync.length === 0) {
    Alert.alert('Selection Required', 'Please select at least one packet to sync.');
    return;
  }

  setSyncPacketModalVisible(false);
  isCancelledRef.current = false;
  setBtProcessName('Synchronizing Data...');
  setIsSendingBT(true);
  setBtStatus('Starting Sync…');
  try {
    const result = await syncSettingsFromESP32(modesToSync, msg => {
      if (isCancelledRef.current) return;
      console.log('[BT SYNC]', msg);
      setBtStatus(msg);
    });
    if (isCancelledRef.current) return;
    if (result.success) {
      const updated = { ...settings, ...result.settings };
      setSettings(updated);
      await saveMachineSettings(updated);
      Alert.alert('✅ Sync Complete', 'Settings synchronized from machine!', [{ text: 'OK' }]);
    } else {
      Alert.alert('❌ Sync Failed', result.message || 'Could not sync data.', [{ text: 'OK' }]);
    }
  } catch (error) {
    if (isCancelledRef.current) return;
    Alert.alert('❌ Sync Error', error.message || 'An unexpected error occurred.', [{ text: 'OK' }]);
  } finally {
    if (!isCancelledRef.current) {
      setIsSendingBT(false);
      setBtStatus('');
    }
  }
};

const formatDisplayDate = (date) => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const handleDownloadLogs = async () => {
  if (logEndDate < logStartDate) {
    Alert.alert('Invalid Range', 'End date must be on or after start date.');
    return;
  }

  isCancelledRef.current = false;
  setBtProcessName('Downloading Data...');
  setIsSendingBT(true);
  setBtStatus('Downloading logs…');
  try {
    const result = await syncLogsFromESP32(logStartDate, logEndDate, msg => {
      if (isCancelledRef.current) return;
      console.log('[BT LOG]', msg);
      setBtStatus(msg);
    });
    if (isCancelledRef.current) return;
    if (result.success) {
      const startStr = logStartDate.getFullYear() +
        (logStartDate.getMonth() + 1).toString().padStart(2, '0') +
        logStartDate.getDate().toString().padStart(2, '0');
      const endStr = logEndDate.getFullYear() +
        (logEndDate.getMonth() + 1).toString().padStart(2, '0') +
        logEndDate.getDate().toString().padStart(2, '0');
      const filename = `${userPrefix}logs_${startStr}_${endStr}.txt`;
      const path = `${RNFS.DocumentDirectoryPath}/${filename}`;

      // Convert hex string response back to normal ASCII text by parsing packet wrappers
      const hexResponse = (result.response || '').toLowerCase();
      let csvLines = [];
      let index = 0;
      
      while (index < hexResponse.length) {
        const pos = hexResponse.indexOf('aa55', index);
        if (pos === -1) break;
        if (pos + 6 > hexResponse.length) break;
        
        const lenHex = hexResponse.substring(pos + 4, pos + 6);
        const len = parseInt(lenHex, 16);
        const totalChars = (len + 5) * 2;
        if (pos + totalChars > hexResponse.length) break;
        
        const dataStart = pos + 10;
        const dataLenChars = (len - 2) * 2; // Subtract ACTION and SUB
        const dataHex = hexResponse.substring(dataStart, dataStart + dataLenChars);
        
        let line = '';
        for (let i = 0; i < dataHex.length; i += 2) {
          const code = parseInt(dataHex.substring(i, i + 2), 16);
          if (!isNaN(code) && code !== 0) {
            line += String.fromCharCode(code);
          }
        }
        
        line = line.trim();
        if (line) {
          const cols = line.split(',');
          if (cols.length >= 6) {
            const ts = cols[0].trim();
            if (ts.length === 14 && /^\d+$/.test(ts)) {
              cols[0] = ts.substring(0, 8) + ':' + ts.substring(8);
              line = cols.join(',');
            }
          }
          csvLines.push(line);
        }
        index = pos + totalChars;
      }

      const textContent = csvLines.join('\n') + '\n';
      await RNFS.writeFile(path, textContent, 'utf8');

      console.log('======================================================');
      console.log(`[BT LOGS DOWNLOAD] Total raw log lines parsed: ${csvLines.length}`);
      console.log('======================================================');

      // Auto-import logs into database so that PDF and graphs are populated immediately
      try {
        const parsedData = await parseCSV(textContent);
        if (parsedData && parsedData.length > 0 && parsedData[0] !== null) {
          console.log(`[BT LOGS IMPORT] Total clinical log records to import: ${parsedData.length}`);
          const formattedData = parsedData.map(item => ({
            ...item,
            machine_type: settings.therapyMode || 'Auto CPAP',
            patient_id: 1,
          }));
          await recreateLogsTableWithData(formattedData);
          console.log('[BT LOG] Automatically imported downloaded logs to SQLite database successfully.');
        }
      } catch (importErr) {
        console.error('Failed to auto-import logs to SQLite:', importErr);
      }

      await loadDownloadedLogs();

      Alert.alert(
        '✅ Logs Downloaded',
        `Log file saved and imported successfully:\n${filename}`,
        [{ text: 'OK' }]
      );
    } else {
      if (isCancelledRef.current) return;
      Alert.alert('❌ Log Failed', result.message || 'Could not download logs.', [{ text: 'OK' }]);
    }
  } catch (error) {
    if (isCancelledRef.current) return;
    Alert.alert('❌ Log Error', error.message || 'An unexpected error occurred.', [{ text: 'OK' }]);
  } finally {
    if (!isCancelledRef.current) {
      setIsSendingBT(false);
      setBtStatus('');
    }
  }
};

const handleUploadLogFile = async (file) => {
  try {
    isCancelledRef.current = false;
    setBtProcessName('Importing Logs');
    setIsSendingBT(true);
    setBtStatus('Processing file...');

    let fileContent = await RNFS.readFile(file.path, 'utf8');

    // If the file is still in the raw hex packet format, parse it on the fly
    if (fileContent.trim().toLowerCase().startsWith('aa55')) {
      const hexResponse = fileContent.trim().toLowerCase();
      let csvLines = [];
      let index = 0;
      
      while (index < hexResponse.length) {
        const pos = hexResponse.indexOf('aa55', index);
        if (pos === -1) break;
        if (pos + 6 > hexResponse.length) break;
        
        const lenHex = hexResponse.substring(pos + 4, pos + 6);
        const len = parseInt(lenHex, 16);
        const totalChars = (len + 5) * 2;
        if (pos + totalChars > hexResponse.length) break;
        
        const dataStart = pos + 10;
        const dataLenChars = (len - 2) * 2;
        const dataHex = hexResponse.substring(dataStart, dataStart + dataLenChars);
        
        let line = '';
        for (let i = 0; i < dataHex.length; i += 2) {
          const code = parseInt(dataHex.substring(i, i + 2), 16);
          if (!isNaN(code) && code !== 0) {
            line += String.fromCharCode(code);
          }
        }
        
        line = line.trim();
        if (line) {
          const cols = line.split(',');
          if (cols.length >= 6) {
            const ts = cols[0];
            if (ts.length === 14 && /^\d+$/.test(ts)) {
              cols[0] = ts.substring(0, 8) + ':' + ts.substring(8);
              line = cols.join(',');
            }
          }
          csvLines.push(line);
        }
        index = pos + totalChars;
      }
      fileContent = csvLines.join('\n') + '\n';
    } else {
      // It's text format, but verify if the timestamp needs colon mapping
      const lines = fileContent.split(/\r?\n/);
      const updatedLines = lines.map(line => {
        const cols = line.trim().split(',');
        if (cols.length >= 6) {
          const ts = cols[0].trim();
          if (ts.length === 14 && /^\d+$/.test(ts)) {
            cols[0] = ts.substring(0, 8) + ':' + ts.substring(8);
            return cols.join(',');
          }
        }
        return line;
      });
      fileContent = updatedLines.join('\n');
    }

    const parsedData = await parseCSV(fileContent);
    console.log('Parsed Data Count:', parsedData?.length);

    if (!parsedData || parsedData.length === 0 || parsedData[0] === null) {
      throw new Error('No clinical therapy data found in the file.');
    }

    const formattedData = parsedData.map(item => ({
      ...item,
      machine_type: settings.therapyMode || 'Auto CPAP',
      patient_id: 1,
    }));

    await recreateLogsTableWithData(formattedData);

    if (isCancelledRef.current) return;
    setIsSendingBT(false);
    setBtStatus('');

    const importCount = parsedData.length;
    const summaryTitle = importCount > 1 ? 'Batch Import Successful' : 'Import Successful';
    const summaryMsg = importCount > 1
      ? `${importCount} days of clinical therapy data processed.\n\nDate Range: ${parsedData[importCount - 1].date} to ${parsedData[0].date}`
      : `Clinical data for ${parsedData[0].date} has been processed.\n\nUsage: ${parsedData[0].usage_hours} hrs\nAHI: ${parsedData[0].ahi}`;

    Alert.alert(summaryTitle, summaryMsg, [{ text: 'OK' }]);
  } catch (err) {
    if (isCancelledRef.current) return;
    setIsSendingBT(false);
    setBtStatus('');
    console.error('CRITICAL IMPORT ERROR:', err);
    Alert.alert('Import Failed', `Error processing file: ${err?.message || err}`);
  }
};

const handleDeleteLogFile = async (file) => {
  Alert.alert(
    'Confirm Delete',
    `Are you sure you want to delete this log file?\n\n${file.name}`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await RNFS.unlink(file.path);
            await loadDownloadedLogs();
          } catch (err) {
            Alert.alert('Delete Failed', err.message);
          }
        }
      }
    ]
  );
};

const handleShareLogFile = async (file) => {
  try {
    const fileContent = await RNFS.readFile(file.path, 'base64');
    const shareOptions = {
      title: 'Export Machine Log',
      url: `data:text/plain;base64,${fileContent}`,
      filename: file.name,
      type: 'text/plain',
      useInternalStorage: true,
    };
    await Share.open(shareOptions);
  } catch (err) {
    if (err && err.message && !err.message.includes('User cancelled')) {
      console.warn('Share error:', err);
      Alert.alert('Share Error', err?.message || String(err));
    }
  }
};
  const handleBTConnect = async () => {
    if (isSendingBT) return;
    isCancelledRef.current = false;
    setBtProcessName('Establishing Connection...');
    setIsSendingBT(true);
    setBtStatus('Pairing with Airsine Device...');
    const result = await connectToMachine(msg => {
      if (isCancelledRef.current) return;
      console.log('[BT CONNECT]', msg);
      setBtStatus(msg);
    });
    if (isCancelledRef.current) return;
    if (result.success) {
      setIsBtConnected(true);
    } else {
      setIsBtConnected(false);
      setErrorModal({ visible: true, title: 'Connection Failed', message: result.message || 'Could not connect to machine.' });
    }
    if (!isCancelledRef.current) {
      setIsSendingBT(false);
      setBtStatus('');
    }
  };

  const handleBTDisconnect = async () => {
    if (isSendingBT) return;
    isCancelledRef.current = false;
    setBtProcessName('Disconnecting Machine');
    setIsSendingBT(true);
    setBtStatus('Disconnecting...');
    await disconnectFromMachine(msg => {
      if (isCancelledRef.current) return;
      console.log('[BT DISCONNECT]', msg);
      setBtStatus(msg);
    });
    if (isCancelledRef.current) return;
    setIsBtConnected(false);
    if (!isCancelledRef.current) {
      setIsSendingBT(false);
      setBtStatus('');
    }
  };

  const handleWifiSend = async () => {
    if (!wifiSsid) {
      Alert.alert('Validation Error', 'SSID cannot be empty.');
      return;
    }
    setWifiModalVisible(false);
    isCancelledRef.current = false;
    setBtProcessName('Configuring WiFi');
    setIsSendingBT(true);
    setBtStatus('Sending WiFi credentials…');
    try {
      const result = await sendWifiCredentials(wifiSsid, wifiPassword, msg => {
        if (isCancelledRef.current) return;
        setBtStatus(msg);
      });
      if (isCancelledRef.current) return;
      if (result.success) {
        setIsWifiConnected(true);
        Alert.alert(
          '✅ WiFi Config Sent',
          `SSID and Password sent successfully.\n\nMachine Response: ${result.response || 'No response details received.'}`,
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert(
          '❌ Failed to Send',
          result.message || 'Could not send WiFi settings.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      Alert.alert(
        '❌ Error',
        error.message || 'An unexpected error occurred.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsSendingBT(false);
      setBtStatus('');
    }
  };

  const getTitle = () => {
    switch (currentStep) {
      case 'main':
        return 'Machine Settings';
      case 'setup':
        return 'Machine Setup';
      case 'therapy':
        return 'Therapy Settings';
      case 'alert':
        return 'Alert Settings';
      case 'display':
        return 'Display Settings';
      case 'common':
        return 'Common Settings';
      default:
        return 'Machine Settings';
    }
  };

  const showSaveActions = [
    'setup',
    'therapy',
    'alert',
    'display',
    'common',
  ].includes(currentStep);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#518276" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {getTitle()}
            </Text>
          </View>
          <View style={styles.btStatusContainer}>
            <Icon
              name={isBtConnected ? 'bluetooth' : 'bluetooth-off'}
              size={14}
              color={isBtConnected ? '#10B981' : '#F87171'}
            />
            <Text
              style={[
                styles.btStatusText,
                { color: isBtConnected ? '#10B981' : '#F87171' },
              ]}
            >
              {isBtConnected ? 'ON' : 'OFF'}
            </Text>
          </View>
        </View>

        {showSaveActions && (
          <View
            style={
              !isBtConnected
                ? [styles.headerActionRow, { backgroundColor: 'transparent', padding: 0 }]
                : styles.headerActionRow
            }
          >
            {!isBtConnected ? (
              <TouchableOpacity
                onPress={handleBTConnect}
                style={[styles.actionBtn, styles.connectBtn]}
              >
                <Icon
                  name="bluetooth"
                  size={18}
                  color="#0F766E"
                  style={styles.actionIcon}
                />
                <Text style={[styles.actionBtnText, { color: '#0F766E' }]}>
                  Connect Machine
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  onPress={handleBTDisconnect}
                  style={[styles.tabItem, styles.disconnectTab]}
                >
                  <Icon
                    name="bluetooth-off"
                    size={18}
                    color="#FFFFFF"
                    style={styles.tabIcon}
                  />
                  <Text style={[styles.tabText, { color: '#FFFFFF' }]}>
                    Disconnect
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSyncPacketModalVisible(true)}
                  style={[styles.tabItem, styles.syncTab]}
                >
                  <Icon
                    name="download"
                    size={18}
                    color="#FFFFFF"
                    style={styles.tabIcon}
                  />
                  <Text style={[styles.tabText, { color: '#FFFFFF' }]}>
                    Download
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPacketModalVisible(true)}
                  style={[styles.tabItem, styles.saveTab]}
                >
                  <Icon
                    name="upload"
                    size={18}
                    color="#FFFFFF"
                    style={styles.tabIcon}
                  />
                  <Text style={[styles.tabText, { color: '#FFFFFF' }]}>
                    Upload
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setWifiModalVisible(true)}
                  style={[styles.tabItem, styles.wifiTab]}
                >
                  <Icon
                    name="wifi"
                    size={18}
                    color="#FFFFFF"
                    style={styles.tabIcon}
                  />
                  <Text style={[styles.tabText, { color: '#FFFFFF' }]}>
                    WiFi
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLogsModalVisible(true)}
                  style={[styles.tabItem, styles.logsTab]}
                >
                  <Icon
                    name="file-document-outline"
                    size={18}
                    color="#FFFFFF"
                    style={styles.tabIcon}
                  />
                  <Text style={[styles.tabText, { color: '#FFFFFF' }]}>
                    Logs
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {currentStep === 'main' && <MainMenu onNavigate={navigateTo} />}
        {currentStep === 'setup' && <SetupMenu onNavigate={navigateTo} />}
        {currentStep === 'no-data' && <NoDataScreen onNavigate={navigateTo} />}
        {currentStep === 'therapy' && (
          <TherapySettings
            settings={settings}
            onUpdate={updateValue}
            onOpenPicker={openPicker}
          />
        )}
        {currentStep === 'alert' && (
          <AlertSettings
            settings={settings}
            onUpdate={updateValue}
            onOpenPicker={openPicker}
          />
        )}
        {currentStep === 'display' && (
          <DisplaySettings
            settings={settings}
            onUpdate={updateValue}
            onOpenPicker={openPicker}
          />
        )}
        {currentStep === 'common' && (
          <CommonSettings
            settings={settings}
            onUpdate={updateValue}
            onOpenPicker={openPicker}
          />
        )}
      </View>

      {/* ── Picker Popup ── */}
      <PickerPopup
        pickerConfig={pickerConfig}
        settings={settings}
        onSelect={updateValue}
        onClose={() => setPickerConfig(prev => ({ ...prev, visible: false }))}
      />
    <Modal visible={packetModalVisible} transparent animationType="fade">
      <View style={styles.modernModalOverlay}>
        <View style={styles.modernModalContainer}>
          <View style={styles.modernModalHeader}>
            <View style={[styles.modernModalIconCircle, { backgroundColor: 'rgba(81,130,118,0.1)' }]}>
              <Icon name="content-save-cog" size={22} color="#518276" />
            </View>
            <Text style={styles.modernModalTitle}>Upload Settings</Text>
          </View>

          {['all', 'therapy', 'alert', 'display', 'common'].map(item => {
            const isActive = selectedPackets[item];
            return (
              <View key={item} style={{ zIndex: item === 'therapy' ? 1000 : 1, position: 'relative' }}>
                <TouchableOpacity
                  onPress={() => {
                    togglePacket(item);
                    if (item === 'therapy') {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setTherapyDropdownOpen(!isActive);
                    }
                  }}
                  style={[styles.modernPacketItem, isActive && styles.modernPacketItemActive]}
                >
                  <Icon
                    name={isActive ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={22}
                    color={isActive ? '#10B981' : '#94A3B8'}
                  />
                  <Text style={[styles.modernPacketText, isActive && styles.modernPacketTextActive]}>
                    {item}
                  </Text>
                  {item === 'therapy' && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setTherapyDropdownOpen(!therapyDropdownOpen);
                      }}
                      style={{ marginLeft: 'auto', padding: 4 }}
                    >
                      <Icon
                        name={therapyDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#518276"
                      />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                {item === 'therapy' && therapyDropdownOpen && (
                  <View style={styles.modernSubModeColumn}>
                    {['CPAP', 'Auto CPAP', 'S', 'T', 'ST', 'VAPS'].map((mode, index) => {
                      const isModeActive = selectedPackets[mode];
                      return (
                        <Reanimated.View
                          key={mode}
                          entering={FadeInDown.delay(index * 60).duration(200)}
                        >
                          <TouchableOpacity
                            onPress={() => togglePacket(mode)}
                            style={[
                              styles.modernSubModeItemVertical,
                              isModeActive && styles.modernSubModeItemVerticalActive,
                            ]}
                          >
                            <Icon
                              name={isModeActive ? 'checkbox-marked' : 'checkbox-blank-outline'}
                              size={18}
                              color={isModeActive ? '#10B981' : '#94A3B8'}
                            />
                            <Text
                              style={[
                                styles.modernSubModeText,
                                isModeActive && styles.modernSubModeTextActive,
                              ]}
                            >
                              {mode}
                            </Text>
                          </TouchableOpacity>
                        </Reanimated.View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          <View style={styles.modernButtonRow}>
            <TouchableOpacity
              onPress={() => setPacketModalVisible(false)}
              style={styles.modernCancelButton}
            >
              <Text style={styles.modernCancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setPacketModalVisible(false);
                handleSave();
              }}
              style={styles.modernSendButton}
            >
              <Text style={styles.modernSendButtonText}>Upload</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    <Modal visible={syncPacketModalVisible} transparent animationType="fade">
      <View style={styles.modernModalOverlay}>
        <View style={styles.modernModalContainer}>
          <View style={styles.modernModalHeader}>
            <View style={[styles.modernModalIconCircle, { backgroundColor: 'rgba(168,85,247,0.1)' }]}>
              <Icon name="cloud-sync" size={22} color="#A855F7" />
            </View>
            <Text style={styles.modernModalTitle}>Sync Settings</Text>
          </View>

          {['all', 'therapy', 'alert', 'display', 'common'].map(item => {
            const isActive = selectedSyncPackets[item];
            return (
              <View key={item} style={{ zIndex: item === 'therapy' ? 1000 : 1, position: 'relative' }}>
                <TouchableOpacity
                  onPress={() => {
                    toggleSyncPacket(item);
                    if (item === 'therapy') {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setSyncTherapyDropdownOpen(!isActive);
                    }
                  }}
                  style={[styles.modernPacketItem, isActive && styles.modernPacketItemActive]}
                >
                  <Icon
                    name={isActive ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={22}
                    color={isActive ? '#10B981' : '#94A3B8'}
                  />
                  <Text style={[styles.modernPacketText, isActive && styles.modernPacketTextActive]}>
                    {item}
                  </Text>
                  {item === 'therapy' && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setSyncTherapyDropdownOpen(!syncTherapyDropdownOpen);
                      }}
                      style={{ marginLeft: 'auto', padding: 4 }}
                    >
                      <Icon
                        name={syncTherapyDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#518276"
                      />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                {item === 'therapy' && syncTherapyDropdownOpen && (
                  <View style={styles.modernSubModeColumn}>
                    {['CPAP', 'Auto CPAP', 'S', 'T', 'ST', 'VAPS'].map((mode, index) => {
                      const isModeActive = selectedSyncPackets[mode];
                      return (
                        <Reanimated.View
                          key={mode}
                          entering={FadeInDown.delay(index * 60).duration(200)}
                        >
                          <TouchableOpacity
                            onPress={() => toggleSyncPacket(mode)}
                            style={[
                              styles.modernSubModeItemVertical,
                              isModeActive && styles.modernSubModeItemVerticalActive,
                            ]}
                          >
                            <Icon
                              name={isModeActive ? 'checkbox-marked' : 'checkbox-blank-outline'}
                              size={18}
                              color={isModeActive ? '#10B981' : '#94A3B8'}
                            />
                            <Text
                              style={[
                                styles.modernSubModeText,
                                isModeActive && styles.modernSubModeTextActive,
                              ]}
                            >
                              {mode}
                            </Text>
                          </TouchableOpacity>
                        </Reanimated.View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          <View style={styles.modernButtonRow}>
            <TouchableOpacity
              onPress={() => setSyncPacketModalVisible(false)}
              style={styles.modernCancelButton}
            >
              <Text style={styles.modernCancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setSyncPacketModalVisible(false);
                handleSync();
              }}
              style={styles.modernSendButton}
            >
              <Text style={styles.modernSendButtonText}>Sync</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    <Modal visible={wifiModalVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Connect WiFi</Text>
          
          <Text style={styles.wifiLabel}>WiFi SSID (Name)</Text>
          <TextInput
            style={styles.wifiInput}
            value={wifiSsid}
            onChangeText={setWifiSsid}
            placeholder="Enter WiFi SSID"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Text style={styles.wifiLabel}>WiFi Password</Text>
          <TextInput
            style={styles.wifiInput}
            value={wifiPassword}
            onChangeText={setWifiPassword}
            placeholder="Enter WiFi Password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => setWifiModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleWifiSend}
              style={styles.sendButton}
            >
              <Text style={styles.sendButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>


<Modal visible={logsModalVisible} transparent={false} animationType="slide">
  <SafeAreaView style={styles.logsModalContainer}>
    {/* Modern Header */}
    <View style={styles.logsHeader}>
      <Text style={styles.logsHeaderTitle}>Machine Logs</Text>
      <TouchableOpacity onPress={() => setLogsModalVisible(false)} style={styles.logsCloseButton}>
        <Icon name="close" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>

    <View style={{ flex: 1, padding: 20 }}>
      {/* Date pickers card (Fixed) */}
      <View style={styles.logsDownloadCard}>
        <Text style={styles.logsDownloadTitle}>Download Logs from Machine</Text>
        
        {/* Start Date and End Date in one row */}
        <View style={styles.logsDatePickerRow}>
          <View style={styles.logsDatePickerField}>
            <Text style={styles.logsDatePickerLabel}>Start Date</Text>
            <TouchableOpacity
              style={styles.logsDatePickerButton}
              onPress={() => {
                setShowEndPicker(false);
                setShowStartPicker(true);
              }}
            >
              <Icon name="calendar-start" size={16} color="#518276" />
              <Text style={styles.logsDatePickerValue}>
                {formatDisplayDate(logStartDate)}
              </Text>
              <Icon name="chevron-down" size={14} color="#518276" />
            </TouchableOpacity>
          </View>

          <View style={styles.logsDatePickerField}>
            <Text style={styles.logsDatePickerLabel}>End Date</Text>
            <TouchableOpacity
              style={styles.logsDatePickerButton}
              onPress={() => {
                setShowStartPicker(false);
                setShowEndPicker(true);
              }}
            >
              <Icon name="calendar-end" size={16} color="#518276" />
              <Text style={styles.logsDatePickerValue}>
                {formatDisplayDate(logEndDate)}
              </Text>
              <Icon name="chevron-down" size={14} color="#518276" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleDownloadLogs}
          style={styles.logsDownloadButton}
        >
          <View style={styles.logsDownloadButtonInner}>
            <Icon name="download" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.logsDownloadButtonText}>Download</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Downloaded Logs List Header (Fixed) */}
      <View style={styles.logsSectionHeader}>
        <Text style={styles.logsSectionTitle}>Downloaded Log Files</Text>
        <View style={styles.logsCountBadge}>
          <Text style={styles.logsCountBadgeText}>{downloadedLogs.length} files</Text>
        </View>
      </View>
      {/* Scrollable list of files only */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {downloadedLogs.length === 0 ? (
          <View style={styles.logsEmptyCard}>
            <Icon name="file-question-outline" size={48} color="#CBD5E1" />
            <Text style={styles.logsEmptyText}>No logs downloaded yet.</Text>
          </View>
        ) : (
          downloadedLogs.map(item => {
            const formatLogFileName = (name) => {
              const match = name.match(/logs_(\d{8})_(\d{8})\.txt$/);
              if (match) {
                const s = match[1];
                const e = match[2];
                return `${s.substring(6,8)}/${s.substring(4,6)}/${s.substring(0,4)} - ${e.substring(6,8)}/${e.substring(4,6)}/${e.substring(0,4)}`;
              }
              return name;
            };
            const sizeKB = (item.size / 1024).toFixed(1);

            return (
              <View key={item.path} style={styles.logFileCard}>
                <View style={styles.logFileIconWrapper}>
                  <Icon name="file-document-outline" size={20} color="#A855F7" />
                </View>
                
                <View style={styles.logFileDetails}>
                  <Text style={styles.logFileName} numberOfLines={1}>
                    {formatLogFileName(item.name)}
                  </Text>
                  <Text style={styles.logFileSize}>
                    Size: {sizeKB} KB
                  </Text>
                </View>

                <View style={styles.logActionRow}>
                  {/* Upload action */}
                  <TouchableOpacity
                    onPress={() => handleUploadLogFile(item)}
                    style={styles.logUploadBtn}
                  >
                    <Icon name="cloud-upload" size={16} color="#10B981" />
                  </TouchableOpacity>

                  {/* Download/Share action */}
                  <TouchableOpacity
                    onPress={() => handleShareLogFile(item)}
                    style={styles.logShareBtn}
                  >
                    <Icon name="download" size={16} color="#3B82F6" />
                  </TouchableOpacity>

                  {/* Delete action */}
                  <TouchableOpacity
                    onPress={() => handleDeleteLogFile(item)}
                    style={styles.logDeleteBtn}
                  >
                    <Icon name="delete" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  </SafeAreaView>
</Modal>

{/* Start Date Calendar — rendered OUTSIDE the modal, full screen */}
{showStartPicker && (
  <Modal visible={showStartPicker} transparent animationType="fade">
    <View style={styles.calendarOverlay}>
      <View style={styles.calendarContainer}>
        <Text style={styles.calendarTitle}>Select Start Date</Text>
    <DateTimePicker
  value={logStartDate}
  mode="date"
  display="calendar"
  maximumDate={new Date()}
  onChange={(event, selectedDate) => {

    setShowStartPicker(false);

    if (selectedDate) {
      setLogStartDate(selectedDate);

      if (selectedDate > logEndDate) {
        setLogEndDate(selectedDate);
      }
    }
  }}
/>
        <TouchableOpacity
          onPress={() => setShowStartPicker(false)}
          style={styles.calendarCancelBtn}
        >
          <Text style={styles.calendarCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}

{/* End Date Calendar — rendered OUTSIDE the modal, full screen */}
{showEndPicker && (
  <Modal visible={showEndPicker} transparent animationType="fade">
    <View style={styles.calendarOverlay}>
      <View style={styles.calendarContainer}>
        <Text style={styles.calendarTitle}>Select End Date</Text>
<DateTimePicker
  value={logEndDate}
  mode="date"
  display="calendar"
  minimumDate={logStartDate}
  maximumDate={new Date()}
  onChange={(event, selectedDate) => {

    setShowEndPicker(false);

    if (selectedDate) {
      setLogEndDate(selectedDate);
    }
  }}
/>
        <TouchableOpacity
          onPress={() => setShowEndPicker(false)}
          style={styles.calendarCancelBtn}
        >
          <Text style={styles.calendarCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}

      {/* ── Bluetooth Sending Overlay ── */}
      <Modal
        visible={isSendingBT}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.btOverlay}>
          <View style={styles.btCard}>
            <LottieView
              source={
                btProcessName.includes('Connection') || 
                btProcessName.includes('Disconnecting') || 
                btProcessName.includes('WiFi')
                  ? require('../assets/animations/Bluetooth.json')
                  : require('../assets/animations/uploading.json')
              }
              autoPlay
              loop
              style={{ width: 120, height: 120, marginBottom: 3 }}
            />
            <Text style={styles.btCardTitle}>{btProcessName}</Text>
            <Text style={styles.btCardStatus}>{btStatus}</Text>
            <TouchableOpacity
              onPress={() => {
                isCancelledRef.current = true;
                setIsSendingBT(false);
                setBtStatus('');
                cancelBluetoothConnection();
              }}
              style={styles.btCancelBtn}
            >
              <Text style={styles.btCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modern Error Modal */}
      <Modal visible={errorModal.visible} transparent animationType="fade">
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalCard}>
            <LottieView
              source={require('../assets/animations/Alert Warning Informtion.json')}
              autoPlay
              loop
              style={{ width: 100, height: 100, marginBottom: 8 }}
            />
            <Text style={styles.errorModalTitle}>{errorModal.title}</Text>
            <Text style={styles.errorModalMessage}>{errorModal.message}</Text>
            <TouchableOpacity style={styles.errorModalBtn} onPress={() => setErrorModal({ ...errorModal, visible: false })}>
              <Text style={styles.errorModalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffffff' },
  header: {
    backgroundColor: '#518276',
    // paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 24) + 10,
            paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 1 : 20,
    
    paddingBottom: 7,
    paddingHorizontal: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 2,
    marginTop: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitleContainer: { marginLeft: 15, flex: 1 },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  btStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },
  btStatusText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  headerActionRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 13,
    padding: 4,
    alignItems: 'center',
    marginHorizontal: -10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  actionIcon: { marginRight: 6 },
  actionBtnText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  connectBtn: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 2,
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabText: {
    fontSize: 10,
    // fontWeight: '1000',
    letterSpacing: 0.3,
  },
  disconnectTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  syncTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  saveTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  wifiTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  logsTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  content: { flex: 1, padding: 20 },
  // Main menu grid
  menuContainer: { flex: 1 },
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
    elevation: 8,
    shadowColor: '#305146ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderColor: 'rgba(16,185,129,0.05)',
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
  // Setup list
  listContainer: { flex: 1 },
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
    borderColor: 'rgba(16,185,129,0.05)',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.3,
  },
  listSubLabel: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },
  // Form
  formSection: { paddingBottom: 40 },
  fieldIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
    borderColor: 'rgba(16,185,129,0.1)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
    borderColor: 'rgba(16,185,129,0.1)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.3,
  },
  rangeText: {
    fontSize: 9.5,
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
    borderColor: 'rgba(13,148,136,0.15)',
  },
  valueBadgeText: { fontSize: 11, fontWeight: '800', color: '#0F766E' },
  valueBadgeUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D9488',
    marginLeft: 4,
  },
  // Empty screen
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
  returnBtnText: { color: '#FFF', fontWeight: 'bold' },
  // Picker popup
  pickerModalOverlay: { flex: 1, backgroundColor: 'transparent' },
  pickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    width: 150,
    position: 'absolute',
    right: 20,
    borderRadius: 22,
    paddingVertical: 10,
    elevation: 25,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  pickerLens: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    marginTop: 10,
    left: 10,
    right: 10,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    zIndex: 0,
  },
  pickerItemText: {
    fontSize: 15,
    color: '#10B981',
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
  // BT overlay
  btOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '78%',
    elevation: 20,
    shadowColor: '#518276',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  btCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 18,
    letterSpacing: 0.4,
  },
  btCardStatus: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  //popup
   modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },

  packetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },

  packetText: {
    marginLeft: 15,
    fontSize: 17,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    padding: 15,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
  },

  cancelButtonText: {
    fontWeight: '700',
  },

  sendButton: {
    flex: 1,
    backgroundColor: '#518276',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  sendButtonText: {
    color: '#FFF',
    fontWeight: '800',
  },
  subModeRow: {
    flexDirection: 'row',
    paddingLeft: 40,
    paddingVertical: 8,
    alignItems: 'center',
  },
  subModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  subModeText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '700',
  },
  wifiInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 16,
  },
   wifiLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
    gap: 10,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F766E',
  },
  dateSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 4,
    gap: 6,
  },
  dateSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  logsModalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#518276',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  logsHeaderTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  logsCloseButton: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
  },
  logsScrollContent: {
    padding: 20,
  },
  logsDownloadCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  logsDownloadTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
  },
  logsDatePickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  logsDatePickerField: {
    flex: 1,
  },
  logsDatePickerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  logsDatePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: 'rgba(81,130,118,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  logsDatePickerValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  logsDownloadButton: {
    backgroundColor: '#518276',
    width: '100%',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#518276',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logsDownloadButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logsDownloadButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  logsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logsSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  logsCountBadge: {
    backgroundColor: '#A855F720',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  logsCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A855F7',
  },
  logsEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  logsEmptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
  },
  logFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  logFileIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#A855F712',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logFileDetails: {
    flex: 1,
    marginRight: 8,
  },
  logFileName: {
    fontSize: 7,
    fontWeight: '700',
    color: '#1E293B',
  },
  logFileSize: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  logActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  logUploadBtn: {
    backgroundColor: '#ECFDF5',
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  logShareBtn: {
    backgroundColor: '#EFF6FF',
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  logDeleteBtn: {
    backgroundColor: '#FEF2F2',
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  modernModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modernModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '95%',
    maxWidth: 400,
    padding: 24,
    elevation: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modernModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  modernModalIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  modernPacketItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  modernPacketItemActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  modernPacketText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 12,
    textTransform: 'capitalize',
  },
  modernPacketTextActive: {
    color: '#065F46',
  },
  modernSubModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 10,
    marginTop: -4,
    marginBottom: 10,
  },
  modernSubModeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modernSubModeItemActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  modernSubModeColumn: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 10,
    zIndex: 9999,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modernSubModeItemVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  modernSubModeItemVerticalActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  modernSubModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 6,
  },
  modernSubModeTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
  modernButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  modernCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  modernCancelButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  modernSendButton: {
    flex: 2,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#518276',
    elevation: 3,
    shadowColor: '#518276',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  modernSendButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Modern Bottom Sheet Picker Styles
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '65%',
    minHeight: 320,
    borderTopWidth: 4,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 24,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bottomSheetIndicator: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
  },
  bottomSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    height: 60,
  },
  bottomSheetItemRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetItemRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bottomSheetItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    flex: 1,
  },
  btCancelBtn: {
    marginTop: 22,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    alignItems: 'center',
  },
  btCancelBtnText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  // Modern Error Modal Styles
  errorModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  errorModalCard: { width: '75%', backgroundColor: '#FFFFFF', borderRadius: 28, paddingHorizontal: 20, paddingVertical: 24, alignItems: 'center', elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
  errorModalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 6, textAlign: 'center', letterSpacing: 0.5 },
  errorModalMessage: { fontSize: 13, fontWeight: '500', color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  errorModalBtn: { backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center', elevation: 2, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  errorModalBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});

export default UpdateMachineSetting;
