const { ipcRenderer } = require('electron');
const path = require('path');

document.getElementById('toggle-dark-mode').addEventListener('click', async () => {
  await ipcRenderer.invoke('dark-mode:toggle')
})

document.getElementById('versions-list').addEventListener('click', () => {
  ipcRenderer.invoke('browserWindow', path.join(__dirname, '../', 'engines/','engines.html'), 555, 600, false, false)
})

document.getElementById('update-btn').addEventListener('click', () => {
  ipcRenderer.invoke('browserWindow', path.join(__dirname, '../', 'updater/','updater.html'), 500, 600, false, false)
})