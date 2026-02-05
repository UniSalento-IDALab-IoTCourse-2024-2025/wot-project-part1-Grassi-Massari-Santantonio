# FastGo - Piattaforma di Delivery IoT & Blockchain

![Architettura del Sistema](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-2024-2025-part1-Grassi-Massari-Santantonio/blob/main/Arc_semplice3.jpeg?raw=true)

## Panoramica del Progetto
FastGo è una piattaforma logistica e di food delivery di nuova generazione che integra tecnologie Internet of Things (IoT), Machine Learning e Blockchain per garantire l'integrità delle merci trasportate. A differenza dei servizi di consegna tradizionali, che si limitano a tracciare la posizione geografica del pacco, FastGo sposta il focus sulla **garanzia della qualità** del trasporto. Il sistema monitora attivamente le condizioni fisiche della spedizione (vibrazioni, urti, orientamento e temperatura) durante l'intero processo, utilizzando sensori embedded. Questi dati telemetrici vengono analizzati per calcolare un "Damage Score" (Punteggio di Danno), assicurando che i clienti ricevano i loro ordini in condizioni ottimali e fornendo prove tangibili in caso di deterioramento della merce.

Oltre al monitoraggio, la piattaforma introduce un innovativo livello di gamification trasparente: i corrieri (Rider) vengono valutati non tramite recensioni soggettive, ma sulla base della qualità oggettiva della loro guida e della cura nel trasporto. L'eccellenza operativa viene premiata attraverso certificati digitali immutabili (NFT) coniati sulla blockchain di Ethereum. Questo crea un sistema di reputazione "trustless", dove i Rider possono dimostrare professionalmente le proprie competenze e accedere a livelli di servizio superiori, mentre i commercianti e i clienti ottengono una trasparenza senza precedenti sulla filiera distributiva.

## Architettura del Sistema
L'ecosistema FastGo è costruito su una **Architettura a Microservizi** modulare, progettata per garantire scalabilità, tolleranza ai guasti e una netta separazione delle responsabilità. L'infrastruttura backend è composta da cinque servizi core sviluppati in **Spring Boot** (Auth, Client, Rider, Shop e Blockchain), ognuno dei quali gestisce il proprio database **MongoDB** dedicato, aderendo rigorosamente al pattern architetturale *Database-per-Service* per assicurare il disaccoppiamento dei dati.

La comunicazione tra i servizi sfrutta un approccio di messaggistica ibrido e resiliente:
1.  **RabbitMQ (AMQP):** Gestisce la sincronizzazione asincrona dei dati tra i microservizi e l'orchestrazione dei processi in stile RPC (Remote Procedure Call), garantendo la coerenza eventuale dell'intero sistema distribuito anche in caso di picchi di carico.
2.  **Mosquitto (MQTT):** Gestisce i flussi di dati provenienti dai dispositivi IoT e invia aggiornamenti di stato in tempo reale alle interfacce frontend tramite WebSockets, permettendo un tracking fluido e reattivo.

Il livello IoT è costituito dal dispositivo **ST Microelectronics SensorTile Box Pro**, controllato da un **RaspberryPi 5** tramite un firmware custom in C++. Questi dispositivi operano nell'edge, acquisendo dati ambientali e inerziali che vengono trasmessi via Bluetooth Low Energy (BLE) all'applicazione mobile del Rider. I dati grezzi vengono poi processati da un **Motore di Inferenza dedicato in Python** a bordo dello stesso RaspberryPi 5, che utilizza un modello Random Forest pre-addestrato per classificare eventi critici di trasporto (come cadute, impatti o ribaltamenti) e calcolare le metriche di stabilità termica.

Infine, il **Web3 Gateway** agisce come ponte sicuro verso la tecnologia decentralizzata, interagendo con la testnet **Ethereum Sepolia** tramite la libreria **Web3j**. Questo modulo gestisce l'esecuzione degli Smart Contracts per la notarizzazione degli ordini (rendendo i log di consegna immutabili) e per la distribuzione dei Badge ERC-721, i cui metadati sono ancorati in modo permanente su **IPFS** tramite Pinata. L'esperienza utente è erogata attraverso una dashboard web in React per i clienti, i rider e i negozianti, e un'applicazione mobile cross-platform in React Native che permette ai clienti di ordinare e ai rider di gestire le consegne.

### Schema Tecnico dei Flussi Dati
![Diagramma Tecnico Microservizi e IoT](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-2024-2025-part1-Grassi-Massari-Santantonio/blob/main/Archittetura.png?raw=true)


## Ecosistema FastGo - Progetti Correlati

Di seguito la lista completa dei repository che compongono il sistema IoT FastGo.

### Backend & Infrastruttura
* [**Auth Service**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part1-Auth_Service-Grassi-Massari-Santantonio) - Gestisce registrazione, login (JWT) e sincronizzazione utenti.
* [**Client Service**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part2-Client_Service-Grassi-Massari-Santantonio) - Gestisce i profili dei clienti e lo storico ordini.
* [**Rider Service**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part3-Rider_Service-Grassi-Massari-Santantonio) - Gestisce i corrieri, la geolocalizzazione e l'assegnazione ordini.
* [**Shop Service**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part5-Shop_Service-Grassi-Massari-Santantonio) - Gestisce i ristoranti, i menu e il ciclo di vita dell'ordine.
* [**Message Broker**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part4-Message_Broker-Grassi-Massari-Santantonio) - Configurazione Docker per RabbitMQ e Mosquitto (MQTT).

### Frontend & Mobile
* [**Frontend Web**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part8-Frontend-Grassi-Massari-Santantonio) - Dashboard React per Amministratori, Ristoratori e Clienti.
* [**App Rider**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part15-App_Rider-rassi-Massari-Santantonio) - App mobile per corrieri con connessione BLE al sensore e gestione consegne.
* [**App User**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part15-App_Rider-Grassi-Massari-Santantonio) - App mobile per clienti per ordinare e tracciare le consegne in tempo reale.

### IoT, AI & Sensori
* [**Sensor Tile Firmware**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part14-Sensor_Tile-Grassi-Massari-Santantonio) - Codice C++ per l'acquisizione dati dal dispositivo SensorTile Box Pro.
* [**Bluetooth Gateway**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part11-Bluetooth-Grassi-Massari-Santantonio) - Servizio Python per interfacciare il sensore BLE con il cloud tramite MQTT.
* [**Inference Engine**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part12-Inference-Grassi-Massari-Santantonio) - Modulo di analisi dati per valutare la qualità del trasporto.
* [**AI Training**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part13-Training-Grassi-Massari-Santantonio) - Script per la generazione del dataset e l'addestramento del modello ML.

### Blockchain & Web3
* [**Blockchain Service**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part7-BlockchainService-Grassi-Massari-Santantonio) - Gateway Java/Web3j per la notarizzazione e gestione NFT.
* [**Smart Contract: Tracking**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part10-Contract_Blockchain-Grassi-Massari-Santantonio) - Contratto Solidity per la registrazione immutabile degli ordini.
* [**Smart Contract: NFT**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part9-Contract_NFT-Grassi-Massari-Santantonio) - Contratto ERC-721 per la gestione dei Badge premio per i rider.

[**Project Presentation Page**](https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-2024-2025-part1-Grassi-Massari-Santantonio/tree/main)



# FastGo Authentication Service

Questo repository contiene il microservizio di autenticazione e gestione utenti per la piattaforma FastGo. È sviluppato in Java Spring Boot e funge da **Identity Provider** centralizzato. Gestisce la registrazione, il login tramite JWT, la gestione dei ruoli e la sincronizzazione dei dati utente con gli altri microservizi tramite RabbitMQ.

## Struttura del Progetto

.
├── src/main/java/com/fastgo/authentication/fatsgo_authentication/
│   ├── config/             # Configurazione Security, RabbitMQ, Cloudinary
│   ├── restControllers/    # Endpoint API (Login, Registrazione, Admin)
│   ├── service/            # Logica di business e orchestrazione RabbitMQ
│   ├── security/           # Filtri JWT e utility di sicurezza
│   ├── domain/             # Entità MongoDB (User, Role, ecc.)
│   ├── repositories/       # Interfacce MongoRepository
│   └── dto/                # Data Transfer Objects
├── src/main/resources/
│   └── application.properties # Configurazione applicativa
├── docker-compose.yml      # Orchestrazione container
└── build.gradle            # Gestione dipendenze Gradle

## Prerequisiti

* Java JDK 17 o superiore
* MongoDB (locale o container)
* RabbitMQ (per la sincronizzazione eventi)
* Account Cloudinary (per upload immagini profilo)

## Configurazione

Il servizio richiede la configurazione delle seguenti proprietà nel file `src/main/resources/application.properties` o tramite variabili d'ambiente:

1. Database (MongoDB):
   spring.data.mongodb.uri=mongodb://authdb:27017/mydatabase

2. RabbitMQ (Messaging):
   spring.rabbitmq.host=localhost (o IP container)
   spring.rabbitmq.port=5672
   spring.rabbitmq.username=guest
   spring.rabbitmq.password=guest

3. Cloudinary (Immagini):
   Richiede una classe di configurazione con:
   cloud_name, api_key, api_secret

## Compilazione e Avvio

1. Clean e Build:
   ./gradlew clean build

2. Avvio Applicazione:
   ./gradlew bootRun


## Architettura e Flusso di Sincronizzazione

Il servizio utilizza un pattern di **Sincronizzazione Asincrona** per mantenere la coerenza dei dati distribuiti.

Quando un utente (Rider, Shopkeeper o Client) si registra:
1. L'utente viene salvato su MongoDB con stato "Non Sincronizzato".
2. Viene inviato un messaggio RPC su RabbitMQ all'exchange `sync-exchange` con routing key specifica (es. `rider.sync.request`).
3. Il microservizio di destinazione (es. fastgo_rider) riceve il dato, crea il profilo locale e risponde "OK".
4. Se la risposta è positiva, l'utente viene confermato nel DB di Auth. Se fallisce, viene effettuato il rollback (cancellazione).

## API Endpoints

### Autenticazione (/auth)
* POST /auth/login
  Effettua il login e restituisce un token JWT (Bearer Token).
  Payload: { "username": "...", "password": "..." }

### Registrazione (/registration)
* POST /registration/client - Registra un nuovo Cliente.
* POST /registration/rider - Registra un nuovo Rider.
* POST /registration/shopkeeper - Registra un nuovo Venditore.
* POST /registration/upload - Carica immagine profilo su Cloudinary.
* GET /registration/geocode - Proxy verso OpenStreetMap (Nominatim) per ottenere coordinate da indirizzi.

### Amministrazione (/admin)
Richiede Header `Authorization: Bearer <TOKEN_ADMIN>`

* GET /admin/users/rider - Lista tutti i rider.
* GET /admin/users/shopkeeper - Lista tutti i venditori.
* GET /admin/users/{id} - Dettagli specifici utente.
* PATCH /admin/users/status - Modifica lo stato utente (es. attivazione/ban).

## Ruoli Gestiti

* USER (Cliente)
* RIDER
* SHOPKEEPER
* ADMIN

