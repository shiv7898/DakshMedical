
// ─── helpers ────────────────────────────────────────────────────────────────


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

const parseTimestampColon = (ts) => {
    if (!ts) return null;
    const parts = String(ts).trim().split(':');
    if (parts.length !== 2) return null;
    const dStr = parts[0];
    const tStr = parts[1];
    if (dStr.length !== 8 || tStr.length !== 6) return null;
    const year = parseInt(dStr.slice(0, 4), 10);
    const month = parseInt(dStr.slice(4, 6), 10) - 1;
    const day = parseInt(dStr.slice(6, 8), 10);
    const hour = parseInt(tStr.slice(0, 2), 10);
    const min = parseInt(tStr.slice(2, 4), 10);
    const sec = parseInt(tStr.slice(4, 6), 10);
    const d = new Date(year, month, day, hour, min, sec);
    return isNaN(d.getTime()) ? null : d;
};

const isUltraNewDeviceFormat = (rawText) => {
    const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return false;
    const firstLine = lines[0].trim();
    const cols = firstLine.split(',');
    if (cols.length < 6) return false;
    const ts = cols[0].trim();
    return /^\d{8}:\d{6}$/.test(ts);
};


// ─── ultra-new-format parser ────────────────────────────────────────────────────

const parseUltraNewDeviceFormat = (rawText) => {
    const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);

    const rows = [];
    for (const line of lines) {
        const cols = line.split(',');
        if (cols.length < 6) continue;

        const startTs = parseTimestampColon(cols[0].trim());
        const endTs = parseTimestampColon(cols[1].trim());
        if (!startTs || !endTs) continue;

        const therapyDetails = cols[3].trim().split(':');
        const avgData = cols[4].trim().split(':');
        const eventCounts = cols[5].trim().split(':');

        let mode = parseInt(therapyDetails[0], 10); // 1 = CPAP, 2 = APAP
        let cpapPressure = 0, minPressure = 0, maxPressure = 0;
        let rampStartPressure = 0, pressureOff = 0, rampDuration = 0;

        if (mode === 1 && therapyDetails.length >= 5) {
            rampStartPressure = (parseFloat(therapyDetails[1]) || 0) / 10;
            cpapPressure = (parseFloat(therapyDetails[2]) || 0) / 10;
            pressureOff = parseInt(therapyDetails[3], 10) || 0;
            rampDuration = parseInt(therapyDetails[4], 10) || 0;
        } else if (mode === 2 && therapyDetails.length >= 6) {
            rampStartPressure = (parseFloat(therapyDetails[1]) || 0) / 10;
            minPressure = (parseFloat(therapyDetails[2]) || 0) / 10;
            maxPressure = (parseFloat(therapyDetails[3]) || 0) / 10;
            pressureOff = parseInt(therapyDetails[4], 10) || 0;
            rampDuration = parseInt(therapyDetails[5], 10) || 0;
        } else {
            // Fallback
            cpapPressure = (parseFloat(therapyDetails[2] || 0)) / 10;
        }

        const avgFlow = parseFloat(avgData[0]) || 0;
        const avgLeak = parseFloat(avgData[1]) || 0;
        const avgRespRate = parseFloat(avgData[2]) || 0;
        const apneaCountRow = parseInt(avgData[3], 10) || 0;

        const openMaskCountRow = parseInt(eventCounts[0], 10) || 0;
        const lowPressureCountRow = parseInt(eventCounts[1], 10) || 0;

        let durationSec = (endTs.getTime() - startTs.getTime()) / 1000;
        if (durationSec < 0) durationSec = 0;
        // Edge case: if start and end are exactly the same, maybe it's 1 sec event or 0 sec
        if (durationSec === 0) durationSec = 1;

        rows.push({
            startTs,
            durationSec,
            mode,
            cpapPressure,
            minPressure,
            maxPressure,
            rampStartPressure,
            pressureOff,
            rampDuration,
            avgFlow,
            avgLeak,
            avgRespRate,
            apneaCountRow,
            openMaskCountRow,
            lowPressureCountRow
        });
    }

    if (rows.length === 0) return [];

    const byDate = {};
    for (const row of rows) {
        const key = dateKey(row.startTs);
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(row);
    }

    const summaries = [];

    for (const date of Object.keys(byDate).sort()) {
        const dayRows = byDate[date];

        let totalDurationSec = 0;
        let sumFlow = 0;
        let sumLeak = 0;
        let validLeakRowsCount = 0;
        let sumRespRate = 0;
        let totalApneaCount = 0;
        let totalOpenMask = 0;
        let totalLowPressure = 0;
        let cpapCount = 0;
        let apapCount = 0;

        let maxP = 0;
        let minP = 999;
        let sumP = 0;
        let validPRows = 0;

        let rampStartPressureDay = 0;
        let pressureOffDay = 0;
        let rampDurationDay = 0;

        for (const r of dayRows) {
            totalDurationSec += r.durationSec;
            sumFlow += r.avgFlow;
            
            // Filter leak > 200 for clinical accuracy
            if (r.avgLeak < 200) {
                sumLeak += r.avgLeak;
                validLeakRowsCount++;
            }
            
            sumRespRate += r.avgRespRate;
            totalApneaCount += r.apneaCountRow;
            totalOpenMask += r.openMaskCountRow;
            totalLowPressure += r.lowPressureCountRow;

            if (r.mode === 1) {
                cpapCount++;
                const p = r.cpapPressure;
                if (p > 0) {
                    if (p > maxP) maxP = p;
                    if (p < minP) minP = p;
                    sumP += p;
                    validPRows++;
                }
            } else if (r.mode === 2) {
                apapCount++;
                const p = (r.minPressure + r.maxPressure) / 2;
                if (r.maxPressure > maxP) maxP = r.maxPressure;
                if (r.minPressure < minP) minP = r.minPressure;
                sumP += p;
                validPRows++;
            }

            if (r.rampStartPressure > 0) rampStartPressureDay = r.rampStartPressure;
            if (r.rampDuration > 0) rampDurationDay = r.rampDuration;
            if (r.pressureOff !== undefined) pressureOffDay = r.pressureOff;
        }

        const usageHours = parseFloat((totalDurationSec / 3600).toFixed(2));

        const rowCount = dayRows.length;
        const avgFlowDay = rowCount > 0 ? parseFloat((sumFlow / rowCount).toFixed(2)) : 0;
        const avgLeakDay = validLeakRowsCount > 0 ? parseFloat((sumLeak / validLeakRowsCount).toFixed(2)) : 0;
        const avgRespRateDay = rowCount > 0 ? parseFloat((sumRespRate / rowCount).toFixed(2)) : 0;
        const pressureAvg = validPRows > 0 ? parseFloat((sumP / validPRows).toFixed(2)) : 0;
        const pressureMin = minP === 999 ? 0 : minP;
        const pressureMax = maxP;

        const ahi = usageHours > 0 ? parseFloat((totalApneaCount / usageHours).toFixed(2)) : 0;

        // Mixed = both CPAP and APAP sessions present on same day
        let therapyType;
        if (cpapCount > 0 && apapCount > 0) {
            therapyType = 'Mixed';
        } else if (apapCount > 0) {
            therapyType = 'APAP';
        } else {
            therapyType = 'CPAP';
        }

        const compliancePercent = usageHours >= 4 ? 100 : 0;
        console.log(
            "date", date,
            "usage_hours", usageHours,
            "therapy_type", therapyType,
            "avg_set_pressure", pressureAvg,
            "pressure_min", pressureMin,
            "pressure_max", pressureMax,
            "pressure_avg", pressureAvg,
            "ramp_start_pressure", rampStartPressureDay,
            "pressure_off", pressureOffDay,
            "ramp_duration", rampDurationDay,
            "avg_flow", avgFlowDay,
            "leak_rate", avgLeakDay,

            "avg_resp_rate", avgRespRateDay,
            "ahi", ahi,

            "apnea_count", totalApneaCount,
            "totalOpenMask", totalOpenMask,

            "compliance_percent", compliancePercent,
        )

        summaries.push({
            date,
            usage_hours: usageHours,
            therapy_type: therapyType,
            avg_set_pressure: pressureAvg,
            pressure_min: pressureMin,
            pressure_max: pressureMax,
            pressure_avg: pressureAvg,
            ramp_start_pressure: rampStartPressureDay,
            pressure_off: pressureOffDay,
            ramp_duration: rampDurationDay,

            avg_flow: avgFlowDay,
            leak_rate: avgLeakDay,
            // large_leak_percent: 0,
            avg_resp_rate: avgRespRateDay,
            ahi,
            // cai: 0,
            // oai: 0,
            apnea_count: totalApneaCount,
            mask_fault_count: totalOpenMask,
            low_pressure_count: totalLowPressure,
            compliance_percent: compliancePercent,
        });
    }

    return summaries;
};

export const parseCSV = (fileContent) => {
    return new Promise((resolve, reject) => {
        try {
            if (!fileContent || fileContent.trim().length === 0) {
                reject(new Error('File is empty.'));
                return;
            }

            if (isUltraNewDeviceFormat(fileContent)) {
                console.log('✅ Detected device log format');
                const summaries = parseUltraNewDeviceFormat(fileContent);
                if (summaries && summaries.length > 0) {
                    resolve(summaries);
                } else {
                    reject(new Error('Device logs found but no active therapy session detected.'));
                }
                return;
            }

            reject(new Error('Unrecognized device log format. Please ensure you are importing valid Airsine CPAP logs.'));
        } catch (e) {
            reject(e || new Error('Unexpected error in parseCSV'));
        }
    });
};
