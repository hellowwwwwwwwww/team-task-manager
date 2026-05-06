FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

RUN chmod +x /app/node_modules/.bin/react-scripts

COPY . .

RUN /app/node_modules/.bin/react-scripts build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
