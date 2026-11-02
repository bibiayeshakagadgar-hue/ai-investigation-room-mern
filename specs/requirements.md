# AI-Powered Investigation Room — Requirements

**Status:** Proposed  
**Method:** Spec-Driven Development (SDD)  
**Initial delivery:** Milestone 1 — Project setup and case management

## 1. Purpose

Build a secure web application for managing multiple investigation cases. Investigators can organize case records, track evidence, clues, and suspects, connect related records, upload evidence files, and generate AI-assisted investigation reports.

The system must keep human investigators in control: AI output is advisory, clearly identified as generated, and must not be treated as verified fact.

## 2. Required technology stack

- **Database:** MongoDB
- **Backend:** Node.js with Express.js
- **Frontend:** React.js
- **AI providers:** OpenAI and Google Gemini
- **File handling:** Evidence photo and file uploads, stored using a configurable storage provider

The implementation must keep secrets and provider credentials on the server. The frontend must never call AI providers directly with secret keys.

## 3. Users and access

The prototype uses email-and-password authentication for investigators, including account registration, sign-in, and sign-out. Each case has one owner: the authenticated user who created it. Users may access and modify only their own cases. The backend must authenticate users and enforce case ownership for every protected case operation. A user must not gain access to another user's case or its records by changing an identifier in a request.

The prototype's authentication approach and security limitations must be documented. This owner-only model is the initial access policy; any future sharing or role-based access must be specified before implementation.

## 4. Functional requirements

### 4.1 Project foundation

- The application must have a React client and an Express API running on Node.js.
- The API must connect to MongoDB using configuration supplied through environment variables or a secret manager.
- Development, test, and production configuration must be separated.
- The application must provide a health/readiness check that does not expose secrets or sensitive data.
- The repository must document setup, configuration, and supported commands.

### 4.2 Investigation cases

- Users must be able to create, view, update, search, and list multiple cases they are authorized to access.
- Each case must have an owner, and only that authenticated owner may access or modify it.
- Each case must have a unique identifier and required title.
- A case must support a summary, status, priority, relevant dates, and timestamps for creation and last update.
- Case status and priority must use defined allowed values.
- Users must be able to archive a case without silently deleting its records.
- Case lists must support pagination and useful filtering, including status and text search.
- The API must enforce authorization for every case operation.

### 4.3 Dashboard

- The dashboard must summarize cases the current user is authorized to access.
- It should show useful counts and case status summaries.
- Dashboard data must not include cases or records the user cannot access.

### 4.4 Evidence, clues, and suspects

- Users must be able to create, view, update, and list evidence, clue, and suspect records associated with an authorized case.
- Each record must be linked to its case and include creation/update timestamps.
- Evidence records should support a description, type, collection details, and associated uploaded files.
- Clue records should support a description, status, and source or discovery details.
- Suspect records should support identifying details and an investigation status, while avoiding collection of unnecessary sensitive personal data.
- Records must not be accessible outside the authorization scope of their case.

### 4.5 Connecting related records

- Users must be able to link related cases and records, such as evidence to a clue or suspect.
- Links must be validated: both records must exist, be of compatible types, and be accessible to the user.
- Users must be able to view and remove links.
- Removing a link must not delete either linked record.
- The system should retain who created or removed a link and when.

### 4.6 Evidence photo and file uploads

- Users must be able to upload evidence photos and supported files to an authorized case.
- The server must enforce configured file size limits and an explicit allowlist of file types.
- The server must verify file content where practical; it must not trust the client-provided filename or MIME type alone.
- Stored files must use generated storage names and must not be executable or publicly accessible by default.
- File access must require authorization for the associated case.
- Upload metadata should include the original display name, detected type, size, uploader, upload time, and storage reference.
- Upload failures must not leave orphaned or partially registered evidence attachments.

### 4.7 AI investigation reports

- Users must be able to request an AI-assisted report using only case data they are authorized to access.
- The system must support both OpenAI and Gemini through a server-side provider abstraction.
- Report requests must identify the provider/model and input scope used, subject to safe configuration.
- Reports must distinguish source facts from AI-generated analysis and recommendations.
- Reports must include a clear notice that AI output can be incomplete or incorrect and requires investigator review.
- AI output must not be presented as a verified finding or an automated determination of guilt.
- The system must handle provider timeouts, rate limits, unavailable services, malformed responses, and configuration errors without exposing credentials or raw sensitive provider details.
- AI request and response handling must minimize transmitted personal and case-sensitive data. Users must be informed about provider processing before report generation.
- Report generation and access must be auditable.

## 5. Milestone 1 scope — Project setup and case management

Milestone 1 delivers the project foundation and basic case management:

- Repository and application structure for the required stack.
- Configuration and MongoDB connectivity.
- Basic application/API health handling.
- Case data model and case API operations.
- Case list and case detail/create/edit user flows.
- Email-and-password authentication and a backend-enforced owner-only authorization boundary for every protected case operation.
- Account registration, sign-in, and sign-out for prototype investigators.
- Input validation, consistent API errors, and basic operational documentation.

Dashboard summaries, evidence/clue/suspect management, record connections, uploads, and AI reports are product requirements for later milestones unless explicitly added to Milestone 1 during planning. Milestone 1 must not expose nonfunctional placeholders as if those capabilities work.

## 6. Privacy and security requirements

- Collect and retain only data necessary for investigation workflows.
- Use HTTPS in deployed environments.
- For email-and-password authentication, store password hashes using a secure, purpose-built password hashing algorithm; never store plain-text passwords.
- Keep database credentials, session/authentication secrets, storage credentials, and OpenAI/Gemini keys out of source control and client bundles.
- Enforce email/password authentication and case ownership authorization on the server for every protected case API operation. Never trust client-supplied owner identity as proof of ownership.
- Validate and normalize all client input on the server; frontend validation is for usability and does not replace server validation.
- Use parameterized/structured database operations and avoid unsafe query construction.
- Apply secure HTTP headers, appropriate CORS rules, request size limits, and rate limiting for sensitive or resource-intensive operations.
- Protect against common web risks including injection, cross-site scripting, cross-site request forgery where applicable, and broken access control.
- Do not log passwords, tokens, provider keys, uploaded file contents, or unnecessary case details.
- Maintain audit events for sensitive operations such as case changes, uploads, relationship changes, and report generation, without copying excessive sensitive content into logs.
- Define retention, archival, backup, and deletion policies before production use.
- Errors and API responses must not reveal stack traces, secrets, database internals, or data from unauthorized cases.

## 7. Validation and error handling

- Validate required fields, data types, lengths, enumerated values, identifiers, and date formats at the API boundary.
- Reject malformed or unsupported requests with a consistent response format and a suitable HTTP status.
- Return field-level validation details where safe and useful.
- Distinguish validation, authentication, authorization, not-found, conflict, rate-limit, and unexpected server errors.
- Handle unavailable MongoDB, timeouts, duplicate identifiers, upload failures, and AI provider failures gracefully.
- Do not return success until the requested operation has completed successfully.
- Provide user-facing error messages that explain the next useful action without exposing internal details.
- Ensure paginated and filtered queries have bounded limits.

## 8. Quality attributes

- Case and record access checks must be consistent across list, detail, update, upload, link, dashboard, and AI-report operations.
- The application must remain usable on common desktop and mobile screen sizes.
- Important state changes must provide clear success or failure feedback.
- The design must allow additional AI providers and storage backends without embedding provider-specific behavior throughout the UI.
- Automated checks and acceptance criteria will be defined per milestone in `specs/tasks.md`.

## 9. Acceptance criteria for Milestone 1

Milestone 1 is acceptable when:

1. The documented setup can start the React client and Express API with MongoDB configuration.
2. The API reports health without disclosing credentials or sensitive information.
3. An investigator can register, sign in, create a case, and see it in their own case list; signing out ends access to protected operations.
4. An authorized user can view and update a case.
5. Case listing supports pagination and at least status filtering and text search.
6. Invalid case input is rejected with a consistent, safe error response.
7. Requests for another user's cases are denied by backend ownership checks without disclosing case contents, including when the requester changes a case identifier.
8. The UI clearly communicates loading, empty, success, and error states for case workflows.
9. No AI provider key or database secret is exposed to the browser.
10. Setup and configuration instructions are documented, including the prototype authentication approach and its security limitations.
