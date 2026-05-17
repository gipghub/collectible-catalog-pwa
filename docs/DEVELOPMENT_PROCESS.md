# Development Process

## Clean Code Practices

- Keep functions short and named after the business action they perform.
- Put business rules in `src/domain`, not in event handlers.
- Keep UI rendering separate from storage and browser APIs.
- Depend on small adapter functions for external systems such as storage, image processing, and comparable search.
- Prefer plain data objects at boundaries so records can be synced later.
- Write code that is easy to delete or replace when the prototype becomes a production app.

## Suggested Workflow

1. Write or update the use case in the application layer.
2. Add domain behavior only when there is a real business rule.
3. Add infrastructure adapters for browser APIs or external services.
4. Render the smallest UI needed for the use case.
5. Verify on desktop and narrow mobile viewports.
6. Add tests once a build toolchain is introduced.

## Data Privacy Notes

Photos and catalog details can reveal location, ownership, or valuation information. The current app stores data locally in the browser. A production backend should add authentication, encryption at rest, export/delete controls, and clear privacy settings before sync is enabled.
