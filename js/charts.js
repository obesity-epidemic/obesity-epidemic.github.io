(function() {
    
    // Supporting currency processing function.
    function currencyToNumber(currencyStr) {
        return  Number(currencyStr.replace(/[^0-9\.]+/g,''));
    }

    // Render the obesity icon array.
    function nationalObesityIconArray() {
        var data = [
            { label: 'Total Extremely Obese (BMI>=40)', value: 6.6, cssClass: 'extreme-obese'},
            { label: 'Total Obese (BMI >= 30)', value: 35.3, cssClass: 'obese'},
            { label: 'Total Overweight (25 <= BMI < 30)', value: 33.3, cssClass: 'overweight'}
        ];

        var chart = new window.charts.IconArray('#people-icon-viz', data, {
            columns: 20,
            rows: 5
        });
    }

    // Render the obesity stacked area chart.
    function nationalObesityStackedArea() {
        var chart = new window.charts.StackedArea('#overweight-percentage-viz', window.chartData.nationsTrends, {
            width: 573,
            height: 180
        });
    }

    // Render the obesity spending lines chart.
    function nationalObesitySpendingLine() {
        var chart = new window.charts.Line('#health-spending-viz', window.chartData.nationsTrends, {
            width: 573,
            height: 180
        });
    }

    // Render the polar area chart.
    function stateObesityPolarArea() {
        var chart = new window.charts.PolarArea('#polarArea', window.chartData.stateTrends, 'yr2014', {
            width: 500,
            height: 500
        })
        .on('activeState', function(state) {
            $('#polarAreaStateDetail .active-state').css('display', '');
            $('#polarAreaStateDetail .state-name').text(state.source.st);
            $('#polarAreaStateDetail .state-value').text(state.value);

            var $stateVals = $('#polarAreaStateDetail .state-all-values');
            $stateVals.empty();

            _.forEach(state.source, function(v, k) {
                var matches = k.match(/^yr(\d{4})$/);

                if (matches) {
                    var valRow = $('<div>').text(matches[1] + ': ' + v + '%');
                    $stateVals.append(valRow);
                }
            });
        });

        // Update charts when radios change
        $('input[type=radio][name=polarAreaMode]').change(function() {
            chart.setSort(this.value);
        });

        var $states =  $('.states input[type=checkbox]');
        $('.state-filter input[type=checkbox]').change(function() {
            var $el = $(this);
            var v = this.value;
            var checked = this.checked;

            // (Un)Select children to match parent
            if (v === 'all') {
                $('.region input[type=checkbox]').prop('checked', checked);
            }
            else if (v.indexOf('region-') > -1 || v.indexOf('division-') > -1) {
                $el.closest('ul').find('input[type=checkbox]').prop('checked', checked);
            }

            var stateFilters = {};
            $states.map(function(i, el) {
                stateFilters[el.value] = el.checked;
            });
            
            chart.setStates(stateFilters);
        });
        
        $('#polarAreaYear').change(function() {
            chart.setActiveProperty(this.value);
        });

        $('#btn-polar-states').click(function() {
            $('.state-filter-dialog').css('display', 'block');
        });

        $('#btn-polar-states-close').click(function() {
            $('.state-filter-dialog').css('display', 'none');
        });
    }

    // Create the linked views for the Choropleth.
    function stateObesityChoroplethLinkedViews() {
        var choropleth = new window.charts.Choropleth('#choropleth', window.chartData.stateTrends, window.topoJson.usa, 'yr2014');
        var years = {};
        var dataPointKeys = _.keys(window.chartData.stateTrends[0]).filter(function(k) {
                return /^yr\d{4}$/.exec(k);
            }).sort();

        var firstYearNationalAvg = null;
        _.forEach(dataPointKeys, function(k) {
            var date = new Date(k.substring(2), 0);
            var nationalAvg = 0;
            var nationalChange = 0;
            var count = 0;
            
            _.forEach(window.chartData.stateTrends, function(state) {
                if (state[k]) { // Check because some states are missing values.
                    nationalAvg += state[k];
                    count++;
                }
            });
            
            nationalAvg = nationalAvg / count;

            if (firstYearNationalAvg) {
                nationalChange = nationalAvg - firstYearNationalAvg;
            }
            else {
                nationalChange = 0;
                firstYearNationalAvg = nationalAvg;
            }
            
            years[date.getFullYear()] = {
                date: date,
                property: k,
                nationalAvg: nationalAvg,
                nationalChange: nationalChange
            };
        });

        var chart = new window.charts.Timeline('#timeline', years, 'yr2014');

        // Update choropleth when 'By Year' mode
        chart.on('activeProperty', function(activeProperty) {
            choropleth.setActiveProperty(activeProperty);
        });

        // Update choropleth when 'Over Time' mode
        chart.on('rangeChange', function(range) {
            choropleth.setRange(range);
        });

        // Update charts when radios change
        $('input[type=radio][name=choroplethMode]').change(function() {
            choropleth.setMode(this.value);
            chart.setMode(this.value);
        });
    }

    // Load all data and initiate each chart as it's dependencies are loaded.
    function init() {
        // Load data
        window.chartData = {};

        var nationalTrendsXhr = d3.json('data/processed_data/national_trends.json', function (error, json) {
            if (error) {
                alert(error);
                return;
            }

            json.forEach(function (d) {
                var yearMatches = d['Year Period'].match(/(\d{4})/);
                var year = new Date(+yearMatches[1], 0, 0);
                d.year = year;

                d['US overweight Cost'] = currencyToNumber(d['US overweight Cost']);
                d['US obesity Cost'] = currencyToNumber(d['US obesity Cost']);
            });

            window.chartData.nationsTrends = json;

            // Charts solely dependant on National Trends
            nationalObesityStackedArea();
            nationalObesitySpendingLine();
            nationalObesityIconArray();
        });

        var stateTrendsXhr = d3.json('data/processed_data/state_obesity_trend.json', function (error, json) {
            window.chartData.stateTrends = json;

            stateObesityPolarArea();

            var map = d3.json('data/topojson/ne_10m_usa.json', function (error, json) {
                window.topoJson = {};
                window.topoJson.usa = json;
                stateObesityChoroplethLinkedViews();
            });
        });
    }
    
    init();
})();