---
title: "Use GPT, Claude, and Gemini Models Inside Claude Code on Windows with CLIProxyAPI"
date: "2026-07-18"
author: "Prashant Choudhary"
excerpt: "Learn how to set up CLIProxyAPI to use GPT, Claude, and Gemini models inside Claude Code on Windows, with separate profiles, automatic launchers, and proper local configuration."
tags: ["ai", "claude-code", "windows", "gpt", "claude", "gemini", "tutorial"]
published: true
image: "/images/blog/gpt-claude-gemini-cliproxyapi.png"
readingTime: 30
---

# Use GPT, Claude, and Gemini Models Inside Claude Code on Windows with CLIProxyAPI

CLIProxyAPI can run as a local compatibility gateway between Claude Code and several OAuth-backed model providers. With one local server, you can keep Claude Code's terminal workflow while switching between:

- GPT models authenticated through OpenAI Codex OAuth
- Claude models exposed through Antigravity OAuth
- Gemini models exposed through Antigravity OAuth
- Separate reusable Claude Code profiles for each provider setup

This guide documents the complete Windows setup, including the mistakes that are easiest to make and the exact commands needed to recover from them.

> **Important compatibility note:** CLIProxyAPI is a third-party gateway. Claude Code supports custom gateway URLs, model aliases, environment-variable configuration, and separate configuration directories. Routing Claude Code to models that are not served directly by Anthropic remains an unofficial compatibility workflow. Test tool use, streaming, thinking blocks, prompt caching, MCP integrations, and long-running agents after upgrades.

---

## Table of contents

1. [What this setup creates](#1-what-this-setup-creates)
2. [Requirements](#2-requirements)
3. [Install Claude Code](#3-install-claude-code)
4. [Install CLIProxyAPI automatically](#4-install-cliproxyapi-automatically)
5. [Understand the two passwords](#5-understand-the-two-passwords)
6. [Secure the local configuration](#6-secure-the-local-configuration)
7. [Start CLIProxyAPI from anywhere](#7-start-cliproxyapi-from-anywhere)
8. [Open and understand the Management UI](#8-open-and-understand-the-management-ui)
9. [Authenticate Codex and Antigravity](#9-authenticate-codex-and-antigravity)
10. [Why AI Providers → Claude is not Antigravity](#10-why-ai-providers--claude-is-not-antigravity)
11. [List and verify available models](#11-list-and-verify-available-models)
12. [Understand thinking suffixes](#12-understand-thinking-suffixes)
13. [Test models before configuring Claude Code](#13-test-models-before-configuring-claude-code)
14. [Create a reusable GPT profile](#14-create-a-reusable-gpt-profile)
15. [Create a reusable Antigravity profile](#15-create-a-reusable-antigravity-profile)
16. [Create launchers for PowerShell and CMD](#16-create-launchers-for-powershell-and-cmd)
17. [Use the commands from any project](#17-use-the-commands-from-any-project)
18. [Switch models inside Claude Code](#18-switch-models-inside-claude-code)
19. [Optional automatic startup](#19-optional-automatic-startup)
20. [Daily operating routine](#20-daily-operating-routine)
21. [Stop, update, and back up the setup](#21-stop-update-and-back-up-the-setup)
22. [Troubleshooting](#22-troubleshooting)
23. [Security checklist](#23-security-checklist)
24. [Command reference](#24-command-reference)

---

# 1. What this setup creates

The local request path is:

```text
Claude Code
    │
    │ Anthropic-compatible request
    ▼
CLIProxyAPI
http://127.0.0.1:8317
    │
    ├── Codex OAuth
    │      └── GPT models
    │
    └── Antigravity OAuth
           ├── Claude models
           └── Gemini models
```

The final Windows commands will be:

```text
cliproxy
cliproxy-ui
cliproxy-stop
claude-gpt
claude-antigravity
```

Their jobs are:

| Command | Purpose |
|---|---|
| `cliproxy` | Start CLIProxyAPI using the correct configuration file |
| `cliproxy-ui` | Open the local Management Center |
| `cliproxy-stop` | Stop CLIProxyAPI |
| `claude-gpt` | Start Claude Code using the GPT profile |
| `claude-antigravity` | Start Claude Code using the Antigravity Claude/Gemini profile |

The two Claude Code profiles remain separate:

```text
%USERPROFILE%\.claude-gpt
%USERPROFILE%\.claude-antigravity
```

Claude Code officially supports relocating its entire configuration directory with `CLAUDE_CONFIG_DIR`. That makes it useful for separate settings, histories, plugins, credentials, and sessions.

---

# 2. Requirements

You need:

- Windows 10 or Windows 11
- Windows PowerShell 5.1 or PowerShell 7
- Internet access
- Claude Code
- A ChatGPT account that can authenticate with Codex
- A Google account that can authenticate with Antigravity
- The latest Windows AMD64 build of CLIProxyAPI

This guide installs CLIProxyAPI under:

```text
C:\Users\<YOUR_WINDOWS_USERNAME>\CLIProxyAPI
```

The local endpoints are:

```text
Proxy base URL:
http://127.0.0.1:8317

OpenAI-compatible API:
http://127.0.0.1:8317/v1

Claude-compatible messages endpoint:
http://127.0.0.1:8317/v1/messages

Model list:
http://127.0.0.1:8317/v1/models

Management UI:
http://127.0.0.1:8317/management.html
```

---

# 3. Install Claude Code

## Recommended native PowerShell installer

Run:

```powershell
irm https://claude.ai/install.ps1 | iex
```

Verify:

```powershell
claude --version
claude doctor
```

## WinGet alternative

```powershell
winget install Anthropic.ClaudeCode
```

Update a WinGet installation with:

```powershell
winget upgrade Anthropic.ClaudeCode
```

Check where Windows found Claude Code:

```powershell
Get-Command claude |
    Select-Object Name, Source
```

From Command Prompt:

```cmd
where claude
```

If the installer completed but `claude` is not recognized, open a new terminal and check whether this location exists:

```powershell
Test-Path "$env:USERPROFILE\.local\bin\claude.exe"
```

---

# 4. Install CLIProxyAPI automatically

The following PowerShell installer:

1. Finds the latest CLIProxyAPI release.
2. Downloads the Windows AMD64 archive.
3. Extracts the release into your user profile.
4. Preserves an existing `config.yaml` during upgrades.
5. Creates a secure local configuration on a fresh installation.
6. Generates separate client and management credentials.
7. Restricts the server to localhost.
8. Adds the installation folder to the user `PATH`.
9. Creates `cliproxy`, `cliproxy-ui`, and `cliproxy-stop`.
10. Makes the commands available in the current terminal.

Open PowerShell and paste the entire block:

```powershell
$ErrorActionPreference = "Stop"

$repo = "router-for-me/CLIProxyAPI"
$installDir = Join-Path $env:USERPROFILE "CLIProxyAPI"
$downloadPath = Join-Path $env:TEMP "CLIProxyAPI-latest.zip"
$extractDir = Join-Path $env:TEMP "CLIProxyAPI-extracted"

Write-Host "Installing CLIProxyAPI into $installDir"

# Find the newest GitHub release.
$release = Invoke-RestMethod `
    -Uri "https://api.github.com/repos/$repo/releases/latest" `
    -Headers @{
        "User-Agent" = "CLIProxyAPI-Windows-Installer"
    }

# Find the 64-bit Windows ZIP.
$asset = $release.assets |
    Where-Object {
        $_.name -match "windows_amd64\.zip$"
    } |
    Select-Object -First 1

if (-not $asset) {
    throw "The latest release does not contain a Windows AMD64 ZIP."
}

# Download it.
Invoke-WebRequest `
    -Uri $asset.browser_download_url `
    -OutFile $downloadPath

# Prepare temporary extraction.
Remove-Item `
    -Path $extractDir `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

New-Item `
    -ItemType Directory `
    -Path $extractDir `
    -Force |
    Out-Null

New-Item `
    -ItemType Directory `
    -Path $installDir `
    -Force |
    Out-Null

Expand-Archive `
    -Path $downloadPath `
    -DestinationPath $extractDir `
    -Force

# Locate the actual release directory.
$exe = Get-ChildItem `
    -Path $extractDir `
    -Filter "cli-proxy-api.exe" `
    -Recurse |
    Select-Object -First 1

if (-not $exe) {
    throw "cli-proxy-api.exe was not found in the release archive."
}

$releaseFolder = Split-Path $exe.FullName -Parent

# Preserve an existing configuration during upgrades.
$configPath = Join-Path $installDir "config.yaml"
$hadExistingConfig = Test-Path $configPath
$configBackup = $null

if ($hadExistingConfig) {
    $configBackup = Join-Path `
        $env:TEMP `
        "CLIProxyAPI-config-preserved.yaml"

    Copy-Item `
        -Path $configPath `
        -Destination $configBackup `
        -Force
}

# Copy the newest release files.
Get-ChildItem `
    -Path $releaseFolder `
    -Force |
    Copy-Item `
        -Destination $installDir `
        -Recurse `
        -Force

# Restore the existing config, or create one from the example.
if ($configBackup -and (Test-Path $configBackup)) {
    Copy-Item `
        -Path $configBackup `
        -Destination $configPath `
        -Force
}
elseif (-not (Test-Path $configPath)) {
    $exampleConfig = Join-Path `
        $installDir `
        "config.example.yaml"

    if (-not (Test-Path $exampleConfig)) {
        throw "config.example.yaml was not found."
    }

    Copy-Item `
        -Path $exampleConfig `
        -Destination $configPath `
        -Force
}

$generatedSecrets = $false

# Create a secure local configuration on a fresh installation.
if (-not $hadExistingConfig) {
    function New-UrlSafeSecret {
        param(
            [Parameter(Mandatory)]
            [string]$Prefix,

            [int]$ByteLength = 32
        )

        $bytes = New-Object byte[] $ByteLength
        $rng = [Security.Cryptography.RandomNumberGenerator]::Create()

        try {
            $rng.GetBytes($bytes)
        }
        finally {
            $rng.Dispose()
        }

        $encoded = [Convert]::ToBase64String($bytes)
        $encoded = $encoded.TrimEnd("=")
        $encoded = $encoded.Replace("+", "-")
        $encoded = $encoded.Replace("/", "_")

        return "$Prefix$encoded"
    }

    $clientKey = New-UrlSafeSecret `
        -Prefix "cc-local-" `
        -ByteLength 32

    $managementKey = New-UrlSafeSecret `
        -Prefix "mgt-local-" `
        -ByteLength 36

    $configText = Get-Content `
        -Path $configPath `
        -Raw

    $hostPattern = [regex]'(?m)^host:\s*""\s*$'

    $managementPattern = [regex](
        '(?m)^\s{2}secret-key:\s*""\s*$'
    )

    $apiKeysPattern = [regex](
        '(?ms)^api-keys:\s*\r?\n' +
        '(?:\s{2}-\s*"your-api-key-\d+"\s*\r?\n?)+'
    )

    $configText = $hostPattern.Replace(
        $configText,
        'host: "127.0.0.1"',
        1
    )

    $configText = $managementPattern.Replace(
        $configText,
        '  secret-key: "' + $managementKey + '"',
        1
    )

    $apiKeyReplacement = (
        "api-keys:`r`n" +
        '  - "' + $clientKey + '"' +
        "`r`n"
    )

    $configText = $apiKeysPattern.Replace(
        $configText,
        $apiKeyReplacement,
        1
    )

    Set-Content `
        -Path $configPath `
        -Value $configText `
        -Encoding UTF8

    $generatedSecrets = $true
}

Unblock-File `
    -Path (Join-Path $installDir "cli-proxy-api.exe")

# Add the installation directory to the current PATH.
if (($env:Path -split ";") -notcontains $installDir) {
    $env:Path = "$env:Path;$installDir"
}

# Add it permanently to the user PATH.
$userPath = [Environment]::GetEnvironmentVariable(
    "Path",
    "User"
)

$userEntries = @(
    $userPath -split ";" |
    Where-Object {
        -not [string]::IsNullOrWhiteSpace($_)
    }
)

if ($userEntries -notcontains $installDir) {
    $newUserPath = ($userEntries + $installDir) -join ";"

    [Environment]::SetEnvironmentVariable(
        "Path",
        $newUserPath,
        "User"
    )
}

# Start the proxy with the correct absolute config path.
@'
@echo off
"%USERPROFILE%\CLIProxyAPI\cli-proxy-api.exe" --config "%USERPROFILE%\CLIProxyAPI\config.yaml" %*
'@ | Set-Content `
    -Path (Join-Path $installDir "cliproxy.cmd") `
    -Encoding ASCII

# Open the local Management UI.
@'
@echo off
start "" "http://127.0.0.1:8317/management.html"
'@ | Set-Content `
    -Path (Join-Path $installDir "cliproxy-ui.cmd") `
    -Encoding ASCII

# Force-stop the local proxy.
@'
@echo off
taskkill /IM cli-proxy-api.exe /F
'@ | Set-Content `
    -Path (Join-Path $installDir "cliproxy-stop.cmd") `
    -Encoding ASCII

Remove-Item `
    -Path $downloadPath `
    -Force `
    -ErrorAction SilentlyContinue

Remove-Item `
    -Path $extractDir `
    -Recurse `
    -Force `
    -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "CLIProxyAPI $($release.tag_name) installed."
Write-Host "Installation: $installDir"
Write-Host "Configuration: $configPath"

if ($generatedSecrets) {
    Write-Host ""
    Write-Host "SAVE THESE IN A PASSWORD MANAGER:"
    Write-Host "Client API key: $clientKey"
    Write-Host "Management key: $managementKey"
}

Write-Host ""
Write-Host "Global commands:"
Write-Host "  cliproxy"
Write-Host "  cliproxy-ui"
Write-Host "  cliproxy-stop"
Write-Host ""
Write-Host "Open a new terminal if a command is not recognized."
```

Verify:

```powershell
cli-proxy-api.exe --help
cliproxy --help
```

On an upgrade, the script preserves the existing `config.yaml` instead of rotating credentials without warning.

---

# 5. Understand the two passwords

CLIProxyAPI uses two different secrets.

## Client API key

Configured under:

```yaml
api-keys:
  - "YOUR_CLIENT_API_KEY"
```

Used by:

- Claude Code
- `curl.exe`
- `Invoke-RestMethod`
- Any application sending model requests

Claude Code receives it through:

```text
ANTHROPIC_AUTH_TOKEN
```

## Management key

Configured under:

```yaml
remote-management:
  secret-key: "YOUR_MANAGEMENT_KEY"
```

Used by:

- The browser Management Center
- Management API requests under `/v0/management`

Do not use the same value for both.

Do not use placeholder text such as:

```text
CHANGE-THIS-TO-A-STRONG-MANAGEMENT-PASSWORD
```

A placeholder becomes a terrible secret the moment someone decides to keep it literally.

---

# 6. Secure the local configuration

Open:

```powershell
notepad "$env:USERPROFILE\CLIProxyAPI\config.yaml"
```

Keep the full example file, but confirm these values:

```yaml
host: "127.0.0.1"
port: 8317

remote-management:
  allow-remote: false
  secret-key: "YOUR_RANDOM_MANAGEMENT_KEY"
  disable-control-panel: false
  panel-github-repository: "https://github.com/router-for-me/Cli-Proxy-API-Management-Center"

auth-dir: "~/.cli-proxy-api"

api-keys:
  - "YOUR_RANDOM_CLIENT_API_KEY"
```

Recommended local security values:

```yaml
host: "127.0.0.1"
allow-remote: false
ws-auth: true
```

Why:

- `127.0.0.1` restricts the server to the current computer.
- `allow-remote: false` restricts management access to localhost.
- `ws-auth: true` keeps WebSocket endpoints authenticated.

CLIProxyAPI supports hot reload for many configuration changes, but restarting after authentication, key rotation, or provider changes is a reliable way to eliminate stale runtime state.

---

# 7. Start CLIProxyAPI from anywhere

Run:

```powershell
cliproxy
```

Keep that terminal open while debugging.

Confirm the port:

```powershell
Test-NetConnection `
    -ComputerName 127.0.0.1 `
    -Port 8317
```

Expected:

```text
TcpTestSucceeded : True
```

Check the process:

```powershell
Get-Process `
    -Name "cli-proxy-api" `
    -ErrorAction SilentlyContinue
```

Check which process owns port 8317:

```powershell
$connection = Get-NetTCPConnection `
    -LocalPort 8317 `
    -State Listen `
    -ErrorAction SilentlyContinue

$connection

if ($connection) {
    Get-Process -Id $connection.OwningProcess
}
```

---

# 8. Open and understand the Management UI

Open:

```powershell
cliproxy-ui
```

Or visit:

```text
http://127.0.0.1:8317/management.html
```

Log in with:

```text
API address:
http://127.0.0.1:8317

Password:
The value under remote-management.secret-key
```

The official Management Center is served from `/management.html`. It stores connection information in browser storage. If password remembering is enabled, treat the browser profile as trusted. Browser storage is convenience, not a hardware security module wearing a browser tab.

## Dashboard

Use it to inspect:

- Server version
- Credential counts
- Active provider families
- Runtime status
- Available-model summary

## Quick Start

Use it to inspect or create basic API-key and function setups.

## AI Providers

Use this area for direct upstream API-key providers such as:

- Claude API keys
- Gemini API keys
- Codex API keys
- xAI API keys
- OpenAI-compatible endpoints
- Vertex-compatible endpoints

This page is not where OAuth-backed Antigravity credentials are created.

## Auth Files

Use it to:

- Confirm OAuth credential files exist
- Inspect provider type
- Remove expired credentials
- Configure per-credential aliases when supported
- Configure excluded models
- Download or upload auth files

Treat downloaded auth files as passwords.

## OAuth Login

Use it to initiate OAuth flows available in the installed Management Center version.

If an OAuth callback fails in the browser, use the corresponding CLI login command instead.

## Quota Management

Use it to inspect:

- Credential quota status
- Cooldown state
- Provider fallback state
- Account switching behavior

## Logs Viewer

Use it when:

- A request returns 401
- A model cannot be found
- An upstream credential expires
- Streaming stops unexpectedly
- Tool schemas are rejected
- A model is cooled down

## Config Panel

Use it to edit:

- Client API keys
- Logging
- Retry behavior
- Proxy URL
- Routing
- Model aliases
- Excluded models
- Raw YAML

## Plugins

Only enable plugins you trust. A plugin loaded into the Management Center origin may be able to access the same browser-stored management context.

---

# 9. Authenticate Codex and Antigravity

You can authenticate through the UI when the installed Management Center supports the complete flow, or use CLI commands.

## Codex OAuth from PowerShell

Stop the running proxy first if the login command requires exclusive access:

```powershell
cliproxy-stop
```

Run:

```powershell
cliproxy --codex-login
```

If no browser opens:

```powershell
cliproxy --codex-login --no-browser
```

After login:

```powershell
cliproxy
```

## Antigravity OAuth from PowerShell

Run:

```powershell
cliproxy-stop
cliproxy --antigravity-login
```

If no browser opens:

```powershell
cliproxy --antigravity-login --no-browser
```

Then restart:

```powershell
cliproxy
```

## OAuth through the UI

1. Start CLIProxyAPI.
2. Open **OAuth Login**.
3. Choose the provider.
4. Start the login.
5. Complete the browser flow.
6. Open **Auth Files**.
7. Confirm that the new credential exists.
8. Refresh the model list.
9. Restart CLIProxyAPI if the new models do not appear.

Authentication files normally live under:

```text
%USERPROFILE%\.cli-proxy-api
```

Confirm Antigravity credentials exist without printing their contents:

```powershell
Get-ChildItem `
    -Path "$env:USERPROFILE\.cli-proxy-api" `
    -Filter "*.json" `
    -File |
    Select-String `
        -Pattern '"type"\s*:\s*"antigravity"' `
        -List |
    Select-Object Path
```

---

# 10. Why AI Providers → Claude is not Antigravity

The **New · Claude** form under **AI Providers** asks for fields such as:

```text
API key
Base URL
Proxy URL
Prefix
Request headers
Custom models
Excluded models
```

That form creates a direct `claude-api-key` provider entry.

It is appropriate when you have:

- An Anthropic API key
- A compatible Claude endpoint
- A custom upstream Base URL

It is not required for Antigravity OAuth.

For Antigravity:

```text
OAuth Login
    ↓
Antigravity credential
    ↓
Auth Files
    ↓
Claude and Gemini models appear in /v1/models
```

Therefore:

```text
AI Providers → Claude:
Leave empty for an OAuth-only Antigravity setup.

OAuth Login:
Use for Antigravity authentication.

Auth Files:
Confirm the OAuth credential.

Available Models:
Confirm Claude and Gemini model IDs.
```

Do not paste the CLIProxyAPI client key into the **New · Claude** API-key field. That would make the gateway attempt to use its own downstream key as an upstream provider credential.

---

# 11. List and verify available models

## PowerShell with a direct key assignment

```powershell
$proxyKey = "YOUR_CLIENT_API_KEY"

$models = Invoke-RestMethod `
    -Uri "http://127.0.0.1:8317/v1/models" `
    -Headers @{
        Authorization = "Bearer $proxyKey"
    }

$models.data |
    Sort-Object id |
    Format-Table id, owned_by -AutoSize
```

## PowerShell with a secure prompt

```powershell
$proxyKey = Read-Host `
    "Paste your CLIProxyAPI client API key"
```

At the prompt, paste the key and press Enter.

Then:

```powershell
$models = Invoke-RestMethod `
    -Uri "http://127.0.0.1:8317/v1/models" `
    -Headers @{
        Authorization = "Bearer $proxyKey"
    }
```

## Important `Read-Host` mistake

This is wrong:

```powershell
$proxyKey = Read-Host "cc-local-your-real-key"
```

The quoted text is only the prompt label. If you press Enter without typing anything afterward, `$proxyKey` becomes empty.

This is correct:

```powershell
$proxyKey = Read-Host "Paste your client API key"
```

Then paste the key when PowerShell displays the prompt.

Or assign it directly:

```powershell
$proxyKey = "YOUR_CLIENT_API_KEY"
```

## Filter Antigravity models

```powershell
$models.data |
    Where-Object {
        $_.id -match "claude|gemini"
    } |
    Sort-Object id |
    Format-Table id, owned_by -AutoSize
```

## Filter GPT models

```powershell
$models.data |
    Where-Object {
        $_.id -match "^gpt-|codex"
    } |
    Sort-Object id |
    Format-Table id, owned_by -AutoSize
```

## Example model catalogue observed in one setup

The exact catalogue changes. In one July 2026 setup, CLIProxyAPI exposed:

```text
GPT:
gpt-5.4-mini
gpt-5.4
gpt-5.5
gpt-5.6-terra
gpt-5.6-luna

Claude:
claude-opus-4-6-thinking
claude-sonnet-4-6

Gemini:
gemini-3.5-flash-low
gemini-3.5-flash-extra-low
```

Use the IDs returned by your own server. Tutorials age. Model catalogues age faster and with considerably more branding.

---

# 12. Understand thinking suffixes

CLIProxyAPI accepts thinking or reasoning instructions in parentheses after a model name.

Examples:

```text
claude-opus-4-6-thinking(high)
gemini-3.5-flash-low(high)
gpt-5.5(high)
```

Supported level presets include:

| Suffix | Approximate budget | Intended use |
|---|---:|---|
| `(minimal)` | 512 | Lowest-cost reasoning |
| `(low)` | 1,024 | Fast reasoning |
| `(medium)` | 8,192 | Normal reasoning |
| `(high)` | 24,576 | Deep reasoning |
| `(xhigh)` | 32,768 | Extra-deep reasoning |
| `(auto)` | Provider-dependent | Let the provider choose |
| `(none)` | 0, or provider minimum | Request no thinking |

Examples:

```text
claude-opus-4-6-thinking(high)
```

CLIProxyAPI normalizes the model name and applies a Claude thinking budget.

```text
gemini-3.5-flash-low(high)
```

CLIProxyAPI routes to `gemini-3.5-flash-low` and requests a high Gemini thinking budget.

The suffixed version may not appear in `/v1/models`. It is a per-request routing instruction, not necessarily a separately advertised model.

Unsupported settings may be:

- Dropped
- Clamped to the supported range
- Rejected with HTTP 400

Always test the exact suffixed model before saving it in Claude Code.

---

# 13. Test models before configuring Claude Code

Load the key:

```powershell
$proxyKey = Read-Host `
    "Paste your CLIProxyAPI client API key"
```

Create the test function:

```powershell
function Test-CLIProxyModel {
    param(
        [Parameter(Mandatory)]
        [string]$Model
    )

    Write-Host ""
    Write-Host "Testing: $Model"

    $headers = @{
        Authorization       = "Bearer $proxyKey"
        "anthropic-version" = "2023-06-01"
        "content-type"      = "application/json"
    }

    $body = @{
        model      = $Model
        max_tokens = 1000

        messages = @(
            @{
                role    = "user"
                content = "Reply with exactly: MODEL WORKING"
            }
        )
    } |
        ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod `
            -Uri "http://127.0.0.1:8317/v1/messages" `
            -Method Post `
            -Headers $headers `
            -Body $body

        $response.content |
            Where-Object {
                $_.text
            } |
            ForEach-Object {
                $_.text
            }

        Write-Host "SUCCESS: $Model"
    }
    catch {
        Write-Host "FAILED: $Model"
        Write-Host $_.Exception.Message

        if ($_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message
        }
    }
}
```

## Test the GPT mapping

```powershell
Test-CLIProxyModel "gpt-5.6-terra"
Test-CLIProxyModel "gpt-5.5"
Test-CLIProxyModel "gpt-5.4-mini"
```

## Test the Antigravity mapping

```powershell
Test-CLIProxyModel `
    "claude-opus-4-6-thinking(high)"

Test-CLIProxyModel `
    "claude-sonnet-4-6"

Test-CLIProxyModel `
    "gemini-3.5-flash-low(high)"
```

Expected:

```text
MODEL WORKING
SUCCESS: claude-opus-4-6-thinking(high)

MODEL WORKING
SUCCESS: claude-sonnet-4-6

MODEL WORKING
SUCCESS: gemini-3.5-flash-low(high)
```

Do not create the permanent profile until all selected models succeed.

---

# 14. Create a reusable GPT profile

Create:

```text
%USERPROFILE%\.claude-gpt\settings.json
```

Run:

```powershell
$profileDir = "$env:USERPROFILE\.claude-gpt"
$settingsPath = Join-Path $profileDir "settings.json"

New-Item `
    -ItemType Directory `
    -Path $profileDir `
    -Force |
    Out-Null

$proxyKey = Read-Host `
    "Paste your CLIProxyAPI client API key"

$settings = [ordered]@{
    model = "opus"

    env = [ordered]@{
        ANTHROPIC_BASE_URL =
            "http://127.0.0.1:8317"

        ANTHROPIC_AUTH_TOKEN =
            $proxyKey

        ANTHROPIC_DEFAULT_OPUS_MODEL =
            "gpt-5.6-terra"

        ANTHROPIC_DEFAULT_SONNET_MODEL =
            "gpt-5.5"

        ANTHROPIC_DEFAULT_HAIKU_MODEL =
            "gpt-5.4-mini"
    }
}

$settings |
    ConvertTo-Json -Depth 20 |
    Set-Content `
        -Path $settingsPath `
        -Encoding UTF8

Write-Host "Created GPT profile:"
Write-Host $settingsPath
```

The mapping is:

```text
opus   → gpt-5.6-terra
sonnet → gpt-5.5
haiku  → gpt-5.4-mini
```

The top-level setting:

```json
"model": "opus"
```

makes `opus` the permanent default unless overridden by:

- `/model`
- `claude --model ...`
- `ANTHROPIC_MODEL`

Claude Code model selection precedence is:

```text
/model during the session
    ↓
--model at startup
    ↓
ANTHROPIC_MODEL
    ↓
"model" in settings.json
```

---

# 15. Create a reusable Antigravity profile

Create:

```text
%USERPROFILE%\.claude-antigravity\settings.json
```

Run:

```powershell
$profileDir = "$env:USERPROFILE\.claude-antigravity"
$settingsPath = Join-Path $profileDir "settings.json"

New-Item `
    -ItemType Directory `
    -Path $profileDir `
    -Force |
    Out-Null

$proxyKey = Read-Host `
    "Paste your CLIProxyAPI client API key"

$settings = [ordered]@{
    model = "opus"

    env = [ordered]@{
        ANTHROPIC_BASE_URL =
            "http://127.0.0.1:8317"

        ANTHROPIC_AUTH_TOKEN =
            $proxyKey

        ANTHROPIC_DEFAULT_OPUS_MODEL =
            "claude-opus-4-6-thinking(high)"

        ANTHROPIC_DEFAULT_SONNET_MODEL =
            "claude-sonnet-4-6"

        ANTHROPIC_DEFAULT_HAIKU_MODEL =
            "gemini-3.5-flash-low(high)"
    }
}

$settings |
    ConvertTo-Json -Depth 20 |
    Set-Content `
        -Path $settingsPath `
        -Encoding UTF8

Write-Host "Created Antigravity profile:"
Write-Host $settingsPath
```

The mapping is:

```text
opus
→ claude-opus-4-6-thinking(high)

sonnet
→ claude-sonnet-4-6

haiku
→ gemini-3.5-flash-low(high)
```

Recommended uses:

| Alias | Actual model | Suggested use |
|---|---|---|
| `opus` | `claude-opus-4-6-thinking(high)` | Architecture, planning, difficult debugging, repository-wide work |
| `sonnet` | `claude-sonnet-4-6` | Normal implementation, editing, refactoring |
| `haiku` | `gemini-3.5-flash-low(high)` | Fast inspection, summaries, searches, lightweight agents |

Inspect the profile without displaying unrelated secrets elsewhere:

```powershell
Get-Content `
    "$env:USERPROFILE\.claude-antigravity\settings.json"
```

Do not commit profile settings containing `ANTHROPIC_AUTH_TOKEN`.

---

# 16. Create launchers for PowerShell and CMD

A clean launcher design should avoid giving a `.ps1` and `.cmd` file the same basename.

Why:

- PowerShell may resolve the `.ps1`.
- Command Prompt resolves the `.cmd`.
- `Get-Command` and `where.exe` then appear to disagree.
- Both are technically correct, which is the least useful kind of correct.

Use internal scripts named:

```text
invoke-claude-gpt.ps1
invoke-claude-antigravity.ps1
```

Expose public commands named:

```text
claude-gpt.cmd
claude-antigravity.cmd
```

This gives both PowerShell and CMD one consistent public command.

## Shared launcher behavior

Each launcher:

1. Checks whether port 8317 is listening.
2. Starts CLIProxyAPI when necessary.
3. Waits until the proxy is ready.
4. Sets `CLAUDE_CONFIG_DIR`.
5. Launches Claude Code with `opus`.
6. Passes through extra Claude Code arguments.

## Create the GPT launcher

```powershell
$launcherDir = "$env:USERPROFILE\CLIProxyAPI"
$scriptPath = Join-Path `
    $launcherDir `
    "invoke-claude-gpt.ps1"

@'
$ErrorActionPreference = "Stop"

$proxyExe = "$env:USERPROFILE\CLIProxyAPI\cli-proxy-api.exe"
$configPath = "$env:USERPROFILE\CLIProxyAPI\config.yaml"
$profileDir = "$env:USERPROFILE\.claude-gpt"

function Wait-ForCLIProxy {
    param(
        [int]$Port = 8317,
        [int]$Attempts = 40,
        [int]$DelayMilliseconds = 250
    )

    for ($attempt = 0; $attempt -lt $Attempts; $attempt++) {
        $listener = Get-NetTCPConnection `
            -LocalPort $Port `
            -State Listen `
            -ErrorAction SilentlyContinue

        if ($listener) {
            return $true
        }

        Start-Sleep -Milliseconds $DelayMilliseconds
    }

    return $false
}

$listener = Get-NetTCPConnection `
    -LocalPort 8317 `
    -State Listen `
    -ErrorAction SilentlyContinue

if (-not $listener) {
    Write-Host "Starting CLIProxyAPI..."

    Start-Process `
        -FilePath $proxyExe `
        -ArgumentList @(
            "--config",
            "`"$configPath`""
        ) `
        -WorkingDirectory (Split-Path $proxyExe) `
        -WindowStyle Hidden

    if (-not (Wait-ForCLIProxy)) {
        throw "CLIProxyAPI did not start on port 8317."
    }
}

$env:CLAUDE_CONFIG_DIR = $profileDir

Write-Host "Claude profile: GPT"
Write-Host "Starting alias: opus"
Write-Host ""

& claude --model opus @args
'@ | Set-Content `
    -Path $scriptPath `
    -Encoding UTF8
```

Create the CMD wrapper:

```powershell
@'
@echo off
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%USERPROFILE%\CLIProxyAPI\invoke-claude-gpt.ps1" %*
exit /b %ERRORLEVEL%
'@ | Set-Content `
    -Path "$env:USERPROFILE\CLIProxyAPI\claude-gpt.cmd" `
    -Encoding ASCII
```

## Create the Antigravity launcher

```powershell
$launcherDir = "$env:USERPROFILE\CLIProxyAPI"
$scriptPath = Join-Path `
    $launcherDir `
    "invoke-claude-antigravity.ps1"

@'
$ErrorActionPreference = "Stop"

$proxyExe = "$env:USERPROFILE\CLIProxyAPI\cli-proxy-api.exe"
$configPath = "$env:USERPROFILE\CLIProxyAPI\config.yaml"
$profileDir = "$env:USERPROFILE\.claude-antigravity"

function Wait-ForCLIProxy {
    param(
        [int]$Port = 8317,
        [int]$Attempts = 40,
        [int]$DelayMilliseconds = 250
    )

    for ($attempt = 0; $attempt -lt $Attempts; $attempt++) {
        $listener = Get-NetTCPConnection `
            -LocalPort $Port `
            -State Listen `
            -ErrorAction SilentlyContinue

        if ($listener) {
            return $true
        }

        Start-Sleep -Milliseconds $DelayMilliseconds
    }

    return $false
}

$listener = Get-NetTCPConnection `
    -LocalPort 8317 `
    -State Listen `
    -ErrorAction SilentlyContinue

if (-not $listener) {
    Write-Host "Starting CLIProxyAPI..."

    Start-Process `
        -FilePath $proxyExe `
        -ArgumentList @(
            "--config",
            "`"$configPath`""
        ) `
        -WorkingDirectory (Split-Path $proxyExe) `
        -WindowStyle Hidden

    if (-not (Wait-ForCLIProxy)) {
        throw "CLIProxyAPI did not start on port 8317."
    }
}

$env:CLAUDE_CONFIG_DIR = $profileDir

Write-Host "Claude profile: Antigravity"
Write-Host "Starting alias: opus"
Write-Host ""

& claude --model opus @args
'@ | Set-Content `
    -Path $scriptPath `
    -Encoding UTF8
```

Create its CMD wrapper:

```powershell
@'
@echo off
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%USERPROFILE%\CLIProxyAPI\invoke-claude-antigravity.ps1" %*
exit /b %ERRORLEVEL%
'@ | Set-Content `
    -Path "$env:USERPROFILE\CLIProxyAPI\claude-antigravity.cmd" `
    -Encoding ASCII
```

## Migrate an existing same-name launcher

If you already created:

```text
claude-antigravity.ps1
claude-antigravity.cmd
```

remove the ambiguity:

```powershell
$launcherDir = "$env:USERPROFILE\CLIProxyAPI"

if (Test-Path "$launcherDir\claude-antigravity.ps1") {
    Move-Item `
        -Path "$launcherDir\claude-antigravity.ps1" `
        -Destination "$launcherDir\invoke-claude-antigravity.ps1" `
        -Force
}
```

Then recreate `claude-antigravity.cmd` so it points to:

```text
invoke-claude-antigravity.ps1
```

## Add the launcher folder to PATH

Current terminal:

```powershell
$launcherDir = "$env:USERPROFILE\CLIProxyAPI"

if (($env:Path -split ";") -notcontains $launcherDir) {
    $env:Path += ";$launcherDir"
}
```

Permanent user PATH:

```powershell
$launcherDir = "$env:USERPROFILE\CLIProxyAPI"

$userPath = [Environment]::GetEnvironmentVariable(
    "Path",
    "User"
)

$userEntries = @(
    $userPath -split ";" |
    Where-Object {
        -not [string]::IsNullOrWhiteSpace($_)
    }
)

if ($userEntries -notcontains $launcherDir) {
    [Environment]::SetEnvironmentVariable(
        "Path",
        ($userEntries + $launcherDir) -join ";",
        "User"
    )
}
```

Open a new terminal after a permanent PATH change.

## Verify in PowerShell

```powershell
Get-Command claude-gpt
Get-Command claude-antigravity
```

Expected source:

```text
C:\Users\<YOU>\CLIProxyAPI\claude-gpt.cmd
C:\Users\<YOU>\CLIProxyAPI\claude-antigravity.cmd
```

## Verify in Command Prompt

```cmd
where claude-gpt
where claude-antigravity
```

Expected:

```text
C:\Users\<YOU>\CLIProxyAPI\claude-gpt.cmd
C:\Users\<YOU>\CLIProxyAPI\claude-antigravity.cmd
```

---

# 17. Use the commands from any project

## PowerShell

```powershell
cd "D:\projects\my-app"
claude-gpt
```

Or:

```powershell
cd "D:\projects\my-app"
claude-antigravity
```

## Command Prompt

Use `/d` when changing drives:

```cmd
cd /d D:\projects\my-app
claude-gpt
```

Or:

```cmd
cd /d D:\projects\my-app
claude-antigravity
```

## Pass Claude Code arguments

```powershell
claude-antigravity --model sonnet
```

```powershell
claude-antigravity --model haiku
```

```cmd
claude-gpt --model sonnet
```

The launcher normally uses:

```text
--model opus
```

That startup flag ensures a new launch starts on the configured `opus` mapping.

---

# 18. Switch models inside Claude Code

Open the picker:

```text
/model
```

Switch to the main model:

```text
/model opus
```

Switch to the normal model:

```text
/model sonnet
```

Switch to the fast model:

```text
/model haiku
```

Check status:

```text
/status
```

## GPT profile mapping

```text
opus   → gpt-5.6-terra
sonnet → gpt-5.5
haiku  → gpt-5.4-mini
```

## Antigravity profile mapping

```text
opus   → claude-opus-4-6-thinking(high)
sonnet → claude-sonnet-4-6
haiku  → gemini-3.5-flash-low(high)
```

A model selected with `/model` applies immediately during the session.

The next invocation of:

```text
claude-antigravity
```

starts with `opus` again because the launcher passes:

```text
claude --model opus
```

---

# 19. Optional automatic startup

The profile launchers already start CLIProxyAPI when port 8317 is not listening. That is sufficient for most users.

To start CLIProxyAPI automatically at Windows login, create a Scheduled Task.

```powershell
$taskName = "CLIProxyAPI"
$exe = "$env:USERPROFILE\CLIProxyAPI\cli-proxy-api.exe"
$config = "$env:USERPROFILE\CLIProxyAPI\config.yaml"
$workingDirectory = "$env:USERPROFILE\CLIProxyAPI"

$action = New-ScheduledTaskAction `
    -Execute $exe `
    -ArgumentList "--config `"$config`"" `
    -WorkingDirectory $workingDirectory

$trigger = New-ScheduledTaskTrigger `
    -AtLogOn

$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Limited

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Principal $principal `
    -Description "Start CLIProxyAPI at user logon." `
    -Force
```

Start it now:

```powershell
Start-ScheduledTask `
    -TaskName "CLIProxyAPI"
```

Inspect:

```powershell
Get-ScheduledTask `
    -TaskName "CLIProxyAPI"
```

Stop:

```powershell
Stop-ScheduledTask `
    -TaskName "CLIProxyAPI"
```

Remove:

```powershell
Unregister-ScheduledTask `
    -TaskName "CLIProxyAPI" `
    -Confirm:$false
```

Do not combine multiple automatic-start methods unless you enjoy debugging duplicate processes and occupied ports.

---

# 20. Daily operating routine

## Simplest GPT workflow

```powershell
cd "D:\projects\my-app"
claude-gpt
```

## Simplest Antigravity workflow

```powershell
cd "D:\projects\my-app"
claude-antigravity
```

## Open the UI

```powershell
cliproxy-ui
```

## Manual debugging workflow

Terminal 1:

```powershell
cliproxy
```

Terminal 2:

```powershell
$env:CLAUDE_CONFIG_DIR =
    "$env:USERPROFILE\.claude-antigravity"

claude --model opus
```

The visible proxy terminal is better for troubleshooting because you can watch credential loading, routing, and upstream errors.

---

# 21. Stop, update, and back up the setup

## Exit Claude Code

```text
/exit
```

## Stop CLIProxyAPI

If it is running in a visible terminal:

```text
Ctrl+C
```

From any terminal:

```powershell
cliproxy-stop
```

PowerShell alternative:

```powershell
Stop-Process `
    -Name "cli-proxy-api" `
    -Force `
    -ErrorAction SilentlyContinue
```

## Back up configuration

```powershell
Copy-Item `
    "$env:USERPROFILE\CLIProxyAPI\config.yaml" `
    "$env:USERPROFILE\CLIProxyAPI\config.backup.yaml" `
    -Force
```

## Back up OAuth credentials

```powershell
Copy-Item `
    "$env:USERPROFILE\.cli-proxy-api" `
    "$env:USERPROFILE\.cli-proxy-api-backup" `
    -Recurse `
    -Force
```

## Back up Claude profiles

```powershell
Copy-Item `
    "$env:USERPROFILE\.claude-gpt" `
    "$env:USERPROFILE\.claude-gpt-backup" `
    -Recurse `
    -Force

Copy-Item `
    "$env:USERPROFILE\.claude-antigravity" `
    "$env:USERPROFILE\.claude-antigravity-backup" `
    -Recurse `
    -Force
```

## Update CLIProxyAPI

1. Stop CLIProxyAPI.
2. Create backups.
3. Run the installation script again.
4. Confirm `config.yaml` was preserved.
5. Start CLIProxyAPI.
6. Refresh `/v1/models`.
7. Test the selected model mappings.
8. Launch both Claude profiles.

---

# 22. Troubleshooting

## 22.1 `401 Invalid API key`

Symptoms:

```text
The remote server returned an error: (401) Unauthorized.
{"error":"Invalid API key"}
```

First test `/v1/models`:

```powershell
$proxyKey = Read-Host `
    "Paste your CLIProxyAPI client API key"

Invoke-RestMethod `
    -Uri "http://127.0.0.1:8317/v1/models" `
    -Headers @{
        Authorization = "Bearer $proxyKey"
    }
```

Common causes:

- `$proxyKey` is empty.
- The wrong key was used.
- The management password was used instead of the client key.
- `config.yaml` changed but the running process is stale.
- The key in Claude Code settings does not match `api-keys`.

Inspect whether the variable is empty without printing it:

```powershell
if ([string]::IsNullOrWhiteSpace($proxyKey)) {
    Write-Host "The key is empty."
}
else {
    Write-Host "Key loaded. Length: $($proxyKey.Length)"
}
```

Load the key from a profile:

```powershell
$profile = Get-Content `
    "$env:USERPROFILE\.claude-antigravity\settings.json" `
    -Raw |
    ConvertFrom-Json

$proxyKey = $profile.env.ANTHROPIC_AUTH_TOKEN
```

## 22.2 The key itself was entered as a command

This produces:

```text
The term 'cc-local-...' is not recognized
```

A key is data, not a command.

Correct:

```powershell
$proxyKey = "YOUR_CLIENT_API_KEY"
```

Or:

```powershell
$proxyKey = Read-Host "Paste your client API key"
```

## 22.3 Only GPT models appear after Antigravity login

Symptoms:

```text
/v1/models shows GPT models
Claude and Gemini models are missing
```

Restart the proxy visibly:

```powershell
cliproxy-stop
cliproxy
```

Then refresh:

```powershell
$models = Invoke-RestMethod `
    -Uri "http://127.0.0.1:8317/v1/models" `
    -Headers @{
        Authorization = "Bearer $proxyKey"
    }

$models.data |
    Where-Object {
        $_.id -match "claude|gemini"
    } |
    Format-Table id, owned_by
```

Confirm the Antigravity auth file exists.

If necessary, repeat:

```powershell
cliproxy-stop
cliproxy --antigravity-login
cliproxy
```

## 22.4 `claude-antigravity` is not recognized

Check the files:

```powershell
Get-ChildItem `
    "$env:USERPROFILE\CLIProxyAPI\*claude*"
```

Check PATH:

```powershell
$env:Path -split ";" |
    Where-Object {
        $_ -match "CLIProxyAPI"
    }
```

Add it to the current terminal:

```powershell
$env:Path += ";$env:USERPROFILE\CLIProxyAPI"
```

Open a new terminal after permanent PATH changes.

Verify:

```powershell
Get-Command claude-antigravity
```

CMD:

```cmd
where claude-antigravity
```

## 22.5 PowerShell finds `.ps1`, CMD finds `.cmd`

This happens when both files have the same basename:

```text
claude-antigravity.ps1
claude-antigravity.cmd
```

PowerShell may resolve the `.ps1`, while CMD resolves the `.cmd`.

Use:

```text
invoke-claude-antigravity.ps1
claude-antigravity.cmd
```

Then both shells use the public `.cmd` command consistently.

## 22.6 Management UI returns 404

Confirm:

```yaml
remote-management:
  secret-key: "NOT_EMPTY"
  disable-control-panel: false
```

Restart:

```powershell
cliproxy-stop
cliproxy
```

Open:

```text
http://127.0.0.1:8317/management.html
```

## 22.7 Management UI rejects the password

Use the management key:

```yaml
remote-management:
  secret-key:
```

Do not use:

```yaml
api-keys:
```

If the server hashes or transforms the stored management value internally, continue using the original plaintext password that you generated.

## 22.8 Model not found

Refresh `/v1/models` and copy the exact ID.

```powershell
$models.data |
    Sort-Object id |
    Select-Object id, owned_by
```

If using a suffix:

```text
gemini-3.5-flash-low(high)
```

verify that the base model exists:

```text
gemini-3.5-flash-low
```

## 22.9 Gemini high thinking fails

Replace:

```text
gemini-3.5-flash-low(high)
```

with:

```text
gemini-3.5-flash-low
```

The provider may reject or clamp unsupported thinking levels.

## 22.10 Claude Code starts on the wrong model

Inspect:

```powershell
Get-Content `
    "$env:USERPROFILE\.claude-antigravity\settings.json"
```

Confirm:

```json
"model": "opus"
```

Confirm:

```json
"ANTHROPIC_DEFAULT_OPUS_MODEL":
"claude-opus-4-6-thinking(high)"
```

Check whether the launcher contains:

```powershell
claude --model opus
```

Inside Claude Code:

```text
/status
/model
```

Remember the precedence:

```text
/model
--model
ANTHROPIC_MODEL
settings.json model
```

## 22.11 Port 8317 is occupied

```powershell
$connection = Get-NetTCPConnection `
    -LocalPort 8317 `
    -ErrorAction SilentlyContinue

$connection

if ($connection) {
    Get-Process -Id $connection.OwningProcess
}
```

Stop the duplicate process before starting another one.

## 22.12 Hidden launcher starts the wrong config

The launcher must pass the absolute path:

```powershell
--config "$env:USERPROFILE\CLIProxyAPI\config.yaml"
```

Do not rely on the current working directory.

## 22.13 Tool calls fail only on Antigravity

A model can answer simple text requests while rejecting a tool schema or streaming payload.

Use the Logs Viewer and reproduce with:

- A simple text prompt
- A file-reading request
- A Bash tool request
- An MCP request

This distinguishes model availability from full Claude Code protocol compatibility.

---

# 23. Security checklist

- Bind CLIProxyAPI to `127.0.0.1`.
- Keep remote management disabled.
- Keep WebSocket authentication enabled.
- Use separate random client and management keys.
- Never publish `config.yaml`.
- Never publish Claude profile `settings.json` files containing tokens.
- Never publish `.cli-proxy-api`.
- Never include real keys in a blog screenshot.
- Rotate keys exposed in chat, terminal recordings, issue reports, or repositories.
- Do not paste the client key into an upstream provider form.
- Do not reuse placeholder passwords.
- Review plugins before enabling them.
- Back up OAuth credentials securely.
- Test both model output and tool calling after upgrades.
- Treat this as an unofficial compatibility workflow.

## Rotate the client API key

1. Open **Config Panel**.
2. Replace the entry under `api-keys`.
3. Save.
4. Restart CLIProxyAPI.
5. Update:
   - `.claude-gpt\settings.json`
   - `.claude-antigravity\settings.json`
6. Test `/v1/models`.
7. Test all selected models.

---

# 24. Command reference

## Start the proxy

```powershell
cliproxy
```

## Open the UI

```powershell
cliproxy-ui
```

## Stop the proxy

```powershell
cliproxy-stop
```

## Codex login

```powershell
cliproxy --codex-login
```

## Antigravity login

```powershell
cliproxy --antigravity-login
```

## List models

```powershell
curl.exe "http://127.0.0.1:8317/v1/models" `
  -H "Authorization: Bearer YOUR_CLIENT_API_KEY"
```

## Start the GPT profile

```powershell
claude-gpt
```

## Start the Antigravity profile

```powershell
claude-antigravity
```

## CMD from another drive

```cmd
cd /d D:\projects\my-app
claude-antigravity
```

## Switch models

```text
/model opus
/model sonnet
/model haiku
```

## Inspect status

```text
/status
/model
```

## Test a model

```powershell
Test-CLIProxyModel `
    "claude-opus-4-6-thinking(high)"
```

---

# Final result

The completed workflow is:

```text
Open a terminal in any project
    ↓
claude-gpt
or
claude-antigravity
    ↓
The launcher starts CLIProxyAPI if necessary
    ↓
CLAUDE_CONFIG_DIR selects the correct profile
    ↓
Claude Code starts with opus
    ↓
opus maps to the chosen upstream model
```

For GPT:

```text
opus   → gpt-5.6-terra
sonnet → gpt-5.5
haiku  → gpt-5.4-mini
```

For Antigravity:

```text
opus   → claude-opus-4-6-thinking(high)
sonnet → claude-sonnet-4-6
haiku  → gemini-3.5-flash-low(high)
```

The Management UI controls the gateway:

```text
OAuth accounts
Auth files
Client API keys
Provider configuration
Model discovery
Aliases
Excluded models
Logs
Quota and cooldown state
```

Claude Code profiles control the client:

```text
Gateway URL
Client bearer token
Alias-to-model mapping
Default model
Per-session switching
Session history and plugins
```

Once configured, the daily experience is one command. Reaching that one command merely required OAuth, two passwords, a local gateway, model translation, separate profiles, Windows PATH, PowerShell, CMD wrappers, and a small amount of ceremony. Software continues to define convenience with impressive confidence.       

---

# Official references

- [CLIProxyAPI repository](https://github.com/router-for-me/CLIProxyAPI)        
- [CLIProxyAPI documentation](https://help.router-for.me/)
- [CLIProxyAPI basic configuration](https://help.router-for.me/configuration/basic)
- [CLIProxyAPI thinking suffixes](https://help.router-for.me/configuration/thinking)
- [CLIProxyAPI Management Center](https://help.router-for.me/management/webui)  
- [Claude Code environment variables](https://code.claude.com/docs/en/env-vars) 
- [Claude Code model configuration](https://code.claude.com/docs/en/model-config)
- [Claude Code settings](https://code.claude.com/docs/en/settings)
- [Claude Code configuration directory](https://code.claude.com/docs/en/claude-directory)
