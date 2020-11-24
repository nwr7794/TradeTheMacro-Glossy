// Load charts package
google.charts.load('47', { 'packages': ['corechart', 'table'] });
// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(dataImport);

function dataImport() {

    //Grab specific columns from data sheet
    var queryString = encodeURIComponent("SELECT * where A >= date '2000-01-01' ");

    var query = new google.visualization.Query(
        'https://docs.google.com/spreadsheets/d/1fvuBTNtYMjV4JOwl9OKRDbRYS4F2nTOCJmhr40WHcYM/gviz/tq?sheet=Data&headers=1&tq=' + queryString);
    query.send(handleSampleDataQueryResponse);

    function handleSampleDataQueryResponse(response) {

        if (response.isError()) {
            alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
            return;
        }

        //convert data to array
        data_raw = response.getDataTable();
        data_array = data_raw.toJSON()
        data_array = JSON.parse(data_array)
        // console.log(data_raw)

        //Set initial user input assumptions
        initialConditions();
    }

}

// Generic function to set initial input conditions
function setInitialAssumption(assumption, colNum, initial, round) {
    // ex: ("model_ass1",0,"last" or "average" or 3(fixed number))
    var label = data_raw.getColumnLabel(colNum)
    // Set starting value
    if (initial === 'last') {
        var nominal_last_val = data_raw.getValue(data_raw.getNumberOfRows() - 1, colNum)
    } else if (initial === 'average') {
        //Find average of JSON data
        var sum = 0
        var count = 0
        for (i = 0; i < data_array.rows.length; i++) {
            if (data_array.rows[i]["c"][colNum] != null) {
                count = count + 1
                sum = sum + data_array.rows[i]["c"][colNum]["v"]
            }
        }
        var nominal_last_val = sum / count
    } else {
        var nominal_last_val = initial;
    }
    var nominal_range = data_raw.getColumnRange(colNum)
    var nominal_delta = nominal_range['max'] - nominal_range['min'];
    var nominal_lower_bound = (nominal_last_val - nominal_delta / 1).toFixed(round)
    var nominal_upper_bound = (nominal_last_val + nominal_delta / 1).toFixed(round)
    var nominal_step = ((nominal_upper_bound - nominal_lower_bound) / 50).toFixed(round)
    var stringInput = '<label for="Predictor">' + label + ': </label><input type="range" class="range" min="' + nominal_lower_bound + '" max="' + nominal_upper_bound + '" step="' + nominal_step + '" value="' + nominal_last_val + '" id="' + assumption + '"><output class="bubble"></output><br>';
    // console.log(stringInput)
    document.getElementById(assumption + '_head').innerHTML = stringInput
}

function initialConditions() {

    // SPX earnings growth
    setInitialAssumption('earnings_ass', 8, 'average', 3);
    // 10yr treasury yld (use last)
    setInitialAssumption('yield_ass', 2, 'last', 3);
    // Risk Index (use last)
    setInitialAssumption('risk_ass', 11, 'average', 1); //had at last previously
    //Generate HYS and ERP from Risk index
    var risk_ass = parseFloat(document.getElementById('risk_ass').value)
    var erp_ass = risk_ass * data_raw.getValue(1, 10) + data_raw.getValue(0, 10)
    var hys_ass = risk_ass * data_raw.getValue(3, 10) + data_raw.getValue(2, 10)
    setInitialAssumption('erp_ass', 3, erp_ass, 3);
    setInitialAssumption('hys_ass', 9, hys_ass, 3);
    // Inflation Expectations (use last)
    setInitialAssumption('inflation_ass', 5, 'last', 4);
    // Portfolio concentration (Use balanced: 1)
    document.getElementById('concentration_ass_head').innerHTML = '<label for="Predictor">Portfolio Concentration: </label><input type="range" class="range" min="1" max="5" step="1" value="3" id="concentration_ass"><output class="bubble"></output><br>';
    // Time Horizon (1 year)
    document.getElementById('time_ass_head').innerHTML = '<label for="Predictor">Time Horizon: </label><input type="range" class="range" min="1" max="5" step="2" value="1" id="time_ass"><output class="bubble"></output><br>';
    //Run function that makes slider work after divs are loaded
    slider_function();
    // Run initial fair value functions
    spx_fv_func();
    gold_fv_func();
    treasury_fv_func();
    highYield_fv_func();
    commods_fv_func();
    cash_fv_func();
    modelRun();
}

function spx_fv_func() {
    // S&P500 FV - Inputs: earnings, treasury yield, ERP
    var risk_ass = parseFloat(document.getElementById('risk_ass').value)
    // var erp_ass = risk_ass * data_raw.getValue(1, 11) + data_raw.getValue(0, 11)
    var erp_ass = parseFloat(document.getElementById('erp_ass').value)

    var earnings_2019 = 139.47; //Hardcoding in 2019 earnings right now
    var earnings_growth_ass = (1 + parseFloat(document.getElementById('earnings_ass').value)) ** parseFloat(document.getElementById('time_ass').value)
    var earnings_abs_ass = earnings_2019 * earnings_growth_ass
    var yield_ass = parseFloat(document.getElementById('yield_ass').value)
    spx_fv = 1 / (yield_ass + erp_ass) * earnings_abs_ass
    spx_last = data_raw.getValue(data_raw.getNumberOfRows() - 1, 1)

    // Run etf calc
    etf_fv_func();
    // console.log(spx_fv)
}

function etf_fv_func() {
    var time_ass = parseInt(document.getElementById('time_ass').value)
    // Grab momentum/reversion/ignore assumption
    var etf_ass = document.getElementById('etf_ass').value
    // var etf_ass = 'ignore' ///// need to replace with assumption ///////////////////////////////////
    // array to recieve results
    etf_fv = [];

    if (etf_ass != 'ignore') {

        var spxRet = (spx_fv / spx_last) ** (1 / time_ass) - 1 //annualized

        var array_raw = [];
        for (var i = 0; i < data_array.rows.length; i++) {
            if (data_array.rows[i]["c"][16] == null) { } else {
                array_raw.push([data_array.rows[i]["c"][16]["v"],
                data_array.rows[i]["c"][17]["v"],
                data_array.rows[i]["c"][18]["v"],
                data_array.rows[i]["c"][19]["v"]
                ])
            }
        }

        for (i = 0; i < array_raw.length; i++) {
            if (etf_ass === 'momentum') {
                var target = 100 * (1 + spxRet) ** 5
                target = Math.max(array_raw[i][2] * 2 * target + target, 25)
                var expReturn = (target / (100 + array_raw[i][2] * 100)) ** (1 / 5) - 1
                // var expReturn = Math.max(rate, -0.15)
            } else { //reversion
                var target = 100 * (1 + spxRet) ** 5
                var expReturn = (target / (100 + array_raw[i][2] * 100)) ** (1 / 5) - 1
            }
            // Now push into array
            etf_fv.push([array_raw[i][0], array_raw[i][1], expReturn, array_raw[i][3]])
        }
    }
    // Sort by exp return
    etf_fv = etf_fv.sort(function (a, b) {
        return b[2] - a[2];
    });

    // console.log(etf_fv)
}



function gold_fv_func() {
    // Gold FV - Inputs: treasury yield, inflation expec (1 yr regression)
    var yield_ass = parseFloat(document.getElementById('yield_ass').value)
    var inflation_ass = parseFloat(document.getElementById('inflation_ass').value)
    gold_fv = data_raw.getValue(0, 14) * (yield_ass - inflation_ass) ** 2 + data_raw.getValue(1, 14) * (yield_ass - inflation_ass) + data_raw.getValue(2, 14)
    gold_last = data_raw.getValue(data_raw.getNumberOfRows() - 1, 4)
    // console.log(gold_fv)
}

function treasury_fv_func() {
    // 10yr treasury FV - Inputs: treasury yield, time
    //Assuming the current yield is the coupon rate and the bond is priced at par. Also not considering the discount rate
    //Also assuming you are buying a 10yr bond at inception that pays annual coupons
    //Ref: https://financeformulas.net/Yield_to_Maturity.html
    var par = 100;
    var coupon = data_raw.getValue(data_raw.getNumberOfRows() - 1, 2)
    var yield_ass = parseFloat(document.getElementById('yield_ass').value)
    var time_ass = parseFloat(document.getElementById('time_ass').value)
    var future_price = (2 * par + 2 * (10 - time_ass) * coupon * par - (10 - time_ass) * yield_ass * par) / ((10 - time_ass) * yield_ass + 2)
    treasury_fv = future_price + par * coupon * time_ass
    treasury_last = par
    // console.log(treasury_fv)
}

function highYield_fv_func() {
    // High Yield FV - Inputs: treasury yield, HYS, time
    //Assuming the current yield is the coupon rate and the bond is priced at par. Also not considering the discount rate
    //Also assuming you are buying a 10yr bond at inception that pays annual coupons
    //Ref: https://financeformulas.net/Yield_to_Maturity.html
    var treasury_ass = parseFloat(document.getElementById('yield_ass').value)
    var risk_ass = parseFloat(document.getElementById('risk_ass').value)
    // var hys_ass = risk_ass * data_raw.getValue(3, 11) + data_raw.getValue(2, 11)
    var hys_ass = parseFloat(document.getElementById('hys_ass').value)

    var yield_ass = treasury_ass + hys_ass

    var par = 100;
    var coupon = data_raw.getValue(data_raw.getNumberOfRows() - 1, 2) + data_raw.getValue(data_raw.getNumberOfRows() - 1, 9)
    var time_ass = parseFloat(document.getElementById('time_ass').value)
    var future_price = (2 * par + 2 * (10 - time_ass) * coupon * par - (10 - time_ass) * yield_ass * par) / ((10 - time_ass) * yield_ass + 2)
    highYield_fv = future_price + par * coupon * time_ass
    highYield_last = par
    // console.log(highYield_fv)
}

function commods_fv_func() {
    // Commodities FV - Inputs: inflation expectations (2016 on rgeression)
    var inflation_ass = parseFloat(document.getElementById('inflation_ass').value)
    commods_fv = data_raw.getValue(0, 13) * inflation_ass + data_raw.getValue(1, 13)
    commods_last = data_raw.getValue(data_raw.getNumberOfRows() - 1, 12)
    // console.log(commods_fv)
}

function cash_fv_func() {
    // Cash FV - Inputs: Current Money Market Rate 
    cash_fv = 1.0025; //Assuming .25% interest
    cash_last = 1;
    // console.log(cash_fv)
}

function modelRun() {

    //We have fair value calculated for each asset class
    //Grab last price of each asset and create array of arrays

    var names_arr = [['S&P 500', 'spx', 'SPY'], ['Gold', 'gold', 'GLD'], ['US 10yr Treasury', 'treasury', 'GOVT'], ['High Yield Debt', 'highYield', 'HYG'], ['Commodities', 'commods', 'DBC'], ['Cash', 'cash', '']]
    var time_ass = parseInt(document.getElementById('time_ass').value)
    // Calculate expected return
    var output_data = [['Name', 'Exp Return (p.a.)', 'Last', 'Ticker']]; //Need to add allocation %
    for (i = 0; i < names_arr.length; i++) {
        // Name, Expected Return, Last, tix
        var last = eval(names_arr[i][1] + '_last')
        var fv = eval(names_arr[i][1] + '_fv')
        var expRet = (fv / last) ** (1 / time_ass) - 1 //annualized
        var arr = [names_arr[i][0], expRet, last, names_arr[i][2]]
        output_data.push(arr)
    }

    ////// Add in etfs here? (Top 5 only)
    if (etf_fv.length != 0) {
        for (j = 0; j < 5; j++) {
            output_data.push([
                etf_fv[j][0],
                etf_fv[j][2],
                etf_fv[j][3],
                etf_fv[j][1]
            ]
            )
        }
    }

    // Generate allocation curves based on:
    // Max position size
    var maxSize_arr = [.40, .55, .70, .85, 1]
    var maxSize = maxSize_arr[parseInt(document.getElementById('concentration_ass').value) - 1];
    // Return required for max position (function of concentration and time horizon)
    // var minReturn_arr = [
    //     [0.2, 0.3, 0.4, 0.5, 0.6], // 1 Year
    //     [0.1, 0.15, 0.2, 0.25, 0.3], // 3 Year
    //     [0.07, 0.1, 0.13, 0.17, 0.2] // 5 Year
    // ];
    var minReturn_arr = [
        [0.5, 0.5, 0.5, 0.5, 0.5], // 1 Year
        [0.25, 0.25, 0.25, 0.25, 0.5], // 3 Year
        [0.17, 0.17, 0.17, 0.17, 0.17] // 5 Year
    ];
    var minReturn = minReturn_arr[(time_ass - 1) / 2][parseInt(document.getElementById('concentration_ass').value) - 1]
    // Now we have min return required for max position. Use 1% increments to generate curve: 65% exp, 35% linear
    var curveLowerBound = 0.01
    var rateExp = (maxSize / curveLowerBound) ** (1 / (minReturn * 100)) //Assumes curve using 1% increments
    // exponential vs linear sizing for different concentration profiles
    var expWeight_arr = [.6, .6, .6, .6, .6]
    // var expWeight_arr = [.05, .10, .20, .45, .75]
    var expWeight = expWeight_arr[parseInt(document.getElementById('concentration_ass').value) - 1];
    // var expWeight = 0.65; //Exponential curve vs. linear curve weighting
    var sizeCurve = []
    for (i = curveLowerBound * 100; i <= 100; i++) {
        var expValue = Math.min(curveLowerBound * (rateExp ** (i)), maxSize)
        var linearValue = Math.min(maxSize / (minReturn / curveLowerBound) + maxSize / (minReturn / curveLowerBound) * (i - 1), maxSize)
        sizeCurve.push([i / 100, expValue * expWeight + linearValue * (1 - expWeight)])
    }

    // Sort by exp return
    var output_sorted = output_data.sort(function (a, b) {
        return b[1] - a[1];
    });

    //Calculate and add hold p to table
    output_sorted[0].push('Hold %')
    var allocated = 0;
    for (j = 1; j < output_sorted.length; j++) {
        if (output_sorted[j][0] === 'Cash') {
            output_sorted[j].push(1 - allocated)
        } else if (output_sorted[j][1] < curveLowerBound) {
            output_sorted[j].push(0)
        } else if (output_sorted[j][1] > 1) {
            output_sorted[j].push(Math.min(1 - allocated, maxSize))
            allocated = allocated + Math.min(1 - allocated, maxSize)
        } else {
            // Find closest
            var needle = output_sorted[j][1];
            var allo = sizeCurve.reduce((a, b) => {
                return Math.abs(b[0] - needle) < Math.abs(a[0] - needle) ? b : a;
            });
            // output_sorted[j].push(allo[1])
            output_sorted[j].push(Math.min(1 - allocated, allo[1]))
            allocated = allocated + Math.min(1 - allocated, allo[1])
        }
    }


    ////// Here is where we will re arrange the columns as such: Name, return, hold p, last, tix. - actually not sure 
    ////////////// Have to create a function for when momentum/reversion changes

    //Create pie chart and table
    var data = google.visualization.arrayToDataTable(output_sorted, false);
    var chart_view = new google.visualization.DataView(data);
    chart_view.setRows(
        chart_view.getFilteredRows([{ column: 4, minValue: 0.000001 }])
    )
    chart_view.setColumns([0, 4])

    var chart_options = {
        title: 'Asset Class Allocation (' + time_ass + ' yr)',
        legend: 'bottom',
        width: '100%',
        height: '100%'
    };

    var table_options = {
        width: '100%',
        height: '100%',
        allowHtml: true,
        sortColumn: 4,
        sortAscending: false
    }

    //Draw pie chart
    var chart = new google.visualization.PieChart(document.getElementById('donutchart'));
    chart.draw(chart_view, chart_options);

    //Format data for table and draw
    var formatter1 = new google.visualization.NumberFormat(
        { fractionDigits: 0 });
    var formatter = new google.visualization.NumberFormat(
        { negativeColor: "red", negativeParens: true, pattern: '#,###%' });
    formatter.format(data, 1);
    formatter.format(data, 4);
    formatter1.format(data, 2);

    var table = new google.visualization.Table(document.getElementById('table_div'));
    table.draw(data, table_options);
}

//These functions rerun relevant fair value functions, and then the model run function. Load the google charts api on each function
function spxEXE() {
    google.charts.setOnLoadCallback(spx_fv_func);
    google.charts.setOnLoadCallback(modelRun);
}
function etfEXE() {
    google.charts.setOnLoadCallback(etf_fv_func);
    google.charts.setOnLoadCallback(modelRun);
}
function treasuryEXE() {
    google.charts.setOnLoadCallback(spx_fv_func);
    google.charts.setOnLoadCallback(gold_fv_func);
    google.charts.setOnLoadCallback(treasury_fv_func);
    google.charts.setOnLoadCallback(highYield_fv_func);
    google.charts.setOnLoadCallback(modelRun);
}
function riskEXE() {
    //Generate HYS and ERP from Risk index, if toggled
    var risk_ass = parseFloat(document.getElementById('risk_ass').value)
    var erp_ass = risk_ass * data_raw.getValue(1, 10) + data_raw.getValue(0, 10)
    var hys_ass = risk_ass * data_raw.getValue(3, 10) + data_raw.getValue(2, 10)
    document.getElementById("erp_ass").value = erp_ass;
    document.getElementById("hys_ass").value = hys_ass;
    slider_function(); //Reset slider bubbles
    google.charts.setOnLoadCallback(spx_fv_func);
    google.charts.setOnLoadCallback(highYield_fv_func);
    google.charts.setOnLoadCallback(modelRun);
}
////////////////
function erpEXE() {
    google.charts.setOnLoadCallback(spx_fv_func);
    google.charts.setOnLoadCallback(modelRun);
}
function hysEXE() {
    google.charts.setOnLoadCallback(highYield_fv_func);
    google.charts.setOnLoadCallback(modelRun);
}
////////////////
function inflationEXE() {
    google.charts.setOnLoadCallback(gold_fv_func);
    google.charts.setOnLoadCallback(commods_fv_func);
    google.charts.setOnLoadCallback(modelRun);
}
function concentrationEXE() {
    google.charts.setOnLoadCallback(modelRun);
}
function timeEXE() {
    google.charts.setOnLoadCallback(spx_fv_func);
    google.charts.setOnLoadCallback(treasury_fv_func);
    google.charts.setOnLoadCallback(highYield_fv_func);
    google.charts.setOnLoadCallback(modelRun);
}

/////////// FRED data scrape process for more reliable backend. Also, commods regression - lets do this now/first
            ////// Just migrate this process to lambda...will have to redo visualizations/entire script //// will do later when more users...
/////////// Add scatter charts for context/adjust models?
/////////// Once these 2 done, publish and start getting feedback.
/////////// All of the design for the output charts
/////////// All of the contextual visuals for the assumptions







