---
published: true
title: Docker, SpringBoot & Buildpacks
description: In this post I am going to talk about layers and build stages to improve performance and caching using docker files and buildpacks.
date: 2020-07-04
author: Bassem 
slug: eng_docker_buildpacks
photo: assets/stock/dockerLayers.webp
imgCredit:
keywords:
  - devops
  - spring
  - docker
language: en
tweetId: '1279780867032915969'
output:
  html_document:
    css: post-details.component.css
---
So our application is ready to go online, the best practice is to containerize it first, so we can separate it from the deployment infrastructure and when it comes to app containers we must mention (use) Docker.
<br>
<br>
**Docker**
<br>
Briefly from the [official documentation](https://docs.docker.com/get-started/overview/):
<br>
"Docker provides the ability to package and run an application in a loosely isolated environment called a container. The isolation and security allow you to run many containers simultaneously on a given host. Containers are lightweight because they don’t need the extra load of a hypervisor, but run directly within the host machine’s kernel. This means you can run more containers on a given hardware combination than if you were using virtual machines. You can even run Docker containers within host machines that are actually virtual machines!"
<br>
<br>
**Layers**
<br>
In this post I am going to talk about layers and build stages to improve performance and caching.
The docker image is composed of different layers, each statement in our docker file is a layer. Layers are precise because they can be re-used by multiple images saving disk space and reducing build time while maintaining their integrity. To dive more into the topic, you can see the [docs](https://docs.docker.com/storage/storagedriver/#images-and-layers).
```dockerfile
FROM openjdk:8-jdk-alpine
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} myApp.jar
ENTRYPOINT ["java","-jar","/myApp.jar"]
```
In the above docker file, the from command state that we are going to use an alpine based image (the thinnest linux image) and that is a layer which can be used in another image/build, once it's downloaded. The jar is another layer and so on.
<br>
We can exploit this feature in our application; our app habitually has some dependences, so we can explode our fat jar in differents layers.
<br>
Once the jar is unarchived (for example in target/dependency), we can see the following structure:
```bash
 tree -d -L 2
.
├── BOOT-INF
│   ├── classes
│   └── lib
├── META-INF
│   └── maven
└── org
    └── springframework
```
So we can make this docker file:
```dockerfile
FROM openjdk:8-jdk-alpine
ARG DEPENDENCY=target/dependency
COPY ${DEPENDENCY}/BOOT-INF/lib /app/lib
COPY ${DEPENDENCY}/META-INF /app/META-INF
COPY ${DEPENDENCY}/BOOT-INF/classes /app
ENTRYPOINT ["java","-cp","app:app/lib/*","package.MainClass"]
```
In the first layer we have the application's dependencies, so if they don't change much after the first build, the process will be considerably faster in the subsequent builds. In the second layer we have meta-inf files, like the pom.xml and MANIFEST.MF. And finally we put our application's classes in the app folder, as they are the most dynamic and more likely to change with each new feature, we add to our app (also bug fixes😀). The -cp, or CLASSPATH, is used as an option to the Java command. It is a parameter in the Java Virtual Machine or Java compiler that specifies the location of classes and packages which are defined by the user.
<br>
In addition we can use docker [multi-stage build](https://docs.docker.com/develop/develop-images/multistage-build/), if we want to make our jar inside the docker build process.
<br>
<br>

**Cloud Native Buildpacks**
<br>
Cloud Native Buildpacks (CNB) is a specification and a set of tools that consent us to produce and operate modular container build stages called “buildpacks”.
<br>
Buildpacks are another way to build images compared to DockerFiles, it is used in many cloud platforms. The builder attempts to autodetect the language of our source code, by testing groups of buildpacks against the source code. The first group that fits, will become the selected set of buildpacks for the app and the code will be converted into a runnable application image in autonomy.
<br>
In [Cloud Native Buildpacks](https://buildpacks.io/docs/concepts/) the builder is the image wich contain the internal operating system and all the bits of information to build our app.
To use CNB we have to install the [pack tool](https://buildpacks.io/docs/install-pack/), select our builder and run the following command in our maven project directory:
```bash
pack build myapp --builder cnbs/example-builder:bionic
```
<br>

**Maven Plugin and Paketo**
<br>
Therefore do I have to install tools or creat a builder to use Buildpacks? The short answer in no, the team of spring boot did the hard  work in their [Spring Boot Maven Plugin](https://docs.spring.io/spring-boot/docs/2.3.0.RELEASE/maven-plugin/reference/html/#introduction), we have only to configure it, if we want (Spring-boot 2.3+).
<br>
The plugin use the [Paketo Buildpacks](https://paketo.io/) to build images, assuring continuous patching in response to vulnerabilities and updates. Paketo are:
<br>
>"Modular Buildpacks, written in Go. Paketo Buildpacks provide language runtime support for applications. They leverage the Cloud Native Buildpacks framework to make image builds easy, performant, and secure."
<br>

The buildpack used for springboot apps can be found [here](https://github.com/paketo-buildpacks/spring-boot), as you can see in the buildpack.toml, the base image is an ubuntu bionic.
```markup
[[stacks]]
id = "io.buildpacks.stacks.bionic"
```
```bash
mvn spring-boot:build-image
```
Running the above maven command on our project will creat an OCI image (The Open Container Initiative format; historically, each Container Engine had its container images format. Docker, LXD, and RKT all had their own image formats.) using Cloud Native Buildpacks.The plugin will communicate with the installed docker daemon locally.
<br>
The image produced will be named as our project's artifact, the tag will be our version and will be composed only from one layer. 
An output example:
```markup
[INFO] --- spring-boot-maven-plugin:2.3.1.RELEASE:build-image (default-cli) @ famous ---
[INFO] Building image 'docker.io/library/famous:0.0.2'
[INFO] 
[INFO]  > Pulling builder image 'gcr.io/paketo-buildpacks/builder:base-platform-api-0.3' 2%
...
INFO]  > Running creator
[INFO]     [creator]     ===> DETECTING
[INFO]     [creator]     5 of 15 buildpacks participating
[INFO]     [creator]     paketo-buildpacks/bellsoft-liberica 2.8.0
[..
[INFO]     [creator]     ===> ANALYZING
[INFO]     [creator]     Previous image with name "docker.io/library/famous:0.0.2" not found
[INFO]     [creator]     ===> RESTORING
[INFO]     [creator]     ===> BUILDING
[INFO]     [creator]     
[INFO]     [creator]     Paketo BellSoft Liberica Buildpack 2.8.0
[INFO]     [creator]       https://github.com/paketo-buildpacks/bellsoft-liberica
[INFO]     [creator]       Build Configuration:
[INFO]     [creator]         $BP_JVM_VERSION              8.*             the Java version
[INFO]     [creator]       Launch Configuration:
[INFO]     [creator]         $BPL_JVM_HEAD_ROOM           0               the headroom in memory calculation
[INFO]     [creator]         $BPL_JVM_LOADED_CLASS_COUNT  35% of classes  the number of loaded classes in memory calculation
[INFO]     [creator]         $BPL_JVM_THREAD_COUNT        250             the number of threads in memory calculation
[INFO]     [creator]       BellSoft Liberica JRE 8.0.252: Contributing to layer
..........
[INFO]     [creator]     Adding layer 'paketo-buildpacks/bellsoft-liberica:security-providers-configurer'
[INFO]     [creator]     Adding layer 'paketo-buildpacks/executable-jar:class-path'
[INFO]     [creator]     Adding 1/1 app layer(s)
[INFO]     [creator]     Adding layer 'config'
[INFO]     [creator]     *** Images (260763d35c24):
[INFO]     [creator]           docker.io/library/famous:0.0.2
[INFO] 
[INFO] Successfully built image 'docker.io/library/famous:0.0.2'
[INFO] 
```
As you can see from the log, much stuff is configured in autonomy, for instance the java version.
<br>
We can change the image name by using the name parameter in the plugin configuration:
```xml
<configuration>
	<image>
		<name>example.com/library/${project.artifactId}</name>
	</image>
</configuration>
``` 
And by adding the `<layers>` property in our pom.xml, we are separating BOOT-INF/classes and BOOT-INF/lib further:
```xml
<build>
	<plugins>
		<plugin>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-maven-plugin</artifactId>
			<version>2.3.0.RELEASE</version>
			<configuration>
        		<layers>
					<enabled>true</enabled>
				</layers>
			</configuration>
		</plugin>
	</plugins>
</build>
```


By default, the following layers are defined:
- *dependencies* for any dependency whose version is not a SNAPSHOT.
- *spring-boot-loader* for the jar loader classes.
- *snapshot-dependencies* for any dependency whose version is a SNAPSHOT.
- *application* for application classes and resources.
<br>

When we run the builder, we can see the layers created:
```markup
...
[INFO]     [creator]     Adding layer 'paketo-buildpacks/executable-jar:class-path'
[INFO]     [creator]     Adding layer 'paketo-buildpacks/spring-boot:web-application-type'
[INFO]     [creator]     Adding 5/5 app layer(s)
...
```

The layer order is important for the caching process. Libs that is not going to change frequently goes fist and vice versa. We can customize all the process by adding a [layers.xml](https://docs.spring.io/spring-boot/docs/2.3.0.RELEASE/maven-plugin/reference/html/#repackage-layers-configuration) and the property `<configuration>` in the plugin configuration:
```xml
...
<configuration>
	<layers>
		<enabled>true</enabled>
		<configuration>${project.basedir}/src/layers.xml</configuration>
	</layers>
</configuration>
...
```

For more custom option, like evn variabels, cleanCache and others take a look at the [documentation](https://docs.spring.io/spring-boot/docs/2.3.0.RELEASE/maven-plugin/reference/html/#build-image-customization).
<br>
That is it; I hope you find it useful. 
