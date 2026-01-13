# 🚀 CorporateChat Kubernetes Deployment Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Secrets Management](#secrets-management)
5. [ConfigMaps](#configmaps)
6. [Services Deployment](#services-deployment)
7. [Ingress Configuration](#ingress-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)

## 🎯 Overview

CorporateChat is a microservices-based application deployed on Kubernetes with:
- **6 Microservices**: API Gateway, Auth, User Management, Media, Chat, Meeting
- **External Dependencies**: PostgreSQL (Aiven), Redis (Redis Labs), Kafka (Aiven)
- **Real-time Communication**: Socket.IO for chat and WebRTC for meetings
- **Load Balancing**: NGINX Ingress Controller
- **SSL/TLS**: Certificate management with cert-manager

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NGINX Ingress Controller                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │   REST API  │ │  Socket.IO  │ │    WebSocket (Meeting)  ││
│  │   Routes    │ │   Routes    │ │       Routes            ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Services                      │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│ │Auth Service │ │User Service │ │    Media Service        │ │
│ │   :3001     │ │   :3002     │ │       :3003             │ │
│ └─────────────┘ └─────────────┘ └─────────────────────────┘ │
│ ┌─────────────┐ ┌─────────────┐                             │
│ │Chat Service │ │Meeting Svc  │                             │
│ │   :3004     │ │   :3005     │                             │
│ └─────────────┘ └─────────────┘                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                External Dependencies                        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│ │PostgreSQL   │ │   Redis     │ │        Kafka            │ │
│ │  (Aiven)    │ │(Redis Labs) │ │      (Aiven)            │ │
│ └─────────────┘ └─────────────┘ └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

### 1. Kubernetes Cluster Setup
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/windows/amd64/kubectl.exe"

# For local development - Minikube
minikube start --driver=docker --memory=8192 --cpus=4
minikube addons enable ingress

# For production - Use managed Kubernetes (EKS, GKE, AKS)
```

### 2. Required Tools
```bash
# Docker for building images
docker --version

# Helm for package management
helm version

# kubectl for cluster management
kubectl version --client
```

### 3. Namespace Creation
```bash
kubectl create namespace corporatechat
kubectl config set-context --current --namespace=corporatechat
```

## 🔐 Secrets Management

### 1. Create Corporate Secrets
```yaml
# corporate-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: corporate-secrets
  namespace: corporatechat
type: Opaque
data:
  # Database URLs (base64 encoded - replace with your actual values)
  DATABASE_URL_AUTH: <base64-encoded-auth-db-url>
  DATABASE_URL_CHAT: <base64-encoded-chat-db-url>
  DATABASE_URL_USER: <base64-encoded-user-db-url>
  DATABASE_URL_MEETING: <base64-encoded-meeting-db-url>
  
  # JWT Secret (replace with your secret)
  JWT_SECRET: <base64-encoded-jwt-secret>
  
  # Email Configuration (replace with your credentials)
  EMAIL_USER: <base64-encoded-email>
  EMAIL_PASS: <base64-encoded-password>
  
  # Kafka Configuration (replace with your credentials)
  KAFKA_USERNAME: <base64-encoded-username>
  KAFKA_PASSWORD: <base64-encoded-password>
  
  # Redis Configuration (replace with your password)
  REDIS_PASSWORD: <base64-encoded-redis-password>
  
  # Supabase Configuration (replace with your keys)
  SUPABASE_URL: <base64-encoded-supabase-url>
  SUPABASE_ANON_KEY: <base64-encoded-anon-key>
  SUPABASE_SERVICE_ROLE_KEY: <base64-encoded-service-role-key>
  
  # LiveKit Configuration (replace with your keys)
  LIVEKIT_API_KEY: <base64-encoded-api-key>
  LIVEKIT_API_SECRET: <base64-encoded-api-secret>
  LIVEKIT_WS_URL: <base64-encoded-ws-url>

---
# Apply the secret
kubectl apply -f corporate-secrets.yaml
```

**Note**: Replace all `<base64-encoded-*>` placeholders with your actual base64-encoded values. Use:
```bash
echo -n "your-actual-value" | base64
```

### 2. Kafka CA Certificate Secret
```yaml
# kafka-ca-cert.yaml
apiVersion: v1
kind: Secret
metadata:
  name: kafka-ca-cert
  namespace: corporatechat
type: Opaque
data:
  ca.pem: |
    <base64-encoded-kafka-ca-certificate>

---
kubectl apply -f kafka-ca-cert.yaml
```

## ⚙️ ConfigMaps

### Corporate Configuration
```yaml
# corporate-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: corporate-config
  namespace: corporatechat
data:
  # Environment
  NODE_ENV: "production"
  
  # Kafka Configuration
  KAFKA_BROKER: "your-kafka-broker:port"
  KAFKA_USE_SSL: "true"
  KAFKA_SSL_CA_PATH: "/app/certs/ca.pem"
  KAFKA_REPLICATION_FACTOR: "2"
  KAFKA_USER_EVENTS_PARTITIONS: "2"
  KAFKA_CHAT_EVENTS_PARTITIONS: "2"
  KAFKA_MEDIA_EVENTS_PARTITIONS: "2"
  
  # Redis Configuration
  REDIS_HOST: "your-redis-host"
  REDIS_PORT: "6379"
  REDIS_USERNAME: "default"
  REDIS_USE_TLS: "false"
  
  # Email Configuration
  EMAIL_HOST: "smtp.gmail.com"
  EMAIL_PORT: "587"
  
  # CORS Configuration
  FRONTEND_URLS: "http://localhost:3000,http://localhost:5173"
  
  # Feature Flags
  ENABLE_BULK_MESSAGES: "true"
  MESSAGE_BATCH_TIMEOUT: "5000"
  MESSAGE_MAX_BATCH_SIZE: "100"
  
  # Media Configuration
  SUPABASE_BUCKET_NAME: "your-bucket-name"
  MAX_FILE_SIZE: "52428800"
  ALLOWED_FILE_TYPES: "image/jpeg,image/png,image/webp,video/mp4,video/webm,application/pdf"

---
kubectl apply -f corporate-config.yaml
```

## 🚀 Services Deployment

### 1. Auth Service
```yaml
# auth-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: corporatechat
  labels:
    app: auth-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
        - name: auth-service
          image: your-registry/auth-service:latest
          ports:
            - containerPort: 3001
          env:
            - name: PORT
              value: "3001"
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: corporate-config
                  key: NODE_ENV
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: corporate-secrets
                  key: JWT_SECRET
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: corporate-secrets
                  key: DATABASE_URL_AUTH
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3001
            initialDelaySeconds: 15
            periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: corporatechat
spec:
  selector:
    app: auth-service
  ports:
    - port: 3001
      targetPort: 3001
      protocol: TCP
  type: ClusterIP
```

### 2. Chat Service (with Socket.IO)
```yaml
# chat-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-service
  namespace: corporatechat
  labels:
    app: chat-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: chat-service
  template:
    metadata:
      labels:
        app: chat-service
    spec:
      containers:
        - name: chat-service
          image: your-registry/chat-service:latest
          ports:
            - containerPort: 3004
          env:
            - name: PORT
              value: "3004"
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: corporate-config
                  key: NODE_ENV
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: corporate-secrets
                  key: JWT_SECRET
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: corporate-secrets
                  key: DATABASE_URL_CHAT
            # Redis Configuration
            - name: REDIS_HOST
              valueFrom:
                configMapKeyRef:
                  name: corporate-config
                  key: REDIS_HOST
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: corporate-secrets
                  key: REDIS_PASSWORD
            # Kafka Configuration
            - name: KAFKA_BROKER
              valueFrom:
                configMapKeyRef:
                  name: corporate-config
                  key: KAFKA_BROKER
            - name: KAFKA_USERNAME
              valueFrom:
                secretKeyRef:
                  name: corporate-secrets
                  key: KAFKA_USERNAME
          volumeMounts:
            - name: kafka-ca
              mountPath: /app/certs
              readOnly: true
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
      volumes:
        - name: kafka-ca
          secret:
            secretName: kafka-ca-cert

---
apiVersion: v1
kind: Service
metadata:
  name: chat-service
  namespace: corporatechat
spec:
  selector:
    app: chat-service
  ports:
    - port: 3004
      targetPort: 3004
      protocol: TCP
  type: ClusterIP
```

### 3. Meeting Service (with WebSocket)
```yaml
# meeting-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: meeting-service
  namespace: corporatechat
  labels:
    app: meeting-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: meeting-service
  template:
    metadata:
      labels:
        app: meeting-service
    spec:
      containers:
        - name: meeting-service
          image: your-registry/meeting-service:latest
          ports:
            - containerPort: 3005
          env:
            - name: PORT
              value: "3005"
            - name: NODE_TLS_REJECT_UNAUTHORIZED
              value: "0"
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: corporate-config
                  key: NODE_ENV
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: corporate-secrets
                  key: JWT_SECRET
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: corporate-secrets
                  key: DATABASE_URL_MEETING
            # LiveKit Configuration
            - name: LIVEKIT_API_KEY
              valueFrom:
                secretKeyRef:
                  name: corporate-secrets
                  key: LIVEKIT_API_KEY
            - name: LIVEKIT_WS_URL
              valueFrom:
                secretKeyRef:
                  name: corporate-secrets
                  key: LIVEKIT_WS_URL
            - name: FRONTEND_URLS
              valueFrom:
                configMapKeyRef:
                  name: corporate-config
                  key: FRONTEND_URLS
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: meeting-service
  namespace: corporatechat
spec:
  selector:
    app: meeting-service
  ports:
    - port: 3005
      targetPort: 3005
      protocol: TCP
  type: ClusterIP
```

## 🌐 Ingress Configuration

### NGINX Ingress with WebSocket Support
```yaml
# separate-ingress.yaml
# Auth Service Ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: auth-ingress
  namespace: corporatechat
  annotations:
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /api/v1/auth/$2
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://your-domain.com"
    nginx.ingress.kubernetes.io/cors-allow-credentials: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - your-domain.com
      secretName: corporatechat-tls
  rules:
    - host: your-domain.com
      http:
        paths:
          - path: /api/auth(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: auth-service
                port:
                  number: 3001

---
# Chat Service REST API
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: chat-ingress
  namespace: corporatechat
  annotations:
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/rewrite-target: /api/groups/$2
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-credentials: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - your-domain.com
      secretName: corporatechat-tls
  rules:
    - host: your-domain.com
      http:
        paths:
          - path: /api/groups(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: chat-service
                port:
                  number: 3004

---
# Chat Service Socket.IO
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: chat-socket-ingress
  namespace: corporatechat
  annotations:
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/websocket-services: chat-service
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-credentials: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - your-domain.com
      secretName: corporatechat-tls
  rules:
    - host: your-domain.com
      http:
        paths:
          - path: /socket.io(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: chat-service
                port:
                  number: 3004

---
# Meeting Service WebSocket
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: meeting-socket-ingress
  namespace: corporatechat
  annotations:
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/websocket-services: meeting-service
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-credentials: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - your-domain.com
      secretName: corporatechat-tls
  rules:
    - host: your-domain.com
      http:
        paths:
          - path: /meeting-socket(/|$)(.*)
            pathType: ImplementationSpecific
            backend:
              service:
                name: meeting-service
                port:
                  number: 3005
```

## 📊 Monitoring & Logging

### 1. Prometheus ServiceMonitor
```yaml
# monitoring.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: corporatechat-metrics
  namespace: corporatechat
spec:
  selector:
    matchLabels:
      app: corporatechat
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

### 2. Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: chat-service-hpa
  namespace: corporatechat
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: chat-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 🔧 Deployment Commands

### 1. Deploy All Services
```bash
# Create namespace
kubectl create namespace corporatechat

# Apply secrets and configs
kubectl apply -f corporate-secrets.yaml
kubectl apply -f kafka-ca-cert.yaml
kubectl apply -f corporate-config.yaml

# Deploy services
kubectl apply -f auth-service.yaml
kubectl apply -f user-management-service.yaml
kubectl apply -f media-service.yaml
kubectl apply -f chat-service.yaml
kubectl apply -f meeting-service.yaml

# Apply ingress
kubectl apply -f separate-ingress.yaml

# Verify deployment
kubectl get all -n corporatechat
```

### 2. Check Service Status
```bash
# Check pods
kubectl get pods -n corporatechat

# Check services
kubectl get svc -n corporatechat

# Check ingress
kubectl get ingress -n corporatechat

# View logs
kubectl logs -f deployment/chat-service -n corporatechat
```

### 3. Scale Services
```bash
# Scale chat service for high load
kubectl scale deployment chat-service --replicas=5 -n corporatechat

# Scale meeting service
kubectl scale deployment meeting-service --replicas=3 -n corporatechat
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Pod CrashLoopBackOff
```bash
# Check pod logs
kubectl logs <pod-name> -n corporatechat

# Describe pod for events
kubectl describe pod <pod-name> -n corporatechat

# Check resource limits
kubectl top pods -n corporatechat
```

#### 2. Service Connection Issues
```bash
# Test service connectivity
kubectl exec -it <pod-name> -n corporatechat -- curl http://auth-service:3001/health

# Check service endpoints
kubectl get endpoints -n corporatechat

# Verify DNS resolution
kubectl exec -it <pod-name> -n corporatechat -- nslookup auth-service
```

#### 3. Ingress Issues
```bash
# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Verify ingress rules
kubectl describe ingress -n corporatechat

# Test ingress connectivity
curl -H "Host: your-domain.com" http://<ingress-ip>/api/auth/health
```

#### 4. Socket.IO Connection Issues
```bash
# Check WebSocket annotations
kubectl get ingress chat-socket-ingress -o yaml -n corporatechat

# Verify CORS settings
kubectl logs -f deployment/chat-service -n corporatechat | grep CORS

# Test WebSocket connection
wscat -c wss://your-domain.com/socket.io/?transport=websocket
```

### Performance Tuning

#### 1. Resource Optimization
```yaml
# Adjust resource requests/limits
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

## 🚀 Production Considerations

### 1. Security
- Use network policies to restrict pod-to-pod communication
- Implement RBAC for service accounts
- Regular security scanning of container images
- Rotate secrets regularly

### 2. High Availability
- Deploy across multiple availability zones
- Use pod disruption budgets
- Implement circuit breakers in application code
- Set up database replication

### 3. Backup & Recovery
- Regular database backups
- Persistent volume snapshots
- Disaster recovery procedures
- Configuration backup

### 4. Monitoring
- Set up alerting for critical metrics
- Log aggregation with ELK stack
- Distributed tracing with Jaeger
- Performance monitoring with APM tools

This comprehensive guide covers the complete Kubernetes deployment of CorporateChat microservices, from basic setup to production-ready configurations with placeholder values for security.