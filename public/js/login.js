var elements = {
        login       : document.getElementById('login'),
        logout      : document.getElementById('logout'),
        node        : document.getElementById('node'),
        v8          : document.getElementById('v8'),
        os          : document.getElementById('os'),
        arch        : document.getElementById('arch'),
        rss         : document.getElementById('rss'),
        heapUsed    : document.getElementById('heapUsed'),
        heapTotal   : document.getElementById('heapTotal')
    };


function focusLogin(obj) {
    elements.login.setAttribute('class', 'visible');
    elements.logout.setAttribute('class', 'hidden');
};

function focusLogout(obj) {
    elements.login.setAttribute('class', 'hidden');
    elements.logout.setAttribute('class', 'visible');
};

function focusAuthError(obj) {
    focusLogin();
    console.log('Error in login: ', obj);
}

function setServerStats(obj) {
    elements.node.innerHTML = obj.node;
    elements.v8.innerHTML = obj.v8;
    elements.os.innerHTML = obj.os;
    elements.arch.innerHTML = obj.arch;
}

function setRealTimeStats(obj) {
    elements.rss.innerHTML = obj.rss;
    elements.heapUsed.innerHTML = obj.heapUsed;
    elements.heapTotal.innerHTML = obj.heapTotal;
}


function socketInit() {
    var socket = new WebSocket('ws://' + window.location.host + '/stream');

    socket.addEventListener('message', function(msg) {
        setRealTimeStats(JSON.parse(msg.data));
    });

    socket.addEventListener('close', function(msg) {
        setRealTimeStats({rss:'n/a', heapUsed:'n/a', heapTotal:'n/a'});
    })
};




function authenticate(el) {
    el.preventDefault();

    var form    = new FormData(el.target),
        xhr     = new XMLHttpRequest();

    xhr.open(el.target.getAttribute('method'), el.target.getAttribute('action'), true);
    xhr.onloadend = function(obj) {
        var response = JSON.parse(obj.target.responseText);
        if (response.auth === 1) {
            getUserInfo();
            socketInit();
        } else if (response.auth === -1) {
            focusAuthError(response);
        } else {
            getUserInfo();
        }
    }
    xhr.send(form);

    return false;
}


function getData(url, onSuccess) {
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.onloadend = function(obj){
        if (onSuccess) {
            onSuccess.call(null, JSON.parse(obj.target.responseText));
        }
    };
    xhr.send();
}


function getUserInfo() {
    getData('/userinfo', function(obj){
        if (obj.auth === 0) {
            getServerStats();
            focusLogin();
        } else {
            console.log('Logged in as', obj);
            getServerStats();
            focusLogout();
        }
    });
}


function getServerStats() {
    getData('/stats', function(obj){
        if (obj.auth === 0) {
            setServerStats({node:'n/a', v8:'n/a',os:'n/a',arch:'n/a'});
        } else {
            setServerStats(obj);
        }
    });
}

getUserInfo();
// getServerStats();


elements.login.addEventListener('submit', authenticate);
elements.logout.addEventListener('submit', authenticate);