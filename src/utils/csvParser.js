// src/utils/csvParser.js

// ─── helpers ────────────────────────────────────────────────────────────────

const dateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const parseTimestamp = (ts) => {
    if (!ts || ts.length !== 14) return null;
    const year = parseInt(ts.slice(0, 4), 10);
    const month = parseInt(ts.slice(4, 6), 10) - 1;
    const day = parseInt(ts.slice(6, 8), 10);
    const hour = parseInt(ts.slice(8, 10), 10);
    const min = parseInt(ts.slice(10, 12), 10);
    const sec = parseInt(ts.slice(12, 14), 10);
    const d = new Date(year, month, day, hour, min, sec);
    return isNaN(d.getTime()) ? null : d;
};

const MODE_MAP = {
    1: 'CPAP',
    2: 'APAP',
    3: 'S',
    4: 'T',
    5: 'ST',
    6: 'VAPS',
};

// ─── new-format parser ────────────────────────────────────────────────────

const parseNewLogFormat = (rawText) => {
    const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    const rows = [];
    for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 14) continue; // Min length for CPAP/T mode

        const tsStr = parts[0];
        const timeVal = parseTimestamp(tsStr);
        if (!timeVal) continue;

        const status = parseInt(parts[1], 10);
        // Only process rows where therapy is ON (status === 1)
        if (status !== 1) continue;

        const mode = parseInt(parts[2], 10);
        if (!MODE_MAP[mode]) continue;

        let currentIndex = 3;
        
        let rampStartP = 0, cpapP = 0, pOff = 0, rampDur = 0;
        let minP = 0, maxP = 0;
        let iPap = 0, ePap = 0, iTrigger = 0, eTrigger = 0, pRise = 0, tiMin = 0, tiMax = 0;
        let breathRate = 0, ieRatio = 0, iPapMax = 0, iPapMin = 0, vt = 0;

        const readNext = () => currentIndex < (parts.length - 8) ? parseFloat(parts[currentIndex++]) : 0;

        switch (mode) {
            case 1: // CPAP
                rampStartP = readNext();
                cpapP = readNext();
                pOff = readNext();
                rampDur = readNext();
                break;
            case 2: // APAP
                rampStartP = readNext();
                minP = readNext();
                maxP = readNext();
                pOff = readNext();
                rampDur = readNext();
                break;
            case 3: // S
                iPap = readNext();
                ePap = readNext();
                iTrigger = readNext();
                eTrigger = readNext();
                pRise = readNext();
                tiMin = readNext();
                tiMax = readNext();
                break;
            case 4: // T
                iPap = readNext();
                ePap = readNext();
                breathRate = readNext();
                ieRatio = readNext();
                pRise = readNext();
                break;
            case 5: // ST
                iPap = readNext();
                ePap = readNext();
                breathRate = readNext();
                ieRatio = readNext();
                iTrigger = readNext();
                eTrigger = readNext();
                pRise = readNext();
                tiMax = readNext();
                tiMin = readNext();
                break;
            case 6: // VAPS
                iPapMax = readNext();
                iPapMin = readNext();
                ePap = readNext();
                vt = readNext();
                breathRate = readNext();
                ieRatio = readNext();
                iTrigger = readNext();
                eTrigger = readNext();
                pRise = readNext();
                break;
        }

        currentIndex = parts.length - 8;
        const setAvgP = parseFloat(parts[currentIndex++]);
        const measAvgP = parseFloat(parts[currentIndex++]);
        const measAvgFlow = parseFloat(parts[currentIndex++]);
        const avgLeak = parseFloat(parts[currentIndex++]);
        const actualRespRate = parseFloat(parts[currentIndex++]) || 0; // 5th from last
        const apneaStatus = parseInt(parts[currentIndex++], 10);
        const apneaType = parseInt(parts[currentIndex++], 10);
        const maskOpen = parseInt(parts[currentIndex++], 10);

        rows.push({
            timeVal,
            mode,
            rampStartP,
            cpapP,
            minP,
            maxP,
            pOff,
            rampDur,
            iPap,
            ePap,
            iTrigger,
            eTrigger,
            pRise,
            tiMin,
            tiMax,
            breathRate,
            ieRatio,
            vt,
            iPapMax,
            iPapMin,
            setAvgP,
            measAvgP,
            measAvgFlow,
            avgLeak,
            apneaStatus,
            apneaType,
            maskOpen,
            actualRespRate
        });
    }

    if (rows.length === 0) return [];

    const byDate = {};
    for (const row of rows) {
        const key = dateKey(row.timeVal);
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(row);
    }

    const summaries = [];

    for (const date of Object.keys(byDate).sort()) {
        const dayRows = byDate[date];

        const totalMinutes = dayRows.length;
        const usageHours = parseFloat((totalMinutes / 60).toFixed(2));

        let sumMeasAvgP = 0, dayMaxP = 0, dayMinP = 999;
        let sumSetAvgP = 0, sumLeak = 0, validLeakCount = 0, sumRespRate = 0, validRespRateCount = 0;
        let sumMeasAvgFlow = 0;
        let apneas = 0, obstructives = 0, centrals = 0, hypopneas = 0, openMasks = 0;

        let cpapCount = 0, apapCount = 0, sCount = 0, tCount = 0, stCount = 0, vapsCount = 0;
        let dominantModeStr = 'CPAP';
        const modeFrequency = {};

        let sumMinP = 0, sumMaxP = 0, sumRampStart = 0, sumPOff = 0, sumRampDur = 0;
        let sumIPap = 0, sumEPap = 0, sumITrigger = 0, sumETrigger = 0, sumPRise = 0;
        let sumTiMin = 0, sumTiMax = 0, sumBreathRate = 0, sumIERatio = 0, sumVt = 0;
        let sumIPapMax = 0, sumIPapMin = 0, sumCpapP = 0;
        let validModeSettingsCount = 0;

        for (const r of dayRows) {
            sumMeasAvgP += r.measAvgP;
            sumMeasAvgFlow += r.measAvgFlow || 0;
            if (r.measAvgP > dayMaxP) dayMaxP = r.measAvgP;
            if (r.measAvgP < dayMinP) dayMinP = r.measAvgP;
            
            sumSetAvgP += r.setAvgP;

            if (r.avgLeak < 200) {
                sumLeak += r.avgLeak;
                validLeakCount++;
            }

            const currentResp = r.actualRespRate > 0 ? r.actualRespRate : (r.breathRate || 0);
            if (currentResp > 0) {
                sumRespRate += currentResp;
                validRespRateCount++;
            }

            if (r.apneaStatus === 1) {
                apneas++;
                if (r.apneaType === 1) obstructives++;
                else if (r.apneaType === 2) centrals++;
                else hypopneas++;
            }

            openMasks += r.maskOpen;

            const modeName = MODE_MAP[r.mode];
            modeFrequency[modeName] = (modeFrequency[modeName] || 0) + 1;

            if (r.mode === 1) cpapCount++;
            else if (r.mode === 2) apapCount++;
            else if (r.mode === 3) sCount++;
            else if (r.mode === 4) tCount++;
            else if (r.mode === 5) stCount++;
            else if (r.mode === 6) vapsCount++;

            validModeSettingsCount++;
            sumRampStart += r.rampStartP || 0;
            sumPOff += r.pOff || 0;
            sumRampDur += r.rampDur || 0;
            sumMinP += r.minP || 0;
            sumMaxP += r.maxP || 0;
            sumCpapP += r.cpapP || 0;
            sumIPap += r.iPap || 0;
            sumEPap += r.ePap || 0;
            sumITrigger += r.iTrigger || 0;
            sumETrigger += r.eTrigger || 0;
            sumPRise += r.pRise || 0;
            sumTiMin += r.tiMin || 0;
            sumTiMax += r.tiMax || 0;
            sumBreathRate += r.breathRate || 0;
            sumIERatio += r.ieRatio || 0;
            sumVt += r.vt || 0;
            sumIPapMax += r.iPapMax || 0;
            sumIPapMin += r.iPapMin || 0;
        }
        console.log("sumRespRate" ,sumRespRate,"validRespRateCount",validRespRateCount,"avg_resp_rate",avgRespRateDay)

        const modesUsed = Object.keys(modeFrequency);
        const therapyType = modesUsed.length > 0 ? modesUsed.join(', ') : 'CPAP';

        const avgMeasP = totalMinutes > 0 ? parseFloat((sumMeasAvgP / totalMinutes).toFixed(2)) : 0;
        const avgMeasFlow = totalMinutes > 0 ? parseFloat((sumMeasAvgFlow / totalMinutes).toFixed(2)) : 0;
        const avgSetP = totalMinutes > 0 ? parseFloat((sumSetAvgP / totalMinutes).toFixed(2)) : 0;
        const finalMinP = dayMinP === 999 ? 0 : parseFloat(dayMinP.toFixed(2));
        const finalMaxP = parseFloat(dayMaxP.toFixed(2));

        const avgLeakDay = validLeakCount > 0 ? parseFloat((sumLeak / validLeakCount).toFixed(2)) : 0;
        const avgRespRateDay = validRespRateCount > 0 ? parseFloat((sumRespRate / validRespRateCount).toFixed(2)) : 0;

        const ahi = usageHours > 0 ? parseFloat((apneas / usageHours).toFixed(2)) : 0;
        const oai = usageHours > 0 ? parseFloat((obstructives / usageHours).toFixed(2)) : 0;
        const cai = usageHours > 0 ? parseFloat((centrals / usageHours).toFixed(2)) : 0;
        const compliancePercent = usageHours >= 4 ? 100 : 0;

        const cpapApapCount = cpapCount + apapCount;
        const bilevelCount = sCount + tCount + stCount + vapsCount;

        summaries.push({
            date,
            usage_hours: usageHours,
            therapy_type: therapyType,
            avg_set_pressure: avgSetP,
            pressure_min: apapCount > 0 ? parseFloat((sumMinP / apapCount).toFixed(2)) : 0,
            pressure_max: apapCount > 0 ? parseFloat((sumMaxP / apapCount).toFixed(2)) : 0,
            meas_pressure_min: finalMinP,
            meas_pressure_max: finalMaxP,
            pressure_avg: avgMeasP,
            ramp_start_pressure: cpapApapCount > 0 ? parseFloat((sumRampStart / cpapApapCount).toFixed(2)) : 0,
            pressure_off: cpapApapCount > 0 ? parseFloat((sumPOff / cpapApapCount).toFixed(2)) : 0,
            ramp_duration: cpapApapCount > 0 ? parseFloat((sumRampDur / cpapApapCount).toFixed(2)) : 0,
            i_pap: bilevelCount > 0 ? parseFloat((sumIPap / bilevelCount).toFixed(2)) : 0,
            e_pap: bilevelCount > 0 ? parseFloat((sumEPap / bilevelCount).toFixed(2)) : 0,
            i_trigger: (sCount + stCount + vapsCount) > 0 ? parseFloat((sumITrigger / (sCount + stCount + vapsCount)).toFixed(2)) : 0,
            e_trigger: (sCount + stCount + vapsCount) > 0 ? parseFloat((sumETrigger / (sCount + stCount + vapsCount)).toFixed(2)) : 0,
            p_rise: bilevelCount > 0 ? parseFloat((sumPRise / bilevelCount).toFixed(2)) : 0,
            ti_min: (sCount + stCount) > 0 ? parseFloat((sumTiMin / (sCount + stCount)).toFixed(2)) : 0,
            ti_max: (sCount + stCount) > 0 ? parseFloat((sumTiMax / (sCount + stCount)).toFixed(2)) : 0,
            breath_rate: (tCount + stCount + vapsCount) > 0 ? parseFloat((sumBreathRate / (tCount + stCount + vapsCount)).toFixed(2)) : 0,
            ie_ratio: (tCount + stCount + vapsCount) > 0 ? parseFloat((sumIERatio / (tCount + stCount + vapsCount)).toFixed(2)) : 0,
            vt: vapsCount > 0 ? parseFloat((sumVt / vapsCount).toFixed(2)) : 0,
            ipap_max: vapsCount > 0 ? parseFloat((sumIPapMax / vapsCount).toFixed(2)) : 0,
            ipap_min: vapsCount > 0 ? parseFloat((sumIPapMin / vapsCount).toFixed(2)) : 0,
            cpap_pressure: cpapCount > 0 ? parseFloat((sumCpapP / cpapCount).toFixed(2)) : 0,
            avg_flow: avgMeasFlow, 
            leak_rate: avgLeakDay,
            large_leak_percent: 0,
            avg_resp_rate: avgRespRateDay,
            ahi,
            cai,
            oai,
            apnea_count: apneas,
            obstructive_count: obstructives,
            central_count: centrals,
            hypopnea_count: hypopneas,
            mask_fault_count: openMasks,
            mask_off_count: 0,
            low_pressure_count: 0,
            compliance_percent: compliancePercent,
            modes_used_today: Object.keys(modeFrequency), 
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

            console.log('✅ Parsing device log format');
            const summaries = parseNewLogFormat(fileContent);
            if (summaries && summaries.length > 0) {
                resolve(summaries);
            } else {
                reject(new Error('Device logs found but no active therapy session detected.'));
            }
        } catch (e) {
            reject(e || new Error('Unexpected error in parseCSV'));
        }
    });
};
