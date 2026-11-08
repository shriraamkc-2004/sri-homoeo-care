# Continuous Web + APK/EXE Downloads

## Result
Your site can run **continuously** and always offer:

| File | URL path |
|------|----------|
| Android APK | `/downloads/homoeo-care.apk` |
| Windows EXE | `/downloads/homoeo-care-windows.exe` |
| Windows Setup | `/downloads/homoeo-care-setup.exe` |

On production:

- https://srihomoeocare.onvoroa.com/downloads/homoeo-care.apk  
- https://srihomoeocare.onvoroa.com/downloads/homoeo-care-windows.exe  

Landing page buttons call these paths (Download APK / Download Windows App).

## Files on disk
```
Sri/public/downloads/
  homoeo-care.apk                 (~17 MB)
  homoeo-care-windows.exe         (launcher)
  homoeo-care-setup.exe
  sri-homeo-care.*                (aliases)
```

## Keep it online
```bash
cd Sri
pnpm install
pnpm build
pnpm pm2:start
pm2 save && pm2 startup
```

Health: `https://srihomoeocare.onvoroa.com/api/health`

## After updating APK or EXE
1. Copy new binary into `Sri/public/downloads/`
2. `pnpm build`
3. `pm2 reload ecosystem.config.cjs`

## Note on Windows EXE
Source launcher opens **https://srihomoeocare.onvoroa.com/?portal=true**.  
Rebuild on Windows after C# changes:

```bat
csc /target:winexe /win32icon:src\desktop\app.ico /out:public\downloads\homoeo-care-windows.exe src\desktop\SriHomeoCare.cs
```
