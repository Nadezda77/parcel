# Produkcioni deployment runbook (frontend + backend)

Ovaj dokument je kompletan plan za postavljanje projekta na **novi produkcioni server**
(u kompanijskoj mreži), sa fokusom na:

- frontend (Parcel build) + Nginx servisiranje,
- backend (Node/Express) kao `systemd` servis,
- isti domen (`/api` proxy ka backend-u),
- DNS/SELinux/firewall specifičnosti,
- rollback i operativne provere.

---

## 1. Arhitektura (target stanje)

- **Nginx** služi frontend statiku iz:
  - `/var/www/subscriber-dashboard/current`
- **Backend** radi lokalno na:
  - `127.0.0.1:4000`
- **Nginx** prosleđuje:
  - `/api/*` -> `http://127.0.0.1:4000/*`
- **Frontend** koristi same-origin API pozive (`/api/...`) bez hardkodovanog `localhost`.

---

## 2. Priprema servera (OS, paketi, mreža)

### 2.1 Minimalni paketi

```bash
dnf install -y nginx curl tar gzip
```

### 2.2 Node.js (backend runtime)

Ako je dostupan interni mirror/repo:

```bash
dnf install -y nodejs npm
node -v
npm -v
```

Ako nije dostupan repo, koristi pripremljeni Node.js tarball (preuzet kroz odobren kanal):

```bash
cd /opt
tar -xJf node-v20.x-linux-x64.tar.xz
ln -sfn /opt/node-v20.x-linux-x64 /opt/node
ln -sfn /opt/node/bin/node /usr/local/bin/node
ln -sfn /opt/node/bin/npm /usr/local/bin/npm
node -v
npm -v
```

### 2.3 DNS i mreža

Server mora da razrešava sve interne hostove (npr. LDAP/AD, API dependency).

```bash
getent hosts iotdashboardqa.mts.rs || true
getent hosts partneri.telekom.rs || true
```

Ako `ENOTFOUND/NXDOMAIN`, otvoriti ticket mrežnom/DNS timu pre go-live.

---

## 3. Folder struktura

```bash
mkdir -p /var/www/subscriber-dashboard/releases
mkdir -p /var/www/subscriber-dashboard/backups
mkdir -p /opt/subscriber-dashboard-backend
```

---

## 4. Frontend deployment (Parcel)

## 4.1 Build (lokalno ili CI)

```bash
npm ci
npm run build
ls -la dist
```

## 4.2 Upload artefakta

```bash
scp -r dist/* deploy@PROD_SERVER:/tmp/subscriber-dashboard-dist/
```

## 4.3 Aktivacija novog release-a (atomic switch)

```bash
set -euo pipefail

TS="$(date +%Y%m%d-%H%M%S)"
RELEASE_DIR="/var/www/subscriber-dashboard/releases/$TS"
LIVE_LINK="/var/www/subscriber-dashboard/current"
BACKUP_DIR="/var/www/subscriber-dashboard/backups/$TS"

mkdir -p "$RELEASE_DIR"
cp -a /tmp/subscriber-dashboard-dist/. "$RELEASE_DIR/"

if [ -L "$LIVE_LINK" ] || [ -d "$LIVE_LINK" ]; then
  mkdir -p "$BACKUP_DIR"
  cp -a "$(readlink -f $LIVE_LINK 2>/dev/null || echo $LIVE_LINK)"/. "$BACKUP_DIR/" || true
fi

ln -sfn "$RELEASE_DIR" "$LIVE_LINK"

readlink -f /var/www/subscriber-dashboard/current
```

> Napomena: kopiranje u `/var/www/subscriber-dashboard/dist` nije dovoljno ako Nginx servira `current`.

---

## 5. Backend deployment (Node/Express)

## 5.1 Upload backend koda

Preporuka: tar.gz bez `.git`, `.env`, `node_modules`.

```bash
mkdir -p /opt/subscriber-dashboard-backend
tar -xzf /tmp/parcel-backend.tar.gz -C /opt/subscriber-dashboard-backend
```

## 5.2 Instalacija i build

```bash
cd /opt/subscriber-dashboard-backend
npm ci
npm run build
```

Ako start skripta koristi `node dist/index.js`, `dist` mora da postoji.

## 5.3 Produkcioni `.env`

Primer (prilagoditi realnim vrednostima):

```dotenv
NODE_ENV=production
PORT=4000
SESSION_SECRET=<STRONG_SECRET>
LDAP_URL=ldaps://partneri.telekom.rs:636
LDAP_BIND_DN=<SERVICE_ACCOUNT>
LDAP_BIND_PASSWORD=<SECRET>
LDAP_BASE_DN=<BASE_DN>
LDAP_CA_CERT_PATH=/opt/subscriber-dashboard-backend/certs/ca.pem
```

```bash
chmod 600 /opt/subscriber-dashboard-backend/.env
```

---

## 6. Systemd servis za backend

Kreirati `/etc/systemd/system/subscriber-dashboard-backend.service`:

```ini
[Unit]
Description=Subscriber Dashboard Backend (Node/Express)
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/subscriber-dashboard-backend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/opt/subscriber-dashboard-backend/.env
User=root
Group=root

[Install]
WantedBy=multi-user.target
```

Aktivacija:

```bash
systemctl daemon-reload
systemctl enable subscriber-dashboard-backend
systemctl restart subscriber-dashboard-backend
systemctl status subscriber-dashboard-backend --no-pager
journalctl -u subscriber-dashboard-backend -n 200 --no-pager
```

Ako `npm` nije `/usr/bin/npm`, ažurirati `ExecStart` (`which npm`).

---

## 7. Nginx konfiguracija (isti domen)

`/etc/nginx/conf.d/subscriber-dashboard.conf`:

```nginx
server {
    listen 80;
    server_name iotdashboardqa.mts.rs;

    root /var/www/subscriber-dashboard/current;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

Primena:

```bash
nginx -t
systemctl enable nginx
systemctl restart nginx
```

---

## 8. SELinux i firewall

### 8.1 Nginx -> backend konekcija (kritično za 502)

```bash
setsebool -P httpd_can_network_connect 1
```

### 8.2 Frontend static context (po potrebi)

```bash
chcon -R -t httpd_sys_content_t /var/www/subscriber-dashboard
```

### 8.3 Portovi

Ako postoji host firewall:

```bash
firewall-cmd --add-service=http --permanent
firewall-cmd --reload
```

---

## 9. End-to-end smoke test

```bash
curl -I http://iotdashboardqa.mts.rs/
curl -I http://iotdashboardqa.mts.rs/login
curl -i -X POST http://iotdashboardqa.mts.rs/api/login -H "Content-Type: application/json" -d '{"username":"x","password":"y"}'
```

Ako login pada:

```bash
tail -n 100 /var/log/nginx/error.log
journalctl -u subscriber-dashboard-backend -n 200 --no-pager
```

---

## 10. Rollback plan

### Frontend rollback

```bash
ls -1 /var/www/subscriber-dashboard/releases
ln -sfn /var/www/subscriber-dashboard/releases/<PRETHODNI_RELEASE> /var/www/subscriber-dashboard/current
systemctl reload nginx
```

### Backend rollback

- vratiti prethodni backend artifact (ili git tag),
- `npm ci && npm run build`,
- `systemctl restart subscriber-dashboard-backend`.

---

## 11. Operativni checklist (go-live)

- [ ] DNS za javni/prod domen razrešava na pravi IP.
- [ ] Backend dependency hostovi (LDAP, interne API adrese) razrešivi sa servera.
- [ ] `subscriber-dashboard-backend` je `active (running)`.
- [ ] `/api/login` vraća očekivan odgovor (ne 502, ne DNS grešku).
- [ ] Frontend učitava novi release (`readlink -f .../current`).
- [ ] Nema kritičnih grešaka u `nginx/error.log` i backend journal logu.

