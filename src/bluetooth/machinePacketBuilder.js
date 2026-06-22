// =============================================================================
// machinePacketBuilder.js
// Builds structured binary packets for the machine protocol v2.0
//
// PACKET FORMAT:
//   [AA][55][LEN][ACTION][SUB][DATA...][CRC_H][CRC_L]
//
// CRC: CRC-16/CCITT-FALSE (poly=0x1021, init=0xFFFF)
//      over bytes: [LEN][ACTION][SUB][DATA...]
// =============================================================================

// ── CRC-16/CCITT-FALSE ───────────────────────────────────────────────────────
export const calculateCRC16 = bytes => {
  let crc = 0xffff;

  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;

    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }

      crc &= 0xffff; // keep 16-bit
    }
  }

  return crc;
};
// ── Build raw byte array packet ───────────────────────────────────────────────
// payload = Uint8Array: [ACTION, SUB, ...DATA]
// Returns full Uint8Array: [0xAA, 0x55, LEN, ACTION, SUB, ...DATA, CRC_H, CRC_L]
export const buildRawPacket = payload => {
  const len = payload.length; // LEN = ACTION + SUB + data count
  const crc = calculateCRC16(payload); // CRC over payload ONLY (excluding LEN)
  return new Uint8Array([
    0xaa,
    0x55, // SOF
    len, // LEN
    ...payload, // ACTION + SUB + DATA
    crc & 0xff, // CRC_L
    (crc >> 8) & 0xff, // CRC_H
  ]);
};

// ── Uint8Array → hex string (for BT write as string) ─────────────────────────
export const bytesToHexString = bytes =>
  Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join('');

// ── Build REQUEST packet: AA55 04 01 02 [mode] 00 [CRC] ──────────────────────
// ACTION=0x01(ACK), SUB=0x02(CONFIG), mode=02(upload)||03(download), blank=00
export const buildRequestPacket = (mode = 0x02) => {
  const payload = new Uint8Array([0x01, 0x02, mode, 0x00]);
  return buildRawPacket(payload);
};

// ── Build SYNC REQUEST packet: AA55 03 03 [syncMode] 00 [CRC] ─────────────────
// ACTION=0x03(Download), SUB=syncMode, blank=00
export const buildSyncRequestPacket = syncMode => {
  const payload = new Uint8Array([0x03, syncMode, 0x00]);
  return buildRawPacket(payload);
};

// ── Build SUCCESS ACK packet: AA55 04 01 03 01 00 [CRC] ──────────────────────
// ACTION=0x01(ACK), SUB=0x03(Status), statusType=0x01(Success), blank=00
export const buildAckPacket = () => {
  const payload = new Uint8Array([0x01, 0x03, 0x01, 0x00]);
  return buildRawPacket(payload);
};

// ── Parse a STATUS response packet from machine ───────────────────────────────
// Expected: AA55 04 01 03 [statusType] 00 [CRC]
// Returns: { valid: bool, action, sub, statusType }
export const parseStatusPacket = bytes => {
  if (!bytes || bytes.length < 7) return { valid: false };
  if (bytes[0] !== 0xaa || bytes[1] !== 0x55) return { valid: false };

  const len = bytes[2];
  if (bytes.length < len + 5) return { valid: false }; // SOF(2)+LEN(1)+payload(len)+CRC(2)

  // Validate CRC
  const crcInput = Array.from(bytes.slice(3, 3 + len)); // payload ONLY (excluding LEN)
  const crcCalc = calculateCRC16(crcInput);
  const crcRecv = (bytes[4 + len] << 8) | bytes[3 + len]; // Little-endian: CRC_L first, then CRC_H
  // if (crcCalc !== crcRecv) {
  //     console.warn('[PKT] CRC mismatch:', crcCalc.toString(16), '!=', crcRecv.toString(16));
  //     return { valid: false };
  // }

  return {
    valid: true,
    action: bytes[3],
    sub: bytes[4],
    statusType: bytes[5],
    data: bytes.slice(5, 3 + len),
  };
};

// ── Parse hex string response to bytes ───────────────────────────────────────
export const hexStringToBytes = hexStr => {
  const clean = hexStr.replace(/\s/g, '');
  const bytes = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.substr(i, 2), 16));
  }
  return new Uint8Array(bytes);
};

// ─── Value formatters ─────────────────────────────────────────────────────────

const fmt2Byte = val => {
  //2 byte ka data send karane k liye
  const n = Math.round(parseFloat(val || 0) * 10);

  return [
    n & 0xff, // LOW
    (n >> 8) & 0xff, // HIGH
  ];
};
const fmt2ByteInt = val => {
  // 2 byte data send without multiplying by 10
  const n = Math.round(parseFloat(val || 0));

  return [
    n & 0xff,         // LOW
    (n >> 8) & 0xff,  // HIGH
  ];
};
const fmt1Byte = val => {
  // 1 byte data send karane k liye
  return [parseInt(val || 0) & 0xff];
};

const fmtBool = val => [val ? 0x01 : 0x00];

// fmtTime — converts a time string + AM/PM flag into 4 bytes: [hour, min, sec, ampm]
//
// For 12h mode: caller passes hour as 1–12 and timeAmPm as 'AM'/'PM'.
//   e.g. fmtTime('06:04:32', 'PM', '12h') → [0x06, 0x04, 0x20, 0x01]
// For 24h mode: caller passes hour as 0–23, timeAmPm is ignored.
//   e.g. fmtTime('18:04:32', 'AM', '24h') → [0x12, 0x04, 0x20, 0x00]
const fmtTime = (timeStr, timeAmPm, timeFormat) => {
  if (!timeStr) return [0x00, 0x00, 0x00, 0x00];
  const parts = (timeStr || '00:00:00').split(':').map(Number);
  const h = (parts[0] || 0) & 0xff;
  const m = (parts[1] || 0) & 0xff;
  const s = (parts[2] || 0) & 0xff;

  // In 12h mode: hour is already 1–12 and AM/PM comes from the timeAmPm param.
  // In 24h mode: no AM/PM byte (0x00).
  const ampm = timeFormat === '12h' ? (timeAmPm === 'PM' ? 0x01 : 0x00) : 0x00;

  return [h, m, s, ampm];
};

// weekday(1=Mon..7=Sun), month(1=Jan..12=Dec), date(1..31), year(e.g. 26)
const fmtDate = (weekday, month, day, year) => {
  return [
    (parseInt(weekday) || 1) & 0xff,
    (parseInt(month) || 1) & 0xff,
    (parseInt(day) || 1) & 0xff,
    (parseInt(year) || 0) & 0xff,
  ];
};
// const da = fmtDate(1, 1, 1, 26);
// console.log('fmtDate', da);

const fmtMaskSize = s =>
  ({ Small: [0x00], Medium: [0x01], Large: [0x02] }[s] ?? [0x00]);
const fmtMaskType = t =>
  ({ Nasal: [0x00], Pillow: [0x01], 'Full Face': [0x02] }[t] ?? [0x00]);

// ── Parse dynamic configurations helper ──────────────────────────────────────
const parse2Byte = (low, high) => (((high << 8) | low) / 10).toFixed(1);
const parse2ByteInt = (low, high) =>
  Math.round(((high << 8) | low) / 10).toString();
const parse1Byte = val => val.toString();

export const parseConfigDataPacket = (syncMode, data) => {
  switch (syncMode) {
    case 0x01: // CPAP
      return {
        cpapPressure: parse2Byte(data[0], data[1]),
        startPressure: parse2Byte(data[2], data[3]),
        rampDuration: parse1Byte(data[4]),
        pressureOff: parse1Byte(data[5]),
      };

    case 0x02: // Auto CPAP
      return {
        minPressure: parse2Byte(data[0], data[1]),
        maxPressure: parse2Byte(data[2], data[3]),
        startPressure: parse2Byte(data[4], data[5]),
        rampDuration: parse1Byte(data[6]),
        pressureOff: parse1Byte(data[7]),
      };

    case 0x03: // S
      return {
        ipapS: parse2Byte(data[0], data[1]),
        epapS: parse2Byte(data[2], data[3]),
        iTriggerS: parse1Byte(data[4]),
        eTriggerS: parse1Byte(data[5]),
        pressRiseS: parse1Byte(data[6]),
        tiMaxS: parse2Byte(data[7], data[8]),
        tiMinS: parse2Byte(data[9], data[10]),
      };

    case 0x04: // T
      return {
        ipapT: parse2Byte(data[0], data[1]),
        epapT: parse2Byte(data[2], data[3]),
        breathRateT: parse1Byte(data[4]),
        ieRatioT: parse2Byte(data[5], data[6]),
        pressRiseT: parse1Byte(data[7]),
      };

    case 0x05: // ST
      return {
        ipapST: parse2Byte(data[0], data[1]),
        epapST: parse2Byte(data[2], data[3]),
        breathRateST: parse1Byte(data[4]),
        ieRatioST: parse2Byte(data[5], data[6]),
        iTriggerST: parse1Byte(data[7]),
        eTriggerST: parse1Byte(data[8]),
        pressRiseST: parse1Byte(data[9]),
        tiMaxST: parse2Byte(data[10], data[11]),
        tiMinST: parse2Byte(data[12], data[13]),
      };

    case 0x06: // VAPS
      return {
        ipapMaxVaps: parse2Byte(data[0], data[1]),
        ipapMinVaps: parse2Byte(data[2], data[3]),
        epapVaps: parse2Byte(data[4], data[5]),
        vtVaps: parse2Byte(data[6], data[7]),
        breathRateVaps: parse1Byte(data[8]),
        ieRatioVaps: parse2Byte(data[9], data[10]),
        iTriggerVaps: parse1Byte(data[11]),
        eTriggerVaps: parse1Byte(data[12]),
        pressRiseVaps: parse1Byte(data[13]),
      };

    case 0x07: // Alert
      return {
        leakAlert: data[0] === 0x01,
        lowPressureAlarm: parse2Byte(data[1], data[2]),
        highRateAlarm: parse1Byte(data[3]),
        lowRateAlarm: parse1Byte(data[4]),
        memoryCardError: data[5] === 0x01,
        autoOn: data[6] === 0x01,
        autoOff: data[7] === 0x01,
      };

    case 0x08: {
   

      const is24h = data[5] === 0x01;

      const screenSaver = data[6];

      const weekday = data[7];
      const month = data[8];
      const day = data[9];
      const year = data[10];

      let hour = data[11];
      const minute = data[12];
      const second = data[13];
      const ampm = data[14];

      // App ke liye internally 24h format me convert
      if (!is24h) {
        if (ampm === 0x01) {
          // PM
          if (hour < 12) hour += 12;
        } else {
          // AM
          if (hour === 12) hour = 0;
        }
      }

      const timeStr = `${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}:${second.toString().padStart(2, '0')}`;

      const weekNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      return {
        brightness: parse1Byte(data[0]),
        preheatTray: data[1] === 0x01,
        sdTray: data[2] === 0x01,
        wifiTray: data[3] === 0x01,
        serviceTray: data[4] === 0x01,

        timeFormat: is24h ? '24h' : '12h',
        screenSaver: screenSaver.toString(),

        currentTime: timeStr,
        timeAmPm: ampm === 0x01 ? 'PM' : 'AM',

        weekday: weekday.toString(),
        dateMonth: month.toString(),
        dateDay: day.toString(),
        dateYear: year.toString(),
        weekdayName: weekNames[weekday] || '',
      };
    }

    case 0x09: // Common
      return {
        preheatTime: data[0].toString(),
        beep: data[1] === 0x01,
        serviceReminder: data[2] === 0x01,
        autoUploadLog: data[3] === 0x01,
        maskSize:
          data[4] === 0x01 ? 'Small' : data[4] === 0x02 ? 'Medium' : 'Large',
        maskType:
          data[5] === 0x01
            ? 'Nasal'
            : data[5] === 0x02
            ? 'Pillow'
            : 'Full Face',
        humidifierLevel: parse1Byte(data[6]),
      };

    default:
      return {};
  }
};



// ── Build CONFIG SEND packets (one per settings group) ────────────────────────
// Returns array of Uint8Array packets

export const buildConfigSendPackets = setupData => {
  const packets = [];

  // THERAPY packet
  if (setupData.therapy) {
    const therapyList = Array.isArray(setupData.therapy) ? setupData.therapy : [setupData.therapy];

    therapyList.forEach(therapyObj => {
      const {
        therapyMode,
        cpapPressure,
        minPressure,
        maxPressure,
        startPressure,
        rampDuration,
        pressureOff,
      } = therapyObj;
      let typeCode = 0x01;
      let data = [];

      switch (therapyMode) {
        case 'CPAP':
          typeCode = 0x01;
          data = [
            ...fmt2Byte(cpapPressure),
            ...fmt2Byte(startPressure),
            ...fmt1Byte(rampDuration),
            ...fmt1Byte(pressureOff),
          ];
          break;
        case 'Auto CPAP':
          typeCode = 0x02;
          data = [
            ...fmt2Byte(minPressure),
            ...fmt2Byte(maxPressure),
            ...fmt2Byte(startPressure),
            ...fmt1Byte(rampDuration),
            ...fmt1Byte(pressureOff),
          ];
          break;
        case 'S':
          typeCode = 0x03;
          data = [
            ...fmt2Byte(therapyObj.ipapS),
            ...fmt2Byte(therapyObj.epapS),
            ...fmt1Byte(therapyObj.iTriggerS),
            ...fmt1Byte(therapyObj.eTriggerS),
            ...fmt1Byte(therapyObj.pressRiseS),
            ...fmt2Byte(therapyObj.tiMaxS),
            ...fmt2Byte(therapyObj.tiMinS),
          ];
          break;
        case 'T':
          typeCode = 0x04;
          data = [
            ...fmt2Byte(therapyObj.ipapT),
            ...fmt2Byte(therapyObj.epapT),
            ...fmt1Byte(therapyObj.breathRateT),
            ...fmt2Byte(therapyObj.ieRatioT),
            ...fmt1Byte(therapyObj.pressRiseT),
          ];
          break;
        case 'ST':
          typeCode = 0x05;
          data = [
            ...fmt2Byte(therapyObj.ipapST),
            ...fmt2Byte(therapyObj.epapST),
            ...fmt1Byte(therapyObj.breathRateST),
            ...fmt2Byte(therapyObj.ieRatioST),
            ...fmt1Byte(therapyObj.iTriggerST),
            ...fmt1Byte(therapyObj.eTriggerST),
            ...fmt1Byte(therapyObj.pressRiseST),
            ...fmt2Byte(therapyObj.tiMaxST),
            ...fmt2Byte(therapyObj.tiMinST),
          ];
          break;
        case 'VAPS':
          typeCode = 0x06;
          data = [
            ...fmt2Byte(therapyObj.ipapMaxVaps),
            ...fmt2Byte(therapyObj.ipapMinVaps),
            ...fmt2Byte(therapyObj.epapVaps),
            ...fmt2ByteInt(therapyObj.vtVaps),
            ...fmt1Byte(therapyObj.breathRateVaps),
            ...fmt2Byte(therapyObj.ieRatioVaps),
            ...fmt1Byte(therapyObj.iTriggerVaps),
            ...fmt1Byte(therapyObj.eTriggerVaps),
            ...fmt1Byte(therapyObj.pressRiseVaps),
          ];
          break;
        default:
          typeCode = 0x01;
          data = [];  
          break;
      }

      const payload = new Uint8Array([0x02, typeCode, ...data]); // ACTION=0x02 (Upload), SUB=syncMode
      console.log('pa1', payload);
      packets.push(buildRawPacket(payload));
    });
  }

  // ALERT packet — type 0x07 (syncMode)
  if (setupData.alert) {
    const {
      leakAlert,
      lowPressureAlarm,
      highRateAlarm,
      lowRateAlarm,
      memoryCardError,
      autoOn,
      autoOff,
    } = setupData.alert;
    const data = [

      ...fmtBool(leakAlert), //1
      ...fmt2Byte(lowPressureAlarm), //2
      ...fmt1Byte(highRateAlarm), //1
      ...fmt1Byte(lowRateAlarm), //1
      ...fmtBool(memoryCardError), //1
      ...fmtBool(autoOn), //1
      ...fmtBool(autoOff), //1
    ];
    const payload = new Uint8Array([0x02, 0x07, ...data]); // ACTION=0x02, SUB=0x07
    packets.push(buildRawPacket(payload));
  }

  // DISPLAY packet — type 0x08 (syncMode)
  if (setupData.display) {
    const {
      brightness,
      preheatTray,
      sdTray,
      wifiTray,
      serviceTray,
      currentTime,
      timeAmPm,
      weekday,
      dateMonth,
      dateDay,
      dateYear,
      timeFormat,
      screenSaver,
    } = setupData.display;
    const data = [
      ...fmt1Byte(brightness),
      ...fmtBool(preheatTray),
      ...fmtBool(sdTray),
      ...fmtBool(wifiTray),
      ...fmtBool(serviceTray),
      timeFormat === '24h' ? 0x01 : 0x00,
      ...fmt1Byte(screenSaver),
      ...fmtDate(weekday, dateMonth, dateDay, dateYear),
      ...fmtTime(currentTime, timeAmPm, timeFormat),
    ];
    const payload = new Uint8Array([0x02, 0x08, ...data]); // ACTION=0x02, SUB=0x08
    packets.push(buildRawPacket(payload));
  }

  // COMMON packet — type 0x09 (syncMode)
  if (setupData.common) {
    const {
      preheatTime,
      humidifierLevel,
      maskSize,
      maskType,
      beep,
      serviceReminder,
      autoUploadLog,
    } = setupData.common;
    const data = [
      ...fmt1Byte(preheatTime),
      ...fmtBool(beep),
      ...fmtBool(serviceReminder),
      ...fmtBool(autoUploadLog),
      ...fmtMaskSize(maskSize),
      ...fmtMaskType(maskType),
      ...fmt1Byte(humidifierLevel),
    ];
    const payload = new Uint8Array([0x02, 0x09, ...data]); // ACTION=0x02, SUB=0x09
    packets.push(buildRawPacket(payload));
  }
  console.log('================ FINAL PACKETS ================');

  packets.forEach((pkt, index) => {
    console.log(`Packet ${index + 1}:`, bytesToHexString(pkt));
  });

  return packets;
};
// const da=buildbuildConfigSendPackets()

// ── Build LOG SYNC REQUEST packet ─────────────────────────────────────────────
// ACTION=0x03, SUB=0x0A (10 decimal)
// Data: [startDay, startMonth, startYear, endDay, endMonth, endYear]
// Packet: AA 55 08 03 0A DD MM YY DD MM YY CRC_L CRC_H
export const buildLogSyncRequestPacket = (startDate, endDate) => {
  const startDay = startDate.getDate() & 0xff;
  const startMonth = (startDate.getMonth() + 1) & 0xff; // JS months are 0-indexed
  const startYear = (startDate.getFullYear() % 100) & 0xff; // 2-digit year

  const endDay = endDate.getDate() & 0xff;
  const endMonth = (endDate.getMonth() + 1) & 0xff;
  const endYear = (endDate.getFullYear() % 100) & 0xff;

  const payload = new Uint8Array([
    0x03,       // ACTION (0x03 = Download)
    0x0a,       // SUB (0x0A = logs = 10 decimal)
    startDay, startMonth, startYear,
    endDay, endMonth, endYear,
  ]);

  console.log('[PKT] Log sync payload:', Array.from(payload).map(b => b.toString(16).padStart(2, '0')).join(' '));
  return buildRawPacket(payload);
};

// ── Legacy string-based builder (kept for backward compat) ───────────────────
export const buildMachineSettingsPacket = setupData => {
  const pkts = buildConfigSendPackets(setupData);

  return pkts.map(p => bytesToHexString(p)).join('\n');
};
