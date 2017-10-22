var MONEY_KIND = [10000, 5000, 1000, 500, 100, 50, 10, 5, 1]
var MONEY_KIND_N = 9

var debugNow = true

// お金の種類の合計を取得する関数
var getDataSet = function (N, dataSet, warikanAmount) {
	var money = [0, 0, 0, 0, 0, 0, 0, 0, 0]
	var personMoney = []
	for(var i = 0; i < N; i++){
		personMoney.push([0,0]) 
		for(var j = 0; j < 9; j++){
			money[j] += dataSet[i][j]
			personMoney[i][0] += dataSet[i][j] * MONEY_KIND[j]
		}
		personMoney[i][1] = personMoney[i][0] - warikanAmount
	}
	return [money, personMoney]
}


var getRankMoneyN = function(dataSet, ansMoney, number) {
	var diffMoney = []
	for(var i = 0; i < dataSet.length; i++){
		diffMoney.push([i, dataSet[i][number] - ansMoney[i][number]])
	}

	for(var i = 0;i < dataSet.length; i++){
		for(var j = i + 1;j < dataSet.length;j++){
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
	// console.log("retData= " + retData[from][0] + " " + to)

	for(; i < retData[from].length; i++){
		if(retData[from][i][0] == to){
		    // console.log("kitauo")
			retData[from][i][1].push([moneyKind, n])
            break;
		}
	}
	// console.log(i  + " " + retData[from].length)
	if( i == retData[from].length){
		retData[from].push([to, [[moneyKind, n]]])
	}
}

// JSONデータに変換を行う
var createJSONData = function(table, amari){
    var payJSON=[]
    //console.log(table)


    for(var i = 0;i < table.length; i++){
        var payInfo=table[i];
        var payFrom = i;
        for(var j = 0;j < payInfo.length ; j++){
            var payTo = payInfo[j][0]
            for(var k = 0;k < payInfo[j][1].length; k++){
                var moneyIndex = payInfo[j][1][k][0];
                var moneyCount = payInfo[j][1][k][1]
                payJSON.push({
                    "from" : payFrom,
                    "to" : payTo,
                    "price" : MONEY_KIND[moneyIndex],
                    "moneyCount" : moneyCount
                })
            }
        }
        retJSON = []
        retJSON.push({
            "amari": amari
        })
        retJSON.push(
            {"data":payJSON})
    }

    return retJSON;
}




// メイン関数!!
var main = function (arg) {
	// 割り勘する人数を取得
	var person_N = arg[0]
	// お金の種類データセット
	var dataSet = arg[1]
	// 合計金額を取得
	var amount = arg[2]
	
	// 人全てのお金の種類と数を保存する
	var money
	
	// 人それぞれの合計金額と支払い後の金額
	var personMoney
	
	// 割り勘の金額
	var warikanAmount = Math.floor(amount / person_N);
	// あまりの金額
	var amariAmount = amount % person_N;

	// 10円以下を計算しないようにする
	amariAmount += (warikanAmount % 10) * person_N;
	if(warikanAmount % 10 != 0)warikanAmount += 10 - (warikanAmount % 10);


	// 返すオブジェクトの整形
    for(var i = 0; i < person_N; i++)retData.push([])
	
	// お金の種類の合計を取得
	temp = getDataSet(person_N ,dataSet, warikanAmount)
	// money = temp[0]
	personMoney = temp[1]
	
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
    console.log(total)






	// console.log(retData)
    // insertChangeMoney(2, 1, 2, 2);
    // insertChangeMoney(2, 1, 3, 1);
	//console.log(retData)



    // console.log(retData)
	// return ansMoney
    return createJSONData(retData, total - amount)
}

var mainDataSet = [4,[[0,0,3,3,2,0,7,0,0],
							[0,1,1,2,5,3,0,0,0],
							[0,0,5,2,0,0,0,0,0],
							[0,0,3,1,3,5,4,0,0]],10960]

// console.log(main(mainDataSet));

var mainDataSet = [4,[[0,0,3,3,2,0,7,0,0],[0,1,1,2,5,3,0,0,0],[0,0,5,2,0,0,0,0,0], [0,0,3,1,3,5,4,0,0]],16301]

//console.log(mainDataSet[1])
//console.log(main(mainDataSet));

module.exports = main;