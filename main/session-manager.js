initialise();

var container = document.getElementById('container');

getAllSessionFolders(appendSessions);

function appendSessions(sessionFolders) {
  for (var i = 0; i < sessionFolders.length; i++) {
    var sessionFolder = sessionFolders[i];

    var sessionList = document.getElementById('saved-sessions-list');
    var sessionElement = document.createElement('li');
    sessionElement.setAttribute('class', 'session mdc-list-item mdc-theme--background mdc-elevation--z2');
    sessionElement.innerHTML = '<span class="mdc-list-item__start-detail">' +
    '<i class="material-icons">backup</i>' +
    '</span>' +
    '<span class="mdc-list-item__text">' +
    sessionFolder.title +
    '<span class="mdc-list-item__text__secondary">' +
    sessionFolder.children.length + ' tabs' +
    '</span>' +
    '</span>' +
    '<span class="mdc-list-item__end-detail">' +
    '<i class="material-icons">delete</i>' +
    '</span>';

    sessionList.appendChild(sessionElement);
  }
}

mdc.autoInit();
