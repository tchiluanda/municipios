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
            const x = v.scales.x;
            const y0 = v.sizings.h/2

            v.sim.simulation
              .velocityDecay(0.2)
              .force('x', d3.forceX().strength(strength).x(d => x(d.pop)))
              .force('y', d3.forceY().strength(strength).y(y0))
              .force('collision', d3.forceCollide().radius(2))
              //.alphaMin(0.25)
              //.on('tick', v.vis.render)
              .on('end', () => {
                  v.data.nodes.forEach(d => {
                      d.xf = d.x;
                      d.yf = d.y;
                  })

                  console.log('terminei.');

              })
              //.stop()
            ;

            v.sim.simulation.nodes(v.data.nodes);

        },

        start : () => v.sim.simulation.alpha(1).restart()


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

        calcula_paths : () => {
    
            let data = v.data.raw.map;

            let feats = data.features;

            let proj = v.map.proj();

            const paths = feats.map(estado => d3.geoPath().projection(proj)(estado));
            v.map.paths = paths;

        },

        render_map : () => {

            const svg = d3.select('svg');

            const data = v.data.raw.map.features;

            let proj = v.map.proj();

            const path = d3.geoPath().projection(proj);

            svg.append("g")
              .selectAll("path")
              .data(data)
              .join("path")
                .attr('data-id', d => d.properties.name_muni)
                .attr("stroke", "transparent")
                .attr('fill', function(d) {
                    if (d.properties.name_muni == 'Borborema') return 'transparent'
                    else {
                        if (d.properties.pop >= 500000) return 'firebrick'
                        else {
                            if (d.properties.pop >= 50000) return 'darkgreen';
                            else return 'khaki'
                        }
                    }
                })
                .attr("d", path)
              .append("title")
                .text(d => d.properties.name_muni)
            ;

        },

        render_bubbles : () => {

            const svg = d3.select('svg');

            const data = v.data.raw.map.features;
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

            const data = v.data.raw.map.features;

            let proj = v.map.proj();

            const path = d3.geoPath().projection(proj);

            const max_pop = d3.max(data, d => d.properties.pop);

            const r = d3.scaleSqrt()
              .domain([0, max_pop])
              .range([1, 20]) 
            ;

            svg.selectAll("path")
            .transition()
            .delay((d,i) => (i % 100) * 100)
            .duration(5000)
            .attrTween('d', function(d, i) {
              return flubber.toCircle(path(d), proj([d.properties.xc, d.properties.yc])[0], proj([d.properties.xc, d.properties.yc])[1], r(d.properties.pop), {maxSegmentLength: 2});
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

        },

        render_mun : () => {

            const ctx = v.vis.ctx;

            const { w , h , margin } = v.sizings;

            ctx.clearRect(0, 0, w, h);
            v.map.render_map();

            const colors = [
                "#C7A76C", "#99B56B", "#5CBD92", "#3BBCBF", "#7DB0DD"
            ]

            const points = v.data.nodes;

            points.forEach( (municipio, i) => {

                const { x, y, code_region } = municipio;

                const color_index = +code_region - 1;

                ctx.fillStyle = colors[color_index]//"coral";
                ctx.lineStyle = 'grey';
                ctx.globalAlpha = 1;

                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI*2, true);
                ctx.fill();
                ctx.globalAlpha = .5;
                //ctx.stroke();
                ctx.closePath();

            })


        }


    },

    vis : {
        
        ctx : null,

        set_context : () => {

            const cv = document.querySelector(v.refs.canvas);
            v.vis.ctx= cv.getContext('2d');
        },

        render : () => {

            const modo = v.ctrl.state;
            console.log(modo);

            const ctx = v.vis.ctx;

            const { w , h , margin } = v.sizings;

            ctx.clearRect(0, 0, w, h);

            if (modo == 'map') v.map.render_map();

            const colors = [
                "#C7A76C", "#99B56B", "#5CBD92", "#3BBCBF", "#7DB0DD"
            ]

            const points = v.data.nodes;

            points.forEach( (municipio, i) => {

                const { x, y, code_region } = municipio;

                const color_index = +code_region - 1;

                ctx.fillStyle = colors[color_index]//"coral";
                ctx.lineStyle = 'grey';
                ctx.globalAlpha = 1;

                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI*2, true);
                ctx.fill();
                ctx.globalAlpha = .5;
                //ctx.stroke();
                ctx.closePath();

            })

            if (modo == 'bee') {

                ctx.globalAlpha = 1;

                ctx.beginPath();       // Start a new path
                ctx.moveTo(v.scales.x(5000), margin);    // Move the pen to (30, 50)
                ctx.lineTo(v.scales.x(5000), h - margin);  // Draw a line to (150, 100)
                ctx.stroke(); 
    
                ctx.beginPath();       // Start a new path
                ctx.moveTo(v.scales.x(50000), margin);    // Move the pen to (30, 50)
                ctx.lineTo(v.scales.x(50000), h - margin);  // Draw a line to (150, 100)
                ctx.stroke(); 
    
                ctx.beginPath();       // Start a new path
                ctx.moveTo(v.scales.x(500000), margin);    // Move the pen to (30, 50)
                ctx.lineTo(v.scales.x(500000), h - margin);  // Draw a line to (150, 100)
                ctx.stroke(); 
    
                ctx.beginPath();       // Start a new path
                ctx.moveTo(v.scales.x(5000000), margin);    // Move the pen to (30, 50)
                ctx.lineTo(v.scales.x(5000000), h - margin);  // Draw a line to (150, 100)
                ctx.stroke(); 

            }



        }


    },

    anim : {

        get_future_value : (i, target, param ) => target[param],

        to_map : () => gsap.to(
            v.data.nodes,
            {
                x : (i, target) => v.anim.get_future_value(i, target, 'x0'),
                y : (i, target) => v.anim.get_future_value(i, target, 'y0'),
                onUpdate : v.vis.render

            }

        ),

        to_beeswarm : () => gsap.to(
            v.data.nodes,
            {
                x : (i, target) => v.anim.get_future_value(i, target, 'xf'),
                y : (i, target) => v.anim.get_future_value(i, target, 'yf'),
                onUpdate : v.vis.render

            }

        )

    },

    interactions : {

        botoes_modo : {

            ref : '.btns-mode',

            monitora : () => {

                const btns = document.querySelectorAll(v.interactions.botoes_modo.ref);

                btns.forEach(btn => btn.addEventListener('click', v.interactions.botoes_modo.atua));

            },

            atua : (e) => {

                const id = e.target.id

                if (id == "btn-mapa") {
                    v.ctrl.state = 'map';
                    v.anim.to_map();
                }

                if (id == "btn-beeswarm") {
                    v.ctrl.state = 'bee';
                    v.anim.to_beeswarm();
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

            v.data.raw.map = data[0];
            //v.data.raw.map = data[1];
            //v.data.nodes = data[0].features.map(d => d.properties);
            //v.data.info.get();
            //v.scales.set();

            //v.sim.set();
            //v.sim.start();

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
        // daqui pula para v.ctrl.data_is_loaded

    }


}

v.init();