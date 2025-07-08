# Timezone Fix Summary

## Problem Identified:
The alcohol sensor (and other sensors) were showing as "offline" even when they were actually online due to incorrect timezone handling.

## Root Cause:
1. **Server-side**: CSV timestamps were in IST (Indian Standard Time)
2. **Conversion Issue**: The code was treating IST timestamps as if they were UTC, then appending `+05:30`
3. **Client-side**: The client was comparing IST times with UTC times, causing a 5.5-hour offset

## Changes Made:

### 1. Server-side (API route.js):
- **Before**: `const ts = new Date(timestamp); return ts.toISOString() + '+05:30'`
- **After**: 
  ```javascript
  const ts = new Date(timestamp); // Parse IST timestamp
  const utcTs = new Date(ts.getTime() - istOffsetMs); // Convert to UTC
  return utcTs.toISOString() + '+05:30'; // Send UTC time with IST marker
  ```

### 2. Client-side (page.jsx):
- **Before**: `const ageMs = getIstNow().getTime() - date.getTime();` (mixing IST and UTC)
- **After**: `const ageMs = new Date().getTime() - utcDate.getTime();` (both UTC)

### 3. Fixed Functions:
- `isSensorOnline()`: Now properly compares UTC times
- `formatTimestamp()`: Correctly converts UTC to IST for display
- OBD age calculation: Fixed to use UTC comparison
- Data age calculation: Fixed to use UTC comparison

## How It Works Now:
1. **CSV timestamps** are in IST (local device time)
2. **Server converts** IST to UTC before sending to client
3. **Client receives** UTC timestamp with `+05:30` suffix
4. **Client compares** UTC times for age calculation
5. **Client displays** times converted back to IST

## Testing:
- All sensors should now show correct online/offline status
- Timestamps should display in correct IST format
- Age calculations should be accurate regardless of timezone

## Expected Result:
- Alcohol sensor will now show "Online" when it's actually online
- All sensor timestamps will display correctly in IST
- Age calculations will be accurate for all sensors
