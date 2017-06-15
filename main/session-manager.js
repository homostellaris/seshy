initialise();

var container = document.getElementById('container');

getAllSessionFolders(appendSessions);

function appendSessions(sessionFolders) {
  for (var i = 0; i < sessionFolders.length; i++) {
    var sessionFolder = sessionFolders[i];

    var sessionElement = document.createElement('div');
    sessionElement.setAttribute('class', 'session');
    sessionElement.innerHTML = '<h3>' + sessionFolder.title + '</h3>' +
    '<h4>' + sessionFolder.children.length + ' tabs' + '</h4>' +
    '<p class="train-of-thought">' +
    "Need to add deletion of sessions. Explore using Google's material design repositories on GitHub for style." +
    "Remember that the extension should look and feel like a natural extension of Chrome." +
    '</p>';

    container.appendChild(sessionElement);
  }
}
