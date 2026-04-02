#!/bin/bash
set -e  # stop immediately if any command fails
set -x

echo "Pointing Docker to minikube..."
eval $(minikube docker-env)

echo "Building api-gateway image..."
docker build -t api-gateway:latest .

echo "Restarting deployment..."
kubectl rollout restart deployment/api-gateway -n distributed-health

echo "Watching rollout..."
kubectl rollout status deployment/api-gateway -n distributed-health