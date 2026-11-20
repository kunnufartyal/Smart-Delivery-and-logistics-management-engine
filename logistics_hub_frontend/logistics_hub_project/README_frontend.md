# Delivery & Logistics Hub - FRONTEND (HTML / CSS / JS)

Plain files, no framework, no build step.

## Files by team member
| Member | Frontend files | What it does |
| --- | --- | --- |
| Ashutosh | `index.html`, `api.js`, `app.js` | Page layout; `api.js` is the single door to the backend (plus the mock data); `app.js` starts everything and draws the overview |
| Prachi | `track.js` | Track panel and the Parcels table |
| Vikalp | `belt.js` | Conveyor belt, van, Dispatch / Load van / Deliver buttons |
| Swastika | `register.js`, `route.js`, `style.css` | Register form with Trie suggestions, Route panel, the 5-colour palette |

## Run it without the backend (mock mode)
Double-click `ashutosh/index.html`. Opened as a file, it uses fake data built into `api.js`, so everything works with no server.

## Run it with the backend
1. Extract `logistics_hub_backend.zip` into the SAME folder as this one (the member folders merge).
2. Build and start the C++ server as described in `README_backend.md`.
3. Open http://localhost:3000 . The page detects the server and uses the real API.

## Rules of thumb
- These files only send requests and draw the replies. All the data structures run in C++.
- The copy icon next to tracking IDs lives in `api.js` (`copyBtn`, `idWithCopy`) and is styled in `style.css`.
