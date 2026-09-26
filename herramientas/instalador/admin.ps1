# Grafito - la parte de la instalacion que corre COMO ADMINISTRADOR (la ventana la lanza una sola vez):
# Git para Windows, si la PC no lo tiene (lo usa la app de escritorio de Claude). Instalacion silenciosa.
# Escribe lo que pasa en -Registro (lo lee la ventana) y termina con 0 si todo salio bien. Solo texto ASCII.
param(
    [Parameter(Mandatory = $true)][string]$Carga,
    [Parameter(Mandatory = $true)][string]$Registro,
    [switch]$SinGit
)
$ErrorActionPreference = 'Stop'
function Anotar([string]$t) { Add-Content -LiteralPath $Registro -Value ("{0} {1}" -f (Get-Date -Format 'HH:mm:ss'), $t) -Encoding UTF8 }
function Git-Instalado {
    foreach ($r in @("$env:ProgramFiles\Git\cmd\git.exe", "${env:ProgramFiles(x86)}\Git\cmd\git.exe")) { if ($r -and (Test-Path -LiteralPath $r)) { return $r } }
    return $null
}
$fallas = 0
Anotar "ADMIN inicio (cuenta $env:USERNAME, equipo $env:COMPUTERNAME)"

if (-not $SinGit) {
    try {
        $g = Git-Instalado
        if ($g) { Anotar "GIT ya estaba: $g" }
        else {
            $inst = @(Get-ChildItem -LiteralPath (Join-Path $Carga 'git') -Filter 'Git-*-64-bit.exe' -File)[0]
            if (-not $inst) { throw 'el instalador no trae Git' }
            Anotar "GIT instalando $($inst.Name)..."
            $p = Start-Process -FilePath $inst.FullName -ArgumentList '/VERYSILENT', '/NORESTART', '/NOCANCEL', '/SP-', '/SUPPRESSMSGBOXES', '/CLOSEAPPLICATIONS' -PassThru
            [void]$p.Handle
            if (-not $p.WaitForExit(900000)) { try { $p.Kill() } catch { }; throw 'Git no termino en 15 minutos' }
            if ($p.ExitCode -ne 0) { throw "el instalador de Git termino con codigo $($p.ExitCode)" }
            $g = Git-Instalado
            if (-not $g) { throw 'Git no quedo instalado' }
            Anotar "GIT instalado: $g"
        }
    } catch { $fallas++; Anotar "GIT FALLA: $($_.Exception.Message)" }
}

Anotar "ADMIN fin ($fallas fallas)"
exit $(if ($fallas) { 1 } else { 0 })
