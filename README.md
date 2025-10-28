
#  Applicazione Mobile FASTGO

## Descrizione

Questa repository contiene il codice sorgente per l'applicazione mobile "FASTGO". L'applicazione è realizzata utilizzando React Native ed Expo e permette agli utenti di visualizzare ristoranti, consultare i menu, aggiungere piatti al carrello e simulare un processo di ordinazione con selezione della posizione di consegna.

## Tecnologie Utilizzate

* **Framework:** React Native con Expo
* **Linguaggio:** TypeScript
* **Navigazione:** Expo Router, React Navigation
* **Gestione dello Stato:** React Context (per l'indirizzo IP del backend), AsyncStorage (per carrello, ordini, IP)
* **UI Components:** Componenti React Native standard, React Native Vector Icons, React Native Maps
* **API & Funzionalità:** Expo Location (per geolocalizzazione e reverse geocoding)

## Funzionalità Principali

* **Configurazione Backend:** Schermata iniziale per inserire e salvare l'indirizzo IP del server backend.
* **Homepage:** Visualizzazione dei ristoranti disponibili (categorie) e dei piatti più popolari, con funzionalità di ricerca.
* **Visualizzazione Menu:** Schermata dedicata per visualizzare il menu di un ristorante selezionato.
* **Gestione Carrello:** Possibilità di aggiungere articoli al carrello, visualizzare il riepilogo e rimuovere articoli. Il carrello è persistente per ogni ristorante tramite AsyncStorage.
* **Pagamento (Simulato):**
    * Selezione del metodo di pagamento (Contanti, Carta di credito, PayPal).
    * Selezione della posizione di consegna tramite mappa interattiva (`react-native-maps`) o geolocalizzazione automatica (`expo-location`).
    * Invio dei dettagli dell'ordine (coordinate, indirizzo, articoli) al backend.
    * Salvataggio locale della cronologia ordini.
* **Profilo Utente:** Schermata per effettuare il logout (rimozione dell'IP salvato).

## Struttura del Progetto

Il progetto segue la struttura definita da Expo Router basata su file system:

* `app/`: Contiene le route principali dell'applicazione.
    * `(tabs)/`: Definisce le schermate all'interno della navigazione a schede (Home, User).
    * `menuScreen.tsx`: Schermata per la visualizzazione del menu.
    * `cart.tsx`: Schermata del carrello.
    * `payment.tsx`: Schermata di pagamento.
    * `ip.tsx`: Schermata per l'inserimento dell'IP.
    * `_layout.tsx`: Layout principale dell'app.
* `components/`: Componenti React riutilizzabili.
* `constants/`: Costanti come colori, stili, ecc.
* `context/`: Context API per la gestione dello stato globale (es. AuthContext per l'IP).
* `hooks/`: Custom hooks React.
* `assets/`: Immagini, font e altre risorse statiche.

## Installazione ed Esecuzione

1.  Clonare la repository:
    ```bash
    git clone <URL_REPOSITORY>
    cd wot-project-2024-2025-part1-Grassi-Massari-Santantonio
    ```
2.  Installare le dipendenze:
    ```bash
    npm install
    # o
    yarn install
    ```
3.  Avviare l'applicazione con Expo:
    ```bash
    npx expo start
    ```
4.  Seguire le istruzioni nel terminale per aprire l'app su un emulatore/simulatore o su un dispositivo fisico tramite l'app Expo Go.

## Configurazione

Al primo avvio, l'applicazione richiederà l'inserimento dell'indirizzo IP del server backend. Inserire l'indirizzo corretto per permettere all'app di caricare i dati dei ristoranti e dei menu.

## Autori

* Francesco Grassi
* Daniele Massari
* Alessio Santantonio
