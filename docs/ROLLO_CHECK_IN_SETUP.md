# Rollo check-in printing and laptop handoff

## What the app implements

After successful check-in or walk-in creation, the app stays on a saved confirmation with Print Label and Next Athlete. Reopening a checked-in athlete shows the same controls; Edit check-in allows changes before saving a replacement label. Printing never saves an athlete, creates an athlete, or changes check-in status. Only a successful saved check-in enables the label flow.

Print Label prints one portrait 4 × 6-inch label: large four-digit tryout number, preferred position exactly as recorded, then name. It uses black text on white, 0.25-inch internal padding, no site navigation or photo. The normal browser dialog remains available without the dedicated shortcut. Cancelling printing leaves check-in saved. The app cannot detect paper, jams, printer selection, cancellation or physical completion; “Print requested” is not a delivery confirmation. Reprinting is always possible.

No database migration, print service, new dependency or printer credential is required. Vercel hosts the app; the Windows laptop sends the print job through its installed printer. Do not put a printer's local IP address or Windows login into Vercel.

## Make the project available on the Windows laptop

Sign in to GitHub with the account that can access `revenant-73/CourtSense`. Clone it with Git or the GitHub Desktop application, then open the folder as a project in Codex:

```powershell
git clone https://github.com/revenant-73/CourtSense.git
Set-Location CourtSense
git switch codex/tryout-label-printing
```

If the project is already cloned, fetch first and switch to that branch. Once merged, use main instead. Printing against the hosted app does not require Node, npm, a local server, or a copy of production database secrets. The feature must be deployed before the production URL has the new buttons. Do not seed or migrate production while setting up a printer.

## Configure the actual check-in laptop

1. Connect the Windows laptop and Rollo to the same Wi-Fi network. Install the official Rollo Windows driver and add the wireless printer. Print Rollo's sample label first. If venue Wi-Fi isolates devices, use a staff network that allows printer discovery or the supplied USB cable.
2. Load actual 4 × 6-inch direct thermal labels. Set the Rollo Windows printing preferences to 4 × 6 inches, portrait. Disable “Let Windows manage my default printer” if using Rollo as the default for this laptop, or retain another default and explicitly select Rollo in the dedicated browser profile. Do not change default printers on unrelated workstations.
3. Install Chrome if needed. From the cloned project, run the reviewed shortcut script:

   ```powershell
   powershell -NoProfile -File .\scripts\setup-check-in-shortcuts.ps1
   ```

   The script only creates CourtSense Setup and CourtSense Check-in desktop shortcuts. Both use their own Chrome data directory under `%LOCALAPPDATA%\CourtSense\CheckInChrome`. It does not launch software, change Windows printer settings, or alter your normal Chrome profile. If execution policy blocks it, have Codex inspect the script and create the equivalent shortcuts manually; no machine-wide execution-policy change is required.

4. Open **CourtSense Setup**, sign in with the staff account, and use a checked-in test athlete. Click Print Label. Select **Rollo**, **4 × 6-inch paper**, **portrait**, **one copy**, **100% scale**, **no margins**, and **headers/footers off**. Print and check the physical label. Chrome's available paper options depend on the installed driver.
5. Close every window opened by CourtSense Setup. Open **CourtSense Check-in**. Its `--kiosk-printing` flag automatically accepts print preview using the profile's current print settings. The flag only takes effect when a new Chrome process starts for this profile; a window already running in setup mode will prevent it taking effect.
6. Click Print Label once on the same test athlete. Confirm one label comes out without another confirmation. Repeat after closing/reopening the shortcut and after a laptop restart. Always verify the selected destination after driver updates or printer changes; the app cannot enforce a printer destination.

Use the dedicated profile only for CourtSense. Silent printing applies to any page opened in that profile. Keep normal browsing in your regular browser. Do not add certificate bypasses, disable web security, or expose a local print server.

## Acceptance checklist on the laptop

- Existing checked-in athlete: one click prints one label, with the saved number, position and name.
- Newly checked-in athlete and walk-in: the label controls appear only after saving succeeds.
- Duplicate number or failed save: no print controls for the attempted unsaved record.
- Long name: all text fits on one physical label; number is readable across a court.
- Reprint: prints the same saved data without duplicate roster entries.
- Edited number: save first, then replacement label uses the new saved number.
- Printer off / Wi-Fi interruption: check-in remains saved; restore connectivity and inspect the Windows queue before reprinting to avoid duplicate queued labels.
- Normal Setup shortcut: cancelling the print dialog keeps check-in saved.
- Next Athlete returns to the correct event list.

Use disposable test athletes for changes. Do not reset staff passwords or alter real registrations for printer testing.

## Prompt to continue in Codex on the laptop

> Open docs/ROLLO_CHECK_IN_SETUP.md and inspect the current Git branch and deployment. Continue the Windows Rollo 4 × 6 check-in setup. First verify the printer is installed and can print a sample. Inspect scripts/setup-check-in-shortcuts.ps1, create the dedicated Chrome shortcuts, configure printing with a disposable checked-in test athlete, then verify one click prints one physical label and survives a restart. Keep production data and the normal browser profile intact. Do not claim physical printing works until I confirm the printed label. If this feature is not deployed yet, complete local validation and ask me to authorize deployment.

## Verification before laptop setup

All 14 existing regression tests passed, TypeScript and production build passed, and lint reported zero errors with the six existing image warnings. The shortcut script passed PowerShell parsing and a temporary-folder execution check; both shortcut targets and arguments were inspected, without launching Chrome or changing desktop shortcuts.

Chromium checked the actual component's print CSS with normal, long and unbroken names: 384 × 576 CSS pixels (4 × 6 inches), no overflowing label content, hidden site controls, exactly one PDF page with a 288 × 432-point MediaBox. See [layout preview](qa/2026-10-05-label/layout-preview.png) and [sample PDF](qa/2026-10-05-label/sample-label.pdf). These contain synthetic data. This is layout validation, not a physical print or a full check-in interaction test.

Full browser checks are prepared for saved/reopened check-in, duplicate-number rejection, printing/reprinting, failed print request, walk-in, mobile layout, and Next Athlete. The command policy blocked starting the isolated server on port 3107; those interaction checks require a manual server start and are not yet claimed as passing. The Rollo driver, saved printer destination, silent printing and physical label remain to be verified on the actual laptop.

## References

- [Rollo wireless setup](https://www.rollo.com/wireless/)
- [Rollo wireless printer and supported label sizes](https://www.rollo.com/product/rollo-wireless-printer/)
- [Chromium description of kiosk printing](https://issues.chromium.org/issues/494764371)
- [Browser print dialog behavior](https://developer.mozilla.org/en-US/docs/Web/API/Window/print)
