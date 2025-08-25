/* 
  LIMPAR ESTE CÓDIGO! 

1. Calcula a projeção
2. Atribui os valores das posições dos centros dos municípios ("administrative seats", segundo o GeoBR) às variáveis x, x0, y, y0, que serão usadas pela simulação. Já calcula o r também.
2. Cria a simulação, considerando um raio, com forceCollide. Roda a simulação (posições finais agora serão d.x, d.y)
2. Sempre lembrar: MARCAS VISUAIS <----> DADO <----> SIMULACAO
3. Se quiser visualizar o mapa de bolhas, pode usar o map.render_bubble (para ver as posicoes originais, cx: d.x0, cy: d.y0; para as finais, d.x, d.y -- dá para fazer transições simples entre elas também (com a simulação finalizada))
4. Renderiza o mapa com polígonos.
5. Usa flubber para transformar poligonos em círculos, usando como centro d.x, d.y.
6. Usa flubber para transformar ciculos em poligonos.

*/




const v = {

    refs : {

        canvas : '.main-canvas',
        canvas_container : 'div.main-canvas-container'

    },

    sizings : {

        w  : null,
        h : null,
        margin: 80,

        get : () => {
    
            const ref_container = v.refs.canvas_container;

            const el = document.querySelector(ref_container);

            v.sizings.w = +window.getComputedStyle(el).width.slice(0,-2);
            v.sizings.h = +window.getComputedStyle(el).height.slice(0,-2);

        },

        set : () => {

            //const {w, h} = v.sizings;

            const ref_canvas = v.refs.canvas;
            const canvas = document.querySelector(ref_canvas);

            canvas.style.width = '800px';
            canvas.style.height = '800px';

            v.sizings.w = 800;
            v.sizings.h = 800;

        }

    },

    data : {

        files : ['areas.json'],

        raw : {

            mun : null,
            map : null,

        },

        nodes : null,

        info : {

            max_pop : null,
            min_pop : null,

            get : () => {

                const data = v.data.nodes.map(d => d.pop);

                v.data.info.max_pop = Math.max(...data);
                v.data.info.min_pop = Math.min(...data);

            }

        },

        read : () => {

            Promise.all(
                [
                    fetch(v.data.files[0]).then(response => response.json())
                ]
            )
            .then(data => {

                v.ctrl.data_is_loaded(data);

            })

        }

    },

    scales : {

        /*x : (pop) => {

            const {w, h, margin} = v.sizings;

            const max = v.data.info.max_pop;

            return margin + (w - 2*margin) * (pop / max);



        }*/

        x : d3.scaleLog(),
        
        set : () => {

            const {w, h, margin} = v.sizings;

            const max = v.data.info.max_pop;
            const min = v.data.info.min_pop;

            v.scales.x
              .range([margin, w - margin])
              .domain([min, max])

        }


    },

    sim : {

        simulation : d3.forceSimulation().stop(),

        set : () => {

            const strength = 0.04;
            //const x = v.scales.x;
            //const y0 = v.sizings.h/2

            v.data.nodes = v.data.raw.map;//.features;
            let proj = v.map.proj();

            const max_pop = d3.max(v.data.nodes, d => d.properties.pop);

            const r = d3.scaleSqrt()
              .domain([0, max_pop])
              .range([1, 20]) 
            ;

            v.data.nodes.forEach(d => {

                d.x0 = proj([d.properties.xc, d.properties.yc])[0];
                d.x  = proj([d.properties.xc, d.properties.yc])[0];
                d.y0 = proj([d.properties.xc, d.properties.yc])[1];
                d.y  = proj([d.properties.xc, d.properties.yc])[1];
                d.r = r(d.properties.pop);

            })

            v.sim.simulation
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
                  v.beeswarm.scale.set();
                })
              .stop()
            ;

            v.sim.simulation.nodes(v.data.nodes);

        },

        start : () => v.sim.simulation.alpha(1).restart()

        /* dá para finalizar a simulação e mover as bolhas assim:
        d3.selectAll('circle').transition().duration(2000).attr('cx', d => d.x0).attr('cy', d => d.y0);

        d3.selectAll('circle').transition().duration(2000).attr('cx', d => d.x).attr('cy', d => d.y);

        aí tira o 'on('tick')



        */


    },

    map : {

        paths : null,

        proj : () => {

            let h = v.sizings.h;
            let w = v.sizings.w;
            
            return d3.geoMercator()
              .center([-55, -15])
              //.rotate([10, 0])
              .scale(650)
              .translate([w / 2, h / 2])

        },

        /*

        calcula_paths : () => {
    
            let data = v.data.raw.map;

            let feats = data.features;

            let proj = v.map.proj();

            const paths = feats.map(estado => d3.geoPath().projection(proj)(estado));
            v.map.paths = paths;

        },*/

        render_map : () => {

            const svg = d3.select('svg');

            const data = v.data.nodes;//.features;

            let proj = v.map.proj();

            const path = d3.geoPath().projection(proj);

            svg.append("g")
              .selectAll("path")
              .data(data)
              .join("path")
                .attr('data-nome', d => d.properties.name_muni)
                .attr('data-uf', d => d.properties.abbrev_state)
                .attr("stroke", "white")
                .attr('stroke-width',  .5)
                .attr('fill', 'hotpink')
                .attr("d", path)
              .append("title")
                .text(d => d.properties.name_muni)
            ;

        },

        render_bubbles : () => {

            const svg = d3.select('svg');

            const data = v.data.nodes;//v.data.raw.map.features;
            let proj = v.map.proj();

            const path = d3.geoPath().projection(proj);

            const max_pop = d3.max(data, d => d.properties.pop);

            const r = d3.scaleSqrt()
              .domain([0, max_pop])
              .range([1, 20]) 
            ;
            
            // render map

            svg.append("g")
              .selectAll("circle")
              .data(data)
              .join("circle")
                .attr("fill", 'grey')  
                .attr("cx", d => proj([d.properties.xc, d.properties.yc])[0])
                .attr("cy", d => proj([d.properties.xc, d.properties.yc])[1])
                .attr("r", d => r(d.properties.pop))
                .style("stroke", "white")
            ;
          


        },

        change_to_circle : () => {

            const svg = d3.select('svg');

            const data = v.data.raw.map;//.features;

            let proj = v.map.proj();

            const path = d3.geoPath().projection(proj);

            const max_pop = d3.max(data, d => d.properties.pop);

            const r = d3.scaleSqrt()
              .domain([0, max_pop])
              .range([1, 20]) 
            ;

            svg.selectAll("path")
            .transition()
            //.delay((d,i) => (i % 100) * 100)
            .duration(5000)
            .attrTween('d', function(d, i) {
              return flubber.toCircle(path(d), d.x, d.y, d.r, {maxSegmentLength: 2});
            })

            /*

            svg.selectAll("path")
                .transition()
                .duration(5000)
                .attrTween('d', function(d, i) {
                return flubber.fromCircle(d.x, d.y, d.properties.radius, path(d), {maxSegmentLength: 2});
            })*/


        },

        change_from_circle : () => {

            const svg = d3.select('svg');

            const data = v.data.raw.map;//.features;

            let proj = v.map.proj();

            const path = d3.geoPath().projection(proj);

            const max_pop = d3.max(data, d => d.properties.pop);

            const r = d3.scaleSqrt()
              .domain([0, max_pop])
              .range([1, 20]) 
            ;

            svg.selectAll("path")
            .transition()
            //.delay((d,i) => (i % 100) * 100)
            .duration(5000)
            .attrTween('d', function(d, i) {
              return flubber.fromCircle(d.x, d.y, d.r, path(d), {maxSegmentLength: 2});
            })

            /*

            svg.selectAll("path")
                .transition()
                .duration(5000)
                .attrTween('d', function(d, i) {
                return flubber.fromCircle(d.x, d.y, d.properties.radius, path(d), {maxSegmentLength: 2});
            })*/


        },

        calcula_posicoes_mun : () => {

            let data = v.data.raw.mun;

            let feats = data.features;

            let proj = v.map.proj();

            v.data.nodes.forEach( (d,i) => {

                d.x0 = proj(feats[i].geometry.coordinates)[0];
                d.x  = proj(feats[i].geometry.coordinates)[0];
                d.y0 = proj(feats[i].geometry.coordinates)[1];
                d.y  = proj(feats[i].geometry.coordinates)[1];

            }) 

        }

    },

    beeswarm : {

        scale : {

            x : d3.scaleLinear(),

            y : null,

            set : () => {

                const data = v.data.nodes;//v.data.raw.map.features;

                const max_pop = d3.max(data, d => d.properties.pop);
    
                v.beeswarm.scale.x.domain([0, max_pop]);

                const svg = d3.select('svg');
                
                const h = + svg.style('height').slice(0,-2);
                const w = + svg.style('width').slice(0,-2);

                v.beeswarm.scale.y = h/2;
                v.beeswarm.scale.x.range([40, w-40]);

            }

        },

        render : () => {

            const strength = 0.04;

            const xs = v.beeswarm.scale.x;
            const ys = v.beeswarm.scale.y;

            v.sim.simulation
              .force('x', d3.forceX().strength(strength).x(d => xs(d.properties.pop) ))
              .force('y', d3.forceY().strength(strength).y(ys/2))
              .on('tick', () => {

                d3.selectAll('path')
                  .attr('transform', d => `translate(${d.x,d.y})`);

              })
              .alpha(1).restart()
            ;


        }


    },

    interactions : {

        botoes_modo : {

            ref : '.btns-mode',

            monitora : () => {

                const btns = document.querySelectorAll(v.interactions.botoes_modo.ref);

                btns.forEach(btn => btn.addEventListener('click', v.interactions.botoes_modo.atua));

            },

            atua : (e) => {

                const id = e.target.id;
                console.log(id);

                if (id == "btn-mapa") {
                    v.ctrl.state = 'map';
                    v.map.change_from_circle();
                }

                if (id == "btn-bubble") {
                    v.ctrl.state = 'bubble';
                    v.map.change_to_circle();
                }

                //v.sim.set();
                //v.sim.start();

            }

        }

    },

    ctrl : {

        state : 'map',

        data_is_loaded : (data) => {

            //console.table(data.filter( (d,i) => i < 30 ));

            v.data.raw.map = data[0].features.slice(0,1500);

            //v.data.raw.map = data[0].features;


            //v.data.raw.map = data[1];
            //v.data.nodes = data[0].features.map(d => d.properties);
            //v.data.info.get();
            //v.scales.set();

            v.sim.set();
            v.sim.start();


            //v.map.calcula_paths();
            //v.map.calcula_posicoes_mun();


            v.map.render_map();
            //v.map.render_bubbles();

            //v.interactions.botoes_modo.monitora();

        }

    },

    init : () => {

        v.sizings.get();
        v.sizings.set();
        //v.vis.set_context();
        v.data.read();
        v.interactions.botoes_modo.monitora();
        // daqui pula para v.ctrl.data_is_loaded

    }


}

v.init();