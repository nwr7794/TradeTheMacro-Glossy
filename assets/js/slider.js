//Slider input scripts
function slider_function() {
    const allRanges = document.querySelectorAll(".range-wrap");
    allRanges.forEach(wrap => {
        const range = wrap.querySelector(".range");
        const bubble = wrap.querySelector(".bubble");

        range.addEventListener("input", () => {
            setBubble(range, bubble, wrap);
        });
        setBubble(range, bubble, wrap);
    });

    function setBubble(range, bubble, wrap) {
        const val = range.value;
        const min = range.min ? range.min : 0;
        const max = range.max ? range.max : 100;
        const newVal = Number(((val - min) * 100) / (max - min));
        if (wrap.className === "range-wrap percent") {
            bubble.innerHTML = ((val * 100).toFixed(2) + "%");
        } else {
            bubble.innerHTML = val;
        }

        // Sorta magic numbers based on size of the native UI thumb
        bubble.style.left = `calc(${newVal}% + (${8 - newVal * 0.15}px))`;
    }
}

//Collapsible script
// var type = ['collapsible']
// for (j = 0; j < type.length; j++) {
var coll = document.getElementsByClassName('collapsible');
var i;

for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function () {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
}
// }

//Collapsible script
// Change div class to Collaspsible Model Active
// var type = ['collapsibleModel']
// for (j = 0; j < type.length; j++) {
var coll1 = document.getElementsByClassName('collapsibleModel');
// var coll1 = document.getElementsByClassName('symbolExpand');
var j;


// This works! makes clickable area for expanding bigger, then clean up, then create rest of assumptions

for (j = 0; j < coll1.length; j++) {
    // var symbol = this.getElementsByClassName('symbolExpand')
    if (coll1[j].getElementsByClassName('symbolExpand')[0] != undefined) {
        coll1[j].getElementsByClassName('symbolExpand')[0].addEventListener("click", function () {
            // this.classList.toggle("active");
            // var content = this.nextElementSibling;
            var parent = this.parentElement;
            var content = parent.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
                this.innerHTML = '<b>+</b>'
                // document.getElementById('symbolExpand').innerHTML = '<b>+</b>'
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
                this.innerHTML = '<b>-</b>'
                // document.getElementById('symbolExpand').innerHTML = '<b>-</b>'
            }
        });
    }
}
// }
