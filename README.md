# Smart Delivery & Logistics Management Engine

A B.Tech CSE group project that models the journey of an e-commerce parcel, from the moment an order is placed to the doorstep, and uses a different data structure for each stage. The back end is **C++17** with **zero external libraries** (even the web server is hand-written on sockets). The front end is plain **HTML, CSS and JavaScript** with no framework and no build step.

> Status: **Phase 2 (about 40% milestone).** The core data structures, the Strategy pattern, the web server and the dashboard work end to end. See the [Roadmap](#roadmap) for what is still planned.

---

## Features

- **Register a parcel** with pincode / place auto-complete and a live price estimate
- **Two services:** Standard Ground and Prime Express, priced by the Strategy pattern
- **Priority dispatch:** Express parcels leave the hub before Standard ones; ties go to the earlier parcel
- **Conveyor belt** (circular queue) and **van** (stack), with the van re-stacked by priority so the most urgent parcel is delivered first
- **Track a parcel** by its 12-digit ID in O(1) average time, with a copy icon next to every ID
- **Driver route** (doubly linked list) with O(1) stop cancellation
- **Mock mode:** open the page as a file and the whole dashboard runs on fake data, with no server

---

## How the parcel journey maps to data structures

| Stage | What happens | Data structure | Owner | Cost |
| --- | --- | --- | --- | --- |
| Destination check | Pincode or place name is validated and auto-completed | **Trie** | Ashutosh | O(L) |
| Tracking | Tracking ID finds the parcel | **Hash table** (chaining, djb2, 101 buckets) | Prachi | O(1) average |
| Dispatch order | Most urgent parcel leaves first | **Min-heap** | Prachi | O(log n) |
| Conveyor belt | Parcels leave in order | **Circular queue** | Vikalp | O(1) |
| Van loading | Last loaded is delivered first | **Stack** | Vikalp | O(1) |
| Driver route | Stops can be added and removed | **Doubly linked list** | Swastika | O(1) unlink |
| Stop lookup | Stop name to its list node | `std::map` | Ashutosh | O(log n) |
| Van ordering | Re-stack by priority on every load | `std::sort` | Ashutosh | O(n log n) |

### OOP concepts used
- **Strategy pattern:** `ShippingStrategy` with `StandardRate` and `ExpressSurgeRate`
- **Polymorphism:** a virtual `calcCost` runs the right formula at runtime
- **Encapsulation:** private data, validation by exceptions
- **RAII and smart pointers:** `Hub` owns every parcel through `unique_ptr`; sockets are closed by an RAII `Connection`
- **Templates:** `CircularQueue<T, N>` and `Stack<T, N>`
- **Rule of Three:** copying deleted on `HashTable`, `Route`, `Parcel` and `HubManager`

---

## Pricing

| Service | Base | Per kg | Per km | Priority |
| --- | --- | --- | --- | --- |
| Standard Ground | Rs 40 | Rs 10 | Rs 1.5 | 2 |
| Prime Express | Rs 100 | Rs 22 | Rs 3.5 | 1 (more urgent) |

`cost = base + weight x per_kg + distance x per_km`

---

## Project structure

Each member's files are in their own folder (back end `.h` / `.cpp` and front end `.js` / `.html` / `.css` together).

```
.
├── Makefile
├── README.md
├── ashutosh/      Parcel.h, Hub.h, Trie.h, Json.h, HubManager.h, HttpServer.h, main.cpp,
│                  index.html, api.js, app.js
├── prachi/        MinHeap.h, HashTable.h, track.js
├── vikalp/        Containers.h, belt.js
└── swastika/      Route.h, register.js, route.js, style.css
```

---

## Getting started

**Requirements:** a C++17 compiler (GCC / g++ 8 or newer) and any modern browser. Nothing else to install.

### Windows (PowerShell, MinGW)
```bash
g++ -std=c++17 -Iashutosh -Iprachi -Ivikalp -Iswastika ashutosh/main.cpp -o hub.exe -lws2_32
```
```bash
.\hub.exe
```

### Linux / macOS
```bash
make
```
```bash
./hub
```

Then open **http://localhost:3000** in your browser. Use `.\hub.exe 4000` (or `./hub 4000`) to pick another port.

Run the program from the repository root, so the server can find the web files.

If your compiler is older and rejects `-std=c++17`, try `-std=c++14`; the code builds with both.

### Mock mode (no server)
Double-click `ashutosh/index.html`. When the page is opened as a file, `api.js` uses built-in sample data, so every panel works without the C++ server.

---

## How the front end talks to the back end

```
Browser (JS)  ──  POST /api/<name> + JSON  ──►  HttpServer.h  ──►  HubManager.h  ──►  data structures
     ▲                                                                                      │
     └────────────────────────────  JSON reply  ◄───────────────────────────────────────────┘
```

| Endpoint | Body | Returns | Uses |
| --- | --- | --- | --- |
| `/api/suggest` | `prefix` | matching pincodes and places | Trie |
| `/api/quote` | `service`, `weight`, `distance` | cost | Strategy |
| `/api/register` | `pincode`, `service`, `weight`, `distance` | parcel | Trie, hash table, min-heap, route |
| `/api/track` | `id` | parcel | Hash table |
| `/api/dispatch` | none | parcel | Min-heap, circular queue |
| `/api/loadVan` | none | count, top parcel | Circular queue, stack, sort |
| `/api/deliver` | none | parcel id | Stack |
| `/api/cancelStop` | `name` | stop name | Doubly linked list |
| `/api/state` | none | parcels, belt, van, route | all |

Errors come back as JSON `{"error": "..."}` with status **400** (bad input) or **404** (unknown endpoint).

**Server notes**
- Written on raw sockets (Winsock on Windows, POSIX sockets elsewhere), with no framework
- Listens on **localhost only**, handles one request at a time
- Serves only `.html`, `.css` and `.js` files, blocks `..` path tricks, and accepts only `POST` on `/api/`

---

## Hub zones

21 zones across Dehradun district and nearby towns, one named zone per pincode: Clock Tower (248001), Clement Town (248002), Dehradun Cantt (248003), IIP Dehradun (248005), Bidholi (248007), Barasi (248008), Rajpur Road (248009), Doon University (248012), Kandoli (248013), Ajabpur (248121), Barlowganj (248122), Chakrata (248123), Dakpathar (248125), Doiwala (248140), Herbertpur (248142), Bhogpur (248143), Kalsi (248158), Mussoorie (248179), Tuini (248199), Rishikesh (249201) and Haridwar (249401).

Parcels get 12-digit tracking IDs starting at `100000000101`.

---

## Team

| Member | Role | Back end | Front end |
| --- | --- | --- | --- |
| **Ashutosh** | Technical Lead (architecture, RAII) | `Parcel.h`, `Hub.h`, `Trie.h`, `Json.h`, `HubManager.h`, `HttpServer.h`, `main.cpp` | `index.html`, `api.js`, `app.js` |
| **Prachi** | DSA Lead (data core) | `MinHeap.h`, `HashTable.h` | `track.js` |
| **Vikalp** | DSA Contributor (queues and stacks) | `Containers.h` | `belt.js` |
| **Swastika** | DSA Contributor (route, interface) | `Route.h` | `register.js`, `route.js`, `style.css` |

---

## Limitations

- Pincode is the only address: there is no street, landmark or phone number, so the project models the journey up to the destination zone, not the doorstep
- One named zone per pincode (real areas often share a pincode)
- Fixed capacities: belt 5, van 5, dispatch queue 64 waiting parcels
- Parcel status is a simple enum, and data lives in memory only (it resets when the server restarts)
- Pincodes should be checked against India Post before final submission

---

## Roadmap

- [ ] **Deque** (`LoadingBayDock`) for the loading bay
- [ ] **State pattern** (`OrderPlaced`, `InTransit`, `OutForDelivery`, `Delivered`) to replace the status enum
- [ ] **Command pattern** for dispatch and reroute, with undo
- [ ] **`FragileHeavyRate`** as a third pricing strategy
- [ ] **CSV persistence** (`manifest_log.csv`) saved and loaded by the RAII `HubManager`
- [ ] Generic (templated) `MinHeap`
- [ ] Full delivery address, landmark, phone number and a delivery OTP
- [ ] Route planning as a weighted graph with shortest-path search

---

## License

Academic project. Add a license of your choice before making the repository public.
