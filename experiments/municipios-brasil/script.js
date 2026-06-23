const cv1 = document.querySelector(".mapa-principal");
const ctx1 = cv1.getContext("2d");

const w = +window.getComputedStyle(cv1).width.slice(0,-2);
const h = +window.getComputedStyle(cv1).height.slice(0,-2);

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

    const features = data.features;

    const mapa = new Mapa(features, w, h);


}

class Mapa {

    constructor(features, w, h) {

        this.w = w;
        this.h = h;

        this.features = features;

        this.proj = d3.geoMercator()
            .center([-55, -15])
            .scale(950)
            .translate([ w / 2, h / 2])
        ;

        this.path = d3.geoPath().projection(this.proj).context(ctx1);
        this.pathSVG = d3.geoPath().projection(this.proj);

        ctx1.fillStyle = "#0F6E56";
        ctx1.strokeStyle = "#F7F3EB";
        ctx1.lineWidth = 0.3;

        this.draw(features);

    }

    draw(poligonos) {

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




}