"use strict";

let jsftp = require("jsftp"); /* https://github.com/sergi/jsftp */
let net = require("net");
let fs = require("fs");

var ftpConnection;
let connected = false;
let currentLocalPath;
let currentRemotePath = "/";


/**
 * Constants for message displaying and button state
 */
const ERROR = -1;
const LOADING = 0;
const SUCCESS = 1;
const INITIAL = 2;

const LOCAL = 0;
const REMOTE = 1;

const INITIAL_LOCAL_PATH = "D:/";
const INITIAL_REMOTE_PATH = "/";

/**
 * Call to bind HTLM elements functions on "ftp.html" page
 * Should be called in "app.js"
 */
function bindFTPContent() {

  $( document ).ready(function() {

    //Cancel submit and create jsftp object with passed data
    $( '#ftpLoginForm' ).submit(function(e){
        e.preventDefault();
        createFTPConnection(
          $('#ftpServer').val(),
          21,
          $('#ftpUsername').val(),
          $('#ftpPassword').val()
        );
        $('#ftp-login-modal').modal('hide');
    });

    //Disconnection button is hide by default, and changing cwd disabled
    $( '#ftpDisconnectButton' ).click(function(e){ closeFTPConnection (ftpConnection) });

    //Input update -> change current working directory
    $( '#local-searchbar' ).change(function() { updatePath( $(this).val(), LOCAL) });
    $( '#remote-searchbar' ).change(function() { updatePath( $(this).val(), REMOTE) });

    //When tab is restored
    if(!connected) { 
      $( '#ftpDisconnectButton' ).hide();
      $( '#local-searchbar' ).prop('disabled', true);
      $( '#remote-searchbar' ).prop('disabled', true);
    }
    $('#message-displayer').css('opacity', 0);
    bindFilesFolderActions();



  });
};

/* ----- FTP connection ----- */

/**
 * Instance the var "ftpConnection". If successfully connected, try to auth the user.
 * @param {String} host Host name, or IP adress of a remote FTP server
 * @param {Number} port Port (Usually 21)
 * @param {String} user Username
 * @param {String} pass Password
 */
function createFTPConnection(host, port = 21, user, pass) {
  setButtonState(LOADING);
  $('#remote-files').empty();
  ftpConnection = new jsftp({
    host: host,
    port: port, // defaults to 21
    user: user, // defaults to "anonymous"
    pass: pass, // defaults to "@anonymous"
    createSocket: ({port, host}) => {
      return net.createConnection({port, host})
    },
  });

  ftpConnection.on('error', (err) => connectionFailed(err,"Erreur lors de la connexion, vérifiez l'adresse du serveur")); //Server not reachable
  ftpConnection.on('connect', (err) => authentification(host, port, user, pass)); //Server reachable
  //ftpConnection.on('data', function(data){console.log(data);}) //Debug 

};

/**
 * Try to auth a user to a remote host, if success call connectionSuccessful() else display an error
 * @param {String} host Host name, or IP adress of a remote FTP server
 * @param {Number} port Port (Usually 21)
 * @param {String} user Username
 * @param {String} pass Password
 * 
 * @see connectionSuccessful()
 * @see displayMessage()
 */
function authentification(host, port, user, pass) {
  connected = false;
  console.log("Connection to "+host+":"+port+" as '"+user+"' with password : '"+pass+"'");

  ftpConnection.auth(user,pass, (err) => {
    if(err) {
      console.log(err);
      let errorMsg = err.toString().split("\n"); 
      connectionFailed(err,errorMsg[0]);
    }else {
      connectionSuccessful();   
    }
    
  });
}

/**
 * Close an existing FTP connection and display message
 * @param {jsftp} ftpConnection 
 * @see displayMessage()
 */
function closeFTPConnection(ftpConnection) {
  ftpConnection.raw("quit", (err, data) => {
    if (err) {
      console.error(err);
      displayMessage(err, ERROR);
      return ;
    }

    clearFiles();
    connected = false;

    displayMessage("Déconnecté !", SUCCESS);
    setButtonState(INITIAL);
    $( '#ftpDisconnectButton' ).hide();
    $( '#local-searchbar' ).prop('disabled', true).val("").attr("placeholder", "Chemin vers...");
    $( '#remote-searchbar' ).prop('disabled', true).val("").attr("placeholder", "Chemin vers...");

  });
};

/**
 * Call when authentification succeed, display success message and fill files
 * 
 * @see displayMessage()
 */
function connectionSuccessful ()  {
  connected = true;

  setButtonState(SUCCESS);
  displayMessage("Connexion réussie !", SUCCESS);
  $("#connected-to").html("Connecté à <b>"+ftpConnection.host+"</b>");

  

  //Allow disconnection and update on cwd
  $( '#ftpDisconnectButton' ).show();
  $( '#local-searchbar' ).prop('disabled', false);
  $( '#remote-searchbar' ).prop('disabled', false);

  //Fill view
  updatePath(INITIAL_LOCAL_PATH, LOCAL);
  updatePath(INITIAL_REMOTE_PATH, REMOTE);

  

};

/**
 * Called while issuing trouble connecting to remote server
 * @param {String} err Error message
 */
function connectionFailed (err, msgToDisplay) {
  console.log(err);
  setButtonState(ERROR);
  displayMessage(msgToDisplay, ERROR);
}

/** User's connection state to server */
function isUserConnected () {return connected;};


/* ----- Display ----- */

/**
 * Display message on view
 * @param {String} msg Message to display
 * @param {Int} code Type of message (ERROR, SUCCESS or LOADING)
 */
function displayMessage (msg, code = SUCCESS) {  
  let el = $('#message-displayer');
  el.html(msg);
  el.removeClass("alert-success"); el.removeClass("alert-primary"); el.removeClass("alert-danger"); 
  switch (code) {
    case ERROR:
      el.addClass("alert-danger"); 
      break;
    case LOADING:
      el.addClass("alert-primary"); 
      break;
    case SUCCESS:
      el.addClass("alert-success"); 
      break;
  }
  el.addClass("alert");
  el.css('opacity',100);
  el.show();
  el.delay(7000).fadeTo(3000, 0); //Display message for 10s

}

/**
 * Change connection button's state
 * @param {Number} state State of button (ERROR, SUCCESS, LOADING or INITIAL)
 */
function setButtonState (state = ERROR) {
  let el = $("#ftpConnectionState");
  el.removeClass("btn-primary"); el.removeClass("btn-danger"); el.removeClass("btn-success");  el.removeClass("btn-info");

  switch (state) {

    case ERROR :
      el.html('<i class="fas fa-times"></i>&nbsp;Non connecté');
      el.addClass("btn-danger");
      break;

    case LOADING:
      el.html('<i class="fas fa-spinner"></i>&nbsp;Connexion...');
      el.addClass("btn-info");
      break;

    case SUCCESS :
      el.html('<i class="fas fa-check-circle"></i>&nbsp;Connecté');
      el.addClass("btn-success");
      break;

    case INITIAL :
      el.html('Se connecter');
      el.addClass("btn-primary");
      break;
  }
}


/* ----- FTP functions on files / folder ----- */

/**
 * 
 * @param {jsftp} ftpConnection 
 * @param {String} remoteCWD 
 * @param {*} callback Function to pass data when done
 * @return an Array of files
 */
function listFiles(ftpConnection, remoteCWD, callback) {
  if (!isUserConnected()) { return; }
  ftpConnection.list(remoteCWD, (err, res) => { callback(res); });
}


/**
 * Create folder on remote server
 * @param {jsftp} ftp FTP connection
 * @param {String} cwd Path
 * @param {String} name Folder's name
 */
function createFolder(ftp, cwd, name) {
  ftp.raw("mkd", cwd+name, (err, data) => {
    if (err) {
      return console.error(err);
    }
    console.log(data.text); // Show the FTP response text to the user
    console.log(data.code); // Show the FTP response code to the user
  });
}


/**
 * Fill view with files from remote server
 * @param {String} cwd Path where to find files
 * @param {jsftp} ftp FTP connection
 * 
 * @see createFolderFileView()
 */
function fillRemoteFiles(cwd,ftp = ftpConnection) {

  let filesAndFolders = [];
  ftp.ls(cwd, (err, res) => {
    if(err) {
      console.error(err);
      return;
    }

    console.log(res);
    res.forEach(function(fileOrFolder) {
      let type = fileOrFolder.type==1 ? 'folder' : 'file';
      filesAndFolders.push({ name: fileOrFolder.name , type : type, path : cwd+"/"+fileOrFolder.name });
    });
    createFolderFileView(REMOTE, filesAndFolders, cwd);
    currentRemotePath = cwd;
  });
}



/* ----- Local folder functions ----- */

/**
 * Fill view with local files
 * @param {String} cwd Path where to find files
 * 
 * @see createFolderFileView()
 */
function fillLocalFiles(cwd) {
  getAllFilesFromFolder(cwd, (files) => { createFolderFileView(LOCAL, files, cwd); currentLocalPath = cwd; });
}

/**
 * 
 * @param {Number} type Local or remote server ?
 * @param {Array<Object>} dataArr Array filled with object containing data from files/folders
 */
function createFolderFileView(type, dataArr, cwd) {
  let el;
  //LOCAL
  if(type == LOCAL) {
    el = $('#local-files'); el.empty();
    dataArr.forEach(function(fileOrFolder) {
      let logoClass;  let primaryClass;
      if( !fileOrFolder.type.localeCompare('folder') ) {
        logoClass = 'far fa-folder';
        primaryClass = 'folderFile folder-local';
      }else {
        logoClass = 'far fa-file';
        primaryClass = 'folderFile file-local';
      }
      el.append("<div class='"+primaryClass+"' data-path='"+fileOrFolder.path+"'><i class='folderFileLogo "+logoClass+"'></i><div class='folderFileName'>"+fileOrFolder.name+"</div></div>");
    });

  //REMOTE
  }else if (type == REMOTE) {
    el = $('#remote-files');  el.empty();
    dataArr.forEach(function(fileOrFolder) {
      let logoClass;  let primaryClass;
      if( !fileOrFolder.type.localeCompare('folder') ) {
        logoClass = 'far fa-folder';
        primaryClass = 'folderFile folder-remote';
      }else {
        logoClass = 'far fa-file';
        primaryClass = 'folderFile file-remote';
      }
      el.append("<div class='"+primaryClass+"' data-path='"+fileOrFolder.path+"'><i class='folderFileLogo "+logoClass+"'></i><div class='folderFileName'>"+fileOrFolder.name+"</div></div>");
    });
  }else return console.error("No type specified");
  
  //Parent folder
  let parentType = type==LOCAL?"folderFile folder-local":"folderFile folder-remote";
  let parentPath = getParentFolder(cwd);
  el.prepend("<div class='"+parentType+"' data-path='"+parentPath+"'><i class='folderFileLogo far fa-folder'></i><div class='folderFileName'>..</div></div>")

  //Need to bind our new classes
  bindFolderClick();


}


//TODO full async
/**
 * 
 * @param {String} cwd Local path where to find files
 * @param {*} callback Function to pass data when done 
 * @returns an Array of Object fullfilled with data from folders and files
 */
async function getAllFilesFromFolder (cwd,callback) {

  let results = [];

  fs.readdir(cwd, (err, list) => {
    if(err) {
      console.error(err);
      updatePath(currentLocalPath, LOCAL);
      return;
    };
    
    list.sort();
    list.forEach(function(file) {
      let path = cwd+"/"+file;
      
      try {

        let stat = fs.statSync(path); let type = "file";

        if(stat.isDirectory()) {type = 'folder';}
        else type = 'file';
        results.push({ name: file, type: type, path: path })

      }catch(e) {/*console.log(e);*/ /* No permission on file/folder */}

    });
    callback(results);
  });
};

/* ----- View update ----- */


/**
 * Remove all files from view
 */
function clearFiles() {
  $( '#remote-files' ).empty();
  $( '#local-files' ).empty();
}

/**
 * Update local or remote current path, and fill data into corresponding area
 * @param {String} cwd 
 * @param {Number} type 
 */
function updatePath(cwd, type) {
  if(! (cwd && cwd.localeCompare("") != 0)) cwd = "/"; // cwd empty or null
  cwd = formateCwd(cwd);
  console.log("Update path "+cwd);
  let el;
  if(type == LOCAL) {
    el = $( '#local-searchbar' );
    fillLocalFiles(cwd); // Current path will only be updated when data has filled
  }else if(type == REMOTE) {
    el = $( '#remote-searchbar' );
    fillRemoteFiles(cwd); // Current path will only be updated when data has filled
  }else return console.error("Update path should be either on LOCAL or REMOTE");

  el.attr("placeholder", cwd);
  el.val(cwd);
  
}

/**
 * Formate current working directory, removing double backslash and incorrect form
 * @param {String} str  
 * @return formattedCwd string
 */
function formateCwd(str) {
  if(str.slice(-1) == ':') return str + "/";

  while(str.includes("//") || str.includes("\\\\")) {
    str = str.replace("//", "/");
    str = str.replace("\\\\", "/");
  }
  return str;
}

/**
 * Get the parent folder of another folder
 * @param {String} pathToFolder 
 * @returns {String} the parent path
 */
function getParentFolder(pathToFolder) {
  if(pathToFolder.slice(-1) == '/' || pathToFolder.slice(-1) == '\\') pathToFolder =  pathToFolder.slice(0,-1); // End with a slash
  pathToFolder = formateCwd(pathToFolder); // Remove multi slash
  let newWd = "";
  let splited = pathToFolder.split("/");
  for(let i= 0; i < splited.length-1; i++) { newWd += splited[i] + "/"; }

  return newWd;
}


function bindFolderClick() {
  //Open folder on click
  $( '.folder-local' ).click(function() { updatePath( $(this).data("path"), LOCAL) });
  $( '.folder-remote' ).click(function() { updatePath( $(this).data("path"), REMOTE) });
}

function bindFilesFolderActions() {
  bindFolderClick();
  
}