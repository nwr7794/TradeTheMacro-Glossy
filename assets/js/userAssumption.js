/*global MacroFade _config*/

var MacroFade = window.MacroFade || {};

function deleteHandler() {
    if (confirm('Are you sure you want to delete scenario: ' + deleteID + '? (Page will reload)')) {
        // Run delete function and pass inputtime to it
        deleteScenario(inputtime);
        console.log('Thing was deleted');
    } else { console.log('cancelled') }
}
var deleteID;
var inputtime;
var deleteScenario;

(function inputScopeWrapper($) {
    var authToken;
    MacroFade.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
            // If authenticated modify html save options
            document.getElementById('loginShow').outerHTML = '';
            // Pull past saves
            getScenarios();
        } else {
            // If authenticated modify html save options
            document.getElementById('saveShow').outerHTML = '';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
    });

    function insertScenario(userInputs) {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/user',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                Name: userInputs.name,
                Time: userInputs.time,
                Earnings: userInputs.earnings,
                Sector: userInputs.sector,
                Treasury: userInputs.treasury,
                Risk: userInputs.risk,
                Erp: userInputs.erp,
                Hys: userInputs.hys,
                Inflation: userInputs.inflation,
                Concentration: userInputs.concentration

            }),
            contentType: 'application/json',
            success: completeRequest, /// Modify lambda function to return all db items for this user, then handle them in the complete request function
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error inserting scenario: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when adding your scenario:\n' + jqXHR.responseText);
            }
        });
    }


    // The delete scenario function
    deleteScenario = function(inputtime) {
        // console.log(authToken)
        // console.log(inputtime)
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/userdelete',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                InputTime: inputtime
            }),
            contentType: 'application/json',
            success: completeDelete,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error deleting scenario: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when deleting your scenario:\n' + jqXHR.responseText);
            }
        });
    }

    function getScenarios() {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/userquery',
            headers: {
                Authorization: authToken
            },
            contentType: 'application/json',
            success: completePull,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error retrieving scenarios: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when retrieving your scenarios:\n' + jqXHR.responseText);
            }
        });
    }

    function completeRequest(result) {
        console.log('Assumption saved')
        // Refresh saved scenarios
        getScenarios();
    }

    function completeDelete(result) {
        // Reload page
        location.reload()
        // Doing this for performance - could switch back to simply refreshing scenarios
    }

    var table_options = {
        width: '100%',
        height: '100%',
        allowHtml: true,
        sortColumn: 1,
        sortAscending: false
    }

    function completePull(result) {
        // console.log(result)
        // Build the data table of saved scenarios
        var data = new google.visualization.DataTable()
        data.addColumn('string', 'Scenario Name');
        data.addColumn('date', 'Date Saved');
        data.addColumn('string', 'Concentration');
        data.addColumn('string', 'Earnings');
        data.addColumn('string', 'Erp');
        data.addColumn('string', 'Hys');
        data.addColumn('string', 'Inflation');
        data.addColumn('string', 'Risk');
        data.addColumn('string', 'Sector');
        data.addColumn('string', 'Time');
        data.addColumn('string', 'Treasury');
        data.addColumn('string', '');
        data.addColumn('number', 'Input Time');


        for (i = 0; i < result.length; i++) {
            data.addRow(
                [result[i].Name, new Date(result[i].InputDate), result[i].Concentration,
                result[i].Earnings, result[i].Erp, result[i].Hys,
                result[i].Inflation, result[i].Risk, result[i].Sector,
                result[i].Time, result[i].Treasury,
                '<input type="button" value="DELETE" class="deleteButton" onClick="deleteHandler()" />',
                result[i].InputTime]
            );
        }

        var view = new google.visualization.DataView(data)
        view.setColumns([0, 1, 11]);

        // console.log(data)
        var table = new google.visualization.Table(document.getElementById('table_scenario_div'));
        table.draw(view, table_options);

        //Event listener to load assumptions when clicker
        google.visualization.events.addListener(table, 'select', selectHandler);

        // Handle event listener
        function selectHandler() {
            if (typeof table.getSelection()[0] != 'undefined') {
                var row = table.getSelection()[0].row
                deleteID = data.getValue(row, 0)
                inputtime = data.getValue(row, 12)
                // console.log(data.getValue(row, 1))
                //When clicked set assumptions to saved values, then rerun model
                document.getElementById("concentration_ass").value = data.getValue(row, 2);
                document.getElementById("earnings_ass").value = data.getValue(row, 3);
                document.getElementById("erp_ass").value = data.getValue(row, 4);
                document.getElementById("hys_ass").value = data.getValue(row, 5);
                document.getElementById("inflation_ass").value = data.getValue(row, 6);
                document.getElementById("risk_ass").value = data.getValue(row, 7);
                document.getElementById("etf_ass").value = data.getValue(row, 8);
                document.getElementById("time_ass").value = data.getValue(row, 9);
                document.getElementById("yield_ass").value = data.getValue(row, 10);

                // Run fair value functions
                spx_fv_func();
                gold_fv_func();
                treasury_fv_func();
                highYield_fv_func();
                commods_fv_func();
                cash_fv_func();
                modelRun();
                slider_function(); //Reset slider bubbles
            }
        }
    }


    // Register click handler for #add button
    $(function onDocReady() {
        $('#saveAssumptions').submit(handleAddPosition);
    });

    function handleAddPosition(event) {

        // Add name input and refresh button if logged in, else add button to sign in or sign up
        var name = $('#nameInput').val();
        var time = $('#time_ass').val();
        var earnings = $('#earnings_ass').val();
        var sector = $('#etf_ass').val();
        var treasury = $('#yield_ass').val();
        var risk = $('#risk_ass').val();
        var erp = $('#erp_ass').val();
        var hys = $('#hys_ass').val();
        var inflation = $('#inflation_ass').val();
        var concentration = $('#concentration_ass').val();
        var userInputs = {
            'name': name,
            'time': time,
            'earnings': earnings,
            'sector': sector,
            'treasury': treasury,
            'risk': risk,
            'erp': erp,
            'hys': hys,
            'inflation': inflation,
            'concentration': concentration
        }
        console.log(userInputs)
        event.preventDefault();
        insertScenario(userInputs)
        $("#saveAssumptions")[0].reset();

    }

}(jQuery));

