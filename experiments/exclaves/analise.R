library(tidyverse)
library(geobr)
library(sf)

mun <- geobr::read_municipality(year = 2025)

municipios_exclaves <- mun |>
  mutate(
    n_poligonos = lengths(st_geometry(geometry))
  ) |>
  filter(n_poligonos > 1)

c(5213103,3300100,5220702)

mun_emblematicos <- c(
  1507805,
  5220702,
  5213103,
  5101704,
  5313103,
  2800407,
  2302107
)

tab_mun_emblematicos <- mun %>% filter(code_muni %in% mun_emblematicos) %>% select(code_muni, name_muni, abbrev_state) %>% sf::st_drop_geometry()



ggplot(mun %>% filter(code_muni %in% mun_emblematicos)) + geom_sf() + facet_wrap(~ name_muni)

plot <- function(i) {
  muni_code <- tab_mun_emblematicos$code_muni[i]
  muni_name <- tab_mun_emblematicos$name_muni[i]
  uf <- tab_mun_emblematicos$abbrev_state[i]
  
  ggplot(mun %>% filter(code_muni == muni_code)) + 
    geom_sf() + 
    labs(title = paste0(muni_name, ", ", uf, " (", muni_code, ")"))
  }

plot(5)

# Situação bem interessante
mun %>% filter(name_muni %in% c("Umbaúba", "Santa Luzia do Itanhy", "Arauá")) %>%
  ggplot() + geom_sf(aes(fill = name_muni)) + labs(fill = "Município")





ggplot(mun %>% filter(code_muni == 5213103)) + geom_sf() + geom_sf_text(aes(label=name_muni))

municipios_exclaves %>% 
  #filter(str_detect(name_muni, "Itamaracá")) %>% 
  ggplot() + geom_sf()


mun_maior <- mun %>%
  mutate(id_tmp = row_number()) %>%
  st_cast("POLYGON") %>%
  mutate(area = st_area(geometry)) %>%
  group_by(id_tmp) %>%
  slice_max(area, n = 1, with_ties = FALSE) %>%
  ungroup() %>%
  select(-id_tmp, -area)

municipios_exclaves2 <- mun_maior |>
  mutate(
    n_poligonos = lengths(st_geometry(geometry))
  ) |>
  filter(n_poligonos > 1)

ggplot(municipios_exclaves2) + geom_sf()

ggplot() +
  geom_sf(data = mun_maior, fill = "gray", color = "black") +
  geom_sf(data = municipios_exclaves, color = "pink", fill = "transparent")

