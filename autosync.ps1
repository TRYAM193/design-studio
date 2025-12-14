while ($true) {
    git add .
    git commit -m "auto-sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" --allow-empty
    git push
    Start-Sleep -Seconds 10
}
