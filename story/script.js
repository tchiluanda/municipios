const v = {

    refs : {

        canvas : 'canvas.main-canvas',
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

            const {w, h} = v.sizings;

            const ref_canvas = v.refs.canvas;
            const canvas = document.querySelector(ref_canvas);

            canvas.width = w;
            canvas.height = h;

        }

    },

    data : {

        files : ['data.json', 'estados.json'],

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
                    fetch(v.data.files[0]).then(response => response.json()),
                    fetch(v.data.files[1]).then(response => response.json())
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
              .on('tick', v.vis.render)
              //.on('end', v.vis.render)
              //.stop()
            ;

            v.sim.simulation.nodes(v.data.nodes);

        },

        start : () => v.sim.simulation.alpha(1).restart()


    },

    vis : {
        
        ctx : null,

        set_context : () => {

            const cv = document.querySelector(v.refs.canvas);
            v.vis.ctx= cv.getContext('2d');
        },

        render : () => {

            const ctx = v.vis.ctx;

            const { w , h , margin } = v.sizings;

            ctx.clearRect(0, 0, w, h);

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
                ctx.stroke();
                ctx.closePath();

            })

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


    },

    ctrl : {

        data_is_loaded : (data) => {

            //console.table(data.filter( (d,i) => i < 30 ));

            v.data.raw.mun = data[0];
            v.data.raw.map = data[1];
            v.data.nodes = data[0].features.map(d => d.properties);
            v.data.info.get();
            v.scales.set();
            v.sim.set();
            v.sim.start();
            //v.vis.render();

        }

    },

    init : () => {

        v.sizings.get();
        v.sizings.set();
        v.vis.set_context();
        v.data.read();
        // daqui pula para v.ctrl.data_is_loaded

    }


}

v.init();