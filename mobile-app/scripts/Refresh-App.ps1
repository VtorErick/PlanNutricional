#Requires -Version 5.1
<#
.SYNOPSIS
    Refresca la aplicación cuando se hacen cambios en el código.

.DESCRIPTION
    Este script reinicia el bundler de Metro, limpia cachés y
    reinicia la app para aplicar cambios de código.

.PARAMETER Full
    Realiza una limpieza completa incluyendo node_modules

.PARAMETER ResetCache
    Solo reinicia el caché del bundler sin detenerlo

.EXAMPLE
    .\Refresh-App.ps1
    Refresca la aplicación normalmente

.EXAMPLE
    .\Refresh-App.ps1 -Full
    Limpieza completa con reinstalación de dependencias
#>
[CmdletBinding()]
param(
    [Parameter()]
    [switch]$Full,

    [Parameter()]
    [switch]$ResetCache
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

function Stop-ExpoProcesses {
    Write-ColorOutput 'Deteniendo procesos de Expo...' 'Cyan'

    # Detener procesos de Metro
    Get-Process -Name 'node' -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like '*expo*' -or $_.CommandLine -like '*metro*' -or $_.CommandLine -like '*react-native*'
    } | Stop-Process -Force -ErrorAction SilentlyContinue

    # Detener procesos de watchman si existe
    try {
        watchman watch-del-all 2>$null
    } catch {}

    Start-Sleep -Seconds 2
    Write-ColorOutput '✓ Procesos detenidos' 'Green'
}

function Clear-AllCache {
    Write-ColorOutput 'Limpiando cachés...' 'Cyan'

    # Caché de Metro
    $tempPaths = @(
        (Join-Path $env:TEMP 'metro-*'),
        (Join-Path $env:TEMP 'react-*'),
        (Join-Path $env:TEMP 'haste-map-*'),
        (Join-Path $env:TEMP 'metro-bundler-*')
    )

    foreach ($path in $tempPaths) {
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
    }

    # Caché de Expo
    $expoCache = Join-Path $env:USERPROFILE '.expo'
    if (Test-Path $expoCache) {
        Remove-Item -Path (Join-Path $expoCache 'cache') -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-ColorOutput '✓ Cachés limpiados' 'Green'
}

function Clear-NodeModules {
    Write-ColorOutput '⚠ Eliminando node_modules...' 'Yellow'
    $nodeModules = Join-Path $AppPath 'node_modules'
    if (Test-Path $nodeModules) {
        Remove-Item -Path $nodeModules -Recurse -Force
    }
    Write-ColorOutput '✓ node_modules eliminado' 'Green'
}

function Install-Dependencies {
    Write-ColorOutput 'Reinstalando dependencias...' 'Cyan'
    Push-Location $AppPath
    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw 'Error al instalar dependencias'
        }
        Write-ColorOutput '✓ Dependencias reinstaladas' 'Green'
    } finally {
        Pop-Location
    }
}

# ==================== MAIN ====================

Write-Host ''
Write-ColorOutput '═══════════════════════════════════════════════════' 'Yellow'
Write-ColorOutput '    PLAN NUTRICIONAL - APP REFRESHER' 'Yellow'
Write-ColorOutput '═══════════════════════════════════════════════════' 'Yellow'
Write-Host ''

if ($ResetCache) {
    # Solo reiniciar caché sin detener
    Clear-AllCache
    Write-ColorOutput 'Caché reiniciado. Los cambios deberían reflejarse automáticamente.' 'Green'
    exit 0
}

# Detener procesos
Stop-ExpoProcesses

# Limpiar caché
Clear-AllCache

# Limpieza completa si se solicitó
if ($Full) {
    Clear-NodeModules
    Install-Dependencies
}

Write-Host ''
Write-ColorOutput '✓ Aplicación refrescada correctamente' 'Green'
Write-ColorOutput 'Ejecuta .\Start-App.ps1 para reiniciar' 'Cyan'
Write-Host ''
