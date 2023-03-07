
// Chart.js の設定（教科書指定）
let config = {
    type: 'line', // 折れ線グラフ
    data: {}, // グラフデータ
    responsive: true, // レスポンシブ対応
    options: {
        legend: {
            position: 'bottom' // 凡例を下に表示
        },

        // ストリーミングデータ表示設定
        scales: {
            xAxes: [{
                type: 'realtime',
                realtime: {
                    duration: 20000, // グラフに表示する期間(20秒) 添削後修正
                    refresh: 1000, // 再描画間隔(1秒)
                    delay: 4000, // 遅延時間(4秒)
                }
            }],
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                }
            }]
        },

        tooltips: {
            mode: 'index',
            intersect: false,
            callbacks: {
                label: (tooltipItem, data) => {
                    let label = data.datasets[tooltipItem.datasetIndex].label || '';

                    if (label) {
                        label += ': ';
                    }
                    label += '$ ' + Math.round(tooltipItem.yLabel * 100) / 100;

                    return label;
                },
                // 日時表示のカスタマイズ
                title: (tooltipItem, data) => {
                    let date = new Date(tooltipItem[0].xLabel);
                    return date.toString();
                }
            }
        },
    }
};


let stock_prices;

//モーダル
$('.go_modal').modaal({
    content_source: '#modal',
});

//初期ロード時
$(window).on('load', () => {
    //ストレージに保存されている情報を取得
    let savedSTOCKS = JSON.parse(localStorage.getItem('STOCKS'));

    //ストレージに保存されている情報がない又は空の場合はモーダル表示、あればチャート表示
    if (savedSTOCKS === null || savedSTOCKS.length === 0) {
        $('.go_modal').click();
        
    }
    else {
        chart_show();
    }
});

//「銘柄を選択」をクリックしたら出るモーダル表示
$('#go_modal').on('click', () => {
    $.ajax({
        url: 'https://development-primer.com/js-api/api/stocks',
        async: true

    }).done((res) => {
        let array = res;

        //ローカルストレージに保存されている情報を取得
        let savedSTOCKS = JSON.parse(localStorage.getItem('STOCKS'));
        let savedCodes;
        if (savedSTOCKS !== null) {
            savedCodes = savedSTOCKS.map((x) => { return x.code });
        }

        //取得した銘柄一覧のチェックボックスを作成
        $('#box').empty();

        if (savedSTOCKS !== null) {
            for (let i = 0; i < array.length; i++) { //チェックをつけた状態で作成
                $('#box')
                    .append('<label><input type="checkbox" id=' + array[i].name + ' class="chk" name=' + array[i].name + ' value=' + array[i].code + ' ' + (savedCodes.includes(array[i].code) ? 'checked' : '') + '>' + array[i].name + '</label>')
                    .append(`<br>`);
            }
        }
        else {
            for (let i = 0; i < array.length; i++) { //チェックなしのボックスを作成
                $('#box')
                    .append('<label><input type="checkbox" id=' + array[i].name + ' class="chk" name=' + array[i].name + ' value=' + array[i].code + '>' + array[i].name + '</label>')
                    .append(`<br>`);
            }
        }

    }).fail(() => {
        console.log('銘柄リストの取得に失敗しました');
    });

});

//「選択した銘柄の株価を表示」ボタンクリック時
$('#go_chart').click(() => {
    //モーダルを閉じる
    $('.go_modal').modaal('close');
    //チェックされた情報を保存してチャートを表示
    checkbox_control();
    clearTimeout(update_id);
    chart_show();
});

const checkbox_control = () => {
    //チェックされた銘柄のコードと銘柄名を取得
    let checkedSTOCKS = [];
    $('[class="chk"]:checked').each(function() {
        checkedSTOCKS.push({ name: this.id, code: this.value });
    });

    //チェックされた銘柄をローカルストレージに保存
    let str = JSON.stringify(checkedSTOCKS); //配列を文字列に変換
    localStorage.setItem('STOCKS', str);
};

//グラフの作成
let update_id;
let chart;
let colors = ['crimson', 'gold', 'yellowgreen', 'mediumaquamarine', 'cornflowerblue', 'purple'];　//それぞれの色を指定した配列

const chart_show = () => {
    //株価を取得しチャートを更新
    let savedSTOCKS = JSON.parse(localStorage.getItem('STOCKS'));
    let code_str = savedSTOCKS.map((x) => { return x.code }).join(',');

    //銘柄の数だけチャートの元を用意
    if (chart) {
        chart.destroy();
    }

    config.data = { datasets: [] }; //データの中身も削除

    for (let i = 0; i < savedSTOCKS.length; i++) {
        config.data.datasets.push({
            label: savedSTOCKS[i].name,
            borderColor: colors[i],
            backgroundColor: colors[i],
            fill: false,
            cubicInterpolationMode: 'monotone',
            data: []
        });
    }
    
    //canvasのDOMを取得
    let ctx = $('#canvas');
    chart = new Chart(ctx, config);

    //2秒間隔で株価情報を更新する時(update関数)
    const update = () => {
        $.ajax({
            url: 'https://development-primer.com/js-api/api/stocks/prices/' + code_str,

        }).done((res) => {
            stock_prices = res;

            for (let i = 0; i < savedSTOCKS.length; i++) {
                chart.data.datasets[i].data.push({
                    x: Date.now(),
                    y: stock_prices[i].price
                });
            }

            chart.update();
            update_id = setTimeout(update, 2000);

        }).fail(() => {
            console.log('株価の取得に失敗しました');
        });

    };
    update_id = setTimeout(update, 2000);

};
