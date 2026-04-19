# Scripts de PowerShell - Plan Nutricional Mobile

Este directorio contiene scripts de PowerShell para facilitar el desarrollo y mantenimiento de la aplicación móvil Plan Nutricional.

## Requisitos

- Windows PowerShell 5.1 o PowerShell Core 7+
- Node.js 18+ instalado
- npm o yarn

## Scripts Disponibles

### 🚀 Start-App.ps1
Inicia la aplicación en modo desarrollo.

```powershell
.\Start-App.ps1                    # Inicia el bundler de Metro
.\Start-App.ps1 -Platform android  # Inicia en emulador Android
.\Start-App.ps1 -Platform ios      # Inicia en simulador iOS (requiere macOS)
.\Start-App.ps1 -Platform web      # Inicia versión web
.\Start-App.ps1 -Clean             # Limpia caché antes de iniciar
.\Start-App.ps1 -Offline          # Modo offline (sin actualizar dependencias)
```

### 🔄 Refresh-App.ps1
Refresca la aplicación cuando hay problemas con el caché o se hacen cambios importantes.

```powershell
.\Refresh-App.ps1          # Refresca la app normalmente
.\Refresh-App.ps1 -Full   # Limpieza completa + reinstalación de dependencias
.\Refresh-App.ps1 -ResetCache  # Solo reinicia el caché del bundler
```

### 🏗️ Build-App.ps1
Construye la aplicación para producción usando EAS Build.

```powershell
# Build de Android
.\Build-App.ps1 -Platform android -BuildProfile preview
.\Build-App.ps1 -Platform android -BuildProfile production

# Build de iOS (requiere macOS y cuenta de Apple Developer)
.\Build-App.ps1 -Platform ios -BuildProfile preview
.\Build-App.ps1 -Platform ios -BuildProfile production

# Build local (solo Android, sin EAS)
.\Build-App.ps1 -Platform android -BuildProfile preview -Local

# Generar APK en lugar de AAB
.\Build-App.ps1 -Platform android -BuildProfile preview -Apk
```

### 🔧 Doctor.ps1
Diagnóstico completo del entorno de desarrollo.

```powershell
.\Doctor.ps1        # Muestra diagnóstico
.\Doctor.ps1 -Fix   # Intenta corregir problemas detectados
```

Verifica:
- Node.js y npm instalados
- Dependencias del proyecto
- Configuración de Expo
- Variables de entorno (ANDROID_HOME, etc.)
- Compatibilidad de herramientas

### 📦 Update-Dependencies.ps1
Actualiza las dependencias de forma segura.

```powershell
.\Update-Dependencies.ps1              # Actualización segura (default)
.\Update-Dependencies.ps1 -Safe       # Solo actualiza patch/minor
.\Update-Dependencies.ps1 -Latest      # Actualiza a últimas versiones (cuidado!)
.\Update-Dependencies.ps1 -Interactive   # Modo interactivo
```

## Uso General

1. Abre PowerShell en la carpeta `scripts`
2. Ejecuta el script deseado, por ejemplo:
   ```powershell
   .\Start-App.ps1 -Platform android
   ```

3. Si aparece un error de políticas de ejecución, ejecuta una vez:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

## Atajos Recomendados

Para facilitar el uso, puedes crear aliases en tu perfil de PowerShell (`$PROFILE`):

```powershell
# Agregar al final de $PROFILE
Set-Alias -Name 'pstart' -Value 'C:\Users\...\mobile-app\scripts\Start-App.ps1'
Set-Alias -Name 'prefresh' -Value 'C:\Users\...\mobile-app\scripts\Refresh-App.ps1'
Set-Alias -Name 'pdoctor' -Value 'C:\Users\...\mobile-app\scripts\Doctor.ps1'
```

## Solución de Problemas

### "No se puede cargar el script porque la ejecución de scripts está deshabilitada"
Ejecuta en PowerShell como administrador:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Errores de permisos
Asegúrate de que la carpeta `mobile-app` y sus subcarpetas tengan permisos de lectura/escritura para tu usuario.

### Script no encuentra dependencias
Verifica que estás ejecutando el script desde la carpeta `scripts` y que `node_modules` existe en el directorio padre (`mobile-app`).
