# SMU Buddy
# Environment variables
```
MONGODB_URI= <mongodb atlas url>
JWT_SECRET= <generated jsonwebtoken secret>
SESSION_SECRET= <generated jsonwebtoken session secret>
NODE_ENV=development // npm run start uses production by default

MAILGUN_API_KEY=
MAILGUN_DOMAIN=
PORT=3000
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100
```

GOOGLE_CALENDAR_PRIVATE_KEY_FILE=./key.json

## Recommended deployment
Debian 12 with Node, NPM, Mongodb
Cloudflare Always HTTPS

## Commands to run
Please run ```npm i```, ```npm run build```, ```npm run start``` on the command lind to deploy
