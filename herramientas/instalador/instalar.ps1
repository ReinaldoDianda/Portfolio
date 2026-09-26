# Grafito - la ventana del instalador de las herramientas. La abre el lanzador (Grafito.exe), sin
# administrador. Una casilla por programa; «Instalar» instala lo marcado, en este orden:
#   1. Git para Windows               -> admin.ps1, un solo permiso de administrador (cartel de Windows), si falta.
#   2. Claude Code                    -> instalador oficial (claude.ai), con la cuenta del usuario; si ya esta, nada.
#                                        Se asegura de que su carpeta quede en el PATH del usuario.
#   3. Claudio                        -> C:\Claudio  (conserva su configuracion)
#   4. Subtito                        -> C:\Subtito  (con su motor: no necesita Python; conserva su configuracion)
#   5. Accesos en el Escritorio y el menu Inicio de lo instalado.
# Deja un registro en C:\Claudio\registros y, si se puede, en "registros" junto al exe. UTF-8 con BOM (textos con
# acentos).
#
# Pruebas: -SinVentana hace todo sin mostrar nada; -Solo elige (claude,claudio,subtito); -SinAdmin, -SinClaude
# y las carpetas se pueden cambiar; -Captura guarda una foto de la ventana y la cierra (-Demo: a mitad de instalar).
param(
    [string]$Programa = '',
    [switch]$SinVentana,
    [string[]]$Solo = @(),
    [string]$Captura = '',
    [switch]$Demo,
    [switch]$SinAdmin,
    [switch]$SinClaude,
    [string]$DirClaudio = 'C:\Claudio',
    [string]$DirSubtito = 'C:\Subtito',
    [string]$Escritorio = [Environment]::GetFolderPath('Desktop'),
    [string]$MenuInicio = [Environment]::GetFolderPath('Programs')
)
$ErrorActionPreference = 'Stop'
$Carga = $PSScriptRoot
$Version = if (Test-Path -LiteralPath (Join-Path $Carga 'VERSION.txt')) { ([IO.File]::ReadAllText((Join-Path $Carga 'VERSION.txt'))).Trim() } else { '' }
$script:Lineas = New-Object System.Collections.ArrayList
$script:Fallas = 0
$script:Avisos = 0

# ---------------------------------------------------------------- registro
function Anotar([string]$t) {
    [void]$script:Lineas.Add(("{0} {1}" -f (Get-Date -Format 'HH:mm:ss'), $t))
}
function Guardar-Registro([string]$Estado) {
    $nombre = "instalacion_{0}_{1}_{2}.txt" -f $Estado, $env:COMPUTERNAME, (Get-Date -Format 'yyyyMMdd_HHmmss')
    $dirs = @((Join-Path $DirClaudio 'registros'))
    if ($Programa) { $dirs += (Join-Path (Split-Path -Parent $Programa) 'registros') }
    $cab = @("Grafito $Version", "Equipo: $env:COMPUTERNAME  Usuario: $env:USERNAME  Windows: $([Environment]::OSVersion.Version)  Fecha: $(Get-Date -Format s)", "Resultado: $Estado", '')
    $hecho = ''
    foreach ($d in $dirs) {
        try { New-Item -ItemType Directory -Path $d -Force | Out-Null; [IO.File]::WriteAllLines((Join-Path $d $nombre), [string[]]($cab + $script:Lineas)); if (-not $hecho) { $hecho = Join-Path $d $nombre } } catch { }
    }
    return $hecho
}

# ---------------------------------------------------------------- lo que se puede instalar
$Tinta = $null; $uiForm = $null; $uiBarra = $null
function Git-Instalado {
    foreach ($r in @("$env:ProgramFiles\Git\cmd\git.exe", "${env:ProgramFiles(x86)}\Git\cmd\git.exe")) { if ($r -and (Test-Path -LiteralPath $r)) { return $r } }
    return $null
}
$Items = [ordered]@{
    claude  = @{ Nombre = 'Claude Code'; Que = 'Para la app de Claude en el escritorio y la sesión de Claudio (con Git; necesita internet)'; Ya = { [bool](Claude-Instalado) } }
    claudio = @{ Nombre = 'Claudio'; Que = 'Muestra cuánto se usó de la suscripción de Claude'; Ya = { Test-Path -LiteralPath (Join-Path $DirClaudio 'Claudio.exe') } }
    subtito = @{ Nombre = 'Subtito'; Que = 'Pasa audios a subtítulos .srt (el modelo se baja la primera vez)'; Ya = { Test-Path -LiteralPath (Join-Path $DirSubtito 'Subtito.exe') } }
}
$Pasos = @{ admin = 'Git (administrador)'; claude = 'Claude Code'; claudio = 'Claudio'; subtito = 'Subtito'; accesos = 'Accesos en el Escritorio y el menu Inicio' }
$script:PasoN = 0; $script:PasosTotal = 1
function Refrescar {
    if (-not $uiForm) { return }
    $script:Pulso++; if ($uiBarra -and $uiBarra.Visible) { $uiBarra.Invalidate() }
    [System.Windows.Forms.Application]::DoEvents()
}
function Paso([string]$Clave, [string]$Estado, [string]$Detalle = '') {
    # Estado: curso | ok | aviso | falla | salta
    $txt = switch ($Estado) { 'curso' { '...' } 'ok' { 'OK' } 'aviso' { 'AVISO' } 'falla' { 'FALLA' } default { '--' } }
    Anotar ("PASO {0}: {1} {2}" -f $Pasos[$Clave], $txt, $Detalle)
    if ($Estado -eq 'falla') { $script:Fallas++ }
    if ($Estado -eq 'aviso') { $script:Avisos++ }
    if ($Estado -eq 'curso' -and $Clave -ne 'accesos' -and -not $script:EnCurso.ContainsKey($Clave)) { $script:EnCurso[$Clave] = 1; $script:PasoN++ }
    if (-not $uiForm) { Write-Output ("{0,-6} {1}  {2}" -f $txt, $Pasos[$Clave], $Detalle); return }
    Paso-Ventana $Clave $Estado $Detalle
    Refrescar
}
$script:EnCurso = @{}
function Esperar-Proceso($P, [int]$Segundos) {
    # Espera sin congelar la ventana. Devuelve $false si no termino a tiempo.
    [void]$P.Handle
    $fin = (Get-Date).AddSeconds($Segundos)
    while (-not $P.HasExited) {
        if ((Get-Date) -gt $fin) { try { $P.Kill() } catch { }; return $false }
        Refrescar; Start-Sleep -Milliseconds 200
    }
    return $true
}

# ---------------------------------------------------------------- pasos
function Crear-Acceso([string]$Carpeta, [string]$Nombre, [string]$Destino, [string]$Descripcion) {
    New-Item -ItemType Directory -Path $Carpeta -Force | Out-Null
    $s = New-Object -ComObject WScript.Shell
    $l = $s.CreateShortcut((Join-Path $Carpeta "$Nombre.lnk"))
    $l.TargetPath = $Destino
    $l.WorkingDirectory = Split-Path -Parent $Destino
    $l.IconLocation = "$Destino,0"
    $l.Description = $Descripcion
    $l.Save()
}
function Cerrar-Programa([string]$Nombre, [string]$Carpeta) {
    # Solo el de esa carpeta (cerrar programas locales esta permitido; nunca uno con trabajo sin guardar de otro lado).
    foreach ($p in @(Get-Process -Name $Nombre -ErrorAction SilentlyContinue)) {
        try { if ($p.Path -and $p.Path.StartsWith($Carpeta, [StringComparison]::OrdinalIgnoreCase)) { $p.Kill(); [void]$p.WaitForExit(5000); Anotar "  se cerro $Nombre (pid $($p.Id)) para reemplazarlo" } } catch { }
    }
}
function Copiar-Carpeta([string]$Desde, [string]$Hasta, [string[]]$Conservar) {
    # Copia todo lo del paquete; lo de $Conservar (configuracion del usuario) no se pisa si ya existe.
    New-Item -ItemType Directory -Path $Hasta -Force | Out-Null
    $n = 0
    foreach ($f in Get-ChildItem -LiteralPath $Desde -Recurse -File) {
        $rel = $f.FullName.Substring($Desde.Length).TrimStart('\')
        $dst = Join-Path $Hasta $rel
        if ($Conservar -contains $rel -and (Test-Path -LiteralPath $dst)) { continue }
        New-Item -ItemType Directory -Path (Split-Path -Parent $dst) -Force | Out-Null
        Copy-Item -LiteralPath $f.FullName -Destination $dst -Force
        $n++
    }
    return $n
}
function Claude-Instalado {
    $c = Join-Path $env:USERPROFILE '.local\bin\claude.exe'
    if (Test-Path -LiteralPath $c) { return $c }
    $w = Get-Command claude -ErrorAction SilentlyContinue
    if ($w) { return $w.Source }
    return $null
}
function Asegurar-Path-Claude([string]$Exe) {
    # El instalador oficial deja claude.exe en %USERPROFILE%\.local\bin pero no siempre lo agrega al
    # PATH del usuario (y entonces 'claude' no se reconoce en una consola). Se agrega a la variable del usuario,
    # conservando las entradas con %VARIABLES% (tipo REG_EXPAND_SZ), y se avisa a Windows del cambio.
    $dir = Split-Path -Parent $Exe
    $k = Get-Item 'HKCU:\Environment'
    $actual = [string]$k.GetValue('Path', '', 'DoNotExpandEnvironmentNames')
    $partes = @($actual -split ';' | Where-Object { $_.Trim() })
    if (@($partes | Where-Object { [Environment]::ExpandEnvironmentVariables($_).TrimEnd('\') -ieq $dir.TrimEnd('\') }).Count) { return 'ya estaba en el PATH' }
    $nuevo = (@($partes) + '%USERPROFILE%\.local\bin') -join ';'
    if ($dir -ine (Join-Path $env:USERPROFILE '.local\bin')) { $nuevo = (@($partes) + $dir) -join ';' }
    Set-ItemProperty -Path 'HKCU:\Environment' -Name 'Path' -Value $nuevo -Type ExpandString
    try {
        if (-not ('ProgramasRD.Entorno' -as [type])) { Add-Type -Namespace ProgramasRD -Name Entorno -MemberDefinition '[DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr SendMessageTimeout(IntPtr h, uint m, UIntPtr w, string l, uint f, uint t, out UIntPtr r);' }
        $r = [UIntPtr]::Zero; [void][ProgramasRD.Entorno]::SendMessageTimeout([IntPtr]0xffff, 0x1A, [UIntPtr]::Zero, 'Environment', 2, 5000, [ref]$r)
    } catch { }
    $env:Path = "$env:Path;$dir"
    return 'agregado al PATH del usuario'
}

function Instalar-Todo([string[]]$Elegidos = @('claude', 'claudio', 'subtito')) {
    Anotar "Carga: $Carga"
    Anotar "Elegido: $($Elegidos -join ', ')"
    $script:PasoN = 0; $script:EnCurso = @{}
    $script:PasosTotal = [Math]::Max(1, @($Elegidos).Count)
    $conGit = ($Elegidos -contains 'claude') -and -not (Git-Instalado)
    $gitTxt = ''
    # 1. administrador: Git, solo si se eligio Claude Code y falta (un cartel de Windows)
    if ($conGit) {
        if ($SinAdmin) { Anotar 'PASO administrador: -- (prueba: sin administrador)' }
        else {
            Paso 'claude' 'curso' 'instalando Git: responder Sí en el cartel de Windows'
            $reg = Join-Path $env:TEMP ("prd_admin_{0}.txt" -f [guid]::NewGuid().ToString('N').Substring(0, 8))
            $ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
            $arg = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$(Join-Path $Carga 'admin.ps1')`" -Carga `"$Carga`" -Registro `"$reg`""
            try {
                $p = Start-Process -FilePath $ps -ArgumentList $arg -Verb RunAs -WindowStyle Hidden -PassThru
                $ok = Esperar-Proceso $p 1500
                $det = @(if (Test-Path -LiteralPath $reg) { Get-Content -LiteralPath $reg -Encoding UTF8 })
                foreach ($l in $det) { Anotar "  $l" }
                $fGit = @($det | Where-Object { $_ -match ' GIT FALLA: ' } | ForEach-Object { $_ -replace '^.* GIT FALLA: ', '' })
                if (-not $ok -or $fGit.Count -or -not @($det | Where-Object { $_ -match 'GIT (instalado|ya estaba)' }).Count) { $gitTxt = "Git no se instaló$(if ($fGit.Count) { ': ' + ($fGit -join '; ') })" }
                else { $gitTxt = 'Git instalado' }
            } catch { $gitTxt = 'Git no se instaló: no se dio el permiso de administrador' }
            finally { Remove-Item -LiteralPath $reg -Force -ErrorAction SilentlyContinue }
        }
    }

    # 2. Claude Code (para la sesion de Claudio y la app de escritorio de Claude)
    if ($Elegidos -notcontains 'claude') { }
    elseif ($SinClaude) { Paso 'claude' 'salta' '(prueba)' }
    else {
        $c = Claude-Instalado
        if ($c) { Paso 'claude' $(if ($gitTxt -like 'Git no*') { 'aviso' } else { 'ok' }) "ya estaba ($c; $(try { Asegurar-Path-Claude $c } catch { "PATH sin cambiar: $($_.Exception.Message)" }))$(if ($gitTxt) { "; $gitTxt" })" }
        else {
            Paso 'claude' 'curso' 'descargando el instalador oficial (necesita internet)...'
            $tmp = Join-Path $env:TEMP ("prd_claude_{0}.ps1" -f [guid]::NewGuid().ToString('N').Substring(0, 8))
            try {
                [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
                Invoke-WebRequest -Uri 'https://claude.ai/install.ps1' -OutFile $tmp -UseBasicParsing -TimeoutSec 60
                Paso 'claude' 'curso' 'instalando (unos minutos)...'
                $ps = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
                $sal = Join-Path $env:TEMP ("prd_claude_{0}.log" -f [guid]::NewGuid().ToString('N').Substring(0, 8))
                $p = Start-Process -FilePath $ps -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$tmp`"" -WindowStyle Hidden -RedirectStandardOutput $sal -RedirectStandardError "$sal.err" -PassThru
                $ok = Esperar-Proceso $p 900
                foreach ($f in @($sal, "$sal.err")) { if (Test-Path -LiteralPath $f) { Get-Content -LiteralPath $f | Where-Object { $_.Trim() } | ForEach-Object { Anotar "  claude: $_" }; Remove-Item -LiteralPath $f -Force -ErrorAction SilentlyContinue } }
                $c = Claude-Instalado
                if (-not $ok) { Paso 'claude' 'falla' 'el instalador no termino en 15 minutos' }
                elseif ($c) { Paso 'claude' $(if ($gitTxt -like 'Git no*') { 'aviso' } else { 'ok' }) "instalado ($c; $(try { Asegurar-Path-Claude $c } catch { "PATH sin cambiar: $($_.Exception.Message)" }))$(if ($gitTxt) { "; $gitTxt" })" }
                else { Paso 'claude' 'falla' "el instalador termino (codigo $($p.ExitCode)) pero no esta claude.exe" }
            } catch { Paso 'claude' 'falla' "sin internet o bloqueado: $($_.Exception.Message)" }
            finally { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }
        }
    }

    # 3 y 4. Claudio y Subtito
    foreach ($x in @(@('claudio', 'Claudio', $DirClaudio, @('claude_usage_config.json')), @('subtito', 'Subtito', $DirSubtito, @('subtito_config.json', 'glosario.txt')))) {
        $clave, $nombre, $dir, $cons = $x
        if ($Elegidos -notcontains $clave) { continue }
        Paso $clave 'curso' "copiando a $dir..."
        try {
            Cerrar-Programa $nombre $dir
            $n = Copiar-Carpeta (Join-Path $Carga $clave) $dir $cons
            if (-not (Test-Path -LiteralPath (Join-Path $dir "$nombre.exe"))) { throw "no quedo $nombre.exe" }
            Paso $clave 'ok' "$dir ($n archivos)"
        } catch { Paso $clave 'falla' $_.Exception.Message }
    }
    if ($Elegidos -contains 'subtito' -and -not (Test-Path -LiteralPath (Join-Path $DirSubtito 'motor\SubtitoMotor.exe'))) { Anotar 'AVISO: falta el motor de Subtito' }

    # 5. accesos
    Paso 'accesos' 'curso'
    try {
        $hechos = @()
        foreach ($a in @(@('Claudio', (Join-Path $DirClaudio 'Claudio.exe'), 'Uso de la suscripcion (inicia sesion en Claude Code si hace falta)'),
                         @('Subtito', (Join-Path $DirSubtito 'Subtito.exe'), 'Transcribe audios a .srt'))) {
            if (-not (Test-Path -LiteralPath $a[1]) -or $Elegidos -notcontains $a[0].ToLowerInvariant()) { continue }
            foreach ($d in @($Escritorio, $MenuInicio)) { Crear-Acceso $d $a[0] $a[1] $a[2] }
            $hechos += $a[0]
        }
        # los accesos viejos que dejaban los instaladores anteriores
        foreach ($v in 'ClaudeUsage.exe - Acceso directo.lnk', 'Claudio.exe.lnk', 'Subtito.exe - Acceso directo.lnk') {
            $p = Join-Path $Escritorio $v; if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Force; Anotar "  se quito el acceso viejo $v" }
        }
        $faltan = @(@('claudio', 'Claudio'), @('subtito', 'Subtito') | Where-Object { $Elegidos -contains $_[0] -and $hechos -notcontains $_[1] } | ForEach-Object { $_[1] })
        if ($faltan.Count) { Anotar "PASO accesos: AVISO sin acceso: $($faltan -join ', ')" } else { Anotar "PASO accesos: OK $($hechos -join ', ')" }
    } catch { $script:Avisos++; Anotar "PASO accesos: AVISO $($_.Exception.Message)" }
}

# ---------------------------------------------------------------- sin ventana (pruebas)
if ($SinVentana) {
    Instalar-Todo $(if ($Solo.Count) { @($Solo | ForEach-Object { $_ -split ',' } | Where-Object { $_ }) } else { @('claude', 'claudio', 'subtito') })
    $estado = if ($script:Fallas) { 'CON_FALLAS' } elseif ($script:Avisos) { 'OK_CON_AVISOS' } else { 'OK' }
    $r = Guardar-Registro $estado
    Write-Output "Resultado: $estado. Registro: $r"
    exit $(if ($script:Fallas) { 1 } else { 0 })
}

# ---------------------------------------------------------------- con ventana
# Texto nitido (la ventana declara que maneja la escala de pantalla y todo se mide con S()), una casilla por programa
# y barra de progreso; mientras instala, el boton dice «Instalando…» y en que paso va.
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
try { Add-Type -Namespace Grafito -Name Nat -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();'; [void][Grafito.Nat]::SetProcessDPIAware() } catch { }
[System.Windows.Forms.Application]::EnableVisualStyles()
$gTmp = [Drawing.Graphics]::FromHwnd([IntPtr]::Zero); $Esc = $gTmp.DpiX / 96.0; $gTmp.Dispose()
function S([double]$n) { return [int][Math]::Round($n * $Esc) }
$Tinta = @{
    Fondo = [Drawing.Color]::FromArgb(27, 29, 34); Tarjeta = [Drawing.Color]::FromArgb(36, 39, 46); Baldosa = [Drawing.Color]::FromArgb(42, 45, 52)
    Borde = [Drawing.Color]::FromArgb(53, 57, 65); Texto = [Drawing.Color]::FromArgb(232, 234, 237); Gris = [Drawing.Color]::FromArgb(154, 160, 166)
    Acento = [Drawing.Color]::FromArgb(79, 209, 197); Ambar = [Drawing.Color]::FromArgb(246, 173, 85); Rojo = [Drawing.Color]::FromArgb(245, 101, 101)
}
$F = @{
    Titulo = New-Object Drawing.Font('Segoe UI Semibold', 18); Sub = New-Object Drawing.Font('Segoe UI', 10)
    Nombre = New-Object Drawing.Font('Segoe UI Semibold', 11); Chico = New-Object Drawing.Font('Segoe UI', 9)
    Estado = New-Object Drawing.Font('Segoe UI Semibold', 9.5); Boton = New-Object Drawing.Font('Segoe UI Semibold', 11)
}
function Doble-Bufer($c) { try { $c.GetType().GetProperty('DoubleBuffered', [Reflection.BindingFlags]'Instance,NonPublic').SetValue($c, $true, $null) } catch { } }
function Etiqueta([string]$Texto, $Fuente, $Color, [int]$X, [int]$Y, $Padre) {
    $l = New-Object Windows.Forms.Label; $l.Text = $Texto; $l.Font = $Fuente; $l.ForeColor = $Color; $l.BackColor = [Drawing.Color]::Transparent
    $l.AutoSize = $true; $l.Location = New-Object Drawing.Point($X, $Y); $Padre.Controls.Add($l); return $l
}

$uiForm = New-Object Windows.Forms.Form
$uiForm.Text = 'Grafito'
$uiForm.StartPosition = 'CenterScreen'; $uiForm.FormBorderStyle = 'FixedSingle'; $uiForm.MaximizeBox = $false
$uiForm.AutoScaleMode = 'None'
$uiForm.ClientSize = New-Object Drawing.Size((S 640), (S 560))
$uiForm.BackColor = $Tinta.Fondo; $uiForm.ForeColor = $Tinta.Texto; $uiForm.Font = $F.Sub
try { $uiForm.Icon = [Drawing.Icon]::ExtractAssociatedIcon($Programa) } catch { }
Doble-Bufer $uiForm

[void](Etiqueta 'Grafito' $F.Titulo $Tinta.Acento (S 26) (S 18) $uiForm)
$uiSub = Etiqueta 'Herramientas de trabajo para esta PC. Marque lo que quiere instalar y toque «Instalar».' $F.Sub $Tinta.Gris (S 28) (S 62) $uiForm
$uiSub.MaximumSize = New-Object Drawing.Size((S 590), 0)

# Una tarjeta por programa: casilla, nombre, que es, y a la derecha como va.
$uiFilas = @{}
$y = S 104
foreach ($k in $Items.Keys) {
    $it = $Items[$k]
    $p = New-Object Windows.Forms.Panel; $p.BackColor = $Tinta.Tarjeta; $p.SetBounds((S 24), $y, (S 592), (S 62)); $uiForm.Controls.Add($p)
    $cb = New-Object Windows.Forms.CheckBox; $cb.Checked = $true; $cb.AutoSize = $true; $cb.Location = New-Object Drawing.Point((S 14), (S 20))
    $cb.FlatStyle = 'Flat'; $cb.FlatAppearance.BorderColor = $Tinta.Acento; $cb.FlatAppearance.CheckedBackColor = $Tinta.Acento; $cb.Cursor = 'Hand'
    $p.Controls.Add($cb)
    $n = Etiqueta $it.Nombre $F.Nombre $Tinta.Texto (S 40) (S 9) $p
    $d = Etiqueta $it.Que $F.Chico $Tinta.Gris (S 41) (S 34) $p
    $e = New-Object Windows.Forms.Label; $e.Font = $F.Estado; $e.ForeColor = $Tinta.Gris; $e.BackColor = [Drawing.Color]::Transparent
    $e.TextAlign = 'MiddleRight'; $e.SetBounds((S 400), (S 8), (S 178), (S 22)); $p.Controls.Add($e)
    $e.Text = if (& $it.Ya) { 'ya instalado: se actualiza' } else { '' }
    foreach ($c in @($p, $n, $d)) { $c.Cursor = 'Hand'; $c.Tag = $cb; $c.Add_Click({ param($s, $ev) if ($s.Tag.Enabled) { $s.Tag.Checked = -not $s.Tag.Checked } }) }
    $cb.Add_CheckedChanged({ Revisar-Eleccion })
    $uiFilas[$k] = @{ Panel = $p; Casilla = $cb; Estado = $e; Detalle = $d; Que = $it.Que }
    $y += S 70
}

# Barra de progreso propia (la de Windows no toma los colores) y el texto de como va, grande y arriba del boton.
$uiEstado = Etiqueta '' $F.Sub $Tinta.Gris (S 26) ($y + (S 8)) $uiForm
$uiEstado.AutoSize = $false; $uiEstado.SetBounds((S 26), ($y + (S 6)), (S 590), (S 44))
$script:Progreso = 0.0; $script:Pulso = 0
$uiBarra = New-Object Windows.Forms.Panel; $uiBarra.SetBounds((S 26), ($y + (S 54)), (S 590), (S 10)); $uiBarra.BackColor = $Tinta.Fondo; $uiBarra.Visible = $false
Doble-Bufer $uiBarra
$uiBarra.Add_Paint({ param($s, $e)
    $g = $e.Graphics; $g.SmoothingMode = 'AntiAlias'; $g.Clear($Tinta.Fondo)
    $b1 = New-Object Drawing.SolidBrush($Tinta.Baldosa); $g.FillRectangle($b1, 0, 0, $s.Width, $s.Height); $b1.Dispose()
    $w = [int]($s.Width * [Math]::Min(1.0, $script:Progreso))
    $b2 = New-Object Drawing.SolidBrush($Tinta.Acento); $g.FillRectangle($b2, 0, 0, $w, $s.Height); $b2.Dispose()
    if ($script:Progreso -lt 1.0) {
        # un brillo que se mueve dentro del paso en curso: la ventana no esta colgada
        $x = $w + (($script:Pulso * (S 6)) % [Math]::Max(1, ($s.Width - $w)))
        $b3 = New-Object Drawing.SolidBrush([Drawing.Color]::FromArgb(140, $Tinta.Acento)); $g.FillRectangle($b3, $x, 0, (S 40), $s.Height); $b3.Dispose()
    }
})
$uiForm.Controls.Add($uiBarra)

$uiBoton = New-Object Windows.Forms.Button
$uiBoton.SetBounds((S 416), ($y + (S 82)), (S 200), (S 46))
$uiBoton.FlatStyle = 'Flat'; $uiBoton.FlatAppearance.BorderSize = 0; $uiBoton.Font = $F.Boton; $uiBoton.Cursor = 'Hand'
$uiBoton.Text = 'Instalar'; $uiBoton.BackColor = $Tinta.Acento; $uiBoton.ForeColor = $Tinta.Fondo
$uiBoton.FlatAppearance.MouseOverBackColor = [Drawing.Color]::FromArgb(110, 225, 214)
$uiForm.Controls.Add($uiBoton)
$uiForm.ClientSize = New-Object Drawing.Size((S 640), ($uiBoton.Bottom + (S 22)))
$uiNota = Etiqueta 'Git pide permiso de administrador una sola vez: responder «Sí» en el cartel de Windows.' $F.Chico $Tinta.Gris (S 28) ($uiEstado.Top + (S 2)) $uiForm
$uiNota.BringToFront()   # la etiqueta de estado (vacia al abrir) ocupa el mismo lugar

function Revisar-Eleccion {
    if ($script:Instalando -or $script:Terminado) { return }
    $n = @($uiFilas.Keys | Where-Object { $uiFilas[$_].Casilla.Checked }).Count
    $uiBoton.Text = if ($n) { 'Instalar' } else { 'Marque algo' }
    $uiBoton.BackColor = if ($n) { $Tinta.Acento } else { $Tinta.Baldosa }
    $uiBoton.ForeColor = if ($n) { $Tinta.Fondo } else { $Tinta.Gris }
    $admin = $uiFilas['claude'].Casilla.Checked -and -not (Git-Instalado)
    $uiNota.Visible = $admin
}
function Paso-Ventana([string]$Clave, [string]$Estado, [string]$Detalle) {
    # La fila del paso: como va y el detalle; y arriba del boton, en que paso va la instalacion.
    if (-not $uiFilas.ContainsKey($Clave)) { return }
    $f = $uiFilas[$Clave]
    $f.Estado.Text = switch ($Estado) { 'curso' { 'instalando…' } 'ok' { '✓ listo' } 'aviso' { 'con avisos' } 'falla' { '✗ no se instaló' } 'salta' { 'no se instala' } default { '' } }
    $f.Estado.ForeColor = switch ($Estado) { 'ok' { $Tinta.Acento } 'aviso' { $Tinta.Ambar } 'falla' { $Tinta.Rojo } 'curso' { $Tinta.Texto } default { $Tinta.Gris } }
    $f.Detalle.Text = if ($Detalle) { $Detalle } else { $f.Que }
    $f.Detalle.ForeColor = if ($Estado -eq 'falla') { $Tinta.Rojo } else { $Tinta.Gris }
    if ($Estado -eq 'curso') {
        $uiEstado.ForeColor = $Tinta.Texto
        $uiEstado.Text = "Paso $($script:PasoN) de $($script:PasosTotal): $($Items[$Clave].Nombre). No cierre esta ventana; puede tardar unos minutos."
        $uiBoton.Text = "Instalando… $($script:PasoN) de $($script:PasosTotal)"
    } else { $script:Progreso = [Math]::Min(1.0, $script:PasoN / [double]$script:PasosTotal) }
    $uiBarra.Invalidate()
}

$script:Terminado = $false; $script:Instalando = $false
$uiBoton.Add_Click({
    if ($script:Instalando) { return }
    if ($script:Terminado) { $uiForm.Close(); return }
    $elegidos = @($Items.Keys | Where-Object { $uiFilas[$_].Casilla.Checked })
    if (-not $elegidos.Count) { return }
    $script:Instalando = $true
    foreach ($k in $uiFilas.Keys) { $uiFilas[$k].Casilla.Enabled = $false; if ($elegidos -notcontains $k) { Paso-Ventana $k 'salta' '' } }
    # El boton no se deshabilita (quedaria gris e ilegible): cambia de color y dice en que paso va.
    $uiBoton.BackColor = $Tinta.Baldosa; $uiBoton.ForeColor = $Tinta.Texto; $uiBoton.Cursor = 'WaitCursor'; $uiForm.Cursor = 'AppStarting'
    $uiNota.Visible = $false; $uiBarra.Visible = $true; $script:Progreso = 0.0; Refrescar
    try { Instalar-Todo $elegidos } catch { $script:Fallas++; Anotar "ERROR: $($_.Exception.Message)" }
    $estado = if ($script:Fallas) { 'CON_FALLAS' } elseif ($script:Avisos) { 'OK_CON_AVISOS' } else { 'OK' }
    $r = Guardar-Registro $estado
    $script:Progreso = 1.0; $uiBarra.Invalidate()
    if ($script:Fallas) { $uiEstado.ForeColor = $Tinta.Rojo; $uiEstado.Text = "Algo no se instaló (marcado en rojo arriba). Se puede volver a abrir Grafito e instalar de nuevo.`nRegistro: $r" }
    else { $uiEstado.ForeColor = $Tinta.Acento; $uiEstado.Text = 'Listo. Los accesos quedaron en el Escritorio y en el menú Inicio.' }
    $script:Instalando = $false; $script:Terminado = $true
    $uiBoton.Text = 'Cerrar'; $uiBoton.BackColor = $Tinta.Acento; $uiBoton.ForeColor = $Tinta.Fondo; $uiBoton.Cursor = 'Hand'; $uiForm.Cursor = 'Default'
})
$uiForm.Add_FormClosing({ param($s, $e) if ($script:Instalando) { $e.Cancel = $true; $uiEstado.ForeColor = $Tinta.Ambar; $uiEstado.Text = 'Está instalando: espere a que termine para cerrar.' } })
$uiForm.Add_Shown({
    Revisar-Eleccion
    if ($Demo) {
        # Solo pruebas: como se ve a mitad de instalar (Claude Code listo, Claudio en curso).
        foreach ($k in $uiFilas.Keys) { $uiFilas[$k].Casilla.Enabled = $false }
        $script:Instalando = $true; $uiBoton.BackColor = $Tinta.Baldosa; $uiBoton.ForeColor = $Tinta.Texto; $uiNota.Visible = $false; $uiBarra.Visible = $true
        $script:PasosTotal = 3; $script:PasoN = 1; Paso-Ventana 'claude' 'curso' ''; Paso-Ventana 'claude' 'ok' 'ya estaba; agregado al PATH del usuario'
        $script:PasoN = 2; Paso-Ventana 'claudio' 'curso' 'copiando a C:\Claudio...'; $script:Pulso = 30; $uiBarra.Invalidate()
    }
    if ($Captura) { $uiForm.Refresh(); Start-Sleep -Milliseconds 400; Foto $Captura; $script:Instalando = $false; $uiForm.Close() }
})
function Foto([string]$Ruta) {
    $bmp = New-Object Drawing.Bitmap($uiForm.Width, $uiForm.Height); $gr = [Drawing.Graphics]::FromImage($bmp)
    $gr.CopyFromScreen($uiForm.Location, [Drawing.Point]::Empty, $uiForm.Size); $gr.Dispose(); $bmp.Save($Ruta, [Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
}
[void]$uiForm.ShowDialog()
