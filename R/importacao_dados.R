library(tidyverse)
library(readxl)
library(ggbeeswarm)

# Perfil dos municípios ---------------------------------------------------

arq_zip <- "./data/raw_data/IBGE_perfil_mun_2017_xls.zip"
arq <- unzip(list = TRUE, zipfile = arq_zip)["Name"][1,]
unzip(arq_zip)

raw_mun_perfil <- read_excel(arq, sheet = "Variáveis externas")

file.remove(arq)


# PIB dos Municípios ------------------------------------------------------

arq_zip <- "./data/raw_data/base_de_dados_2010_2016_xls.zip"
arq <- unzip(list = TRUE, zipfile = arq_zip)["Name"][1,]
unzip(arq_zip)

raw_mun_pib    <- read_excel(arq,
                             col_types = c("numeric",
                                           rep("text",32),
                                           rep("numeric", 9),
                                           rep("text", 3)),
                             col_names = c("Ano", 
                                           "CD_Regiao",
                                           "NM_Regiao",
                                           "CD_UF",
                                           "SG_UF",
                                           "NM_UF",
                                           "CD_Mun",
                                           "NM_Mun",
                                           "Reg_Met",
                                           "CD_MesoRegiao",
                                           "NM_MesoRegiao",
                                           "CD_MicroRegiao",
                                           "NM_MicroRegiao",
                                           "CD_RegRural",
                                           "NM_RegRural",
                                           "TP_RegRural",
                                           "CD_RegGeoImed",
                                           "NM_RegGeoImed",
                                           "Mun_RegGeoImed",
                                           "CD_RegGeoIntermed",
                                           "NM_RegGeoIntermed",
                                           "Mun_RegGeoIntermed",
                                           "AmazoniaLeal",
                                           "Semiarido",
                                           "CD_ConUrb",
                                           "NM_ConUrb",
                                           "TP_ConUrb",
                                           "CD_ArranjoPop",
                                           "NM_ArranjoPop",
                                           "TipologiaRuralUrbana",
                                           "HierarqUrbana",
                                           "HierarqUrbana_PrincCat",
                                           "Cid-Reg_SP",
                                           "PIB_Agropec",
                                           "PIB_Industria",
                                           "PIB_Servicos",
                                           "PIB_Adm",
                                           "Vlr_Bruto_Tot",
                                           "Impostos",
                                           "PIB",
                                           "Pop",
                                           "PIBpc",
                                           "Atividade1",
                                           "Atividade2",
                                           "Atividade3")
) %>%
  filter(Ano == "2016")

file.remove(arq)


# Áreas dos Municípios ----------------------------------------------------


raw_mun_areas  <- read_excel("./data/raw_data/AR_BR_RG_UF_MES_MIC_MUN_2018.xls", sheet = "AR_BR_MUN_2018")


# Arrecadação Federal -----------------------------------------------------

raw_mun_arrec_fed <- read_excel("./data/raw_data/arrecadacao-da-receita-administrada-pela-rfb-por-municipio-2018.xlsx", sheet = "TOTAL", skip = 5)


# Siconfi -----------------------------------------------------------------

desp_pessoal <- read.csv2("./data/raw_data/dtp-mun-2023-sem.csv", skip = 5, fileEncoding = "Latin1")2.

# Explorações -----------------------------------------------------------

ggplot(raw_mun_perfil) + geom_beeswarm(aes(x = `POP EST`, y = 0), groupOnX = FALSE)




# Exportação --------------------------------------------------------------

exp <- raw_mun_perfil %>% select(REGIAO, NOME = `NOME MUNIC`, POP = `POP EST`)

jsonlite::write_json(exp, './story/data.json')

exp %>% filter(POP <= 60000) %>% nrow() / nrow(exp)



