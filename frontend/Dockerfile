FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
ARG VITE_API_BASE_URL=https://urchin-app-w5w4g.ondigitalocean.app
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
