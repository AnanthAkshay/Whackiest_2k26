# Viva Teach-Back — Infrastructure

AWS SAM deployment for the Viva Teach-Back backend and static web hosting.

## Architecture

```
CloudFront
├── /api/*          → API Gateway v2 → Lambda (per handler)
├── /health         → Lambda
└── /*              → S3 (Vite SPA)

DynamoDB
├── Sessions   (key: sessionId)
└── Credentials (key: pageId, GSI on sessionId)
```

## Prerequisites

| Tool | Version |
|---|---|
| [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) | ≥ 2.15 |
| [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) | ≥ 1.100 |
| Node.js | ≥ 20 |
| Docker (optional) | For DynamoDB Local tests |

Configure credentials with `aws configure` or environment variables. The
deploying principal needs permissions for CloudFormation, IAM, Lambda, API
Gateway, DynamoDB, S3, and CloudFront.

## Deploy commands (run in order)

```bash
# 1. Install dependencies (from repo root)
npm ci

# 2. Build the API (compiles TypeScript → api/dist)
npm run build --workspace api

# 3. Copy rubrics into the api package so Lambda can find them
cp -r rubrics api/rubrics

# 4. Build and deploy the SAM stack
cd infra
sam build --template template.yaml

sam deploy \
  --guided \
  --stack-name viva-teach-back \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    BedrockModelId=us.anthropic.claude-3-5-sonnet-20241022-v2:0 \
    ElevenLabsApiKey=YOUR_ELEVENLABS_KEY \
    ElevenLabsAgentId=YOUR_ELEVENLABS_AGENT_ID

# SAM will prompt for confirmation and save config to samconfig.toml.
# Subsequent deploys: sam build && sam deploy
```

> **Note:** `--guided` runs only the first time. After that, `sam deploy`
> reads from the saved `samconfig.toml`.

```bash
# 5. Capture outputs
STACK=viva-teach-back
WEB_BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK \
  --query "Stacks[0].Outputs[?OutputKey=='WebBucketName'].OutputValue" --output text)
CF_DIST_ID=$(aws cloudformation describe-stacks --stack-name $STACK \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text)
CF_URL=$(aws cloudformation describe-stacks --stack-name $STACK \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" --output text)
echo "Bucket: $WEB_BUCKET"
echo "CloudFront: $CF_URL"

# 6. Build the web app with the CloudFront URL as the API base
cd ..
VITE_API_URL=$CF_URL npm run build --workspace web

# 7. Upload the web app to S3
aws s3 sync web/dist "s3://$WEB_BUCKET" --delete

# 8. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id $CF_DIST_ID \
  --paths "/*"
```

The app is live at the CloudFront URL printed in step 5.

## Environment variables to set after deploy

The SAM template wires these automatically via the `Environment` block.
You only need them if running locally with `MOCK_MODE=0`:

| Variable | Source | Description |
|---|---|---|
| `MOCK_MODE` | `0` | Disable mock mode |
| `AWS_REGION` | Your deploy region | e.g. `ap-south-1` |
| `AWS_SESSIONS_TABLE` | Stack output `SessionsTableName` | DynamoDB Sessions table |
| `AWS_CREDENTIALS_TABLE` | Stack output `CredentialsTableName` | DynamoDB Credentials table |
| `BEDROCK_MODEL_ID` | Parameter | e.g. `us.anthropic.claude-3-5-sonnet-20241022-v2:0` |
| `ELEVENLABS_API_KEY` | Your ElevenLabs dashboard | Voice agent key |
| `ELEVENLABS_AGENT_ID` | Your ElevenLabs dashboard | Voice agent id |
| `CORS_ORIGIN` | Stack output `CloudFrontUrl` | Allowed CORS origin |
| `RUBRICS_DIR` | `/var/task/rubrics` (Lambda) | Path to rubrics folder |

## Bedrock model access

If the Bedrock model id refers to a cross-region inference profile
(e.g. `us.anthropic.claude-3-5-sonnet-20241022-v2:0`), enable it in the
Bedrock console under **Model access → Cross-region inference**. See
[`/docs/bedrock.md`](../docs/bedrock.md) for details.

## Running DynamoStore tests locally

```bash
# Start DynamoDB Local
docker run -d -p 8000:8000 amazon/dynamodb-local

# Run the DynamoStore tests
cd api
DYNAMODB_LOCAL_ENDPOINT=http://localhost:8000 npx tsx --test src/store/DynamoStore.test.ts
```

The test creates temporary tables, runs the same CRUD assertions as
`LocalFileStore.test.ts`, and cleans up.

## Tear down

```bash
# Empty the S3 bucket first (required before stack deletion)
aws s3 rm "s3://$WEB_BUCKET" --recursive

# Delete the stack
sam delete --stack-name viva-teach-back
```
