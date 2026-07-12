# MSPixelPulse Multi-Agent Operating System

This directory defines a practical operating system for Codex and future AI coding agents working on MSPixelPulse Backend.

## Purpose
Help agents plan, design, build, test, market, optimize, document, secure, and grow MSPixelPulse while protecting production functionality and truthful communication.

## Directory Structure
- `AGENT-ROSTER.md` lists specialist agents and when to use them.
- Shared standards define business, product, brand, quality, security, accessibility, SEO, content, testing, deployment, handoff, and knowledge rules.
- `agents/` contains specialist operating guides.
- `workflows/` contains repeatable task flows.
- `checklists/` contains quality gates.
- `templates/` contains reusable task, testing, decision, and report formats.
- `knowledge/` stores controlled project knowledge.

## How To Select Agents
Use the Orchestrator Agent first for non-trivial tasks. Select only relevant agents. Do not invoke all agents for small edits.

## How To Run A Workflow
1. Define objective, scope, out-of-scope, and business reason.
2. Inspect the current repository and existing architecture.
3. Select workflow from `workflows/`.
4. Assign specialist agents.
5. Apply quality gates from `QUALITY-STANDARDS.md`.
6. Run relevant checks.
7. Produce handoff notes.

## Handoffs
Use `HANDOFF-PROTOCOL.md`. Every handoff must include files inspected, files changed, assumptions, risks, tests, and next agent.

## Quality Gates
The gates prevent incomplete or risky work from shipping. Automated checks do not replace manual UX, accessibility, security, and regression review.

## Knowledge Updates
Use `KNOWLEDGE-UPDATE-PROTOCOL.md`. Assumptions must not become facts. Major decisions require human review and a decision record.

## Adding A New Agent
Add a file under `agents/` using the required sections, link shared context instead of duplicating it, update `AGENT-ROSTER.md`, and add related checklist/workflow references if needed.

## Example: Feature
Orchestrator -> Product Strategy -> UX -> UI -> Frontend/Backend -> Security -> Accessibility -> QA -> Regression -> Documentation.

## Example: Bug
Orchestrator -> relevant Engineering Agent -> Regression Testing -> QA -> Documentation.

## Example: Marketing Page
Orchestrator -> Marketing -> Content -> SEO -> Customer Trust -> UI -> Accessibility -> QA.
