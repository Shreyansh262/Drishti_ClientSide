// route.js - Complete fixed version with authentication forwarding
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // DEBUG: Log all incoming headers
    console.log('All incoming headers:');
    for (const [key, value] of request.headers.entries()) {
      console.log(`${key}: ${value}`);
    }

    // Forward authentication headers from the original request
    const authHeaders = {};
    const authorization = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');
    const cookie = request.headers.get('cookie');
    const bearer = request.headers.get('bearer');
    
    if (authorization) authHeaders['Authorization'] = authorization;
    if (apiKey) authHeaders['X-API-Key'] = apiKey;
    if (cookie) authHeaders['Cookie'] = cookie;
    if (bearer) authHeaders['Bearer'] = bearer;

    console.log('Auth headers being forwarded:', Object.keys(authHeaders));

    const fetchOptions = {
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Call': 'dashboard-combine',
        ...authHeaders,
      }
    };

    const sources = [
      fetch(`${baseUrl}/api/alcohol`, fetchOptions),
      fetch(`${baseUrl}/api/visibility`, fetchOptions),
      fetch(`${baseUrl}/api/drowsiness`, fetchOptions),
      fetch(`${baseUrl}/api/obd`, fetchOptions),
      fetch(`${baseUrl}/api/history`, fetchOptions),
    ];

    // Enhanced error handling for each API call
    const results = await Promise.allSettled(sources);
    
    const [alcoholResult, visibilityResult, drowsinessResult, obdResult, historyResult] = results;

    // Safe JSON parsing with fallbacks
    const safeParseJSON = async (result, fallback = {}) => {
      if (result.status === 'rejected') {
        console.error('Fetch failed:', result.reason);
        return fallback;
      }
      
      try {
        const response = result.value;
        if (!response.ok) {
          console.error(`HTTP Error: ${response.status} ${response.statusText}`);
          return fallback;
        }
        
        const text = await response.text();
        
        // Check if response is HTML (common error indicator)
        if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
          console.error('Received HTML instead of JSON:', text.substring(0, 100));
          return fallback;
        }
        
        return JSON.parse(text);
      } catch (error) {
        console.error('JSON parse error:', error);
        return fallback;
      }
    };

    const [alcohol, visibility, drowsiness, obd, history] = await Promise.all([
      safeParseJSON(alcoholResult, { alcoholLevel: 0, timestamp: null }),
      safeParseJSON(visibilityResult, { visibilityScore: 0, timestamp: null }),
      safeParseJSON(drowsinessResult, { state: "Awake", timestamp: null }),
      safeParseJSON(obdResult, { speed: 0, timestamp: null, coordinates: { lat: 48.8584, lng: 2.2945 } }),
      safeParseJSON(historyResult, { success: false, incidents: [] })
    ]);

    // Define a freshness threshold (e.g., 15 seconds)
    const DATA_FRESHNESS_THRESHOLD_MS = 15 * 1000 // 15 seconds

    const currentTime = new Date()

    const isDataFresh = (timestamp) => {
      if (!timestamp) return false
      const dataTime = new Date(timestamp)
      return (currentTime.getTime() - dataTime.getTime()) < DATA_FRESHNESS_THRESHOLD_MS
    }

    const bacEstimate = alcohol?.alcoholLevel || 0

    let dailySafetyScore = 100
    let recentIncidents = []

    if (history?.success && history?.incidents) {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // Filter today's incidents
      const todayIncidents = history.incidents.filter(incident => {
        const incidentTime = new Date(incident.time)
        const isToday = incidentTime >= todayStart && incidentTime <= now
        return isToday
      }).sort((a, b) => new Date(b.time) - new Date(a.time))

      // Calculate penalties for today
      let penalty = 0
      todayIncidents.forEach((incident) => {
        const severity = incident.severity.toLowerCase()
        if (severity === "high") penalty += 0.2
        else if (severity === "medium") penalty += 0.05
        else if (severity === "low") penalty += 0
      })

      // Check for 1 hour without incidents (bonus points)
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const recentIncidentsCount = todayIncidents.filter(incident =>
        new Date(incident.time) >= oneHourAgo
      ).length

      if (recentIncidentsCount === 0 && now.getHours() > 0) {
        const hoursWithoutIncidents = Math.floor((now - todayStart) / (60 * 60 * 1000))
        dailySafetyScore += (Math.min(hoursWithoutIncidents, 20))/2
      }

      dailySafetyScore = Math.max(0, Math.min(100, dailySafetyScore - penalty))

      // Strategy 3: Just show the most recent 4 incidents from today
      recentIncidents = todayIncidents.slice(0, 4)
    }
    
    // 🚨 Check for current live alerts
    const activeIncidents = [...recentIncidents]

    const response = {
      success: true,
      alcoholLevel: (alcohol?.alcoholLevel) / 180 || 0,
      alcoholTimestamp: alcohol?.timestamp || null,

      visibilityScore: visibility?.visibilityScore || 0,
      frontcamTimestamp: visibility?.timestamp || null,

      drowsinessState: drowsiness?.state || "Awake",
      dashcamTimestamp: drowsiness?.timestamp || null,

      speed: obd?.speed || 0,
      obdTimestamp: obd?.timestamp || null,

      coordinates: isDataFresh(obd?.timestamp) ? obd.coordinates : { lat: 48.8584, lng: 2.2945 }, // Default to Eiffel Tower if no data
      isConnected: true,
      lastUpdate: new Date(),
      driverScore: dailySafetyScore,
      recentIncidents: recentIncidents.length,
      dataAge: 10,

      // Enhanced active incidents
      activeIncidents: activeIncidents,
      historicalIncidents: recentIncidents,
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error("Dashboard combine failed", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}