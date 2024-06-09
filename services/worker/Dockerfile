FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apt-get update && apt-get install -y ffmpeg

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
