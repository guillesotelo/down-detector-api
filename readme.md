# Introduction

In this server we setup all the backend logic including the DB management. To achieve this, we use Node and MongoDB.

## Prerequisites

To run this server locally, you need to have installed Node ^18.x. Follow this command to get it on Ubuntu machines:

```bash
cd ~
curl -sL https://deb.nodesource.com/setup_20.8 -o nodesource_setup.sh
sudo bash nodesource_setup.sh
sudo apt install nodejs
node -v
```

> Read more: [Node & Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-22-04)

## Local Run

First of all, you need to install the project's dependencies. Standing its root folder, do:

```bash
npm install
```

Now you can start the local server:

```bash
npm run dev
```

This will run the server with Nodemon, which will be listening to changes as we update the code.

### MongoDB

To visualize the DB you can download MongoDB Compass. Download and install the version that suits your environment.
If you are using Ubuntu >22.04, install and run with the following commands:

```bash
wget https://downloads.mongodb.com/compass/mongodb-compass_1.39.3_amd64.deb

sudo dpkg -i mongodb-compass_1.39.3_amd64.deb

mongodb-compass
```

#### New Connection

From the new window panel, start a new connection to MongoDB making sure the paramenters are correct. In this case we use the default PORT 27017.

You will see the main DB with all the collections. Search for `downddetector` collection and look for the documents (tables) we've created. You can update the tables directly from this GUI.