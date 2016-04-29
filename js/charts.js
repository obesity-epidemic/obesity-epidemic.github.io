(function() {
    
    // Supporting currency processing function.
    function currencyToNumber(currencyStr) {
        return  Number(currencyStr.replace(/[^0-9\.]+/g,''));
    }

    var percentFormat = d3.format('.2f');

    // Sequential scale for 'by-year'
    var quantizeSeq = d3.scale.quantize()
        .range(d3.range(8).map(function (i) {
            return 'q' + i + '-8';
        }))
        .domain([0, 40]);

    // Diverge scale for 'over-time'
    var quantileDiverge = d3.scale.quantile()
        .range(d3.range(10).map(function (i) {
            return 'q' + i + '-10';
        }))
        .domain([-25, 25]);

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
        var trend = new window.charts.Trend('#state-trend-line');

        var chart = new window.charts.PolarArea('#polarArea', window.chartData.stateTrends, 'yr2014', {
            width: 500,
            height: 500
        })
        .on('activeState', function(state) {
            var vals = [];
            var $polarAreaStateDetail = $('#polarAreaStateDetail');
            $polarAreaStateDetail.find('.prompt-active-state').css('display', 'none');
            $polarAreaStateDetail.find('.active-state').css('display', '');
            $polarAreaStateDetail.find('.state-name').text(state.source.st);
            $polarAreaStateDetail.find('.state-value').text(state.value);

            var $stateVals = $polarAreaStateDetail.find('.state-all-values');
            $stateVals.empty();
            $stateVals.append('<tr><th>Year</th><th>Obesity Rate</th><th>Rate Change <small>(from previous measurement)</small></th></tr>');

            var previous = null;
            _.forEach(state.source, function(v, k) {
                var matches = k.match(/^yr(\d{4})$/);
                var val = v ? v + '%' : '(No Data)';

                if (matches) {
                    var valBoxSeq = v ? '<span class="seq valbox ' + quantizeSeq(v) + '"></span> ' : '';

                    var valRow = $('<tr>');
                    valRow.append($('<td>').text(matches[1]));
                    valRow.append($('<td>').html(valBoxSeq + val));

                    if (previous && v) {
                        var change = Math.round((v - previous) * 100) / 100;
                        var valBoxDiverge = '<span class="diverge valbox ' + quantileDiverge(change) + '"></span>&nbsp;';
                        var append = change < 0 ? ' <i class="fa fa-arrow-down"></i>' : '';
                        valRow.append($('<td>').html(valBoxDiverge + change + '%' + append));
                    }
                    else {
                        valRow.append($('<td>').html('&mdash;'));
                    }

                    $stateVals.append(valRow);

                    if (v !== null) {
                        vals.push({
                            year: new Date(matches[1]),
                            val: v
                        });
                    }

                    previous = v;
                }
            });
            
            trend.setData(vals);
        });

        // Update charts when radios change
        $('input[type=radio][name=polarAreaMode]').change(function() {
            chart.setSort(this.value);
        });

        var $states = $('.states input[type=checkbox]');
        var $usa = $('.country-title input[type=checkbox]');
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
            else { // It is a state
                if (!checked) {
                    // Clearing a state should uncheck the containing division, region, and country
                    $el.closest('.division').find('.division-title input[type=checkbox]').prop('checked', false);
                    $el.closest('.region').find('.region-title input[type=checkbox]').prop('checked', false);
                    $usa.prop('checked', false);
                }
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
        function setBestWorstTable(activeProperty) {
            var data = window.chartData.stateTrends;
            var _data = _(data).map(function (d) {
                return {
                    value: d[activeProperty],
                    datum: d
                };
            }).sortBy('value').filter(function (d) {
                return d.value !== null;
            });

            var best = _data.take(5).value();
            var worst = _data.takeRight(5).value().reverse();
            var combo = _.zip(best, worst);

            $('#map-extremes').css('display', '');
            var rows = d3.select('#map-extremes table tbody').selectAll('tr')
                .data(combo);

            var newRows = rows.enter().append('tr');
            newRows.append('td')
                .html(function (pair, i) {
                    return i + 1 + '.';
                });

            newRows.append('td').attr('class', 'best');
            newRows.append('td').attr('class', 'worst');

            rows.select('.best')
                .html(function (pair) {
                    var d = pair[0];
                    var valBox = '<span class="seq valbox ' + quantizeSeq(d.value) + '"></span>&nbsp;';
                    return valBox + d.datum.ab + ': ' + d.value + '%';
                });

            rows.select('.worst')
                .html(function (pair) {
                    var d = pair[1];
                    var valBox = '<span class="seq valbox ' + quantizeSeq(d.value) + '"></span>&nbsp;';
                    return valBox + d.datum.ab + ': ' + d.value + '%';
                });

            rows.exit()
                .remove();
        }

        function setBestWorstChangeTable(range) {
            var data = window.chartData.stateTrends;
            var _data = _(data).map(function (d) {
                var v = null;

                if (d[range[1]] !== null && d[range[0]] !== null) {
                    v = d[range[1]] - d[range[0]];
                }

                return {
                    value: v,
                    datum: d
                };
            }).sortBy('value').filter(function (d) {
                return d.value !== null;
            });

            var best = _data.take(5).value();
            var worst = _data.takeRight(5).value().reverse();
            var combo = _.zip(best, worst);

            $('#map-extremes').css('display', '');
            var rows = d3.select('#map-extremes table tbody').selectAll('tr')
                .data(combo);

            var newRows = rows.enter().append('tr');
            newRows.append('td')
                .html(function (pair, i) {
                    return i + 1 + '.';
                });

            newRows.append('td').attr('class', 'best');
            newRows.append('td').attr('class', 'worst');

            rows.select('.best')
                .html(function (pair) {
                    var d = pair[0];
                    var valBox = '<span class="diverge valbox ' + quantileDiverge(d.value) + '"></span>&nbsp;';
                    var append = d.value < 0 ? ' <i class="fa fa-arrow-down"></i>' : '';
                    return valBox + d.datum.ab + ': ' + percentFormat(d.value) + '%' + append;
                });

            rows.select('.worst')
                .html(function (pair) {
                    var d = pair[1];
                    var valBox = '<span class="diverge valbox ' + quantileDiverge(d.value) + '"></span>&nbsp;';
                    return valBox + d.datum.ab + ': ' + percentFormat(d.value) + '%';
                });

            rows.exit()
                .remove();
        }

        var activeRange = ['yr1990', 'yr2014'];
        var activeProperty = 'yr2014';
        var choropleth = new window.charts.Choropleth('#choropleth', window.chartData.stateTrends, window.topoJson.usa, activeProperty);
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

        var timeline = new window.charts.Timeline('#timeline', years, activeProperty);

        // Update choropleth when 'By Year' mode
        timeline.on('activeProperty', function(newActiveProperty) {
            activeProperty = newActiveProperty;
            choropleth.setActiveProperty(activeProperty);
            setBestWorstTable(activeProperty);
        });

        // Update choropleth when 'Over Time' mode
        timeline.on('rangeChange', function(range) {
            activeRange = range;
            choropleth.setRange(activeRange);
            setBestWorstChangeTable(activeRange);
        });

        // Update charts when radios change
        $('input[type=radio][name=choroplethMode]').change(function() {
            choropleth.setMode(this.value);
            timeline.setMode(this.value);

            if (this.value === 'over-time') {
                setBestWorstChangeTable(activeRange);
            }
            else {
                setBestWorstTable(activeProperty);
            }
        });

        // Handle "Show Me" links.
        $('#show-me-map-drop').click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Set mode: 'over-time'
            choropleth.setMode('over-time');
            timeline.setMode('over-time');

            // Set range: 'yr2003', 'yr2004'
            activeRange = ['yr2003', 'yr2004'];
            choropleth.setRange(activeRange);
            timeline.setRange(activeRange);

            setBestWorstChangeTable(activeRange);
        });

        $('#show-me-map-holdout').click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Set mode: 'by-year'
            choropleth.setMode('by-year');
            timeline.setMode('by-year');

            // Set year: 'yr2011'
            activeProperty = 'yr2011';
            choropleth.setActiveProperty(activeProperty);
            timeline.setActiveProperty(activeProperty);
        });

        $('#show-me-map-time').click(function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Set mode: 'by-year'
            choropleth.setMode('by-year');
            timeline.setMode('by-year');

            // Set year: 'yr1990'
            activeProperty = 'yr1990';
            choropleth.setActiveProperty(activeProperty);
            timeline.setActiveProperty(activeProperty);

            // Play!
            timeline.play();
        });

        // Set up initial table
        setBestWorstTable(activeProperty);
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

                d['US Overweight Cost'] = currencyToNumber(d['US Overweight Cost']);
                d['US Obesity Cost'] = currencyToNumber(d['US Obesity Cost']);
            });

            window.chartData.nationsTrends = json;

            // Charts solely dependant on National Trends
            nationalObesityStackedArea();
            nationalObesitySpendingLine();
            nationalObesityIconArray();
        });

        var stateTrendsXhr = d3.json('data/processed_data/state_obesity_trend.json', function (error, json) {
            if (error) {
                alert(error);
                return;
            }

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