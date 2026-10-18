# Excalidraw Engine Capability Audit (§6, §16 Phase 3)

**Engine Version Pinned:** `@excalidraw/excalidraw@0.18.1`  
**License:** MIT  
**Date:** Phase 3 Migration Check  

---

## 1. Element Model & Custom Data Persistence

### Element Types
Excalidraw represents canvas elements via union types extending `ExcalidrawElement`:
- `rectangle`
- `diamond`
- `ellipse`
- `arrow`
- `line`
- `text`
- `frame`
- `magicframe`
- `freedraw`
- `image`

### Custom Data Persistence (`customData`)
Excalidraw provides a first-class `customData?: Record<string, any>` field on every `ExcalidrawElement`.
- **Persistence Verification:** `customData` is fully preserved in Excalidraw's scene data, serialization routines, and undo/redo stacks.
- **MarkDraw Binding:** We store semantic metadata in `element.customData.markdraw` typed as `MarkDrawMeta` at the domain layer and `unknown` at the generic port layer.
- **Independence:** MarkDraw never saves raw `.excalidraw` scenes to disk. Saved documents use our vendor-neutral `StoredDocument` format (`CanvasShape[]`). Excalidraw scenes are deterministically reconstructed at document load time.

---

## 2. Spatial Hierarchy: Frames & Groups

### Frames
Excalidraw provides native `frame` elements:
- An element placed inside a frame has `frameId: string | null` set to the frame's `id`.
- The frame element tracks child elements in `frame.boundElements`.
- **Mapping:** `element.frameId` maps 1:1 to `CanvasShape.parentId`.
- A frame shape maps to `kind: 'frame'`, serving as the root container for compiler parent-child bounding box resolution.

### Groups
Unlike tldraw which had explicit group container shapes, Excalidraw handles grouping via element metadata:
- Grouped elements carry group IDs in `element.groupIds: string[]`.
- There is no separate "group entity" shape in the element array.
- **Virtual Group IDs:** In accordance with §6:
  - When grouping shapes, the driver assigns a common UUID to `groupIds`.
  - For grouped members, `CanvasShape.parentId` is assigned the virtual identifier `virtual:<groupId>`.
  - The IR parent-resolution and shape mapping accepts this virtual format cleanly without corrupting geometry.

---

## 3. Arrows & Connectors

- Excalidraw arrows (`type: 'arrow'`) support bindings:
  - `startBinding: { elementId: string, focus: number, gap: number } | null`
  - `endBinding: { elementId: string, focus: number, gap: number } | null`
- **Mapping:**
  - `startBinding?.elementId` -> `arrowEndpoints.start.shapeId`
  - `endBinding?.elementId` -> `arrowEndpoints.end.shapeId`
  - Position coordinates (`startBinding.focus`, etc.) determine exact terminal placement.

---

## 4. Scene Mutation & Event Subscription

### Mutation Semantics
- Excalidraw does not have a single-element mutation method (e.g. `updateShape(id, props)`).
- All canvas updates occur atomically through `excalidrawAPI.updateScene({ elements: [...] })`.
- Wireframe scale for MarkDraw documents is typically < 500 shapes, making atomic updates instantaneous and deterministically free of race conditions.

### Change Detection
- `excalidrawAPI.onChange((elements, state) => { ... })` emits after any modification.
- The `ExcalidrawDriver` maintains a reference to the last-seen neutral scene and computes a diff, firing `driver.onShapesChanged` with specific `created`, `updated`, and `deleted` arrays.

---

## 5. Honest Gap Analysis & Mitigations

1. **Native Frame Rotation:**
   - Excalidraw does not permit arbitrary rotation angles on `frame` elements.
   - *Mitigation:* Wireframe layouts and UI components are axis-aligned; rotation on root frames is neither expected nor required. Any non-zero frame angle will emit a lint warning rather than silent distortion.
2. **Text-in-Shape Binding:**
   - Excalidraw attaches text to containers via `boundElements: [{ type: 'text', id: ... }]` and `containerId` on the text element.
   - *Mitigation:* The driver maps text inside containers to `CanvasShape.text`, matching MarkDraw's unified shape model.
3. **Z-Order Indexing:**
   - Z-order in Excalidraw is strictly the array order of `elements`.
   - *Mitigation:* `CanvasShape.index` is mapped directly to fractional array rank `idx / elements.length` or lexical strings (`a0`, `a1`...).
4. **Theme / Dark Mode:**
   - Excalidraw supports `theme="light" | "dark"`.
   - Controlled via the React wrapper to sync with MarkDraw's `data-theme` attribute.
