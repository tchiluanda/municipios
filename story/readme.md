## Ideias

Karim fez com SVG (3140 nós)
https://observablehq.com/@karimdouieb/try-to-impeach-this-challenge-accepted

```js
applySimulation = (nodes) => {
  const simulation = d3.forceSimulation(nodes)
    .force("cx", d3.forceX().x(d => width / 2).strength(0.02))
    .force("cy", d3.forceY().y(d => width * (5/8) / 2).strength(0.02))
    .force("x", d3.forceX().x(d => d.properties.centroid ? d.properties.centroid[0] : 0).strength(0.3))
    .force("y", d3.forceY().y(d => d.properties.centroid ? d.properties.centroid[1] : 0).strength(0.3))
    .force("charge", d3.forceManyBody().strength(-1))
    .force("collide", d3.forceCollide().radius(d => d.properties.radius + nodePadding).strength(1))
    .stop()

  let i = 0; 
  while (simulation.alpha() > 0.01 && i < 200) {
    simulation.tick(); 
    i++;
    console.log(`${Math.round(100*i/200)}%`)
  }

  return simulation.nodes();
}

spreadCounties = applySimulation(counties)

vote_map_population_spread_bubble = {
  const height = width * 5/8;
  
  const svg = d3.select(DOM.svg(width, height))
      .attr("viewBox", "0 0 960 600")
      .style("width", "100%")
      .style("height", "auto");
  
  const color = d3.scaleSequential(d3.interpolateRdBu);
  
  // render map
  
  const path = d3.geoPath(projection);
  svg.append("g")
    .selectAll("circle")
    .data(spreadCounties)
    .enter().append("circle")
      .attr("fill", d => d.properties.votes.percent.dem > d.properties.votes.percent.gop ? "#0e0eb9" : "#ea0004")  
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.properties.radius)
      .style("stroke", "white")

  // render legend
  
  const x = d3.scaleLinear()
      .domain(color.domain())
      .rangeRound([0, 260]);

  return svg.node();
}

```

O choropleth:

```js
  const height = width * 5/8;
  
  const svg = d3.select(DOM.svg(width, height))
      .attr("viewBox", "0 0 960 600")
      .style("width", "100%")
      .style("height", "auto");
  
  const color = d3.scaleSequential(d3.interpolateRdBu);
  
  // render map
  
  const path = d3.geoPath(projection);

   svg.append("g")
     .selectAll("path")
     .data(counties)
     .enter().append("path")
     .attr("class", "countyShape")
     .attr("fill", county => county.properties.votes.percent.dem > county.properties.votes.percent.gop ? "#0e0eb9" : "#ea0004")  
     .attr("d", path)
     .attr("stroke", "white")
     .attr("stroke-width", 0.5)
     .append("title")
     .text(d => [
        d.properties.name,
        `${format.percent(d.properties.votes.percent.dem)} Clinton`,
        `${format.percent(d.properties.votes.percent.gop)} Trump`,
        ].join(" – ")
      ) 
```


E usando flubber:

```js

    svg.selectAll(".countyShape")
      .transition()
      .delay(d => d.rank*2)
      .duration(5000)
      .attrTween('d', function(d, i) {
        return flubber.toCircle(path(d), d.x, d.y, d.properties.radius, {maxSegmentLength: 2});
      })

    svg.selectAll(".countyShape")
      .transition()
      .delay(d => 10000 + d.rank*2)
      .duration(5000)
      .attrTween('d', function(d, i) {
        return flubber.fromCircle(d.x, d.y, d.properties.radius, path(d), {maxSegmentLength: 2});
      })
```

Tentar fazer o mapa com bolhas proporcionais, beeswarm.
Mapa com SVG
Zoom.

