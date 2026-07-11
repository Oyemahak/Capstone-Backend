# Production Release Workflow

## Purpose
Use before deploying. Confirm builds, env vars, security, accessibility, regression, rollback, health checks, and post-deploy smoke tests.

## Required Steps
1. Confirm objective, scope, and out-of-scope.
2. Inspect existing architecture and content.
3. Select relevant agents through the Orchestrator.
4. Apply security, accessibility, performance, and trust checks.
5. Require QA/regression review for development work.
6. Document decisions, tests, risks, and handoff.

## Required Review Gates
- Requirements understood
- Existing system inspected
- Plan approved when needed
- Implementation or recommendation complete
- Relevant automated and manual checks complete
- Security review before deployment
- Final handoff complete

## Stop Conditions
Stop for approval if the workflow requires destructive action, production deployment, secret access, major architecture changes, unsupported claims, or ambiguous scope.
