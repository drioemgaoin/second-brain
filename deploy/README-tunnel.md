# Cloudflare Tunnel Setup

Exposes the API over HTTPS without buying a domain. The tunnel provides a **stable URL** that never changes across restarts or redeployments.

## Quick Setup (new VPS)

```bash
bash deploy/setup-tunnel.sh
```

This interactive script will:
1. Authenticate with your Cloudflare account (opens browser)
2. Create a named tunnel
3. Save credentials to `deploy/cloudflared/`
4. Print the stable URL

## Manual Setup

### 1. Authenticate

```bash
docker volume rm cloudflared-setup 2>/dev/null
docker run --rm -v cloudflared-setup:/home/nonroot/.cloudflared \
  alpine sh -c "chown -R 65532:65532 /home/nonroot/.cloudflared"
docker run --rm -it -v cloudflared-setup:/home/nonroot/.cloudflared \
  cloudflare/cloudflared:latest tunnel login
```

### 2. Create tunnel

```bash
docker run --rm -v cloudflared-setup:/home/nonroot/.cloudflared \
  cloudflare/cloudflared:latest tunnel create second-brain-api
```

Note the tunnel ID (UUID) from the output.

### 3. Copy credentials

```bash
mkdir -p deploy/cloudflared
docker run --rm -v cloudflared-setup:/home/nonroot/.cloudflared \
  alpine cat /home/nonroot/.cloudflared/<TUNNEL_ID>.json > deploy/cloudflared/credentials.json
```

### 4. Create config

```yaml
# deploy/cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: /home/nonroot/.cloudflared/credentials.json

ingress:
  - service: http://api:3001
```

### 5. Deploy

```bash
make deploy-build
make deploy-up
```

### 6. Configure frontend

Set `NEXT_PUBLIC_API_URL` in Cloudflare Pages environment variables:

```
https://<TUNNEL_ID>.cfargotunnel.com
```

Redeploy the frontend.

## Files

| File | Committed | Description |
|------|-----------|-------------|
| `config.yml` | Yes | Tunnel config (tunnel ID + ingress rules) |
| `credentials.json` | **No** (.gitignored) | Secret credentials — copy to each VPS |

## Migrating to a new VPS

1. Copy `deploy/cloudflared/credentials.json` from the old VPS (or re-run `setup-tunnel.sh` to create a new tunnel)
2. `git pull && make deploy-build && make deploy-up`
