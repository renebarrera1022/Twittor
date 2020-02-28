//imports
importScripts('js/sw-utils.js');

self.skipWaiting();

const CACHE_STATIC = 'static-v2';
const CACHE_DYNAMIC = 'dynamic-v2';
const CACHE_INMUTABLE = 'inmutable';

const appShell = [
    // '/',
    'index.html',
    'pages/offline.html',
    'css/style.css',
    'js/app.js',
    'manifest.json',
    'img/favicon.ico',
    'img/avatars/hulk.jpg',
    'img/avatars/ironman.jpg',
    'img/avatars/spiderman.jpg',
    'img/avatars/thor.jpg',
    'img/avatars/wolverine.jpg'
];

const appShell_Inmutable = [
    'js/libs/jquery.js',
    'css/animate.css',
    'https://fonts.googleapis.com/css?family=Quicksand:300,400',
    'https://fonts.googleapis.com/css?family=Lato:400,300',
    'https://use.fontawesome.com/releases/v5.3.1/css/all.css'
];

function limpiarCache(cName, nItems){
    //Limitando registros en el cache dinámico
    caches.open(cName).then(cache=>{
        cache.keys().then(keys=>{
            if(keys.length > nItems){
                cache.delete(keys[0]).then(limpiarCache(cName, nItems));
            }
        });
    });
}

self.addEventListener('install', e=>{
    //Creando cache estático e inmutable
    const estatico = caches.open(CACHE_STATIC).then(cache=>{
        cache.addAll(appShell);
    });

    const inmutable = caches.open(CACHE_INMUTABLE).then(cache=>{
        cache.addAll(appShell_Inmutable);
    });
    e.waitUntil(Promise.all([estatico, inmutable]));
});

self.addEventListener('activate', e=>{
    //Eliminando versiones antiguas del cache
    const versionCacheS = caches.keys().then(keys=>{
        keys.forEach(k =>{
            if(k !== CACHE_STATIC && k.includes('static')){
                return caches.delete(k);
            }
        });
    });
    const versionCacheD = caches.keys().then(keys=>{
        keys.forEach(k =>{
            if(k !== CACHE_INMUTABLE && k.includes('dynamic')){
                return caches.delete(k);
            }
        });
    });
    e.waitUntil(Promise.all([versionCacheS, versionCacheD]));
});

self.addEventListener('fetch', e=>{
    const respuesta = caches.match(e.request).then(res=>{
        if(res) return res;

        return fetch(e.request).then(newRes=>{
            caches.open(CACHE_DYNAMIC).then(cache=>{
                cache.put(e.request, newRes);
                limpiarCache(CACHE_DYNAMIC, 50);
            });
            return newRes.clone();
        }).catch(offline=>{
            if(e.request.headers.get('accept').includes('text/html')){
                return caches.match('pages/offline.html');
            }
        });
    });
    e.respondWith(respuesta);
});

