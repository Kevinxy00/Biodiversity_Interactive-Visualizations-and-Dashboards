/*** Purpose: to build sample selector menu and plots with json api routes as input. Plotly used to 
    make plot and insert into html section ***/

// get the selector and append an option for each sample from "/names"
var $selector = document.getElementById("selDataset");
// get the metadata table section
var $metaData = document.getElementById("metaData_table");
// get the washing frequency gauge section
var $wfreqGauge = document.getElementById("washing_freq_gauge");

// for each element in '/names' route, appendChild a menu option
d3.json("/names", function(error, response){
    console.log(response[0]);
    for (var i=0; i<response.length; i++){
        var $option_elem = document.createElement("option");
        $option_elem.setAttribute("value", response[i]);
        $option_elem.innerText = response[i]
        $selector.appendChild($option_elem);
    }

    // create first metadata table
    meta_table(response[0]);
    // plot the first pie chart
    plot_pie(response[0]);
    // plot the first bubble chart
    plot_bubble_chart(response[0]);
    // create the gauge
    create_gauge(response[0]);
}) 

// set sample to whatever option is selected
function optionChanged(option){
    console.log(option);
    meta_table(option);
    plot_pie(option);// restyle pie chart
    plot_bubble_chart(option); // restyle bubble chart
    create_gauge(option) // restyle gauge
}

function meta_table(sample){ // create metadata table
    var meta_url = "/metadata/" + sample; 

    // Delete all previous child nodes under metaData table section
    while ($metaData.children.length > 0){
        $metaData.removeChild($metaData.firstChild);
    }
    // meta_url returns {AGE:..., BBTYPE:..., ETHNICITY:..., GENDER:..., LOCATION:..., SAMPLEID:...}
    d3.json(meta_url, function(error, response){
        for (var key in response){
            var $row_element = document.createElement("tr");
            var $cell_element1 = document.createElement("td"); // key cell
            var $cell_element2 = document.createElement("td"); // value cell
            var row1 = "<b>" + key + ":</b> "; // key cell content
            var row2 = response[key]; // value cell content
            $cell_element1.innerHTML = row1;
            $cell_element2.innerHTML = row2;
            $row_element.appendChild($cell_element1);
            $row_element.appendChild($cell_element2);
            $metaData.appendChild($row_element);
        }
    });
}

function plot_pie(sample) { // display the top 10 samples
    // data route
    var sample_url = "/samples/" + sample; // returns [{otu_ids:[], sample_values:[]}]
    var otu_url = "/otu"; // returns list of otu_id descriptions

    Plotly.d3.json(sample_url, function(error, response){
        // get the top 10 values, id, and matching description:
        console.log("response length: " + response[0]['otu_ids'].length);
        var top_values = [];
        var top_otu_ids = [];
        var top_otuDescr = [];
        for (var i=0; i<10; i++){
            var value = response[0]['sample_values'][i];
            var otu_id = response[0]['otu_ids'][i];
            top_values.push(value);
            top_otu_ids.push(otu_id);
        }

            // get the top otu_id descriptions
        Plotly.d3.json(otu_url, function(error, otu_url_response){
            for (var i=0; i<10; i++){
                // get the id number for each top otu id
                var otuID = Number(top_otu_ids[i]);
                // since otu description is listed sequentially from otuID = 1 to 3675, can use id as form of index
                var otu_descr = otu_url_response[otuID - 1];
                console.log(typeof otu_descr);
                top_otuDescr.push(otu_descr);
            }

            // clean up top_otuDescr: adding </br> after each ;;
            for (var i=0; i<10; i++){
                var newString = JSON.stringify(top_otuDescr[i]);
                var split_otuDescr = newString.split(";");
                var joined_otuDescr = split_otuDescr.join("<br>");
                top_otuDescr.splice(i, 1, joined_otuDescr);
            }
            console.log("top_otuDescr inside the plotly: " + top_otuDescr[0]);

        }); // ends Plotly.d3.json for otu_url
        console.log("top_otuDescr outside the loop: " + top_otuDescr); // WHY IS THIS AN EMPTY ARRAY BUT THE HOVERTEXT STILL WORKS?!?!?!

        // Use the Sample Value as the values for the PIE chart; Use the OTU ID as the labels for the pie chart; 
        var data = [{
            values: top_values,
            labels: top_otu_ids,
            type: "pie",
            hoverinfo: "text",
            hovertext: top_otuDescr,
            opacity: 0.9
        }];

        // restyle only takes in one array at a time. Vars store the updated value, label, and hovertext;
        var update_val = top_values;
        var update_labl = top_otu_ids;
        var update_hovText = top_otuDescr;

        //layout of the pie charts
        var layout = {
            title: "<b>Top 10 Samples</b>", 
            autosize: true
        }
        
        // Create new plot if there is none, otherwise just restyle
        var element = document.getElementById("pie_chart"); 
        if (element.children.length == 0){ // if there is no plot under "#pie_chart"
            console.log("Plotting a new PIE!")
            Plotly.newPlot("pie_chart", data, layout);
        } else { // if there is a plot already, then just restyle it;
            console.log("restyling!");
            Plotly.restyle("pie_chart", "values", [update_val]);
            Plotly.restyle("pie_chart", "labels", [update_labl]);
            Plotly.restyle("pie_chart", "hovertext", [update_hovText]);
        }

    }); // ends Plotly.d3.json for sample_url;
}

// Plot bubble chart function (param: user_selected_sample_option)
function plot_bubble_chart(sample){
    var sample_url = "/samples/" + sample;
    var otu_url = "/otu";

    Plotly.d3.json(sample_url, function(error, response){
        var otu_ids = response[0]['otu_ids'];
        var sample_values = response[0]['sample_values'];
        var otuID_length = otu_ids.length;
        var otu_descr = [];

        // save otu id descriptions to otu_descr
        Plotly.d3.json(otu_url, function(error, response){
            for (i=0; i<otuID_length; i++){
                var ID = Number(otu_ids[i]); // remember: the IDs range from 1-3674 but aren't sorted sequentially
                var description = JSON.stringify(response[ID - 1]); // the IDs start at one while arrays start at 0
                var split_str = description.split(";");
                var joined_descr = split_str.join("<br>");
                otu_descr.push(joined_descr);
            } 
            console.log("otu_descr inside loop for bubble: " + otu_descr[0]);
        }); // end Plotly.d3.json for the otu description url

        /*** Use the OTU IDs for the x values & the Sample Values for the y values, 
         * Use the Sample Values for the marker size & the OTU IDs for the marker colors,
         * Use the OTU Description Data for the text values ***/
        var trace1 = {
            x: otu_ids,
            y: sample_values,
            mode: 'markers',
            hoverinfo: "text + x + y", 
            text: otu_descr,
            marker: {
                size: sample_values,
                color: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
                reversescale:true
            },
            type: 'scatter'
        };

        var traces = [trace1];

        var layout = {
            height: 600,
            hovermode:'closest',
            showlegend: false,
            xaxis: {
                title: "OTU IDs"
            },
            yaxis: {
                title: "Sample Values"
            } 
        };

        // update vars
        var update_x = otu_ids;
        var update_y = sample_values;
        var update_marker = sample_values;
        var update_hovtxt = otu_descr; 


        // Create new bubble plot at "#bubble_chart" if there is none; otherwise just restyle
        var element = document.getElementById("bubble_chart");   
        if (element.children.length == 0){
            console.log("Plotting a new BUBBLE CHART!")
            Plotly.newPlot("bubble_chart", traces, layout);
        } else {
            console.log("Restyling Bubble Chart")
            Plotly.restyle("bubble_chart", "x", [update_x]);
            Plotly.restyle("bubble_chart", "y", [update_y]);
            Plotly.restyle("bubble_chart", "marker.size", [update_marker]);
            Plotly.restyle("bubble_chart", "text", [update_hovtxt]);

        }
    }); // END Plotly.d3.json for the samples url
} //END bubble chart function


// ***     Bonus section: gauge function     ***
function create_gauge(sample){
    var gauge_url = "/wfreq/" + sample;

    /** Gauge creation with wash frequency api url
        Adapted from https://plot.ly/javascript/gauge-charts/ **/
    d3.json(gauge_url, function(error, response){ // response is an integer
        /* 180 degree in half a circle. 
        With 9 bins, response between 0-9, and >9 is off the charts
        so response == 10 is gauge at max */
        var level = response * 18;

        // Trig to calc meter point
        var degrees = 180 - level,
            radius = .5;
        var radians = degrees * Math.PI / 180;
        var x = radius * Math.cos(radians);
        var y = radius * Math.sin(radians);

        // Path: may have to change to create a better triangle
        var mainPath = 'M -.0 -0.025 L .0 0.025 L ',
            pathX = String(x),
            space = ' ',
            pathY = String(y),
            pathEnd = ' Z';
        var path = mainPath.concat(pathX,space,pathY,pathEnd);

        var data1 = { type: 'scatter',
            x: [0], y:[0],
            marker: {size: 28, color:'850000'},
            showlegend: false,
            name: 'Wash Frequency',
            text: response,
            hoverinfo: 'text+name'};

        var data2 = 
            { values: [50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50/9, 50],
            rotation: 90,
            text: ['9', '8', '7', '6',
                    '5', '4', '3', '2', '0-1', ''],
            textinfo: 'text',
            textposition:'inside',
            marker: {colors:['rgba(14, 127, 0, 1)', 'rgba(14, 127, 0, .75)', 
                                'rgba(14, 127, 0, .5)', 'rgba(110, 154, 22, 0.6)', 
                                'rgba(110, 154, 22, .5)', 'rgba(170, 202, 42, .5)', 
                                'rgba(202, 209, 95, .5)', 'rgba(210, 206, 145, .5)', 
                                'rgba(232, 226, 202, .5)', 'rgba(255, 255, 255, 0)']},
            labels: ['9', '8', '7', '6',
            '5', '4', '3', '2', '0-1', '>9'],
            hoverinfo: 'label',
            hole: .5,
            type: 'pie',
            showlegend: false
        };

        var traceData = [data1, data2];

        // for restyling the response name in the scatterplot point in the middle of the gauge
        var update1 = {
            text: response
        };

        var layout = {
            shapes:[{
                type: 'path',
                path: path,
                fillcolor: '850000',
                line: {
                    color: '850000'
                }
            }],
            title: '<b>Belly Button Washing Frequency</b> <br>Scrubs per Week', 
            height: 480, // autoscale:true messes up restyling (size increases each restyle)
            xaxis: {zeroline:false, showticklabels:false,
                        showgrid: false, range: [-1, 1]},
            yaxis: {zeroline:false, showticklabels:false,
                    showgrid: false, range: [-1, 1]}
        };

        // for updating the shapes in the layout
        var update_layout = {
            shapes:[{
                type: 'path',
                path: path,
                fillcolor: '850000',
                line: {
                    color: '850000'
                }
            }]
        };

        // If there is no previous gauge here (i.e. div contains no nodes), then create new gauge
        if ($wfreqGauge.children.length == 0){
            Plotly.newPlot('washing_freq_gauge', traceData, layout);
        } else { // else, restyle current meter on the gauge
            console.log("restyling wash freq gauge!"); 
            Plotly.restyle('washing_freq_gauge', update1, [0]);
            Plotly.relayout('washing_freq_gauge', update_layout);
        }
    }); // End plotly.d3.json for '/wfreq' 
} // End gauge function