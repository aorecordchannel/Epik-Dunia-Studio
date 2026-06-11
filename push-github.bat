@echo off
echo.
echo ==============================================
echo  MENGIRIM PERUBAHAN KE GITHUB (EPIK DUNIA STUDIO)
echo ==============================================
echo.

git add .
git commit -m "Auto-update: %date% %time%"
git push origin main

echo.
echo ==============================================
echo  SELESAI! PERUBAHAN BERHASIL DIKIRIM KE GITHUB
echo ==============================================
pause
