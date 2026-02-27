const data = [
  { "label": "Impostos", "value": 285517723132.57 },
  { "label": "Contribuições para a previdência", "value": 68074743012.39 },
  { "label": "IPTU", "value": 72588817524.29 },
  { "label": "ITBI", "value": 24345527516.50 },
  { "label": "ISS", "value": 138398209419.91 },
  { "label": "Taxa Limpeza Pública", "value": 3673958595.52 },
  { "label": "Contribuição Iluminação Pública", "value": 15741269354.34 },
  { "label": "Exploração de Recursos Naturais", "value": 2042793265.69 },
  { "label": "FPM", "value": 175163105753.85 },
  { "label": "Pessoal", "value": 589671708216.08 , "tipo" : "despesa" },
  { "label": "Aposentadorias e Pensões", "value": 88362842140.13 , "tipo" : "despesa"},
  { "label": "Investimentos", "value": 124606080089.33 , "tipo" : "despesa"},
  { "label": "Royalties", "value": 33641637452.78 },
  { "label": "Transferências do SUS", "value": 126195273528.44 },
  { "label": "Transferências da Educação", "value": 57680115917.67 },
  { "label": "Cota do ICMS", "value": 155671596758.87 },
  { "label": "Cota do IPVA", "value": 33988585250.42 },
  { "label": "Despesas Correntes", "value": 1159633120073.65 , "tipo" : "despesa"},
  { "label": "Despesas (exceto Dívida)", "value": 1273645348280.49 , "tipo" : "despesa"}
]

class Chart {

    html_ref;
    margin = 10;

    constructor(ref, infos) {

        this.ref = ref;
        this.html_ref = document.querySelector(ref);

        this.chart = this.html_ref.querySelector(".mini-chart");
        this.chart_containerd3 = d3.select(this.ref).select(".container-mini-chart");

        this.infos = infos;

        this.get_sizes();

        this.make_scales();

        this.build_chart();

    }

    get_sizes() {
        
        this.chartd3 = d3.select(this.ref).select(".mini-chart");
        this.w = +this.chartd3.style("width").slice(0,-2);
        this.h = +this.chartd3.style("height").slice(0,-2);
        
    }

    make_scales() {

        const maxValue = d3.max(this.infos, d => d.value);
        const keys = this.infos.map(d => d.label);
        console.log(maxValue, keys);

        this.w_scale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([this.margin, this.w - 2 * this.margin]);

        this.y_scale = d3.scaleBand()
            .domain(keys)
            .range([this.margin * 3, this.h - this.margin]);

    }


    build_chart() {

        this.chartd3.selectAll("rect").data(this.infos).join("rect")
            .attr("x", this.margin)
            .attr("y", d => this.y_scale(d.label))
            .attr("width", d => this.w_scale(d.value))
            .attr("height", this.y_scale.bandwidth() / 2)
        ;

        this.chart_containerd3.selectAll("p").data(this.infos).join("p")
            .classed("label", true)
            .style("left", this.margin + "px")
            .style("top", d => this.y_scale(d.label) + "px")
            .text(d => d.label + ": R$ " + (d.value/1e9).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " bilhões")
        ;

    }

}

const c1 = new Chart("[data-chart-name='impostos']", 
    [{ "label": "IPTU", "value": 72588817524.29 },
  { "label": "ITBI", "value": 24345527516.50 },
  { "label": "ISS", "value": 138398209419.91 }]);

const c2 = new Chart("[data-chart-name='impostos x pessoal']", 
    [
        { "label": "Impostos", "value": 285517723132.57 },
        { "label": "Pessoal", "value": 589671708216.08 }
    ]);