const { ipcRenderer } = require("electron");
const path = require('path');

document.getElementById('settings').src="../images/settings.png"

document.getElementById('settings').addEventListener('click', () => {
  ipcRenderer.invoke('browserWindow', path.join(__dirname, '../', 'settings/','settings.html'), 430, 600, false, true)
})