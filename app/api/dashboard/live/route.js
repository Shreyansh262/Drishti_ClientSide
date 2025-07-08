import { NextResponse } from "next/server";
import { getTailContent, getFileContent } from "@/lib/sshClient";
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
      lastUpdate: new Date().toISOString(),
      recentIncidents: 0,
      activeIncidents: [],
      totalIncidents: 0,
      monthlyIncidents: 0,
      weeklySafetyScore: 0,
    };

    console.log('Server Time:', new Date().toISOString(), 'Offset:', new Date().getTimezoneOffset());

    const [alcoholResult, visibilityResult, drowsinessResult, obdResult, historyResult] = await Promise.allSettled([
      // Alcohol
      (async () => {
        const path = "/home/fast-and-furious/main/section_4_test_drive/mq3_data.csv";
        const content = await getTailContent(path, 100);
        const lines = content.split("\n").map(l => l.trim()).filter(l => l.includes(","));
        const latest = lines.at(-1);
        if (latest) {
          const [timestamp, sensorLine] = latest.split(",");
          const match = sensorLine?.match(/Sensor Value:\s*(\d+)/);
          return {
            level: match ? parseInt(match[1], 10) : 0,
            timestamp: new Date(timestamp).toISOString(), // Explicit UTC
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
          return {
            score: Math.round(parseFloat(latest[3] || "0")),
            timestamp: new Date(`${latest[0]} ${latest[1]}`).toISOString(), // Explicit UTC
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
          return {
            state,
            timestamp: latest?.[1] ? new Date(latest[1]).toISOString() : null, // Explicit UTC
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
          const rawTime = parts[1];
          const lat = safeParseFloat(parts[3]);
          const lng = safeParseFloat(parts[2]);
          const speed = safeParseFloat(parts[29]);

          const timestamp = new Date(rawTime).toISOString(); // Explicit UTC
          const isRecent = new Date().getTime() - new Date(timestamp).getTime() <= 60000; // Explicit UTC comparison
          const isValid = lat !== null && lng !== null && speed !== null;

          return {
            speed: isValid ? Math.round(speed) : 0,
            coordinates: isValid ? { lat, lng } : { lat: 48.8584, lng: 2.2945 },
            timestamp,
            isConnected: isRecent && isValid,
          };
        }
        return { speed: 0, coordinates: { lat: 48.8584, lng: 2.2945 }, timestamp: null, isConnected: false };
      })(),

      // History
      (async () => {
        const path = "/home/fast-and-furious/main/master_log.csv";
        const content = await getTailContent(path, 100); // Fetch only recent lines
        const lines = content.trim().split("\n");
        const [header, ...rows] = lines;
        const all = rows.map((line, i) => {
          const [dt, type, severity, loc, desc] = line.split(",");
          const time = new Date(dt).toISOString(); // Explicit UTC
          return !isNaN(new Date(dt).getTime()) ? {
            id: i + 1, type: type.trim(), severity: severity.trim(), location: loc.trim(), description: desc.trim(), time
          } : null;
        }).filter(Boolean);

        const now = new Date().toISOString();
        const todayStart = new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();
        const sixHoursAgo = new Date(new Date().getTime() - 6 * 60 * 60 * 1000).toISOString();
        const thisMonth = new Date().getUTCMonth();

        const today = all.filter(x => x.time >= todayStart && x.time <= now);
        const recent = today.filter(x => x.time >= sixHoursAgo);
        const monthly = all.filter(x => new Date(x.time).getUTCMonth() === thisMonth);

        let penalty = 0;
        today.forEach(inc => {
          if (inc.severity.toLowerCase() === "high") penalty += 0.2;
          else if (inc.severity.toLowerCase() === "medium") penalty += 0.05;
        });

        let score = 100;
        if (recent.length === 0) {
          const hrs = Math.floor((new Date(now) - new Date(todayStart)) / (60 * 60 * 1000));
          score += Math.min(hrs, 20) / 2;
        }

        const driverScore = Math.max(0, Math.min(100, score - penalty));

        let weeklyPenalty = 0;
        const oneWeekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const week = all.filter(x => x.time >= oneWeekAgo);
        week.forEach(inc => {
          if (inc.severity.toLowerCase() === "high") weeklyPenalty += 0.2;
          else if (inc.severity.toLowerCase() === "medium") weeklyPenalty += 0.05;
        });
        const weeklyScore = Math.max(0, 100 - (weeklyPenalty / 7)).toFixed(2);

        return {
          totalIncidents: all.length,
          monthlyIncidents: monthly.length,
          weeklySafetyScore: weeklyScore,
          driverScore,
          recentIncidents: recent.length,
          activeIncidents: today.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()),
        };
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

    dashboardData.lastUpdate = new Date().toISOString();
    return NextResponse.json({ success: true, ...dashboardData });
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}