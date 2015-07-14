# hexboard [![Dependency Check](http://img.shields.io/david/ryanj/hexboard.svg)](https://david-dm.org/ryanj/hexboard)

Container vizualization for [OpenShift platformV3](http://openshift.com).  As featured in the [Red Hat Summit 2015 - JBoss Keynote demo](https://www.youtube.com/watch?v=wWNVpFibayA&t=26m48s)

## Hardware

*TODO:* 

* Add a link to DevNation pulse session
* Add link to ansible scripts

To use a VM, follow the setup instructions from [this workshop](http://bit.ly/v3devs)

## Authentication
After setting up your OpenShiftV3 cluster, fetch an access token on the web, at `$OPENSHIFT_SERVER/oauth/token/request`.

Update your [configuration](#configuration) with the new info:

```bash
export ACCESS_TOKEN="YOUR-ACCESS-TOKEN"
export OPENSHIFT_SERVER="localhost:8443"
```

Use the information from the browser's `oauth/token/display` page to authenticate using the [`oc`](https://github.com/openshift/origin/releases) cli tool:

```bash
oc login --server=https://$OPENSHIFT_SERVER --token=$ACCESS_TOKEN
```

## Create a new Project
Create a new `hexboard` project on the web.

### Install the Template
Install the application template, making it easy to launch from the web or CLI:

```bash
oc project hexboard
oc create -f app_template.json
```

## Configuration

These config keys can be used for running the demo locally:

```bash
export HEXBOARD_UI_SIZE=32 
export HEXBOARD_HOST="localhost:8080"
export OPENSHIFT_SERVER="localhost:8443"
export ACCESS_TOKEN="ExXbbtuE-YOUR-ACCESS-TOKEN-eZ8Z9RQ"
```

To run the same code inside a VM, you'll need to make a few adjustments:

```bash
export HEXBOARD_HOST="localhost:1080"
export OPENSHIFT_SERVER="172.17.42.1:8443"
```

Double-check your config keys before proceeding:

```bash
echo $HEXBOARD_UI_SIZE
echo $HEXBOARD_HOST
echo $OPENSHIFT_SERVER
echo $ACCESS_TOKEN
```

The configuration keys can be entered on the web, or provided via the command line.

# Launching from the CLI

After setting your config keys, run the following to launch the demo from a pre-installed template:

```bash
oc process -v="HEXBOARD_UI_SIZE=${HEXBOARD_UI_SIZE},HEXBOARD_HOST=${HEXBOARD_HOST},OPENSHIFT_SERVER=${OPENSHIFT_SERVER},ACCESS_TOKEN=${ACCESS_TOKEN}" hexboard | oc create -f -
```

# Launching on the Web

1. Click "Get Started" or "Create +" from the hexboard project overview page
2. Select the pre-installed `hexboard` template
3. Confirm the app creation details, update the `ACCESS_TOKEN`, `HEXBOARD_HOST`, and `OPENSHIFT_SERVER` fields as needed.

# Build

Docker image builds can be initiated by navigating to the "Builds" tab in the V3 web console.  Click on the `Start Build` button for each service.

You can also initiate the builds from the command line:

```bash
oc start-build hexboard
oc start-build sketchpod
```

# Routing 
Expose the `sketchpod` service via an external route:

```bash
oc expose se/hexboard --hostname="${HEXBOARD_HOST}"
```

You may need to omit the port number for this step.

# Scale

When the build completes, verify that the hexboard is accessible at `http://$HEXBOARD_HOST`. 

Then, scale up the number of `sketchpod` containers to populate the `hexboard` UI:

```bash
oc scale rc/sketchpod-1 --replicas=$HEXBOARD_UI_SIZE
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
