let dados_mapa_estados;

const mapa_svg = d3.select("svg.mapa");

fetch("estados.json")
    .then(response => response.json())
    .then(data => {
        dados_mapa_estados = data;
        init();
    })
;

function init() {

    const h = +mapa_svg.style("height").slice(0,-2);
    const w = +mapa_svg.style("width").slice(0,-2);

    mapa_svg.attr("viewBox", `0 0 ${w} ${h}`);
    mapa_svg.attr("width", w);
    mapa_svg.attr("height", h);

    const proj = d3.geoMercator()
        .center([-55, -15])
        //.rotate([10, 0])
        .scale(650)
        .translate([w / 2, h / 2])
    ;

    const features = dados_mapa_estados.features;

    console.log(features);

    const path_generator = d3.geoPath().projection(proj);

    mapa_svg.append("g")
        .selectAll("path.estados")
        .data(features)
        .join("path")
        .classed("estados", true)
        //.attr('data-nome', d => d.properties.name_muni)
        //.attr('data-uf', d => d.properties.abbrev_state)
        //.attr("stroke", "white")
        //.attr('stroke-width',  .5)
        //.attr('fill', 'hotpink')
        .attr("d", path_generator)
        .append("title")
        .text(d => d.properties.name_muni)
    ;   

}
