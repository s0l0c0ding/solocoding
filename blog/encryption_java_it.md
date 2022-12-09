---
published: true
title: Crittografia in Java
description: In questo articolo vediamo come crittografare un testo con java senza utilizzare alcun framework o dipendenze .................
date: 2022-12-09
author: Bassem 
slug: it_java_encryption_aes
photo: assets/stock/encryption.webp
imgCredit: 'Markus Spiske on pexels.com'
keywords:
  - java
  - spring
  - security
  - quarkus
language: it
tweetId: ''
output:
  html_document:
    css: post-details.component.css
---
Molte volte, abbiamo a che fare con le credenziali degli utenti nelle nostre applicazioni e, come tutti sanno, non conserviamo le password come testo chiaro nei nostri database. Esistono due metodi per archiviare le password nel database mediante `hashing` o crittografia.
<br>
In questo articolo vediamo come crittografare un testo con java senza utilizzare nessun framework o dipendenze.

### Differenza tra crittografia e hashing

Con parole semplici, la crittografia è una funzione bidirezionale, che prende un testo in chiaro e restituisce un testo cifrato. Il testo crittografato può essere decrittografato conoscendo la chiave con cui è stata effettuata la crittografia. D'altra parte, l'hashing è una funzione unidirezionale, dato un testo in chiaro, il risultato viene codificato in un `digest` univoco.
<br>
Tecnicamente, l'hashing di una stringa può essere invertito, ma la potenza di calcolo necessaria per decifrarla è enorme (fino ad oggi).
<br>
Possiamo utilizzare l'hashing per memorizzare le password del sistema, quando un utente accede alla applicazione, la password viene sottoposta alla operazione di hashing e confrontata con il digest memorizzato nel database. In questo modo la password viene nascosta e non esposta in caso di fuga di dati. 
<br>
Ma a volte abbiamo bisogno di utilizzare la crittografia, ad esempio se il nostro sistema è connesso a diversi sistemi esterni protetti, dobbiamo archiviare le credenziali crittografate e successivamente decodificarle per ottenere un token dal partenr esterno e utilizzare il servizio fornito. In questo caso l'hashing non aiuta.

### Cosa andiamo ad usa?

Usiamo il pacchetto `javax.crypto`, che ci fornisce varie operazioni crittografiche, possiamo leggere la seguente descrizione nei documenti officiali java:

"Fornisce le classi e le interfacce per le operazioni di crittografia. Le operazioni crittografiche definite in questo pacchetto includono la crittografia, la generazione della chiave e l'accordo sulla chiave e la generazione del codice di autenticazione del messaggio (MAC).
Il supporto per la crittografia include cifrari simmetrici, asimmetrici, a blocchi ed a flusso. Questo pacchetto supporta anche flussi sicuri e oggetti sigillati.
Molte delle classi fornite in questo pacchetto sono basate su provider. La classe stessa definisce un'interfaccia di programmazione su cui le applicazioni possono scrivere. Le implementazioni stesse possono quindi essere scritte da fornitori di terze parti indipendenti e collegate senza problemi secondo necessità. Pertanto, gli sviluppatori di applicazioni possono trarre vantaggio da qualsiasi numero di implementazioni basate su provider senza dover aggiungere o riscrivere il codice."

### Esempio di codice

Scriviamo una classe di utilità chiamata `AesEncryptionUtil`, che ha il seguente costruttore:
```java
	private static final String AES = "AES";
	private final Key key;
   
    public AesEncryptionUtil(String pwdKey) {
        final byte[] decodedPwd = Base64.getDecoder().decode(pwdKey);
        this.key = new SecretKeySpec(decodedPwd, AES);
    }
```
Come possiamo vedere sopra, stiamo creando un oggetto `Key`, che viene utilizzato in seguito per costruire l'oggetto `Cipher`. La chiave è composta da qualsiasi matrice di byte e da un algoritmo. Stiamo passando una stringa di chiavi codificata in base64 (AES supporta solo dimensioni di chiave di 16, 24 o 32 byte) e come algoritmo usiamo `The Advanced Encryption Standard` [AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard). 
<br>

Quindi creiamo un metodo di crittografia:
```java
    private static final String AES_GCM_NO_PADDING = "AES/GCM/NoPadding";
  	private static final int IV_LENGTH = 12;
    private static final int T_LEN = 96;
    
	public String encrypt(String text) {
        byte[] iv = new byte[IV_LENGTH];
        (new SecureRandom()).nextBytes(iv);

        Cipher cipher = Cipher.getInstance(AES_GCM_NO_PADDING);
        GCMParameterSpec ivSpec = new GCMParameterSpec(T_LEN, iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, ivSpec);

        byte[] ciphertext = cipher.doFinal(text.getBytes(StandardCharsets.UTF_8));
        byte[] encrypted = new byte[iv.length + ciphertext.length];
        System.arraycopy(iv, 0, encrypted, 0, iv.length);
        System.arraycopy(ciphertext, 0, encrypted, iv.length, ciphertext.length);

        return Base64.getEncoder().encodeToString(encrypted);
    }
```
Innanzitutto, creiamo un byte di array casuale per `Parametro Iv`. IV sta per vettore di inizializzazione, è un numero che viene utilizzato insieme alla `SecretKey` durante la crittografia. L'IV aggiunge casualità all'inizio del processo di crittografia, viene utilizzato solo una volta. L'IV dovrebbe essere sempre di 12 byte.
<br> 
Quindi creiamo l'oggetto `Cipher` con l'implementazione di `AES/GCM/NoPadding`, dove `AES` è l'algoritmo, `GCM` è la modalità e `NoPadding` è lo schema di riempimento. Ulteriori informazioni possono essere trovate su [java doc](https://docs.oracle.com/javase/7/docs/technotes/guides/security/StandardNames.html#Cipher).
<br>
Definiamo anche i parametri richiesti da un Cipher, creando un oggetto `GCMParameterSpec`, dove prende il vettore di inizializzazione e la lunghezza (in bit) del tag di autenticazione. Costruiamo anche `Cipher` nella modalità `ENCRYPT_MODE`.
<br>
Infine, criptiamo il testo chiamando `cipher.doFinal`, lo copiamo in un nuovo Array e restituiamo il testo in Base64 per assicurarci che sia intatto quando viene trasferito.
<br>

Ed ecco il metodo di decrittazione:
```java
 public String decrypt(String encryptedText) {
        byte[] decoded = Base64.getDecoder().decode(encryptedText);

        byte[] iv = Arrays.copyOfRange(decoded ,0 , IV_LENGTH);

        Cipher cipher = Cipher.getInstance(AES_GCM_NO_PADDING);
        GCMParameterSpec ivSpec = new GCMParameterSpec(T_LEN, iv);
        cipher.init(Cipher.DECRYPT_MODE, key, ivSpec);

        byte[] decryptedText = cipher.doFinal(Arrays.copyOfRange(decoded, IV_LENGTH, decoded.length));

        return new String(decryptedText, StandardCharsets.UTF_8);
    }
```
Sono gli stessi passaggi logici utilizzati nel metodo encrypt, decodifichiamo il testo crittografato e lo decodifichiamo con l'oggetto `Cipher` in modalità `DECRYPT_MODE` .
<br>
<br>
Questo è tutto; tutto il codice scritto in questo post si trova su [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/aes-encryption).
