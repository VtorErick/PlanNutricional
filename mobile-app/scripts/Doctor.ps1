#Requires -Version 5.1
<#
.SYNOPSIS
    Diagnóstico completo de la aplicación móvil.

.DESCRIPTION
    Este script verifica el estado de salud de la aplicación,
    incluyendo dependencias, configuración y posibles problemas.

.PARAMETER Fix
    Intenta corregir problemas detectados automáticamente

.EXAMPLE
    .\Doctor.ps1
    Muestra diagnóstico completo

.EXAMPLE
    .\Doctor.ps1 -Fix
    Diagnóstico y corrección automática
#>
[CmdletBinding()]
param(
    [Parameter()]
    [switch]$Fix
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

function Write-Section {
    param([string]$Title)
    Write-Host ''
    Write-ColorOutput "━ $Title " 'Cyan' -NoNewline
    Write-Host ("━" * (50 - $Title.Length)) -ForegroundColor DarkGray
}

function Test-Command {
    param(
        [string]$Command,
        [string]$Arguments = '--version'
    )
    try {
        $output = & $Command $Arguments 2>$null
        return @{ Success = $true; Output = $output }
    } catch {
        return @{ Success = $false; Output = $null }
    }
}

$diagnostics = @{
    Node = $false
    Npm = $false
    Git = $false
    Java = $false
    AndroidSdk = $false
    Xcode = $false
    Dependencies = $false
    ExpoCli = $false
    EAS = $false
}

$issues = @()

# ==================== CHECKS ====================

Write-Host ''
Write-ColorOutput '═══════════════════════════════════════════════════' 'Magenta'
Write-ColorOutput '    PLAN NUTRICIONAL - HEALTH CHECK' 'Magenta'
Write-ColorOutput '═══════════════════════════════════════════════════' 'Magenta'

Write-Section 'Entorno de Desarrollo'

# Node.js
$node = Test-Command 'node'
if ($node.Success) {
    Write-ColorOutput "✓ Node.js: $($node.Output)" 'Green'
    $diagnostics.Node = $true
} else {
    Write-ColorOutput '❌ Node.js no encontrado' 'Red'
    $issues += 'Instala Node.js 18+ desde https://nodejs.org'
}

# Npm
$npm = Test-Command 'npm'
if ($npm.Success) {
    Write-ColorOutput "✓ npm: $($npm.Output)" 'Green'
    $diagnostics.Npm = $true
} else {
    Write-ColorOutput '❌ npm no encontrado' 'Red'
}

# Git
$git = Test-Command 'git'
if ($git.Success) {
    Write-ColorOutput "✓ Git: $($git.Output)" 'Green'
    $diagnostics.Git = $true
} else {
    Write-ColorOutput '❌ Git no encontrado' 'Red'
}

Write-Section 'Dependencias del Proyecto'

# node_modules
$nodeModules = Join-Path $AppPath 'node_modules'
if (Test-Path $nodeModules) {
    $pkgCount = (Get-ChildItem -Path $nodeModules -Directory -ErrorAction SilentlyContinue).Count
    Write-ColorOutput "✓ node_modules: $pkgCount paquetes instalados" 'Green'
    $diagnostics.Dependencies = $true
} else {
    Write-ColorOutput '❌ node_modules no encontrado' 'Red'
    $issues += 'Ejecuta: npm install'
}

# package.json
$packageJson = Join-Path $AppPath 'package.json'
if (Test-Path $packageJson) {
    Write-ColorOutput '✓ package.json existe' 'Green'
} else {
    Write-ColorOutput '❌ package.json no encontrado' 'Red'
}

Write-Section 'Herramientas Expo'

# Expo CLI
Push-Location $AppPath
try {
    $expo = npx expo --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✓ Expo CLI: $expo" 'Green'
        $diagnostics.ExpoCli = $true
    } else {
        Write-ColorOutput '❌ Expo CLI no disponible' 'Red'
        $issues += 'Expo CLI debería instalarse con npm install'
    }

    # EAS
    $eas = npx eas --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "✓ EAS CLI: $eas" 'Green'
        $diagnostics.EAS = $true
    } else {
        Write-ColorOutput '⚠ EAS CLI no disponible (opcional para builds)' 'Yellow'
    }

    # Expo Doctor
    Write-Host ''
    Write-ColorOutput 'Ejecutando expo-doctor...' 'Cyan'
    npx expo-doctor
} finally {
    Pop-Location
}

Write-Section 'Configuración de Plataformas'

# Android
$androidHome = $env:ANDROID_HOME
if ($androidHome -and (Test-Path $androidHome)) {
    Write-ColorOutput "✓ Android SDK: $androidHome" 'Green'
    $diagnostics.AndroidSdk = $true
} else {
    Write-ColorOutput '⚠ Android SDK no configurado (ANDROID_HOME)' 'Yellow'
    $issues += 'Configura ANDROID_HOME para builds locales de Android'
}

# Java
$java = Test-Command 'java' '-version'
if ($java.Success) {
    Write-ColorOutput '✓ Java disponible' 'Green'
    $diagnostics.Java = $true
} else {
    Write-ColorOutput '⚠ Java no encontrado (requerido para Android builds locales)' 'Yellow'
}

Write-Section 'Resumen'

$passed = ($diagnostics.Values | Where-Object { $_ -eq $true }).Count
$total = $diagnostics.Count

Write-ColorOutput "Checks pasados: $passed/$total" 'Cyan'

if ($issues.Count -gt 0) {
    Write-Host ''
    Write-ColorOutput 'Issues detectados:' 'Yellow'
    $issues | ForEach-Object { Write-ColorOutput "  • $_" 'Red' }
}

if ($Fix -and $issues.Count -gt 0) {
    Write-Host ''
    Write-ColorOutput 'Aplicando correcciones automáticas...' 'Cyan'

    if (-not $diagnostics.Dependencies) {
        Push-Location $AppPath
        try {
            npm install
        } finally {
            Pop-Location
        }
    }
}

Write-Host ''
if ($issues.Count -eq 0) {
    Write-ColorOutput '✓ Todo está en orden!' 'Green'
} else {
    Write-ColorOutput '⚠ Hay problemas que necesitan atención' 'Yellow'
}
Write-Host ''
