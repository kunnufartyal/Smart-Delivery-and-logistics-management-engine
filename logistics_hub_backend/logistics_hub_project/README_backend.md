# Delivery & Logistics Hub - BACKEND (C++)

## Files by team member
| Member | Backend files |
| --- | --- |
| Ashutosh | `Parcel.h` (Parcel + Strategy pattern), `Hub.h` (RAII owner), `Trie.h`, `Json.h`, `HubManager.h`, `HttpServer.h`, `main.cpp` |
| Prachi | `MinHeap.h` (dispatch priority), `HashTable.h` (tracking IDs) |
| Vikalp | `Containers.h` (circular queue = conveyor belt, stack = van) |
| Swastika | `Route.h` (doubly linked list = driver route) |

## Build and run
Needs only a C++17 compiler (g++, GCC 8 or newer). Run these from this folder.

Linux / macOS:
    make
    ./hub

Windows (MinGW, PowerShell):
    g++ -std=c++17 -Iashutosh -Iprachi -Ivikalp -Iswastika ashutosh/main.cpp -o hub.exe -lws2_32
    .\hub.exe

If your g++ is old and complains about C++17, check `g++ --version`, or change `-std=c++17` to `-std=c++14`; the code builds with both.

`hub 4000` picks another port (default 3000).

## Backend alone
The server works on its own: it answers `POST /api/<name>` with JSON (see the table below).

## With the frontend
Extract `logistics_hub_frontend.zip` into the SAME folder (the member folders merge), then run the server and open
http://localhost:3000 . The server serves the .html, .css and .js files from this folder.

| Endpoint | Body | Returns | Data structure used |
| --- | --- | --- | --- |
| /api/suggest | prefix | list of pin and name | Trie |
| /api/quote | service, weight, distance | cost | Strategy pattern |
| /api/register | pincode, service, weight, distance | parcel | Hash table + min-heap |
| /api/track | id | parcel | Hash table |
| /api/dispatch | none | parcel | Min-heap + circular queue |
| /api/loadVan | none | count, top | Circular queue + stack (re-stacked by priority, so the most urgent unloads first) |
| /api/deliver | none | id | Stack |
| /api/cancelStop | name | name | Doubly linked list (O(1) unlink) |
| /api/state | none | parcels, belt, van, route | all |

## Notes
- The web server is written by hand on sockets, so the project has zero external libraries.
- It listens on localhost only and serves only .html, .css and .js files.
- 21 hub zones (Dehradun district areas plus Rishikesh, Haridwar, Mussoorie) are listed in `HubManager.h`. Each pincode maps to one named zone. Check pincodes against India Post before final submission.
- Parcel status is a simple enum for now; the State pattern replaces it in the 40% phase.
