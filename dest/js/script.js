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
    
    if (!msg || msg.trim() === "") {
        $('.confirmWrapper').fadeOut();
    } else {
        $('.confirmMsg').text(msg);
        $('.confirmWrapper').fadeIn();
    }
}

// Logic to switch UI
function showLogin() {
    $('.loginWrapper').css('display', 'flex'); // Flex for centering
    $('.scoreBtnWrapper').hide();
    showConfirmMsg('');
}

function showVoting(code) {
    $('.loginWrapper').hide();
    $('.scoreBtnWrapper').show();
    $('.scoreBtn').show(); // Ensure buttons are shown
    $('.roomCodeDisplay').text(code);
}

function showVotedState(score) {
    $('.scoreBtn').hide();
    showConfirmMsg('已評分 (Voted): ' + score);
}

function joinSession(code, silent = false) {
    if(!code) {
        if(!silent) {
            showConfirmMsg('請輸入房號', 0);
            setTimeout(() => showConfirmMsg(''), 2000);
        }
        return;
    }
    
    socket.emit('checkCode', code, (isValid) => {
         if (isValid) {
             localStorage.setItem('sessionCode', code);
             showVoting(code);
             
             // Always clear loading message on success, even if silent
             // This removes the "載入中..." overlay on page refresh
             showConfirmMsg(''); 
             
             // Check if already voted in this session
             const lastVotedCode = localStorage.getItem('lastVotedCode');
             if (lastVotedCode === code) {
                 const lastScore = localStorage.getItem('lastScore') || '';
                 showVotedState(lastScore);
             }
         } else {
             localStorage.removeItem('sessionCode');
             showLogin();
             if(!silent) {
                 showConfirmMsg('房號錯誤 (Wrong Code)', 0);
                 setTimeout(() => showConfirmMsg(''), 2000);
             }
         }
    });
}

$(document).ready(() => {
    // Cross-Tab Synchronization
    // Listen for storage changes from OTHER tabs
    window.addEventListener('storage', (e) => {
       if (e.key === 'lastScore' && e.newValue) {
           // Another tab voted
           const storedCode = localStorage.getItem('lastVotedCode');
           const currentCode = localStorage.getItem('sessionCode');
           
           if (storedCode && storedCode === currentCode) {
                isScored = true;
                showVotedState(e.newValue);
           }
       }
       if (e.key === 'sessionCode' && !e.newValue) {
           // Another tab logged out / reset
           localStorage.removeItem('sessionCode');
           showLogin();
       }
    });

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
        
        const scoreVal = $(event.target).data('score');
        
        socket.emit('score', { userId: randomId, score: scoreVal, code: code }, (confirmation) => {
            if (confirmation && confirmation.includes('Error')) {
                   if (confirmation.includes('voted')) {
                       // Already voted
                       showVotedState(localStorage.getItem('lastScore') || scoreVal);
                       localStorage.setItem('lastVotedCode', code);
                   } else {
                       // Wrong code or other error
                       showConfirmMsg('房號無效，請重新加入', 0);
                       localStorage.removeItem('sessionCode');
                       setTimeout(() => {
                            showLogin();
                            $('.sessionCodeInput').val('');
                            showConfirmMsg('');
                       }, 1500);
                   }
            } else {
                   // Success
                   isScored = true;
                   localStorage.setItem('lastVotedCode', code);
                   localStorage.setItem('lastScore', scoreVal);
                   showVotedState(scoreVal);
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
    localStorage.removeItem('sessionCode');
    localStorage.removeItem('lastVotedCode');
    localStorage.removeItem('lastScore');
    location.reload();
});

socket.on('resetVote', (message) => {
    isScored = false;
    localStorage.removeItem('lastVotedCode');
    localStorage.removeItem('lastScore');
    
    showConfirmMsg(''); // Clear any "Scored" message
    
    // Explicitly show everything again
    $('.loginWrapper').hide();
    $('.scoreBtnWrapper').show();
    $('.scoreBtn').show(); // Show buttons again
    
    // Maybe show a quick toast
    let toast = $('<div style="position:fixed;top:10%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;padding:10px 20px;border-radius:20px;z-index:999;">投票已重置 (Vote Reset)</div>');
    $('body').append(toast);
    setTimeout(() => toast.fadeOut(() => toast.remove()), 2000);
});
