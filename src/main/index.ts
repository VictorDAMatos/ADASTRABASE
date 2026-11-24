import { app, shell, BrowserWindow, ipcMain, protocol, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import path from 'path';
import fs from 'fs';
import yts from 'yt-search';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

// 1. OBRIGATÓRIO: Dá permissão máxima e ativa o "stream" para o áudio
protocol.registerSchemesAsPrivileged([
  { scheme: 'local', privileges: { standard: true, secure: true, bypassCSP: true, stream: true } }
])

function createWindow(): void {
  app.commandLine.appendSwitch('ignore-certificate-errors');
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false, 
      allowRunningInsecureContent: true,
      nodeIntegration: true,
      contextIsolation: false // Crítico para ler os ficheiros
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  // 2. A SOLUÇÃO: registerFileProtocol suporta o carregamento em "bocados" (Range Requests)
  protocol.registerFileProtocol('local', (request, callback) => {
    // Limpa qualquer variação do prefixo local
    let url = request.url.replace(/^local:\/\/\//i, '').replace(/^local:\/\//i, '');
    
    // Transforma os espaços codificados (%20) de volta em espaços reais
    let decodedPath = decodeURI(url);

    // Remove a barra extra inicial que o Windows por vezes adiciona (/C:/ -> C:/)
    if (process.platform === 'win32' && decodedPath.startsWith('/')) {
      decodedPath = decodedPath.substring(1);
    }

    // Devolve o caminho limpo diretamente para o sistema operativo
    callback({ path: decodedPath });
  })

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 3. O nosso seletor de ficheiros nativo
  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Selecione as suas músicas',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Áudio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a'] }]
    })
    return canceled ? [] : filePaths;
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('download-track', async (event, searchQuery) => {
  try {
    const searchResults = await yts(searchQuery);
    
    if (!searchResults.videos || searchResults.videos.length === 0) {
      throw new Error('Sinal não encontrado nos radares.');
    }
    
    const musicPath = app.getPath('music');
    const adAstraFolder = path.join(musicPath, 'AdAstra_Downloads');
    if (!fs.existsSync(adAstraFolder)) {
      fs.mkdirSync(adAstraFolder, { recursive: true });
    }

    // TÁTICA DE EVASÃO
   for (let i = 0; i < Math.min(3, searchResults.videos.length); i++) {
      const video = searchResults.videos[i];
      console.log(`Alvo ${i + 1} na mira: ${video.title} - ${video.url}`);

      const safeTitle = video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      // MUDANÇA 1: Agora vamos usar o formato m4a, que é universal e nativo
      const filePath = path.join(adAstraFolder, `${safeTitle}.m4a`);

      try {
        console.log(`Disparando Override Manual (Python yt-dlp) no alvo ${i + 1}...`);
        
        // MUDANÇA 2: O novo comando! Pedimos a "bestaudio" (melhor áudio) já no formato m4a nativo. 
        // Zero conversões, zero necessidade de FFmpeg!
        const command = `python -m yt_dlp -f "bestaudio[ext=m4a]" --output "${filePath}" "${video.url}"`;
        
        const { stdout, stderr } = await execPromise(command);
        if (stderr) console.log(`Aviso do Canhão: ${stderr}`);

        console.log(`Sucesso absoluto! Áudio extraído do alvo ${i + 1}.`);
        return `file:///${filePath.replace(/\\/g, '/')}`;

      } catch (err: any) {
        console.log(`\n❌ FALHA NO ALVO ${i + 1}! LENDO CAIXA PRETA:`);
        console.error(err.message);
        console.log("--------------------------------------------------\n");
      }
    }
    
    throw new Error('Todas as frequências foram bloqueadas. O YouTube venceu esta batalha, mas não a guerra.');

  } catch (error) {
    console.error("Erro no motor de dobra:", error);
    throw error;
  }
});