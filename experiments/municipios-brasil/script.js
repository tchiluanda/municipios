// canvas da abertura

const cv0 = document.querySelector(".canvas-abertura");
const ctx0 = cv0.getContext("2d");


// o force layout só precisa ser calculado para os centroides. e aí podemos ir atualizando os xc? ver como faria para sincronizar

const cv1 = document.querySelector(".mapa-principal");
const ctx1 = cv1.getContext("2d");

const chart_container = document.querySelector(".chart-container");

const w = +window.getComputedStyle(cv1).width.slice(0,-2);
const h = +window.getComputedStyle(cv1).height.slice(0,-2);

function clear() {
    ctx1.clearRect(0, 0, w, h);
}

let mapa, max_pop, r_scale;
let data_;

console.log(cv1, w,h);

const resolution = 4;

cv1.setAttribute("width", w * resolution);
cv1.setAttribute("height", h * resolution);

ctx1.setTransform(resolution, 0, 0, resolution, 0, 0);

fetch("areas.json")
    .then(response => response.json())
    .then(data => {
        data_ = data;
        console.log(data);
        vis(data);

    });

function vis(data) {

    console.log(data);

    max_pop = data.features.map(d => d.properties.pop).reduce(
        (pv, cv) => pv > cv ? pv : cv
    );    

    r_scale = d3.scaleSqrt()
        .domain([0, max_pop])
        .range([1, 20]) 
    ;

    const features = data.features;

    mapa = new Mapa(features, w, h);

    mapa.draw_mapa();

}

class Mapa {

    constructor(features, w, h) {

        this.w = w;
        this.h = h;

        this.t = 0;

        this.features = features;

        this.proj = d3.geoMercator()
            .center([-55, -15])
            .scale(920)
            .translate([ w / 2, h / 2])
        ;

        //projection.fitSize([width, height], object);

        this.path = d3.geoPath().projection(this.proj).context(ctx1);
        this.pathSVG = d3.geoPath().projection(this.proj);

        this.calcula_posicoes_force_layout();
        //this.cria_interpoladores();

        ctx1.fillStyle = "#0F6E56";
        ctx1.strokeStyle = "#F7F3EB50";
        ctx1.lineWidth = 1;

    }

    draw_mapa() {

        ctx1.fillStyle = "#0F6E56";
        ctx1.strokeStyle = "#F7F3EB50";
        ctx1.lineWidth = 1;

        clear();

        const poligonos = this.features;

        poligonos.forEach(poligono => {

                /*
                if (poligono.properties.pop <= 50000) {
                    ctx1.fillStyle = "dodgerblue";
                } else if ( (poligono.properties.pop > 50000) & (poligono.properties.pop < 500000) ) {
                    ctx1.fillStyle = "steelblue"
                } else {
                    ctx1.fillStyle = "darksteelblue";
                }*/ 

                ctx1.beginPath();
                this.path(poligono);
                ctx1.fill();
                ctx1.stroke();

            }
        )

    }

    draw_mapa_svg() {

        const poligonos = this.features;

        d3.select("svg.mapa-svg")
            .selectAll("path")
            .data(poligonos)
            .join("path")
            .attr("data-tamanho", d => d.properties.pop < 50000 ? "pequeno" : d.properties.pop < 415000 ? "medio" : "grande")
            .attr("d", this.pathSVG)
            .append("title")
              .text(d => `${d.properties.name_muni} ( ${d.properties.abbrev_state} ) | ${d.properties.code_muni}`)
        ;


    }

    draw_mapa_tercos(sim = true) {

        if (sim) chart_container.dataset.mode = "tercos";
         else chart_container.dataset.mode = "";       

    }



    draw_interpolado(t = undefined) {

        if (!t) t = this.t;

        this.features.forEach(poligono => {

                /*
                if (poligono.properties.pop <= 50000) {
                    ctx1.fillStyle = "dodgerblue";
                } else if ( (poligono.properties.pop > 50000) & (poligono.properties.pop < 500000) ) {
                    ctx1.fillStyle = "steelblue"
                } else {
                    ctx1.fillStyle = "darksteelblue";
                }*/

                const pathSVG = poligono.interpolador(t);

                // gera um path2D para ser passado ao método fill

                const path2D = new Path2D(pathSVG);

                //ctx1.beginPath();
                //this.path(poligono);
                ctx1.fill(path2D);
                ctx1.stroke(path2D);

            }
        )

    }

    cria_interpoladores() {

        console.log("criando interpoladores");

        this.features.forEach(poligono => {

            const forma_original = this.pathSVG(poligono);

            poligono.interpolador = flubber.toCircle(forma_original, poligono.x, poligono.y, poligono.r);

        })

    }

    calcula_posicoes_force_layout() {

        this.features.forEach(poligono => {

            const [ xc, yc ] = this.pathSVG.centroid(poligono);

            const r = r_scale(poligono.properties.pop);

            poligono.x0 = xc;
            poligono.y0 = yc;
            poligono.r = r;
            poligono.x = xc;
            poligono.y = yc;

        })

        this.sim = d3.forceSimulation().stop();

        const strength = 0.04;

        this.sim
              .velocityDecay(0.2)
              //.force('x', d3.forceX().strength(strength).x(d => d.x0))
              //.force('y', d3.forceY().strength(strength).y(d => d.y0))
              .force('collision', d3.forceCollide().strength(strength*1.5).radius(d => d.r))
              .alphaMin(0.2)
              /* comentando para não movimentar as bolhas enquanto atualiza
              .on('tick', () => {

                d3.selectAll('circle')
                  .attr('cx', d => d.x)
                  .attr('cy', d => d.y);

              })
              */
              .on('end', () => {
                  console.log('terminou');
                  this.cria_interpoladores();
                })
              .stop()
        ;

        this.sim.nodes(this.features);

        this.sim.alpha(1).restart();

    }

}

function desenha_interpolado(t) {

    clear();
    mapa.draw_interpolado(t);

}

function desenha() {

    //console.log(mapa.t);
    clear();
    mapa.draw_interpolado();

}

// interações

liga.addEventListener("click", e => {

    const t_final = liga.textContent == "vai" ? 1 : 0;

    console.log(t_final);

    if (liga.textContent == "vai") {
        liga.textContent = "desvai";
    } else {
        liga.textContent = "vai";
    }

    gsap.to(mapa, {
        t : t_final,
        duration: 5,
        ease: "power1.inOut",
        onUpdate : desenha
    });

})

tercos.addEventListener("change", e => {

    const opcao = tercos.value;

    if (opcao == "normal") {
        mapa.draw_mapa_tercos(false);
    } else {
        mapa.draw_mapa_tercos(true);
        chart_container.dataset.mode = `tercos-${opcao}`;
    }

    
})

// helpers

function desenha_municipio_especifico(name_muni) {

    const municipio = data_.features.find(d => d.properties.name_muni == name_muni);

    const proj = d3.geoMercator().fitSize([w, h], municipio);
    const path = d3.geoPath().projection(proj).context(ctx1);

    clear();

    ctx1.fillStyle = "goldenrod";
    ctx1.strokeStyle = "black";
    ctx1.beginPath(); 
    path(municipio); 
    ctx1.fill(); 
    ctx1.stroke();

}

function distribuicao_populacional(cortes = [55000, 415000]) {

    // esse corte de 55 mil e 415 mil equilibra a população em 3 grupos de praticamente 1/3 da população cada.
    
    let i = 0;

    return data_.features.map(d => d.properties.pop).reduce( 
        (ac, cv) => { 
            let pop, ind; 

            if (i < 10) {
                console.log(cv, ac);
                i++;
            }

            if (cv > cortes[1]) ac[2] += cv; // população acima de 415 mil
            else if (cv > cortes[0]) ac[1] += cv; // população entre 55 mil e 415 mil
            else ac[0] += cv; // população abaixo de 55 mil
            return ac;
        },
        
        [0,0,0]
    )
}