# Deploy del frontend (S3 + CloudFront)

El sitio es un export estático (`output: "export"`), así que no necesita Node en
producción: se sube `out/` a S3 y CloudFront lo sirve en
**https://syncfit.jenilarper.dev**.

## Qué hay en este repo

- `.env.production` — API y WebSocket del backend real (`api.syncfit.jenilarper.dev`).
- `.github/workflows/deploy.yml` — build + `aws s3 sync` + invalidación de CloudFront.
- `scripts/deploy-aws.sh` — lo mismo desde tu máquina, con un perfil de AWS local.

## Opción A — GitHub Actions (recomendada)

Agrega estos secretos en **Settings → Secrets and variables → Actions**:

| Secreto | Valor |
|---|---|
| `AWS_ROLE_ARN` | rol de OIDC con permiso de `s3:*` en el bucket y `cloudfront:CreateInvalidation` |
| `AWS_S3_BUCKET` | bucket que sirve el sitio |
| `CLOUDFRONT_DISTRIBUTION_ID` | distribución de `syncfit.jenilarper.dev` |

Cada push a `main` (o el botón *Run workflow*) publica.

Si el rol es nuevo, su política de confianza debe aceptar el OIDC de GitHub
para `repo:Jenifrutica/syncfit-frontend:ref:refs/heads/main`, y su política de
permisos debe incluir:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["s3:ListBucket"], "Resource": "arn:aws:s3:::BUCKET" },
    { "Effect": "Allow", "Action": ["s3:PutObject", "s3:DeleteObject"], "Resource": "arn:aws:s3:::BUCKET/*" },
    { "Effect": "Allow", "Action": ["cloudfront:CreateInvalidation"], "Resource": "*" }
  ]
}
```

## Opción B — desde esta máquina

```bash
AWS_S3_BUCKET=<bucket> \
CLOUDFRONT_DISTRIBUTION_ID=<id> \
AWS_PROFILE=<perfil> \
./scripts/deploy-aws.sh
```

El script compila, sube primero el HTML con `max-age=0` (para que los cambios se
vean al instante), después los chunks de `/_next/static` como inmutables
(`max-age=31536000`) y al final invalida `/*` en CloudFront.

## Comprobación después de publicar

```bash
curl -s https://syncfit.jenilarper.dev/app/checkin/ | grep -o "Check-in de sensores"
curl -s https://api.syncfit.jenilarper.dev/api/v1/health
```
