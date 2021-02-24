### Betting service simulation

Ce projet ce compose de quatre sous répertoires:

- **client** qui contient le fichier css et le fichier html pour l'affichage de la page front
- **api** qui contient l'implémentation du serveur qui communique en websocket avec le front et en http avec le worker
- **worker** qui contient l'implémentation de la mise en place des workers threads ainsi que leur travail de traitement des paris
- **stress_test** qui contient le script implémenté pour lancer le stress test

Par souci de temps, les tests ont été omis, bien qu'ils soient fondamentaux dans un contexte de production.

Quatre scripts sont liés à ce projet:

- **node api/server.js** lance l'api (websocket: localhost:1111, http: localhost:2222)
- **node worker/worker.js --instances N** lance N instances du worker (nécessite au préalable d'avoir lancé le serveur)
- **npm run start-client** lance le client sur l'url localhost:3000
- **node stress_test/test.js --messages M --sockets N --count L** lance un stress test en montant N sockets, chacune envoyant M messages contenant L paris à placer

### Prérequis

Pour pouvoir pleinement profiter de ce projet, il faut avoir installé un serveur redis en local (port par défaut: 6379), avoir installé nodejs (version 12 utilisée lors de mon développement), et faire un `npm install`
