# hexboard [![Dependency Check](http://img.shields.io/david/ryanj/hexboard.svg)](https://david-dm.org/ryanj/hexboard)

## Authentication
Fetch an `ACCESS_TOKEN` from the OpenShift web console at `/oauth/token/request`.

Update your [configuration](#configuration) with the new info:

```bash
export ACCESS_TOKEN="YOUR-ACCESS-TOKEN"
```

Use the information from the browser's `oauth/token/display` page to authenticate using the [`oc`](https://github.com/openshift/origin/releases) cli tool:

```bash
oc login --server=https://$OPENSHIFT_SERVER --token=$ACCESS_TOKEN
```

## Configuration

These config keys will allow you to create services via templates, or run a local hexboard server:

```bash
export APPNAME=sketch
export NAMESPACE=demo
export INIT_REPLICAS=0 
export MAX_REPLICAS=1026 
export APP_ROOT_URL="${NAMESPACE}.apps.example.com"
export PROXY="sketch.${APP_ROOT_URL}"
export PROXY_HOST="sketch.${APP_ROOT_URL}"
export POD_HOST="sketchpod.${APP_ROOT_URL}"
export OPENSHIFT_SERVER="openshift-master.example.com:8443"
export NODEJS_BASE_IMAGE=$( oc get is/nodejs-010-rhel7 -n openshift | grep -v 'NAME' | sed -e "s/^nodejs-010-rhel7\s*\([^\t ]*\).*$/\1/" | sed -e "s/\//\\\\\//g" )
export ACCESS_TOKEN="ExXbbtuE-YOUR-ACCESS-TOKEN-eZ8Z9RQ"
```

Double-check your config keys before proceeding:

```bash
echo $APPNAME
echo $NAMESPACE
echo $INIT_REPLICAS
echo $MAX_REPLICAS
echo $APP_ROOT_URL
echo $PROXY
echo $PROXY_HOST
echo $POD_HOST
echo $OPENSHIFT_SERVER
echo $NODEJS_BASE_IMAGE
echo $ACCESS_TOKEN
```

You should now be ready to deploy the hexboard, or run a local copy using `npm start`.

# Web Workflow

1. Click "Get Started" or "Create +" from the OpenShift project overview page
2. Enter this repo url: [http://github.com/ryanj/sketchpod](http://github.com/ryanj/sketchpod)
3. Choose the Nodejs builder image
4. Confirm the app creation details, show initial scaling factor (1).
5. Navigate to the "Builds" tab in the OpenShift web console, and click "Start Build".
6. Deploy the `advanced_proxy_template` to set up the UI. Open your `$PROXY_HOST` url in a web browser.
7. Scale up to animate the hexboard display (`oc scale rc/sketchpod-1 --replicas=$MAX_REPLICAS`)

# CLI workflow

Create sketchpods with an included proxy and hexboard, with `app_template.json`:

```bash
cat app_template.json | sed -e "s/\${REPLICA_COUNT}/$INIT_REPLICAS/" | sed -e "s/\${APP_ROOT_URL}/$APP_ROOT_URL/g" | sed -e "s/\${APPNAME}/$APPNAME/g" | sed -e "s/\${ACCESS_TOKEN}/$ACCESS_TOKEN/" | sed -e "s/\${OPENSHIFT_SERVER}/$OPENSHIFT_SERVER/" | sed -e "s/\${NAMESPACE}/$NAMESPACE/" | sed -e "s/\${PROXY}/$PROXY/" | sed -e "s/\${NODEJS_BASE_IMAGE}/$NODEJS_BASE_IMAGE/" | oc create -f -
```

Kick off a few builds from the CLI:

```bash
oc start-build sketchpod-build
oc start-build sketchproxy-build
```

When the build completes, scale up the result:

```bash
oc scale rc/sketchpod-1 --replicas=$MAX_REPLICAS
```

## Alternate project templates

Create the proxy (w/o sketchpods) using `proxy_template.json`:

```bash
cat proxy_template.json | sed -e "s/\${REPLICA_COUNT}/$INIT_REPLICAS/" | sed -e "s/\${APP_ROOT_URL}/$APP_ROOT_URL/g" | sed -e "s/\${APPNAME}/$APPNAME/g" | sed -e "s/\${ACCESS_TOKEN}/$ACCESS_TOKEN/" | sed -e "s/\${OPENSHIFT_SERVER}/$OPENSHIFT_SERVER/" | sed -e "s/\${NAMESPACE}/$NAMESPACE/" | sed -e "s/\${PROXY}/$PROXY/" | oc create -f -
```

Advanced proxy (including UI, w/o sketchpods), with `proxy_plus_template.json`:

```bash
cat proxy_plus_template.json | sed -e "s/\${REPLICA_COUNT}/$INIT_REPLICAS/" | sed -e "s/\${APP_ROOT_URL}/$APP_ROOT_URL/g" | sed -e "s/\${APPNAME}/$APPNAME/g" | sed -e "s/\${ACCESS_TOKEN}/$ACCESS_TOKEN/" | sed -e "s/\${OPENSHIFT_SERVER}/$OPENSHIFT_SERVER/" | sed -e "s/\${NAMESPACE}/$NAMESPACE/" | sed -e "s/\${PROXY}/$PROXY/" | oc create -f -
```

Create sketchpods from images with `oc` and `sketchpod_template.json`:

```bash
cat sketchpod_template.json | sed -e "s/\${REPLICA_COUNT}/$INIT_REPLICAS/" | sed -e "s/\${APP_ROOT_URL}/$APP_ROOT_URL/g" | sed -e "s/\${APPNAME}/$APPNAME/g" | sed -e "s/\${ACCESS_TOKEN}/$ACCESS_TOKEN/" | sed -e "s/\${OPENSHIFT_SERVER}/$OPENSHIFT_SERVER/" | sed -e "s/\${NAMESPACE}/$NAMESPACE/" | sed -e "s/\${PROXY}/$PROXY/" | oc create -f -
oc scale rc/sketchpod-1 --replicas=$MAX_REPLICAS
```

Create sketchpods using S2I with `oc` and `sketchpod_s2i_template.json`:

```bash
cat sketchpod_s2i_template.json | sed -e "s/\${REPLICA_COUNT}/$INIT_REPLICAS/" | sed -e "s/\${APP_ROOT_URL}/$APP_ROOT_URL/g" | sed -e "s/\${APPNAME}/$APPNAME/g" | sed -e "s/\${ACCESS_TOKEN}/$ACCESS_TOKEN/" | sed -e "s/\${OPENSHIFT_SERVER}/$OPENSHIFT_SERVER/" | sed -e "s/\${NAMESPACE}/$NAMESPACE/" | sed -e "s/\${PROXY}/$PROXY/" | sed -e "s/\${NODEJS_BASE_IMAGE}/$NODEJS_BASE_IMAGE/" | oc create -f -
oc start-build sketchpod-build
oc scale rc/sketchpod-1 --replicas=$MAX_REPLICAS
```

## Monitoring from the CLI

Watch live API data:

```bash
node client_get.js
```

Count Completed pods:

```bash
oc get pods | grep -v 'CONTAINER' | grep -v deployment | grep -iv Pending | grep -iv 'not ready' | wc -l
```

Count Pending pods:

```bash
oc get pods | grep -v deployer | grep Pending | wc -l
```

### Garbage Collection

To clean up (**WARNING: clears all data in the current project!**):

```bash
oc scale rc/sketchpod-1 --replicas=0
oc delete all --all
```

## License
This code is dedicated to the public domain to the maximum extent permitted by applicable law, pursuant to CC0 (http://creativecommons.org/publicdomain/zero/1.0/)
