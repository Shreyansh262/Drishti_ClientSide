import { NextResponse } from "next/server";
import { getTailContent } from "@/lib/sshClient";
import { parse } from "csv-parse/sync";

export async function GET() {
  try {
    const dashboardData = {
      driverScore: 100,
      alcoholLevel: 0.0,
      alcoholTimestamp: null,
      visibilityScore: 0,
      frontcamTimestamp: null,
      drowsinessState: "Awake",
      dashcamTimestamp: null,
      speed: 0,
      coordinates: { lat: 48.8584, lng: 2.2945 },
      obdTimestamp: null,
      isConnected: false,
      lastUpdate: null,
      recentIncidents: 0,
      activeIncidents: [],
      totalIncidents: 0,
      monthlyIncidents: 0,
      weeklySafetyScore: "0.00",
    };

    // Get current server time (UTC) and convert to IST (UTC+5:30)
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const nowUtc = new Date();
    const nowIst = new Date(nowUtc.getTime() + istOffsetMs);
    console.log('Server Time (UTC):', nowUtc.toISOString(), 'Server Time (IST):', nowIst.toISOString(), 'Offset:', nowIst.getTimezoneOffset());

    const [alcoholResult, visibilityResult, drowsinessResult, obdResult, historyResult] = await Promise.allSettled([
      // Alcohol
      (async () => {
        const path = "/home/fast-and-furious/main/section_4_test_drive/mq3_data.csv";
        const content = await getTailContent(path, 100);
        const lines = content.split("\n").map(l => l.trim()).filter(l => l.includes(","));
        const latest = lines.at(-1);
        if (latest) {
          const [timestamp, sensorLine] = latest.split(",");
          let finalTimestamp = null;
          
          // Check if timestamp already has timezone info
          if (timestamp.includes('+05:30')) {
            // Timestamp already has timezone, parse directly
            const ts = new Date(timestamp);
            finalTimestamp = !isNaN(ts.getTime()) ? ts.toISOString() + '+05:30' : null;
            console.log(`Alcohol - Raw timestamp: ${timestamp}, Parsed directly: ${ts.toISOString()}`);
          } else {
            // Timestamp is in IST without timezone info, convert to UTC
            const ts = new Date(timestamp);
            const utcTs = new Date(ts.getTime() - istOffsetMs);
            finalTimestamp = !isNaN(ts.getTime()) ? utcTs.toISOString() + '+05:30' : null;
            console.log(`Alcohol - Raw timestamp: ${timestamp}, Parsed as IST: ${ts.toISOString()}, UTC: ${utcTs.toISOString()}`);
          }
          
          return {
            level: sensorLine?.match(/Sensor Value:\s*(\d+)/) ? parseInt(RegExp.$1, 10) : 0,
            timestamp: finalTimestamp,
          };
        }
        return { level: 0, timestamp: null };
      })(),

      // Visibility
      (async () => {
        const path = "/home/fast-and-furious/main/section_1_test_drive/visibility_log.csv";
        const content = await getTailContent(path, 100);
        const records = parse(content, { skip_empty_lines: true });
        const latest = records.at(-1);
        if (latest && latest.length >= 4) {
          const timestampStr = `${latest[0]} ${latest[1]}`;
          let finalTimestamp = null;
          
          // Check if timestamp already has timezone info
          if (timestampStr.includes('+05:30')) {
            // Timestamp already has timezone, parse directly
            const ts = new Date(timestampStr);
            finalTimestamp = !isNaN(ts.getTime()) ? ts.toISOString() + '+05:30' : null;
            console.log(`Visibility - Raw timestamp: ${timestampStr}, Parsed directly: ${ts.toISOString()}`);
          } else {
            // Timestamp is in IST without timezone info, convert to UTC
            const ts = new Date(timestampStr);
            const utcTs = new Date(ts.getTime() - istOffsetMs);
            finalTimestamp = !isNaN(ts.getTime()) ? utcTs.toISOString() + '+05:30' : null;
            console.log(`Visibility - Raw timestamp: ${timestampStr}, Parsed as IST: ${ts.toISOString()}, UTC: ${utcTs.toISOString()}`);
          }
          
          return {
            score: Math.round(parseFloat(latest[3] || "0")),
            timestamp: finalTimestamp,
          };
        }
        return { score: 0, timestamp: null };
      })(),

      // Drowsiness
      (async () => {
        const path = "/home/fast-and-furious/main/section_2_test_drive/drowsiness_log.csv";
        const content = await getTailContent(path, 100);
        const records = parse(content, { skip_empty_lines: true, relax_column_count: true });
        const latest = records.at(-1);
        if (latest) {
          const alert = latest?.[6]?.toLowerCase?.() || "";
          let state = "Unknown";
          if (alert.includes("awake")) state = "Awake";
          else if (alert.includes("drowsiness")) state = "Drowsy";
          else if (alert.includes("sleepiness")) state = "Sleepy";
          else if (alert.includes("no driver")) state = "No Face Detected";
          
          const timestampStr = latest?.[1] || "";
          let finalTimestamp = null;
          
          // Check if timestamp already has timezone info
          if (timestampStr.includes('+05:30')) {
            // Timestamp already has timezone, parse directly
            const ts = new Date(timestampStr);
            finalTimestamp = !isNaN(ts.getTime()) ? ts.toISOString() + '+05:30' : null;
            console.log(`Drowsiness - Raw timestamp: ${timestampStr}, Parsed directly: ${ts.toISOString()}`);
          } else {
            // Timestamp is in IST without timezone info, convert to UTC
            const ts = new Date(timestampStr);
            const utcTs = new Date(ts.getTime() - istOffsetMs);
            finalTimestamp = !isNaN(ts.getTime()) ? utcTs.toISOString() + '+05:30' : null;
            console.log(`Drowsiness - Raw timestamp: ${timestampStr}, Parsed as IST: ${ts.toISOString()}, UTC: ${utcTs.toISOString()}`);
          }
          
          return {
            state,
            timestamp: finalTimestamp,
          };
        }
        return { state: "Unknown", timestamp: null };
      })(),

      // OBD
      (async () => {
        const path = "/home/fast-and-furious/main/obd_data/trackLog.csv";
        const content = await getTailContent(path, 100);
        console.log(`OBD File Content: ${content.substring(0, 100)}...`);
        const lines = content.split("\n").map(l => l.trim()).filter(l => l.includes(","));
        const latest = lines.at(-1);
        const parts = latest?.split(",") || [];

        const safeParseFloat = val => {
          const n = parseFloat(val);
          return isNaN(n) ? null : n;
        };

        if (parts.length > 29) {
          const rawTime = parts[1]; // e.g., "08-Jul-2025 13:22:59.311" in IST
          const lat = safeParseFloat(parts[3]);
          const lng = safeParseFloat(parts[2]);
          const speed = safeParseFloat(parts[29]);
          
          let finalTimestamp = null;
          
          // Check if timestamp already has timezone info
          if (rawTime.includes('+05:30')) {
            // Timestamp already has timezone, parse directly
            const ts = new Date(rawTime);
            finalTimestamp = !isNaN(ts.getTime()) ? ts.toISOString() + '+05:30' : null;
            console.log(`OBD - Raw Time: ${rawTime}, Parsed directly: ${ts.toISOString()}`);
          } else {
            // Timestamp is in IST without timezone info, convert to UTC
            const ts = new Date(rawTime);
            const utcTs = new Date(ts.getTime() - istOffsetMs);
            finalTimestamp = !isNaN(ts.getTime()) ? utcTs.toISOString() + '+05:30' : null;
            console.log(`OBD - Raw Time: ${rawTime}, Parsed as IST: ${ts.toISOString()}, UTC: ${utcTs.toISOString()}`);
          }
          
          const nowIstMs = nowIst.getTime();
          const ageMs = finalTimestamp ? Math.max(0, nowIstMs - new Date(finalTimestamp.replace('+05:30', '')).getTime()) : Infinity;
          const isRecent = ageMs <= 60000;
          const isValid = lat !== null && lng !== null && speed !== null;

          console.log(`OBD - Final: ${finalTimestamp}, IsRecent: ${isRecent}, IsValid: ${isValid}, Age: ${ageMs / 1000}s`);
          return {
            speed: isValid ? Math.round(speed) : 0,
            coordinates: isValid ? { lat, lng } : { lat: 48.8584, lng: 2.2945 },
            timestamp: finalTimestamp,
            isConnected: isRecent && isValid,
          };
        }
        return { speed: 0, coordinates: { lat: 48.8584, lng: 2.2945 }, timestamp: null, isConnected: false };
      })(),

      // History
      (async () => {
        const path = "/home/fast-and-furious/main/master_log.csv";
        try {
          const content = await getTailContent(path, 100);
          console.log(`History File Content: ${content.substring(0, 100)}...`);
          const lines = content.trim().split("\n");
          const [header, ...rows] = lines;
          const all = rows.map((line, i) => {
            const [dt, type, severity, loc, desc] = line.split(",");
            const time = new Date(dt); // Already in IST
            return !isNaN(time.getTime()) ? {
              id: i + 1, type: type.trim(), severity: severity.trim(), location: loc.trim(), description: desc.trim(), time: time.toISOString() + '+05:30'
            } : null;
          }).filter(Boolean);

          const nowIstIso = nowIst.toISOString() + '+05:30';
          const todayStart = new Date(nowIst.setUTCHours(0, 0, 0, 0)).toISOString() + '+05:30';
          const sixHoursAgo = new Date(nowIst.getTime() - 6 * 60 * 60 * 1000).toISOString() + '+05:30';
          const thisMonth = nowIst.getUTCMonth();

          const today = all.filter(x => x.time >= todayStart && x.time <= nowIstIso);
          const recent = today.filter(x => x.time >= sixHoursAgo);
          const monthly = all.filter(x => new Date(x.time.replace('+05:30', '')).getUTCMonth() === thisMonth);

          let penalty = 0;
          today.forEach(inc => {
            if (inc.severity.toLowerCase() === "high") penalty += 0.2;
            else if (inc.severity.toLowerCase() === "medium") penalty += 0.05;
          });

          let score = 100;
          if (recent.length === 0) {
            const hrs = Math.floor((new Date(nowIstIso.replace('+05:30', '')) - new Date(todayStart.replace('+05:30', ''))) / (60 * 60 * 1000));
            score += Math.min(hrs, 20) / 2;
          }

          const driverScore = Math.max(0, Math.min(100, score - penalty));

          let weeklyPenalty = 0;
          const oneWeekAgo = new Date(nowIst.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() + '+05:30';
          const week = all.filter(x => x.time >= oneWeekAgo);
          week.forEach(inc => {
            if (inc.severity.toLowerCase() === "high") weeklyPenalty += 0.2;
            else if (inc.severity.toLowerCase() === "medium") weeklyPenalty += 0.05;
          });
          const weeklyScore = Math.max(0, 100 - (weeklyPenalty / 7)).toFixed(2);

          console.log(`History - Recent Incidents: ${recent.length}, Driver Score: ${driverScore}, Active Incidents: ${today.length}`);
          return {
            totalIncidents: all.length,
            monthlyIncidents: monthly.length,
            weeklySafetyScore: weeklyScore,
            driverScore,
            recentIncidents: recent.length,
            activeIncidents: today,
          };
        } catch (err) {
          console.error('History fetch error:', err);
          return {
            totalIncidents: 0,
            monthlyIncidents: 0,
            weeklySafetyScore: "0.00",
            driverScore: 100,
            recentIncidents: 0,
            activeIncidents: [],
          };
        }
      })()
    ]);

    if (alcoholResult.status === 'fulfilled') {
      dashboardData.alcoholLevel = alcoholResult.value.level / 180;
      dashboardData.alcoholTimestamp = alcoholResult.value.timestamp;
    }
    if (visibilityResult.status === 'fulfilled') {
      dashboardData.visibilityScore = visibilityResult.value.score;
      dashboardData.frontcamTimestamp = visibilityResult.value.timestamp;
    }
    if (drowsinessResult.status === 'fulfilled') {
      dashboardData.drowsinessState = drowsinessResult.value.state;
      dashboardData.dashcamTimestamp = drowsinessResult.value.timestamp;
    }
    if (obdResult.status === 'fulfilled') {
      dashboardData.speed = obdResult.value.speed;
      dashboardData.coordinates = obdResult.value.coordinates;
      dashboardData.obdTimestamp = obdResult.value.timestamp;
      dashboardData.isConnected = obdResult.value.isConnected;
    }
    if (historyResult.status === 'rejected') {
      console.error('History fetch failed:', historyResult.reason);
      dashboardData.recentIncidents = 0;
      dashboardData.activeIncidents = [];
      dashboardData.driverScore = 100;
    } else {
      const history = historyResult.value;
      dashboardData.totalIncidents = history.totalIncidents;
      dashboardData.monthlyIncidents = history.monthlyIncidents;
      dashboardData.weeklySafetyScore = history.weeklySafetyScore;
      dashboardData.driverScore = history.driverScore;
      dashboardData.recentIncidents = history.recentIncidents;
      dashboardData.activeIncidents = history.activeIncidents;
    }

    dashboardData.lastUpdate = nowIst.toISOString() + '+05:30';
    return NextResponse.json({ success: true, ...dashboardData });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}