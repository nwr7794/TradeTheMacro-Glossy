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
        //Set initial user input assumptions
        drawContext();
    }

}

function drawContext(){
    function contextChart(col1, col2, options, chartType, divID, start_date = '2000-01-01') {
        var context_view = new google.visualization.DataView(data_raw);
        context_view.setRows(
            context_view.getFilteredRows([{ column: 0, minValue: new Date(start_date) }])
        )
        context_view.setColumns([col1, col2])
        var chart = eval("new google.visualization." + chartType + "(document.getElementById('" + divID + "'))");
        chart.draw(context_view, options);
        // console.log(context_view)
    }

    // Get date from 2 years ago
    var today = new Date();
    var dd = today.getDate();
    dd = dd - 365;
    dd = dd.toString();


    //Gold/real rates scatter
    gold_options = {
        title: 'Gold/Real 10yr Yield',
        hAxis: { title: 'Real 10yr Yield', format: 'percent' },
        vAxis: { title: 'Gold ($/ounce)', format: 'short' },
        legend: 'none',
        chartArea: { 'width': '70%', 'height': '70%' }
    }
    contextChart(6, 4, gold_options, 'ScatterChart', 'gold_chart', dd);
    //Commodities/Infl Exp scatter
    commods_options = {
        title: 'Commodities/Inflation Expectations',
        hAxis: { title: 'Inflation Expectations', format: 'percent' },
        vAxis: { title: 'Commodities ($DBC)', format: 'short' },
        legend: 'none',
        chartArea: { 'width': '70%', 'height': '70%' }
    }
    contextChart(5, 12, commods_options, 'ScatterChart', 'commods_chart', dd);

}