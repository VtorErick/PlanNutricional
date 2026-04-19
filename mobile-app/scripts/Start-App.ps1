#Requires -Version 5.1
<#
.SYNOPSIS
    Inicia la aplicación móvil Plan Nutricional en modo desarrollo.

.DESCRIPTION
    Este script inicia la aplicación Expo en modo desarrollo.
    Soporta Android, iOS y Web. Verifica dependencias antes de iniciar.

.PARAMETER Platform
    Plataforma a iniciar: 'android', 'ios', 'web' o 'default' (solo metro bundler)

.PARAMETER Clean
    Limpia el caché de Metro antes de iniciar

.PARAMETER Offline
    Modo offline - no intenta actualizar dependencias

.EXAMPLE
    .\Start-App.ps1 -Platform android
    Inicia la app en modo Android

.EXAMPLE
    .\Start-App.ps1 -Clean
    Limpia caché e inicia el bundler
#>
[CmdletBinding()]
param(
    [Parameter()]
    [ValidateSet('default', 'android', 'ios', 'web')]
    [string]$Platform = 'default',

    [Parameter()]
    [switch]$Clean,

    [Parameter()]
    [switch]$Offline
)

$ErrorActionPreference = 'Stop'
$AppPath = Join-Path $PSScriptRoot '..'

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = 'White',
        [switch]$NoNewline
    )
    $params = @{ Object = $Message; NoNewline = $NoNewline; ForegroundColor = $Color }
    Write-Host @params
}

function Test-NodeInstalled {
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-ColorOutput "[OK] Node.js $nodeVersion detectado" 'Green'
            return $true
        }
    } catch {}
    return $false
}

function Test-NpmPackages {
    Write-ColorOutput 'Verificando dependencias...' 'Cyan'
    $nodeModules = Join-Path $AppPath 'node_modules'
    if (-not (Test-Path $nodeModules)) {
        Write-ColorOutput '[!] node_modules no encontrado. Instalando...' 'Yellow'
        return $false
    }
    Write-ColorOutput '[OK] Dependencias encontradas' 'Green'
    return $true
}

function Install-Dependencies {
    Write-ColorOutput 'Instalando dependencias...' 'Cyan'
    Push-Location $AppPath
    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw 'Error al instalar dependencias'
        }
        Write-ColorOutput '[OK] Dependencias instaladas correctamente' 'Green'
    } finally {
        Pop-Location
    }
}

function Clear-MetroCache {
    Write-ColorOutput 'Limpiando caché de Metro...' 'Cyan'
    Push-Location $AppPath
    try {
        # Limpiar caché de Metro
        $metroCache = Join-Path $env:TEMP 'metro-*'
        Remove-Item -Path $metroCache -Recurse -Force -ErrorAction SilentlyContinue

        # Limpiar caché de React Native
        $rnCache = Join-Path $env:TEMP 'react-*'
        Remove-Item -Path $rnCache -Recurse -Force -ErrorAction SilentlyContinue

        # Limpiar caché de packager
        $hasteMap = Join-Path $env:TEMP 'haste-map-*'
        Remove-Item -Path $hasteMap -Recurse -Force -ErrorAction SilentlyContinue

        Write-ColorOutput '[OK] Cache limpiado' 'Green'
    } finally {
        Pop-Location
    }
}

function Start-ExpoApp {
    param([string]$Platform)

    Write-ColorOutput "Iniciando Plan Nutricional Mobile..." 'Cyan'
    Write-ColorOutput "Plataforma: $Platform" 'Gray'
    Write-ColorOutput 'Presiona Ctrl+C para detener' 'DarkGray'
    Write-Host ''

    Push-Location $AppPath
    try {
        switch ($Platform) {
            'android' {
                npx expo start --android
            }
            'ios' {
                npx expo start --ios
            }
            'web' {
                npx expo start --web
            }
            default {
                npx expo start
            }
        }
    } finally {
        Pop-Location
    }
}

# ==================== MAIN ====================

Write-Host ''
Write-ColorOutput '═══════════════════════════════════════════════════' 'Blue'
Write-ColorOutput '    PLAN NUTRICIONAL - MOBILE APP STARTER' 'Blue'
Write-ColorOutput '═══════════════════════════════════════════════════' 'Blue'
Write-Host ''

# Verificar Node.js
if (-not (Test-NodeInstalled)) {
    Write-ColorOutput '[X] Node.js no esta instalado. Por favor instala Node.js 18+' 'Red'
    exit 1
}

# Verificar/Instalar dependencias
if (-not $Offline -and -not (Test-NpmPackages)) {
    Install-Dependencies
}

# Limpiar caché si se solicitó
if ($Clean) {
    Clear-MetroCache
}

# Iniciar la app
Start-ExpoApp -Platform $Platform
