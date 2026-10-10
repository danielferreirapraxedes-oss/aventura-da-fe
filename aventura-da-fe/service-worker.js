const CACHE_NAME = "aventuradafe-v1";

const arquivos = [
    "./",
    "./index.html",
    "./sprites/jogador-baixo.png",
    "./sprites/jogador-cima.png",
    "./sprites/jogador-esquerda.png",
    "./sprites/jogador-direita.png",
    "./sprites/pastor.png",
    "./sprites/igreja.png",
    "./sprites/arvore.png",
    "./sprites/barraca.png"
];

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(arquivos))
    );
});

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request)
        .then(response => response || fetch(e.request))
    );
});