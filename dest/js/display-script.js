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

    socket.on('sessionCode', (code) => {
        $('.sessionCode').html('Room Code: ' + code);
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

    socket.on('resetVote', () => {
        // Reset Logic Same as Hard Reset for Display
        resetDisplay();
    });
});

function updateScore(scoreArray, newScore) {
    // Ensure newScore is a number
    let numericScore = parseFloat(newScore);
    if (isNaN(numericScore)) {
        console.error("Invalid score received:", newScore);
        return (scoreArray.length > 0) ? (scoreArray.reduce((p, c) => p + c, 0) / scoreArray.length).toFixed(1) : 0;
    }
    
    scoreArray.push(numericScore);
    
    // Calculate average securely
    var total = scoreArray.reduce((p, c) => p + parseFloat(c), 0);
    var average = total / scoreArray.length;
    
    return average.toFixed(1);
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