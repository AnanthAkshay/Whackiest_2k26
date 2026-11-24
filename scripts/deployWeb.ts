import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

interface StackOutput {
  OutputKey: string;
  OutputValue: string;
}

function runCommand(command: string): string {
  return execSync(command, { encoding: "utf8", stdio: ["inherit", "pipe", "pipe"] }).trim();
}

function getStackOutput(stackName: string, outputKey: string): string | undefined {
  try {
    const raw = runCommand(`aws cloudformation describe-stacks --stack-name ${stackName} --query "Stacks[0].Outputs" --output json`);
    const outputs = JSON.parse(raw) as StackOutput[];
    return outputs.find((o) => o.OutputKey === outputKey)?.OutputValue;
  } catch (error) {
    console.error(`Could not read output '${outputKey}' from stack '${stackName}'.`, error instanceof Error ? error.message : error);
    return undefined;
  }
}

async function main(): Promise<void> {
  const stackName = process.env.STACK_NAME || "viva-teach-back";
  const webDist = resolve(process.cwd(), "web", "dist");

  if (!existsSync(webDist)) {
    console.error(`Error: ${webDist} does not exist. Run 'npm run build --workspace web' first.`);
    process.exit(1);
  }

  console.log(`===============================================`);
  console.log(`  Deploying Web App to S3 + CloudFront        `);
  console.log(`===============================================`);
  console.log(`Stack name: ${stackName}`);

  const webBucket = process.env.WEB_BUCKET || getStackOutput(stackName, "WebBucketName");
  const cfDistId = process.env.CF_DIST_ID || getStackOutput(stackName, "CloudFrontDistributionId");
  const cfUrl = process.env.CF_URL || getStackOutput(stackName, "CloudFrontUrl");

  if (!webBucket) {
    console.error(`Error: Could not determine WebBucket. Provide WEB_BUCKET env var or ensure stack '${stackName}' exists.`);
    process.exit(1);
  }

  if (!cfDistId) {
    console.error(`Error: Could not determine CloudFrontDistributionId. Provide CF_DIST_ID env var or ensure stack '${stackName}' exists.`);
    process.exit(1);
  }

  console.log(`Target S3 Bucket: s3://${webBucket}`);
  console.log(`CloudFront ID   : ${cfDistId}`);
  if (cfUrl) console.log(`CloudFront URL  : ${cfUrl}`);

  // 1. Sync to S3
  console.log(`\n1. Syncing ${webDist} to s3://${webBucket}...`);
  execSync(`aws s3 sync "${webDist}" "s3://${webBucket}" --delete`, { stdio: "inherit" });
  console.log(`✓ S3 sync completed.`);

  // 2. Invalidate CloudFront
  console.log(`\n2. Creating CloudFront invalidation for /*...`);
  execSync(`aws cloudfront create-invalidation --distribution-id ${cfDistId} --paths "/*"`, { stdio: "inherit" });
  console.log(`✓ CloudFront invalidation created.`);

  console.log(`\n===============================================`);
  console.log(`  Web deployment complete!                     `);
  if (cfUrl) console.log(`  Live URL: ${cfUrl}`);
  console.log(`===============================================\n`);
}

void main();
