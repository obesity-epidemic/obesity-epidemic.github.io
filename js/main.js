var templates = utils.setupTemplates();  // Store templates for rendering tooltips and Edition details.

// Will be used to the save the loaded JSON data
var allData = [];
loadData();

function loadData() {
    d3.json("data/processed_data/factors.json", function(error, jsonData){
        if(!error){
            allData = jsonData;

            createVis();
        }
    });
}

function createVis() {

    // Instantiate visualization objects here

    cartogramChart = new CartogramChart("cartoGram", allData);
}

(function () {

    var selector = '[data-rangeSlider]',
        elements = document.querySelectorAll(selector);

    // Example functionality to demonstrate a value feedback
    function valueOutput(element) {
        var value = element.value,
            output = element.parentNode.getElementsByTagName('output')[0];
        output.innerHTML = value;
    }

    for (var i = elements.length - 1; i >= 0; i--) {
        valueOutput(elements[i]);
    }

    Array.prototype.slice.call(document.querySelectorAll('input[type="range"]')).forEach(function (el) {
        el.addEventListener('input', function (e) {
            valueOutput(e.target);
        }, false);
    });


    // Basic rangeSlider initialization
    rangeSlider.create(elements, {
        min: 11,
        max: 50,
        value : 50,
        borderRadius : 3,
        buffer : 0,
        minEventInterval : 3000,

        // Callback function
        onInit: function () {
        },

        // Callback function
        onSlideStart: function (value, percent,  position) {
            //console.info('onSlideStart', 'value: ' + value, 'percent: ' + percent, 'position: ' + position);
        },

        // Callback function
        onSlide: function (value, percent,  position) {
            sizeInput = value;
            updateVisArea(getAttributeName(sizeCat), value);
            //console.log('onSlide', 'value: ' + value, 'percent: ' + percent, 'position: ' + position);
        },

        // Callback function
        onSlideEnd: function (value, percent,  position) {
            //console.warn('onSlideEnd', 'value: ' + value, 'percent: ' + percent, 'position: ' + position);
        }
    });

})();