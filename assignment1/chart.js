var Chart = function(params)
{
  self = this;
  self.container = params.container;
  self.attrName = params.attrName;
  self.data = params.data;
  self.bins = params.bins;
  self.type = params.type;

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
                       margin.top + ")")
                      .call(d3.drag()
                          .on("start", dragStarted)
                          .on("end", dragEnded));

    self.setupScales();
    self.plot();
    self.initialAxes();
}

//drag events triggered when the bars are dragged left or right
var xloc = 0;
function dragStarted(d) {
  xloc = d3.mouse(this)[0];
}

//calculating drag distance and updating chart with new bins
function dragEnded(d) {
  var binDelta = (d3.mouse(this)[0] - xloc)/10;
  console.log(xloc + " " + d3.mouse(this)[0] + " " + binDelta);
  self.updateBinsOnDrag(binDelta);
}

Chart.prototype.setupScales = function()
{

  if(self.type==="categorical") {
    //calculating frequencies for each category of categorical attribute
    self.myMap = {};
    self.data.forEach( d => {
      if(self.myMap[d]==undefined)
        self.myMap[d] = 0;
        self.myMap[d]++;
      })
    console.log(self.myMap);
    var xLabels = d3.keys(self.myMap);
    var yValues = d3.values(self.myMap);
    //setting up scales for x-axis and y-axis
    self.xScale = d3.scaleBand().domain(xLabels).range([0, self.width]);
    self.yScale = d3.scaleLinear().domain([0, d3.max(yValues)]).range([self.height,0]);
  }
  else {
    //setting up scales for numeric data
    self.xScale = d3.scaleLinear().domain(d3.extent(self.data))
                    .range([0, self.width]);

    //binning numeric data into bins
    self.binnedData = d3.histogram().domain(self.xScale.domain())
                                    .thresholds(self.xScale.ticks(self.bins))
                                    (self.data);

    self.yScale = d3.scaleLinear()
                   .domain([0, d3.max(self.binnedData, (d) => { return d.length; })])
                   .range([self.height, 0]);
  }
  console.log(self.xScale.domain()+" "+ self.xScale.range());
  console.log(self.yScale.domain()+" "+ self.yScale.range());
}



Chart.prototype.initialAxes = function()
{
  //setting up axes(with ticks and labels) for the first time after loading the page
  var xAxis = self.histChart.append("g")
                      .attr("class", "x-axis")
                      .attr("transform", "translate(0," + self.height + ")")
                      .call(d3.axisBottom(self.xScale))
                      .append("text")
                        .attr("class", "xAxisLabel")
                       .attr("y", self.height - 310)
                       .attr("x", self.width - 100)
                       .attr("text-anchor", "end")
                       .attr("stroke", "#333333")
                       .text(self.attrName);

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
                             .text("Count");
}

Chart.prototype.updateAxes = function()
{
  //updating both the axes
  var xAxis = self.histChart.select(".x-axis").transition()
                      .attr("transform", "translate(0," + self.height + ")")
                      .call(d3.axisBottom(self.xScale));
  self.histChart.select(".xAxisLabel").text(self.attrName);

  if(self.type === "categorical")
  { //rotating x-axis labels for visibility
    self.histChart.select(".x-axis").selectAll(".tick").selectAll("text")
                  .style("text-anchor", "end")
                  .attr("dx", "-.8em")
                  .attr("dy", ".15em")
                  .attr("transform", "rotate(-65)");
  }

  var yAxis = self.histChart.select(".y-axis").transition()
                            .call(d3.axisLeft(self.yScale));
}

Chart.prototype.plot = function()
{
  console.log("inside plotting");
  var x = self.xScale;
  var y = self.yScale;

  if(self.type==="categorical")
  {
    //constructing bars for categorical data
    var xLabels = d3.keys(self.myMap);
    var yValues = d3.values(self.myMap);
    var bars = self.histChart.selectAll("rect").data(xLabels);
    console.log(self.height);
    console.log(self.yScale(1));
    bars.enter().append('rect')
      .attr("class", "bar")
      .attr('x', d => {return self.xScale(d);})
      .attr('y', d => {return self.yScale(self.myMap[d]);})
      .attr('width',self.xScale.bandwidth())
      .attr('height', d=> { return self.height - self.yScale(self.myMap[d])})
      .on("mouseover", onMouseOverEvent)
      .on("mouseout", onMouseOutEvent);
  }
  else {
    console.log(self.binnedData);
    //constructing bars for numerical data
    var bars = self.histChart.selectAll("rect").data(self.binnedData);
    bars.enter()
        .append("rect")
            .attr("class", "bar")
            .attr('x', d => {return x(d.x0);})
            .attr('y', d => {return y(d.length);})
            .attr("width", function(d) { return x(d.x1) - x(d.x0);})
            .attr("height", d => { return self.height - y(d.length); })
            .on("mouseover", onMouseOverEvent)
            .on("mouseout", onMouseOutEvent);
  }

}

function onMouseOverEvent(d, i) {
//increases width, height and darkens the bars when hovered over with mouse
    var width = 0;
    var yLoc = 0;
    var xLoc = 0;
    if(self.type === "numeric")
    {
      width = self.xScale(d.x1) - self.xScale(d.x0);
      yLoc = d.length;
      xLoc = d.x0;
    }
    else
    {
      width = self.xScale.bandwidth();
      yLoc = self.myMap[d];
      xLoc = d;
    }
    d3.select(this).attr('class', 'highlight');
    d3.select(this)
      .transition().duration(400)
      .attr('width', width+6)
      .attr('x', d => {return self.xScale(xLoc)-3;})
      .attr("y", function(d) { return self.yScale(yLoc) - 7; })
      .attr("height", function(d) { return self.height - self.yScale(yLoc); });
//displays the count on top of the bar
    self.histChart.append("text")
     .attr('class', 'val')
     .attr('x', function() { return (self.xScale(xLoc)+width/4); })
     .attr('y', function() { return self.yScale(yLoc) - 10; })
     .text(function() { return [yLoc]; });
}

function onMouseOutEvent(d, i) {
  //for bar to go back to its initial position after the mouse pointer leaves
    var width = 0;
    var xLoc = 0;
    var yLoc = 0;
    if(self.type === "numeric")
    {
      width = self.xScale(d.x1) - self.xScale(d.x0);
      xLoc = d.x0;
      yLoc = d.length;
    }
    else
    {
      width = self.xScale.bandwidth();
      xLoc = d;
      yLoc = self.myMap[d];
    }
    d3.select(this).attr('class', 'bar');
    d3.select(this).transition().duration(400)
      .attr('width', width)
      .attr('x', d => {return self.xScale(xLoc);})
      .attr("y", function(d) { return self.yScale(yLoc); })
      .attr("height", function(d) { return self.height - self.yScale(yLoc); });

    d3.selectAll('.val').remove()
}

Chart.prototype.updateChart = (name, data, type) => {
  //update chart whenever a different attribute is selected from the dropdown
  console.log("inside update");
  self.attrName = name;
  self.data = data;
  self.type = type;
  d3.selectAll("rect").remove();
  self.setupScales();
  self.updateAxes();
  self.plot();
}

Chart.prototype.updateBinsOnDrag = (binDelta) => {
  //updates the number of bins for numeric attributes depending on the
  //direction and distance of drag
  if(self.type === "numeric"){
    self.bins -= binDelta;
    d3.selectAll("rect").remove();
    self.setupScales();
    self.updateAxes();
    self.plot();
  }
}


/*
REFERENCES
1.	For understanding javascript, d3.js, scales, transitions and plotting charts - https://www.youtube.com/watch?v=_8V5o2UHG0E
2.	Structuring code into classes and functions - https://gist.github.com/nstrayer/776ca46537c557e59b994aa439fdb26c
3.	Histograms - https://www.d3-graph-gallery.com/graph/histogram_basic.html
4.	Bar charts - https://bl.ocks.org/d3noob/8952219
5.	Mouse over and mouse out events for highlighting bar - http://bl.ocks.org/WilliamQLiu/76ae20060e19bf42d774
6.	Dragging bars events - https://observablehq.com/@d3/click-vs-drag
*/
