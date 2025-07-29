# Business Vision AI Platform

A microservices-based agentic AI platform for generating business strategies, curating assets, and managing usage across multiple intelligent agents.

## 🏗️ Architecture Overview

This platform follows a microservices architecture with the following key components:

### 🤖 Agents
- **Business Strategy Agent**: Generates comprehensive business strategies using AI
- **Asset Curator Agent**: Retrieves and manages user assets with intelligent curation
- **Usage Guardian Agent**: Monitors and enforces usage limits and subscription tiers

### 🔧 Core Services
- **API Gateway**: Routes requests, handles authentication, and manages cross-cutting concerns
- **Event Bus**: Redis-based event-driven communication between services
- **Database Service**: MongoDB connection management and health monitoring
- **Logging Service**: Centralized logging with Winston and daily rotation

## 📁 Project Structure

```
/server
├── /auth                           # Authentication service
│   ├── /controllers               # Auth logic controllers
│   ├── /middlewares               # JWT middleware
│   ├── /routes                    # Auth API routes
│   ├── /models                    # User/token schemas
│   └── /utils                     # Auth helper functions
│   
├── /agents                        # AI Agents
│   ├── /business-strategy-agent   # Business strategy generation
│   ├── /asset-curator-agent       # Asset management and curation
│   └── /usage-guardian-agent      # Usage monitoring and limits
│   
├── /api                          # Shared API components
│   ├── /controllers              # Shared controllers
│   ├── /routes                   # Common API routes
│   ├── /utils                    # Shared utilities
│   └── /models                   # Common data models
│   
├── /services                     # Core microservices
│   ├── /event-bus               # Redis event management
│   ├── /api-gateway             # Request routing and middleware
│   ├── /logging                 # Centralized logging
│   ├── /database                # Database connection management
│   └── /utils                   # Common utility functions
│
├── /config                      # Configuration files
│   ├── database.js             # Database configuration
│   ├── eventBus.js             # Event bus configuration
│   └── config.js               # Global configuration
│
├── /logs                       # Application logs
├── /docker                     # Docker configurations
└── /k8s                       # Kubernetes deployments
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- Redis (v6.0 or higher)
- OpenAI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd business-vision-ai-platform/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start required services**
   ```bash
   # Start MongoDB
   mongod
   
   # Start Redis
   redis-server
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Build and start all services
npm run docker:run

# Stop all services
npm run docker:stop
```

### Manual Docker Build
```bash
# Build the image
npm run docker:build

# Run with environment variables
docker run -p 3000:3000 --env-file .env business-vision-ai
```

## ☸️ Kubernetes Deployment

```bash
# Deploy to Kubernetes
npm run k8s:deploy

# Remove from Kubernetes
npm run k8s:delete
```

## 📊 API Endpoints

### Health & Status
- `GET /health` - System health check
- `GET /api/status` - API status
- `GET /api/docs` - API documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### Business Strategy Agent
- `POST /api/agents/business-strategy/generate` - Generate strategy
- `GET /api/agents/business-strategy/history` - Strategy history
- `GET /api/agents/business-strategy/:id` - Get specific strategy

### Asset Curator Agent
- `POST /api/agents/asset-curator/curate` - Curate assets
- `GET /api/agents/asset-curator/assets` - Get curated assets
- `GET /api/agents/asset-curator/assets/:id` - Get specific asset

### Usage Guardian Agent
- `GET /api/agents/usage-guardian/usage` - Current usage
- `GET /api/agents/usage-guardian/limits` - Usage limits
- `POST /api/agents/usage-guardian/validate` - Validate usage

## 🔧 Configuration

### Environment Variables
Key environment variables that need to be configured:

```env
# Required
OPENAI_API_KEY=your-openai-api-key
JWT_SECRET=your-jwt-secret
DATABASE_URL=mongodb://localhost:27017/business_vision_ai

# Optional but recommended
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=production
```

### Subscription Tiers
- **Free Tier**: 10 requests/month
- **Premium Tier**: 1,000 requests/month
- **Enterprise Tier**: 10,000 requests/month

## 📝 Logging

The platform uses Winston for structured logging with:
- **Console output** (development)
- **Daily rotating files** (production)
- **Error-specific logs**
- **Agent activity logs**
- **Security event logs**

Log files location: `./logs/`

## 🔐 Security Features

- JWT-based authentication
- Rate limiting
- CORS protection
- Helmet security headers
- Input sanitization
- Secure password hashing (bcrypt)
- Request/response logging

## 📈 Monitoring

### Health Checks
- Application health: `/health`
- Database connectivity
- Redis connectivity
- Agent status monitoring

### Metrics
- System metrics: `/api/metrics`
- Performance monitoring
- Error tracking
- Usage analytics

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🔄 Event-Driven Architecture

The platform uses Redis for event-driven communication between services:

### Event Channels
- `business-strategy.*` - Business strategy events
- `asset-curator.*` - Asset curation events
- `usage-guardian.*` - Usage monitoring events
- `system.*` - System-wide events
- `user.*` - User activity events

## 🚀 Scaling Considerations

### Horizontal Scaling
- Each agent can be deployed as separate microservices
- Load balancing with multiple API Gateway instances
- Database read replicas for improved performance

### Performance Optimization
- Redis caching for frequently accessed data
- Database connection pooling
- Request/response compression
- Background job processing

## 🛠️ Development

### Code Style
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Development Scripts
```bash
# Start with nodemon
npm run dev

# View logs
npm run logs

# Health check
npm run health
```

## 📋 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure MongoDB is running
   - Check DATABASE_URL in .env

2. **Redis Connection Failed**
   - Ensure Redis is running
   - Check REDIS_HOST and REDIS_PORT

3. **OpenAI API Errors**
   - Verify OPENAI_API_KEY is valid
   - Check API quota and billing

4. **Port Already in Use**
   - Change PORT in .env
   - Kill process using the port

### Debug Mode
Set `NODE_ENV=development` for detailed logging and error traces.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section

## 🔮 Roadmap

- [ ] Implement agent-specific microservices
- [ ] Add Prometheus metrics
- [ ] Implement circuit breakers
- [ ] Add API versioning
- [ ] Implement caching layer
- [ ] Add webhook support
- [ ] Implement real-time notifications
