let jsftp = require("jsftp"); /* https://github.com/sergi/jsftp */
let net = require("net");
let fs = require("fs");
var TreeView = require('js-treeview');

var ftpConnection;
let connected = false;
let currentFolder = "/";

/**
 * Call to bind HTLM elements functions on "ftp.html" page
 * Should be called in "app.js"
 */
function bindFTPContent() {

  $( document ).ready(function() {

    //Cancel submit and create jsftp object with passed data
    $("#ftpLoginForm").submit(function(e){
        e.preventDefault();
        createFTPConnection(
          $('#ftpServer').val(),
          21,
          $('#ftpUsername').val(),
          $('#ftpPassword').val()
        );
        $('#ftp-login-modal').modal('hide');
    });
  });
  
};

/* ----- FTP connection ----- */

function createFTPConnection(host, port = 21, user, pass) {
  setButtonState(0);
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

  ftpConnection.on('error', (err) => connectionFailed(err)); //Server not reachable
  ftpConnection.on('connect', (err) => authentification(host, port, user, pass)); //Server reachable
  //ftpConnection.on('data', function(data){console.log(data);}) //Debug 

};

function authentification(host, port, user, pass) {
  connected = false;
  console.log("Connection to "+host+":"+port+" as '"+user+"' with password : '"+pass+"'");

  ftpConnection.auth(user,pass, (err) => {
    if(err) {
      console.log(err);
      errStr = err.toString();
      var errorMsg = errStr.substr(0, errStr.indexOf('\n')); 
      displayMessage(errorMsg, -1);
    }else {
      connectionSuccessful();   
    }
    
  });
}


function closeFTPConnection(ftpConnection) {
  ftpConnection.raw("quit", (err, data) => {
    if (err) {
      return console.error(err);
    }
  
    displayMessage("Déconnecté !",1);
  });
};


function connectionSuccessful ()  {
  connected = true;
  setButtonState(1);
  displayMessage("Connexion réussie !",1);
  $("#connected-to").html("Connecté à <b>"+ftpConnection.host+"</b>");
  fillLocalFiles("/");
  fillRemoteFiles("/");

};


function connectionFailed (err) {
  console.log(err);
  setButtonState(-1);
  displayMessage("Erreur lors de la connexion",-1);
}


function isUserConnected () {
  return connected;
};


/* ----- Display ----- */
function displayMessage (msg, code=0) {  
  let el = $('#message-displayer');
  el.html(msg);
  el.removeClass("alert-success"); el.removeClass("alert-primary"); el.removeClass("alert-danger"); 
  switch (code) {
    case -1:
      el.addClass("alert-danger"); 
      break;
    case 0:
      el.addClass("alert-primary"); 
      break;
    case 1:
      el.addClass("alert-success"); 
      break;
  }
  el.addClass("alert");
  el.css('opacity',100);
  el.show();
  el.delay(7000).fadeTo(3000, 0); //Display message for 10s

}

function setButtonState (state = -1) {
  let el = $("#ftpConnectionState");

  el.removeClass("btn-primary"); el.removeClass("btn-danger"); el.removeClass("btn-success");  el.removeClass("btn-info");
  switch (state) {
    case -1 :
      el.html('<i class="fas fa-times"></i>&nbsp;Non connecté');
      el.addClass("btn-danger");
      break;
    case 0:
      el.html('<i class="fas fa-spinner"></i>&nbsp;Connexion...');
      el.addClass("btn-info");
      break;
    case 1 :
      el.html('<i class="fas fa-check-circle"></i>&nbsp;Connecté');
      el.addClass("btn-success");
      break;
  }
}


/* ----- FTP functions on files / folder ----- */

function listFiles(ftpConnection, remoteCWD) {
  if (!isUserConnected()) {
    userShouldConnect();
    return;
  }
  ftpConnection.list(remoteCWD, (err, res) => {
    return res;
  });
}


function fillRemoteFiles(cwd,ftp = ftpConnection) {

  let filesAndFolders = [];
  ftp.ls(cwd, (err, res) => {
    console.log(res);
    res.forEach(function(fileOrFolder) {
      let type = fileOrFolder.type==1 ? 'folder' : 'file';
      filesAndFolders.push({ name: fileOrFolder.name , type : type});
    });
    createFolderFileView('remote-files',filesAndFolders);
  });

}





/* ----- Local folder functions ----- */


function fillLocalFiles(cwd) {
  
  let filesAndFolders = [];
  getAllFilesFromFolder(cwd).forEach(function(fileOrFolder) {
    filesAndFolders.push({ name: fileOrFolder, type: 'file' })
  });

  //var tree = new TreeView(filesAndFolders, 'local-files');
  createFolderFileView('local-files',filesAndFolders);

}

function createFolderFileView(divId, dataArr) {
  let el = $('#'+divId); el.empty();

  dataArr.forEach(function(fileOrFolder) {
    let logoClass = !fileOrFolder.type.localeCompare('folder') ? 'far fa-folder' : 'far fa-file';
    el.append("<div class='folderFile'><i class='folderFileLogo "+logoClass+"'></i><div class='folderFileName'>"+fileOrFolder.name+"</div></div>");
  });

}




function getAllFilesFromFolder (dir) {

  let results = [];

  fs.readdirSync(dir).forEach(function(file) {

      path = dir+" "+file;
      //var stat = fs.lstatSync(path)
      /*
      if (stat && stat.isDirectory()) {
          results = results.concat(getAllFilesFromFolder(file))
      } else results.push(file);
      */
     results.push(file);
  });

  return results;

};








function createFolder(ftp, cwd, name) {
  ftp.raw("mkd", cwd+name, (err, data) => {
    if (err) {
      return console.error(err);
    }
    console.log(data.text); // Show the FTP response text to the user
    console.log(data.code); // Show the FTP response code to the user
  });
}



