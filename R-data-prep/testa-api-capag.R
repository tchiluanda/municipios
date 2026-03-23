library(tidyverse)
library(httr2)
library(jsonlite)

url <- "https://apiapex.tesouro.gov.br/aria/v1/previa-fiscal-hom/custom/capag_"

pega_capag <- function(cod_ibge, ano = "2026", tipo = "municipio") {
  tryCatch(
    {
      resp <- request(paste0(url, tipo)) |>
        req_url_query(
          codigoIbge = cod_ibge,
          ano = ano
        ) |>
        req_perform()
      
      data <- resp |>
        resp_body_json(simplifyVector = TRUE)
      
      data$codigoIbge <- cod_ibge
      
      print(paste0(url, tipo, "?codigoIbge=", cod_ibge, "&ano=", ano, " | ", "CAPAG: ", data$registros$capag) )
      
      #return(data)
      
    }, error = function(e) {
      message("Erro no código: ", cod_ibge)
      return(NULL)
    }
  )
}

data <- pega_capag_municipio("2200053")

codes_munis <- geo_mun %>% filter(code_state == "41") %>% select(code_muni) %>% pull(code_muni) %>% sample(10)

resultados <- map(codes_munis, pega_capag_municipio)

codes_ufs <- geo_mun %>% pull(code_state) %>% unique()

resultados <- map(codes_ufs, pega_capag, tipo = "uf", ano = "2024")

for (uf in resultados) {print(paste(uf$codigoIbge, uf$registros$capag))}

pega_capag("12", "uf", "2023")
pega_capag("12", "uf", "2024")
pega_capag("41", "uf", "2023")
pega_capag("41", "uf", "2024")

grid_argumentos <- expand_grid(cod_ibge = c("11", "12"), ano = c("2023", "2024"))

purrr::pmap(grid_argumentos, pega_capag, tipo = "uf")

