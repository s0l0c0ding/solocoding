---
published: true
title: Simple template for CI/CD operations on Gitlab
description: In this post, we are going to take a look at Gitlab CI/C pipeline. We will make a template that could be used for ..
date: 2021-01-30
author: Bassem
slug: eng_devops_ci_cd_pipeline-gitlap
photo: https://gitlab.com/gitlab-com/marketing/corporate_marketing/corporate-marketing/-/raw/master/design/gitlab-brand-files/gitlab-logo-files/full-color/line-logo/png/gitlab-line-logo-gray-line-rgb.png
imgCredit: Gitlab
keywords:
  - devops
language: en
output:
  html_document:
    css: post-details.component.css
---

In this post, we are going to take a look at Gitlab CI/C pipeline. We will make a template that could be used for testing and deploying a node application, actually it can be any kind of the application, as long as our build tools are containerized in a docker image.

### Enabling the gitlab pipeline

To get started, we just need to add `.gitlab-ci.yml` at the root of our repository. In this yml file we are going to put all the steps needed. The scripts (normal CLI commands) needed to be run are grouped in jobs and jobs are a part of a stage. Stages are sequential but jobs are parallel. Let's make am example, a typical deploying process consist of the following stages:

- test - code
- build
- test - build
- deploy

Those stages will run in sequential. But the jobs defined in a single stage will be excuted in parallel, for example in test-build stage we can run a smoke test and a performance one etc.

### Writing the template

```yml
image: node
```

At the start of the file, we defined the global docker image to be used in our pipeline. The variable `image` can be used also in a job, in this case the job will be executed with that specific image.

```yml
stages:
  - test
  - build
  - deploy
```

With stages variable we are composing three logical steps: test, build and deploy.

```yml
cache:
  key: ${CI_COMMIT_BRANCH}
  paths:
    - node_modules/
```

To speed our pipeline, we definitely need to cache something between jobs and future pipeline executions. The cache object it's a key value store, composed of a key and a list of paths. For the key I decided to use the current branch name using the [predefined gitlab environment variables](https://docs.gitlab.com/ee/ci/variables/predefined_variables.html).
You can also define your custom environment variable in settings / ci/cd / variables. The paths contain a list of the folders to be saved into the cache. As we are referring to a node project, the `node_module` folder is valid candidate for cashing. In case of a Maven java project, I would recommend to cache the `.m2` folder.

```yml
test-react:
  stage: test
  before_script:
    - npm install
  script:
    - npm run test
```

Let's assume that we are building a react website. In this first job named "test-react" we are installing the node modules in the `before_script`, this keyword consent us to define an array of commands that should run before the job, in other words it's a preparation step. With `script` we are running our tests using `npm run test`. As you can see we used the keyword `stage` to include this job in the test stage.

```yml
build-react:
  stage: build
  artifacts:
    paths:
      - ./build/static
  before_script:
    - npm install
  script:
    - npm run build
```

The above piece of yml defines the build job named "build-react". As our jobs are independent, we need to share the output of this job with the deploying one, so for this purpose, we are using the `artifacts` keyword for saving the output folder of the `npm run build` command which in a typical react application is under `/build/static`. The folder is also kept after the end of the pipeline, you can browse it and download it under the CI/CD section.

```yml
deploy-plarform:
  stage: deploy
    only:
    - master
  script:
    - echo "deploying"
```

And finally the last job is the deploy one, I did not write any example, but you can let your imagination go wild. If your deployment platform has a CLI, you can install it within the script array and execute your workflow. You can also use docker to build and push an image to your registry. Worth mentioning you can use the only keyword to run this job on a specific branch or on merge requests.

### The complete pipeline

```yml
image: node

stages:
  - test
  - build
  - deploy

cache:
  key: ${CI_COMMIT_BRANCH}
  paths:
    - node_modules/
test-react:
  stage: test
  before_script:
    - npm install
  script:
    - npm run test

build-react:
  stage: build
  artifacts:
    paths:
      - ./build/static
  before_script:
    - npm install
  script:
    - npm run build

deploy-plarform:
  stage: deploy
  script:
    - echo "deploying"
```

I hope you find it useful.
