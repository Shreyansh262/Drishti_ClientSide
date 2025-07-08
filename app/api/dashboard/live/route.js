import { NextResponse } from "next/server";
import { getTailContent, getFileContent } from "@/lib/sshClient"; // Import SSH client functions
import { parse } from "csv-parse/sync"; // Needed for drowsiness and visibility parsing

export async function GET(request) {
  try {
    // Initialize a data object with default values.
    // This ensures the API always returns a consistent structure,
    // even if some data sources fail during concurrent fetching.
    const dashboardData = {
      driverScore: 100,
      alcoholLevel: 0.0,
      alcoholTimestamp: null,
      visibilityScore: 0,
      frontcamTimestamp: null,
      drowsinessState: "Awake",
      dashcamTimestamp: null,
      speed: 0,
      coordinates: { lat: 48.8584, lng: 2.2945 }, // Default to Eiffel Tower coordinates
      obdTimestamp: null,
      isConnected: false, // Overall connectivity status
      lastUpdate: new Date(), // Timestamp of this API response
      recentIncidents: 0, // Count of recent incidents (for display)
      activeIncidents: [], // Detailed list of active/recent incidents
      totalIncidents: 0, // Total historical incidents
      monthlyIncidents: 0, // Incidents in the current month
      weeklySafetyScore: 0, // Weekly calculated safety score
    };

    // Log environment info at the start
    console.log('=== ENVIRONMENT DEBUG START ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Server timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('Current time:', new Date().toISOString());
    console.log('Current time (local):', new Date().toString());
    console.log('VM_HOST:', process.env.VM_HOST ? 'SET' : 'NOT SET');
    console.log('VM_USER:', process.env.VM_USER ? 'SET' : 'NOT SET');
    console.log('VM_PRIVATE_KEY_CONTENT:', process.env.VM_PRIVATE_KEY_CONTENT ? 'SET' : 'NOT SET');
    console.log('=== ENVIRONMENT DEBUG END ===');

    // --- Concurrent Data Fetching using Promise.allSettled ---
    // Each data source is wrapped in an immediately-invoked async function (IIFE)
    // that returns a promise. Promise.allSettled will wait for all of them
    // to complete (either fulfill or reject) before proceeding.
    const [
      alcoholResult,
      visibilityResult,
      drowsinessResult,
      obdResult,
      historyResult,
    ] = await Promise.allSettled([
      // Alcohol Sensor Data
      (async () => {
        console.log('=== FETCHING ALCOHOL DATA ===');
        const alcoholFilePath = "/home/fast-and-furious/main/section_4_test_drive/mq3_data.csv";
        const content = await getTailContent(alcoholFilePath, 100);
        console.log('Alcohol file content (last 200 chars):', content.slice(-200));
        const lines = content.split("\n").map(line => line.trim()).filter(line => line.includes(","));
        console.log('Alcohol lines found:', lines.length);
        const latest = lines.at(-1);
        console.log('Latest alcohol line:', latest);
        if (latest) {
          const [timestamp, sensorLine] = latest.split(",");
          const match = sensorLine?.match(/Sensor Value:\s*(\d+)/);
          const result = {
            level: match ? parseInt(match[1], 10) : 0,
            timestamp: timestamp,
          };
          console.log('Alcohol result:', result);
          return result;
        }
        return { level: 0, timestamp: null };
      })(),

      // Visibility Score Data
      (async () => {
        console.log('=== FETCHING VISIBILITY DATA ===');
        const visibilityFilePath = "/home/fast-and-furious/main/section_1_test_drive/visibility_log.csv";
        const content = await getTailContent(visibilityFilePath, 100);
        console.log('Visibility file content (last 200 chars):', content.slice(-200));
        const records = parse(content, { skip_empty_lines: true });
        console.log('Visibility records found:', records.length);
        const latest = records.at(-1);
        console.log('Latest visibility record:', latest);
        if (latest && latest.length >= 4) {
          const date = latest[0];
          const time = latest[1];
          const rawScore = parseFloat(latest[3] || "0");
          const result = {
            score: Math.round(rawScore),
            timestamp: `${date} ${time}`,
          };
          console.log('Visibility result:', result);
          return result;
        }
        return { score: 0, timestamp: null };
      })(),

      // Drowsiness State Data
      (async () => {
        console.log('=== FETCHING DROWSINESS DATA ===');
        const drowsinessFilePath = "/home/fast-and-furious/main/section_2_test_drive/drowsiness_log.csv";
        const content = await getTailContent(drowsinessFilePath, 100);
        console.log('Drowsiness file content (last 200 chars):', content.slice(-200));
        const records = parse(content, {
          columns: false,
          skip_empty_lines: true,
          relax_column_count: true,
        });
        console.log('Drowsiness records found:', records.length);
        const latest = records.at(-1);
        console.log('Latest drowsiness record:', latest);
        if (latest) {
          const timestamp = latest?.[1] || null;
          const alertRaw = latest?.[6]?.toLowerCase?.() || "";
          let state = "Unknown";
          if (alertRaw.includes("awake")) state = "Awake";
          else if (alertRaw.includes("drowsiness")) state = "Drowsy";
          else if (alertRaw.includes("sleepiness")) state = "Sleepy";
          else if (alertRaw.includes("no driver")) state = "No Face Detected";
          const result = {
            state: state,
            timestamp: timestamp,
          };
          console.log('Drowsiness result:', result);
          return result;
        }
        return { state: "Unknown", timestamp: null };
      })(),

      // OBD Data (Speed and Coordinates)
      (async () => {
        console.log('=== FETCHING OBD DATA ===');
        const obdFilePath = "/home/fast-and-furious/main/obd_data/trackLog.csv";
        const content = await getTailContent(obdFilePath, 100);
        console.log('OBD file content (last 200 chars):', content.slice(-200));
        const lines = content.split("\n").map(l => l.trim()).filter(l => l.includes(","));
        console.log('OBD lines found:', lines.length);
        const latestLine = lines.at(-1) || "";
        console.log('Latest OBD line:', latestLine);
        const parts = latestLine.split(",");
        console.log('OBD parts count:', parts.length);

        if (parts.length > 29) {
          const timestampRaw = parts[1] || "";
          const latRaw = parts[3] || "";
          const lngRaw = parts[2] || "";
          const speedRaw = parts[29] || "0";

          const timestamp = new Date(timestampRaw).toISOString();
          const ageMs = Date.now() - new Date(timestampRaw).getTime();
          const isConnected = ageMs <= 60_000; // Connected if data is less than 60 seconds old

          const result = {
            speed: Math.round(parseFloat(speedRaw)),
            coordinates: { lat: parseFloat(latRaw), lng: parseFloat(lngRaw) },
            timestamp: timestamp,
            isConnected: isConnected,
          };
          console.log('OBD result:', result);
          return result;
        }
        return { speed: 0, coordinates: { lat: 48.8584, lng: 2.2945 }, timestamp: null, isConnected: false };
      })(),

      // History and Driver Score Data
      (async () => {
        console.log('=== FETCHING HISTORY DATA ===');
        const historyFilePath = "/home/fast-and-furious/main/master_log.csv";
        const content = await getFileContent(historyFilePath); // Reads entire file
        console.log('History file content length:', content.length);
        console.log('History file content (last 500 chars):', content.slice(-500));

        const lines = content.trim().split("\n");
        const [header, ...rows] = lines;
        console.log('History header:', header);
        console.log('History rows count:', rows.length);
        console.log('Last 3 rows:', rows.slice(-3));

        const allIncidents = rows
          .map((line, index) => {
            const [datetime, fault_type, severity, location, description] = line.split(",");
            const time = new Date(datetime);
            if (isNaN(time.getTime())) {
              console.log(`Invalid date in line ${index}:`, datetime);
              return null;
            }
            return { id: index + 1, type: fault_type.trim(), severity: severity.trim(), location: location.trim(), description: description.trim(), time };
          })
          .filter(Boolean);

        console.log('Valid incidents found:', allIncidents.length);
        if (allIncidents.length > 0) {
          console.log('First incident:', allIncidents[0]);
          console.log('Last incident:', allIncidents[allIncidents.length - 1]);
        }

        const totalIncidents = allIncidents.length;
        const now = new Date();
        console.log('Current time for calculations:', now.toISOString());
        
        const currentMonth = now.getMonth();
        const monthlyIncidents = allIncidents.filter(incident => incident.time.getMonth() === currentMonth).length;
        console.log('Monthly incidents:', monthlyIncidents);

        // Daily Safety Score - Use UTC for consistency
        const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        console.log('Today start (UTC):', todayStart.toISOString());
        
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        console.log('Six hours ago:', sixHoursAgo.toISOString());
        
        const todayIncidents = allIncidents.filter(incident => {
          const isToday = incident.time >= todayStart && incident.time <= now;
          if (isToday) {
            console.log('Today incident found:', incident.time.toISOString(), incident.type);
          }
          return isToday;
        });
        console.log('Today incidents count:', todayIncidents.length);

        const recentIncidentsCount = todayIncidents.filter(incident => incident.time >= sixHoursAgo && incident.time <= now).length;
        console.log('Recent incidents count (last 6 hours):', recentIncidentsCount);

        let dailySafetyScore = 100;
        let penalty = 0;
        todayIncidents.forEach(incident => {
          const severity = incident.severity.toLowerCase();
          if (severity === "high") penalty += 0.2
          else if (severity === "medium") penalty += 0.05;
          console.log(`Incident penalty: ${incident.severity} -> ${penalty}`);
        });

        if (recentIncidentsCount === 0 && now.getHours() > 0) {
          const hoursWithoutIncidents = Math.floor((now - todayStart) / (60 * 60 * 1000));
          dailySafetyScore += (Math.min(hoursWithoutIncidents, 20)) / 2;
          console.log('Hours without incidents bonus:', hoursWithoutIncidents);
        }
        const driverScore = Math.max(0, Math.min(100, dailySafetyScore - penalty));
        console.log('Final driver score calculation:', { dailySafetyScore, penalty, driverScore });

        // Weekly Safety Score
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        const lastWeekIncidents = allIncidents.filter(incident => incident.time >= oneWeekAgo && incident.time <= now);
        let weeklyPenalty = 0;
        lastWeekIncidents.forEach(incident => {
          const severity = incident.severity.toLowerCase();
          if (severity === "high") weeklyPenalty += 0.2;
          else if (severity === "medium") weeklyPenalty += 0.05;
        });
        const weeklySafetyScore = (Math.max(0, 100 - (weeklyPenalty / 7))).toFixed(2);
        console.log('Weekly safety score:', weeklySafetyScore);

        const activeIncidents = todayIncidents.sort((a, b) => b.time.getTime() - a.time.getTime());
        console.log('Active incidents:', activeIncidents.length);

        const result = {
          totalIncidents,
          monthlyIncidents,
          weeklySafetyScore,
          driverScore,
          recentIncidents: todayIncidents.slice(0, 4).length, // Count of top 4 recent
          activeIncidents, // Actual array of active incidents
        };
        console.log('History result:', result);
        return result;
      })(),
    ]);

    // --- Process Results from Concurrent Fetches ---
    // Check each result. If fulfilled, assign its value to dashboardData.
    // If rejected, log the error but allow the rest of the dashboard to function.
    console.log('=== PROCESSING RESULTS ===');
    
    if (alcoholResult.status === 'fulfilled' && alcoholResult.value) {
      console.log('✅ Alcohol data successful');
      // ✅ FIX: Divide alcohol level by 180 here
      dashboardData.alcoholLevel = alcoholResult.value.level / 180;
      dashboardData.alcoholTimestamp = alcoholResult.value.timestamp;
    } else if (alcoholResult.status === 'rejected') {
      console.error("❌ Dashboard API: Alcohol data fetch rejected:", alcoholResult.reason);
    }

    if (visibilityResult.status === 'fulfilled' && visibilityResult.value) {
      console.log('✅ Visibility data successful');
      dashboardData.visibilityScore = visibilityResult.value.score;
      dashboardData.frontcamTimestamp = visibilityResult.value.timestamp;
    } else if (visibilityResult.status === 'rejected') {
      console.error("❌ Dashboard API: Visibility data fetch rejected:", visibilityResult.reason);
    }

    if (drowsinessResult.status === 'fulfilled' && drowsinessResult.value) {
      console.log('✅ Drowsiness data successful');
      dashboardData.drowsinessState = drowsinessResult.value.state;
      dashboardData.dashcamTimestamp = drowsinessResult.value.timestamp;
    } else if (drowsinessResult.status === 'rejected') {
      console.error("❌ Dashboard API: Drowsiness data fetch rejected:", drowsinessResult.reason);
    }

    if (obdResult.status === 'fulfilled' && obdResult.value) {
      console.log('✅ OBD data successful');
      dashboardData.speed = obdResult.value.speed;
      dashboardData.coordinates = obdResult.value.coordinates;
      dashboardData.obdTimestamp = obdResult.value.timestamp;
      dashboardData.isConnected = obdResult.value.isConnected;
    } else if (obdResult.status === 'rejected') {
      console.error("❌ Dashboard API: OBD data fetch rejected:", obdResult.reason);
    }

    if (historyResult.status === 'fulfilled' && historyResult.value) {
      console.log('✅ History data successful');
      dashboardData.totalIncidents = historyResult.value.totalIncidents;
      dashboardData.monthlyIncidents = historyResult.value.monthlyIncidents;
      dashboardData.weeklySafetyScore = historyResult.value.weeklySafetyScore;
      dashboardData.driverScore = historyResult.value.driverScore;
      dashboardData.recentIncidents = historyResult.value.recentIncidents;
      dashboardData.activeIncidents = historyResult.value.activeIncidents;
    } else if (historyResult.status === 'rejected') {
      console.error("❌ Dashboard API: History data fetch rejected:", historyResult.reason);
    }

    dashboardData.lastUpdate = new Date(); // Update last update time to now

    // Final debug log
    console.log('=== FINAL DASHBOARD DATA ===');
    console.log('Driver Score:', dashboardData.driverScore);
    console.log('Recent Incidents:', dashboardData.recentIncidents);
    console.log('Total Incidents:', dashboardData.totalIncidents);
    console.log('Alcohol Level:', dashboardData.alcoholLevel);
    console.log('Visibility Score:', dashboardData.visibilityScore);
    console.log('OBD Connected:', dashboardData.isConnected);
    console.log('Drowsiness State:', dashboardData.drowsinessState);
    console.log('Active Incidents Length:', dashboardData.activeIncidents.length);
    console.log('=== END FINAL DEBUG ===');

    // --- Final Response ---
    return NextResponse.json({
      success: true,
      ...dashboardData, // Spread all properties from the updated dashboardData
    });

  } catch (globalErr) {
    console.error("❌ Dashboard API: Global error during processing:", globalErr);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred: " + globalErr.message },
      { status: 500 }
    );
  }
}