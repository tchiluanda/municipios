// o force layout só precisa ser calculado para os centroides. e aí podemos ir atualizando os xc? ver como faria para sincronizar

const cv1 = document.querySelector(".mapa-principal");
const ctx1 = cv1.getContext("2d");

const w = +window.getComputedStyle(cv1).width.slice(0,-2);
const h = +window.getComputedStyle(cv1).height.slice(0,-2);

function clear() {
    ctx1.clearRect(0, 0, w, h);
}

let mapa, max_pop, r_scale;

console.log(cv1, w,h);

cv1.setAttribute("width", w);
cv1.setAttribute("height", h);

fetch("areas.json")
    .then(response => response.json())
    .then(data => {

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

    gsap.to(mapa, {
        t : 1,
        duration: 3,
        ease: "power1.inOut",
        onUpdate : desenha
    });




}

class Mapa {

    constructor(features, w, h) {

        this.w = w;
        this.h = h;

        this.t = 0;

        this.features = features;

        this.proj = d3.geoMercator()
            .center([-55, -15])
            .scale(950)
            .translate([ w / 2, h / 2])
        ;

        this.path = d3.geoPath().projection(this.proj).context(ctx1);
        this.pathSVG = d3.geoPath().projection(this.proj);

        this.cria_interpoladores();

        ctx1.fillStyle = "#0F6E56";
        ctx1.strokeStyle = "#F7F3EB";
        ctx1.lineWidth = 0.3;

    }

    draw_mapa(poligonos) {

        console.log(poligonos); 

        poligonos.forEach(poligono => {

                if (poligono.properties.abbrev_state == "PR") {
                    ctx1.fillStyle = "dodgerblue";
                } else {
                    ctx1.fillStyle = "#0F6E56";
                }

                ctx1.beginPath();
                this.path(poligono);
                ctx1.fill();
                ctx1.stroke();

            }
        )

    }

    draw_interpolado(t = undefined) {

        if (!t) t = this.t;

        this.features.forEach(poligono => {

                /*
                if (poligono.properties.abbrev_state == "PR") {
                    ctx1.fillStyle = "dodgerblue";
                } else {
                    ctx1.fillStyle = "#0F6E56";
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

        this.features.forEach(poligono => {

            const [ xc, yc ] = this.pathSVG.centroid(poligono);
            // const {xc, yc} = poligono.properties;
            const r = r_scale(poligono.properties.pop);

            const forma_original = this.pathSVG(poligono);

            poligono.interpolador = flubber.toCircle(forma_original, xc, yc, r);

        })

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

