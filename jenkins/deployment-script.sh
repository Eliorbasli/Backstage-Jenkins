#!/bin/bash
echo "======================================"
echo "Starting Deployment"
echo "======================================"
echo "Environment: ${ENVIRONMENT}"
echo "Image Tag: ${IMAGE_TAG}"

docker pull nginx:${IMAGE_TAG}

docker stop nginx-${ENVIRONMENT} 2>/dev/null || true
docker rm nginx-${ENVIRONMENT} 2>/dev/null || true

if [ "${ENVIRONMENT}" = "dev" ]; then
    PORT=8081
elif [ "${ENVIRONMENT}" = "staging" ]; then
    PORT=8082
else
    PORT=8083
fi

docker run -d \
  --name nginx-${ENVIRONMENT} \
  -p ${PORT}:80 \
  nginx:${IMAGE_TAG}

echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo "Application deployed to ${ENVIRONMENT}"
echo "Access at: http://localhost:${PORT}"
