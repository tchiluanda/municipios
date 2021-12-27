const v = {

    refs : {

        canvas : 'canvas.main-canvas',
        canvas_container : 'div.main-canvas-container'

    },

    sizings : {

        w  : null,
        h : null,
        margin: 20,

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

        file : 'data.json',

        raw : null,

        read : () => {

            fetch(v.data.file)
            .then(response => { 
                
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              //console.log(response.status);
              return response.json()

            })
            .then(data => {

                v.ctrl.data_is_loaded(data);

            })

        }

    },

    ctrl : {

        data_is_loaded : (data) => {

            console.table(data.filter( (d,i) => i < 30 ));

        }

    },

    init : () => {

        v.sizings.get();
        v.sizings.set();
        v.data.read();
        // daqui pula para v.ctrl.data_is_loaded

    }


}

v.init();