# Start / Restart Server

After a server reboot you can run the following commands to start both backend service and front end app.

## Backend (API)

Start the PM2 service: 

```bash
pm2 start downdetector-api
```

Then we can check logs with:

```bash
pm2 logs
```