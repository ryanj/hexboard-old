# commander-1k [![Dependency Check](http://img.shields.io/david/ryanj/commander-1k.svg)](https://david-dm.org/ryanj/commander-1k)

## Local Development
Install dependencies:

```bash
npm install
```

Start a local server, passing in config via the environment:

```bash
ACCESS_TOKEN=12345678 OPENSHIFT_SERVER=openshift.servername.com npm start
```

## Docker
To run [the related docker image](https://registry.hub.docker.com/u/ryanj/commander-1k/):

```bash
docker pull ryanj/commander-1k
docker run -d -p 8080:8080 -e "HOSTNAME=localhost" -e "ACCESS_TOKEN=00789101112" -e "OPENSHIFT_SERVER=openshift.servername.com" ryanj/commander-1k
```

## OpenShiftV3
This demo can be launched on the web using the nodejs base image.

Make sure to include environment variables for the `OPENSHIFT_SERVER` and `ACCESS_TOKEN` if you want live data.

Then, start a build from the CLI:

```bash
osc start-build commander-1k
```

And, add public routes:
```bash
osc create -f routes.json
```

## License
This code is dedicated to the public domain to the maximum extent permitted by applicable law, pursuant to CC0 (http://creativecommons.org/publicdomain/zero/1.0/)
