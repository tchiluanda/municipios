Atribuição:

<a href="https://www.flaticon.com/free-icons/urban" title="urban icons">Urban icons created by Freepik - Flaticon</a>
<a href="https://www.flaticon.com/free-icons/town" title="town icons">Town icons created by Freepik - Flaticon</a>

Alguns polígonos somem, depois da primeira transição. Incluí um overlay svg para identificar. 

Mineiros, GO, 
Barra Dos Bugres MT,
por exemplo.

mapa.features.filter(d => d.properties.name_muni == "Mineiros")

mapa.features.map(d => d.properties.name_muni).indexOf("Mineiros")
> 5461

let a = mapa.features.filter(d => d.properties.name_muni == "Mineiros")[0]
