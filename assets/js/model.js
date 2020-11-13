// Load charts package
google.charts.load('47', { 'packages': ['corechart', 'controls', 'table'] });
// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(dataImport);

//////////////////////////// Grab raw data
// set initial conditions for user assumptions
// run fair value models and asset allocation algo
// draw charts/tables (for now just model output, eventually contextual as well)
// Create functions that execute when user inputs change - only redraw effected elemnts

//Model outputs will always rerun when user assumption changes - contextual charts should only need to load once, so diff functions

// console.log('test run')

//This function grabs the raw data from the google sheets
//Will need:
// spx timeseries, 10yr yield timeseries, ERP/HYS/Risk index timeseries, inflation expectations timeseries, TTM y/y spx earnings


function dataImport() {

    //Grab specific columns from data sheet
    var queryString = encodeURIComponent("SELECT A,B,C,G,J,K,L,M,N,R,S,T,U");

    var query = new google.visualization.Query(
        'https://docs.google.com/spreadsheets/d/1eABM4-XgHerB98VjVo1kVvcAl6ocGPCstMQs4bh5WEA/gviz/tq?sheet=Data&headers=1&tq=' + queryString);
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
        console.log(data_raw)
        // data_live = new google.visualization.DataView(data_raw);
        // data_live.getFilteredRows([{column: 0, value: !null}])


        //Set initial user input assumptions
        initialConditions();
    }
}

function initialConditions() {
    // Initial conditions to set:
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
            for (i = 0; i < data_array.rows.length; i++){
                if (data_array.rows[i]["c"][9] != null ){
                    count = count + 1
                    sum = sum + data_array.rows[i]["c"][9]["v"]
                }
            }
            var nominal_last_val = sum / count

        } else {
            var nominal_last_val = initial;
        }
        var nominal_range = data_raw.getColumnRange(colNum)
        var nominal_delta = nominal_range['max'] - nominal_range['min'];
        var nominal_lower_bound = (nominal_last_val - nominal_delta / 2).toFixed(round)
        var nominal_upper_bound = (nominal_last_val + nominal_delta / 2).toFixed(round)
        var nominal_step = ((nominal_upper_bound - nominal_lower_bound) / 32).toFixed(round)
        var stringInput = '<label for="Predictor">' + label + ': </label><input type="range" class="range" min="' + nominal_lower_bound + '" max="' + nominal_upper_bound + '" step="' + nominal_step + '" value="' + nominal_last_val + '" id="' + assumption + '"><output class="bubble"></output><br>';
        // console.log(stringInput)
        document.getElementById(assumption + '_head').innerHTML = stringInput
    }

    // SPX earnings growth
    setInitialAssumption('earnings_ass', 9,'average', 3);
    // 10yr treasury yld (use last)
    setInitialAssumption('yield_ass', 2, 'last', 3);
    // Risk Index (use last) - generate HYS and ERP from Risk index
    setInitialAssumption('risk_ass', 12, 'last', 1);
    // Inflation Expectations (use last)
    setInitialAssumption('inflation_ass',5,'last',4);
    // Portfolio concentration (Use balanced)
    document.getElementById('concentration_ass_head').innerHTML = '<label for="Predictor">Portfolio Concentration: </label><input type="range" class="range" min="1" max="5" step="1" value="3" id="concentration_ass"><output class="bubble"></output><br>';
    // Time Horizon (1 year)
    document.getElementById('time_ass_head').innerHTML = '<label for="Predictor">Time Horizon: </label><input type="range" class="range" min="1" max="5" step="2" value="1" id="time_ass"><output class="bubble"></output><br>';
    //Run function that makes slider work after divs are loaded
    slider_function();
    spx_fv_func();

}

function spx_fv_func(){
    // S&P500 FV - Inputs: earnings, treasury yield, ERP
    var risk_ass = parseFloat(document.getElementById('risk_ass').value)
    console.log(risk_ass)
    var erp_ass = risk_ass * data_raw.getValue(1,11) + data_raw.getValue(0,11)
    console.log(erp_ass)
    var earnings_2019 = 139.47;
    // console.log((1 + parseFloat(document.getElementById('earnings_ass').value)))
    // console.log(parseFloat(document.getElementById('time_ass').value))
    var earnings_growth_ass = (1 + parseFloat(document.getElementById('earnings_ass').value)) ** parseFloat(document.getElementById('time_ass').value)
    console.log(earnings_growth_ass)
    var earnings_abs_ass = earnings_2019 * earnings_growth_ass
    var yield_ass = parseFloat(document.getElementById('yield_ass').value)
    spx_fv = 1 / (yield_ass + erp_ass) * earnings_abs_ass
    console.log(spx_fv)

    // hys_ass = risk_ass * data_raw.getValue(3,11) + data_raw.getValue(2,11)


}



function modelRun() {
    
    // Asset class expected returns to calculate:
    // S&P 500 - eventually add in sectors (maybe like assuming momentum continues, or assuming mean reversion)
    // Inputs: earnings, treasury yield, ERP



    // Gold
    // 10 yr treasuries
    // US High yield debt
    // All commodities
    // Cash
    // Bitcoin...
    





}





