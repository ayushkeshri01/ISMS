$pgData = "C:\Program Files\PostgreSQL\18\data"
$pgHba = Join-Path $pgData "pg_hba.conf"
$backup = Join-Path $pgData "pg_hba.conf.backup"

Copy-Item $pgHba $backup -Force

$content = Get-Content $pgHba
$newLines = $content | ForEach-Object {
    if ($_ -match "^host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256") {
        "host    all             all             127.0.0.1/32            trust"
    } elseif ($_ -match "^host\s+all\s+all\s+::1/128\s+scram-sha-256") {
        "host    all             all             ::1/128                 trust"
    } elseif ($_ -match "^local\s+all\s+all\s+scram-sha-256") {
        "local   all             all                                     trust"
    } else {
        $_
    }
}

# Add trust rule at the top for local connections if not found
$header = @"
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
"@

$existing = $newLines -join "`r`n"
if ($existing -notmatch "local\s+all\s+all\s+trust") {
    $newContent = $header + "`r`n" + $existing
} else {
    $newContent = $newLines -join "`r`n"
}

$newContent | Set-Content $pgHba -Encoding ASCII

Write-Host "pg_hba.conf updated with trust authentication"

# Reload PostgreSQL configuration
& "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe" reload -D $pgData 2>&1

Write-Host "PostgreSQL reloaded"
