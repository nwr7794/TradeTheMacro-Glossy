/*global MacroFade _config*/

var MacroFade = window.MacroFade || {};

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

    ///////// Here add function that pulls users past scenarios if logged in /////////////
    ///////// Uses different resource from same api to trigger the pull lamdba function. Clean up html/js/lambdas and organize.
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
        console.log('Assumptions Saved')
        // Refresh saved scenarios
        getScenarios();
    }

    var table_options = {
        width: '100%',
        height: '100%',
        allowHtml: true,
        sortColumn: 1,
        sortAscending: false
    }

    // //Format data for table and draw
    // var formatter1 = new google.visualization.NumberFormat(
    //     { fractionDigits: 0 });
    // var formatter = new google.visualization.NumberFormat(
    //     { negativeColor: "red", negativeParens: true, pattern: '#,###%' });
    // formatter.format(data, 1);
    // formatter.format(data, 5);
    // formatter1.format(data, 2);
    // formatter1.format(data, 3);


    function completePull(result) {
        console.log(result)
        // Build the data table of saved scenarios
        var data = new google.visualization.DataTable()
        data.addColumn('string', 'Scenario Name');
        data.addColumn('date', 'Date Saved');
        // data.addColumn('boolean', 'Favorite'); // Will add the checkmark bool boxes later, will also have to add that to DB...
        for (i = 0; i < result.length; i++) {
            data.addRow(
                [result[i].Name, new Date(result[i].InputDate)]
            );
        }
        console.log(data)
        var table = new google.visualization.Table(document.getElementById('table_scenario_div'));
        table.draw(data, table_options);
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
    }

}(jQuery));

