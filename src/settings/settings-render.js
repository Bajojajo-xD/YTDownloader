const { ipcRenderer } = require('electron');
const path = require('path');

function toggledarkmode() {
  ipcRenderer.invoke('dark-mode:toggle')
}

function versionslist() {
  ipcRenderer.invoke('browserWindow', path.join(__dirname, '../', 'engines/','engines.html'), 545, 600, false, false)
}

function updatebtn() {
  ipcRenderer.invoke('browserWindow', path.join(__dirname, '../', 'updater/','updater.html'), 510, 620, false, false)
}