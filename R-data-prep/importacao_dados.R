library(tidyverse)
library(readxl)
library(ggbeeswarm)

# Perfil dos municípios ---------------------------------------------------

# arq_zip <- "./data/raw_data/IBGE_perfil_mun_2017_xls.zip"
# arq <- unzip(list = TRUE, zipfile = arq_zip)["Name"][1,]
# unzip(arq_zip)

arq <- "./data/raw_data/perfil-mun-2021.xlsx"

raw_mun_perfil <- read_excel(arq, sheet = "Variáveis externas")

#file.remove(arq)


# PIB dos Municípios ------------------------------------------------------

# arq_zip <- "./data/raw_data/base_de_dados_2010_2016_xls.zip"
# arq <- unzip(list = TRUE, zipfile = arq_zip)["Name"][1,]
# unzip(arq_zip)

arq <- "./data/raw_data/pib-mun-2021.xlsx"

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
                                           "CD_RegGeoImed",
                                           "NM_RegGeoImed",
                                           "Mun_RegGeoImed",
                                           "CD_RegGeoIntermed",
                                           "NM_RegGeoIntermed",
                                           "Mun_RegGeoIntermed",
                                           "CD_ConUrb",
                                           "NM_ConUrb",
                                           "TP_ConUrb",
                                           "CD_ArranjoPop",
                                           "NM_ArranjoPop",
                                           "HierarqUrbana",
                                           "HierarqUrbana_PrincCat",   
                                           "CD_RegRural",
                                           "NM_RegRural",
                                           "TP_RegRural",
                                           "AmazoniaLeal",
                                           "Semiarido",
                                           #"TipologiaRuralUrbana",
                                           "Cid-Reg_SP",
                                           "PIB_Agropec",
                                           "PIB_Industria",
                                           "PIB_Servicos",
                                           "PIB_Adm_exceto",
                                           "PIB_Adm_def_educ_sau_seg",
                                           "Vlr_Bruto_Tot",
                                           "Impostos",
                                           "PIB",
                                           #"Pop",
                                           "PIBpc",
                                           "Atividade1",
                                           "Atividade2",
                                           "Atividade3")
) %>%
  filter(Ano == "2021")

#file.remove(arq)


# Áreas dos Municípios ----------------------------------------------------


raw_mun_areas  <- read_excel("./data/raw_data/areas-mun-2022.xlsx", sheet = "AR_BR_MUN_2022")


# Arrecadação Federal -----------------------------------------------------

raw_mun_arrec_fed <- read_excel("./data/raw_data/arrecadacao-da-receita-administrada-pela-rfb-por-municipio-2023.xlsx", sheet = "TOTAL", skip = 5)


# Siconfi -----------------------------------------------------------------

desp_pessoal <- read.csv2("./data/raw_data/dtp-mun-2023-sem.csv", skip = 5, fileEncoding = "Latin1")

# * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
## Desp Função
# * * *
# Saídas esperadas: lista de funções, tabela função x subfunção

arq_zip <- "./data/raw_data/dca-mun-2023-desp-funcao.csv.zip"
arq_name <- unzip(list = TRUE, zipfile = arq_zip)["Name"][1,]
desp_fun <- readr::read_csv2(
  unz(arq_zip, arq_name), 
  col_names = c("nome_mun", "cod_mun", "sigla_uf", "pop", "coluna", "conta", "cod_conta", "valor"), 
  skip = 4, 
  locale = locale(encoding = "WINDOWS-1252"))

### Contas

contas_fun <- desp_fun %>% select(conta) %>% distinct()
nomes_contas_fun_totais <- c("Despesas Exceto Intraorçamentárias", 	
                             "Despesas Intraorçamentárias")

nomes_contas_fun <- contas_fun %>% filter(str_sub(conta,4,4) == "-") %>% pull()

#gera lista
nomes_contas_fun %>% sort() %>% dput

colunas_fun <- desp_fun %>% select(coluna) %>% distinct()

totais <- desp_fun %>%
  filter(conta %in% nomes_contas_fun_totais) %>%
  group_by(coluna) %>%
  summarise(valor = sum(valor)) %>%
  pivot_wider(names_from = coluna, values_from = valor)

totais$`Despesas Empenhadas`-totais$`Despesas Liquidadas`
totais$`Despesas Liquidadas`-totais$`Despesas Pagas`

totais_fun <- desp_fun %>%
  filter(conta %in% nomes_contas_fun, coluna == "Despesas Empenhadas") %>%
  group_by(conta) %>%
  summarise(valor = sum(valor)) %>%
  janitor::adorn_totals()

totais_fun_subtotais <- desp_fun %>%
  filter(conta %in% nomes_contas_fun_totais, coluna == "Despesas Empenhadas") %>%
  group_by(conta) %>%
  summarise(valor = sum(valor))

### Detalhamento das Funções

codigos_fun <- substr(sort(nomes_contas_fun), 1,2)

mini_tabs_fun <- list()

for (codigo in codigos_fun) {
  
  subfuncoes <- contas_fun %>% 
    filter(
      substr(conta, 1, 3) == paste0(codigo, ".") | conta == paste0("FU", codigo, " - Demais Subfunções")
    ) %>%
    pull() %>% sort()
  
  qde_subs <- length(subfuncoes)
  
  mini_tab_fun <- data.frame(funcao = rep(codigo, qde_subs), subfuncao = subfuncoes)
  
  mini_tabs_fun[[codigo]] <- mini_tab_fun
  
}

#gera tabela de funcao / subfuncao

tabela_funcao_subfuncao <- bind_rows(mini_tabs_fun)

# * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *



#verifica
totais_fun[29, 2] - totais_fun_subtotais[1,2]

## Desp Economica
arq_zip <- "./data/raw_data/dca-mun-2023-desp.csv.zip"
arq_name <- unzip(list = TRUE, zipfile = arq_zip)["Name"][1,]
desp_dca <- readr::read_csv2(
  unz(arq_zip, arq_name),
  col_names = c("nome_mun", "cod_mun", "sigla_uf", "pop", "coluna", "conta", "cod_conta", "valor"), 
  skip = 4,
  locale = locale(encoding = "WINDOWS-1252"))

# ## Naturezas Rec
# lista_nrs <- read_excel("data/raw_data/2023_Anexo_II_Portaria_STN_642_Leiaute_MSC_19Fev24.xlsx",
#                                                                   sheet = "NR", skip = 1)
# tab_nrs <- lista_nrs %>% select(NR, Valorizável) %>% mutate(NR = as.character(NR))


## Receitas
arq_zip <- "./data/raw_data/dca-mun-2023-rec.csv.zip"
arq_name <- unzip(list = TRUE, zipfile = arq_zip)["Name"][1,]
rec <- readr::read_csv2(
  unz(arq_zip, arq_name),
  col_names = c("nome_mun", "cod_mun", "sigla_uf", "pop", "coluna", "conta", "cod_conta", "valor"), 
  skip = 4,
  locale = locale(encoding = "WINDOWS-1252")) #%>%
  #mutate(NR = str_extract(conta, "^[0-9\\.]+") |> str_replace_all("\\.", "")) %>%
  #left_join(tab_nrs)


naturezas_rec <- rec %>% select(conta) %>% distinct() %>% arrange()
colunas <- rec %>% select(coluna) %>% distinct() %>% arrange()

origens_rec <- naturezas_rec %>% filter(str_detect(conta, "0\\.0\\.00\\.0\\.0"))
terceiro_nivel_rec <- naturezas_rec %>% filter(str_detect(conta, ".0\\.00\\.0\\.0"))

ggplot(rec %>% 
         filter(
           coluna == "Receitas Brutas Realizadas",
           conta %in% origens_rec$conta,
           !str_starts(conta, "7"),
           !str_starts(conta, "8")
           )
       ) + 
  geom_col(aes(x = valor, y = conta))

maiores_naturezas <- rec %>% 
  filter(
    coluna == "Receitas Brutas Realizadas",
    !(conta %in% origens_rec$conta)
  ) %>%
  group_by(conta) %>%
  summarise(valor = sum(valor)) %>%
  ungroup() %>%
  arrange(desc(valor))

# abertura de, por exemplo, receitas patrimoniais
ggplot(rec %>% 
         filter(
           coluna == "Receitas Brutas Realizadas",
           #conta %in% terceiro_nivel_rec$conta,
           str_starts(conta, "1.3"),
           valor > 0
         )
) + 
  geom_col(aes(x = valor, y = conta))


### Dá para ver que as maiores receitas são transferências e impostos (se tirar as capitais, como ficaria?)

rec %>% count(conta) %>% arrange(conta)

"0.0.00.0.0"

c(
  "1.0.0.0.00.0.0 - Receitas Correntes",
  "1.1.0.0.00.0.0 - Impostos, Taxas e Contribuições de Melhoria",
  "1.1.1.0.00.0.0 - Impostos",
  "1.1.1.4.51.1.0 - Imposto sobre Serviços de Qualquer Natureza - ISSQN",
  "1.1.1.2.50.0.0 - Imposto sobre a Propriedade Predial e Territorial Urbana",
  "1.1.1.2.53.0.0 - Impostos sobre Transmissão Inter Vivos de Bens Imóveis e de Direitos Reais sobre Imóveis",
  "1.2.1.5.00.0.0 - Contribuições para Regimes Próprios de Previdência e Sistema de Proteção Social",
  "1.7.0.0.00.0.0 - Transferências Correntes",
  "2.0.0.0.00.0.0 - Receitas de Capital",
  "1.1.1.2.51.0.0 - Imposto sobre a Propriedade de Veículos Automotores",
  "1.1.1.2.52.0.0 - Imposto sobre Transmissão ¿Causa Mortis¿ e Doação de Bens e Direitos"       
)


# Exemplo Paraná ----------------------------------------------------------

desp_fun_PR <- desp_fun %>% filter(sigla_uf == "PR", coluna == "Despesas Empenhadas", substr(conta, 4, 4) == "-") %>%
  group_by(nome_mun) %>%
  mutate(total_desp = sum(valor)) %>%
  ungroup() %>%
  pivot_wider(names_from = conta, values_from = valor, values_fill = 0)

total_mun_pr <- desp_fun_PR %>%
  summarise(
    across(
      .cols = all_of(names(.)[substr(names(.), 4, 4) == "-"]),
      .fns  = sum
    )
  ) %>%
  gather()
  
library(extrafont)
library(colorspace)
loadfonts()

ggplot(total_mun_pr, aes(x = value, y = reorder(key, value))) + geom_col(fill = "firebrick") +
  labs(x = NULL, y = NULL) +
  scale_x_continuous(
    labels = scales::label_number(scale = 1e-9, suffix = " bi")
  ) +
  theme_minimal() +
  theme(
    panel.grid.major.y = element_blank(),
    panel.grid.minor.x = element_blank(),
    text = element_text(family = "Inter")
  )

ggplot(dados_pr, aes()) + geom_histogram(fill = "tomato") +
  labs(x = NULL, y = NULL) +
  scale_x_continuous(
    labels = scales::label_number(scale = 1e-9, suffix = " bi")
  ) +
  theme_minimal() +
  theme(
    panel.grid.major.y = element_blank(),
    panel.grid.minor.x = element_blank(),
    text = element_text(family = "Inter")
  )

ggsave("funcao-pr.png", width = 6, height = 4)

mun_br <- geobr::read_municipality()
mun_pr <- mun_br %>% filter(abbrev_state == "PR")

dados_pr <- mun_pr %>% left_join(desp_fun_PR, by = c("code_muni" = "cod_mun"))

ggplot(dados_pr) + geom_sf(aes(fill = `10 - Saúde` / total_desp), color = NA) + 
  #scale_fill_continuous_sequential(pal = "Lajolla") +
  scale_fill_binned_sequential(pal = "Green-Yellow",
                               labels = scales::label_percent(accuracy = 1))+
  labs(fill = NULL) +
  theme_void() +
  theme(
    panel.grid.major.y = element_blank(),
    panel.grid.minor.x = element_blank(),
    text = element_text(family = "Inter")
  )

ggplot(dados_pr %>% mutate(cat_pop = cut(pop, c(0, 10000, 50000, 100000, 200000, 500000, 1e6, Inf), c("até 10 mil", "10 a 50 mil", "50 a 100 mil", "100 a 200 mil", "200 a 500 mil", "500 mil a 1 milhão", "Acima de 1 milhão")))) + geom_sf(aes(fill = cat_pop), color = NA) + 
  #scale_fill_continuous_sequential(pal = "Lajolla") +
  scale_fill_manual(values = rev(c("#704D9E", "#A653A8", "#CF63A6", "#ED7C97", "#F7A086", "#F9C483", 
                               "#F3E79A"))) +
  labs(fill = NULL) +
  theme_void() +
  theme(
    panel.grid.major.y = element_blank(),
    panel.grid.minor.x = element_blank(),
    text = element_text(family = "Inter")
  )

ggplot(dados_pr, aes(x = `10 - Saúde` / pop, y = `12 - Educação` / pop, size = pop, color = `10 - Saúde` > `12 - Educação`)) + 
  annotate(geom = "segment", x = 0, y = 0, xend = 6000, yend = 6000, color = "#333333") +
  geom_point() +
  labs(x = "Despesa per capita com Saúde", y = "Despesa per capita com Educação") +
  scale_color_discrete_qualitative() +
  guides(size = "none") +
  theme_minimal() +
  theme(
    text = element_text(family = "Inter"),
    legend.position = "none"
  )

dados_pr_geo <- geojsonsf::sf_geojson(dados_pr, digits = 6)
write(dados_pr_geo, "dados-pr.json")

ggplot()


# Explorações -----------------------------------------------------------

ggplot(raw_mun_perfil) + geom_beeswarm(aes(x = `Pop estimada 2021`, y = 0), groupOnX = FALSE)




# Exportação --------------------------------------------------------------

exp <- raw_mun_perfil %>% select(REGIAO, NOME = `NOME MUNIC`, POP = `POP EST`)

jsonlite::write_json(exp, './story/data.json')

exp %>% filter(POP <= 60000) %>% nrow() / nrow(exp)



