# 1k-commander [![Dependency Check](http://img.shields.io/david/ryanj/1k-commander.svg)](https://david-dm.org/ryanj/1k-commander)

## Local Development
Install dependencies:

```bash
npm install
```

Start a local server, passing in config via the environment:

```bash
npm start
```

## Docker
To run [the related docker image](https://registry.hub.docker.com/u/ryanj/1k-commander/):

```bash
docker pull ryanj/1k-commander
docker run -d -p 8080:8080 -e "HOSTNAME=localhost" -e "DEMO_USER_ID=007" -e "DEMO_CLAIM=openshift for the win!" ryanj/1k-commander
```

## License
This code is dedicated to the public domain to the maximum extent permitted by applicable law, pursuant to CC0 (http://creativecommons.org/publicdomain/zero/1.0/)
