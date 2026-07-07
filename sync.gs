/**
 * DUAL-AUTH CALENDAR SYNC (Direct Calendar Access)
 * Run this from your CLIENT account.
 */

// 1. The email address of your PERSONAL/TARGET calendar
const TARGET_CAL_ID = ""; 

// 2. The name of the client (for the title of the synced event)
const CLIENT_NAME = "";

const SYNC_DAYS_FORWARD = 14;
const SYNC_ID_PREFIX = "SYNC_ID_DIRECT:";

function syncClientToPersonal() {
  const clientCal = CalendarApp.getDefaultCalendar(); // Your Work Cal
  const targetCal = CalendarApp.getCalendarById(TARGET_CAL_ID);
  
  if (!targetCal) {
    Logger.log("Error: Could not access target calendar. Did you share it with this email?");
    return;
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + (SYNC_DAYS_FORWARD * 24 * 60 * 60 * 1000));

  // 1. Get existing synced blocks on the Target Calendar
  const targetEvents = targetCal.getEvents(now, endDate);
  const syncedMap = {};
  
  targetEvents.forEach(ev => {
    const desc = ev.getDescription();
    if (desc.includes(SYNC_ID_PREFIX)) {
      const syncId = desc.split(SYNC_ID_PREFIX)[1].trim();
      syncedMap[syncId] = ev;
    }
  });

  // 2. Get real events from Client Calendar
  const clientEvents = clientCal.getEvents(now, endDate);
  const activeSyncIds = new Set();

  clientEvents.forEach(cEv => {
    // Skip all-day events or "Free" events if you prefer
    if (cEv.isAllDayEvent()) return; 

    const syncId = cEv.getId();
    activeSyncIds.add(syncId);
    
    const displayTitle = "Client Meeting: " + CLIENT_NAME;
    const syncTag = "\n\nDO NOT EDIT: " + SYNC_ID_PREFIX + syncId;

    if (syncedMap[syncId]) {
      const existing = syncedMap[syncId];
      // Update if time changed
      if (existing.getStartTime().getTime() !== cEv.getStartTime().getTime() || 
          existing.getEndTime().getTime() !== cEv.getEndTime().getTime()) {
        existing.setTime(cEv.getStartTime(), cEv.getEndTime());
        Logger.log("Updated: " + syncId);
      }
    } else {
      // Create new "Busy" block
      let event = targetCal.createEvent(displayTitle, cEv.getStartTime(), cEv.getEndTime(), {
        description: syncTag
      });
      event.removeAllReminders();
      Logger.log("Created: " + syncId);
    }
  });

  // 3. Cleanup: Remove blocks that no longer exist in Client Cal
  Object.keys(syncedMap).forEach(sId => {
    if (!activeSyncIds.has(sId)) {
      syncedMap[sId].deleteEvent();
      Logger.log("Deleted: " + sId);
    }
  });
}
