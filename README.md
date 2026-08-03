# Yetka Lina

Yetka Lina is the CareOnCloud web administration interface, based on the
upstream Lina `v4.10.16` codebase. GPLv3 licensing and required upstream
attribution are retained.

## Development

```bash
yarn install
yarn serve
yarn build:prod
```

Set `VUE_APP_CORE_HOST` in the development environment to the Yetka Core API.

## Deployment

Serve the generated `lina/` directory under `/ui/` and proxy `/api/`, `/ws/`,
and `/koko/` to the corresponding Yetka services. Keep WebSocket upgrade
headers enabled in the reverse proxy.

## License

GPL-3.0-or-later. See [LICENSE](./LICENSE) for the complete text and retain
upstream attribution notices where required.
