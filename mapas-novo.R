library(tidyverse)
library(sf)
library(geobr)
library(geojsonsf)
library(jsonlite)
library(readxl)

# municipios - area -------------------------------------------------------

mun_area <- geobr::read_municipality(year = 2022)

saveRDS(mun_area, "mapa_mun.rds")

# cidades com problemas no Flubber ----------------------------------------
mun_probs <- c(1500909,5101704,5213103,5220702,1507805,2807600)
mun_prob <- mun_area %>% filter(code_muni == mun_probs[1]) 
ggplot(mun_prob) + geom_sf() + labs(title = paste0(mun_prob$name_muni, " (", mun_prob$abbrev_state, ") | ", mun_prob$code_muni))

# municipios com multipolygon
problematicos <- mun_area %>%
  filter(st_geometry_type(geometry) == "MULTIPOLYGON")

normais <- mun_area %>%
  filter(!code_muni %in% problematicos$code_muni)

corrigidos <- problematicos %>%
  st_cast("POLYGON", do_split = TRUE) %>%
  mutate(area = st_area(geometry)) %>%
  group_by(code_muni) %>%
  slice_max(area, n = 1, with_ties = FALSE) %>%
  ungroup() %>%
  select(-area)

mun <- bind_rows(normais, corrigidos)

mun_areas_geojson <- sf_geojson(mun, simplify = TRUE, digits = 6)
write_file(mun_areas_geojson, './experiments/municipios-brasil/areas-ajustadas.json')

ggplot() + 
  geom_sf(data = problematicos, fill = "red", color = "transparent") +
  geom_sf(data = corrigidos, fill = "green", color = "transparent")

