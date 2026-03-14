/**
 * csvParser.js
 *
 * Supports NEW headerless device log format:
 *   Col 0 : timestamp          (YYYYMMDDHHmmss)
 *   Col 1 : therapy_status     (1=ON, 0=OFF)
 *   Col 2 : therapy_select     (1=CPAP, 2=Auto-CPAP)
 *   Col 3 : avg_set_pressure   (cmH₂O)
 *   Col 4 : measure_pressure   (cmH₂O)
 *   Col 5 : flow               (L/min)
 *   Col 6 : leak               (L/min)
 *   Col 7 : resp_rate          (breaths/min)
 *   Col 8 : apnea_detect       (1=yes, 0=no)
 *   Col 9 : type_of_apnea      (1=Obstructive, 2=Central, 3=Hypopnea)
 *   Col 10: open_mask_fault    (1=open/fault, 0=closed/OK)
 *
 * Also still supports old header-based CSVs for backward compatibility.
 */

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Parse "YYYYMMDDHHmmss" → Date object (local time)
 */
const parseTimestamp = (ts) => {
    if (!ts) return null;
    const s = String(ts).trim();
    if (s.length !== 14) return null;
    const year = parseInt(s.slice(0, 4), 10);
    const month = parseInt(s.slice(4, 6), 10) - 1; // 0-indexed
    const day = parseInt(s.slice(6, 8), 10);
    const hour = parseInt(s.slice(8, 10), 10);
    const min = parseInt(s.slice(10, 12), 10);
    const sec = parseInt(s.slice(12, 14), 10);
    const d = new Date(year, month, day, hour, min, sec);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Get YYYY-MM-DD string from Date
 */
const dateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

/**
 * Percentile value from a sorted numeric array
 */
const percentile = (sorted, pct) => {
    if (sorted.length === 0) return 0;
    const idx = Math.min(Math.floor(sorted.length * pct), sorted.length - 1);
    return sorted[idx];
};

// ─── new-format detector ─────────────────────────────────────────────────────

/**
 * Returns true if the file looks like our NEW headerless device log.
 * Heuristic: first non-empty line starts with a 14-digit timestamp and
 * has at least 10 comma-separated columns.
 */
const isNewDeviceFormat = (rawText) => {
    const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return false;
    const firstLine = lines[0].trim();
    const cols = firstLine.split(',');
    if (cols.length < 11) return false;
    const ts = cols[0].trim();
    return /^\d{14}$/.test(ts);
};

// ─── new-format parser ────────────────────────────────────────────────────────

const parseNewDeviceFormat = (rawText) => {
    const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);

    // Parse every line into a typed row object
    const rows = [];
    for (const line of lines) {
        const cols = line.split(',');
        if (cols.length < 11) continue;

        const ts = parseTimestamp(cols[0].trim());
        if (!ts) continue;

        rows.push({
            ts,
            therapy_status: parseInt(cols[1], 10) || 0,   // 1=ON, 0=OFF
            therapy_select: parseInt(cols[2], 10) || 0,   // 1=CPAP, 2=AutoCPAP
            avg_set_pressure: parseFloat(cols[3]) || 0,
            measure_pressure: parseFloat(cols[4]) || 0,
            flow: parseFloat(cols[5]) || 0,
            leak: parseFloat(cols[6]) || 0,
            resp_rate: parseFloat(cols[7]) || 0,
            apnea_detect: parseInt(cols[8], 10) || 0,   // 1=yes
            apnea_type: parseInt(cols[9], 10) || 0,   // 1=Obstr,2=Central,3=Hypopnea
            mask_fault: parseInt(cols[10], 10) || 0,   // 1=open/fault
        });
    }

    if (rows.length === 0) return [];

    // ── Group by calendar date ────────────────────────────────────────────────
    const byDate = {};
    for (const row of rows) {
        const key = dateKey(row.ts);
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(row);
    }

    const summaries = [];

    for (const date of Object.keys(byDate).sort()) {
        const dayRows = byDate[date];

        // ── Separate active (therapy ON) rows ─────────────────────────────────
        // A "session" is a contiguous block where therapy_status === 1.
        // We calculate usage as the total span of ON-rows (last ON ts − first ON ts).
        const onRows = dayRows.filter(r => r.therapy_status === 1);
        if (onRows.length === 0) continue; // skip days with no active therapy

        // Usage hours: span from first-ON to last-ON
        const firstOn = onRows[0].ts;
        const lastOn = onRows[onRows.length - 1].ts;
        const durationSec = (lastOn.getTime() - firstOn.getTime()) / 1000;
        const usageHours = parseFloat((durationSec / 3600).toFixed(2));

        // ── Pressures (only ON rows, non-zero) ────────────────────────────────
        const pressures = onRows
            .map(r => r.measure_pressure)
            .filter(v => v > 0)
            .sort((a, b) => a - b);

        const pressureMin = pressures.length > 0 ? pressures[0] : 0;
        const pressureMax = pressures.length > 0 ? pressures[pressures.length - 1] : 0;
        const pressureAvg = pressures.length > 0
            ? parseFloat((pressures.reduce((s, v) => s + v, 0) / pressures.length).toFixed(2))
            : 0;
        const pressure95th = parseFloat(percentile(pressures, 0.95).toFixed(2));

        // Avg set pressure
        const setPressures = onRows.map(r => r.avg_set_pressure).filter(v => v > 0);
        const avgSetPressure = setPressures.length > 0
            ? parseFloat((setPressures.reduce((s, v) => s + v, 0) / setPressures.length).toFixed(2))
            : 0;

        // ── Flow ──────────────────────────────────────────────────────────────
        const flows = onRows.map(r => r.flow).filter(v => v > 0);
        const avgFlow = flows.length > 0
            ? parseFloat((flows.reduce((s, v) => s + v, 0) / flows.length).toFixed(2))
            : 0;

        // ── Leak ──────────────────────────────────────────────────────────────
        const leaks = onRows.map(r => r.leak);
        const leakAvg = leaks.length > 0
            ? parseFloat((leaks.reduce((s, v) => s + v, 0) / leaks.length).toFixed(2))
            : 0;
        const largeLeakCount = leaks.filter(l => l > 24).length;
        const largeLeakPercent = leaks.length > 0
            ? parseFloat(((largeLeakCount / leaks.length) * 100).toFixed(1))
            : 0;

        // ── Respiratory Rate ──────────────────────────────────────────────────
        const respRates = onRows.map(r => r.resp_rate).filter(v => v > 0);
        const avgRespRate = respRates.length > 0
            ? parseFloat((respRates.reduce((s, v) => s + v, 0) / respRates.length).toFixed(2))
            : 0;

        // ── Apnea events (rows where apnea_detect === 1) ──────────────────────
        const apneaRows = onRows.filter(r => r.apnea_detect === 1);

        const apneaCount = apneaRows.length;



        // Count by type
        const obstructiveCount = apneaRows.filter(r => r.apnea_type === 1).length;
        const centralCount = apneaRows.filter(r => r.apnea_type === 2).length;
        const hypopneaCount = apneaRows.filter(r => r.apnea_type === 3).length;

        // AHI = total apnea events / usage hours
        const ahi = usageHours > 0
            ? parseFloat((apneaCount / usageHours).toFixed(1))
            : 0;

        // CAI (central apnea index)
        const cai = usageHours > 0
            ? parseFloat((centralCount / usageHours).toFixed(1))
            : 0;

        // OAI (obstructive apnea index)
        const oai = usageHours > 0
            ? parseFloat((obstructiveCount / usageHours).toFixed(1))
            : 0;

        // ── Mask fault (open mask) ────────────────────────────────────────────
        const maskFaultCount = onRows.filter(r => r.mask_fault === 1).length;

        // ── Therapy type (majority vote) ──────────────────────────────────────
        const cpapCount = onRows.filter(r => r.therapy_select === 1).length;
        const autoCpapCount = onRows.filter(r => r.therapy_select === 2).length;
        const therapyType = autoCpapCount >= cpapCount ? 'Auto-CPAP' : 'CPAP';

        // ── Compliance ────────────────────────────────────────────────────────
        const compliancePercent = usageHours >= 4 ? 100 : 0;

        // Console summary
        console.log(`🏥 CLINICAL SUMMARY [${date}]`);
        console.table({
            'Apnea rows': apneaRows,
            'Apnea Count rows': apneaCount,
            'Usage Hours': usageHours,
            'Therapy Type': therapyType,
            'Avg Set Pressure': avgSetPressure,
            'Pressure Min': pressureMin,
            'Pressure Max': pressureMax,
            'Pressure Avg': pressureAvg,
            'Pressure 95th': pressure95th,
            'Avg Flow': avgFlow,
            'Leak Avg': leakAvg,
            'Large Leak %': largeLeakPercent,
            'Avg Resp Rate': avgRespRate,
            'AHI': ahi,
            'Apnea Count': apneaCount,
            'Obstructive': obstructiveCount,
            'Central': centralCount,
            'Hypopnea': hypopneaCount,
            'Mask Fault Count': maskFaultCount,
            'Compliance': `${compliancePercent}%`,
        });

        summaries.push({
            date,
            usage_hours: usageHours,
            therapy_type: therapyType,
            avg_set_pressure: avgSetPressure,
            pressure_min: pressureMin,
            pressure_max: pressureMax,
            pressure_avg: pressureAvg,
            pressure_95th: pressure95th,
            avg_flow: avgFlow,
            leak_rate: leakAvg,
            large_leak_percent: largeLeakPercent,
            avg_resp_rate: avgRespRate,
            ahi,
            cai,
            oai,
            apnea_count: apneaCount,
            obstructive_count: obstructiveCount,
            central_count: centralCount,
            hypopnea_count: hypopneaCount,
            mask_fault_count: maskFaultCount,
            compliance_percent: compliancePercent,
        });
    }

    return summaries;
};

// ─── old-format (header-based) processor ─────────────────────────────────────

const processRawLogs = (data) => {
    const getVal = (obj, key) => {
        if (!obj || typeof obj !== 'object') return undefined;
        const keys = Object.keys(obj);
        const foundKey = keys.find(k => k && k.toLowerCase() === key.toLowerCase());
        return foundKey ? obj[foundKey] : undefined;
    };

    const activeData = data.filter(row => {
        if (!row) return false;
        const mode = getVal(row, 'Mode');
        const modeUpper = mode ? String(mode).toUpperCase() : '';
        const evDesc = getVal(row, 'Event_Desc');
        const evDescUpper = evDesc ? String(evDesc).toUpperCase() : '';
        return modeUpper !== 'OFF' && modeUpper !== 'SYSTEM_STANDBY' && evDescUpper !== 'SYSTEM_STANDBY' && mode !== undefined;
    });

    if (activeData.length === 0) { console.log('No active therapy rows found'); return []; }

    const groupedData = {};
    activeData.forEach(row => {
        const timestamp = getVal(row, 'Timestamp_MS') || getVal(row, 'timestamp');
        if (!timestamp) return;
        const dateObj = new Date(Number(timestamp) * 1000);
        if (isNaN(dateObj.getTime())) return;
        const ds = dateObj.toISOString().split('T')[0];
        if (!groupedData[ds]) groupedData[ds] = [];
        groupedData[ds].push(row);
    });

    const summaries = [];

    Object.keys(groupedData).forEach(ds => {
        const dayData = groupedData[ds];
        if (dayData.length === 0) return;

        const firstRow = dayData[0];
        const lastRow = dayData[dayData.length - 1];
        const tsFirst = getVal(firstRow, 'Timestamp_MS') || getVal(firstRow, 'timestamp');
        const tsLast = getVal(lastRow, 'Timestamp_MS') || getVal(lastRow, 'timestamp');
        if (!tsFirst) return;

        const durationSeconds = Number(tsLast) - Number(tsFirst);
        const usageHours = parseFloat((durationSeconds / 3600).toFixed(2));

        const eventCount = dayData.filter(row => {
            const evDesc = getVal(row, 'Event_Desc');
            if (!evDesc) return false;
            const desc = String(evDesc).toUpperCase();
            return ['HYPOPNEA_START', 'OBSTRUCTIVE_APNEA', 'CENTRAL_APNEA', 'MIXED_APNEA', 'APNEA_START', 'HYPOPNEA', 'APNEA'].includes(desc);
        }).length;

        const ahi = usageHours > 0 ? parseFloat((eventCount / usageHours).toFixed(2)) : 0;

        const maskOffCount = dayData.filter(row => {
            const evDesc = getVal(row, 'Event_Desc');
            if (!evDesc) return false;
            return ['MASK OFF', 'MASK_OFF'].includes(String(evDesc).toUpperCase());
        }).length;

        const pressures = dayData
            .map(row => { const v = getVal(row, 'Measured_Press'); const n = typeof v === 'number' ? v : parseFloat(v); return isNaN(n) ? null : n; })
            .filter(n => n !== null)
            .sort((a, b) => a - b);

        if (pressures.length === 0) {
            summaries.push({ date: ds, usage_hours: usageHours, ahi, leak_rate: 0, pressure_min: 0, pressure_max: 0, pressure_avg: 0, pressure_95th: 0, cai: 0, large_leak_percent: 0, avg_resp_rate: 0, compliance_percent: 0 });
            return;
        }

        const pressureAvg = parseFloat((pressures.reduce((s, a) => s + a, 0) / pressures.length).toFixed(1));
        const pressureMax = pressures[pressures.length - 1];
        const pressureMin = pressures[0];
        const pressure95th = percentile(pressures, 0.95);

        const leaks = dayData.map(row => { const v = getVal(row, 'Leak_Lmin'); return typeof v === 'number' ? v : parseFloat(v) || 0; });
        const leakAvg = leaks.length > 0 ? parseFloat((leaks.reduce((s, a) => s + a, 0) / leaks.length).toFixed(1)) : 0;
        const largeLeakPercent = leaks.length > 0 ? parseFloat(((leaks.filter(l => l > 24).length / leaks.length) * 100).toFixed(1)) : 0;

        const respRates = dayData.map(row => { const v = getVal(row, 'Resp_Rate'); return typeof v === 'number' ? v : parseFloat(v) || 0; });
        const respRateAvg = respRates.length > 0 ? parseFloat((respRates.reduce((s, a) => s + a, 0) / respRates.length).toFixed(1)) : 0;

        summaries.push({
            date: ds,
            usage_hours: usageHours,
            ahi,
            cai: maskOffCount,
            leak_rate: leakAvg,
            pressure_min: pressureMin,
            pressure_max: pressureMax,
            pressure_avg: pressureAvg,
            pressure_95th: pressure95th,
            large_leak_percent: largeLeakPercent,
            avg_resp_rate: respRateAvg,
            compliance_percent: usageHours >= 4 ? 100 : 0,
        });
    });

    return summaries;
};

// ─── main export ─────────────────────────────────────────────────────────────

export const parseCSV = (fileContent) => {
    return new Promise((resolve, reject) => {
        try {
            if (!fileContent || fileContent.trim().length === 0) {
                reject(new Error('File is empty.'));
                return;
            }

            // ── Detect format ─────────────────────────────────────────────────
            if (isNewDeviceFormat(fileContent)) {
                console.log('✅ Detected NEW headerless device log format');
                const summaries = parseNewDeviceFormat(fileContent);
                if (summaries && summaries.length > 0) {
                    resolve(summaries);
                } else {
                    reject(new Error('Device logs found but no active therapy session detected.'));
                }
                return;
            }

            // ── Fallback: old header-based CSV ────────────────────────────────
            console.log('ℹ️  Falling back to header-based CSV parsing');
            import('papaparse').then(({ default: Papa }) => {
                Papa.parse(fileContent, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: 'greedy',
                    transformHeader: (header) => header.trim(),
                    complete: (results) => {
                        try {
                            const data = results.data;
                            if (!data || data.length === 0) { resolve([]); return; }

                            const firstRow = data[0];
                            if (!firstRow) { resolve([]); return; }

                            const keys = Object.keys(firstRow);
                            const findKey = (search) => keys.find(k => k && k.toLowerCase().replace(/[\s_]/g, '') === search.toLowerCase().replace(/[\s_]/g, ''));

                            const hasTimestamp = keys.some(key =>
                                key && typeof key === 'string' && (key.toLowerCase() === 'timestamp_ms' || key.toLowerCase() === 'timestamp')
                            );

                            if (hasTimestamp) {
                                const sessionSummaries = processRawLogs(data);
                                if (sessionSummaries && sessionSummaries.length > 0) {
                                    resolve(sessionSummaries);
                                } else {
                                    reject(new Error('Device logs found but no active therapy session detected.'));
                                }
                            } else {
                                const mappedData = data.filter(row => {
                                    const dk = findKey('date');
                                    return row && dk && row[dk];
                                }).map(row => {
                                    const get = (k) => {
                                        const found = Object.keys(row).find(rk => rk && rk.toLowerCase().replace(/[\s_]/g, '') === k.toLowerCase().replace(/[\s_]/g, ''));
                                        return found ? row[found] : undefined;
                                    };
                                    const pMax = parseFloat(get('pressuremax') || 0);
                                    const p95Val = get('pressure95th');
                                    return {
                                        date: String(get('date')),
                                        usage_hours: parseFloat(get('usagehours') || 0),
                                        ahi: parseFloat(get('ahi') || 0),
                                        leak_rate: parseFloat(get('leakrate') || 0),
                                        pressure_min: parseFloat(get('pressuremin') || 0),
                                        pressure_max: pMax,
                                        pressure_avg: parseFloat(get('pressureavg') || 0),
                                        pressure_95th: p95Val !== undefined ? parseFloat(p95Val) : parseFloat((pMax * 0.95).toFixed(1)),
                                    };
                                });

                                if (mappedData.length === 0) {
                                    reject(new Error('The CSV file does not contain recognized therapy headers (Date, Usage Hours, AHI, etc.).'));
                                } else {
                                    resolve(mappedData);
                                }
                            }
                        } catch (e) {
                            reject(e || new Error('Internal parsing error during CSV processing'));
                        }
                    },
                    error: (error) => reject(error || new Error('Failed to parse CSV file content')),
                });
            }).catch(err => reject(err));

        } catch (e) {
            reject(e || new Error('Unexpected error in parseCSV'));
        }
    });
};
