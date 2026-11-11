#!/usr/bin/env bash
# Publica el frontend (export estático) en S3 + CloudFront.
#
#   AWS_S3_BUCKET=syncfit-frontend \
#   CLOUDFRONT_DISTRIBUTION_ID=EXXXXXXXXXXXXX \
#   AWS_PROFILE=default \
#   ./scripts/deploy-aws.sh
#
# El sitio ya está configurado en `.env.production` (API y WebSocket en
# api.syncfit.jenilarper.dev), así que no hace falta pasar variables al build.
set -euo pipefail

: "${AWS_S3_BUCKET:?Falta AWS_S3_BUCKET}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Falta CLOUDFRONT_DISTRIBUTION_ID}"
AWS_PROFILE="${AWS_PROFILE:-default}"
export AWS_PROFILE

cd "$(dirname "$0")/.."

echo "==> Build (export estático)"
npm run build

test -f out/index.html || (echo "no se generó out/index.html" && exit 1)

echo "==> HTML y assets con revalidación"
aws s3 sync out/ "s3://${AWS_S3_BUCKET}" \
  --delete \
  --exclude "_next/static/*" \
  --cache-control "public,max-age=0,must-revalidate"

echo "==> Chunks inmutables (_next/static)"
aws s3 sync out/_next/static "s3://${AWS_S3_BUCKET}/_next/static" \
  --cache-control "public,max-age=31536000,immutable"

echo "==> Invalidar CloudFront"
aws cloudfront create-invalidation \
  --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
  --paths "/*" \
  --query 'Invalidation.Id' --output text

echo "==> Listo"
