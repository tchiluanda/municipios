library(tidyverse)
library(readxl)
library(ggbeeswarm)

arq_zip <- "../data/raw_data/dca-mun-2024-desp-funcao.zip"
arq_name <- unzip(list = TRUE, zipfile = arq_zip)["Name"][1,]
desp_fun <- readr::read_csv2(
  unz(arq_zip, arq_name), 
  col_names = c("nome_mun", "cod_mun", "sigla_uf", "pop", "coluna", "conta", "cod_conta", "valor"), 
  skip = 4, 
  locale = locale(encoding = "WINDOWS-1252"))

# principais funcoes

fun <- desp_fun %>%
  filter(
    coluna == "Despesas Empenhadas",
    substr(conta, 4, 4) == "-"
  ) %>%
  select(nome_mun, cod_mun, funcao = conta, sigla_uf, valor)

fun_rank <- fun %>%
  group_by(nome_mun) %>%
  mutate(rank = stringr::str_pad(rank(-valor), width = 2, side = "left", pad = "0")) %>%
  ungroup()

principais_fun <- fun_rank %>%
  count(rank, funcao) %>%
  ungroup() %>%
  group_by(rank) %>%
  filter(rank_do_rank < 7, rank %in% c("01", "02", "03", "04", "05", "06")) %>%
  select(-n) %>%
  pivot_wider(names_from = rank, values_from = rank_do_rank) 

#--

fun_rank2 <- fun %>%
  group_by(nome_mun) %>%
  mutate(desp_total = sum(valor)) %>%
  mutate(rank = rank(-valor)) %>%
  mutate(
    top5 = rank <= 5
  ) %>%
  ungroup() %>%
  group_by(nome_mun, top5) %>%
  mutate(desp_top5 = sum(valor) / desp_total) %>%
  ungroup() %>%
  filter(top5) %>%
  group_by(nome_mun) %>%
  summarise(desp_top5 = first(desp_top5)) %>%
  ungroup()

ggplot(fun_rank2, aes(x = desp_top5, y = 0)) + 
  geom_jitter(aes(color = desp_top5 > 0.8)) +
  #geom_boxplot() 
  theme_minimal()


principal_despesa <- fun_rank %>%
  filter(rank == "01") %>%
  mutate(x = row_number() %/% 75, 
         y = row_number() %% 75,
  )#funcao = fct_other(funcao, keep = c("10 - Saúde", "12 - Educação"), other_level = "Outros"))


ggplot(principal_despesa, aes(x = x, y = y, fill = funcao)) +
  geom_raster() #+
#scale_fill_manual(values = c("12 - Educação" = "darkgreen", "10 - Saúde" = "forestgreen", "Outros" = "gray")) +
theme_minimal()

ggplot(principal_despesa, aes(x = x, y = y, color = funcao)) +
  geom_point() +
  #scale_fill_manual(values = c("12 - Educação" = "darkgreen", "10 - Saúde" = "forestgreen", "Outros" = "gray")) +
  theme_minimal()


ggplot(principal_despesa, aes(x = x, y = y, fill = funcao)) +
  geom_raster() #+
  #scale_fill_manual(values = c("12 - Educação" = "darkgreen", "10 - Saúde" = "forestgreen", "Outros" = "gray")) +
  theme_minimal()

principal_despesa %>% count(funcao) %>% arrange(-n)

#--

fun_rank_num <- fun %>%
  group_by(nome_mun) %>%
  mutate(rank = rank(-valor)) %>%
  ungroup()

freq_top_5 <- fun %>%
  group_by(nome_mun) %>%
  mutate(rank = rank(-valor)) %>%
  filter(rank <= 5) %>%
  ungroup() %>%
  count(funcao) %>%
  mutate(proporcao_funcao_nos_top5 = 100 * n / n_distinct(fun$nome_mun)) %>%
  arrange(-proporcao_funcao_nos_top5)

#nao tem educacao ou saude nos top
mun_desp_rankeadas <- fun %>%
  group_by(nome_mun) %>%
  mutate(rank = rank(-valor)) %>% 
  ungroup()

mun_educ_fora_top5 <- mun_desp_rankeadas %>%
  filter(funcao == "12 - Educação", rank > 5)

mun_saude_fora_top5 <- mun_desp_rankeadas %>%
  filter(funcao == "10 - Saúde")

fun$nome_mun %>% unique() %>% length()

# n_distinct(fun$nome_mun) 
# equivale a
# length(unique(fun$nome_mun))

library(geobr)

geo_mun <- geobr::read_municipality()

fun_rank_cod_mun <- fun %>%
  group_by(cod_mun) %>%
  mutate(rank = stringr::str_pad(rank(-valor), width = 2, side = "left", pad = "0")) %>%
  ungroup()

principal_desp_cod_mun <- fun_rank_cod_mun %>%
  filter(rank == "01")

principal_desp_cod_mun %>% count(funcao) %>% mutate(prop = n / length(unique(fun$nome_mun))) %>% arrange(-prop)

principal_desp_para_grafico <- principal_desp_cod_mun %>%
  mutate(
    funcao = fct_other(funcao, keep = c("10 - Saúde", "12 - Educação"), other_level = "Outros")
  ) %>% 
  right_join(geo_mun, by = c("cod_mun" = "code_muni"))

ggplot(principal_desp_para_grafico) + 
  geom_sf(aes(fill = funcao, geometry = geom), color = NA) +
  scale_fill_manual(values = c("12 - Educação" = "darkgreen", "10 - Saúde" = "steelblue", "Outros" = "lightyellow")) +
  #facet_wrap(~sigla_uf) +
  theme_minimal()

principal_desp_por_estado <- principal_desp_cod_mun %>%
  group_by(sigla_uf) %>%
  mutate(total_uf = n()) %>%
  ungroup() %>%
  group_by(sigla_uf, funcao) %>%
  summarise(
    total_uf = first(total_uf),
    qde_funcao = n(),
    prop_fun_uf = qde_funcao / total_uf)

ggplot(principal_desp_por_estado %>%
         mutate(
           funcao = fct_other(funcao, keep = c("10 - Saúde", "12 - Educação"), other_level = "Outros")
         )
       ) +
  geom_col(aes(y = sigla_uf, x = prop_fun_uf, fill = funcao), position = "stack") +
  labs(title = "qde de municípios do estado que possuem como sua principal despesa...") +
  theme_minimal()

ggplot(fun_rank2, aes(x = desp_top5, y = 0)) + 
  geom_jitter(aes(color = desp_top5 > 0.8)) +
  #geom_boxplot() 
  theme_minimal()
