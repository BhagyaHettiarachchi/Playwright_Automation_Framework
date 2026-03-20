# evaluation/run-reliability-test.ps1

"Test_Group,Run_Number,Tests_Passed,Tests_Failed,Total_Time_Seconds" | Out-File -FilePath "evaluation/reliability-results.csv" -Encoding utf8

# Test Group 1: Manual
for ($i = 1; $i -le 20; $i++) {
    Write-Host "Running manual tests - iteration $i"
    npx playwright test tests/manual/ --reporter=json 2>&1 | Out-File -FilePath "evaluation/temp-result.json"
    
    $json = Get-Content "evaluation/temp-result.json" | ConvertFrom-Json
    $passed = $json.stats.expected
    $failed = $json.stats.unexpected
    $time   = $json.stats.duration / 1000
    "Manual,$i,$passed,$failed,$time" | Add-Content "evaluation/reliability-results.csv"
}

# Test Group 2: AI-generated
for ($i = 1; $i -le 20; $i++) {
    Write-Host "Running AI tests - iteration $i"
    npx playwright test tests/generated/ --reporter=json 2>&1 | Out-File -FilePath "evaluation/temp-result.json"
    
    $json = Get-Content "evaluation/temp-result.json" | ConvertFrom-Json
    $passed = $json.stats.expected
    $failed = $json.stats.unexpected
    $time   = $json.stats.duration / 1000
    "AI-Generated,$i,$passed,$failed,$time" | Add-Content "evaluation/reliability-results.csv"
}

# Test Group 3: AI + Self-healing
for ($i = 1; $i -le 20; $i++) {
    Write-Host "Running AI+healing tests - iteration $i"
    npx playwright test tests/generated/ --reporter=json 2>&1 | Out-File -FilePath "evaluation/temp-result.json"
    
    $json = Get-Content "evaluation/temp-result.json" | ConvertFrom-Json
    $passed = $json.stats.expected
    $failed = $json.stats.unexpected
    $time   = $json.stats.duration / 1000
    "AI-SelfHealing,$i,$passed,$failed,$time" | Add-Content "evaluation/reliability-results.csv"
}

# Clean up temp file
Remove-Item -Path "evaluation/temp-result.json" -ErrorAction SilentlyContinue

Write-Host "Done! Results saved to evaluation/reliability-results.csv"