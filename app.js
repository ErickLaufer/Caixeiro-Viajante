const fs = require('fs');

// Lê o arquivo .tsp e retorna as coordenadas das cidades
function readTSPFile(filename) {
    const data = fs.readFileSync(filename, 'utf8').split('\n');
    let cities = [];
    let startParsing = false;

    for (let line of data) {
        line = line.trim();
        if (line === "NODE_COORD_SECTION") {
            startParsing = true;
            continue;
        }
        if (line === "EOF" || line === "") break;

        if (startParsing) {
            const parts = line.split(/\s+/).map(Number);
            if (parts.length >= 3 && !isNaN(parts[1]) && !isNaN(parts[2])) {
                cities.push([parts[1], parts[2]]);
            }
        }
    }
    return cities;
}

// Cria a matriz de distâncias entre todas as cidades
function distanceMatrix(cities) {
    const distMatrix = Array.from({ length: cities.length }, () => Array(cities.length).fill(0));
    for (let i = 0; i < cities.length; i++) {
        for (let j = 0; j < cities.length; j++) {
            if (i !== j) {
                const dx = cities[i][0] - cities[j][0];
                const dy = cities[i][1] - cities[j][1];
                distMatrix[i][j] = Math.sqrt(dx * dx + dy * dy);
            }
        }
    }
    return distMatrix;
}

// Gera população inicial de rotas aleatórias
function initializePopulation(popSize, numCities) {
    return Array.from({ length: popSize }, () =>
        [...Array(numCities).keys()].sort(() => Math.random() - 0.5)
    );
}

// Calcula a aptidão de uma rota (inverso da distância total)
function fitness(route, distMatrix) {
    const totalDistance = route.reduce((sum, city, i) => 
        sum + (distMatrix[city][route[i + 1] || route[0]]), 0);
    return totalDistance === 0 ? Number.MAX_VALUE : 1 / totalDistance;
}

// Seleção por torneio
function selection(population, distMatrix) {
    const tournamentSize = Math.min(5, population.length);
    const tournament = Array.from({ length: tournamentSize }, () =>
        population[Math.floor(Math.random() * population.length)]);
    return tournament.reduce((best, contender) => 
        fitness(contender, distMatrix) > fitness(best, distMatrix) ? contender : best);
}

// Crossover entre dois pais
function crossover(parent1, parent2) {
    const size = parent1.length;
    const [start, end] = [Math.floor(Math.random() * size), Math.floor(Math.random() * size)].sort((a, b) => a - b);
    const child = new Array(size).fill(-1);

    for (let i = start; i < end; i++) {
        child[i] = parent1[i];
    }

    let p2Index = 0;
    for (let i = 0; i < size; i++) {
        if (child[i] === -1) {
            while (child.includes(parent2[p2Index])) {
                p2Index++;
            }
            child[i] = parent2[p2Index];
        }
    }
    return child;
}

// Mutação: troca dois genes de posição
function mutate(route) {
    let a, b;
    do {
        a = Math.floor(Math.random() * route.length);
        b = Math.floor(Math.random() * route.length);
    } while (a === b);
    [route[a], route[b]] = [route[b], route[a]];
    return route;
}

// Algoritmo genético principal
function geneticAlgorithm(filename, popSize = 100, generations = 500, mutationRate = 0.1) {
    const cities = readTSPFile(filename);
    const distMatrix = distanceMatrix(cities);
    const numCities = cities.length;
    let population = initializePopulation(popSize, numCities);

    // Variáveis para armazenar o melhor trajeto e melhor distância durante toda a execução
    let melhorTrajeto = population[0];
    let melhorDistancia = 1 / fitness(melhorTrajeto, distMatrix);

    for (let gen = 0; gen < generations; gen++) {
        let newPopulation = [];

        for (let i = 0; i < popSize / 2; i++) {
            let parent1 = selection(population, distMatrix);
            let parent2 = selection(population, distMatrix);

            let child1 = crossover(parent1, parent2);
            let child2 = crossover(parent2, parent1);

            if (Math.random() < mutationRate) child1 = mutate(child1);
            if (Math.random() < mutationRate) child2 = mutate(child2);

            newPopulation.push(child1, child2);
        }

        population = newPopulation;

        // Verifica se existe uma rota melhor do que a atual melhor
        const melhorNaGeracao = population.reduce((best, route) =>
            fitness(route, distMatrix) > fitness(best, distMatrix) ? route : best);

        const distanciaGeracao = 1 / fitness(melhorNaGeracao, distMatrix);

        if (distanciaGeracao < melhorDistancia) {
            melhorDistancia = distanciaGeracao;
            melhorTrajeto = melhorNaGeracao;
        }

        // Mostra progresso a cada 50 gerações
        if (gen % 50 === 0) {
            console.log(`Geração ${gen}, melhor distância até agora: ${melhorDistancia}`);
        }
    }

    // Retorna o melhor trajeto e a menor distância encontrada
    return { bestRoute: melhorTrajeto, bestDistance: melhorDistancia };
}

// Executa o algoritmo com o arquivo .tsp
const { bestRoute, bestDistance } = geneticAlgorithm('santa-catarina.tsp');

// Exibe o melhor trajeto encontrado e sua distância
console.log("Melhor rota encontrada:", bestRoute);
console.log("Distância total da melhor rota:", bestDistance);
