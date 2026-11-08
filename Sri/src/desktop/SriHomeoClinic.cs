using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace SriHomoeoCare
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                // Create Desktop & Start Menu Shortcut if not already present
                CreateShortcuts();

                // Locate Edge or Chrome for dedicated App Mode window
                string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
                string edgePath64 = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
                string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
                string chromePathUser = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe");

                string browserExe = null;
                if (File.Exists(edgePath)) browserExe = edgePath;
                else if (File.Exists(edgePath64)) browserExe = edgePath64;
                else if (File.Exists(chromePath)) browserExe = chromePath;
                else if (File.Exists(chromePathUser)) browserExe = chromePathUser;

                string targetUrl = "https://srihomoeocare.onvoroa.com/?portal=true";
                string appDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "SriHomoeoCareProfile");

                if (!Directory.Exists(appDataDir))
                {
                    Directory.CreateDirectory(appDataDir);
                }

                if (browserExe != null)
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = browserExe;
                    psi.Arguments = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1260,860 --app-id=srihomoeocare", targetUrl, appDataDir);
                    psi.UseShellExecute = false;
                    Process.Start(psi);
                }
                else
                {
                    Process.Start(new ProcessStartInfo(targetUrl) { UseShellExecute = true });
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Could not launch Sri Homoeo Care Laptop App: " + ex.Message, "Sri Homoeo Care", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        static void CreateShortcuts()
        {
            try
            {
                string exePath = Application.ExecutablePath;
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string shortcutPath = Path.Combine(desktop, "Sri Homoeo Care.lnk");

                if (!File.Exists(shortcutPath))
                {
                    Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                    if (shellType != null)
                    {
                        dynamic shell = Activator.CreateInstance(shellType);
                        dynamic shortcut = shell.CreateShortcut(shortcutPath);
                        shortcut.TargetPath = exePath;
                        shortcut.WorkingDirectory = Path.GetDirectoryName(exePath);
                        shortcut.Description = "Sri Homoeo Care - Cure at the Core";
                        shortcut.Save();
                    }
                }
            }
            catch
            {
                // Silently ignore shortcut creation failures
            }
        }
    }
}

