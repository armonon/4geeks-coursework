# AgentHub Admin Panel — Product Specification

## 1. Product Description

AgentHub is a SaaS marketplace where companies rent pre-configured AI agents and equip them with skills such as web research, document analysis, and calendar management. This prototype is the internal admin panel used by AgentHub operations staff to monitor platform health, manage customers and agents, inspect rental contracts, maintain the skill catalog, and investigate execution errors.

The prototype is a reviewable frontend reference only. It uses realistic hardcoded data and does not connect to a backend.

## 2. Technology and Constraints

- Deliver a single `index.html` file.
- Use semantic HTML elements including `header`, `nav`, `main`, `section`, and `table`.
- Use Tailwind CSS through its CDN script for all styling.
- Do not use custom CSS files, `<style>` blocks, or inline `style` attributes.
- Use vanilla JavaScript only for interactivity; do not use frameworks, jQuery, package managers, or build tools.
- Use hardcoded data only; no API or backend is required.
- Support desktop and tablet viewports, with horizontal overflow available for wide tables.
- Use accessible labels, visible focus states, button elements for interactive controls, and appropriate dialog attributes.

## 3. Information Architecture and Shared Shell

- A persistent left sidebar displays the AgentHub mark and links to Dashboard, User Management, Agent Management, Skills, Agent Contracts, and Error Log.
- Selecting a sidebar item reveals the matching section in the main content area, updates the URL hash, and applies a clearly visible active state to exactly one navigation item.
- A persistent top bar displays the current section title, a compact environment indicator, and a light/dark theme toggle.
- The selected theme applies to the complete shell and every section using Tailwind `dark:` utilities. Theme state remains intact while switching sections and is stored in browser storage for return visits.
- Content uses a calm, professional operations-dashboard visual language: navy navigation, slate surfaces, blue primary actions, rounded cards, restrained shadows, and color-coded health states.

## 4. Section Specifications

### 4.1 Dashboard

1. Display four responsive metric cards for monthly revenue, discount losses, active agents, and failing agents. Every card includes an icon, label, hardcoded value, contextual comparison text, and a distinct accent color.
2. Lay the cards out in a four-column desktop grid and a two-column tablet grid. Cards use a subtle border and shadow and retain legible contrast in both themes.
3. Place a full-width Weekly Activity panel beneath the cards. It contains a hardcoded seven-day bar visualization, a legend, and an accessible text summary.
4. Add a compact Recent Activity list beside a Platform Health summary below the chart so the first view communicates both business activity and current operational status.

### 4.2 User Management

1. Display a responsive data table with at least five hardcoded users and columns for name/avatar, email, plan, status, join date, and actions.
2. Render plan and account state as compact badges with consistent semantic colors. Include a section summary showing total, active, and trial users.
3. Every user row includes a `⋮` action button that opens a menu containing “View detail” and “Delete.” Only one action menu can remain open; selecting the trigger again or clicking outside closes it.
4. “View detail” opens a modal with the complete user record, including contact details, billing plan, company, account state, join date, and current rented agents. The modal closes from its close buttons, backdrop click, or Escape key.

### 4.3 Agent Management

1. Display at least four agent cards showing agent name and avatar, owner, status badge, last run information, and a collapsed associated-skill list.
2. Each skill list is hidden by default. A labeled expand control reveals the skills by transitioning maximum height, opacity, and chevron orientation; selecting it again collapses the content.
3. Use consistent agents across sections: Nora Finance, Atlas Research, Calendar Concierge, and DealDesk Copilot also appear where relevant in contracts and errors.
4. Each agent has a `⋮` menu with “Configure” and “Delete.” “Configure” opens a modal containing the agent’s editable system prompt in a labeled `textarea`, with Cancel and Save changes actions.

### 4.4 Skills

1. Begin with an explanatory callout defining a skill as a reusable capability that can be enabled on one or more rented AI agents.
2. Display at least four skill cards with an icon, name, short description, category badge, enabled-agent count, and hardcoded usage indicator.
3. Each skill has a `⋮` action menu with “View detail” and “Delete,” following the shared menu behavior.
4. “View detail” opens a modal containing the skill’s description, category, permission scope, enabled agents, version, and last updated date.

### 4.5 Agent Contracts

1. Display a table with at least four active or completed rental contracts. Columns show contract identifier/client, agent, contracted skills, term dates, status, amount paid, and actions.
2. Skills appear as compact chips, dates use a consistent human-readable format, and currency values align for fast comparison.
3. Each contract row has a `⋮` menu containing “View detail.” Choosing it opens a modal with client, agent, term, status, base rental fee, itemized skill names and individual prices, discount if applicable, and total paid.
4. Contract totals and skill names must agree with the associated itemized modal breakdown.

### 4.6 Error Log

1. Display at least six hardcoded error entries with timestamp, agent name, severity/type badge, short description, resolution state, and actions.
2. Categorize errors with visually distinct badges for Critical, Integration, Timeout, Permission, and Validation states. Resolved entries are visually muted without losing readability.
3. Each error row has a `⋮` menu with “View detail” and “Mark as resolved.” Resolving an item updates its row badge and disables the resolve action for the current browser session.
4. “View detail” opens a modal containing error identifier, agent, timestamp, severity, request/context summary, and a readable full trace block.

## 5. Component Inventory

- **Application shell:** persistent sidebar, top bar, main content viewport.
- **Sidebar navigation item:** icon, label, active-state indicator, section target.
- **Metric card:** icon tile, label, value, supporting comparison.
- **Status badge:** reusable semantic pill for users, agents, contracts, and errors.
- **Action dropdown:** `⋮` trigger and contextual menu with shared open/close behavior.
- **Modal dialog:** backdrop, title, dynamic content area, close control, and optional footer actions.
- **Collapsible skill list:** expand button, animated content region, skill chips.
- **Data table:** responsive overflow wrapper, header, records, and action column.
- **Theme toggle:** labeled icon button that applies and stores light/dark state.
- **Toast notification:** transient feedback for save, delete, and resolve actions.
- **Empty/placeholder visualization:** hardcoded weekly bar chart and legend.

## 6. Data Consistency Rules

- Nora Finance belongs to Acme Labs and appears in Agent Management, Agent Contracts, and Error Log.
- Atlas Research belongs to Northstar Inc. and appears in Agent Management, Agent Contracts, and Error Log.
- Calendar Concierge and DealDesk Copilot use the same names and owners wherever referenced.
- Contract modal totals equal the visible amount paid after base fee, skill prices, and discount.
- Skill enabled counts correspond to the agent assignments shown in Agent Management.

## 7. Acceptance Criteria

1. The repository history shows `SPECS.md` committed before `index.html`.
2. All six sections are reachable from the persistent sidebar and exactly one navigation item has an active indicator.
3. Dashboard displays four complete metric cards and a full-width weekly activity visualization.
4. User Management contains at least five users with working action menus.
5. Agent Management contains at least four agents whose skill lists start collapsed and animate open and closed.
6. Skills contains at least four catalog entries plus an in-panel explanation of skills.
7. Agent Contracts contains at least four contracts and itemized detail modals whose totals are internally consistent.
8. Error Log contains at least six entries with color-coded types or severities.
9. Every list or table record includes a working action dropdown that toggles on trigger click and closes on outside click.
10. “View detail” or “Configure” opens a relevant modal in at least four different sections.
11. Every modal closes from a close button, backdrop click, and Escape key.
12. Agent configuration exposes an editable system prompt in a `textarea`.
13. “Mark as resolved” visibly updates an error entry without reloading the page.
14. The light/dark toggle changes the complete interface and remains selected when navigating between sections.
15. No custom CSS file, inline `style` attribute, framework, jQuery dependency, or build tool is used.
16. Names, skills, owners, financial values, and statuses remain consistent across related views.
17. Semantic HTML and accessible controls are used throughout.
18. The interface remains usable at desktop and tablet widths, including overflow handling for wide tables.
