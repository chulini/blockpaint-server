const WebSocket = require('ws');
const gridResolution = 21;
let miningBlockHeight = -1;
let blocksColors = []
// i = 0 ==> block being mined
// i = 1 ==> last block on blockchain
for (let i = 0; i < 7; i++) {
    const blockBg =  Math.floor(Math.random() * 16);

    blocksColors[i] = [];
    for (let x = 0; x < gridResolution; x++) {
        blocksColors[i][x] = [];
        for (let y = 0; y < gridResolution; y++) {
            blocksColors[i][x][y] = blockBg;//(x % 2 == y % 2) ? 7 : 6;
        }
    }
}

const wss = new WebSocket.Server({ port: 5000 });
let wsBlockTick = new WebSocket('wss://ws.blockchain.info/inv');

wsBlockTick.on('open', function open() {
    wsBlockTick.send(JSON.stringify({ op: "blocks_sub" }));
    wsBlockTick.send(JSON.stringify({ op: "ping_block" }));
    setInterval(() => {
        wsBlockTick.send(JSON.stringify({ op: "ping_block" }));
    }, 15000);

    wss.on('connection', function connection(ws) {
        ws.send('allcolors|' + JSON.stringify(blocksColors)+'|'+miningBlockHeight);
        ws.on('message', function incoming(data) {
            let msgSplit = data.split('|');
            if (msgSplit[0] === 'colorchange') {
                const x = parseInt(msgSplit[1]);
                const y = parseInt(msgSplit[2]);
                const newColor = parseInt(msgSplit[3]);
                blocksColors[0][x][y] = newColor;
                wss.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(`colorchange|${x}|${y}|${blocksColors[0][x][y]}`);
                    }
                });
            }
        });
    });
});

// To simulate new blocks
// NewBlock(miningBlockHeight+1);
// setInterval(() => {
//     // miningBlockHeight++;
//     NewBlock(miningBlockHeight+1);
// }, 10000);

wsBlockTick.on('message', function incoming(data) {
    let blockData = JSON.parse(data);
    NewBlock(blockData.x.height);
});


function NewBlock(height) {
    if (miningBlockHeight == height + 1)
        return;

    miningBlockHeight = height+1;
    
    console.log(`mining new block ${miningBlockHeight}`);
    //Shift colors
    blocksColors.pop();
    let newBlockColor = [];
    const blockBg =  Math.floor(Math.random() * 16);

    for (let x = 0; x < gridResolution; x++) {
        newBlockColor[x] = [];
        for (let y = 0; y < gridResolution; y++) {
            newBlockColor[x][y] = blockBg;//(x % 2 == y % 2) ? 7 : 6;
        }
    }
    blocksColors.unshift(newBlockColor);

    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send('allcolors|' + JSON.stringify(blocksColors) + '|' + miningBlockHeight);
        }
    });
}



// wss.on('connection', function connection(ws) {
//     ws.on('message', function incoming(message) {
//         console.log('received: %s', message);
//     });
//     ws.send('allcolors|'+JSON.stringify(blocks));
// });

