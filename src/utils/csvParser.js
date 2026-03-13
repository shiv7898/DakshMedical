import Papa from 'papaparse';

export const parseCSV = (fileContent) => {
    return new Promise((resolve, reject) => {
        // Log raw content for debugging
        console.log('Raw CSV length:', fileContent?.length);

        Papa.parse(fileContent, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: 'greedy', // Better at handling Excel-style empty rows
            transformHeader: (header) => header.trim(), // Remove invisible characters/spaces
            complete: (results) => {
                console.log('CSV Results:', results);
                try {
                    const data = results.data;
                    console.log('Parsed Rows:', data?.length);

                    if (!data || data.length === 0) {
                        console.log('CSV is empty');
                        resolve([]);
                        return;
                    }

                    const firstRow = data[0];
                    console.log('First Row:', firstRow);
                    if (!firstRow) {
                        console.log('First row is empty or null after parsing.');
                        resolve([]);
                        return;
                    }

                    const keys = Object.keys(firstRow);
                    console.log('Keys:', keys);

                    // Helper to get property case-insensitively inside the complete callback
                    const findKey = (search) => keys.find(k => k && k.toLowerCase().replace(/[\s_]/g, '') === search.toLowerCase().replace(/[\s_]/g, ''));

                    // Normalizing check for Timestamp_MS or timestamp (case-insensitive)
                    const hasTimestamp = keys.some(key =>
                        key && typeof key === 'string' && (key.toLowerCase() === 'timestamp_ms' || key.toLowerCase() === 'timestamp')
                    );
                    console.log('Has Timestamp:', hasTimestamp);

                    if (hasTimestamp) {
                        console.log('Processing High-Frequency Raw Logs');
                        // Process high-frequency raw logs into session summaries (array)
                        const sessionSummaries = processRawLogs(data);
                        console.log('Session Summaries:', sessionSummaries);
                        if (sessionSummaries && sessionSummaries.length > 0) {
                            resolve(sessionSummaries);
                        } else {
                            reject(new Error('Device logs found but no active therapy session detected.'));
                        }
                    } else {
                        console.log('Processing Summarized Therapy Logs');

                        const mappedData = data.filter(row => {
                            const dateKey = findKey('date');
                            return row && dateKey && row[dateKey];
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

                        console.log(`Successfully mapped ${mappedData.length} therapy days`);

                        if (mappedData.length === 0) {
                            reject(new Error('The CSV file does not contain recognized therapy headers (Date, Usage Hours, AHI, etc.).'));
                        } else {
                            resolve(mappedData);
                        }
                    }
                } catch (e) {
                    console.error('Error in CSV processing:', e);
                    reject(e || new Error('Internal parsing error during CSV processing'));
                }
            },
            error: (error) => {
                console.error('PapaParse Error:', error);
                reject(error || new Error('Failed to parse CSV file content'));
            }
        });
    });
};

const processRawLogs = (data) => {
    // Helper to get property case-insensitively
    const getVal = (obj, key) => {
        if (!obj || typeof obj !== 'object') return undefined;
        const keys = Object.keys(obj);
        const foundKey = keys.find(k => k && k.toLowerCase() === key.toLowerCase());
        return foundKey ? obj[foundKey] : undefined;
    };

    // Filter out rows that denote 'OFF' or 'STANDBY', keeping active therapy only
    // User requested: OFF aur SYSTEM_STANDBY rows ignore karenge
    const activeData = data.filter(row => {
        if (!row) return false;
        const mode = getVal(row, 'Mode');
        const modeUpper = mode ? String(mode).toUpperCase() : '';
        const evDesc = getVal(row, 'Event_Desc');
        const evDescUpper = evDesc ? String(evDesc).toUpperCase() : '';
        // Ignore rows with Mode OFF/SYSTEM_STANDBY or Event_Desc SYSTEM_STANDBY
        return modeUpper !== 'OFF' && modeUpper !== 'SYSTEM_STANDBY' && evDescUpper !== 'SYSTEM_STANDBY' && mode !== undefined;
    });

    if (activeData.length === 0) {
        console.log('No active therapy rows found');
        return [];
    }

    // Group rows by Date (YYYY-MM-DD)
    const groupedData = {};
    activeData.forEach(row => {
        const timestamp = getVal(row, 'Timestamp_MS') || getVal(row, 'timestamp');
        if (!timestamp) return;

        const dateObj = new Date(Number(timestamp) * 1000);
        if (isNaN(dateObj.getTime())) return;

        const dateString = dateObj.toISOString().split('T')[0];
        if (!groupedData[dateString]) {
            groupedData[dateString] = [];
        }
        groupedData[dateString].push(row);
    });

    const summaries = [];

    // Calculate metrics for each day separately
    Object.keys(groupedData).forEach(dateString => {
        const dayData = groupedData[dateString];
        if (dayData.length === 0) return;

        const firstRow = dayData[0];
        const lastRow = dayData[dayData.length - 1];

        const timestampFirst = getVal(firstRow, 'Timestamp_MS') || getVal(firstRow, 'timestamp');
        const timestampLast = getVal(lastRow, 'Timestamp_MS') || getVal(lastRow, 'timestamp');

        if (!timestampFirst) return;

        // 1. Usage Hours
        const durationSeconds = Number(timestampLast) - Number(timestampFirst);
        const usageHours = parseFloat((durationSeconds / 3600).toFixed(2));

        // 2. AHI Calculation (Events per hour)
        const eventCount = dayData.filter(row => {
            if (!row) return false;
            const evDesc = getVal(row, 'Event_Desc');
            if (!evDesc) return false;
            const desc = String(evDesc).toUpperCase();
            return desc === 'HYPOPNEA_START' || desc === 'OBSTRUCTIVE_APNEA' || desc === 'CENTRAL_APNEA' || desc === 'MIXED_APNEA' || desc === 'APNEA_START' || desc === 'HYPOPNEA' || desc === 'APNEA';
        }).length;

        const ahi = usageHours > 0 ? parseFloat((eventCount / usageHours).toFixed(1)) : 0;

        // Mask Off / CAI Calculation
        const maskOffCount = dayData.filter(row => {
            if (!row) return false;
            const evDesc = getVal(row, 'Event_Desc');
            if (!evDesc) return false;
            const desc = String(evDesc).toUpperCase();
            return desc === 'MASK OFF' || desc === 'MASK_OFF';
        }).length;

        // 3. Pressures
        const pressures = dayData
            .map(row => {
                const val = getVal(row, 'Measured_Press');
                const num = typeof val === 'number' ? val : parseFloat(val);
                return isNaN(num) ? null : num;
            })
            .filter(n => n !== null)
            .sort((a, b) => a - b);

        if (pressures.length === 0) {
            summaries.push({
                date: dateString,
                usage_hours: usageHours,
                ahi: ahi,
                leak_rate: 0,
                pressure_min: 0,
                pressure_max: 0,
                pressure_avg: 0,
                pressure_95th: 0,
                cai: 0,
                large_leak_percent: 0,
                avg_resp_rate: 0,
                avg_tidal_volume: 0,
                compliance_percent: 0
            });
            return;
        }

        const pressureAvg = parseFloat((pressures.reduce((s, a) => s + a, 0) / pressures.length).toFixed(1));
        const pressureMax = pressures[pressures.length - 1];
        const pressureMin = pressures[0];

        // 95th Percentile Pressure
        let p95Index = Math.floor(pressures.length * 0.95);
        if (p95Index >= pressures.length) p95Index = pressures.length - 1;
        const pressure95th = pressures[p95Index] || pressureMax;

        // 4. Leak Rate
        const leaks = dayData.map(row => {
            const val = getVal(row, 'Leak_Lmin');
            return typeof val === 'number' ? val : parseFloat(val) || 0;
        });
        const leakAvg = leaks.length > 0 ? parseFloat((leaks.reduce((s, a) => s + a, 0) / leaks.length).toFixed(1)) : 0;
        const largeLeakCount = leaks.filter(l => l > 24).length;
        const largeLeakPercent = leaks.length > 0 ? parseFloat(((largeLeakCount / leaks.length) * 100).toFixed(1)) : 0;

        // 5. Respiratory Rate Average
        const respRates = dayData.map(row => {
            const val = getVal(row, 'Resp_Rate');
            return typeof val === 'number' ? val : parseFloat(val) || 0;
        });
        const respRateAvg = respRates.length > 0 ? parseFloat((respRates.reduce((s, a) => s + a, 0) / respRates.length).toFixed(1)) : 0;

        // 6. Tidal Volume Average
        const tidalVols = dayData.map(row => {
            const val = getVal(row, 'Tidal_Vol_n') ?? getVal(row, 'Tidal_Vol_ml') ?? getVal(row, 'Tidal_Vol');
            return typeof val === 'number' ? val : parseFloat(val) || 0;
        });
        const tidalVolAvg = tidalVols.length > 0 ? Math.round(tidalVols.reduce((s, a) => s + a, 0) / tidalVols.length) : 0;

        // 7. Compliance
        const compliancePercent = usageHours >= 4 ? 100 : 0;

        // Log clinical summary per day internally
        console.log(`🏥 CLINICAL SUMMARY: ${dateString}`);
        console.table({
            "Usage Hours": `${usageHours} hrs`,
            "AHI": ahi,
            "Mask Offs": maskOffCount,
            "Pressure Min": pressureMin,
            "Pressure Max": pressureMax,
            "Pressure Avg": pressureAvg,
            "Pressure 95th": pressure95th,
            "Avg Leak": `${leakAvg} L/min`,
            "Large Leak %": `${largeLeakPercent}%`,
            "Avg Resp Rate": respRateAvg,
            "Avg Tidal Volume": `${tidalVolAvg} mL`,
            "Compliance": `${compliancePercent}%`
        });

        summaries.push({
            date: dateString,
            usage_hours: usageHours,
            ahi: ahi,
            leak_rate: leakAvg,
            pressure_min: pressureMin,
            pressure_max: pressureMax,
            pressure_avg: pressureAvg,
            pressure_95th: pressure95th,
            cai: maskOffCount,
            large_leak_percent: largeLeakPercent,
            avg_resp_rate: respRateAvg,
            avg_tidal_volume: tidalVolAvg,
            compliance_percent: compliancePercent
        });
    });

    return summaries;
};
