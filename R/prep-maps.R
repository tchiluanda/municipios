library(tidyverse)
library(sf)
library(geobr)
library(geojsonsf)
library(jsonlite)

estados <- geobr::read_state()
saveRDS(estados, 'estados.rds')

estados_simp <- st_simplify(estados, dTolerance = 0.1)

ggplot(estados_simp) + geom_sf()

write_file(
  sf_geojson(estados_simp, simplify = TRUE, digits = 6),
  './story/estados.json')


# municipios --------------------------------------------------------------

mun <- geobr::read_municipal_seat()

arq_zip <- "./data/raw_data/IBGE_perfil_mun_2017_xls.zip"
arq <- unzip(list = TRUE, zipfile = arq_zip)["Name"][1,]
unzip(arq_zip)

raw_mun_perfil <- read_excel(arq, sheet = "Variáveis externas")

file.remove(arq)

mun_data <- mun %>% left_join(
  raw_mun_perfil %>% select(code_muni = CodMun, pop = `POP EST`)
)

data <- sf_geojson(mun_data, simplify = TRUE, digits = 6)

write_file(data, './story/data.json')
