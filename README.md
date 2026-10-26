# Feature Registry

Feature Registry is an open-source, domain-agnostic catalog for software features. Use it as a single place to track:

- Features (name, description, lifecycle, owner/team)
- Feature flags (owner, creation date, expected sunset, status)
- Cross-team dependencies
- Pre-release prerequisites (training, stakeholder communication, and similar checklist items)
- External links (Jira, Confluence, or generic URLs)

The project has no coupling to a specific product or internal package registry. Adopters configure their own applications and custom attributes at runtime.

## Quickstart

```bash
cp .env.example .env
docker compose up -d
npm install
npm run build -w @feature-registry/shared
npm run seed
```

In two terminals:

```bash
npm run dev:api    # http://localhost:3000
npm run dev:web    # http://localhost:5173
```

The seed creates a sample application, feature, flag, checklist item, and a custom attribute definition.

## Repository layout

| Path | Description |
| --- | --- |
| `apps/api` | NestJS HTTP API and `@nestjs/schedule` reminder worker |
| `apps/web` | React (Vite + Tailwind) UI |
| `packages/shared` | Shared enums and TypeScript types |

## Environment variables

See [`.env.example`](.env.example) for the full list.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API port (default `3000`) |
| `CORS_ORIGIN` | Allowed browser origin |
| `TYPEORM_SYNC` | When `true`, TypeORM creates/updates schema (convenient for local development) |
| `VITE_API_URL` | API base URL used by the web app |
| `REMINDER_WEBHOOK_URL` | Generic HTTP webhook for overdue flags and pending post-release actions. Slack incoming webhooks are supported. Leave empty to disable. |
| `REMINDER_CRON` | Cron expression for the reminder job (default `0 9 * * *`) |
| `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN` | Optional Jira REST enrichment |
| `CONFLUENCE_BASE_URL`, `CONFLUENCE_EMAIL`, `CONFLUENCE_API_TOKEN` | Optional Confluence REST enrichment |

When Jira or Confluence variables are not set, external links are stored and displayed as URLs. No Atlassian client is required.

## Custom attributes

Core fields (name, owner, status, flag dates, and so on) stay first-class columns. Adopters can add extra fields at runtime through **attribute definitions** without code changes or migrations.

1. Create an `AttributeDefinition` (Admin UI or `POST /attribute-definitions`).
2. Values are stored per entity in a JSONB column, isolated behind the persistence layer.
3. The API validates values against the definition (type, required, min/max, regex, enum options).
4. List pages render extra columns and filters from active definitions.

Example definition (enum on Feature):

```json
{
  "key": "business_capability",
  "label": "Business capability",
  "description": "Product area this feature belongs to",
  "dataType": "enum",
  "required": false,
  "defaultValue": "other",
  "options": ["payments", "onboarding", "search", "other"],
  "appliesTo": "Feature",
  "validation": { "min": null, "max": null, "regex": null },
  "sortOrder": 10,
  "status": "active"
}
```

Supported `dataType` values: `string`, `text`, `number`, `boolean`, `date`, `enum`, `url`, `user`.  
`appliesTo`: `Feature`, `FeatureFlag`, `Dependency`, `ReleaseChecklistItem`.

Filter lists with query parameters: `GET /features?attr.business_capability=payments`.

## External links

`ExternalLink` can be attached to a feature, flag, dependency, or checklist item.

| Field | Examples |
| --- | --- |
| `provider` | `jira`, `confluence`, `generic` |
| `type` | `epic`, `task`, `page`, `other` |

Integrations use an `ExternalLinkProvider` adapter. Jira and Confluence implementations enrich links with issue/page metadata when credentials are configured. Additional providers (GitHub Issues, Azure Boards, Trello) can be added without changing the domain model.

## Reminders

The API uses NestJS `ScheduleModule` (`@nestjs/schedule`) — not a custom daemon. On each cron tick it looks for:

- Feature flags whose `expectedSunsetAt` is in the past and status is not `removed`
- Checklist items still `pending` (post-release / pre-release actions)

If `REMINDER_WEBHOOK_URL` is set, it POSTs a JSON payload to that URL.

## License

MIT
