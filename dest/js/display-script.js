var ctx = document.querySelector('.chart').getContext('2d');
var myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        datasets: [{
            data: [0],
            backgroundColor: [
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        maintainAspectRatio: false,
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    max: 5,
                    min: 0
                }
            }]
        },
        legend: {
            display: false
        }
    }
});

const socket = io();
let currentScore = [],
    displayScore = 0,
    numAnim = new CountUp($('.score')[0], 0, 0, 1, 1);

$(document).ready(() => {

    socket.on('pushScore', (message) => {
        console.log('New score from server: ' + message);
        displayScore = updateScore(currentScore, message);
        console.log('displayScore: ' + displayScore);
        // $('.score').html(displayScore);
        numAnim.update(displayScore);

        // Flash Animation
        const scoreElement = $('.score');
        scoreElement.addClass('flash-animation');
        setTimeout(() => {
            scoreElement.removeClass('flash-animation');
        }, 500);

        myChart.data.datasets[0].data[0] = displayScore;
        myChart.update();
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
    if (myChart) {
        myChart.data.datasets[0].data[0] = 0;
        myChart.update();
    }
}