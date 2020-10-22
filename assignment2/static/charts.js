var Chart = function(params)
{
  self = this;
  self.container = params.container;
  self.xValues = params.xValues;
  self.yVal = params.yValues;

  margin = {top: 50, right: 50, bottom: 90, left: 50};
  self.width = 1000 - margin.left - margin.right;
  self.height = 530 - margin.top - margin.bottom;

//setting up svg to add elements of the chart
  var canvas = d3.select(self.container)
                    .append("svg")
                      .attr("width", self.width + margin.left + margin.right)
                      .attr("height", self.height + margin.top + margin.bottom);

  self.histChart = canvas.append("g")
                      .attr("transform", "translate(" + margin.left + "," +
                       margin.top + ")");

  self.myMap = {};
  var i;
  for(i=0; i<self.xValues.length ;i++) {
    self.myMap[self.xValues[i]] = self.yVal[i];
  }
  self.xLabels = d3.keys(self.myMap);
  self.yValues = d3.values(self.myMap);
  console.log(self.yValues);
  //setting up scales for x-axis and y-axis
  self.xScale = d3.scaleBand().domain(self.xLabels).range([0, self.width]);
  self.yScale = d3.scaleLinear().domain([0, 1]).range([self.height,0]);

  var x = self.xScale;
  var y = self.yScale;

    //constructing bars for data
    var bars = self.histChart.selectAll("rect").data(self.xLabels);
    bars.enter().append('rect')
      .attr("class", "bar")
      .attr('x', d => {return self.xScale(d);})
      .attr('y', d => {return self.yScale(self.myMap[d]);})
      .attr('width',self.xScale.bandwidth())
      .attr('height', d=> { return self.height - self.yScale(self.myMap[d])})
      .style("fill", "#3182bd");

    var xAxis = self.histChart.append("g")
                      .attr("class", "x-axis")
                      .attr("transform", "translate(0," + self.height + ")")
                      .call(d3.axisBottom(self.xScale))
                      .append("text")
                        .attr("class", "xAxisLabel")
                       .attr("y", self.height - 350)
                       .attr("x", self.width - 100)
                       .attr("text-anchor", "end")
                       .attr("stroke", "#333333")
                       .text("Principal Components");

  var yAxis = self.histChart.append("g")
                            .attr("class", "y-axis")
                            .call(d3.axisLeft(self.yScale))
                            .append("text")
                              .attr("class", "yAxisLabel")
                             .attr("transform", "rotate(-90)")
                             .attr("y", 15)
                             .attr("dy", "-5.1em")
                             .attr("text-anchor", "end")
                             .attr("stroke", "#333333")
                             .text("Explained Variance");

   var line = self.histChart.append("line")
       .attr("x1", self.xScale("PC4")+self.xScale.bandwidth()/2)
       .attr("x2", self.xScale("PC4")+self.xScale.bandwidth()/2)
       .attr("y1", 0)
       .attr("y2", self.height)
       .attr("stroke-width", 2)
       .attr("stroke", "black")
       .attr("stroke-dasharray", "8,8");
}

var ScatterPlot = function(params) {
  self = this;
  self.container = params.container;
  self.data = params.data;
  self.columns = params.columns
  self.xValues = [];
  self.yValues = [];

    self.data = JSON.parse(self.data);
    console.log(self.data.length);
    for (var i = 0; i < self.data.length; i++) {
        self.xValues.push(self.data[i][self.columns[0]]);
        self.yValues.push(self.data[i][self.columns[1]]);
    }



  var margin = {top: 10, right: 30, bottom: 30, left: 60};
  self.width = 450 - margin.left - margin.right;
  self.height = 350 - margin.top - margin.bottom;

  //setting up svg to add elements of the chart
  var canvas = d3.select(self.container)
                  .append("svg")
                    .attr("width", self.width + margin.left + margin.right)
                    .attr("height", self.height + margin.top + margin.bottom);

  var scatterPlt = canvas.append("g")
                        .attr("transform", "translate(" + margin.left + "," +
                         margin.top + ")");

   //setting up scales for x-axis and y-axis
   var xScale = d3.scaleLinear().domain([d3.min(self.xValues), d3.max(self.xValues)]).range([0, self.width]);
   var yScale = d3.scaleLinear().domain([d3.min(self.yValues), d3.max(self.yValues)]).range([self.height,0]);

   //constructing bars for data
   var dots = scatterPlt.append('g').selectAll("dot").data(self.data);
   dots.enter().append('circle')
     .attr("class", "point")
     .attr('cx', d => {return xScale(d[self.columns[0]]);})
     .attr('cy', d => {return yScale(d[self.columns[1]]);})
     .attr("r", 1.5)
     .style("fill", "#3182bd");

   var xAxis = scatterPlt.append("g")
                     .attr("class", "x-axis")
                     .attr("transform", "translate(0," + self.height + ")")
                     .call(d3.axisBottom(xScale))
                     .append("text")
                       .attr("class", "xAxisLabel")
                      .attr("y", self.height - 283)
                      .attr("x", self.width - 100)
                      .attr("text-anchor", "end")
                      .attr("stroke", "#333333")
                      .text(self.columns[0]);

 var yAxis = scatterPlt.append("g")
                           .attr("class", "y-axis")
                           .call(d3.axisLeft(yScale))
                           .append("text")
                             .attr("class", "yAxisLabel")
                            .attr("transform", "rotate(-90)")
                            .attr("y", 15)
                            .attr("dy", "-5.1em")
                            .attr("text-anchor", "end")
                            .attr("stroke", "#333333")
                            .text(self.columns[1]);


}


var ScatterPlotMatrix = function(params) {
  self = this;
  self.container = params.container;
  self.data = params.data;
  self.columns = params.columns
  self.xValues = [];
  self.yValues = [];

    self.data = JSON.parse(self.data);
    console.log(self.data.length);
    self.columns[0] = d3.keys(self.data[0])[0];
    self.columns[1] = d3.keys(self.data[0])[1];
    for (var i = 0; i < self.data.length; i++) {
        self.xValues.push(self.data[i][self.columns[0]]);
        self.yValues.push(self.data[i][self.columns[1]]);
    }



  var margin = {top: 10, right: 20, bottom: 40, left: 40};
  self.width = 250 - margin.left - margin.right;
  self.height = 250 - margin.top - margin.bottom;

  //setting up svg to add elements of the chart
  var canvas = d3.select(self.container)
                  .append("svg")
                    .attr("width", self.width + margin.left + margin.right)
                    .attr("height", self.height + margin.top + margin.bottom);

  var scatterPlt = canvas.append("g")
                        .attr("transform", "translate(" + margin.left + "," +
                         margin.top + ")");

   //setting up scales for x-axis and y-axis
   var xScale = d3.scaleLinear().domain([d3.min(self.xValues)-1, d3.max(self.xValues)]).range([0, self.width]);
   var yScale = d3.scaleLinear().domain([d3.min(self.yValues)-1, d3.max(self.yValues)]).range([self.height,0]);

   //constructing bars for data
   var dots = scatterPlt.append('g').selectAll("dot").data(self.data);
   dots.enter().append('circle')
     .attr("class", "point")
     .attr('cx', d => {return xScale(d[self.columns[0]]);})
     .attr('cy', d => {return yScale(d[self.columns[1]]);})
     .attr("r", 1.5)
     .style("fill", "#3182bd");

   var xAxis = scatterPlt.append("g")
                     .attr("class", "x-axis")
                     .attr("transform", "translate(0," + self.height + ")")
                     .call(d3.axisBottom(xScale));
                     // .append("text")
                     //   .attr("class", "xAxisLabel")
                     //  .attr("y", self.height - 283)
                     //  .attr("x", self.width - 100)
                     //  .attr("text-anchor", "end")
                     //  .attr("stroke", "#333333")
                     //  .text(self.columns[0]);

 var yAxis = scatterPlt.append("g")
                           .attr("class", "y-axis")
                           .call(d3.axisLeft(yScale));
                           // .append("text")
                           //   .attr("class", "yAxisLabel")
                           //  .attr("transform", "rotate(-90)")
                           //  .attr("y", 15)
                           //  .attr("dy", "-5.1em")
                           //  .attr("text-anchor", "end")
                           //  .attr("stroke", "#333333")
                           //  .text(self.columns[1]);


}

//REFERENCES
//https://www.d3-graph-gallery.com/graph/scatter_basic.html
//https://jakevdp.github.io/PythonDataScienceHandbook/05.10-manifold-learning.html

