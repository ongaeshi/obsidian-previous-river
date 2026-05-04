# Optimization of Searching for the Last Note in Previous River

## Purpose

There was a problem where executing search processes like `findLastNote()` on a group of notes with a deep link hierarchy (e.g., depth 10,000) would block (freeze) the application for a long time. This algorithm reduces the computational complexity from $O(V \times D)$ to $O(E + D)$ and optimizes the search process ($V$: total number of notes, $E$: total number of edges, $D$: search depth).

## Terminology

- **Forward Cache**: The normal access method, reading a note's own properties (frontmatter).
- **Reverse Cache**: An associative array (map) that pre-builds all references from destination (parent) to source (child) at once.

## Design Philosophy

To eliminate the bottleneck of the search process, the following methods were evaluated, and the final architecture was decided.

| Consideration | Adopted Idea | Rejected Idea | Reason |
|---|---|---|---|
| Getting next notes | Batch pre-building of cache (`buildReverseCache`) | Scanning all files every loop (`Object.entries`) | Because scanning all files using `Object.entries` causes Garbage Collection (GC) overhead from array creation and has a computational complexity of $O(V \times D)$. |
| Getting backlinks | Iterating `app.metadataCache.resolvedLinks` with `for...in` | Using `app.metadataCache.getBacklinksForFile()` | Because the unofficial API `getBacklinksForFile()` dynamically creates `ReferenceCache` objects internally, which caused significant memory allocation overhead. |
| Cache lifecycle | Build and discard each time a command is executed | Resident cache (always synced via event listeners) | Resident caches are a hotbed for "cache rot". Furthermore, on mobile environments, there were concerns about battery consumption due to resident processes. |
| Failsafe | Not implemented (rendered unnecessary by reducing complexity) | Timeout process after a certain time (5-10 seconds) | Because lookups became $O(1)$ and the search process is now completed in milliseconds, timeout processing is no longer necessary. |

## Implementation

`buildReverseCache()` is executed exactly once at the beginning of `findLastNote()` and similar functions that initiate a command. This builds a complete reverse lookup map in $O(E)$ time from all link information ($E$) and optimizes subsequent search processes.

### Building Reverse Cache (`buildReverseCache`)

It quickly iterates over `app.metadataCache.resolvedLinks` using a `for...in` syntax to create a reverse lookup map while minimizing memory allocation.

```typescript
export function buildReverseCache(app: App): Record<string, string[]> {
  const resolvedLinks = app.metadataCache.resolvedLinks;
  const cache: Record<string, string[]> = {};

  for (const sourcePath in resolvedLinks) {
    if (!Object.prototype.hasOwnProperty.call(resolvedLinks, sourcePath)) continue;

    const targets = resolvedLinks[sourcePath];
    for (const targetPath in targets) {
      if (!Object.prototype.hasOwnProperty.call(targets, targetPath)) continue;

      if (!cache[targetPath]) cache[targetPath] = [];
      cache[targetPath].push(sourcePath);
    }
  }
  return cache;
}
```

### Searching for the Last Note (`findLastNote`)

It rapidly searches for the end of a chain using the built reverse lookup map (`reverseCache`). Because each subsequent note search (`getNextNotesWithCache`) is processed in $O(1)$, the computational complexity of the entire loop is kept to $O(D)$.

```typescript
export async function findLastNote(app: App, startNote: TFile, placeholder: string = "Select the next branch..."): Promise<TFile | null> {
  const reverseCache = buildReverseCache(app);
  let lastNote = startNote;

  while (true) {
    const nextNotes = getNextNotesWithCache(app, lastNote, reverseCache);
    if (nextNotes.length === 0 || nextNotes.includes(startNote)) {
      break;
    }

    if (nextNotes.length === 1) {
      // If there is 1 candidate, proceed
      lastNote = nextNotes[0];
    } else {
      // If there are branches, display suggest UI
      const selectedNote = await new Promise<TFile | null>((resolve) => {
        new NextNoteSuggestModal(app, nextNotes, resolve, placeholder).open();
      });

      if (!selectedNote) return null;
      lastNote = selectedNote;
    }
  }
  return lastNote;
}
```

## Use Cases

Applied to processes that identify the end of deep link hierarchies in Vaults containing tens of thousands of notes.

### Identifying the end of long thought chains

Improves performance when identifying the end note in a chain where thousands to tens of thousands of notes are connected.
While a cache building time of about 10-50 milliseconds occurs at runtime, subsequent node searches are processed in perfect $O(1)$ time, which prevents UI freezing (blocking).

### Resource optimization in mobile environments

Minimizes memory consumption in resource-constrained environments like mobile environments (iOS / Android).
The object for the cache is built only when the command is executed and is immediately collected by GC (Garbage Collection) after the process is completed, so it does not pressure resident memory.

## Commit Logs

Relevant key commit history is presented below.

- [`83d28c8`](https://github.com/ongaeshi/previous-river/commit/83d28c8) feat: Remove timeout
- [`6cee7ba`](https://github.com/ongaeshi/previous-river/commit/6cee7ba) perf: Build O(1) reverse cache in findLastNote to eliminate O(V*D) overhead
- [`02999b5`](https://github.com/ongaeshi/previous-river/commit/02999b5) perf: getNextNotes via detailed backlink properties
- [`c68596d`](https://github.com/ongaeshi/previous-river/commit/c68596d) perf: Optimize backlink iteration in getNextNotes
- [`21adb7d`](https://github.com/ongaeshi/previous-river/commit/21adb7d) feat: Add timeout to findLastNote search
- [`6e8e72b`](https://github.com/ongaeshi/previous-river/commit/6e8e72b) refactor: findLastNote utility function into a `lib/obsidian.ts` module.
- [`c6dd657`](https://github.com/ongaeshi/previous-river/commit/c6dd657) refactor: Extranct getNextNotes() function

---
[⬅️ (previous) 001_chain_algorithm](001_chain_algorithm.md) | [003_canvas_export  (next) ➡️](003_canvas_export.md)
