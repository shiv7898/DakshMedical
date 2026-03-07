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
                        // Process high-frequency raw logs into a session summary
                        const sessionSummary = processRawLogs(data);
                        console.log('Session Summary:', sessionSummary);
                        if (sessionSummary) {
                            resolve([sessionSummary]);
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
    const activeData = data.filter(row => {
        if (!row) return false;
        const mode = getVal(row, 'Mode');
        return mode !== 'OFF' && mode !== 'STANDBY' && mode !== undefined;
    });

    if (activeData.length === 0) {
        console.log('No active therapy rows found');
        return null;
    }

    const firstRow = activeData[0];
    const lastRow = activeData[activeData.length - 1];

    // Calculate Date (Format: YYYY-MM-DD)
    const timestamp = getVal(firstRow, 'Timestamp_MS') || getVal(firstRow, 'timestamp');
    if (!timestamp) {
        console.log('Missing timestamp in first active row');
        return null;
    }

    const dateObj = new Date(Number(timestamp) * 1000);
    if (isNaN(dateObj.getTime())) {
        console.log('Invalid timestamp value:', timestamp);
        return null;
    }
    const dateString = dateObj.toISOString().split('T')[0];

    // Usage Hours
    const lastTs = getVal(lastRow, 'Timestamp_MS') || getVal(lastRow, 'timestamp');
    const durationSeconds = Number(lastTs) - Number(timestamp);
    const usageHours = parseFloat((durationSeconds / 3600).toFixed(2));

    // AHI Calculation (Events per hour)
    const eventCount = data.filter(row => {
        if (!row) return false;
        const evDesc = getVal(row, 'Event_Desc');
        if (!evDesc) return false;
        const desc = String(evDesc).toUpperCase();
        return (desc.includes('APNEA') || desc.includes('HYPOPNEA')) &&
            !desc.includes('NORMAL') &&
            !desc.includes('RECOVERY');
    }).length;

    const ahi = usageHours > 0 ? parseFloat((eventCount / usageHours).toFixed(1)) : 0;

    // Pressures
    const pressures = activeData
        .map(row => {
            const val = getVal(row, 'Measured_Press');
            const num = typeof val === 'number' ? val : parseFloat(val);
            return isNaN(num) ? 0 : num;
        })
        .sort((a, b) => a - b);

    if (pressures.length === 0) {
        return {
            date: dateString,
            usage_hours: usageHours,
            ahi: ahi,
            leak_rate: 0,
            pressure_min: 0,
            pressure_max: 0,
            pressure_avg: 0,
            pressure_95th: 0
        };
    }

    const pressureAvg = parseFloat((pressures.reduce((s, a) => s + a, 0) / pressures.length).toFixed(1));
    const pressureMax = pressures[pressures.length - 1];
    const pressureMin = pressures[0];

    // 95th Percentile Pressure
    const p95Index = Math.floor(pressures.length * 0.95);
    const pressure95th = pressures[p95Index] || pressureMax;

    // Leak Rate
    const leaks = activeData.map(row => {
        const val = getVal(row, 'Leak_Lmin');
        return typeof val === 'number' ? val : parseFloat(val) || 0;
    });
    const leakAvg = parseFloat((leaks.reduce((s, a) => s + a, 0) / leaks.length).toFixed(1));

    return {
        date: dateString,
        usage_hours: usageHours,
        ahi: ahi,
        leak_rate: leakAvg,
        pressure_min: pressureMin,
        pressure_max: pressureMax,
        pressure_avg: pressureAvg,
        pressure_95th: pressure95th
    };
};
