# Roadmap: Google OAuth in a Modal/Popup Window

This document outlines the recommendation for implementing Google OAuth in a modal/popup window instead of a full-tab redirect. This will be implemented at a later stage when the core functionality is stable.

## Overview
Implementing Google OAuth in a modal/popup window keeps the user in the context of the application, providing a more "premium" and less disruptive experience.

## Feasibility
**High.** It is completely feasible. Instead of setting `window.location.href = authUrl`, the application would use `window.open(authUrl, 'google-oauth', 'width=600,height=600')`.

## Technical Risks & Considerations

### 1. Popup Blockers
*   **Risk**: If the `window.open` call isn't triggered by a direct, synchronous user action (like a click event), browsers will block it.
*   **Mitigation**: Ensure the call happens exactly inside the `onClick` handler.

### 2. Cross-Window Communication
*   **Risk**: The main tab needs to know when the OAuth flow in the popup is finished.
*   **Complexity**: A small script is required on the redirect URI page (callback route) that calls `window.opener.postMessage({ type: 'AUTH_SUCCESS', data: ... })` and then closes itself. The main tab must have a message event listener to receive this.

### 3. Mobile UX
*   **Risk**: Popups are often handled poorly on mobile browsers (sometimes opening as new tabs anyway or getting lost behind the main window).
*   **Trade-off**: Many apps detect mobile and stick to full redirects, while using popups only for desktop.

### 4. Session Persistence
*   **Risk**: Some strict browser settings (Incognito, Safari ITP) can occasionally cause issues with "third-party" context in popups, though standard OAuth flows are generally well-supported.

## Comparison: Current vs. Proposed

| Feature | Current Implementation (Redirect) | Proposed Implementation (Popup) |
| :--- | :--- | :--- |
| **Robustness** | Extremely robust; works on all devices/browsers. | More complex to implement correctly (cross-window messages). |
| **Experience** | Disruptive; re-initializes app state after redirect. | Seamless; maintains application state in the background. |
| **State Handling** | Simple URL parameters (?success=...). | Requires `window.postMessage` protocol. |

## Effort Level: ~120–180 Minutes
1.  **Popup Trigger Logic (20m)**: Modifying the `onClick` to handle a window reference.
2.  **Communication Bridge (40m)**: Implementing the `window.postMessage` protocol between the popup and the parent tab.
3.  **Callback Route Update (30m)**: Updating the API/Callback route to serve a "Success" HTML snippet that emits the message and closes.
4.  **Testing & Edge Cases (60m)**: Testing across Chrome, Safari, and Firefox, and handling the "user closed the popup manually" scenario.

## Recommendation
This is a great UX polish. When implemented, it is suggested to keep the current logic as a fallback (if the popup is blocked, fall back to a redirect).
