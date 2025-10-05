#!/bin/bash
# Force rollout of all Stumbleable services in AKS
# Use this script if automatic deployments fail

set -e

NAMESPACE="${1:-stumbleable}"

echo "🔄 Forcing rollout of all services in namespace: $NAMESPACE"
echo ""

SERVICES=(
    "ui-portal"
    "discovery-service"
    "interaction-service"
    "user-service"
    "crawler-service"
    "moderation-service"
)

for service in "${SERVICES[@]}"; do
    echo "📦 Restarting deployment: $service"
    kubectl rollout restart deployment/$service -n $NAMESPACE
    
    echo "⏳ Waiting for rollout to complete..."
    kubectl rollout status deployment/$service -n $NAMESPACE --timeout=3m
    
    echo "✅ $service rolled out successfully"
    echo ""
done

echo "🎉 All services rolled out successfully!"
echo ""
echo "📊 Current pod status:"
kubectl get pods -n $NAMESPACE -o wide

echo ""
echo "🔍 Deployment history (first 3 revisions):"
for service in "${SERVICES[@]}"; do
    echo "--- $service ---"
    kubectl rollout history deployment/$service -n $NAMESPACE --revision=0 | tail -n 4
done
