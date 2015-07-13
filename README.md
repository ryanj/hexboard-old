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
export APPNAME=sketchpod
export NAMESPACE=hexboard
export INIT_REPLICAS=0 
export MAX_REPLICAS=1026 
export HEXBOARD_HOST="http://localhost:1080"
export OPENSHIFT_SERVER="localhost:8443"
export ACCESS_TOKEN="ExXbbtuE-YOUR-ACCESS-TOKEN-eZ8Z9RQ"
```

Double-check your config keys before proceeding:

```bash
echo $APPNAME
echo $NAMESPACE
echo $INIT_REPLICAS
echo $MAX_REPLICAS
echo $HEXBOARD_HOST
echo $OPENSHIFT_SERVER
echo $ACCESS_TOKEN
```

You should now be ready to deploy the hexboard, or run a local copy using `npm start`.

## Install the Template
You can optionally install the application template, making it easier to launch:

```bash
oc project hexboard
oc process -v="ACCESS_TOKEN=$ACCESS_TOKEN" -f app_template.json | oc create -f -
```

# Web Workflow

1. Create a 'hexboard' project
2. Click "Get Started" or "Create +" from the hexboard project overview page
3. Select the hexboard template (instant app).
4. Confirm the app creation details, update the `ACCESS_TOKEN`, `HEXBOARD_HOST`, and `OPENSHIFT_SERVER` fields as needed.
5. Navigate to the "Builds" tab in the OpenShift web console, and start each of the builds.
6. Expose the `sketchpod` service via an external route (`oc expose se/sketchpod --hostname="${HEXBOARD_HOST}"`)
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
