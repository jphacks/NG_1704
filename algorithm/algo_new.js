var MONEY_KIND = [10000, 5000, 1000, 500, 100, 50, 10, 5, 1]
var MONEY_KIND_N = 9

// お金の種類の合計を取得する関数
var getDataSet = function (N, dataSet, warikanAmount) {
    var personMoney = []
    for(var i = 0; i < N; i++){
        personMoney.push([0,0])
        for(var j = 0; j < 9; j++){
            personMoney[i][0] += dataSet[i][j] * MONEY_KIND[j]
        }
        personMoney[i][1] = personMoney[i][0] - warikanAmount
    }
    return personMoney
}


var getRankMoneyN = function(dataSet, ansMoney, number) {
    var diffMoney = []
    for(var i = 0; i < dataSet.length; i++){
        diffMoney.push([i, dataSet[i][number] - ansMoney[i][number]])
    }

    for(var i = 0;i < dataSet.length; i++){
        for(var j = i + 1; j < dataSet.length; j++){
            if(diffMoney[i][1] < diffMoney[j][1]){
                var temp = diffMoney[j]
                diffMoney[j] = diffMoney[i]
                diffMoney[i] = temp
            }
        }
    }

    return diffMoney
}

// 最終的に返すオブジェクトの宣言
var retData = [];

// 返すデータへ挿入
var insertChangeMoney = function (from, to, moneyKind, n) {
    var i = 0;

    for(; i < retData[from].length; i++){
        if(retData[from][i][0] == to){
            retData[from][i][1].push([moneyKind, n])
            break;
        }
    }

    if( i == retData[from].length){
        retData[from].push([to, [[moneyKind, n]]])
    }
}

var createPersonInfo = function(usersInfo){
    var retInfo = new Array();
    for(var i = 0;i<usersInfo.users.length ; i++){
        retInfo.push(usersInfo.users[i].name);
    }
    return retInfo;
}

// 既存のアルゴリズムが処理出来る形に変換(行列)
var createArrayData = function(usersInfo){
    var usersInfoArray = new Array();

    usersInfoArray.push(usersInfo.users.length)

    usersInfoArray.push(new Array())
    var users = usersInfo.users;
    for(var i = 0 ; i< users.length ;i++){
        var user = users[i].wallet;
        var userMoney = new Array();

        for(var j = MONEY_KIND_N - 1; j >= 0; j--){

            //５円と１円の個数を0に固定
		    	var temp = j <= 1 ? 0 : user[MONEY_KIND[MONEY_KIND_N - j -1].toString()]

			    userMoney.push(temp)
        }
        usersInfoArray[1].push(userMoney);
    }

    usersInfoArray.push(usersInfo.total);
    return usersInfoArray;
}

// 出力フォーマットに整えたJSONデータに変換を行う
var createJSONData = function(table, amari ,owner ,personInfo){
    console.log(table)
    var retJSON={"amari" : amari , "tickets" : new Array()};

    for(var i = 0;i < table.length; i++){
        var payInfo = table[i];
        var payFrom = i;
        if(payFrom == -1)
            payFrom = personInfo.indexOf(owner);
        for(var j = 0;j < payInfo.length ; j++){
            var moneyInfo=[0,0,0,0,0,0,0,0,0];
            var payTo = payInfo[j][0]

            if(payTo == -1)payTo = personInfo.indexOf(owner);

            for(var k = 0;k < payInfo[j][1].length; k++){
                var moneyIndex = payInfo[j][1][k][0];
                var moneyCount = payInfo[j][1][k][1];

                moneyInfo[moneyIndex] = moneyCount
            }
            if(personInfo[payFrom] != personInfo[payTo]){
                retJSON.tickets.push({
                    "user_from" : personInfo[payFrom],
                    "user_to"   : personInfo[payTo],
                    value : {
                        "10000" : moneyInfo[0],
                        "5000"  : moneyInfo[1],
                        "1000"  : moneyInfo[2],
                        "500"   : moneyInfo[3],
                        "100"   : moneyInfo[4],
                        "50"    : moneyInfo[5],
                        "10"    : moneyInfo[6],
                    }
                })
            }
        }
    }
    return retJSON;
}




// メイン関数!!
var main = function (arg) {
    // 割り勘する人数を取得
    var person_N = arg.users.length;
    // 人の名前を管理
    var personInfo = createPersonInfo(arg);
    // オーナーの設定
    var owner = arg.owner;
    // お金の種類データセット
    var dataSet = createArrayData(arg)[1]
    // 合計金額を取得
    var amount = arg.total;

    // 人それぞれの合計金額と支払い後の金額
    var personMoney
    console.log(personInfo)
    // 割り勘の金額
    var warikanAmount = Math.floor(amount / person_N);
    // あまりの金額
    var amariAmount = amount % person_N;

    // 10円以下を計算しないようにする
    amariAmount += (warikanAmount % 10) * person_N;
    if(warikanAmount % 10 != 0)warikanAmount += 10 - (warikanAmount % 10);


    // 返すオブジェクトの整形
    for(var i = 0; i < person_N; i++)retData.push([])

    // 人それぞれの現在のお金と支払い後のお金を取得
    personMoney = getDataSet(person_N ,dataSet, warikanAmount)

    var ansMoney = []

    // 支払うべきお金を払った後の状態を作成
    for(var i = 0; i < person_N; i++){
        var currentMoney = personMoney[i][1]
        ansMoney.push([0, 0, 0, 0, 0, 0, 0, 0, 0])
        for(var j = 0; j < MONEY_KIND_N; j++){
            ansMoney[i][j] = Math.floor(currentMoney / MONEY_KIND[j])
            currentMoney = currentMoney % MONEY_KIND[j]
        }
    }

    // 足りないお金(お釣り)を格納する配列
    var lessMoney = [[],[],[],[],[],[],[],[],[]]

    // お釣りが必要な人を探す
    for(var i = 0; i < person_N; i++) {
        for (var j = 0; j < MONEY_KIND_N; j++) {
            if (dataSet[i][j] < ansMoney[i][j]) {
                lessMoney[j].push([i, ansMoney[i][j] - dataSet[i][j]])
            }
        }
    }

    // 幹事（お店）へ支払うお金の計算
    var payMoney = []
    for(var i = 0; i < person_N; i++){
        payMoney.push([0, 0, 0, 0, 0, 0, 0, 0, 0])
        for(var j = 0; j < MONEY_KIND_N; j++){
            payMoney[i][j] = Math.max(dataSet[i][j] - ansMoney[i][j], 0)
        }
    }

    // 効率の良いお釣りの渡し方を考える
    for(var i = 0; i < MONEY_KIND_N; i++) {
        var diffMoney = getRankMoneyN(dataSet, ansMoney, i)
        for(var j = 0; j < lessMoney[i].length; j++) {
            var k = 0;
            while(lessMoney[i][j][1] > 0 && k < person_N){
                if(diffMoney[k][1] >= lessMoney[i][j][1]){
                    // あと1人でお釣りの計算が終わる場合
                    console.log(diffMoney[k][0] + "=>" + lessMoney[i][j][0] + " " + MONEY_KIND[i] + "*" + lessMoney[i][j][1])
                    insertChangeMoney(diffMoney[k][0], lessMoney[i][j][0], i, lessMoney[i][j][1])
                    payMoney[diffMoney[k][0]][i] -= lessMoney[i][j][1];
                    diffMoney[k][1] -= lessMoney[i][j][1];
                    lessMoney[i][j][1] = 0;
                }else{
                    // 1人ではお釣りを返せない場合
                    console.log(diffMoney[k][0] + "=>" + lessMoney[i][j][0] + " " + MONEY_KIND[i] + "*" + diffMoney[k][1])
                    insertChangeMoney(diffMoney[k][0], lessMoney[i][j][0], i, diffMoney[k][1])
                    payMoney[diffMoney[k][0]][i] = 0
                    lessMoney[i][j][1] -= diffMoney[k][1]
                    diffMoney[k][1] = 0
                }
                k++;
            }
        }
    }

    // 幹事（お店）へ支払うお金を、returnする配列に入れる&支払い合計を計算
    var total = 0;
    for(var i = 0; i < person_N; i++){
        for(var j = 0; j < MONEY_KIND_N; j++){
            if(payMoney[i][j] != 0)
                insertChangeMoney(i, -1, j, payMoney[i][j])

            total += MONEY_KIND[j] * payMoney[i][j]
        }
    }
    // console.log(total)

    // console.log(warikanAmount)

    // console.log(retData)
	//return ansMoney
    return createJSONData(retData, total - amount , owner ,personInfo)
}


var mainDataSet = {
    total : 10960,
    owner : "のぶ",
    users : [
        {name : "のぶ", wallet : {"10000": 1, "5000" : 0 , "1000" : 3,"500" : 3,"100": 2,"50" : 0,"10":7}},
        {name : "さんた", wallet : {"10000": 0, "5000" : 1 , "1000" : 1,"500" : 2,"100": 5,"50" : 3,"10": 0}},
        {name : "おくたん", wallet : {"10000": 0, "5000" : 0, "1000" : 5,"500" : 2,"100": 0 ,"50" : 0,"10": 0	}},
        {name : "はげもやし", wallet : {"10000": 0, "5000" : 0 , "1000" : 3,"500" : 1,"100":3 ,"50" : 5,"10": 4}}
    ]
}

// console.log(main(mainDataSet))


module.exports = main;