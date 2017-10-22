// 割り勘ルームクラス

const alg = require("../algorithm/algo_new.js")

module.exports = class Room {
    
    constructor(owner, total) {
        this.sockets = []        //ルーム内のソケットを保持する配列
        
        // クライアントに毎回送信するデータ
        this.data = {
            room_id: "",         // ルームの識別ID
            amari: "",           // 全員で支払う額 - 会計の合計金額
            total_money: total,  // 会計の合計金額
            owner: owner,        // オーナーの名前
            users_finished: [],  // 財布登録済みユーザーの名前の配列
            users_working: [],   // 財布登録中ユーザーの名前の配列
            state: "acceptance", // acceptance → processing → clearing
            tickets: [],
        }
        
        this.wallets = {} //名前が添え字
        this.names = {} //セッションidが添え字
    }
    
    // ユーザーをルームに参加させる
    enter(name, session_id) {
        this.data.users_working.push(name);
        this.names[session_id] = name
        this.bloadcast();
    }
    
    // ルーム内のソケットを追加する
    addSocket(ws, session_id) {
        this.sockets.push({
            ws: ws,
            session_id: session_id
        })
    }
    
    // ユーザーの財布中身を登録する
    updateWallet(session_id, values) {
        
        let name = this.names[session_id]
        
        this.wallets[name] = values
        
        let new_users_working = [];
        for (let value of this.data.users_working) {
            if (value != name) {
                new_users_working.push(value);
            }
        }
        this.data.users_working = new_users_working
        this.data.users_finished.push(name)
        
        this.bloadcast()
    }
    
    // ルーム参加を締め切り、割り勘APIを実行
    shutUp() {
        // ルーム状態を処理中に移行
        this.data.state = "processing"
        this.bloadcast()
        
        // アルゴリズム引数のusers配列を生成
        let users = [];
        for (let user_name of this.data.users_finished) {
            users.push(
                {name: user_name, wallet: this.wallets[user_name]}
            );
        }
        
        // 割り勘アルゴリズムを実行
        let result = alg({
            total: this.data.total_money, 
            owner: this.data.owner, 
            users: users, 
        });
        
        // チケット番号を代入とチケット状態を代入
        for (let i = 0; i < result.tickets.length; i++) {
             result.tickets[i].number = i;
             result.tickets[i].ticket_state = "open";
        }
        
        // あまりを代入
        this.data.amari = result.amari;
        
        // 処理のチケットを代入
        this.data.tickets = result.tickets;
        
        // 支払い完了状態にする
        this.data.state = "clearing"
        this.bloadcast()
    }
    
    // ticket_no番目のチケットを実行済みにする
    closeTicket(ticket_no) {
        for (let i = 0; i < this.data.tickets.length; i++) {
            if (ticket_no == this.data.tickets[i].number) {
                this.data.tickets[i].ticket_state = "close"
                this.bloadcast()
                break
            }
        }
    }
    
    // データをルームの全ソケットに送信
    bloadcast() {
        for(let socket of this.sockets) {
            try {
                socket.ws.send(JSON.stringify({ type: "room_info", name: this.names[socket.session_id], room_data: this.data }))
    
            } catch(e) {}
        }
    }
    
    // ユーザー名を登録しているか確認する
    checkName(name) {
        for (let n of this.data.users_finished) {
            if (n == name){
                return false
            }
        }
        for (let n of this.data.users_working) {
            if (n == name) {
                return false
            }
        }
        return true
    }
    
    // room_idをランダム生成
    makeRoomID(room_ids) {
        var flag = true
    
        // 既存のroom_idに一致すれば、作り直す
        while (flag) {
            flag = false
            // 生成する文字列の長さ
            var l = 8;
    
            // 生成する文字列に含める文字セット
            var c = "abcdefghijklmnopqrstuvwxyz0123456789";
    
            var cl = c.length;
            var r = "";
            for (var i = 0; i < l; i++) {
                r += c[Math.floor(Math.random() * cl)];
            }
            
            // room_idの重複を調べる
            for (var id of room_ids) {
                if (r == id) {
                    flag = true
                    break;
                }
            }
        }
        this.data.room_id = r;
        return r;
    }
}