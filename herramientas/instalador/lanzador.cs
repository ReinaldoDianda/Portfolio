// Grafito - lanzador "Grafito.exe". Solo texto ASCII.
// Un solo archivo: trae adentro (recurso carga.zip) los tres programas, Git para Windows y la ventana de instalacion.
// Al abrirlo, lo saca a una carpeta temporal nueva y abre la ventana (PowerShell + WinForms, lo que trae Windows
// 10/11) sin consola. Se abre sin pedir administrador: la ventana lo pide una sola vez, solo si hay que instalar Git.
// PRD_SOLO_EXTRAER=<archivo>: solo pruebas; saca la carga, escribe la carpeta en ese archivo y no abre la ventana.
using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Text;
using System.Windows.Forms;

[assembly: AssemblyTitle("Grafito")]
[assembly: AssemblyProduct("Grafito")]
[assembly: AssemblyDescription("Grafito: instala Claudio, Subtito y Claude Code (con Git)")]

static class Lanzador {
    static string Comillas(string a) {
        if (a.Length > 0 && a.IndexOfAny(new char[] { ' ', '\t', '"' }) < 0) return a;
        StringBuilder sb = new StringBuilder("\"");
        int barras = 0;
        foreach (char c in a) {
            if (c == '\\') { barras++; continue; }
            if (c == '"') { sb.Append('\\', barras * 2 + 1); sb.Append('"'); barras = 0; continue; }
            sb.Append('\\', barras); barras = 0; sb.Append(c);
        }
        sb.Append('\\', barras * 2);
        sb.Append('"');
        return sb.ToString();
    }

    [STAThread]
    static int Main(string[] args) {
        try {
            string exe = Assembly.GetExecutingAssembly().Location;
            string baseDir = Path.Combine(Path.GetTempPath(), "Grafito_Instalar");
            // Limpieza de corridas anteriores (las de mas de 12 horas); si alguna esta en uso, queda para la proxima.
            try {
                if (Directory.Exists(baseDir)) {
                    foreach (string d in Directory.GetDirectories(baseDir)) {
                        try { if (Directory.GetCreationTimeUtc(d) < DateTime.UtcNow.AddHours(-12)) Directory.Delete(d, true); } catch { }
                    }
                }
            } catch { }
            string dir = Path.Combine(baseDir, DateTime.Now.ToString("yyyyMMdd_HHmmss_") + Guid.NewGuid().ToString("N").Substring(0, 6));
            Directory.CreateDirectory(dir);
            using (Stream s = Assembly.GetExecutingAssembly().GetManifestResourceStream("carga.zip")) {
                if (s == null) throw new Exception("el instalador esta incompleto (no trae la carga)");
                using (ZipArchive z = new ZipArchive(s, ZipArchiveMode.Read)) { z.ExtractToDirectory(dir); }
            }
            string solo = Environment.GetEnvironmentVariable("PRD_SOLO_EXTRAER");
            if (!string.IsNullOrEmpty(solo)) { File.WriteAllText(solo, dir); return 0; }

            string app = Path.Combine(dir, @"carga\instalar.ps1");
            string ps = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), @"WindowsPowerShell\v1.0\powershell.exe");
            StringBuilder linea = new StringBuilder("-NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File ");
            linea.Append(Comillas(app)).Append(" -Programa ").Append(Comillas(exe));
            foreach (string a in args) linea.Append(' ').Append(Comillas(a));
            ProcessStartInfo psi = new ProcessStartInfo(ps, linea.ToString());
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            psi.WorkingDirectory = dir;
            Process.Start(psi);
            return 0;
        } catch (Exception e) {
            MessageBox.Show("No se pudo abrir Grafito: " + e.Message, "Grafito", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }
}
