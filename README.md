# parcel

Kompletan produkcioni runbook je u: `docs/PRODUCTION_SERVER_IMPLEMENTATION.md`.

## Deploy frontend aplikacije na Rocky Linux (zamena postojeće/stare verzije)

Ovaj projekat koristi **Parcel** i u produkciji generiše statičke fajlove (najčešće u `dist/`).

### 1) Build na CI/CD ili lokalno

```bash
npm ci
npm run build
```

Posle build-a proveri sadržaj foldera:

```bash
ls -la dist
```

### 2) Priprema servera (Rocky Linux)

Primer pretpostavlja da je Nginx već podešen i da stara verzija živi u `/var/www/subscriber-dashboard`.

> Ako dobijaš grešku tipa `sudo: a password is required` ili `account validation failure`, pokreni deploy kao `root` (npr. `su -`) ili traži da ti admin dodeli sudo prava (NOPASSWD za deploy komande).

Kreiraj release strukturu i backup folder:

```bash
mkdir -p /var/www/subscriber-dashboard/releases
mkdir -p /var/www/subscriber-dashboard/backups
```

### 2.1) Ako nemaš instaliran Node.js na Rocky Linux

Za backend (Node/Express) Node.js mora biti instaliran na aplikativnom serveru.

Ako `dnf install nodejs` iz NodeSource repo-a vrati grešku tipa `nothing provides python3`, **nemoj koristiti** `--skip-broken` (to samo preskoči paket i ništa se ne instalira).

1) Proveri aktivne repo-e i isključi problematični NodeSource/N|Solid:

```bash
dnf repolist all | grep -Ei 'rocky|baseos|appstream|nodesource' || true
dnf install -y dnf-plugins-core
dnf config-manager --set-disabled nodesource-nsolid nodesource-nodejs || true
```

2) Uključi Rocky repo-e (ili njihove interne mirror varijante):

```bash
dnf config-manager --set-enabled appstream baseos || true
dnf makecache
```

3) Instaliraj Node.js iz Rocky repo-a (bez NodeSource):

```bash
dnf install -y nodejs npm
node -v
npm -v
```

4) Ako i dalje dobijaš `Unable to resolve argument nodejs` ili `missing groups or modules: nodejs`:

- na nekim sistemima `dnf module` nije relevantan/omogućen, pa je bitno samo da postoje ispravni BaseOS/AppStream (ili interni mirror);
- traži od administracije da omogući mirror koji sadrži `nodejs` RPM.

Privremeni fallback (kada nema dostupnih RPM repo-a): instalacija Node.js binarnog tarball-a:

```bash
cd /opt
curl -fsSLO https://nodejs.org/dist/v20.19.0/node-v20.19.0-linux-x64.tar.xz
tar -xJf node-v20.19.0-linux-x64.tar.xz
ln -sfn /opt/node-v20.19.0-linux-x64 /opt/node
ln -sfn /opt/node/bin/node /usr/local/bin/node
ln -sfn /opt/node/bin/npm /usr/local/bin/npm
node -v
npm -v
```

Napomena: ne instaliraj `nsolid` ako ti treba standardni Node.js runtime za aplikaciju.
Ako je kompanijska mreža bez interneta, instalaciju radi kroz interni RPM/NPM mirror ili prenesi prethodno preuzet Node.js tarball.

### 3) Upload nove verzije

Sa tvoje mašine ili iz CI:

```bash
scp -r dist/* deploy@ROCKY_SERVER:/tmp/subscriber-dashboard-dist/
```

### 4) Atomic deploy + backup stare verzije

> ⚠️ Važno: ako je Nginx `root /var/www/subscriber-dashboard/current;`, samo kopiranje u `/var/www/subscriber-dashboard/dist` **ne aktivira novu verziju**.
> Mora da se ažurira `current` symlink (koraci ispod) ili da se promeni Nginx `root`.

Na serveru:

```bash
set -euo pipefail

TS="$(date +%Y%m%d-%H%M%S)"
RELEASE_DIR="/var/www/subscriber-dashboard/releases/$TS"
LIVE_LINK="/var/www/subscriber-dashboard/current"
BACKUP_DIR="/var/www/subscriber-dashboard/backups/$TS"
WEB_USER="$(ps -eo user,comm | awk '$2=="nginx" {print $1; exit}')"
WEB_GROUP="$WEB_USER"

# fallback za Rocky/RHEL gde je često apache/httpd
if [ -z "$WEB_USER" ]; then
  WEB_USER="$(ps -eo user,comm | awk '$2=="httpd" {print $1; exit}')"
  WEB_GROUP="$WEB_USER"
fi

mkdir -p "$RELEASE_DIR"
cp -a /tmp/subscriber-dashboard-dist/. "$RELEASE_DIR/"

# backup prethodne verzije (ako postoji)
if [ -L "$LIVE_LINK" ] || [ -d "$LIVE_LINK" ]; then
  mkdir -p "$BACKUP_DIR"
  cp -a "$(readlink -f $LIVE_LINK 2>/dev/null || echo $LIVE_LINK)"/. "$BACKUP_DIR/" || true
fi

# prebacivanje na novu verziju bez downtime-a
ln -sfn "$RELEASE_DIR" "$LIVE_LINK"

# opciono: permisije (ako si root i želiš striktan ownership)
if [ -n "$WEB_USER" ]; then
  chown -R "$WEB_USER:$WEB_GROUP" /var/www/subscriber-dashboard
fi
find /var/www/subscriber-dashboard -type d -exec chmod 755 {} \;
find /var/www/subscriber-dashboard -type f -exec chmod 644 {} \;
```

Ako **moraš** da koristiš `sudo`, prefiksiraj komande sa `sudo` (npr. `sudo ln -sfn ...`).

### 5) Nginx konfiguracija (serviranje `current` symlink-a)

Primer `/etc/nginx/conf.d/subscriber-dashboard.conf`:

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/subscriber-dashboard/current;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # agresivan cache za statiku sa hash imenima
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

Provera i reload:

```bash
nginx -t
systemctl reload nginx
```

Ako i dalje vidiš stare API URL-ove (npr. `http://localhost:4000/...`), proveri da li browser učitava stari JS bundle:

```bash
readlink -f /var/www/subscriber-dashboard/current
ls -la /var/www/subscriber-dashboard/current
```

Zatim uradi hard refresh u browseru (`Ctrl+F5`) ili otvori stranicu u incognito prozoru.

### 6) Smoke test u kompanijskoj mreži

```bash
curl -I http://SERVER_HOST/
curl -I http://SERVER_HOST/index.html
```

Ako postoji reverse proxy / API gateway, proveri i ključne frontend rute:

```bash
curl -I http://SERVER_HOST/some/spa/route
```

### 7) Rollback (ako nešto krene naopako)

Najbrže: vrati symlink na prethodni release:

```bash
ls -1 /var/www/subscriber-dashboard/releases
ln -sfn /var/www/subscriber-dashboard/releases/<PRETHODNI_RELEASE> /var/www/subscriber-dashboard/current
systemctl reload nginx
```


### 8) Backend (Node/Express na portu 4000, isti domen)

Ako frontend i backend rade na **istom domenu**, Nginx treba da prosleđuje API rute ka Node/Express procesu na `127.0.0.1:4000`.

Primer dopune Nginx konfiguracije:

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/subscriber-dashboard/current;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:4000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Da li backend mora da se builduje?

- **Ako backend koristi plain JavaScript (npr. `node server.js`)**: obično **ne treba poseban build**, dovoljno je instalirati zavisnosti i pokrenuti servis.
- **Ako backend koristi TypeScript/Babel ili bundler**: treba uraditi build (npr. `npm run build`) pa pokrenuti izlaz (`dist/server.js` ili slično).

Tipičan deploy za Node/Express servis:

```bash
cd /opt/subscriber-dashboard-backend
npm ci --omit=dev
# po potrebi: npm run build
systemctl restart subscriber-dashboard-backend
systemctl status subscriber-dashboard-backend --no-pager
```

#### Konkretno za tvoj `parcel-backend` (prema `npm run` izlazu)

Ako vidiš:

- `start -> node dist/index.js`
- `start:dev -> ts-node ... src/index.ts`

to znači da produkcija startuje iz `dist/`, pa **dist mora da postoji** (dakle treba build pre `npm start`).

Ako u backend projektu nema `build` skripte, dodaj je u `package.json` (backend repo), npr:

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "start:dev": "nodemon --watch src --ext ts --exec \"ts-node --files src/index.ts\""
  }
}
```

Production flow za taj backend je onda:

```bash
cd /opt/subscriber-dashboard-backend
npm ci
npm run build
npm start
```

Preporuka: backend drži kao `systemd` servis da preživi reboot i da ima restart policy.

Ako dobiješ grešku `Unit subscriber-dashboard-backend.service not found`, napravi servis ručno:

```bash
cat >/etc/systemd/system/subscriber-dashboard-backend.service <<'EOF'
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
# Ako koristiš .env fajl:
# EnvironmentFile=/opt/subscriber-dashboard-backend/.env
User=root
Group=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable subscriber-dashboard-backend
systemctl restart subscriber-dashboard-backend
systemctl status subscriber-dashboard-backend --no-pager
journalctl -u subscriber-dashboard-backend -n 100 --no-pager
```

Ako `npm` nije na `/usr/bin/npm` (npr. tarball instalacija), proveri putanju sa:

```bash
which npm
which node
```

i ažuriraj `ExecStart` (npr. `/usr/local/bin/npm start`).

### Napomene za enterprise okruženje

- Ako server nema internet, build radi van servera i prenosi se samo `dist/`.
- Ako postoji WAF/proxy koji kešira HTML, obavezno očisti cache posle deploy-a.
- Ako koristiš SELinux (`Enforcing`), možda će trebati:

```bash
chcon -R -t httpd_sys_content_t /var/www/subscriber-dashboard
```

- Za potpuno automatizovan proces preporuka je CI pipeline sa fazama: `build -> upload artifact -> deploy -> smoke test -> optional rollback`.
