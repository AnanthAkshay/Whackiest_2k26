# Bedrock turn scorer

The non-mock scorer calls the Amazon Bedrock Converse API with the BEDROCK_MODEL_ID and AWS_REGION environment variables. It uses temperature 0, asks for JSON only, checks the response with Zod, and makes one fresh request if the response cannot be parsed into the required result.

Set BEDROCK_MODEL_ID to a Bedrock model ID that supports Converse in the selected region. If that model is available only through an inference profile, put the inference profile ID or ARN in BEDROCK_MODEL_ID instead of the base model ID. The profile must be usable in AWS_REGION; cross-region profiles can have their own supported-region rules.

The runtime role needs permission to invoke the selected inference target. Consult the [AWS Converse API guide](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html) and your chosen model's Bedrock availability details before deployment.

For local fixture output, run npm run eval:fixtures. With MOCK_MODE=1, it uses the local deterministic scorer. With MOCK_MODE=0 and AWS credentials, it calls the configured Bedrock target.
