/*** Purpose: to build sample selector menu and plots with json api routes as input. Plotly used to 
    make plot and insert into html section ***/

// get the selector and append an option for each sample from "/names"
var $selector = document.getElementById("selDataset");
// for each element in '/names' route, appendChild a menu option
d3.json("/names", function(error, response){
    console.log(response[0]);
    for (var i=0; i<response.length; i++){
        var $option_elem = document.createElement("option");
        $option_elem.setAttribute("value", response[i]);
        $option_elem.innerText = response[i]
        $selector.appendChild($option_elem);
    }

    // plot the first pie chart
    plot_pie(response[0]);
    // plot the first bubble chart
    plot_bubble_chart(response[0]);
}) 

// set sample to whatever option is selected
function optionChanged(option){
    console.log(option);
    plot_pie(option);// restyle pie chart
    plot_bubble_chart(option); // restyle bubble chart
    // Plotly.restyle() // restyle gauge
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
            hovertext: top_otuDescr
        }];

        // restyle only takes in one array at a time. Vars store the updated value, label, and hovertext;
        var update_val = top_values;
        var update_labl = top_otu_ids;
        var update_hovText = top_otuDescr;

        //layout of the pie charts
        var layout = {
            title: "Top 10 Samples", 
            height: 400,
            width: 500
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
        }); // end Plotly.d3.json for the otu description url
        console.log("otu_descr: " + otu_descr); // This array is empty! why???

        /*** Use the OTU IDs for the x values & the Sample Values for the y values, 
         * Use the Sample Values for the marker size & the OTU IDs for the marker colors,
         * Use the OTU Description Data for the text values ***/
        var trace = [{
            x: otu_ids,
            y: sample_values,
            mode: 'markers',
            marker: {
                size: sample_values
            },
            text: otu_descr
        }];

        var layout = {
            height: 600,
            width: 800,
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
        var update_marker = {
            size: sample_values
        };
        var update_hovtxt = otu_descr; 


        // Create new bubble plot at "#bubble_chart" if there is none; otherwise just restyle
        var element = document.getElementById("bubble_chart");   
        if (element.children.length == 0){
            console.log("Plotting a new BUBBLE CHART!")
            Plotly.newPlot("bubble_chart", trace, layout);
        } else {
            console.log("Restyling Bubble Chart")
            Plotly.restyle("bubble_chart", "x", [update_x]);
            Plotly.restyle("bubble_chart", "y", [update_y]);
            Plotly.restyle("bubble_chart", "marker", [update_marker]);
            Plotly.restyle("bubble_chart", "text", [update_hovtxt]);

        }

    }); // END Plotly.d3.json for the samples url

}