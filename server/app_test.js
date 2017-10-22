const ws = require('ws'),
    http = require('http'),
    express = require('express');

const app = express();
app.use(express.static('../spa/'));

const server = http.createServer(app);
const wss = new ws.Server({server:server});
 
 
//Websocket接続を保存しておく配列
let connections = [];
 
//接続時
wss.on('connection', function(ws) {
    
    //配列にWebSocket接続を保存
    let my = { room: "", session_id: "test", socket: ws };
    connections.push(my);
    
    
    //切断時
    ws.on('close', function () {
        connections = connections.filter(function (conn, i) {
            return (conn === ws) ? false : true;
        });
    });
    
    //メッセージが届いたら
    ws.on('message', function (messageText) {
    
        console.log(my.session_id + "から届きました: " + messageText)
        
        let message = JSON.parse(messageText);
        
        // message.type
        
        broadcast(message);
        
    });
    
});


 
// 全員に送信
function broadcast(message) {
    
    for(let con of connections) {
        con.socket.send(JSON.stringify( { hitokoto: message.text } ))
    }
    
};

 
server.listen(process.env.PORT);
