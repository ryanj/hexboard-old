# hexboard [![Dependency Check](http://img.shields.io/david/ryanj/hexboard.svg)](https://david-dm.org/ryanj/hexboard)

## Local Development
Install dependencies:

```bash
npm install
```

Start a local server, passing in config via the environment:

```bash
SERVER=openshift-master.summit.paas.ninja:8443 TOKEN=H8LgAhPKYVh-Iin_rrLBQV_q6IseHJ5IsjiUfJJJLME NAMESPACE=demo-live npm start
```

```bash
ACCESS_TOKEN=12345678 OPENSHIFT_SERVER=openshift.servername.com npm start
```

Create 1000 sketchpods:

```bash
export REPLICA_COUNT=1024 
export APPNAME=sketchpod 
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
docker run -d -p 8080:8080 -e "HOSTNAME=localhost" -e "ACCESS_TOKEN=00789101112" -e "OPENSHIFT_SERVER=openshift.servername.com" ryanj/hexboard
```

## OpenShiftV3
This demo can be launched on the web using the nodejs base image.

Make sure to include environment variables for the `OPENSHIFT_SERVER` and `ACCESS_TOKEN` if you want live data.

Then, start a build from the CLI:

```bash
osc start-build hexboard
```

And, add public routes:
```bash
osc create -f routes.json
```

## License
This code is dedicated to the public domain to the maximum extent permitted by applicable law, pursuant to CC0 (http://creativecommons.org/publicdomain/zero/1.0/)
