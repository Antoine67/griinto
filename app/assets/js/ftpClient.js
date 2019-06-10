let jsftp = require("jsftp"); /* https://github.com/sergi/jsftp */
let net = require("net");

let ftpConnection = null;
let connected = false;

/**
 * Call to bind HTLM elements functions on "ftp.html" page
 * Should be called in "app.js"
 */
function bindFTPContent() {

  $( document ).ready(function() {

    //Cancel submit and create jsftp object with passed data
    $("#ftpLoginForm").submit(function(e){
        e.preventDefault();
        ftpConnection = createFTPConnection(
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
  
    displayMessage("Déconnecté !",1);
  });
};


function connectionSuccessful ()  {
  connected = true;
  setButtonState(1);
  displayMessage("Connexion réussie !",1);
  console.log(ftpConnection);
  $("#connected-to").html("Connecté à <b>"+ftpConnection.host+"</b>");
};


function connectionFailed (err) {
  console.log(err);
  setButtonState(-1);
  displayMessage("Erreur lors de la connexion",-1);
}

function userShouldConnect () {

};

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

/*

Ftp.raw("mkd", "/new_dir", (err, data) => {
  if (err) {
    return console.error(err);
  }
  console.log(data.text); // Show the FTP response text to the user
  console.log(data.code); // Show the FTP response code to the user
});
*/