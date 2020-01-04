pkill -f 'node index.js'
nohup npm install > /dev/null 2>&1 &
nohup npm start >> logs.log 2>&1 &
