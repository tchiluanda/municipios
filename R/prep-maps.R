library(tidyverse)
library(sf)
library(geobr)
library(geojsonsf)
library(jsonlite)
library(readxl)

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


# municipios - area -------------------------------------------------------

mun_area <- geobr::read_municipality()

head(mun_area)


# join --------------------------------------------------------------------

# mun_data_1 <- mun %>% left_join(
#   raw_mun_perfil %>% select(code_muni = CodMun, pop = `POP EST`)
# ) %>%
#   rename(center = geom)
# 

mun_faltantes <- setdiff(mun_area$code_muni, mun$code_muni)

mun_data <- mun_area %>%
  filter(!(code_muni %in% mun_faltantes)) %>%
  left_join(
  raw_mun_perfil %>% select(code_muni = CodMun, pop = `POP EST`)
) %>%
  mutate(
    code_muni = as.character(code_muni)
         )

# mun$geom[[5565]][2]

centers <- data.frame(
  xc = rep(1, nrow(mun_data)),
  yc = rep(1, nrow(mun_data))
)


for (i in 1:nrow(mun_data)) {
  
  xc <- round(mun$geom[[i]][1],6)
  yc <- round(mun$geom[[i]][2],6)
  
  centers[i, 'xc'] <- xc
  centers[i, 'yc'] <- yc
  
}

mun_data$xc <- centers$xc
mun_data$yc <- centers$yc

library(rmapshaper)

#write_file(sf_geojson(mun_data, simplify = FALSE, digits = 6), './map_svg/areas_full.json')

# https://geocompr.robinlovelace.net/geometric-operations.html
mun_areas <- rmapshaper::ms_simplify(mun_data, keep = 0.02,
                        keep_shapes = TRUE)
#mun_areas <- st_simplify(mun_data, preserveTopology = TRUE, dTolerance = .25)

mun_plot <- mun_areas %>%
  mutate(pop_cat =  cut(pop, c(0, 55000, 430000, Inf), c('Pequeno', 'Médio', 'Grande')))


ggplot(mun_plot) + 
  geom_sf(fill = "khaki", color = 'khaki') + 
  facet_wrap(~pop_cat, labeller = as_labeller(
    c('Pequeno' = 'Aqui mora um terço do país,', 
      'Médio' = 'aqui mora outro terço,', 
      'Grande' = 'e aqui mora o terço restante.'))) + 
  theme_void() +
  theme(
    text = element_text(family = "Inter", size = 14, color = 'khaki'),
    plot.background = element_rect(fill = 'dodgerblue', color = NA),
        panel.background = element_rect(fill = 'transparent', color = NA),
        strip.background = element_rect(fill = 'transparent', color = NA),
    strip.text.x = element_text(face = 'bold', color = "white", margin = margin(t= 2, r = 0, b = 2, l = 0, unit  = "pt"))
  )

ggplot(mun_areas %>% filter(name_muni%in%c("Borborema", "João Pessoa"), abbrev_state=="PB")) + 
  geom_sf(color = "firebrick", fill = 'khaki')

ggsave('mapa-tercos.png', plot=last_plot(), width = 12.9, height = 4)

mun_plot%>%as.data.frame()%>%group_by(pop_cat)%>%summarise(pop = sum(pop))
mun_plot%>%as.data.frame()%>%count(pop_cat)

mun_areas_geojson <- sf_geojson(mun_areas, simplify = TRUE, digits = 6)

write_file(mun_areas_geojson, './map_svg/areas.json')


