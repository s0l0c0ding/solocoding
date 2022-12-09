---
published: true
title: Encryption in plain Java
description: In this article we are going to see how encrypt a string in plain java without using any framework or dependency .................
date: 2022-12-09
author: Bassem 
slug: eng_java_encryption_aes
photo: assets/stock/encryption.webp
imgCredit: 'Markus Spiske on pexels.com'
keywords:
  - java
  - spring
  - security
  - quarkus
language: en
tweetId: ''
output:
  html_document:
    css: post-details.component.css
---
Many times, we have to deal with users credentials in our applications and as everyone know we do not store plain passwords in our databases. There are two methods to store passwords, by hashing or encryption.
<br>
In this article we are going to see how encrypt a string in plain java without using any framework or dependency.

### Difference between encryption and hashing

In simple words, encryption is a two-way function, which takes a plain text and returns a ciphertext. The encrypted text can be decrypted knowing the key with it, the encryption has been made. On the other hand, hashing is one-way function, given a plain text, the result will be scrambled into a unique digest.
<br>
Technically, hashing a string can be reversed, but the computational power needed to decrypt it is huge (until today).
<br>
We can use hashing to store passwords of the system, when a user logs in the application, the password is hashed and compared with the digest stored in the database. In this way the password is hidden and not exposed if the there is a data leak. 
<br>
But sometimes we need to use encryption, for example if our system is connected to different protected enablers, we have to store the credentials encrypted and later decrypt it to get a token from the enabler and use the service provided. In this case hashing will not help.

### What are we going to use?

We will make use of the `javax.crypto` package, which provide us various cryptographic operations, we can read the following description in the java official docs:

"Provides the classes and interfaces for cryptographic operations. The cryptographic operations defined in this package include encryption, key generation and key agreement, and Message Authentication Code (MAC) generation.
Support for encryption includes symmetric, asymmetric, block, and stream ciphers. This package also supports secure streams and sealed objects.
Many of the classes provided in this package are provider-based. The class itself defines a programming interface to which applications may write. The implementations themselves may then be written by independent third-party vendors and plugged in seamlessly as needed. Therefore application developers may take advantage of any number of provider-based implementations without having to add or rewrite code."

### Code example

We will create an utility class called `AesEncryptionUtil`, which will have the following constructor:
```java
	private static final String AES = "AES";
	private final Key key;
   
    public AesEncryptionUtil(String pwdKey) {
        final byte[] decodedPwd = Base64.getDecoder().decode(pwdKey);
        this.key = new SecretKeySpec(decodedPwd, AES);
    }
```
As we can see above, we are creating a `Key` object, which will be used later to initiate the `Cipher` object. The key is composed of any byte array and an algorithm. We are passing a key string encoded in base64 (AES only supports key sizes of 16, 24 or 32 bytes) and as algorithm we will use The Advanced Encryption Standard [AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard). 
<br>

Then we create an encryption method:
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
First, we create a random array byte for `Iv parameter`. The IV stands for Initialization Vector, it is a number which will be used along with SecretKey during encryption. The IV adds randomness to the start of the encryption process, it will be used only once. The IV should always be 12 bytes. 
<br> 
Then we create the `Cipher` object with implementation of `AES/GCM/NoPadding`, where `AES` is the algorithm, `GCM` is the mode and `NoPadding` is the padding scheme. More information can be found on the [official java docs](https://docs.oracle.com/javase/7/docs/technotes/guides/security/StandardNames.html#Cipher).
<br>
We define also the parameters required by a Cipher, by making a `GCMParameterSpec` object, where it takes the initialization vector and the length (in bits) of authentication tag. We also initiate the `Cipher` in the `ENCRYPT_MODE` mode.
<br>
Finally, we encrypt the text by calling the `cipher.doFinal`, we copy it in a new Array and we return the text in Base64 to make sure that it's intact when it is transferred.
<br>

And here is the decrypt method:
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
It is the same logic steps used in the encrypt method, we decode the encrypted text, and we decrypt it with `Cipher` object in `DECRYPT_MODE` mode.
<br>
<br>
That's it; all the code written in this post can be found on [GitHub](https://github.com/s0l0c0ding/spring-tips/tree/master/aes-encryption).
