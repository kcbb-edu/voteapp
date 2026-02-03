const socket = io();
let scoredUsers = [],
    isScored = false,
    randomId;

$('.scoreBtn').on('click', (event) => {

    if (!localStorage.getItem('userId')) {
        randomId = rand();
        localStorage.setItem('userId', randomId);
    }

    showConfirmMsg('發送中...');
    console.log('OnClick: ' + $(event.target).data('score'));

    socket.emit('authUser', { 'withData': true, 'socreClicked': $(event.target).data('score')}, (confirmation) =>{
        console.log(confirmation);
        
        if (!isScored) {        
            socket.emit('score', { userId: randomId, score: $(event.target).data('score') }, (confirmation) => {
                showConfirmMsg(confirmation, 0);
                if (!confirmation) {
                    localStorage.removeItem('userId');
                }
                isScored = true;
            });
            
        }
    });
});

socket.on('reset', () => {
    dismissConfirmMsg();
    localStorage.removeItem('userId');
    isScored = false;
    showStatusMessage('statusMsgConnected');
});

socket.on('connect', () => {
    showStatusMessage('statusMsgConnected');
    console.log(scoredUsers);
    
});

socket.on('disconnect', () => {
    showStatusMessage('statusMsgDisconnected');
});

socket.on('authUser', (data) => {
    console.log('authUser with user array from server:' + data.scoredUsers);
    if (isScored) {
        
    } else if (checkScoredUser(data.scoredUsers)) {
        showConfirmMsg('Already scored in this session.', 0);
        isScored = true;
    } else {
        dismissConfirmMsg(0);
    }
});


function showConfirmMsg (message, speed = 200){
    $('.confirmWrapper').animate({ top: 0, opacity: 1 }, speed).children('.confirmMsg').html(message);
}

function dismissConfirmMsg (speed = 200) {
    $('.confirmWrapper').animate({ top: '220px', opacity: 0 }, speed).children('.confirmMsg').html(' ');
}

function showStatusMessage (className) {
    const div = $('.' + className);
    div.show();
    div.siblings().hide();
}

function authUser(userIds) {
    scoredUsers = userIds;
    console.log(scoredUsers);
    let localUserId = localStorage.getItem('userId');
    if (localUserId && scoredUsers.includes(localUserId)) {
        showConfirmMsg('Already scored in this session.', 0);
        console.log('localUserId: ' + localUserId);
    } else {
        dismissConfirmMsg(0);
    }
}

function checkScoredUser(userIdsFromServer) {
    scoredUsers = userIdsFromServer;
    console.log(scoredUsers);
    let localUserId = localStorage.getItem('userId');
    if (localUserId && scoredUsers.includes(localUserId)) {
        console.log('localUserId: ' + localUserId);
        return true;
    } else {
        return false;
    }
}

function rand () {
    return Math.random().toString(36).substr(2); // remove `0.`
};