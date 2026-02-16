# Permission-based UI framework

Configuration-driven, extensible way to gate UI by persona/capability.

## At a glance: who sees what (project level)

| Gate       | Guest | Ext. Collaborator | Team Member | Project Lead | Client Owner | Org Owner |
|-----------|-------|-------------------|-------------|--------------|--------------|-----------|
| Files     | ✅    | ✅                | ✅          | ✅           | ✅           | ✅        |
| Members   | ❌    | ❌                | ✅          | ✅           | ✅           | ✅        |
| Shares    | ❌    | ❌                | ✅          | ✅           | ✅           | ✅        |
| Insights  | ❌    | ❌                | ✅          | ✅           | ✅           | ✅        |
| Sources   | ❌    | ❌                | ✅          | ✅           | ✅           | ✅        |
| Settings  | ❌    | ❌                | ❌          | ✅           | ✅           | ✅        |

Driven by capabilities: `project:can_view` (Files), `project:can_view_internal` (Members/Shares/Insights/Sources), `project:can_manage` (Settings).

## Concepts

- **Capability** – A boolean “can do X” derived from RBAC (e.g. `project:can_view`, `project:can_manage`). New capabilities go in `types.ts` and are resolved in `resolve.ts`.
- **Gate** – A UI element that is shown or hidden (e.g. a tab, sidebar link). Defined in `ui-gates.config.ts` with a list of required capabilities.
- **Resolution** – For a **user** (server): resolve capabilities from `UserSettingsPlus` + org/client/project context. For a **persona** (View As): resolve from RBAC persona grants. Then compute which gates are visible.

## Flow

1. **Config** (`ui-gates.config.ts`) – Add new gates and required capabilities.
2. **Capability keys** (`types.ts`) – Add new keys when you introduce new “kinds of access”.
3. **Resolution** (`resolve.ts`) – Implement resolution for new capabilities (user: call permission-helpers; persona: query RBAC or static set).
4. **UI** – Call `resolveProjectCapabilitiesForUser` or `resolveProjectCapabilitiesForPersona`, then `getVisibleGates(capabilities, 'project')` or `getGateVisibilityMap(capabilities)`, and show/hide from config.

## Extending

### New project tab or sidebar item

1. Add a gate in `ui-gates.config.ts`:

   ```ts
   { id: 'project.newtab', label: 'New Tab', scope: 'project', requiredCapabilities: ['project:can_view_internal'], tabValue: 'newtab' }
   ```

2. Add the tab in the UI (ProjectWorkspace / sidebar) and gate it with the same capability or by checking `visibleGates.has('project.newtab')` if you pass the set.

### New persona

- Persona grants live in RBAC (DB). For **View As**, `resolveProjectCapabilitiesForPersona` loads that persona’s grants and maps them to capabilities. If a new persona has existing grants (e.g. project can_view), no code change. If you add a new **kind** of access (e.g. “can_export”), add a capability key and resolve it from grants in `resolve.ts`.

### New capability

1. Add the key in `types.ts` (e.g. `'project:can_export'`).
2. In `resolve.ts`: set it in `resolveProjectCapabilitiesForUser` (using a new permission-helper or existing one) and in `resolveProjectCapabilitiesForPersona` (from RBAC or static set).
3. Use the capability in gate config as `requiredCapabilities: ['project:can_export']`.

## Files

- `types.ts` – Capability and gate types.
- `ui-gates.config.ts` – Declarative list of gates and required capabilities.
- `resolve.ts` – Resolve capabilities for user/persona; compute visible gates.
