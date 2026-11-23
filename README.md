# ⛅ App de Clima

Aplicação de previsão do tempo feita com **HTML, CSS e JavaScript puro**, consumindo a API do [OpenWeather](https://openweathermap.org/).

🔗 **Acesse:** https://dioguinholf.github.io/projeto-app-clima/

<!-- Dica: tire um print do app, arraste para cá na edição do README e o GitHub gera o link da imagem -->

## ✨ Funcionalidades

- 🔎 Busca de clima por nome da cidade
- 📍 Clima da sua localização atual (Geolocation API)
- 🌡️ Temperatura, sensação térmica, mínima e máxima, umidade, vento, nascer e pôr do sol
- 🕒 Previsão das próximas 24 horas, com chance de chuva
- 📅 Previsão dos próximos 5 dias, com barra de variação de temperatura
- 🎨 Fundo animado conforme o clima (sol, noite estrelada, chuva, tempestade, neve e neblina)
- 💾 Lembra a última cidade pesquisada
- ⚠️ Mensagens de erro específicas (cidade não encontrada, sem internet, limite da API...)
- 📱 Layout responsivo e acessível (leitor de tela, navegação por teclado e respeito à preferência por menos animação)

## 🛠️ Tecnologias

- **HTML5** semântico
- **CSS3**: variáveis, Grid, Flexbox, `backdrop-filter` (efeito de vidro), animações e media queries
- **JavaScript (ES6+)**: `async/await`, `fetch`, `Promise.all`, manipulação do DOM, `localStorage` e Geolocation API
- **API:** [OpenWeather](https://openweathermap.org/api), com os endpoints de clima atual e de previsão de 5 dias

## 🚀 Como rodar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/dioguinholf/projeto-app-clima.git
2. Abra o `index.html` no navegador, ou use a extensão **Live Server** do VS Code.
3. (Opcional) Crie sua própria chave gratuita em [openweathermap.org](https://openweathermap.org/api) e troque o valor de `apiKey` no `script.js`.

## 📚 O que aprendi

- Consumir uma API REST e tratar os diferentes códigos de erro (404, 401, 429)
- Fazer duas requisições em paralelo com `Promise.all`
- Converter horários para o fuso da cidade pesquisada
- Agrupar dados de 3 em 3 horas em previsões por dia
- Criar elementos com segurança usando `textContent` em vez de `innerHTML`

## 👤 Autor

Feito por **Diogo Lopes de França**: [GitHub](https://github.com/dioguinholf)
