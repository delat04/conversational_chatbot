# 🐳 Docker Deployment Guide

## Prerequisites
- Docker installed on your machine
- Your `.env` file configured with all necessary API keys

## Quick Start

### 1. Build the Docker Image
```bash
docker build -t conversational-chatbot .
```

### 2. Run the Container
```bash
docker run -d \
  --name chatbot \
  -p 3001:3001 \
  --env-file backend/.env \
  conversational-chatbot
```

### 3. Access the Application
Open your browser and navigate to:
```
http://localhost:3001
```

## Detailed Instructions

### Building the Image
```bash
# From the project root directory (where Dockerfile is located)
docker build -t conversational-chatbot:latest .

# This will:
# 1. Build your Vue.js frontend (npm run build)
# 2. Copy the built files to the backend
# 3. Install backend dependencies
# 4. Create the final image
```

### Running the Container

#### Basic Run
```bash
docker run -p 3001:3001 --env-file backend/.env conversational-chatbot
```

#### Run in Background (Detached Mode)
```bash
docker run -d --name chatbot -p 3001:3001 --env-file backend/.env conversational-chatbot
```

#### Run with Volume for Uploads
```bash
docker run -d \
  --name chatbot \
  -p 3001:3001 \
  --env-file backend/.env \
  -v $(pwd)/uploads:/app/uploads \
  conversational-chatbot
```

### Environment Variables Required
Make sure your `backend/.env` file contains:
```env
# OpenAI
OPENAI_API_KEY=your_key_here

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key

# Pinecone
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=your_index_name

# SerpAPI (for research feature)
SERPAPI_KEY=your_serpapi_key

# Port (optional, defaults to 3001)
PORT=3001
```

## Docker Commands Cheatsheet

### Managing Containers
```bash
# List running containers
docker ps

# List all containers
docker ps -a

# Stop container
docker stop chatbot

# Start container
docker start chatbot

# Restart container
docker restart chatbot

# Remove container
docker rm chatbot

# View logs
docker logs chatbot

# Follow logs in real-time
docker logs -f chatbot
```

### Managing Images
```bash
# List images
docker images

# Remove image
docker rmi conversational-chatbot

# Remove unused images
docker image prune
```

### Health Check
```bash
# Check if container is healthy
docker inspect --format='{{.State.Health.Status}}' chatbot
```

## Testing the Deployment

### 1. Test Backend API
```bash
curl http://localhost:3001/
```

Expected response:
```json
{
  "message": "Moteur de recherche sémantique RAG avec Web Scraping - API active",
  "status": "OK"
}
```

### 2. Test Frontend
Open browser: `http://localhost:3001`
- You should see your Vue.js application

### 3. Test File Upload
```bash
curl -X POST http://localhost:3001/upload \
  -F "document=@/path/to/your/file.pdf"
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs chatbot

# Common issues:
# - Missing environment variables
# - Port 3001 already in use
# - Insufficient memory
```

### Port already in use
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port
docker run -p 8080:3001 --env-file backend/.env conversational-chatbot
```

### Can't access application
```bash
# Verify container is running
docker ps

# Check if port is mapped correctly
docker port chatbot

# Test from inside container
docker exec -it chatbot curl http://localhost:3001
```

## Production Considerations

### 1. Use Docker Compose (Recommended)
See `docker-compose.yml` if you need to add database services

### 2. Security
- Never commit `.env` files
- Use Docker secrets for sensitive data
- Run container as non-root user

### 3. Performance
- Consider adding Redis for caching
- Use persistent volumes for uploads
- Monitor memory usage

### 4. Monitoring
```bash
# Check resource usage
docker stats chatbot

# Set memory limits
docker run -d --name chatbot \
  --memory="2g" \
  -p 3001:3001 \
  --env-file backend/.env \
  conversational-chatbot
```

## For Your Professor

To test this application:

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd conversational_chatbot
   ```

2. **Create .env file** (or use the provided one)
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys
   ```

3. **Build and run**
   ```bash
   docker build -t conversational-chatbot .
   docker run -d -p 3001:3001 --env-file backend/.env conversational-chatbot
   ```

4. **Access the application**
   ```
   http://localhost:3001
   ```

5. **Stop when done**
   ```bash
   docker stop <container-id>
   ```

## Notes
- Frontend is built during Docker image creation
- Backend serves both API and static frontend files
- All uploads are stored in `/app/uploads` inside container
- Puppeteer is configured to work in Docker (headless Chrome)

## Support
For issues, check the logs:
```bash
docker logs chatbot
```