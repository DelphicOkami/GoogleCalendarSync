# Calendar Sync

A [Google Apps Script](https://script.google.com) for consultants working across two Google accounts. It mirrors meetings from your **client-owned calendar** onto your **main (consultancy) calendar** as generic "busy" blocks, so your main calendar reflects your true availability without exposing client meeting details.

## How it works

The script runs from your **client-owned account** and, for the next `SYNC_DAYS_FORWARD` days:

1. **Reads** timed events from that account's default calendar (your client calendar).
2. **Creates** a matching event on your main calendar titled `Client Meeting: <CLIENT_NAME>`, so your main calendar shows *when* you're busy but not *what* the meeting is.
3. **Updates** the synced block if the original meeting's start/end time changes.
4. **Deletes** synced blocks whose original meetings no longer exist.

Each synced event carries a hidden tag in its description (`SYNC_ID_DIRECT:<event id>`) so the script can match, update, and clean up its own events without touching anything else on your main calendar.

Notes:
- **All-day events are skipped** — only timed meetings are synced.
- Reminders are removed from created blocks (`removeAllReminders()`).
- The script only manages events it created; other events on your main calendar are left untouched.

## Prerequisites

- Two Google calendars: your **client-owned** calendar (where the script runs) and your **main/consultancy** calendar (the sync target).
- Your main calendar must be **shared with your client-owned account** with **"Make changes to events"** permission — otherwise the script cannot create or edit blocks on it.

## Setup

1. Go to [script.google.com](https://script.google.com) while signed in to your **client-owned account** and create a new project.
2. Copy the contents of [`sync.gs`](./sync.gs) into the script editor.
3. Fill in the two configuration constants at the top of the file:

   | Constant | Description |
   |----------|-------------|
   | `TARGET_CAL_ID` | The email address / calendar ID of your **main** calendar (where busy blocks are written). |
   | `CLIENT_NAME` | The label used in the synced event title (`Client Meeting: <CLIENT_NAME>`). |

4. (Optional) Adjust `SYNC_DAYS_FORWARD` (default `14`) to change how far ahead the script syncs.
5. Save the project.

## Running

1. In the Apps Script editor, select the `syncClientToPersonal` function and click **Run**.
2. On first run, Google will prompt you to **authorize** access to your calendars. Approve the requested scopes.
3. Check **Executions** / the log (`View → Logs`) to confirm events were created, updated, or deleted.

## Automating

To keep the calendars in sync automatically, add a time-driven trigger:

1. In the Apps Script editor, open **Triggers** (the clock icon).
2. Click **Add Trigger**.
3. Configure:
   - **Function:** `syncClientToPersonal`
   - **Event source:** Time-driven
   - **Type:** e.g. Minutes timer → every 15 minutes, or an hourly timer.
4. Save.

## Configuration reference

| Constant | Default | Purpose |
|----------|---------|---------|
| `TARGET_CAL_ID` | `""` | Your main calendar's ID (where busy blocks are written). **Required.** |
| `CLIENT_NAME` | `""` | Name shown in the synced event title. **Required.** |
| `SYNC_DAYS_FORWARD` | `14` | Number of days ahead to sync. |
| `SYNC_ID_PREFIX` | `"SYNC_ID_DIRECT:"` | Internal tag used to identify synced events. Do not change once events exist. |

## Caveats

- One-way sync only (client calendar → main calendar). Changes made to synced blocks on your main calendar will be overwritten or removed on the next run.
- Matching relies on the `SYNC_ID_DIRECT:` tag in the event description — don't edit that line on synced events.
- The sync window is rolling and forward-only; past events are not synced.
