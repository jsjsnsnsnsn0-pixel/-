# UI preview navigation regression fix

Before: while an active room was minimized, tapping the Home, Messages or Profile bottom tab cleared `activeSubScreen` but kept `activeRoom`, which caused full room view to reappear. Now the preview provider keeps the chosen tab as its sub-screen when a room is retained. Bottom nav shows an active state for these minimized tab variants. Returning to the full room is explicit via the mini-player; leaving it is explicit via its exit button.

This is a **UI-only preview behavior**. No background audio playback is claimed.
