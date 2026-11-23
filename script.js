// ==========================================
// 1. SELECIONANDO OS ELEMENTOS DA TELA
// ==========================================
// Aqui estamos "pegando" o HTML pelo ID para o JS poder manipular
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const emptyState = document.getElementById('emptyState');
const loading = document.getElementById('loading');
const weatherResult = document.getElementById('weatherResult');
const errorMessage = document.getElementById('errorMessage');

const cityName = document.getElementById('cityName');
const localTime = document.getElementById('localTime');
const weatherIcon = document.getElementById('weatherIcon');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const tempMin = document.getElementById('tempMin');
const tempMax = document.getElementById('tempMax');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const hourlyList = document.getElementById('hourly');
const forecastList = document.getElementById('forecast');

// ==========================================
// 2. A SUA "IDENTIDADE" (CHAVE DA API)
// ==========================================
// O servidor precisa saber quem está pedindo os dados.
// Atenção: num site 100% front-end a chave sempre fica visível para quem
// abrir o código. Para um portfólio tudo bem, mas em produção o ideal é
// passar as chamadas por um back-end que guarda a chave em segredo.
const apiKey = 'b5748bad3a50faaa27f5440c2091c9ee';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Chave usada para lembrar a última cidade buscada no navegador
const STORAGE_KEY = 'app-clima:ultima-cidade';

// ==========================================
// 3. FUNÇÕES DE APOIO
// ==========================================

// Monta a URL da API. Recebe a "localização" como objeto:
// { q: 'São Paulo' } ou { lat: -23.5, lon: -46.6 }
// URLSearchParams já cuida de acentos e espaços (ex: "São Paulo" -> "S%C3%A3o+Paulo")
function buildUrl(endpoint, location) {
    const params = new URLSearchParams({
        ...location,
        appid: apiKey,
        units: 'metric', // Celsius
        lang: 'pt_br'    // Descrição em português
    });
    return `${BASE_URL}/${endpoint}?${params}`;
}

// Faz o fetch e transforma cada código de erro numa mensagem amigável
async function fetchJson(url) {
    const response = await fetch(url);

    if (response.ok) {
        return response.json();
    }

    if (response.status === 404) throw new Error('Cidade não encontrada. Confira o nome e tente novamente.');
    if (response.status === 401) throw new Error('Chave da API inválida. Verifique o valor de apiKey no script.js.');
    if (response.status === 429) throw new Error('Muitas buscas em pouco tempo. Espere um minutinho e tente de novo.');
    throw new Error('O serviço de clima está com problemas. Tente novamente mais tarde.');
}

// Endereço da imagem do ícone que o OpenWeather fornece (ex: "10d" = chuva de dia)
function iconUrl(icon, size = '2x') {
    return `https://openweathermap.org/img/wn/${icon}@${size}.png`;
}

// A API manda a hora em "segundos desde 1970" (UTC) + o fuso da cidade em segundos.
// Somamos os dois e formatamos como UTC para obter a hora LOCAL da cidade.
function cityDate(unixSeconds, timezoneOffset) {
    return new Date((unixSeconds + timezoneOffset) * 1000);
}

function formatLocalTime(unixSeconds, timezoneOffset) {
    return cityDate(unixSeconds, timezoneOffset).toLocaleString('pt-BR', {
        timeZone: 'UTC',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Só a hora e o minuto (ex: "05:42"), usado no nascer e pôr do sol
function formatHourMinute(unixSeconds, timezoneOffset) {
    return cityDate(unixSeconds, timezoneOffset).toLocaleTimeString('pt-BR', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Atalho para criar um elemento com classe e texto numa linha só.
// Usamos textContent (e não innerHTML): é mais seguro, porque nenhum
// texto vindo de fora vira código HTML.
function createEl(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function createIcon(icon, description) {
    const img = document.createElement('img');
    img.src = iconUrl(icon);
    img.alt = description;
    img.title = description;
    img.loading = 'lazy';
    return img;
}

// Escolhe o fundo da página conforme o clima (o "main" vem em inglês na API)
function getTheme(main, icon) {
    const isNight = icon.endsWith('n');
    switch (main) {
        case 'Clear': return isNight ? 'theme-clear-night' : 'theme-clear-day';
        case 'Clouds': return isNight ? 'theme-clear-night' : 'theme-clouds';
        case 'Rain':
        case 'Drizzle': return 'theme-rain';
        case 'Thunderstorm': return 'theme-storm';
        case 'Snow': return 'theme-snow';
        default: return 'theme-mist'; // Neblina, névoa, fumaça...
    }
}

// Controla o que aparece na tela: 'loading', 'result' ou 'error'
function showState(state, message = '') {
    emptyState.classList.add('hidden'); // A tela inicial some depois da primeira ação
    loading.classList.toggle('hidden', state !== 'loading');
    weatherResult.classList.toggle('hidden', state !== 'result');
    errorMessage.classList.toggle('hidden', state !== 'error');
    errorMessage.textContent = message;

    // Trava os botões enquanto carrega para evitar cliques repetidos
    const isLoading = state === 'loading';
    searchBtn.disabled = isLoading;
    locationBtn.disabled = isLoading;
}

// ==========================================
// 4. PREVISÃO DOS PRÓXIMOS DIAS
// ==========================================
// A API grátis devolve a previsão de 3 em 3 horas (40 itens = 5 dias).
// Aqui agrupamos por dia, pegando a mínima, a máxima e o ícone do meio-dia.
function buildDailyForecast(forecast) {
    const offset = forecast.city.timezone;
    const today = cityDate(Date.now() / 1000, offset).toISOString().slice(0, 10);
    const days = {};

    for (const item of forecast.list) {
        const date = cityDate(item.dt, offset);
        const key = date.toISOString().slice(0, 10); // "2026-11-24"
        if (key === today) continue; // Hoje já aparece lá em cima

        if (!days[key]) {
            days[key] = { date, min: Infinity, max: -Infinity, icon: item.weather[0].icon, desc: item.weather[0].description, hourDiff: 24 };
        }

        const day = days[key];
        day.min = Math.min(day.min, item.main.temp_min);
        day.max = Math.max(day.max, item.main.temp_max);

        // O horário mais perto de 12h representa melhor o dia
        const hourDiff = Math.abs(date.getUTCHours() - 12);
        if (hourDiff < day.hourDiff) {
            day.hourDiff = hourDiff;
            day.icon = item.weather[0].icon.replace('n', 'd');
            day.desc = item.weather[0].description;
        }
    }

    return Object.values(days).slice(0, 5);
}

function renderForecast(forecast) {
    const days = buildDailyForecast(forecast);

    // Menor e maior temperatura da semana toda: servem de "régua" para as barras
    const weekMin = Math.min(...days.map((day) => day.min));
    const weekMax = Math.max(...days.map((day) => day.max));
    const span = weekMax - weekMin || 1; // "|| 1" evita dividir por zero

    forecastList.replaceChildren(...days.map((day) => {
        const li = createEl('li');
        const dayName = day.date.toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'short' }).replace('.', '');

        // A parte colorida da barra começa na mínima do dia e termina na máxima,
        // em porcentagem da semana. Ex: semana 10°–30°, dia 15°–25° = de 25% até 75%
        const bar = createEl('div', 'range-bar');
        const fill = createEl('div', 'range-fill');
        fill.style.left = `${((day.min - weekMin) / span) * 100}%`;
        fill.style.width = `${((day.max - day.min) / span) * 100}%`;
        bar.append(fill);

        li.append(
            createEl('span', 'day', dayName),
            createIcon(day.icon, day.desc),
            createEl('span', 'min', `${Math.round(day.min)}°`),
            bar,
            createEl('span', 'max', `${Math.round(day.max)}°`)
        );
        return li;
    }));
}

// ==========================================
// 4.1 PRÓXIMAS HORAS
// ==========================================
// Os 8 primeiros itens da previsão = as próximas 24 horas (de 3 em 3h)
function renderHourly(forecast) {
    const offset = forecast.city.timezone;

    hourlyList.replaceChildren(...forecast.list.slice(0, 8).map((item) => {
        const li = createEl('li');
        const hour = cityDate(item.dt, offset).getUTCHours();

        // "pop" = probabilidade de chuva (0 a 1). Só mostramos se for relevante.
        const chance = Math.round(item.pop * 100);

        li.append(
            createEl('span', 'hour', `${String(hour).padStart(2, '0')}h`),
            createIcon(item.weather[0].icon, item.weather[0].description),
            createEl('span', 'pop', chance >= 20 ? `${chance}%` : ''),
            createEl('span', 't', `${Math.round(item.main.temp)}°`)
        );
        return li;
    }));
}

// ==========================================
// 5. A FUNÇÃO PRINCIPAL (O "GARÇOM")
// ==========================================
// A palavra "async" significa que essa função vai lidar com coisas que demoram
// (como ir buscar algo na internet), então o código precisa "esperar" (await).
async function getWeatherData(location) {
    showState('loading');

    try {
        // Promise.all faz os dois pedidos AO MESMO TEMPO (clima atual + previsão),
        // em vez de esperar um terminar para começar o outro.
        const [data, forecast] = await Promise.all([
            fetchJson(buildUrl('weather', location)),
            fetchJson(buildUrl('forecast', location))
        ]);

        // INJETANDO OS DADOS NO HTML
        const weather = data.weather[0];
        cityName.textContent = data.sys.country ? `${data.name}, ${data.sys.country}` : data.name;
        localTime.textContent = formatLocalTime(data.dt, data.timezone);

        weatherIcon.src = iconUrl(weather.icon, '4x');
        weatherIcon.alt = weather.description;

        // Math.round arredonda os números (ex: 25.6 vira 26)
        temperature.textContent = Math.round(data.main.temp);
        description.textContent = weather.description;
        tempMin.textContent = Math.round(data.main.temp_min);
        tempMax.textContent = Math.round(data.main.temp_max);
        feelsLike.textContent = Math.round(data.main.feels_like);
        humidity.textContent = data.main.humidity;
        wind.textContent = Math.round(data.wind.speed * 3.6); // m/s -> km/h
        sunrise.textContent = formatHourMinute(data.sys.sunrise, data.timezone);
        sunset.textContent = formatHourMinute(data.sys.sunset, data.timezone);

        renderHourly(forecast);
        renderForecast(forecast);

        // Troca o fundo conforme o clima
        document.body.className = getTheme(weather.main, weather.icon);

        // Lembra a cidade para a próxima visita (try/catch: alguns navegadores bloqueiam)
        try { localStorage.setItem(STORAGE_KEY, data.name); } catch {}

        showState('result');

    } catch (error) {
        console.error(error);
        // Se o fetch falhar sem resposta nenhuma, provavelmente a internet caiu
        const message = error instanceof TypeError
            ? 'Sem conexão com a internet. Verifique sua rede.'
            : error.message;
        showState('error', message);
    }
}

// ==========================================
// 6. OUVINTES DE EVENTOS
// ==========================================

// O "submit" do formulário dispara tanto no clique do botão quanto no Enter
searchForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Impede a página de recarregar
    const city = cityInput.value.trim(); // Remove espaços vazios
    if (city !== '') {
        getWeatherData({ q: city });
    }
});

// Botão de localização: pede permissão ao navegador para saber onde o usuário está
locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        showState('error', 'Seu navegador não suporta localização.');
        return;
    }

    showState('loading');
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            cityInput.value = '';
            getWeatherData({ lat: latitude, lon: longitude });
        },
        () => showState('error', 'Não foi possível obter sua localização. Verifique a permissão do navegador.'),
        { timeout: 10000 }
    );
});

// Ao abrir a página, já mostra a última cidade pesquisada (se houver)
let lastCity = null;
try { lastCity = localStorage.getItem(STORAGE_KEY); } catch {}
if (lastCity) {
    cityInput.value = lastCity;
    getWeatherData({ q: lastCity });
}
