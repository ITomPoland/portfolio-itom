$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$targetPath = Join-Path $projectRoot '.env.local'
$secureKey = Read-Host 'Paste a NEW Gemini API key (input is hidden)' -AsSecureString
$keyPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)

try {
    $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($keyPointer).Trim()
    if ([string]::IsNullOrWhiteSpace($apiKey)) {
        throw 'The API key cannot be empty.'
    }
    if ($apiKey.Contains("`r") -or $apiKey.Contains("`n")) {
        throw 'The API key cannot contain line breaks.'
    }

    $existingLines = if (Test-Path -LiteralPath $targetPath) {
        [IO.File]::ReadAllLines($targetPath)
    } else {
        @()
    }

    $updatedLines = [Collections.Generic.List[string]]::new()
    $replaced = $false

    foreach ($line in $existingLines) {
        if ($line -match '^\s*GEMINI_API_KEY\s*=') {
            if (-not $replaced) {
                $updatedLines.Add("GEMINI_API_KEY=$apiKey")
                $replaced = $true
            }
        } else {
            $updatedLines.Add($line)
        }
    }

    if (-not $replaced) {
        $updatedLines.Add("GEMINI_API_KEY=$apiKey")
    }

    [IO.File]::WriteAllLines(
        $targetPath,
        $updatedLines,
        [Text.UTF8Encoding]::new($false)
    )

    Write-Host 'Gemini key saved to .env.local. Restart npm run dev.'
} finally {
    if ($keyPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPointer)
    }
}
