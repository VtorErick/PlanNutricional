#Requires -Version 5.1
<#
.SYNOPSIS
    Construye la aplicación para producción (Android/iOS).

.DESCRIPTION
    Este script compila la aplicación usando EAS Build para
    generar APKs o AABs listos para distribución.

.PARAMETER Platform
    Plataforma: 'android' o 'ios'

.PARAMETER Profile
    Perfil de build: 'development', 'preview' o 'production'

.PARAMETER Local
    Realiza el build localmente (solo Android)

.PARAMETER Apk
    Genera APK en lugar de AAB (solo preview Android)

.EXAMPLE
    .\Build-App.ps1 -Platform android -Profile preview
    Build de Android en modo preview

.EXAMPLE
    .\Build-App.ps1 -Platform android -Profile production -Apk
    Build de producción como APK
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('android', 'ios')]
    [string]$Platform,

    [Parameter(Mandatory = $true)]
    [ValidateSet('development', 'preview', 'production')]
    [string]$BuildProfile,

    [Parameter()]
    [switch]$Local,

    [Parameter()]
    [switch]$Apk
)

$ErrorActionPreference = 'Stop'
$AppPath = Join-Path $PSScriptRoot '..'

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $Color
}

function Test-EASInstalled {
    try {
        $null = npx eas --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "✓ EAS CLI disponible" 'Green'
            return $true
        }
    } catch {}

    Write-ColorOutput 'Instalando EAS CLI...' 'Yellow'
    npm install -g eas-cli
    return $true
}

function Test-EASConfigured {
    $easJson = Join-Path $AppPath 'eas.json'
    if (-not (Test-Path $easJson)) {
        Write-ColorOutput '⚠ eas.json no encontrado. Configurando EAS...' 'Yellow'
        Push-Location $AppPath
        try {
            npx eas build:configure
        } finally {
            Pop-Location
        }
    }
}

function Invoke-Build {
    param(
        [string]$BuildPlatform,
        [string]$BuildProfile,
        [bool]$BuildLocal,
        [bool]$BuildApk
    )

    Write-Host ''
    Write-ColorOutput "Iniciando build para $BuildPlatform ($BuildProfile)..." 'Cyan'
    Write-Host ''

    Push-Location $AppPath
    try {
        $buildArgs = @('build', '--platform', $BuildPlatform, '--profile', $BuildProfile, '--non-interactive')

        if ($BuildLocal) {
            if ($BuildPlatform -eq 'ios') {
                Write-ColorOutput '⚠ Build local de iOS solo disponible en macOS' 'Yellow'
            } else {
                $buildArgs += '--local'
            }
        }

        if ($BuildApk -and $BuildProfile -eq 'preview' -and $BuildPlatform -eq 'android') {
            $buildArgs += '--apk'
        }

        npx eas @buildArgs

        if ($LASTEXITCODE -ne 0) {
            throw "Error en el build (código $LASTEXITCODE)"
        }

        Write-Host ''
        Write-ColorOutput '✓ Build completado exitosamente' 'Green'
    } finally {
        Pop-Location
    }
}

# ==================== MAIN ====================

Write-Host ''
Write-ColorOutput '═══════════════════════════════════════════════════' 'Green'
Write-ColorOutput '    PLAN NUTRICIONAL - BUILD SYSTEM' 'Green'
Write-ColorOutput '═══════════════════════════════════════════════════' 'Green'
Write-Host ''

Write-ColorOutput "Plataforma: $Platform" 'Gray'
Write-ColorOutput "Perfil: $BuildProfile" 'Gray'
Write-ColorOutput "Local: $Local" 'Gray'
if ($Apk) { Write-ColorOutput 'Formato: APK' 'Gray' }
Write-Host ''

# Verificar EAS
Test-EASInstalled

# Verificar configuración
Test-EASConfigured

# Login si es necesario
$null = npx eas whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput 'Por favor inicia sesión en Expo:' 'Yellow'
    npx eas login
}

# Ejecutar build
Invoke-Build -BuildPlatform $Platform -BuildProfile $BuildProfile -BuildLocal $Local -BuildApk $Apk
