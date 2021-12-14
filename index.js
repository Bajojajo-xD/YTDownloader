const { app, BrowserWindow, nativeTheme, ipcMain } = require('electron');

app.on('ready', () => {
  const loading = new BrowserWindow({show: false, frame: false, width: 420, height: 320, alwaysOnTop: true, webPreferences: {nodeIntegration: true, contextIsolation: false}});
  loading.loadFile('src/loading.html')
  loading.once('ready-to-show', () => {
    loading.show()
  })

  const main = new BrowserWindow({
    width: 800,
    height: 600,
    icon: 'src/images/icon.ico',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
  });
  main.loadFile('src/index.html');
  main.removeMenu();
  loading.once('closed', () => {
    main.show()
  })
});

//ipc functions handler

ipcMain.handle('dark-mode:toggle', () => {
  if (nativeTheme.shouldUseDarkColors) {
    nativeTheme.themeSource = 'light'
  } else {
    nativeTheme.themeSource = 'dark'
  }
  return nativeTheme.shouldUseDarkColors
})

ipcMain.handle('app_version', () => {
  return app.getVersion();
});


let updateinfo = null, updatedownload = null
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



ipcMain.handle('close', () => {
  app.exit()
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