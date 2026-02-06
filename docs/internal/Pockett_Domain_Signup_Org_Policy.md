# Pockett – Domain Signup & Organization Duplication Policy
**Status:** Authoritative  
**Audience:** Product, Growth, Backend, Frontend, AI Agents (Cursor / Antigravity)  
**Goal:** Prevent organizational chaos **without** hurting self-serve adoption

---

## 1. Problem Statement

Pockett must balance two conflicting goals:

1. **Fast, frictionless self-serve signup** for individuals, consultants, and SMBs  
2. **Avoiding duplicate organizations** created by multiple users from the same company

Blocking signups based on email domain solves (2) but catastrophically hurts (1).  
This document defines the correct middle path.

---

## 2. Core Principle

> **Do not block signup. Detect, nudge, and merge instead.**

Duplicate organizations are acceptable early-stage behavior.  
Preventing them upfront causes more harm than allowing and resolving them later.

---

## 3. What NOT To Do

❌ Do NOT enforce “1 signup per email domain”  
❌ Do NOT block Gmail / Outlook / Hey users  
❌ Do NOT require admin approval to sign up  
❌ Do NOT assume company intent from email domain  
❌ Do NOT force automatic org merges  

These approaches kill:
- Product-led growth
- Consultant / freelancer adoption
- SMB experimentation

---

## 4. Correct Signup Model (User-First)

### Rule 1: Anyone can sign up

- Any email address is allowed  
- Public domains (`gmail.com`, `outlook.com`, `yahoo.com`, `hey.com`) are fully supported  
- Signup always succeeds  

On signup:
- Create a **personal organization**
- User becomes `ORG_OWNER`

---

## 5. Silent Detection of Same-Domain Orgs

Pockett tracks email domains internally.

If:
- Domain is **not** a public email provider  
- More than one organization exists with the same domain  

Then:
- Flag internally
- **Do nothing visible to the user**

Detection ≠ Enforcement

---

## 6. Contextual Nudging (Critical UX Rule)

Pockett gently nudges users **only when intent is clear**.

### Trigger moments
- User invites a teammate
- User upgrades to a paid plan
- User creates multiple projects
- User manages access

### Nudge copy (example)

> “It looks like someone else from **company.com** is already using Pockett.  
> Would you like to join the same workspace instead?”

Options:
- **Request to join**
- **Continue independently**

The user always decides.

---

## 7. Domain Claim Model (Hard Control, Opt-In)

### What is a domain claim?
A domain claim explicitly ties an email domain to **one organization**.

### When domain claim is offered
- On upgrade to paid plan
- When inviting teammates
- When user clicks “Claim company domain”

### How domain claim works
- DNS TXT verification **or**
- Verification via admin@domain.com

Once claimed:
- Domain is locked to one organization
- New users from that domain must **request access**
- No new orgs created for that domain

---

## 8. Public Email Domains

Public domains are never claimable.

Examples:
- gmail.com
- outlook.com
- yahoo.com
- hey.com

Rules:
- Unlimited organizations allowed
- No domain enforcement
- Identity remains user-based

This preserves freelancer and consultant adoption.

---

## 9. Handling Duplicate Orgs (Reality-Based)

Duplicate orgs will happen. This is normal.

### Why it’s acceptable
- Teams experiment independently
- One org naturally becomes primary
- Others merge or churn

This mirrors behavior in:
- Slack
- Notion
- Figma
- GitHub

---

## 10. Merging Organizations (Manual, Rare)

Automated merging is **not required** initially.

### Pockett SUPER_ADMIN may:
- Transfer projects
- Reassign users
- Move billing ownership

Only done:
- On explicit customer request
- Typically for paying customers

Keep this manual to avoid complexity.

---

## 11. Hard Rules to Enforce

### Rule A
> A domain can be claimed by **only one organization**.

### Rule B
> Once claimed, new users from that domain must request access.

Everything else is soft guidance.

---

## 12. Why This Model Is Correct

- Preserves self-serve onboarding
- Supports non-Google-Workspace SMBs
- Avoids blocking consultants & agencies
- Allows future enterprise features
- Minimizes support burden

This is the industry-proven approach.

---

## 13. Final Authority Statement

This policy governs:
- Signup behavior
- Domain handling
- Org duplication resolution

Any future change must preserve:
- User-first onboarding
- Optional enforcement
- Explicit domain claims
