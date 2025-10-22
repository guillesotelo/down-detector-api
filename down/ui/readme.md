# Introduction

Here you will find the repos representing front (client) and backend (server) parts of the application.

Read how to setup locally and on a virtual machine, and deploy to production following the instructions below:

## Prerequisites

To run the servers locally, you need to have installed Node ^18.x.

> Note: It is recommended to use the native console from Ubuntu to connect to the server via ssh using the syntax: `ssh user@ip.address`

Follow this command to get it on Ubuntu machines:

```bash
cd ~
curl -s https://deb.nodesource.com/setup_19.x | sudo -E bash -
sudo apt install nodejs
node -v
```

> Read more: [Node & Ubuntu](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-22-04)

If we are setting up the servers on a Virtual Machine, follow the [Apache Connection](#configure-apache-for-node) for further steps.

## Local Run

First of all, you need to install the project's dependencies. Standing on its root folder, do:

```bash
npm install
```

Now you can start the local server (client):

```bash
npm start
```

Start the local server (API):

```bash
npm run dev
```

This will run the server with Nodemon, which will be listening to changes as we update the code.

## Configure Apache for Node

First, make sure Apache is installed:

```bash
apache2 -v
```

If not, install it with:

```bash
sudo apt-get update
sudo apt-get install apache2
```

Since Apache runs automatically after installation, we can now check if has been installed correctly by going to `http://127.0.0.1`. From console: `xdg-open http://127.0.0.1`
This should show us the Apache2 Ubuntu Default Page.

After this, check the machine IP:

```bash
ip a
```

If you paste the IP in the browser or open it with the previous command, you should see the same default page from Apache.
We can confirm the status with:

```bash
sudo systemctl status apache2
```

### Connect the Node App with Apache

After a successful setup of Apache Server, we can connect our Node application.

#### Creating the Apache configuration file

First, we need to create the Apache configuration file. We do this with:

```bash
# go to the configs folder
cd /etc/apache2/sites-available

# create a default config file
sudo nano 000-default.conf
```

The Apache VirtualHost is defined in the 000-default.conf file and is set up to listen for requests on port 80.
We’ll configure the 000-default.conf file so that all requests coming in via port 80 will be proxied, or forwarded, to the Node application running on port 5000 (or the one we previously configured in our environment).

We use ProxyPass to map the root URL at the specified addresses: `http://localhost:3000` and `http://localhost:5000`.
Copy the following lines into the default.config file:

```bash
ProxyPass / http://localhost:3000/
ProxyPass / http://localhost:5000/
```
So you would have something like this:

```bash
<VirtualHost *:80>
    ServerName down.servername.com

    # Proxy requests to the React app
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    ErrorLog ${APACHE_LOG_DIR}/frontend-error.log
    CustomLog ${APACHE_LOG_DIR}/frontend-access.log combined
</VirtualHost>

<VirtualHost *:80>
    ServerName down-api.servername.com

    # Proxy requests to the Node.js backend
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/

    ErrorLog ${APACHE_LOG_DIR}/backend-error.log
    CustomLog ${APACHE_LOG_DIR}/backend-access.log combined
</VirtualHost>
```

> Note: We use the port 3000 just for development purposes. We don't actually use it for production. So you can basically skip it if no development will be done on the server.

After this, we need to map our ServerName's placeholders in our host file:

```bash
sudo nano /etc/hosts
```

Paste the following lines:

```bash
127.0.0.1 down.servername.com
127.0.0.1 down-api.servername.com
```

Keep in mind that when deploying into a different production server, we will need to update these names.

Next, use the Control+X command to save and exit.

#### Enabling the proxy and proxy_http modules

Standing on the sites-available folder, run the following command to enable *proxy* and *proxy_http* modules:

```bash
sudo a2enmod
```

a2enmod is an acronym for “Apache2 enable module.” Running this command will list all modules that are available to be enabled.
Next, we are prompted to enter the name of a module that we’d like to enable.
We enter the proxy at the prompt to enable the proxy module:

```bash
# Which module(s) do you want to enable (wildcards ok)?
proxy
```

Now we do the same for module `proxy_http`:

```bash
sudo a2enmod
```

```bash
# Which module(s) do you want to enable (wildcards ok)?
proxy_http
```

#### Applying the configuration

Because we changed the configuration file, we must reload the Apache server to apply the configuration.
In the sites-enabled directory, use the following command to reload the apache2 server, then stop and restart it:

```bash
sudo systemctl reload apache2
sudo systemctl stop apache2
sudo systemctl start apache2
```

#### Testing the configuration

Finally, we can test everything's correct by going to `http://localhost:80`. We should see what we're serving in our Node app.

> Source: [Apache & Node](https://blog.logrocket.com/configuring-apache-node-js/)

#### Run Server & Client

If everything goes well, we can start both the backend and client servers using the command `nohup` for persistence.

Note that the backend server is using `pm2` as process administrator, so you would need to install pm2 to use it:

```bash
npm i pm2 -g
```

Standing the respective folder, run the command for each server:

```bash
nohup node server.js & # Prod environment (update .env file with NODE_ENV=production)
```

Only run this for development purposes:

```bash
nohup npm start & # Dev environment
```

If we want to close the connection, standing on the respective folder, we use:

```bash
disown
```

When a new SSH connection to the server is made, we might need to kill the process when we want to close any connection. We can do it with:

```bash
# Check connections in port 3000 (like for the client server)
lsof -i tcp:3000

# Then we kill the process using the respective PID
kill -9 PID
```

### MongoDB

#### Installation

First, install `gnupg` and curl if they are not already available:

```bash
sudo apt-get install gnupg curl
```

Import the Mongo public GPG key:

```bash
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor
```

Create a list file for Mongo:

- **Ubuntu 22.04**

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

- **Ubuntu 20.04**

```bash
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

Reload local package database:

```bash
sudo apt-get update
```

Install the MongoDB packages:

```bash
sudo apt-get install -y mongodb-org
```

#### Start MongoDB Instance

Start MongoDB:

```bash
sudo systemctl start mongod
```

Check status:

```bash
sudo systemctl status mongod
```

Run the app and check it connects to Mongo instance:

```bash
npm run dev
```

#### MongoDB Compass

To visualize the DB you can download MongoDB Compass. Download and install the version that suits your environment.
If you are using Ubuntu >22.04, install and run with the following commands:

```bash
wget https://downloads.mongodb.com/compass/mongodb-compass_1.39.3_amd64.deb

sudo dpkg -i mongodb-compass_1.39.3_amd64.deb

mongodb-compass
```

##### New Connection

From the new window panel, start a new connection to MongoDB making sure the parameters are correct. In this case, we use the default PORT 27017.

You will see the main DB with all the collections. Search for `downdetector` collection and look for the documents (tables) we've created. You can update the tables directly from this GUI.

## Deploy New Updates

After applying changes to the codebase of the respective repos, we can easily deploy to production by doing the following:

### Client

Make sure to update the version number within src/constants/app.ts file.
Run `npm run build` standing on the root folder and wait for a successful build.

### Server

You always need to update the server process after updates on repos, even if they were only on the frontend.
Run `pm2 restart all` to restart all the processes included in pm2. If there are more processes configured within pm2 than Down, then you can use `pm2 restart <process_name>`.

Check the server accessibility from the web endpoint and run the necessary manual tests. 