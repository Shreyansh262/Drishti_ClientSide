# Timezone Fix Summary

## Problem Identified:
The alcohol sensor (and other sensors) were showing as "offline" even when they were actually online due to incorrect timezone handling.

## Root Cause:
1. **CSV Format Inconsistency**: Some CSV files have timestamps with `+05:30` timezone info, others don't
2. **Double Timezone Conversion**: When timestamps already had `+05:30`, the code was still subtracting IST offset
3. **Client-side Comparison**: The client was comparing times with inconsistent timezone handling

## Actual Issue from Logs:
- **Alcohol sensor**: Raw timestamp `2025-07-08T22:13:25.824988+05:30` was being double-converted
- **JavaScript parsing**: `new Date("2025-07-08T22:13:25.824988+05:30")` gives correct UTC time, but code was subtracting IST offset again
- **Result**: Timestamp was 5.5 hours behind actual time

## Changes Made:

### 1. Server-side (API route.js):
- **Before**: Always subtract IST offset from parsed timestamp
- **After**: 
  ```javascript
  // Check if timestamp already has timezone info
  if (timestamp.includes('+05:30')) {
    // Parse directly - JavaScript handles timezone conversion
    const ts = new Date(timestamp);
    finalTimestamp = ts.toISOString() + '+05:30';
  } else {
    // Timestamp is IST without timezone info, convert to UTC
    const ts = new Date(timestamp);
    const utcTs = new Date(ts.getTime() - istOffsetMs);
    finalTimestamp = utcTs.toISOString() + '+05:30';
  }
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
