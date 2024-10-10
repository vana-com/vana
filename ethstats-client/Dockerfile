## Dockerfile for eth-net-intelligence-api (build from git).
##
## Build via:
#
# `docker build -t ethnetintel:latest .`
#
## Run via:
#
# `docker run -v <path to app.json>:/home/ethnetintel/eth-net-intelligence-api/app.json ethnetintel:latest`
#
## Make sure, to mount your configured 'app.json' into the container at
## '/home/ethnetintel/eth-net-intelligence-api/app.json', e.g.
## '-v /path/to/app.json:/home/ethnetintel/eth-net-intelligence-api/app.json'
## 
## Note: if you actually want to monitor a client, you'll need to make sure it can be reached from this container.
##       The best way in my opinion is to start this container with all client '-p' port settings and then 
#        share its network with the client. This way you can redeploy the client at will and just leave 'ethnetintel' running. E.g. with
##       the python client 'pyethapp':
##
#
# `docker run -d --name ethnetintel \
# -v /home/user/app.json:/home/ethnetintel/eth-net-intelligence-api/app.json \
# -p 0.0.0.0:30303:30303 \
# -p 0.0.0.0:30303:30303/udp \
# ethnetintel:latest`
#
# `docker run -d --name pyethapp \
# --net=container:ethnetintel \
# -v /path/to/data:/data \
# pyethapp:latest`
#
## If you now want to deploy a new client version, just redo the second step.


FROM debian:latest

# Install curl and git
RUN apt-get update && apt-get install -y curl git-core

# Add the Node.js 18.x repository
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -

# Install Node.js
RUN apt-get install -y nodejs



RUN apt-get update &&\
    apt-get install -y build-essential

RUN adduser ethnetintel

COPY ./ /home/ethnetintel/eth-net-intelligence-api
RUN cd /home/ethnetintel/eth-net-intelligence-api &&\
    npm install &&\
    npm install -g pm2 && \
    npm install web3@latest \
    npm install web3-providers-http \
    npm install web3-providers-ws

RUN echo '#!/bin/bash\nset -e\n\ncd /home/ethnetintel/eth-net-intelligence-api\n/usr/bin/pm2 start ./app.json\ntail -f \
    /home/ethnetintel/.pm2/logs/node-app-out-0.log' > /home/ethnetintel/startscript.sh

RUN chmod +x /home/ethnetintel/startscript.sh &&\
    chown -R ethnetintel. /home/ethnetintel

USER ethnetintel
ENTRYPOINT ["/home/ethnetintel/startscript.sh"]
