// Timezone optimization to replace slow pg_timezone_names queries
// This prevents the 130ms+ queries that were causing performance issues

// Common timezones cache to avoid hitting pg_timezone_names
const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland'
] as const;

// Full timezone list cache (loaded once)
let timezoneCache: string[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get common timezones without database query
 */
export function getCommonTimezones(): readonly string[] {
  return COMMON_TIMEZONES;
}

/**
 * Check if a timezone is valid using cached list
 */
export function isValidTimezone(timezone: string): boolean {
  // Handle invalid inputs
  if (!timezone || typeof timezone !== 'string' || timezone.trim() === '') {
    return false;
  }
  
  // Check common timezones first (fastest)
  if (COMMON_TIMEZONES.includes(timezone as any)) {
    return true;
  }
  
  // For uncommon timezones, use Intl API (no database query)
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get timezone display name without database query
 */
export function getTimezoneDisplayName(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'long'
    });
    
    const parts = formatter.formatToParts(new Date());
    const timeZonePart = parts.find(part => part.type === 'timeZoneName');
    return timeZonePart?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Get user's current timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Legacy function to replace direct pg_timezone_names queries
 * Use this instead of querying the database
 */
export async function getAvailableTimezones(limit = 50): Promise<string[]> {
  // Return cached common timezones for most use cases
  if (limit <= COMMON_TIMEZONES.length) {
    return [...COMMON_TIMEZONES].slice(0, limit);
  }
  
  // For larger lists, use browser API instead of database
  try {
    const timeZones = Intl.supportedValuesOf('timeZone');
    return timeZones.slice(0, limit);
  } catch {
    // Fallback to common timezones
    return [...COMMON_TIMEZONES];
  }
}