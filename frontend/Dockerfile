FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install --legacy-peer-deps && chmod +x /app/node_modules/.bin/react-scripts && /app/node_modules/.bin/react-scripts build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
