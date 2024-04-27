#!/bin/bash

# Give appropriate permissions to the express-app directory
sudo chown -R ec2-user:ec2-user /home/ec2-user/jobly-app
sudo chmod -R 755 /home/ec2-user/jobly-app

# Navigate to the working directory
cd /home/ec2-user/jobly-app

# Set up NVM environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # loads NVM
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # loads NVM bash_completion (node is in path now)

# Install Node.js modules
npm install

# Start the Node.js application
node server.js > server.out.log 2> server.err.log < /dev/null &
