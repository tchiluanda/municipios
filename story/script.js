const v = {

    refs : {

        canvas : 'canvas.main-canvas',
        canvas_container : 'div.main-canvas-container'

    },

    sizings : {

        w  : null,
        h : null,

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

    init : () => {

        v.sizings.get();
        v.sizings.set();


    }


}

v.init();