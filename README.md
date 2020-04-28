# bookingsg-api

This is a reference template for starting a standard MOL backend service.

It contains the necessary scaffolding and configurations for you to begin writing your application level code. The capabilities already setup in here:

- Watching src folder for changes and rebuilding
- Middleware and Tsoa setup to register API routes

## How to use

- create your new service's repository on bitbucket/1Push (e.g. "mol-new-service")
- run ./script/create-new-service.sh (by default new service directory will be created as a sibling of mol-SERVICE_TEMPLATE_NAME)
- observe that the service is up and running (check docker logs or call health check at ``http://localhost:YOURPORT/YOUR-SERVICE/health``
- there is also a sample API at ``http://localhost:YOURPORT/sample/api/v1/ping you may call (will return HTTP 204 if successful)
- add all files, commit and push to the repository created in the first step

## Building your service on the newly created repo

### Starting your service

Go to your service's docker-compose.yml and ensure the service is running on an unique port.
Run the start script to bring up the docker environment. (the container will start watching for changes)
> ``npm i && npm start``

Create a new dotenv file
> ``touch .env``

If you require a fresh start, run this script to clear the container volumes and rebuild the images.
> ``npm run start:fresh``

Watch the servers logs
> ``docker-compose logs -f``

### Adding new APIs and services

The current template assumes a folder structure used by most of our microservices - each domain is grouped into a subfolder under src/, with the api routes imported through src/controllers.ts

If it's a simple service that can adopt a single controller/service structure, please feel free to tweak this as necessary (remember to tweak tsoa.json if your controllers entryFile is changed).

### Others

- Remember to setup env in the aws-params repo

## TODOs

- Add sample reference for authentication level checks
- Add db service to the template
