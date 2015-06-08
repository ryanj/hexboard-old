# hexboard [![Dependency Check](http://img.shields.io/david/ryanj/hexboard.svg)](https://david-dm.org/ryanj/hexboard)

## Local Development
Install dependencies:

```bash
npm install
```

Start a local server, passing in config via the environment:

```bash
OPENSHIFT_SERVER=openshift-master.summit.paas.ninja:8443 ACCESS_TOKEN=H8LgAhPKYVh-Iin_rrLBQV_q6IseHJ5IsjiUfJJJLME NAMESPACE=demo npm start
```

Create 1000 sketchpods:

```bash
export REPLICA_COUNT=1024 
export APPNAME=sketch
export APP_ROOT_URL='PROJECTNAME.apps.YOUR_HOSTNAME'
cat app_template.json | sed -e "s/REPLICA_COUNT/$REPLICA_COUNT/" | sed -e "s/APP_ROOT_URL/$APP_ROOT_URL/g" | sed -e "s/APPNAME/$APPNAME/g" | osc create -f -
```

After the server has started, submit some images:

```bash
OPENSHIFT_SERVER="http://localhost:8080" CUID="007" SUBMISSION="yes!" USERNAME="joe" node post_image.manual.js
```

## Docker
To run [the related docker image](https://registry.hub.docker.com/u/ryanj/hexboard/):

```bash
docker pull ryanj/hexboard
export OPENSHIFT_SERVER=your.openshift.server.com
export ACCESS_TOKEN='asdasdasdaasasddasd'
export OPENSHIFT_APP_BASENAME='apps.summit.paas.ninja'
export APPNAME=sketch
export NAMESPACE=demo
export APP_HOSTNAME='sketch.demo.apps.summit.paas.ninja'
docker run -e "OPENSHIFT_SERVER=$OPENSHIFT_SERVER" -e "ACCESS_TOKEN=$ACCESS_TOKEN" -e "OPENSHIFT_APP_BASENAME=$APP_ROOT_URL" -e "APPNAME=$APPNAME" -e "NAMESPACE=$NAMESPACE" -e "HOSTNAME=$APP_HOSTNAME" -d -p 8080:8080 ryanj/hexboard 
```

## OpenShiftV3
This demo can be launched on the web using the nodejs base image.

Make sure to include environment variables for the `OPENSHIFT_SERVER` and `ACCESS_TOKEN` if you want live data.

Then, start a build from the CLI:

```bash
osc start-build hexboard
```

## License
This code is dedicated to the public domain to the maximum extent permitted by applicable law, pursuant to CC0 (http://creativecommons.org/publicdomain/zero/1.0/)
