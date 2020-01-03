const WebSocket = require('ws');
const gridResolution = 13;
let miningBlockHeight = -1;
let blocksColors = []
// i = 0 ==> block being mined
// i = 1 ==> last block on blockchain
for (let i = 0; i < 7; i++) {
    blocksColors[i] = [];
    for (let x = 0; x < gridResolution; x++) {
        blocksColors[i][x] = [];
        for (let y = 0; y < gridResolution; y++) {
            blocksColors[i][x][y] = (x % 2 == y % 2) ? 7 : 6;
        }
    }
}

const wss = new WebSocket.Server({ port: 5000 });
let wsc = new WebSocket('wss://ws.blockchain.info/inv');
let wssConnected = null;

wsc.on('open', function open() {
    wsc.send(JSON.stringify({ op: "blocks_sub" }));
    wsc.send(JSON.stringify({ op: "ping_block" }));
    setInterval(() => {
        wsc.send(JSON.stringify({ op: "ping_block" }));

    }, 15000);


    wss.on('connection', function connection(ws) {
        wssConnected = ws;
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

    // setInterval(() => {
    //     miningBlockHeight++;
    //     NewBlock();
    // }, 10000);

});

wsc.on('message', function incoming(data) {
    let blockData = JSON.parse(data);
    if (miningBlockHeight != blockData.x.height + 1) {
        miningBlockHeight = blockData.x.height + 1;
        NewBlock();
    }
});


function NewBlock() {

    console.log(`mining new block ${miningBlockHeight}`);
    //Shift colors
    blocksColors.pop();
    let newBlockColor = [];
    for (let x = 0; x < gridResolution; x++) {
        newBlockColor[x] = [];
        for (let y = 0; y < gridResolution; y++) {
            newBlockColor[x][y] = (x % 2 == y % 2) ? 7 : 6;
        }
    }
    blocksColors.unshift(newBlockColor);

    if (wssConnected != null) {
        wssConnected.send('allcolors|' + JSON.stringify(blocksColors) + '|' + miningBlockHeight);
    }
}



// wss.on('connection', function connection(ws) {
//     ws.on('message', function incoming(message) {
//         console.log('received: %s', message);
//     });
//     ws.send('allcolors|'+JSON.stringify(blocks));
// });

