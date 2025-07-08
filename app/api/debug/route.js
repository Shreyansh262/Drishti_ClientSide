import { NextResponse } from "next/server";
import { getFileContent, getTailContent } from "@/lib/sshClient";

export async function GET() {
  try {
    console.log('=== DEBUG ENDPOINT CALLED ===');
    
    // Test basic SSH connectivity
    const historyContent = await getFileContent("/home/fast-and-furious/main/master_log.csv");
    const lines = historyContent.trim().split("\n");
    const [header, ...rows] = lines;
    
    // Get current alcohol data
    const alcoholContent = await getTailContent("/home/fast-and-furious/main/section_4_test_drive/mq3_data.csv", 5);
    const alcoholLines = alcoholContent.split("\n").filter(line => line.trim());
    
    // Check current time calculations
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const localTodayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Parse and analyze incidents
    const allIncidents = rows
      .map((line, index) => {
        const [datetime, fault_type, severity, location, description] = line.split(",");
        const time = new Date(datetime);
        if (isNaN(time.getTime())) return null;
        return { 
          id: index + 1, 
          type: fault_type?.trim(), 
          severity: severity?.trim(), 
          location: location?.trim(), 
          description: description?.trim(), 
          time: time,
          timeString: time.toISOString(),
          isToday: time >= todayStart && time <= now,
          isTodayLocal: time >= localTodayStart && time <= now
        };
      })
      .filter(Boolean);
    
    const todayIncidents = allIncidents.filter(incident => incident.isToday);
    const todayIncidentsLocal = allIncidents.filter(incident => incident.isTodayLocal);
    
    return NextResponse.json({
      success: true,
      debug: {
        environment: process.env.NODE_ENV,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        currentTime: now.toISOString(),
        currentTimeLocal: now.toString(),
        todayStartUTC: todayStart.toISOString(),
        todayStartLocal: localTodayStart.toISOString(),
        
        ssh: {
          connected: true,
          historyFileLength: historyContent.length,
          totalLines: lines.length,
          headerRow: header,
          lastFewRows: rows.slice(-5),
        },
        
        alcohol: {
          rawLines: alcoholLines,
          lastLine: alcoholLines[alcoholLines.length - 1],
        },
        
        incidents: {
          total: allIncidents.length,
          todayUTC: todayIncidents.length,
          todayLocal: todayIncidentsLocal.length,
          todayIncidentsUTC: todayIncidents.map(inc => ({
            time: inc.timeString,
            type: inc.type,
            severity: inc.severity
          })),
          todayIncidentsLocal: todayIncidentsLocal.map(inc => ({
            time: inc.timeString,
            type: inc.type,
            severity: inc.severity
          })),
          last10Incidents: allIncidents.slice(-10).map(inc => ({
            time: inc.timeString,
            type: inc.type,
            severity: inc.severity,
            isToday: inc.isToday,
            isTodayLocal: inc.isTodayLocal
          }))
        }
      }
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack,
      debug: {
        environment: process.env.NODE_ENV,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        currentTime: new Date().toISOString(),
        envVars: {
          VM_HOST: process.env.VM_HOST ? 'SET' : 'NOT SET',
          VM_USER: process.env.VM_USER ? 'SET' : 'NOT SET',
          VM_PRIVATE_KEY_CONTENT: process.env.VM_PRIVATE_KEY_CONTENT ? 'SET' : 'NOT SET',
        }
      }
    }, { status: 500 });
  }
}