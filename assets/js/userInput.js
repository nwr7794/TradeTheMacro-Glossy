/*global MacroFade _config*/

var MacroFade = window.MacroFade || {};

(function inputScopeWrapper($) {
    var authToken;
    MacroFade.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = 'signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = 'signin.html';
    });
    function insertPosition(userInputs) {
        $.ajax({
            method: 'POST',
            // url: _config.api.invokeUrl + '/user',
            url: _config.api.invokeUrl,
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                    Ticker: userInputs.ticker,
                    Allocation: userInputs.allocation,
                    Price: userInputs.price
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error inserting position: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when adding your position:\n' + jqXHR.responseText);
            }
        });
    }

    function completeRequest(result) {
        console.log('Position successfully added')        
    }

    // Register click handler for #add button
    $(function onDocReady() {
        $('#userPositions').submit(handleAddPosition);
    });

    function handleAddPosition(event) {
        var ticker = $('#tickerInput').val();
        var allocation = $('#allocationInput').val();
        var price = $('#priceInput').val();
        var userInputs = {'ticker' : ticker, 'allocation' : allocation, 'price' : price}
        event.preventDefault();
        insertPosition(userInputs)
    }

}(jQuery));
