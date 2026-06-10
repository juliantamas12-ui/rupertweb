# Island Survival — Audit Report
Generated: 2026-06-10

## Summary
- File: island.html (13,774 lines before fixes)
- Pre-audit headless test: PASS (renders, no JS errors)

---

## Priority A — Breaking / Silently Broken

### A1 — `resumeGame`, `saveAndQuit`, `setBrightness` NOT DEFINED (line 388–394)
- **What:** Pause menu has three interactive controls calling these functions, but none are defined anywhere in the file.
- **Effect:** Pressing ESC opens pause menu fine, but "Resume", "Save & Quit", and the brightness slider all silently fail (ReferenceError swallowed by event handler scope, no crash but no action).
- **Fix:** Define all three functions near the pause menu logic (script block 2).

### A2 — `drawWorldMap` defined but never called from render() (line 8150)
- **What:** The 'M' key handler at line 12399 toggles `state.showMap`. `drawWorldMap(ctx)` reads that flag and draws a full-screen map overlay. But it is never called.
- **Effect:** Pressing M does nothing visible. The map feature is completely dead.
- **Fix:** Add `drawWorldMap(ctx)` call at the end of render, outside the zoom ctx.restore().

### A3 — `drawGuide` defined but never called from render() (line 8067)
- **What:** A tutorial hint box that tells new players what to do next (collect wood → mine stone → craft axe, etc.). Defined, references `state.running`, but never called.
- **Effect:** New players get no guidance. The first 5 minutes are blind.
- **Fix:** Add `drawGuide(ctx)` call at the end of render, outside the zoom ctx.restore().

### A4 — Dead empty decorative loop in genObjects() (lines ~1147–1165)
- **What:** `genObjects()` has a second full pass over all 150×150=22,500 tiles with empty if/else blocks for BEACH, JUNGLE_LIGHT, JUNGLE_DARK. No objects are placed, no side effects.
- **Effect:** Pure waste — 22,500 loop iterations on every game start generating nothing.
- **Fix:** Remove the entire empty loop.

---

## Priority B — Code Quality / Bloat

### B1 — `if (false)` cloud block (line 8437)
- **Status:** INTENTIONAL — has explicit comment explaining it was the bug fixed today. The clouds are disabled for performance. Leave alone.

### B2 — `drawInteractableWaterfall` (line 1840) — dead in practice
- **What:** The waterfall object was commented out of genObjects (`// removed waterfall decor`). The draw function and `drawWaterfall` both exist and are routed correctly in the render switch, but no waterfall object is ever placed.
- **Status:** Leave — might be re-enabled later. Very low code cost.

### B3 — `drawSkullStake` (line 1779) — dead in practice
- **What:** Skull stake placement was commented out of genObjects. Function exists, render switch routes to it. No skulls are placed.
- **Status:** Same as B2 — leave. Could appear in legacy saves or be re-enabled.

### B4 — `drawJungleFloor` (line 2207) — reachable but never spawned
- **What:** `jungle_floor` type was removed from genObjects spawn ("jungle_floor removed entirely" comment), but the render switch case still handles it and calls this function.
- **Status:** Leave — harmless and 12 lines.

### B5 — Parallel SFX methods added after IIFE (lines 4872–5044)
- **What:** SFX.mine, SFX.splash, SFX.achievement, SFX.levelUp, SFX.bloodMoonRise, SFX.bloodMoonFade, SFX.lightningStrike, SFX.raidAlert, SFX.surgeCrash, SFX.surgeWarning, SFX.killStreak, SFX.frenzyActivate are monkey-patched onto the SFX object after the IIFE. Not a bug (SFX Proxy handles missing methods), but slightly inconsistent style.
- **Status:** Not broken. Leave.

### B6 — Dozens of draw functions (83 total)
- **What:** 83 `drawX` functions, most ~10–30 lines each. Some parameterisable (drawJungleTree, drawJungleTree2, drawJungleTree3 are nearly identical). But refactoring would risk subtle regressions.
- **Status:** Document but don't refactor. Too high risk for no gameplay gain.

---

## Priority C — Style / Minor

### C1 — `state.showMap` not in initial state declaration
- **What:** `state.showMap` is read in `drawWorldMap` but not initialised in the state object (line 444–700). Defaults to `undefined` which is falsy — harmless but inconsistent.
- **Fix:** Add `showMap: false` to initial state.

### C2 — `state.activeSlot` not in initial state declaration  
- **What:** Set lazily at `if (!state.activeSlot) state.activeSlot = 1`. Clean but inconsistent.
- **Status:** Not a bug, skip.

---

## Not an Issue

- `if (false) { clouds }` — intentional perf disable, has comment
- `getCtx` defined 3 times — each in a separate IIFE closure (SFX, AMBIENT, DRUMS)
- `update` defined 2 times — same reason (AMBIENT, DRUMS closures)
- SFX missing methods — protected by Proxy at line 12345
- `_logError` / `window._logError` — defined before first use (line 420, first usage is line 421+ in catch blocks)

---

## Fix Plan

1. Add `resumeGame`, `saveAndQuit`, `setBrightness` (A1)
2. Wire `drawWorldMap` and `drawGuide` into render (A2, A3)
3. Remove dead decorative loop (A4)
4. Add `showMap: false` to initial state (C1)
5. Test with chrome2.js
6. Commit and deploy
