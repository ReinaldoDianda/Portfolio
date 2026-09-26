# Grafito - arma Grafito.exe desde este codigo, en cualquier PC con Windows 10/11 y Python 3 (sin elevar).
#   1. Instala las librerias de Python de requirements.txt (pip).
#   2. Compila Claudio.exe, Subtito.exe y el motor de Subtito (faster-whisper adentro: la PC destino no necesita
#      Python) con PyInstaller, cada uno con su icono.
#   3. Baja el instalador oficial de Git para Windows (github.com/git-for-windows) y comprueba su firma.
#   4. Mete todo en el lanzador (instalador\lanzador.cs, con el compilador de C# que trae Windows) y deja
#      salida\Grafito.exe.
# Compila en una ruta corta (-Trabajo): PyInstaller falla con rutas de mas de 260 caracteres. Solo texto ASCII.
#
#   CONSTRUIR.bat                      (doble clic)
#   .\construir.ps1 [-Git <Git-x.y.z-64-bit.exe>] [-SinPip] [-Salida <ruta del exe>]
param(
    [string]$Git = '',
    [string]$Trabajo = (Join-Path $env:SystemDrive 'GrafitoBuild'),
    [string]$Salida = (Join-Path $PSScriptRoot 'salida\Grafito.exe'),
    [string]$Version = '1.1.0',
    [switch]$SinPip
)
$ErrorActionPreference = 'Stop'
$Raiz = $PSScriptRoot
$Ins = Join-Path $Raiz 'instalador'
function Paso([string]$t) { Write-Host "== $t" -ForegroundColor Cyan }

# ---- 1. Python y librerias
Paso 'Python'
$py = (Get-Command python -ErrorAction SilentlyContinue)
if (-not $py) { throw 'No se encuentra Python. Instalar Python 3 (python.org, marcar "Add python.exe to PATH") y volver a correr.' }
$ver = (& python -c "import sys; print('%d.%d' % sys.version_info[:2])")
Write-Host "  Python $ver ($($py.Source))"
if ([version]$ver -lt [version]'3.10') { throw "Hace falta Python 3.10 o mas nuevo (hay $ver)." }
if (-not $SinPip) {
    Paso 'Librerias (pip install -r requirements.txt; la primera vez tarda)'
    & cmd.exe /c "python -m pip install --disable-pip-version-check -r `"$Raiz\requirements.txt`""
    if ($LASTEXITCODE -ne 0) { throw 'pip no pudo instalar las librerias (ver arriba).' }
}

# ---- 2. Git para Windows (instalador oficial, firmado)
if (-not $Git) {
    Paso 'Git para Windows (ultima version oficial)'
    New-Item -ItemType Directory -Path $Trabajo -Force | Out-Null
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $rel = Invoke-RestMethod -Uri 'https://api.github.com/repos/git-for-windows/git/releases/latest' -Headers @{ 'User-Agent' = 'Grafito' }
    $a = @($rel.assets | Where-Object { $_.name -match '^Git-[\d.]+-64-bit\.exe$' })[0]
    if (-not $a) { throw 'No se encontro el instalador de 64 bits en la ultima version de Git para Windows.' }
    $Git = Join-Path $Trabajo $a.name
    if (-not (Test-Path -LiteralPath $Git)) { Write-Host "  bajando $($a.name)..."; Invoke-WebRequest -Uri $a.browser_download_url -OutFile $Git -UseBasicParsing }
}
if (-not (Test-Path -LiteralPath $Git) -or (Split-Path -Leaf $Git) -notmatch '^Git-.*-64-bit\.exe$') { throw "-Git tiene que ser el instalador Git-<version>-64-bit.exe ($Git)" }
if ((Get-AuthenticodeSignature -LiteralPath $Git).Status -ne 'Valid') { throw "$Git no tiene una firma valida" }
Write-Host "  $Git (firma valida)"

# ---- 3. Compilar
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
function PyInstaller([string]$Nombre, [string[]]$Argumentos) {
    # via cmd: PyInstaller informa por stderr y PowerShell 5.1 lo tomaria como error
    $w = Join-Path $Trabajo "w_$Nombre"
    $log = Join-Path $Trabajo "pyinstaller_$Nombre.log"
    $linea = 'python -m PyInstaller --noconfirm --distpath "{0}\dist" --workpath "{1}" --specpath "{1}" {2} > "{3}" 2>&1' -f $Trabajo, $w, ($Argumentos -join ' '), $log
    & cmd.exe /c $linea
    if ($LASTEXITCODE -ne 0) { throw "PyInstaller fallo con $Nombre (ver $log)" }
}
if (Test-Path -LiteralPath (Join-Path $Trabajo 'dist')) { Remove-Item -LiteralPath (Join-Path $Trabajo 'dist') -Recurse -Force }
New-Item -ItemType Directory -Path $Trabajo -Force | Out-Null
if (-not (Test-Path -LiteralPath (Join-Path $Ins 'instalador.ico'))) {
    Paso 'Icono del instalador'
    & cmd.exe /c "python `"$Ins\icono_instalador.py`" >nul 2>&1"
    if (-not (Test-Path -LiteralPath (Join-Path $Ins 'instalador.ico'))) { throw 'no se genero instalador.ico' }
}
$c = Join-Path $Raiz 'claudio'; $s = Join-Path $Raiz 'subtito'
Paso 'Claudio.exe'
PyInstaller 'Claudio' @('--onefile', '--noconsole', "--icon `"$c\claudio.ico`"", '--name Claudio', "--add-data `"$c\claudio.png;.`"", "--paths `"$c`"", "`"$c\claudio.py`"")
Paso 'Subtito.exe'
PyInstaller 'Subtito' @('--onefile', '--noconsole', "--icon `"$s\subtito.ico`"", '--name Subtito', '--collect-all tkinterdnd2', "--add-data `"$s\subtito_engine.py;.`"", "--add-data `"$s\subtito.png;.`"", "--paths `"$s`"", "`"$s\subtito.py`"")
Paso 'Motor de Subtito (faster-whisper; tarda varios minutos)'
PyInstaller 'SubtitoMotor' @('--onedir', '--console', '--name SubtitoMotor', '--collect-all faster_whisper', '--collect-all ctranslate2', '--collect-all onnx_asr', '--collect-all onnxruntime', '--collect-data av', "`"$s\subtito_engine.py`"")

# ---- 4. La carga y el lanzador
Paso 'Grafito.exe'
$car = Join-Path $Trabajo 'carga\carga'
if (Test-Path -LiteralPath (Join-Path $Trabajo 'carga')) { Remove-Item -LiteralPath (Join-Path $Trabajo 'carga') -Recurse -Force }
New-Item -ItemType Directory -Path "$car\claudio", "$car\subtito\motor", "$car\git" -Force | Out-Null
Copy-Item (Join-Path $Ins 'instalar.ps1'), (Join-Path $Ins 'admin.ps1') -Destination $car
Copy-Item "$Trabajo\dist\Claudio.exe", "$c\claudio.ico" -Destination "$car\claudio"
Copy-Item "$Trabajo\dist\Subtito.exe", "$s\subtito.ico", "$s\glosario.txt" -Destination "$car\subtito"
Copy-Item "$Trabajo\dist\SubtitoMotor\*" -Destination "$car\subtito\motor" -Recurse
Copy-Item -LiteralPath $Git -Destination "$car\git"
$codigo = (& git -C $Raiz rev-parse --short HEAD 2>$null)
[IO.File]::WriteAllText("$car\VERSION.txt", "$Version$(if ($codigo) { " - codigo $codigo" }) - $(Split-Path -Leaf $Git) - $(Get-Date -Format 'yyyy-MM-dd')")
$zip = Join-Path $Trabajo 'carga.zip'
if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
[IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $Trabajo 'carga'), $zip, 'Optimal', $false)
$csc = Join-Path $env:SystemRoot 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path -LiteralPath $csc)) { throw "No esta el compilador de C# de Windows ($csc)." }
$fw = Split-Path -Parent $csc
$out = Join-Path $Trabajo 'Grafito.exe'
$sal = & $csc /nologo /target:winexe /platform:anycpu /optimize+ "/out:$out" "/win32icon:$(Join-Path $Ins 'instalador.ico')" `
    "/win32manifest:$(Join-Path $Ins 'lanzador.manifest')" "/resource:$zip,carga.zip" `
    "/reference:$fw\System.IO.Compression.dll" "/reference:$fw\System.IO.Compression.FileSystem.dll" /reference:System.Windows.Forms.dll `
    (Join-Path $Ins 'lanzador.cs') 2>&1
if ($LASTEXITCODE -ne 0) { throw "csc fallo: $sal" }
New-Item -ItemType Directory -Path (Split-Path -Parent $Salida) -Force | Out-Null
Copy-Item -LiteralPath $out -Destination $Salida -Force
$mb = [Math]::Round((Get-Item -LiteralPath $Salida).Length / 1MB, 1)
Write-Host "Listo: $Salida ($mb MB; $([IO.File]::ReadAllText("$car\VERSION.txt")))" -ForegroundColor Green
