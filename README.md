# Periodic Table Sandbox

Sandbox for Periodic Table interactive prototypes for the Hall of Gems and Minerals

## Running locally

1. Install [node.js](https://nodejs.org/en/)
1. Clone this directory

   ```
   git clone https://github.com/amnh-sciviz/pt-sandbox.git
   cd pt-sandbox
   ```

1. Install and run a simple server:

   ```
   npm install
   npm start
   ```

1. By default, you can go to [localhost:2222](http://localhost:2222/) in a web browser. Alternatively instead of `npm run`, you can indicate a custom port:

   ```
   node server.js 1234
   ```

## Running with a TUIO device

1. If you haven't already, install [node.js](https://nodejs.org/en/), clone this directory, and install dependencies

   ```
   git clone https://github.com/amnh-sciviz/pt-sandbox.git
   cd pt-sandbox
   npm install
   ```

1. Make sure your TUIO device is running and accessible on port `3333`

1. Start the web server, socket server, and listen to the TUIO device by running

   ```
   npm run tuio
   ```

1. By default, you can go to [localhost:8080/tuio/](http://localhost:8080/tuio/) in a web browser. Alternatively instead of `npm tuio`, you can indicate a custom port:

   ```
   node tuio-server.js 1234
   ```
