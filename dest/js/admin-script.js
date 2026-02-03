const socket = io();
let currentScore = [],
    displayScore = 0;
var numAnim = new CountUp($('.score')[0], 0, 0, 1, 1);

$(document).ready(() => {

    showStatusMessage('statusMsgConnecting');

    socket.on('pushScore', (message) => {
        console.log(message);
        displayScore = updateScore(currentScore, message);

        // $('.score').html(displayScore);
        numAnim.update(displayScore);
        $('.votedCount').html('已投票人數: ' + currentScore.length);
    });

    socket.on('onlineUserCount', (message) => {
        $('.statusConnectedUser').html('已連線用戶: ' + message);
    });

    socket.on('connect', () => {
        showStatusMessage('statusMsgConnected');
    });

    socket.on('disconnect', () => {
        showStatusMessage('statusMsgDisconnected');
    });

    socket.on('onlineUsers', (message) => {
        $('.statusConnectedUser').html('已連線用戶: ' + message);
    });

    socket.on('reset', () => {
        resetDisplay();
    });

    $('.btnReset').on('click', () => {
        socket.emit('reset', 'reset');
    });

    $('.pin').on('keyup', (event) => {
        if ($(event.target).val().hashCode() == 1515237) {
            $(".passcode").remove();
        }
    });
});

function updateScore(scoreArray, newScore) {
    scoreArray.push(newScore);
    // https://codeburst.io/javascript-arrays-finding-the-minimum-maximum-sum-average-values-f02f1b0ce332
    var average = arr => arr.reduce((p, c) => p + c, 0) / arr.length;
    return average(scoreArray).toFixed(1);
}

function showStatusMessage(className) {
    let div = $('.' + className);
    div.show();
    div.siblings().hide();
}

function resetDisplay() {
    currentScore = [];
    numAnim.update(0);
    $('.votedCount').html('已投票人數: ' + currentScore.length);
    if (typeof myChart != 'undefined') {
        myChart.data.datasets[0].data[0] = 0;
        myChart.update();
    }
}

String.prototype.hashCode = function () {
    var hash = 0;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}