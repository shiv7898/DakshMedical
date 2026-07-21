// =============================================================================
// ESP32BluetoothService.js
// Protocol v3.0 — New Packet Protocol
//
// UPLOAD FLOW (Mobile → Machine):
//   1. Send REQUEST  → AA55 04 01 02 02 00 [CRC]  (mode=02 upload)
//   2. Wait READY    ← AA55 04 01 03 04 00 [CRC]  (statusType=04)
//   3. For each config packet:
//        a. Send config  → AA55 [LEN] 02 [syncMode] [data] [CRC]
//        b. Wait SUCCESS ← AA55 04 01 03 01 00 [CRC]  (statusType=01)
//
// DOWNLOAD FLOW (Machine → Mobile):
//   1. Send REQUEST   → AA55 04 01 02 03 00 [CRC]  (mode=03 download)
//   2. Wait READY     ← AA55 04 01 03 04 00 [CRC]
//   3. For each syncMode (01–09):
//        a. Send SYNC REQ → AA55 03 03 [syncMode] 00 [CRC]
//        b. Wait data     ← AA55 [LEN] 03 [syncMode] [data] [CRC]
//        c. Send ACK      → AA55 04 01 03 01 00 [CRC]  (Success)
//
// STATUS TYPE: 01=Success, 02=Fail, 03=Busy, 04=Ready, 05=WrongPacket
// =============================================================================

import { Platform, PermissionsAndroid } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import {
  buildRequestPacket,
  buildSyncRequestPacket,
  buildAckPacket,
  buildConfigSendPackets,
  parseStatusPacket,
  parseConfigDataPacket,
  bytesToHexString,
  buildLogSyncRequestPacket,
} from './machinePacketBuilder';

// ── Config ────────────────────────────────────────────────────────────────────
const DEVICE_NAME = 'ESP32_BT';
const CONNECT_RETRIES = 3;

// Timeouts
const STATUS_TIMEOUT = 8000; // ms — wait for Ready status after request
const CONFIG_TIMEOUT = 15000; // ms — wait for Save success
const READ_TIMEOUT = 20000; // ms — total time to receive all read packets
const PKT_GAP_TIMEOUT = 3000; // ms — gap between consecutive read packets

// Status byte values (matches ESP32 firmware)
const STATUS_SUCCESS = 0x01;
const STATUS_FAIL = 0x02;
const STATUS_BUSY = 0x03;
const STATUS_READY = 0x04;
const STATUS_WRONG_PACKET = 0x05;

// SyncMode list for download (all 9 sections)
const SYNC_MODES = [0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09];

// ── Shared State ──────────────────────────────────────────────────────────────
export let activeDevice = null;
let onDisconnectSubscription = null;
let disconnectCallback = null;

export const registerDisconnectCallback = cb => {
  disconnectCallback = cb;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));
const norm = s => (s ?? '').trim().toLowerCase();

// ── Permissions ───────────────────────────────────────────────────────────────
export const requestBluetoothPermissions = async () => {
  if (Platform.OS !== 'android') return true;
  try {
    if (Platform.Version >= 31) {
      const grants = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(grants).every(
        s => s === PermissionsAndroid.RESULTS.GRANTED,
      );
    } else {
      const g = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return g === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch (e) {
    console.warn('[BT] Permission error:', e);
    return false;
  }
};

// ── Device Discovery ──────────────────────────────────────────────────────────
const findESP32Device = async () => {
  const paired = await RNBluetoothClassic.getBondedDevices();
  const target = paired.find(d => norm(d.name) === norm(DEVICE_NAME));
  if (!target) {
    throw new Error(
      `"${DEVICE_NAME}" not found in paired devices. Pair it in Android Settings first.`,
    );
  }
  return target;
};

let isConnectCancelled = false;

export const cancelBluetoothConnection = () => {
  isConnectCancelled = true;
};

// ── Connection with Retry ─────────────────────────────────────────────────────
const connectWithRetry = async (device, onStatus) => {
  isConnectCancelled = false;
  for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt++) {
    if (isConnectCancelled) throw new Error('Cancelled by user');
    try {
      if (onStatus) onStatus(`Connecting attempt ${attempt}/${CONNECT_RETRIES}...`);
      console.log(`[BT] 🔌 Connect attempt ${attempt}/${CONNECT_RETRIES}…`);
      const isConn = await device.isConnected().catch(() => false);
      if (isConn) {
        await device.disconnect().catch(() => {});
        await delay(600);
      }
      const connectPromise = device.connect({ DELIMITER: '', DEVICE_CHARSET: 'latin1' });
      const timeoutPromise = new Promise((_, reject) => {
        let elapsed = 0;
        const interval = setInterval(() => {
          elapsed += 200;
          if (isConnectCancelled) { clearInterval(interval); reject(new Error('Cancelled by user')); }
          if (elapsed >= 5000) { clearInterval(interval); reject(new Error('Connection Timeout')); }
        }, 200);
      });
      await Promise.race([connectPromise, timeoutPromise]);
      
      console.log('[BT] ✅ Connected to', device.name);
      return device;
    } catch (err) {
      console.warn(`[BT] Attempt ${attempt} failed:`, err.message);
      if (err.message === 'Cancelled by user') {
         await device.disconnect().catch(() => {});
         throw err;
      }
      if (err.message === 'Connection Timeout') {
         // Attempt to cancel stuck connection
         await device.disconnect().catch(() => {});
      }
      if (attempt < CONNECT_RETRIES) {
         for (let i = 0; i < 50; i++) {
           if (isConnectCancelled) throw new Error('Cancelled by user');
           await delay(100);
         }
      }
    }
  }
  throw new Error(
    `Could not connect to "${DEVICE_NAME}" after ${CONNECT_RETRIES} attempts.`,
  );
};

// ── Write binary packet to device ─────────────────────────────────────────────
// Convert Uint8Array to base64 string safely
const toBase64 = bytes => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    base64 += chars[b1 >> 2];
    base64 += chars[((b1 & 3) << 4) | (b2 >> 4)];
    base64 += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    base64 += i + 2 < bytes.length ? chars[b3 & 63] : '=';
  }
  return base64;
};

const writePacket = async (device, packet) => {
  const b64 = toBase64(packet);
  await device.write(b64, 'base64');
  console.log('[BT] 📤 Sent:', bytesToHexString(packet));
};

// ── Read & collect bytes until a valid structured packet is detected ───────────
// Returns parsed packet object or null on timeout
const readStatusPacket = (device, timeoutMs) =>
  // console.log("device",device)
  new Promise(resolve => {
    let buffer = [];
    let subscription = null;
    let resolved = false;

    const done = result => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try {
        subscription?.remove();
      } catch (_) {}
      resolve(result);
    };

    const timer = setTimeout(() => {
      console.warn('[BT] ⏰ Status read timeout after', timeoutMs, 'ms');
      done(null);
    }, timeoutMs);
    console.log('[BT] Registering onDataReceived...');

    subscription = device.onDataReceived(event => {
      // console.log('event----from esp', event);

      const raw = event?.data ?? '';
      console.log('raw data:from esp-', raw);
      console.log('raw data length from esp-', raw.length);

      if (!raw) return;

      // Convert incoming string chars to bytes
      for (let i = 0; i < raw.length; i += 2) {
        const byte = parseInt(raw.substring(i, i + 2), 16);

        if (!isNaN(byte)) {
          buffer.push(byte);
        }
      }
      // console.log('[BT] 📥 Buffer:', buffer.map(b => b.toString(16).padStart(2, '0')).join(' '));
      // console.log(
      //   '[BT] 📥 Buffer:',
      //   buffer
      //     .map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase())
      //     .join(' '),
      // );

      // Try to find SOF AA 55 and parse a packet
      let i = 0;
      while (i < buffer.length - 1) {
        if (buffer[i] === 0xaa && buffer[i + 1] === 0x55) {
          if (buffer.length < i + 3) break; // need LEN byte
          const len = buffer[i + 2];
          const totalLen = len + 5; // SOF(2)+LEN(1)+payload(len)+CRC(2)
          if (buffer.length < i + totalLen) break; // incomplete
          const pktBytes = new Uint8Array(buffer.slice(i, i + totalLen));
          const parsed = parseStatusPacket(pktBytes);
          if (parsed.valid) {
            buffer = buffer.slice(i + totalLen); // consume packet
            done(parsed);
            return;
          }
        }
        i++;
      }
    });
  });

const readDataPackets = (device, onPacket, totalTimeoutMs, gapTimeoutMs) =>
  new Promise(resolve => {
    let buffer = [];
    let subscription = null;
    let resolved = false;
    let gapTimer = null;

    const done = result => {
      if (resolved) return;
      resolved = true;
      clearTimeout(overallTimer);
      clearTimeout(gapTimer);
      try {
        subscription?.remove();
      } catch (_) {}
      resolve(result);
    };

    const overallTimer = setTimeout(() => {
      console.warn('[BT] ⏰ Data read overall timeout');
      done({
        success: false,
        message: 'Read timeout — no complete response from machine',
      });
    }, totalTimeoutMs);

    const resetGapTimer = () => {
      clearTimeout(gapTimer);
      gapTimer = setTimeout(() => {
        done({
          success: false,
          message: 'Read gap timeout — stream stopped unexpectedly',
        });
      }, gapTimeoutMs);
    };

    subscription = device.onDataReceived(event => {
      const raw = event?.data ?? '';
      if (!raw) return;
      resetGapTimer();

      for (let i = 0; i < raw.length; i++) {
        let d = raw.charCodeAt(i) & 0xff;
        console.log('d', d);
        buffer.push(d);
      }

      let i = 0;
      while (i < buffer.length - 1) {
        if (buffer[i] === 0xaa && buffer[i + 1] === 0x55) {
          if (buffer.length < i + 3) break;
          const len = buffer[i + 2];
          const totalLen = len + 5;
          if (buffer.length < i + totalLen) break;
          const pktBytes = new Uint8Array(buffer.slice(i, i + totalLen));
          console.log('pktBytes', pktBytes);
          const parsed = parseStatusPacket(pktBytes);
          console.log('parsed', parsed);
          buffer = buffer.slice(i + totalLen);
          console.log('buffer', buffer);

          if (!parsed.valid) {
            i = 0;
            continue;
          }

          if (parsed.action === 0x02) {
            // CONFIG data packet — pass to caller
            console.log(
              '[BT] 📥 Data packet received, type=',
              parsed.sub?.toString(16),
            );
            onPacket(pktBytes, parsed);
            i = 0;
          } else if (parsed.action === 0x01 && parsed.sub === 0x02) {
            // STATUS packet — final answer
            console.log(
              '[BT] 📥 Final STATUS=',
              parsed.statusType?.toString(16),
            );
            if (parsed.statusType === STATUS_SUCCESS) {
              done({ success: true, message: 'Data read complete' });
            } else {
              done({
                success: false,
                message: `Machine returned status 0x${parsed.statusType?.toString(
                  16,
                )}`,
              });
            }
            return;
          }
        } else {
          i++;
        }
      }
    });

    resetGapTimer(); // start gap timer
  });

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

const handleDeviceDisconnected = () => {
  console.log('[BT] Handling device disconnection...');
  activeDevice = null;
  if (onDisconnectSubscription) {
    onDisconnectSubscription.remove();
    onDisconnectSubscription = null;
  }
  if (disconnectCallback) {
    disconnectCallback();
  }
};

// ── Connect ───────────────────────────────────────────────────────────────────
export const connectToMachine = async (onStatus = () => {}) => {
  try {
    onStatus('Checking Bluetooth permissions…');
    if (!(await requestBluetoothPermissions())) {
      throw new Error('Bluetooth permissions denied.');
    }

    onStatus('Checking Bluetooth is enabled…');
    if (!(await RNBluetoothClassic.isBluetoothEnabled())) {
      throw new Error('Bluetooth is off. Please enable it.');
    }

    onStatus(`Searching for "${DEVICE_NAME}"…`);
    const foundDevice = await findESP32Device();

    onStatus(`Connecting attempt 1/${CONNECT_RETRIES}...`);
    activeDevice = await connectWithRetry(foundDevice, onStatus);
    await delay(600);

    // Setup disconnect subscription
    if (onDisconnectSubscription) {
      onDisconnectSubscription.remove();
      onDisconnectSubscription = null;
    }
    onDisconnectSubscription = RNBluetoothClassic.onDeviceDisconnected(event => {
      console.log('[BT] Device disconnected event:', event);
      handleDeviceDisconnected();
    });

    onStatus('Connected ✅');
    return { success: true, message: 'Connected successfully' };
  } catch (err) {
    console.error('[BT] ❌ Connect Error:', err.message);
    onStatus('Error: ' + err.message);
    return { success: false, message: err.message };
  }
};

// ── Disconnect ────────────────────────────────────────────────────────────────
export const disconnectFromMachine = async (onStatus = () => {}) => {
  try {
    if (activeDevice) {
      onStatus('Disconnecting…');
      if (onDisconnectSubscription) {
        onDisconnectSubscription.remove();
        onDisconnectSubscription = null;
      }
      if (await activeDevice.isConnected().catch(() => false)) {
        await activeDevice.disconnect();
      }
      activeDevice = null;
      onStatus('Disconnected ✅');
      return { success: true, message: 'Disconnected' };
    }
    return { success: true, message: 'Already disconnected' };
  } catch (err) {
    console.error('[BT] ❌ Disconnect Error:', err.message);
    activeDevice = null;
    if (onDisconnectSubscription) {
      onDisconnectSubscription.remove();
      onDisconnectSubscription = null;
    }
    onStatus('Error: ' + err.message);
    return { success: false, message: err.message };
  }
};

// ── Send Settings to Machine ───────────────────────────────────────────────────
// New Protocol Flow:
//   REQUEST(upload) → READY → [config packet → SUCCESS] per packet
export const sendSettingsToESP32 = async (setupData, onStatus = () => {}) => {
  const device = activeDevice;
  if (!device) {
    return { success: false, message: 'Not connected. Connect BT first.' };
  }

  try {
    // ── STEP 1: Send REQUEST (mode=02 upload) ─────────────────────────────
    onStatus('Sending upload request to machine…');
    const reqPacket = buildRequestPacket(0x02); // 0x02 = Upload
    await writePacket(device, reqPacket);
    console.log('[BT] 📤 REQUEST sent:', bytesToHexString(reqPacket));

    // ── STEP 2: Wait for READY (statusType=0x04) ──────────────────────────
    onStatus('Waiting for machine ready…');
    const readyResp = await readStatusPacket(device, STATUS_TIMEOUT);
    console.log('[BT] READY response:', readyResp);

    if (!readyResp) {
      return { success: false, message: 'Timeout: Machine did not respond.' };
    }
    if (readyResp.statusType === STATUS_BUSY) {
      return { success: false, message: 'Machine is busy. Try again.' };
    }
    if (readyResp.statusType === STATUS_FAIL) {
      return { success: false, message: 'Machine reported failure.' };
    }
    if (readyResp.statusType !== STATUS_READY) {
      return {
        success: false,
        message: `Unexpected status: 0x${readyResp.statusType?.toString(16)}`,
      };
    }

    onStatus('Machine ready ✅ Uploading settings…');

    // ── STEP 3: Send each CONFIG packet, wait SUCCESS after each ──────────
    const configPackets = buildConfigSendPackets(setupData);
    console.log('[BT] 📦 Config packets to send:', configPackets.length);
    console.log('[BT] 📦 Config packets to send:', configPackets);

    for (let idx = 0; idx < configPackets.length; idx++) {
      onStatus(`Sending packet ${idx + 1} of ${configPackets.length}…`);
      await writePacket(device, configPackets[idx]);
      console.log(
        '[BT] 📤 Config packet sent:',
        bytesToHexString(configPackets[idx]),
      );

      // Wait for SUCCESS response for each packet
      const saveResp = await readStatusPacket(device, CONFIG_TIMEOUT);
      console.log(`[BT] 📥 Packet ${idx + 1} response:`, saveResp);

      if (!saveResp) {
        return {
          success: false,
          message: `Timeout waiting for ACK on packet ${idx + 1}.`,
        };
      }
      if (saveResp.statusType === STATUS_WRONG_PACKET) {
        return {
          success: false,
          message: `Machine rejected packet ${idx + 1} (wrong format).`,
        };
      }
      if (saveResp.statusType === STATUS_FAIL) {
        return {
          success: false,
          message: `Machine failed to save packet ${idx + 1}.`,
        };
      }
      if (saveResp.statusType !== STATUS_SUCCESS) {
        return {
          success: false,
          message: `Packet ${
            idx + 1
          } unexpected status: 0x${saveResp.statusType?.toString(16)}`,
        };
      }

      console.log(`[BT] ✅ Packet ${idx + 1} saved.`);
      await delay(50);
    }

    onStatus('All settings uploaded ✅');
    return {
      success: true,
      message: 'Settings uploaded to machine successfully.',
    };
  } catch (err) {
    console.error('[BT] ❌ Upload Error:', err.message);
    onStatus('Error: ' + err.message);
    return { success: false, message: err.message };
  }
};

// ── Sync Settings FROM Machine ─────────────────────────────────────────────────
// New Protocol Flow:
//   REQUEST(download) → READY → per syncMode: [SYNC_REQ → data → ACK]
export const syncSettingsFromESP32 = async (modesToSync, onStatus = () => {}) => {
  const device = activeDevice;
  if (!device) {
    return { success: false, message: 'Not connected. Connect BT first.' };
  }

  const targetModes = (modesToSync && modesToSync.length > 0) ? modesToSync : SYNC_MODES;

  try {
    // ── STEP 1: Send REQUEST (mode=03 download) ───────────────────────────
    onStatus('Sending download request to machine…');
    const reqPacket = buildRequestPacket(0x03); // 0x03 = Download
    await writePacket(device, reqPacket);
    console.log('[BT] 📤 REQUEST sent====:', bytesToHexString(reqPacket));

    // ── STEP 2: Wait for READY (statusType=0x04) ──────────────────────────
    onStatus('Waiting for machine ready…');
    const readyResp = await readStatusPacket(device, STATUS_TIMEOUT);
    console.log('[BT] READY response======:', readyResp);

    if (!readyResp) {
      return { success: false, message: 'Timeout: Machine did not respond.' };
    }
    if (readyResp.statusType === STATUS_BUSY) {
      return { success: false, message: 'Machine is busy. Try again.' };
    }
    if (readyResp.statusType === STATUS_FAIL) {
      return { success: false, message: 'Machine communication failed.' };
    }
    if (readyResp.statusType !== STATUS_READY) {
      return {
        success: false,
        message: `Unexpected status: 0x${readyResp.statusType?.toString(16)}`,
      };
    }

    onStatus('Machine ready ✅ Downloading settings…');

    // ── STEP 3: For each syncMode, send SYNC_REQ → receive data → send ACK ─
    const syncedSettings = {};
    const syncModeNames = [
      'CPAP',
      'Auto CPAP',
      'S Mode',
      'T Mode',
      'ST Mode',
      'VAPS Mode',
      'Alert',
      'Display',
      'Common',
      'logs'
    ];

    for (let mi = 0; mi < targetModes.length; mi++) {
      const syncMode = targetModes[mi];
      const modeIdx = SYNC_MODES.indexOf(syncMode);
      const modeName = modeIdx !== -1 ? syncModeNames[modeIdx] : `Mode 0x${syncMode.toString(16)}`;
      onStatus(`Downloading ${modeName} (${mi + 1}/${targetModes.length})…`);

      // 3a. Send SYNC REQUEST
      const syncReqPacket = buildSyncRequestPacket(syncMode);
      await writePacket(device, syncReqPacket);
      console.log(`[GT] ${syncReqPacket}`);
      console.log(
        `[BT] 📤 SYNC_REQ syncMode=0x${syncMode.toString(16)}:`,
        bytesToHexString(syncReqPacket),
      );

      // 3b. Wait for data packet from machine (action=0x03, sub=syncMode)
      const dataResp = await readStatusPacket(device, CONFIG_TIMEOUT);
      console.log(`[BT] 📥 ${modeName} data---:`, dataResp);

      if (!dataResp) {
        return {
          success: false,
          message: `Timeout waiting for ${modeName} data.`,
        };
      }
      if (!dataResp.valid) {
        return {
          success: false,
          message: `Invalid packet received for ${modeName}.`,
        };
      }
      if (dataResp.statusType === STATUS_FAIL) {
        return {
          success: false,
          message: `Machine failed sending ${modeName}.`,
        };
      }

      // 3c. Parse data payload into settings object
      const parsed = parseConfigDataPacket(syncMode, dataResp.data);
      Object.assign(syncedSettings, parsed);
      console.log(`[BT] ✅ ${modeName} parsed:`, parsed);

      // 3d. Send SUCCESS ACK to machine
      const ackPacket = buildAckPacket();
      await writePacket(device, ackPacket);
      console.log(
        `[BT] 📤 ACK sent for ${modeName}:`,
        bytesToHexString(ackPacket),
      );

      await delay(50);
    }

    onStatus(`Sync complete ✅ All settings downloaded.`);
    return {
      success: true,
      message: 'Settings synced from machine successfully.',
      settings: syncedSettings,
    };
  } catch (err) {
    console.error('[BT] ❌ Sync Error:', err.message);
    onStatus('Error: ' + err.message);
    return { success: false, message: err.message };
  }
};
// wifi responce read

const readRawResponse = (device, timeoutMs) =>
  new Promise(resolve => {
    let subscription = null;
    let resolved = false;

    const done = result => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try {
        subscription?.remove();
      } catch (_) {}
      resolve(result);
    };

    const timer = setTimeout(() => {
      console.warn('[BT] ⏰ Raw response read timeout after', timeoutMs, 'ms');
      done(null);
    }, timeoutMs);

    subscription = device.onDataReceived(event => {
      const raw = event?.data ?? '';
      console.log('[BT] 📥 Raw received from esp:', raw);
      if (raw) {
        done(raw);
      }
    });
  });

export const sendWifiCredentials = async (ssid, password, onStatus = () => {}) => {
  const device = activeDevice;
  if (!device) {
    return { success: false, message: 'Not connected. Connect BT first.' };
  }
  try {
    const credentialString = `${ssid}^${password}`;
    console.log('[BT] Sending WiFi credentials string:', credentialString);
    onStatus('Sending WiFi credentials…');
    
    // Convert ASCII string to Uint8Array bytes
    const bytes = new Uint8Array(credentialString.length);
    for (let i = 0; i < credentialString.length; i++) {
      bytes[i] = credentialString.charCodeAt(i);
    }
    
    await writePacket(device, bytes);
    onStatus('WiFi credentials sent ✅ Waiting for response…');

    // Wait for response from machine
    const response = await readRawResponse(device, 10000); // 10s timeout
    console.log('[BT] 📥 Received response from machine:', response);
    
    if (response) {
      onStatus(`Response received: ${response} ✅`);
      return { 
        success: true, 
        message: `WiFi credentials sent successfully. Response: ${response}`,
        response: response
      };
    } else {
      onStatus('WiFi credentials sent ✅ (No response received)');
      return { 
        success: true, 
        message: 'WiFi credentials sent successfully, but no response was received from the machine.',
        response: null
      };
    }
  } catch (err) {
    console.error('[BT] ❌ Send WiFi Error:', err.message);
    onStatus('Error: ' + err.message);
    return { success: false, message: err.message };
  }
};

// ── Log Accumulator for long response times ───────────────────────────────────
// Keeps reading incoming data chunks until either the total timeout (4 minutes)
// is reached, or there is no new data for 8 seconds (idle timeout).
const readAccumulatedLogsResponse = (device, totalTimeoutMs = 240000, idleTimeoutMs = 8000, onStatus = () => {}) =>
  new Promise(resolve => {
    let subscription = null;
    let resolved = false;
    let accumulatedData = '';
    let idleTimer = null;

    const done = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(totalTimer);
      if (idleTimer) clearTimeout(idleTimer);
      try {
        subscription?.remove();
      } catch (_) {}
      resolve(accumulatedData);
    };

    const totalTimer = setTimeout(() => {
      console.warn('[BT] ⏰ Total logs read timeout after', totalTimeoutMs, 'ms');
      done();
    }, totalTimeoutMs);

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        console.log('[BT] Idle timeout reached. Finishing log read.');
        done();
      }, idleTimeoutMs);
    };

    resetIdleTimer();

    subscription = device.onDataReceived(event => {
      const raw = event?.data ?? '';
      console.log('[BT LOG DATA] Raw received from ESP32:', raw);
      if (raw) {
        accumulatedData += raw;
        onStatus(`Downloading: ${accumulatedData.length / 2} bytes received…`);
        resetIdleTimer();
      }
    });
  });

// ── Log Sync ──────────────────────────────────────────────────────────────────
// Sends a log download request with date range and reads back log data.
// Packet: AA 55 08 03 0A [startDD] [startMM] [startYY] [endDD] [endMM] [endYY] CRC
export const syncLogsFromESP32 = async (startDate, endDate, onStatus = () => {}) => {
  const device = activeDevice;
  if (!device) {
    return { success: false, message: 'Not connected. Connect BT first.' };
  }

  try {
    // ── STEP 1: Send REQUEST (mode=03 download) ─────────────────────────────
    onStatus('Sending download request to machine…');
    const reqPacket = buildRequestPacket(0x03); // 0x03 = Download
    await writePacket(device, reqPacket);
    console.log('[BT] 📤 LOGS REQ_HANDSHAKE sent:', bytesToHexString(reqPacket));

    // ── STEP 2: Wait for READY (statusType=0x04) ──────────────────────────
    onStatus('Waiting for machine ready…');
    const readyResp = await readStatusPacket(device, STATUS_TIMEOUT);
    console.log('[BT] LOGS READY response:', readyResp);

    if (!readyResp) {
      return { success: false, message: 'Timeout: Machine did not respond to log handshake.' };
    }
    if (readyResp.statusType === STATUS_BUSY) {
      return { success: false, message: 'Machine is busy. Try again.' };
    }
    if (readyResp.statusType === STATUS_FAIL) {
      return { success: false, message: 'Machine communication failed.' };
    }
    if (readyResp.statusType !== STATUS_READY) {
      return {
        success: false,
        message: `Unexpected status: 0x${readyResp.statusType?.toString(16)}`,
      };
    }

    onStatus('Machine ready ✅ Sending log request packet…');

    // ── STEP 3: Send log sync request packet ─────────────────────────────
    const logPacket = buildLogSyncRequestPacket(startDate, endDate);
    const hexStr = bytesToHexString(logPacket);
    console.log('[BT] 📤 LOG REQUEST packet:', hexStr);

    await writePacket(device, logPacket);

    // ── STEP 4: Wait for raw log response continuously ───────────────────
    onStatus('Waiting for log data response…');
    // Using 4 minutes total timeout and 8 seconds idle timeout to accumulate everything
    const response = await readAccumulatedLogsResponse(device, 240000, 8000, onStatus);
    console.log('[BT] 📥 LOG RESPONSE accumulated length:', response ? response.length / 2 : 0);

    if (response) {
      onStatus(`Log data received ✅`);
      console.log('=============== START LOGS DATA (HEX) ===============');
      const formattedResponse = response.match(/.{1,2}/g)?.join(' ') || response;
      console.log(formattedResponse);
      console.log('=============== END LOGS DATA (HEX) ===============');
      return {
        success: true,
        message: 'Log data received successfully.',
        response: response,
      };
    } else {
      onStatus('Log request sent but no response received.');
      return {
        success: false,
        message: 'Timeout: No log data received from machine.',
        response: null,
      };
    }
  } catch (err) {
    console.error('[BT] ❌ Log Sync Error:', err.message);
    onStatus('Error: ' + err.message);
    return { success: false, message: err.message };
  }
};
