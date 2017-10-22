// node.jsサーバー

const ws = require('ws'),
    http = require('http'),
    express = require('express'),
    room = require('./room.js');
const app = express();
app.use(express.static('../spa/'));

const server = http.createServer(app);
const wss = new ws.Server({ server: server });

// 全ルームのインスタンスを保存する
let rooms = {};

// room_idとsession_idの対応づけを保持する
let room_id_session_id = {};

// 全てのルームIDを保持（被らないために）
let room_ids = [];

// 全ソケットを保存
let sockets = [];

// 接続時
wss.on('connection', function(ws) {

    // 現在のsession_idを保持する変数
    let now_session_id = ""

    // roomのインスタンスを保持する変数
    let r
    
    // ソケットに保存
    sockets.push(ws)
        
    //メッセージが届いたら
    ws.on('message', function(messageText) {
        
        let message = JSON.parse(messageText);
        let now_room_id = room_id_session_id[now_session_id]
                    
        // message.typeで処理を分岐
        switch (message.type) {
            case "init":
                // initは通信開始時に実行

                // 通信開始時に現在のsession_id, room_idを代入
                now_session_id = message.session_id
                now_room_id = room_id_session_id[now_session_id]
                
                // すでにルームに入っていたユーザーには、今あるデータを送信
                if(now_room_id) {
                    r = rooms[now_room_id]
                    r.addSocket(ws, now_session_id);
                    r.bloadcast();
                } else {
                    ws.send(JSON.stringify({type: "noroom"}));
                }
                break;
                
            case "room_open":
                // ルームを生成
                r = new room(message.nickname, message.total);
                
                // room_idを生成し、各変数に代入
                now_room_id = r.makeRoomID(room_ids);
                room_ids.push(now_room_id);
                rooms[now_room_id] = r;
                room_id_session_id[now_session_id] = now_room_id;
                
                // オーナー（ルーム生成ユーザー）を、ルームに参加させる
                r.addSocket(ws, now_session_id);
                r.enter(message.nickname, now_session_id);
                break;
                
            case "room_enter":
                // room_idのルームにユーザーを参加させる
                now_room_id = message.room_id
                r = rooms[message.room_id];
                
                // ユーザー名が被っているか判別する
                if (r.checkName(message.nickname)) {
                    
                    // ユーザーを、ルームに参加させる
                    r.addSocket(ws, now_session_id);
                    r.enter(message.nickname, now_session_id);
                    
                    // room_idとsession_idの対応づけ
                    room_id_session_id[now_session_id] = now_room_id;
                } else {
                    ws.send(JSON.stringify({"type": "error", "text": "同じ名前の人がいます。\n変更してくださいm(_ _)m。"}))
                }
                break;
                
            case "wallet_update":
                // ユーザーの財布を受信し、ルームで保存
                r.updateWallet(now_session_id, message.values);
                break;
                
            case "room_shutup":
                // ルーム参加を締め切り、割り勘APIを実行
                all_bloadcast(JSON.stringify({"type": "alive_room", "state": "close", "room_id": now_room_id }))
                r.shutUp();
                break;
                
            case "close_ticket":
                // 割り勘手順の、チケット処理一つを終了
                r.closeTicket(message.ticket_no);
                break;
                
            case "alive_room_request":
                // ルーム状態の変数
                let state = ""
                
                // ルームが 参加可能・締め切り・なし を判別する
                if (message.room_id in rooms) {
                    if (rooms[message.room_id].data.state == "acceptance") {
                        state = "open";
                    } else {
                        state = "close";
                    }
                } else  {
                    state = "none";
                }
                
                // 全ソケットにルーム状態を送信
                all_bloadcast(JSON.stringify({"type": "alive_room", "state": state, "room_id": message.room_id }))
                break;
                
            default:
                // マッチするものが存在しない場合に実行する文
                console.log("message.typeがマッチしてません")
                break;
        }
        console.log(now_session_id + "から届きました: " + messageText)
    });
});

// 全ソケットに送信
function all_bloadcast(text) {
    for(let ws of sockets) {
        try {
            ws.send(text)
        } catch(e) {}
    }
}


server.listen(process.env.PORT);
