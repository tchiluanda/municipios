library(tidyverse)
library(readxl)
library(ggbeeswarm)

arq_zip <- "./data/raw_data/dca-mun-2024-desp-funcao.zip"
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

geom_raster() #+
ggplot(principal_despesa, aes(x = x, y = y, fill = funcao)) +
  #scale_fill_manual(values = c("12 - Educação" = "darkgreen", "10 - Saúde" = "forestgreen", "Outros" = "gray")) +
  theme_minimal()

principal_despesa %>% count(funcao) %>% arrange(-n)

