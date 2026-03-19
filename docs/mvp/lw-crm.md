# Lightweight CRM – Feature Specification
Target Users: Consultants, Fractional Leaders, Agencies, Boutique Firms, Advisors

Goal:
Provide a lightweight CRM focused on client relationships, engagements, and delivery,
not a traditional sales-heavy CRM.

This CRM should feel like:
Client Workspace + Engagement Tracker + Notes + Contacts + Follow-ups

NOT like:
Salesforce / HubSpot full CRM / enterprise pipeline tool

------------------------------------------------------------
1. Core Concepts
------------------------------------------------------------

Firm
Client
Engagement
Contact
Note
Task
File / Artifact
Prospect (optional pipeline)
Tag / Label

Hierarchy:

Firm
 ├─ Clients
 │    ├─ Engagements
 │    │    ├─ Notes
 │    │    ├─ Tasks
 │    │    ├─ Files
 │    │    └─ Contacts (optional link)
 │    └─ Contacts
 └─ Prospects


------------------------------------------------------------
2. Clients
------------------------------------------------------------

Purpose:
Directory of companies the firm works with or may work with.

Fields:

- name
- status
    - prospect
    - active
    - on_hold
    - past
- industry
- website
- description / notes
- tags
- owner (firm member)
- created_at
- updated_at

Relationships:

- has many engagements
- has many contacts
- has many notes
- has many tasks
- has many files


Features:

- list view
- search
- filter by status
- filter by tag
- filter by owner
- client detail page


------------------------------------------------------------
3. Engagements
------------------------------------------------------------

Purpose:
Track specific work assignments per client.

Examples:

Marketing Strategy Q1
Fundraising Advisory
Product Launch Support
Interim CTO Assignment

Fields:

- name
- client_id
- status
    - planned
    - active
    - completed
    - paused
- start_date
- end_date
- description
- contract_type (optional)
- rate / value (optional)
- tags
- created_at
- updated_at

Relationships:

- belongs to client
- has many notes
- has many tasks
- has many files
- has many contacts (optional)

Features:

- engagement list per client
- engagement detail page
- status filter
- date filter


------------------------------------------------------------
4. Contacts / Stakeholders
------------------------------------------------------------

Purpose:
Store people related to clients.

Fields:

- name
- title / role
- email
- phone
- client_id
- engagement_id (optional)
- notes
- tags
- created_at
- updated_at

Relationships:

- belongs to client
- optionally linked to engagement

Features:

- contact list per client
- search contacts
- quick add contact
- link to engagement


------------------------------------------------------------
5. Notes / Activity Log
------------------------------------------------------------

Purpose:
Capture all interaction notes.

Examples:

Call notes
Meeting summary
Ideas
Decisions
Follow-ups
Strategy notes

Fields:

- title
- content (rich text / markdown)
- client_id
- engagement_id (optional)
- contact_id (optional)
- tags
- created_by
- created_at
- updated_at

Features:

- notes per client
- notes per engagement
- global search
- tag filter
- timeline view (optional)


------------------------------------------------------------
6. Tasks / Follow-ups
------------------------------------------------------------

Purpose:
Track action items related to clients or engagements.

Fields:

- title
- description
- status
    - todo
    - in_progress
    - done
- due_date
- priority (optional)
- client_id
- engagement_id (optional)
- assigned_to
- created_at
- updated_at

Features:

- task list per client
- task list per engagement
- my tasks view
- overdue filter
- due today filter


------------------------------------------------------------
7. Files / Artifacts
------------------------------------------------------------

Purpose:
Store or link files related to client work.

Fields:

- name
- file_url / storage_id
- client_id
- engagement_id (optional)
- type (optional)
- uploaded_by
- created_at

Features:

- files per client
- files per engagement
- upload
- link external file (Drive / Dropbox optional)
- preview (optional)


------------------------------------------------------------
8. Prospect / Pipeline (Lightweight)
------------------------------------------------------------

Purpose:
Track potential clients without full CRM complexity.

Fields:

- company_name
- contact_name
- stage
    - lead
    - conversation
    - proposal
    - negotiation
    - won
    - lost
- source
- notes
- expected_start_date (optional)
- value (optional)
- tags
- created_at
- updated_at

Features:

- simple list view
- stage filter
- convert to client


------------------------------------------------------------
9. Tags / Labels
------------------------------------------------------------

Used for:

- industry
- priority
- service type
- region
- segment

Should be attachable to:

- client
- engagement
- contact
- note
- task


------------------------------------------------------------
10. Dashboard (Recommended)
------------------------------------------------------------

Show:

- active clients
- active engagements
- upcoming tasks
- recent notes
- prospects
- overdue tasks

Purpose:
Daily home screen for firm owner


------------------------------------------------------------
11. Permissions (Minimal)
------------------------------------------------------------

Roles:

- firm_admin
- firm_member

Rules:

- all members see clients
- only owner can edit firm settings
- notes/tasks editable by creator or admin


------------------------------------------------------------
12. Out of Scope (for lightweight CRM)
------------------------------------------------------------

No email automation
No marketing automation
No complex sales pipeline
No forecasting
No deal probability
No campaign tracking
No call logging automation
No enterprise roles


------------------------------------------------------------
13. Positioning

This CRM is:

Client-focused
Engagement-focused
Notes-driven
Delivery-driven

Not sales-driven.

Designed for:

Consultants
Fractional leaders
Agencies
Advisors
Boutique firms
Professional services