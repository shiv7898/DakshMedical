// src/bluetooth/index.js
// Central export for ESP32 Bluetooth utilities.

export {
    connectToMachine,
    disconnectFromMachine,
    sendSettingsToESP32,
    requestBluetoothPermissions,
    syncSettingsFromESP32,
    syncLogsFromESP32,
    registerDisconnectCallback,
    activeDevice,
    sendWifiCredentials
} from './ESP32BluetoothService';
