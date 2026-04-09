// ==========================================
// 1. SELECIONANDO OS ELEMENTOS DA TELA
// ==========================================
// Aqui estamos "pegando" o HTML pelo ID para o JS poder manipular
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherResult = document.getElementById('weatherResult');
const errorMessage = document.getElementById('errorMessage');

const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const humidity = document.getElementById('humidity');

// ==========================================
// 2. A SUA "IDENTIDADE" (CHAVE DA API)
// ==========================================
// O servidor precisa saber quem está pedindo os dados. 
// Você precisará colocar a sua chave real aqui dentro das aspas!
const apiKey = 'b5748bad3a50faaa27f5440c2091c9ee'; 

// ==========================================
// 3. A FUNÇÃO PRINCIPAL (O "GARÇOM")
// ==========================================
// A palavra "async" significa que essa função vai lidar com coisas que demoram 
// (como ir buscar algo na internet), então o código precisa "esperar" (await).
async function getWeatherData(city) {
    
    // Toda vez que fizermos uma busca nova, escondemos o resultado anterior e as mensagens de erro
    weatherResult.classList.add('hidden');
    errorMessage.classList.add('hidden');

    try {
        // O fetch chama a API. 
        // units=metric traz em Celsius / lang=pt_br traz a descrição em português
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`);

        /// Se o garçom voltar da cozinha dizendo "Não temos esse prato"
        if (response.status === 404) {
            throw new Error('Cidade não encontrada');
        }

        // O garçom trouxe a comida! Agora precisamos "desempacotar" a resposta em um formato que o JS entenda (JSON)
        const data = await response.json();

        // 4. INJETANDO OS DADOS NO HTML
        // Pegamos aqueles "estacionamentos" vazios do HTML e colocamos os dados neles
        cityName.innerText = data.name;
        // Math.round arredonda os números (ex: 25.6 vira 26)
        temperature.innerText = Math.round(data.main.temp);
        description.innerText = data.weather[0].description;
        humidity.innerText = data.main.humidity;

        // Tira a classe 'hidden' da div de resultados para ela aparecer na tela
        weatherResult.classList.remove('hidden');

    } catch (error) {
        // Se a cidade não existir (ou a internet cair), mostramos a mensagem de erro vermelha
        console.error(error);
        errorMessage.classList.remove('hidden');
    }
}

// ==========================================
// 5. OUVINTES DE EVENTOS (QUANDO CLICAR/APERTAR ENTER)
// ==========================================

// Quando clicar no botão "Buscar"
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim(); // Pega o que foi digitado e remove espaços vazios
    if (city !== '') {
        getWeatherData(city); // Manda o nome da cidade para a nossa função lá em cima
    }
});

// Quando apertar a tecla "Enter" dentro do campo de texto
cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city !== '') {
            getWeatherData(city);
        }
    }
});