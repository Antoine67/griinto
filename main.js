const electron = require('electron')
const { app, BrowserWindow, ipcMain } = electron

//TODO electron-store to save user's data

let win

//Disable electron security warning in console
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

function createWindow () {
  
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width: width-100,
    height: height-100,
    webPreferences: {
      nodeIntegration: true,
      webviewTag: true
    }
  })
  
  win.loadFile('app/app.html');
  win.setMenu(null); // No menu on top

  //Uncomment for dev console
  win.webContents.openDevTools()
  

  win.on('closed', () => {
    win = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  //macOS
  if (process.platform !== 'darwin') { app.quit() }
})

app.on('activate', () => {
  // macOS
  if (win === null) { createWindow() }
})

