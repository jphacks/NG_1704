/* global Vue, localStorage */

var createSessionId = function() {
    return Math.random().toString(36).slice(-8);
}

var app

document.addEventListener("DOMContentLoaded", function () {
                    
    var ws = {}

    var wsend = function (type, data) {
        
        data = data?data:{}
        
        data.type = type
        var json = JSON.stringify(data)
        console.log("送信: " + json)
        ws.send(json);
    }

    //ws.send = console.log
    
    Vue.filter('moneysum', function (value) {
        
        var text = 0
        
        for(let yen in value) {
            text += Number(yen)*Number(value[yen])
        }
        
        return text
    })

    app = new Vue({

        el: '#vueapp',

        data: {
            showShare: false,
            
            
            input: {
                total: "",
                name: "",
                wallet: [
                    {yen:"10000", count:0},
                    {yen:"5000", count:0},
                    {yen:"1000", count:0},
                    {yen:"500", count:0},
                    {yen:"100", count:0},
                    {yen:"50", count:0},
                    {yen:"10", count:0},
                ]
            },

            session_id: "ssid_test",
            init_state: false,
            
            room: {
                
                name: "のぶ",
                
                room_id: undefined,
                owner: "のぶ",
                
                state: "acceptance", // 受付中,計算中,清算中
                tickets: [],
                users_finished: [
                    "さんた",
                    "おくたん",
                    "のぶ"
                ], 
                users_working: [
                    "いけたけ"
                ]
            },

            page: {
                type: "作成", //トップ,作成,部屋
                room_id: undefined,
                room_state: "open" //undefined, open, close
            }

        },

        computed: {
            
            userCount() {
                return this.room.users_finished.length + this.room.users_working.length
            },
            
            onRoom() {
                return (this.room.room_id !== undefined)
            },
            
            pageIsMyRoom() {
                return (this.page.room_id == this.room.room_id)
            },
            
            walletFinished() {
                return (this.room.users_finished.indexOf(this.room.name) != -1)
            },
            
            isOwner() {
                return this.room.owner == this.room.name
            },
            
            noMyTickets() {
                
                for(var ticket of this.room.tickets) {
                    if(ticket.ticket_state == "open") {
                        if(ticket.user_from == this.room.name || ticket.user_to == this.room.name ) {
                            return false;
                        }
                    }
                }
                
                return true
            }
            
        },

        created() {
            

            ws = new WebSocket('wss://jphacks-nobum.c9users.io/')
            
            if(!localStorage.WKSESSID)
                localStorage.WKSESSID = createSessionId()
                    
            this.session_id = localStorage.WKSESSID
                
           
            ws.onopen = () => {
                pageControler()
                window.addEventListener("hashchange", pageControler)
                wsend("init", {
                    session_id: this.session_id
                })
            }
            
            ws.onclose = () => {
                this.page.type = "切断"
            }

            ws.onmessage = (event) => {
                console.log("受信: " + event.data)
                
                var mes = JSON.parse(event.data)

                var type = mes.type

                switch (type) {
                    case "room_info":
                        this.room = mes.room_data
                        this.room.name = mes.name
                        if(this.page.type == "作成") {
                            this.page.type = "部屋"
                            location.hash = this.room.room_id
                        }
                        this.init_state = true
                        break;
                        
                    case "noroom":
                        this.init_state = true
                        break;
                    
                    case "alive_room":
                        if(this.page.room_id == mes.room_id)
                            this.page.room_state = mes.state
                        break;
                    
                    case "error":
                        alert("サーバーエラー: " + mes.text)
                        break;
                        
                    default:
                        console.log("undefined type")
                }



            };

        },

        methods: {

            createRoom() {
                var data = { nickname: this.input.name, total: this.input.total }
                wsend("room_open", data)
            },

            enterRoom() {
                var data = { nickname: this.input.name, room_id: this.page.room_id }
                wsend("room_enter", data)
            },

            sendWallet() {
                var values = {}
                
                for(var w of this.input.wallet) {
                    values[w.yen] = w.count
                }
                
        
                wsend("wallet_update", { values: values})
            },
            
            closeTicket(no) {
                wsend("close_ticket", { ticket_no: no })
            },

            shutUp() {
                wsend("room_shutup")
            }

        }

    })


    var pageControler = function () {

        var hash = location.hash

        var qart = new QArt({
            value: location.href,
            imagePath: "static/qr.png",
            size: 260,
            filter: "color"
        }).make(document.getElementById('qr'));

        if (hash[0] == "#")
            hash = hash.slice(1)

        if (hash == "") {
            app.page.type = "トップ"
        } else {
            app.page.type = "部屋"
            wsend("alive_room_request", { room_id: hash })
            app.page.room_id = hash
        }


        console.log("ページ変更: " + hash)

    }


});
