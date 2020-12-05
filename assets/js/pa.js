// Load charts package
google.charts.load('47', { 'packages': ['corechart', 'table'] });
// Set a callback to run when the Google Visualization API is loaded.
google.charts.setOnLoadCallback(dataImport);

function dataImport() {

    //Grab specific columns from data sheet
    var queryString = encodeURIComponent("SELECT A,B,C,D");

    var query = new google.visualization.Query(
        'https://docs.google.com/spreadsheets/d/1fvuBTNtYMjV4JOwl9OKRDbRYS4F2nTOCJmhr40WHcYM/gviz/tq?sheet=Live_PA&headers=1&tq=' + queryString);
    query.send(handleSampleDataQueryResponse);

    function handleSampleDataQueryResponse(response) {

        if (response.isError()) {
            alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
            return;
        }

        //convert data to array
        data_raw = response.getDataTable();
        drawCharts();
        // data_array = data_raw.toJSON()
        // data_array = JSON.parse(data_array)
        // console.log(data_raw)

    }

}

function drawCharts() {

    //Create pie chart and table
    var chart_options = {
        title: "Holdings",
        legend: 'bottom',
        width: '100%',
        height: '100%'
    };

    var table_options = {
        width: '100%',
        height: '100%',
        allowHtml: true,
        sortColumn: 2,
        sortAscending: false
    }

    //Create data view for pie chart
    var chart_view = new google.visualization.DataView(data_raw);
    chart_view.setColumns([0, 2])

    //Draw pie chart
    var chart = new google.visualization.PieChart(document.getElementById('donutchart'));
    chart.draw(chart_view, chart_options);

    //Format data for table and draw
    // var formatter = new google.visualization.NumberFormat(
    //     { negativeColor: "red", negativeParens: true, pattern: '#,###%' });
    // formatter.format(data, 1);
    // formatter.format(data, 5);
    // formatter1.format(data, 2);
    // formatter1.format(data, 3);

    var table = new google.visualization.Table(document.getElementById('table_div'));
    table.draw(data_raw, table_options);
}
