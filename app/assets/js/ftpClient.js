let jsftp = require("jsftp"); /* https://github.com/sergi/jsftp */
let net = require("net");

let ftpConnection = null;
let connected = false;
	
function bindFTPContent() {
  console.log("there");
  $( document ).ready(function() {

    //Cancel submit and create jsftp object with passed data
    $("#ftpLoginForm").submit(function(e){
        e.preventDefault();
        ftpConnection = createFTPConnection();
        $('#ftp-login-modal').modal('hide');
        /* listFiles(ftpConnection), ".";*/
    });
  });
  
};



function createFTPConnection(host = "bftp.dlptest.com", port = 21, user = 'dlpuser@dlptest.com', pass = '5p2tvn92R0di8FdiLCfzeeT0b') {
  console.log("Connexion...");
  setButtonState(0);
  const Ftp = new jsftp({
    host: host,
    port: port, // defaults to 21
    user: user, // defaults to "anonymous"
    pass: pass, // defaults to "@anonymous"
    createSocket: ({port, host}) => {
      return net.createConnection({port, host})
    },
  });

  Ftp.on('error', (err) => connectionFailed(err));
  Ftp.on('connect', (err) => connectionSuccessful());

  return Ftp;
};


function closeFTPConnection(ftpConnection) {
  ftpConnection.raw("quit", (err, data) => {
    if (err) {
      return console.error(err);
    }
  
    console.log("Disconnected");
  });
};

function listFiles(ftpConnection, remoteCWD) {
  if (!isUserConnected()) {
    userShouldConnect();
    return;
  }
  ftpConnection.list(remoteCWD, (err, res) => {
    console.log(res);
  });
}

function connectionSuccessful ()  {
  console.log('connected to server!');
  connected = true;
  setButtonState(1);
};


function connectionFailed (err) {
  console.log(err);
  setButtonState(-1);
  displayError("Erreur lors de la connexion");
}

function userShouldConnect () {

};

function isUserConnected () {
  return connected;
};


/* ----- Display ----- */
function displayError () {  

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

/*

Ftp.raw("mkd", "/new_dir", (err, data) => {
  if (err) {
    return console.error(err);
  }
  console.log(data.text); // Show the FTP response text to the user
  console.log(data.code); // Show the FTP response code to the user
});
*/