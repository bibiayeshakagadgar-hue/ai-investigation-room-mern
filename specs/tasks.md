# AI-Powered Investigation Room — Development Tasks

**Status:** Proposed  
**Method:** Spec-Driven Development (SDD)  
**Required stack:** MongoDB, Express.js, React.js, Node.js, OpenAI, and Google Gemini

## How to use this task list

- Work from `specs/requirements.md`; it remains the source of truth for product behavior.
- Before each milestone, review its requirements, agree on design decisions, and make its acceptance checks testable.
- Complete tasks in order unless a documented dependency requires a change.
- Keep implementation and verification separate: a task is complete only when its acceptance check has been verified.
- Do not mark future features as complete based on placeholders or unconnected UI screens.
- Never commit real credentials or expose server-side secrets in the React client.

## Milestone 1 — Project setup and case management

### M1.1 — Review scope and record decisions

- [ ] Read the Milestone 1 scope and acceptance criteria in `specs/requirements.md`.
- [ ] Record the selected prototype authentication approach: email and password, with user identity established by the server after successful authentication.
- [ ] Record the selected case access rule: each case has one owner, and only that owner may access or modify it.
- [ ] Document the authentication approach's security limitations and any production hardening still required; do not describe the prototype as production-ready solely because it has login.
- [ ] Agree on allowed case statuses and priorities, required fields, and archive behavior.
- [ ] Agree on the API error response shape and development/test/production configuration approach.

**Check:** The email/password and owner-only decisions and security limitations are documented before case APIs are designed and match `specs/requirements.md`.

### M1.2 — Plan the repository and application structure

- [ ] Plan where the React client, Express/Node.js API, shared documentation, and configuration examples belong.
- [ ] Record how the client communicates with the API and how the API receives configuration.
- [ ] Keep the required stack visible in the plan: React, Node.js, Express.js, and MongoDB. Record OpenAI and Gemini as later server-side integrations.

**Check:** A beginner can identify each application part and its responsibility from the documented structure.

### M1.3 — Establish configuration and secret-handling rules

- [ ] Define the configuration values needed for the client, server, and MongoDB connection.
- [ ] Provide examples with placeholders only; do not add real credentials to source control.
- [ ] Separate development, test, and production configuration.
- [ ] Document that database, authentication, storage, OpenAI, and Gemini secrets remain server-side and out of browser bundles and logs.

**Check:** Setup instructions identify required configuration without containing real secrets, and explain which values must never reach the browser.

### M1.4 — Set up the application foundation

- [ ] Create the planned React frontend structure.
- [ ] Create the planned Node.js and Express.js backend structure.
- [ ] Add a clear development entry point for each application part and document how they work together.

**Check:** The documented commands and structure make it clear how to start the client and API; no product feature is represented by a nonfunctional placeholder.

### M1.5 — Connect MongoDB and define safe health checks

- [ ] Configure the server to connect to MongoDB using environment configuration or a secret manager.
- [ ] Define how the server reports a failed or lost database connection.
- [ ] Add an API health/readiness response that reports service state without returning credentials, database details, or case data.
- [ ] Keep connection errors out of public responses and avoid logging secrets.

**Check:** The health response is safe, and unavailable MongoDB produces a controlled service error rather than a crash or leaked internals.

### M1.6 — Define and document the Case data rules

- [ ] Define a unique case identifier and required title.
- [ ] Define summary, status, priority, relevant dates, and creation/update timestamps.
- [ ] Define allowed status and priority values and validation rules for each field.
- [ ] Define archive behavior so archiving does not silently delete case records.
- [ ] Define a required owner reference for every case; owner identity must come from the authenticated server-side user, not a trusted client-supplied value.
- [ ] Define the database indexes needed for case access, filtering, and text search.

**Check:** The case data rules cover every case field and behavior required for Milestone 1 and can be reviewed before API work begins.

### M1.7 — Establish API validation, authorization, and error conventions

- [ ] Define server-side checks for required values, types, lengths, allowed values, dates, and identifiers.
- [ ] Define the email/password authentication check and the ownership check every protected case operation must apply.
- [ ] Choose and document how authenticated sessions are maintained and ended, including appropriate protection for the chosen browser credential/session mechanism.
- [ ] Ensure case creation assigns the authenticated user as owner and clients cannot assign or change ownership.
- [ ] Define consistent safe responses for validation, unauthenticated, unauthorized, not found, conflict, rate limit, and unexpected errors.
- [ ] Ensure error details do not expose stack traces, secrets, database internals, or unauthorized case contents.
- [ ] Bound page sizes and validate filter/search inputs.

**Check:** The conventions require authentication and owner matching on every protected case operation; client-side checks are not treated as a replacement for server checks.

### M1.8 — Implement and verify prototype authentication

- [ ] Add investigator account registration, sign-in, and sign-out using email and password.
- [ ] Validate email and password inputs and define how duplicate or invalid accounts are handled.
- [ ] Store only a secure password hash; never store or log plain-text passwords.
- [ ] Establish the authenticated user identity on the server and protect authentication/session credentials.
- [ ] Return safe authentication errors that do not reveal passwords, secrets, or unnecessary account details.

**Check:** An investigator can register, sign in, and sign out; protected case requests have a server-established identity; stored credentials are password hashes only.

### M1.9 — Implement and verify case creation

- [ ] Add the API operation to create a case for an authenticated investigator and assign that investigator as owner on the server.
- [ ] Validate fields and assign required identifier and timestamps safely on the server.
- [ ] Return a consistent success response without internal data.

**Check:** A valid case is created with the authenticated user as owner; invalid fields are rejected; unauthenticated requests are denied and clients cannot choose another owner.

### M1.10 — Implement and verify case listing, search, and pagination

- [ ] Add the API operation to list only cases owned by the authenticated investigator.
- [ ] Add bounded pagination, status filtering, and text search.
- [ ] Define stable sorting and behavior for empty results and invalid filters.

**Check:** Results include only the authenticated user's cases and respect filters; page limits are enforced; query parameters cannot retrieve another user's cases.

### M1.11 — Implement and verify case detail viewing

- [ ] Add the API operation to retrieve one case by identifier.
- [ ] Apply authentication and verify the authenticated user owns the case before returning its details.
- [ ] Use a safe not-found/denial behavior that does not disclose inaccessible case contents.

**Check:** The owner can view the case; another authenticated user receives no case data, including when using the case identifier directly.

### M1.12 — Implement and verify case updates

- [ ] Add the API operation to update permitted case fields.
- [ ] Validate updates and prevent clients from changing server-managed identifiers, ownership, or timestamps improperly.
- [ ] Require the authenticated user to own the case before applying any update.
- [ ] Update the last-updated timestamp and preserve creation information.

**Check:** A valid owner update changes permitted fields; invalid, unauthenticated, or non-owner updates fail safely and do not partially succeed.

### M1.13 — Implement and verify case archiving

- [ ] Add the agreed archive operation and represent archived state explicitly.
- [ ] Enforce authorization and prevent archive from deleting the case or associated data.
- [ ] Require authentication and verify the authenticated user owns the case before archiving it.
- [ ] Define how archived cases appear in lists and whether they can be restored, consistent with the agreed rules.

**Check:** Archiving preserves the case and its records and follows the documented list/restore behavior.

### M1.14 — Build the React case-management flows

- [ ] Build registration, sign-in, and sign-out flows for prototype investigators.
- [ ] Build a case list with pagination, status filtering, and text search.
- [ ] Build case create and edit forms with clear field labels and validation feedback.
- [ ] Build a case detail view and an archive action with clear outcome feedback.
- [ ] Show distinct loading, empty, success, and error states for case workflows.
- [ ] Keep UI access controls consistent with the API; the server remains authoritative.

**Check:** An authorized investigator can complete create, list/search/filter, view, update, and archive workflows in the UI and understand each outcome.

### M1.15 — Document setup and configuration

- [ ] Document prerequisites, configuration placeholders, how to start the React client and Express API, and how MongoDB is configured.
- [ ] Document supported development commands and safe troubleshooting for common configuration/database failures.
- [ ] Document the prototype email/password authentication approach, password-hash-only storage, owner-only case access, and security limitations.
- [ ] Document that production deployment requires HTTPS and protected secrets, and identify authentication hardening still needed before production use.

**Check:** A beginner can follow the instructions without undocumented configuration or committed secrets, and can find the prototype authentication approach and its limitations in the documentation.

### M1.16 — Verify Milestone 1 acceptance criteria

- [ ] Verify acceptance check 1: documented setup can start the React client and Express API with MongoDB configuration.
- [ ] Verify acceptance check 2: the API reports health without disclosing credentials or sensitive information.
- [ ] Verify acceptance check 3: an investigator can register, sign in, create a case, and see it in their own case list; signing out ends access to protected operations.
- [ ] Verify acceptance check 4: an authorized user can view and update a case.
- [ ] Verify acceptance check 5: case listing supports pagination, status filtering, and text search.
- [ ] Verify acceptance check 6: invalid case input is rejected with a consistent, safe error response.
- [ ] Verify acceptance check 7: requests by a non-owner for another user's case are denied by backend ownership checks without disclosing case contents, including when the case identifier is changed.
- [ ] Verify acceptance check 8: the UI clearly communicates loading, empty, success, and error states for case workflows.
- [ ] Verify acceptance check 9: no AI provider key or database secret is exposed to the browser.
- [ ] Verify acceptance check 10: setup and configuration instructions, including the prototype authentication approach and security limitations, are documented.
- [ ] Record verification results, known limitations, and any requirement changes for review.

**Milestone exit:** All ten checks pass, setup documentation is complete, and known limitations are recorded. Do not begin later feature work by treating placeholders as completed capabilities.

## Milestone 2 — Dashboard

- [ ] Define the dashboard counts, case summaries, filters, and navigation with clear acceptance checks.
- [ ] Implement summaries using only cases the signed-in investigator may access.
- [ ] Ensure counts and filters cannot reveal inaccessible cases or records.
- [ ] Add loading, empty, and safe error states; bound any list/query operations.

**Check:** Dashboard totals and summaries match the investigator's authorized case set, including when data is empty or unavailable.

## Milestone 3 — Evidence management

- [ ] Define evidence fields, allowed types, collection details, timestamps, and case association.
- [ ] Implement create, list, detail, and update workflows for evidence under an authorized case.
- [ ] Validate identifiers and all user input on the server; enforce case access on every operation.
- [ ] Avoid unnecessary sensitive personal data and exclude evidence contents from routine logs.
- [ ] Handle missing cases, invalid data, duplicate/conflict conditions, and database failures safely.
- [ ] Add audit events for sensitive evidence changes without copying unnecessary case details.

**Check:** Authorized users can manage evidence; unauthorized users cannot access it by changing an identifier; errors are safe and consistent.

## Milestone 4 — Clue and suspect management

- [ ] Define clue fields, status, source/discovery details, timestamps, and case association.
- [ ] Define suspect identifying details and investigation status while minimizing sensitive personal data.
- [ ] Implement create, list, detail, and update workflows for clues and suspects.
- [ ] Validate input and enforce authorization through the associated case on every operation.
- [ ] Add appropriate audit events and safe handling for not-found, validation, and database errors.

**Check:** Clues and suspects remain associated with authorized cases, sensitive data is minimized, and failed operations do not expose records.

## Milestone 5 — Related-record connections

- [ ] Define supported relationship types and which record types may be connected.
- [ ] Implement creating and viewing links only when both records exist and are accessible to the user.
- [ ] Reject incompatible record types and links across inaccessible cases.
- [ ] Implement link removal without deleting either record.
- [ ] Record who created or removed each link and when; avoid logging unnecessary record content.
- [ ] Handle duplicate, invalid, missing-record, and storage failures consistently.

**Check:** Only valid, authorized links can be created; links can be viewed and removed safely; both records remain after unlinking.

## Milestone 6 — Evidence photo and file uploads

- [ ] Choose and document a configurable storage provider and private access approach.
- [ ] Define allowed file types, maximum file sizes, and content verification approach.
- [ ] Implement uploads using generated storage names; do not trust client filename or MIME type alone.
- [ ] Store required metadata: display name, detected type, size, uploader, upload time, and storage reference.
- [ ] Require case authorization for upload, listing, and file retrieval; do not make files public by default.
- [ ] Handle failed uploads and metadata writes so partial or orphaned attachments are cleaned up.
- [ ] Exclude file contents and credentials from logs; audit upload and access events as appropriate.

**Check:** Only allowed, size-limited files can be attached to authorized cases and retrieved by authorized users; failures leave no partial attachment.

## Milestone 7 — AI investigation reports (OpenAI and Gemini)

- [ ] Define report sections, permitted source-data scope, investigator review flow, and acceptance checks.
- [ ] Implement server-side provider adapters for OpenAI and Google Gemini behind a shared provider interface.
- [ ] Keep provider keys server-side; record provider/model and input scope safely for each report request.
- [ ] Check case authorization before assembling or sending report inputs; minimize personal and sensitive data sent.
- [ ] Inform the user about provider processing before generation.
- [ ] Separate source facts from AI-generated analysis and recommendations; label output as advisory and requiring investigator review.
- [ ] Do not present AI output as verified findings or an automated determination of guilt.
- [ ] Handle timeouts, rate limits, unavailable providers, malformed responses, and configuration errors with safe messages and no credential/raw-sensitive-data leakage.
- [ ] Audit report generation and access without storing unnecessary sensitive content in logs.

**Check:** Authorized users can request a clearly labeled report through either configured provider; errors are handled safely and generated content remains reviewable and advisory.

## Milestone 8 — Production readiness and final review

- [ ] Review authentication, case/record authorization, validation, upload controls, and common web security protections.
- [ ] Confirm HTTPS deployment expectations, secure headers, CORS, request limits, and rate limits for sensitive/resource-intensive operations.
- [ ] Confirm logs exclude passwords, tokens, provider keys, uploaded contents, and unnecessary case details.
- [ ] Define and document retention, archival, deletion, backup, and recovery policies before production use.
- [ ] Review database, upload, and AI provider failure handling and verify public errors disclose no internals.
- [ ] Review usability on common desktop and mobile sizes and success/failure feedback for important state changes.
- [ ] Update setup, deployment, and demo documentation; record remaining risks and decisions.

**Check:** The release review maps back to the privacy, security, validation, error handling, and quality requirements; unresolved production decisions are documented.

## Completion rule

Do not mark a task or milestone complete until its stated check has been verified and the result recorded. If a requirement changes, update the specification and affected task checks before relying on the change.
