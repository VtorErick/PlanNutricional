#Requires -Version 5.1
<#
.SYNOPSIS
    Actualiza dependencias del proyecto de forma segura.

.DESCRIPTION
    Este script actualiza las dependencias de npm verificando
    compatibilidad con Expo y el proyecto.

.PARAMETER Safe
    Solo actualiza patch y minor versions (por defecto)

.PARAMETER Latest
    Actualiza a la última versión disponible (puede romper compatibilidad)

.PARAMETER Interactive
    Permite seleccionar qué dependencias actualizar

.EXAMPLE
    .\Update-Dependencies.ps1
    Actualización segura por defecto

.EXAMPLE
    .\Update-Dependencies.ps1 -Latest
    Actualiza todo a latest (uso con precaución)
#>
[CmdletBinding()]
param(
    [Parameter()]
    [switch]$Safe,

    [Parameter()]
    [switch]$Latest,

    [Parameter()]
    [switch]$Interactive
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

function Backup-PackageFiles {
    $packageJson = Join-Path $AppPath 'package.json'
    $packageLock = Join-Path $AppPath 'package-lock.json'
    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'

    if (Test-Path $packageJson) {
        Copy-Item $packageJson "$packageJson.bak.$timestamp"
    }
    if (Test-Path $packageLock) {
        Copy-Item $packageLock "$packageLock.bak.$timestamp"
    }

    Write-ColorOutput '✓ Archivos respaldados' 'Green'
}

function Update-Safe {
    Write-ColorOutput 'Actualizando dependencias (modo seguro)...' 'Cyan'
    Push-Location $AppPath
    try {
        # Actualizar solo patch y minor
        npm update

        # Verificar compatibilidad con Expo
        Write-Host ''
        Write-ColorOutput 'Verificando compatibilidad con Expo...' 'Cyan'
        npx expo install --check

        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput '⚠ Hay incompatibilidades. Ejecutando expo install --fix...' 'Yellow'
            npx expo install --fix
        }

        Write-ColorOutput '✓ Dependencias actualizadas' 'Green'
    } finally {
        Pop-Location
    }
}

function Update-Latest {
    Write-ColorOutput '⚠ ATENCIÓN: Modo latest puede romper compatibilidad' 'Yellow'
    Write-ColorOutput 'Continuar? (s/N): ' 'Red' -NoNewline
    $response = Read-Host
    if ($response -ne 's' -and $response -ne 'S') {
        return
    }

    Push-Location $AppPath
    try {
        npx npm-check-updates -u
        npm install
        Write-ColorOutput '✓ Dependencias actualizadas a latest' 'Green'
    } finally {
        Pop-Location
    }
}

function Show-Outdated {
    Write-ColorOutput 'Verificando actualizaciones disponibles...' 'Cyan'
    Push-Location $AppPath
    try {
        npm outdated
    } finally {
        Pop-Location
    }
}

# ==================== MAIN ====================

Write-Host ''
Write-ColorOutput '═══════════════════════════════════════════════════' 'Cyan'
Write-ColorOutput '    PLAN NUTRICIONAL - DEPENDENCY UPDATER' 'Cyan'
Write-ColorOutput '═══════════════════════════════════════════════════' 'Cyan'
Write-Host ''

# Mostrar dependencias desactualizadas primero
Show-Outdated

if ($Interactive) {
    Write-Host ''
    Write-ColorOutput 'Opciones:' 'Cyan'
    Write-ColorOutput '1. Actualización segura (recomendado)' 'White'
    Write-ColorOutput '2. Salir sin cambios' 'White'
    Write-Host ''
    Write-ColorOutput 'Selecciona (1-2): ' 'Cyan' -NoNewline
    $choice = Read-Host

    switch ($choice) {
        '1' { Update-Safe }
        default { Write-ColorOutput 'Saliendo sin cambios...' 'Gray' }
    }
} elseif ($Latest) {
    Backup-PackageFiles
    Update-Latest
} else {
    Backup-PackageFiles
    Update-Safe
}

Write-Host ''
