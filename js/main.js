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