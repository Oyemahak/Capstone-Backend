# Risk Register

| Risk | Area | Likelihood | Impact | Mitigation | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Secret exposure | Security | Medium | High | Never print or commit secrets; scan diffs | Security Agent | Open |
| Unsupported marketing claims | Trust | Medium | High | Require evidence and customer-trust review | Marketing/Trust Agents | Open |
| Production regression | Engineering | Medium | High | Regression checklist and smoke tests | QA Agent | Open |
| Accessibility gaps | UX | Medium | Medium | WCAG review and responsive testing | Accessibility Agent | Open |
| Destructive data action | Data | Low | High | Approval, backup, dry-run, rollback | Database Agent | Open |
