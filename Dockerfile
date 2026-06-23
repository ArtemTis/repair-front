FROM node:22-slim
WORKDIR /app

COPY package*.json ./
COPY api/package*.json ./api/
COPY apps/host/package*.json ./apps/host/
COPY apps/admin/package*.json ./apps/admin/

RUN npm ci

COPY . .

EXPOSE 3000 3001 8080

CMD ["npm", "run", "dev"]

