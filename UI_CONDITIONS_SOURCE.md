# UI Conditions Data Source

This document explains where the Auditor application gets the data to display the checklist conditions for each WCAG Success Criterion (e.g., 1.1.1, 1.2.1).

## 1. Condition Text (The Valid Checklist)
**File:** `Auditor/src/data/checks.json`

This JSON file is the **primary source** for the text displayed in the UI.
*   **How it works:** The frontend component `CheckCard.jsx` imports this file. It looks up the conditions listed under `Total conditions` for the selected Success Criterion and renders them as a list.
*   **Why:** This allows the UI to render the checklist immediately without waiting for a backend response for the structure.

## 2. Condition Status (Pass/Fail/N/A)
**Source:** PostgreSQL Database (Table: `page_sc_results`)

While the text comes from the JSON file, the **status** of each item is stored in the database.
*   **How it works:** When you load an audit, the backend returns the saved results. The frontend matches the text from `checks.json` against the saved results to show the green checkmarks or red crosses.

## 3. The Backend Source of Truth
**File:** `WCAG-Compliance-Check/db/seed_data.sql`

This SQL file populates the `reference_sc_conditions` table in the database.
*   **Role:** The backend uses this to know what conditions exist for automated synchronization (mapping automated scan results to manual conditions).

### Important: Synchronization Required
Because we have **two copies** of the condition text (one in `checks.json` for Frontend, one in `seed_data.sql` for Backend), they **must be identical**.

If you change the text in `seed_data.sql` (e.g., merging a Note into the main sentence), you **must also update `checks.json`** to match exactly. If they don't match:
1.  The UI will display the old text.
2.  The UI will not be able to find the status of that check (because the keys won't match), and it will appear as "Pending" or unchecked.
