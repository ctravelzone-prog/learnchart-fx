# Live server — Owncast deploy pack (LearnChart FX)

This pack deploys the **own private live server** for LearnChart FX's Live
Room: Owncast (free, open-source, MIT). One server, one broadcaster
(OBS), 100+ students watching HLS on the site.

**What this is NOT:** this pack is for a **generic Ubuntu server you buy
later** (any VPS — Hostinger, Hetzner, DigitalOcean, whatever you pick).
It does not assume any existing server. Nothing here is deployed yet —
this is the ready-to-run pack for when the server is bought.

**How the pieces fit:**

```
Mentor's OBS ──RTMP──▶ Owncast (this server) ──HLS──▶ LearnChart FX Live Room
                         rtmp://live.example.com:1935/live
                         https://live.example.com/hls/stream.m3u8
```

The LearnChart site never touches this server's admin or stream key.
After this server is up, the owner only pastes two things in
**LearnChart Admin → Live Settings → Own private server**:

1. Owncast server URL, e.g. `https://live.example.com`
2. The Owncast stream key (same key as on this server)

…then switches the Live Room source to "Own private server". No code
change on the site.

---

## 0. What you need before starting

- A **fresh Ubuntu 22.04 or 24.04 server** (1 vCPU + 1 GB RAM is enough
  for one 1080p stream with a single quality; 2 GB is comfortable).
  Pick any provider you like.
- A **domain or subdomain pointing at the server**, e.g.
  `live.example.com` → the server's public IP (DNS A record).
  Replace `live.example.com` everywhere below with your real one.
- SSH access as root (or a sudo user).
- Outbound internet on the server (to download Owncast + ffmpeg).

**Ports to open (firewall / provider panel):**

| Port | What | Who |
|------|------|-----|
| 80   | HTTP (Caddy auto-HTTPS) | everyone |
| 443  | HTTPS (viewers watch here) | everyone |
| 1935 | RTMP ingest (OBS → Owncast) | only the mentor's IP if you can restrict it, else everyone (the stream key is the password) |
| 22   | SSH | only you |

---

## 1. Install (on the server, as root)

```bash
# System tools + ffmpeg (Owncast shells out to ffmpeg for HLS).
apt update && apt install -y unzip curl ffmpeg ufw

# Owncast 0.3.0 (pinned — check https://github.com/owncast/owncast/releases
# for a newer version and bump the number if you want it).
cd /opt
curl -L -o owncast.zip https://github.com/owncast/owncast/releases/download/v0.3.0/owncast-0.3.0-linux-64bit.zip
unzip owncast.zip
mv owncast-0.3.0-linux-64bit owncast
cd /opt/owncast
chmod +x owncast

# A dedicated user (never run it as root).
useradd --system --home /opt/owncast --shell /usr/sbin/nologin owncast
chown -R owncast:owncast /opt/owncast
```

## 2. Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 1935/tcp
ufw --force enable
```

## 3. Run as a service (systemd)

Copy `owncast.service` from this pack to the server and enable it:

```bash
cp owncast.service /etc/systemd/system/owncast.service
systemctl daemon-reload
systemctl enable --now owncast
systemctl status owncast   # should say "active (running)"
```

Owncast listens on `http://127.0.0.1:8080` (web + admin) and
`0.0.0.0:1935` (RTMP ingest). Its data (config, stream keys, HLS
segments) lives in `/opt/owncast/data`.

## 4. HTTPS (Caddy reverse proxy)

Install Caddy, then copy `Caddyfile` from this pack to `/etc/caddy/Caddyfile`
(edit the domain first), and reload:

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy
cp Caddyfile /etc/caddy/Caddyfile
systemctl reload caddy
```

Caddy gets a free Let's Encrypt certificate automatically. Viewers then
watch at `https://live.example.com` (which is also the URL to paste in
LearnChart Admin → Live Settings).

> RTMP ingest does **not** go through Caddy — OBS connects straight to
> `rtmp://live.example.com:1935/live` (plain TCP port 1935).

## 5. First setup — CHANGE THE DEFAULTS (do this before going live)

1. Open `https://live.example.com/admin` — user `admin`, password `abc123`.
2. **Change the admin password immediately** (Configuration → Server Setup).
   The default `abc123` is public knowledge.
3. **Stream Keys → delete the default `abc123` key** and keep the generated
   30-character key (or make your own long random one). This key is what
   OBS uses — it is the only thing stopping anyone else from broadcasting
   on your channel.
4. Configuration → Server Setup: set the instance name (e.g. "LearnChart FX
   Live") and your server URL (`https://live.example.com`).
5. Optional: set the stream title / "offline" behaviour in the admin panel.

## 6. OBS setup (mentor's computer)

OBS → Settings → Stream → Service: **Custom**, then:

- **Server:** `rtmp://live.example.com:1935/live`
- **Stream key:** the key from step 5 (same key you paste in LearnChart
  Admin → Live Settings → Owncast stream key)
- Video: 1920×1080, 30 fps, H.264, 2500–4500 Kbps, keyframe interval
  **2 seconds**, audio AAC 160 Kbps.

For a trading session, use **Display Capture** (charts) + your camera as
a small overlay, or **Window Capture** of the trading platform. Start
streaming in OBS, then in LearnChart Admin → Live Settings switch the
source to "Own private server" — the Live Room player appears for members
(HLS delay is roughly 10–30 seconds).

## 7. Sanity checks

```bash
# Server is up and serving the web UI:
curl -s -o /dev/null -w "%{http_code}\n" https://live.example.com/

# While OBS is streaming, the HLS playlist must answer 200:
curl -s -o /dev/null -w "%{http_code}\n" https://live.example.com/hls/stream.m3u8

# Logs when something is wrong:
journalctl -u owncast -n 100 --no-pager
```

## 8. Limits to know (honest)

- **One broadcaster at a time.** Owncast accepts a single RTMP stream.
  (Two mentors = one OBS output; use OBS scenes / a shared screen, or
  take turns.)
- **HLS delay is roughly 10–30 seconds.** This is not sub-second video
  chat — questions in the Live Chat arrive faster than the picture.
- **Bandwidth is on this server.** 100 students × ~2.5 Mbps for 2 hours
  is roughly 200 GB of egress per session — check your provider's
  bandwidth allowance before a big live.
- **No viewer login on Owncast itself.** Privacy comes from the
  LearnChart site: the HLS URL is only shown on the PLT-gated Live Room
  page. Anyone who somehow gets the raw HLS URL could watch — it is not
  a password. (Same honesty as YouTube Unlisted: hidden, not locked.
  The difference is nothing is published on YouTube at all.)
- **Back up `/opt/owncast/data`** (config + stream keys) if you ever
  move servers.

## Files in this pack

| File | What |
|------|------|
| `README.md` | this file — the whole deploy, step by step |
| `owncast.service` | systemd unit (runs Owncast on boot) |
| `Caddyfile` | Caddy reverse proxy (HTTPS for the HLS + web UI) |
