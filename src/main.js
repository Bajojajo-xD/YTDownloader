const { app, BrowserWindow, ipcMain, nativeTheme, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

//mainWindow
let mainWindow
const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: 'src/images/icon.ico',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'main.html'));
  mainWindow.removeMenu()

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  
  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};


function createBrowserWindow(url, h, w, r, f, whatever) {
  const win = new BrowserWindow({
    height: h,
    width: w,
    icon: 'src/images/icon.ico',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    resizable: r,
    show: false,
    frame: f,
  });

  win.loadFile(url);
  win.removeMenu()

  win.once('ready-to-show', () => {
    win.show()
      win.webContents.send('from-other-renderer', whatever)
  })
  // Open the DevTools.
   win.webContents.openDevTools();
}

//ipc functions handler

ipcMain.handle('dark-mode:toggle', () => {
  if (nativeTheme.shouldUseDarkColors) {
    nativeTheme.themeSource = 'light'
  } else {
    nativeTheme.themeSource = 'dark'
  }
  return nativeTheme.shouldUseDarkColors
})

ipcMain.handle('askForDownload', (e, loc) => {
  return dialog.showSaveDialog({title: 'Where to save?', defaultPath: loc})
})

ipcMain.handle('browserWindow', (event, url, h, w, r, f, whatever) => {
  return createBrowserWindow(url, h, w, r, f, whatever)
})

ipcMain.handle('destroyWindow', () => {
  return BrowserWindow.getFocusedWindow().destroy()
})

ipcMain.handle('app_version', () => {
  return app.getVersion();
});


let updateinfo = null, updatedownload = null, win
ipcMain.handle('check-for-updates', async event => {
  win = event.sender
  if (!updateinfo) {
    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {}
  } 
  else if (updatedownload === 'ready') {
  try {
    win.send('update_ready', updateinfo);
  } catch (err) {}
  }
  else if (updatedownload === 'init') {
    try {
      win.send('update_progress', updateinfo, 'init');
    } catch (err) {}
  }
  else if (updateinfo) {
    win.send('update_available', updateinfo);
  }
});

ipcMain.handle('download_updates', async event => {
  win = event.sender
  if (!updatedownload) {
    updatedownload = 'init';
    await autoUpdater.downloadUpdate()
  }
});

ipcMain.handle('restart_and_update', () => {
  autoUpdater.quitAndInstall();
});


//AutoUpdater functions

autoUpdater.autoDownload = false;

autoUpdater.on('error', (err) => {
  try {
    win.send('update_error', err);
  } catch (err) {}
});

autoUpdater.on('update-not-available', () => {
  try {
    win.send('update_not_available');
  } catch (err) {}
});

autoUpdater.on('update-available', info => {
  updateinfo = info
  try {
    win.send('update_available', updateinfo);
  } catch (err) {}
});

autoUpdater.on('download-progress', async progress => {
  updatedownload = progress
  try {
    await win.send('update_progress', updateinfo, updatedownload);
  } catch (err) {}
});

autoUpdater.on('update-downloaded', () => {
  updatedownload = 'ready'
  try {
    win.send('update_ready', updateinfo);
  } catch (err) {}
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
