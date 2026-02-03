const socket = io();
let scoredUsers = [],
    isScored = false,
    randomId;

function preventZoom(e) {
  var t2 = e.timeStamp;
  var t1 = e.currentTarget.dataset.lastTouch || t2;
  var dt = t2 - t1;
  var fingers = e.touches.length;
  e.currentTarget.dataset.lastTouch = t2;

  if (!dt || dt > 500 || fingers > 1) return; // not double-tap

  e.preventDefault();
  e.target.click();
}

function rand() {
    return Math.random().toString(36).substr(2); // remove `0.`
};

function showConfirmMsg(msg, shakeVal) {
    if (shakeVal >= 0 && $.fn.effect) {
        $('.confirmWrapper').effect('shake', { times: 2, distance: 5 }, 500);
    }
    $('.confirmMsg').text(msg).fadeIn();
}

// Logic to switch UI
function showLogin() {
    $('.loginWrapper').css('display', 'flex'); // Flex for centering
    $('.scoreBtnWrapper').hide();
    $('.confirmMsg').text('');
}

function showVoting(code) {
    $('.loginWrapper').hide();
    $('.scoreBtnWrapper').show();
    $('.roomCodeDisplay').text(code);
}

function joinSession(code, silent = false) {
    if(!code) {
        if(!silent) {
            showConfirmMsg('請輸入房號', 0);
            setTimeout(() => showConfirmMsg(' '), 2000);
        }
        return;
    }
    
    socket.emit('checkCode', code, (isValid) => {
         if (isValid) {
             localStorage.setItem('sessionCode', code);
             showVoting(code);
             if(!silent) $('.confirmMsg').text(" "); 
         } else {
             localStorage.removeItem('sessionCode');
             showLogin();
             if(!silent) {
                 showConfirmMsg('房號錯誤 (Wrong Code)', 0);
                 setTimeout(() => showConfirmMsg(' '), 2000);
             }
         }
    });
}

$(document).ready(() => {
    // Check if we have a saved code
    const savedCode = localStorage.getItem('sessionCode');
    if (savedCode) {
        $('.sessionCodeInput').val(savedCode);
        joinSession(savedCode, true); // true = silent check
    } else {
        showLogin();
    }
});

$('.btnJoin').on('click', () => {
    const code = $('.sessionCodeInput').val();
    joinSession(code);
});

$('.scoreBtn').on('click', (event) => {

    if (!localStorage.getItem('userId')) {
        randomId = rand();
        localStorage.setItem('userId', randomId);
    }
    
    // Safety check: Ensure we have a code
    const code = localStorage.getItem('sessionCode') || $('.sessionCodeInput').val();

    if (!code) {
        showLogin();
        return;
    }

    showConfirmMsg(' 發送中...');

    socket.emit('authUser', { 'withData': true, 'socreClicked': $(event.target).data('score')}, (confirmation) =>{
        
        socket.emit('score', { userId: randomId, score: $(event.target).data('score'), code: code }, (confirmation) => {
            if (confirmation && confirmation.includes('Error')) {
                   showConfirmMsg('房號無效，請重新加入', 0);
                   localStorage.removeItem('sessionCode');
                   setTimeout(() => {
                        showLogin();
                        $('.sessionCodeInput').val('');
                        showConfirmMsg('');
                   }, 1500);
            } else {
                   showConfirmMsg(confirmation, 0);
                   isScored = true;
            }
        });
    });
});

socket.on('disconnect', () => {
   $('.statusMsgConnected').hide(); 
   $('.statusMsgDisconnected').show();
});

socket.on('connect', () => {
   $('.statusMsgDisconnected').hide();
   $('.statusMsgConnected').show();
});

socket.on('pushScore', (message) => {
    console.log(message);
});

socket.on('reset', (message) => {
    // On system reset, maybe we should kick users out?
    // Or just clear message.
    showConfirmMsg(''); 
    // Option: Force re-login?
    // localStorage.removeItem('sessionCode');
    // showLogin();
    // But user asked for reset in admin page, usually to clear scores.
    // If we change code, we should probably force logout.
    // index.js regenerates code on reset.
    // So the client's current code is now INVALID.
    // So logic:
    localStorage.removeItem('sessionCode');
    showLogin();
    showConfirmMsg('系統重置 (Reset)', 0);
});
