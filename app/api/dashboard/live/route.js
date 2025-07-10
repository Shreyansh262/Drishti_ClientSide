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
    };

    // Get current server time (UTC) and convert to IST (UTC+5:30)
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const nowUtc = new Date();
    const nowIst = new Date(nowUtc.getTime() + istOffsetMs);

    const [alcoholResult, visibilityResult, drowsinessResult, obdResult, historyResult] = await Promise.allSettled([
      // Alcohol
      (async () => {
        const path = "/home/fast-and-furious/main/section_4_test_drive/mq3_data.csv";
        const content = await getTailContent(path, 5000);
        const lines = content.split("\n").map(l => l.trim()).filter(l => l.includes(","));
        const latest = lines.at(-1);
        if (latest) {
          const [timestamp, sensorLine] = latest.split(",");
          let finalTimestamp = null;
          
          // Parse timestamp - assume IST format like "2025-07-10 14:30:45"
          if (timestamp && timestamp.trim()) {
            const ts = new Date(timestamp.trim());
            if (!isNaN(ts.getTime())) {
              // Convert IST to UTC and append timezone
              const utcTs = new Date(ts.getTime() - istOffsetMs);
              finalTimestamp = utcTs.toISOString().replace('Z', '+05:30');
            }
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
        const content = await getTailContent(path, 5000);
        const records = parse(content, { skip_empty_lines: true });
        const latest = records.at(-1);
        if (latest && latest.length >= 4) {
          const timestampStr = `${latest[0]} ${latest[1]}`;
          let finalTimestamp = null;
          
          // Parse timestamp - assume IST format like "2025-07-10 14:30:45"
          if (timestampStr && timestampStr.trim()) {
            const ts = new Date(timestampStr.trim());
            if (!isNaN(ts.getTime())) {
              // Convert IST to UTC and append timezone
              const utcTs = new Date(ts.getTime() - istOffsetMs);
              finalTimestamp = utcTs.toISOString().replace('Z', '+05:30');
            }
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
        const content = await getTailContent(path, 5000);
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
          
          // Parse timestamp - assume IST format like "2025-07-10 14:30:45"
          if (timestampStr && timestampStr.trim()) {
            const ts = new Date(timestampStr.trim());
            if (!isNaN(ts.getTime())) {
              // Convert IST to UTC and append timezone
              const utcTs = new Date(ts.getTime() - istOffsetMs);
              finalTimestamp = utcTs.toISOString().replace('Z', '+05:30');
            }
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
          
          // Parse timestamp - assume IST format
          if (rawTime && rawTime.trim()) {
            const ts = new Date(rawTime.trim());
            if (!isNaN(ts.getTime())) {
              // Convert IST to UTC and append timezone
              const utcTs = new Date(ts.getTime() - istOffsetMs);
              finalTimestamp = utcTs.toISOString().replace('Z', '+05:30');
            }
          }
          
          const nowIstMs = nowIst.getTime();
          const ageMs = finalTimestamp ? Math.max(0, nowIstMs - new Date(finalTimestamp.replace('+05:30', '')).getTime()) : Infinity;
          const isRecent = ageMs <= 60000;
          const isValid = lat !== null && lng !== null && speed !== null;

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
          const content = await getTailContent(path, 1000);
          const lines = content.trim().split("\n");
          const [header, ...rows] = lines;
          const all = rows.map((line, i) => {
            const [dt, type, severity, loc, desc] = line.split(",");
            let finalTimestamp = null;
            
            // Parse timestamp - assume IST format
            if (dt && dt.trim()) {
              const time = new Date(dt.trim());
              if (!isNaN(time.getTime())) {
                // Convert IST to UTC and append timezone
                const utcTime = new Date(time.getTime() - istOffsetMs);
                finalTimestamp = utcTime.toISOString().replace('Z', '+05:30');
              }
            }
            
            return finalTimestamp ? {
              id: i + 1, 
              type: type.trim(), 
              severity: severity.trim(), 
              location: loc.trim(), 
              description: desc.trim(), 
              time: finalTimestamp
            } : null;
          }).filter(Boolean);

          const nowUtc = new Date();
          
          // Calculate time ranges using Date objects for accurate comparison
          const twoDaysAgo = new Date(nowUtc.getTime() - 2 * 24 * 60 * 60 * 1000);
          const thirtyDaysAgo = new Date(nowUtc.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          // Filter incidents using proper date comparison
          const last48Hours = all.filter(x => {
            const incidentDate = new Date(x.time.replace('+05:30', ''));
            return incidentDate >= twoDaysAgo && incidentDate <= nowUtc;
          });
          
          const last30Days = all.filter(x => {
            const incidentDate = new Date(x.time.replace('+05:30', ''));
            return incidentDate >= thirtyDaysAgo && incidentDate <= nowUtc;
          });
          
          // Monthly incidents should check both month and year
          const currentMonth = nowUtc.getMonth();
          const currentYear = nowUtc.getFullYear();
          const monthly = all.filter(x => {
            const incidentDate = new Date(x.time.replace('+05:30', ''));
            return incidentDate.getMonth() === currentMonth && incidentDate.getFullYear() === currentYear;
          });

          // Calculate daily safety score based on last 48 hours
          let dailyPenalty = 0;
          last48Hours.forEach(inc => {
            if (inc.severity.toLowerCase() === "high") dailyPenalty += 0.15;
            else if (inc.severity.toLowerCase() === "medium") dailyPenalty += 0.08;
            else if (inc.severity.toLowerCase() === "low") dailyPenalty += 0;
          });
          
          const dailyScore = Math.max(0, Math.min(100, 100 - dailyPenalty/2));

          // Get 4 most recent incidents from last 48 hours for live alerts
          const recentIncidents = last48Hours
            .sort((a, b) => new Date(b.time.replace('+05:30', '')).getTime() - new Date(a.time.replace('+05:30', '')).getTime())
            .slice(0, 4);

          console.log(`History - Last 48 Hours: ${last48Hours.length}, Daily Score: ${dailyScore}, Recent Incidents: ${recentIncidents.length}`);
          
          return {
            totalIncidents: all.length,
            monthlyIncidents: monthly.length,
            driverScore: dailyScore,
            recentIncidents: last48Hours.length,
            activeIncidents: recentIncidents,
          };
        } catch (err) {
          console.error('History fetch error:', err);
          return {
            totalIncidents: 0,
            monthlyIncidents: 0,
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
      dashboardData.driverScore = history.driverScore;
      dashboardData.recentIncidents = history.recentIncidents;
      dashboardData.activeIncidents = history.activeIncidents;
    }

    dashboardData.lastUpdate = nowUtc.toISOString().replace('Z', '+05:30');
    return NextResponse.json({ success: true, ...dashboardData });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}